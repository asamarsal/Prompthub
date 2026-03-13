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
                     ->orWhere('stx_address', $query)
                     ->select('id', 'name', 'stx_address', 'avatar_url')
                     ->limit(10)
                     ->get();

        return response()->json($users);
    }
}
