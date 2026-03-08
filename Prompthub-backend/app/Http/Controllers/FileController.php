<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;

class FileController extends Controller
{
    public function uploadToIpfs(Request $request) 
    {
        // renaming since we are pivotting to local storage but keeping route
        return $this->uploadLocal($request);
    }

    public function uploadLocal(Request $request)
    {
        $request->validate([
            'file' => 'required|image|max:10240', // 10MB max
            'type' => 'required|string|in:avatar,cover',
        ]);

        $user = $request->user();
        $type = $request->input('type');
        $file = $request->file('file');

        // 1. Prepare Paths: profile > uuid > avatars/covers
        $folder = ($type === 'avatar') ? 'avatars' : 'covers';
        $userUuid = $user->id;
        $extension = $file->getClientOriginalExtension();
        $fileName = time() . '.' . $extension;
        $path = "profile/{$userUuid}/{$folder}";

        // 2. Cleanup Old File in the same sub-folder
        $oldUrl = ($type === 'avatar') ? $user->avatar_url : $user->cover_url;
        if ($oldUrl && str_contains($oldUrl, '/storage/profile/')) {
            $oldPath = str_replace(url('/storage/'), '', $oldUrl);
            \Illuminate\Support\Facades\Storage::disk('public')->delete($oldPath);
        }

        try {
            // 3. Store New File
            $storedPath = $file->storeAs($path, $fileName, 'public');
            $url = asset('storage/' . $storedPath);

            // 4. Persist to Database
            if ($type === 'avatar') {
                $user->update(['avatar_url' => $url]);
            } else {
                $user->update(['cover_url' => $url]);
            }

            return response()->json([
                'url' => $url,
                'user' => $user->fresh()
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Local upload error',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
