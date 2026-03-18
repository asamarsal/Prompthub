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
            ->select('id', 'name', 'username', 'stx_address', 'avatar_url', 'cover_url', 'bio', 'is_available_for_freelance', 'hourly_rate', 'hourly_rate_currency', 'roles')
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
                    'specialties' => ['Prompt Engineering'], // Default placeholder
                    'tools' => ['Midjourney v6', 'DALL-E 3'], // Default placeholder
                    'rating' => 5.0,
                    'reviews' => rand(10, 100),
                    'hourlyRate' => $artist->hourly_rate ? (float)$artist->hourly_rate : 0.002,
                    'currency' => $artist->hourly_rate_currency ?: 'sBTC',
                    'portfolio' => [
                        [
                            'image' => $artist->cover_url ?: 'https://images.unsplash.com/photo-1620061546252-78d12ee9ae89?q=80&w=2564&auto=format&fit=crop',
                            'title' => 'Showcase'
                        ]
                    ]
                ];
            });

        return response()->json($artists);
    }
}
