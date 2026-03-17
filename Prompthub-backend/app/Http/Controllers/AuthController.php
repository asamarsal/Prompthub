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

    public function show($address)
    {
        $user = User::where('stx_address', $address)->firstOrFail();
        return response()->json($user);
    }

    public function update(Request $request)
    {
        $user = $request->user();
        
        $request->validate([
            'username' => 'nullable|string|min:3|max:30|unique:users,username,' . $user->id,
        ]);
        
        $user->update($request->only(['username', 'name', 'bio', 'avatar_url', 'cover_url', 'roles']));
        return response()->json($user);
    }
}
