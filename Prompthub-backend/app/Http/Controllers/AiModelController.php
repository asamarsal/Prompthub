<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class AiModelController extends Controller
{
    public function index()
    {
        return response()->json(\App\Models\AiModel::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'slug' => 'required|string|max:255|unique:ai_models',
            'description' => 'nullable|string',
        ]);

        $aiModel = \App\Models\AiModel::create($request->only('name', 'slug', 'description'));

        return response()->json($aiModel, 201);
    }
}
