<?php

namespace App\Http\Controllers;

use App\Models\Prompt;
use Illuminate\Http\Request;

class PromptController extends Controller
{
    public function index()
    {
        return response()->json(Prompt::where('is_published', true)->paginate(15));
    }

    public function show($id)
    {
        return response()->json(Prompt::findOrFail($id));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'description' => 'required|string',
            'price_stx' => 'nullable|numeric',
            'price_sbtc' => 'nullable|numeric',
            'cid_ipfs' => 'nullable|string',
            'preview_image_url' => 'nullable|string',
            'ai_model' => 'nullable|string',
            'category' => 'nullable|string',
        ]);
        
        // Normally associated with authenticated user
        $validated['creator_address'] = $request->user()->stx_address ?? 'SP_MOCK';
        
        $prompt = Prompt::create($validated);
        return response()->json($prompt, 201);
    }

    public function verifyPurchase(Request $request, $id)
    {
        // Mock verification
        // 1. Verify blockchain tx_id
        // 2. Insert into transactions table
        // 3. Return IPFS ciphertext decryption config
        return response()->json([
            'message' => 'Purchase Verified',
            'decrypted_content' => 'Example decoded string from IPFS Pinata'
        ]);
    }
}
