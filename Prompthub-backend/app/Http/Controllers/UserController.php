<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

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
        // Query users who have "artist" in their roles json array
        $artists = User::whereJsonContains('roles', 'artist')
            ->select('id', 'name', 'username', 'stx_address', 'avatar_url', 'cover_url', 'bio', 'is_available_for_freelance', 'hourly_rate', 'hourly_rate_currency', 'roles', 'rating_avg', 'rating_count', 'specialization_id')
            ->get()
            ->map(function ($artist) {
                // Map to frontend expected shape for Hire page
                return [
                    'id' => $artist->stx_address, // Use stx_address as ID for routing
                    'name' => $artist->name ?? $artist->username ?? 'Anonymous Artist',
                    'handle' => $artist->username ?? substr($artist->stx_address, 0, 8),
                    'bio' => $artist->bio ?? 'No bio provided.',
                    'avatar' => $artist->avatar_url,
                    'available' => (bool)$artist->is_available_for_freelance,
                    'verified' => true,
                    'specialties' => (function() use ($artist) {
                        $map = [
                            1 => 'Brand Identity',
                            2 => 'Product Photography',
                            3 => 'Ad Creative',
                            4 => 'Video / Motion',
                            5 => 'Character Design',
                            6 => '3D Render',
                            7 => 'NFT Collection',
                            8 => 'Social Media Pack',
                        ];
                        $specs = is_array($artist->specialization_id) ? $artist->specialization_id : json_decode($artist->specialization_id, true) ?? [];
                        $mapped = array_filter(array_map(fn($id) => $map[$id] ?? null, $specs));
                        return !empty($mapped) ? array_values($mapped) : ['AI Artist'];
                    })(),
                    'tools' => ['Midjourney v6', 'DALL-E 3'], // Default placeholder
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
}
