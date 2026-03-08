<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\Category::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:categories',
            'description' => 'nullable|string',
            'type' => 'required|string|in:CURATED,COMMUNITY',
        ]);

        $category = \App\Models\Category::create($request->only('name', 'slug', 'description', 'type'));

        return response()->json($category, 201);
    }
}
