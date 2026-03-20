<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Prompt;
use App\Models\Transaction;
use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class UserController extends Controller
{
    public function search(Request $request)
    {
        $query = $request->input('q');

        if (!$query) {
            return response()->json([]);
        }

        $users = User::where('name', 'like', "%{$query}%")
                     ->orWhere('username', 'like', "%{$query}%")
                     ->orWhere('stx_address', $query)
                     ->select('id', 'name', 'username', 'stx_address', 'avatar_url')
                     ->limit(10)
                     ->get();

        return response()->json($users);
    }

    public function artists(Request $request)
    {
        $artists = User::whereJsonContains('roles', 'artist')
            ->select('id', 'name', 'username', 'stx_address', 'avatar_url', 'cover_url', 'bio', 'is_available_for_freelance', 'hourly_rate', 'hourly_rate_currency', 'roles', 'rating_avg', 'rating_count', 'specialization_id')
            ->get()
            ->map(function ($artist) {
                return [
                    'id' => $artist->stx_address,
                    'name' => $artist->name ?? $artist->username ?? 'Anonymous Artist',
                    'handle' => $artist->username ?? substr($artist->stx_address, 0, 8),
                    'bio' => $artist->bio ?? 'No bio provided.',
                    'avatar' => $artist->avatar_url,
                    'available' => (bool)$artist->is_available_for_freelance,
                    'verified' => true,
                    'specialties' => $artist->getMappedSpecialties(),
                    'tools' => $artist->getMappedTools(),
                    'rating' => $artist->rating_avg ? (float)$artist->rating_avg : 0,
                    'reviews' => $artist->rating_count ? (int)$artist->rating_count : 0,
                    'hourlyRate' => $artist->hourly_rate ? (float)$artist->hourly_rate : 0.002,
                    'currency' => $artist->hourly_rate_currency ?: 'sBTC',
                    'portfolio' => [
                        [
                            'image' => $artist->cover_url ?: '/icon/default-coverimage.png',
                            'title' => 'Showcase',
                        ]
                    ]
                ];
            });

        return response()->json($artists);
    }

    /**
     * GET /api/users/{address}/profile
     * Returns a public user profile with aggregated stats and follow status.
     * Supports lookup by stx_address, username, or name.
     */
    public function publicProfile(Request $request, $address)
    {
        // Try stx_address first, then username, then name (for URL-based routing)
        $user = User::where('stx_address', $address)
            ->orWhere('username', $address)
            ->orWhere('name', $address)
            ->firstOrFail();

        $authUser = auth('sanctum')->user();

        $promptIds = Prompt::where('user_id', $user->id)->pluck('id');

        $promptsCount = Prompt::where('user_id', $user->id)->where('is_published', true)->count();
        $totalSales = Transaction::whereIn('prompt_id', $promptIds)->count();
        $totalRevenue = Transaction::whereIn('prompt_id', $promptIds)->sum('amount_paid');
        $avgRating = Review::whereIn('prompt_id', $promptIds)->avg('rating') ?: 0;
        $reviewsCount = Review::whereIn('prompt_id', $promptIds)->count();

        $followerCount = DB::table('follows')
            ->where('following_address', $user->stx_address)
            ->count();

        $followingCount = DB::table('follows')
            ->where('follower_address', $user->stx_address)
            ->count();

        $isFollowing = false;
        if ($authUser) {
            $isFollowing = DB::table('follows')
                ->where('follower_address', $authUser->stx_address)
                ->where('following_address', $user->stx_address)
                ->exists();
        }

        return response()->json([
            'stx_address' => $user->stx_address,
            'name' => $user->name,
            'username' => $user->username,
            'bio' => $user->bio,
            'avatar_url' => $user->avatar_url,
            'cover_url' => $user->cover_url,
            'roles' => $user->roles,
            'joined_at' => $user->created_at?->format('F Y'),
            'stats' => [
                'prompts_count' => $promptsCount,
                'total_sales' => $totalSales,
                'total_revenue' => (float)$totalRevenue,
                'avg_rating' => round($avgRating, 1),
                'reviews_count' => $reviewsCount,
                'follower_count' => $followerCount,
                'following_count' => $followingCount,
            ],
            'is_following' => $isFollowing,
        ]);
    }

    /**
     * POST /api/users/{address}/follow
     * Toggle follow/unfollow for the given user address.
     */
    public function toggleFollow(Request $request, $address)
    {
        $authUser = $request->user();

        if ($authUser->stx_address === $address) {
            return response()->json(['message' => 'You cannot follow yourself.'], 400);
        }

        // Verify target user exists
        User::where('stx_address', $address)->firstOrFail();

        $existing = DB::table('follows')
            ->where('follower_address', $authUser->stx_address)
            ->where('following_address', $address)
            ->first();

        if ($existing) {
            DB::table('follows')
                ->where('follower_address', $authUser->stx_address)
                ->where('following_address', $address)
                ->delete();

            $followerCount = DB::table('follows')->where('following_address', $address)->count();

            return response()->json([
                'is_following' => false,
                'follower_count' => $followerCount,
                'message' => 'Unfollowed successfully.',
            ]);
        }

        DB::table('follows')->insert([
            'follower_address' => $authUser->stx_address,
            'following_address' => $address,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $followerCount = DB::table('follows')->where('following_address', $address)->count();

        return response()->json([
            'is_following' => true,
            'follower_count' => $followerCount,
            'message' => 'Followed successfully.',
        ]);
    }
}
