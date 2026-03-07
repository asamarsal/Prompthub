<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'stx_address' => 'required|string',
        ]);

        $user = User::firstOrCreate(['stx_address' => $request->stx_address]);
        
        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user
        ]);
    }

    public function me(Request $request)
    {
        return response()->json($request->user());
    }

    public function update(Request $request)
    {
        $user = $request->user();
        $user->update($request->only(['name', 'bio', 'avatar_url', 'cover_url', 'roles']));
        return response()->json($user);
    }
}
