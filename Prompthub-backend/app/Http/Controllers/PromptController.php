<?php

namespace App\Http\Controllers;

use App\Models\Prompt;
use Illuminate\Http\Request;

class PromptController extends Controller
{
    public function index(Request $request)
    {
        $query = Prompt::where('is_published', true);

        // Filter by category
        if ($request->has('category')) {
            $query->where('category', $request->category);
        }

        // Filter by AI model
        if ($request->has('model')) {
            $query->where('ai_model', $request->model);
        }

        // Filter by Content Type
        if ($request->has('type')) {
            $query->where('content_type', strtoupper($request->type));
        }

        // Filter NSFW
        if ($request->has('nsfw')) {
            $isNsfw = filter_var($request->nsfw, FILTER_VALIDATE_BOOLEAN);
            $query->where('is_nsfw', $isNsfw);
        } else {
            // Default hide NSFW if not explicitly requested
            $query->where('is_nsfw', false);
        }

        // Filter License Type
        if ($request->has('license')) {
            $query->where('license_type', strtoupper($request->license));
        }

        // Global Search (Title, Description, Tags)
        if ($request->has('search') && !empty($request->search)) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                // ILIKE in Postgres, LIKE in MySQL/SQLite. Laravel handles LIKE gracefully.
                $q->where('title', 'LIKE', "%{$search}%")
                  ->orWhere('description', 'LIKE', "%{$search}%")
                  // JSON unquoted search if database supports it. Simple LIKE works for tags string fallback
                  ->orWhere('tags', 'LIKE', "%{$search}%");
                
                // Note: To search by creator name, we need to join the users table 
                // $q->orWhereHas('user', function($userQuery) use ($search) { return $userQuery->where('name', 'LIKE', "%{$search}%"); });
            });
        }

        // Sorting
        $sort = $request->get('sort', 'newest');
        switch ($sort) {
            case 'oldest':
                $query->orderBy('created_at', 'asc');
                break;
            case 'popular':
                $query->orderBy('total_sold', 'desc');
                break;
            case 'price_asc':
                $query->orderBy('price_stx', 'asc');
                break;
            case 'price_desc':
                $query->orderBy('price_stx', 'desc');
                break;
            case 'newest':
            default:
                $query->orderBy('created_at', 'desc');
                break;
        }

        return response()->json($query->paginate(15));
    }

    public function show($id)
    {
        return response()->json(Prompt::findOrFail($id));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'price_stx' => 'required|numeric|min:0',
            'preview_image_url' => 'nullable|string|url',
            'cid_ipfs' => 'required|string',
            'ai_model' => 'nullable|string',
            'category' => 'nullable|string',
            'tags' => 'nullable|array',
            'content_type' => 'required|string|in:TEXT,IMAGE,VIDEO,AUDIO,CODE',
            'is_nsfw' => 'boolean',
            'license_type' => 'required|string|in:FREE,COMMERCIAL,EXCLUSIVE',
            'royalty_percentage' => 'nullable|integer|min:0|max:100',
        ]);
        
        $validated['id'] = (string) \Illuminate\Support\Str::uuid();
        $validated['user_id'] = $request->user()->id ?? 'MockUser'; // Mock for now until auth is fully implemented
        $validated['is_published'] = true;
        
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

    public function curate(Request $request, $id) 
    {
        // Require Admin validation here in future
        $validated = $request->validate([
            'is_curated' => 'required|boolean'
        ]);

        $prompt = Prompt::findOrFail($id);
        $prompt->update(['is_curated' => $validated['is_curated']]);
        
        return response()->json($prompt);
    }

    public function getContent($id)
    {
        $prompt = Prompt::findOrFail($id);
        return response()->json([
            'id' => $prompt->id,
            'original_content' => $prompt->original_content ?? 'This is the premium prompt content protected by x402.'
        ]);
    }
}
