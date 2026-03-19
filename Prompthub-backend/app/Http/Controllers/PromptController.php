<?php

namespace App\Http\Controllers;

use App\Models\Prompt;
use Illuminate\Http\Request;

class PromptController extends Controller
{
    public function index(Request $request)
    {
        $query = Prompt::with('user')->where('is_published', true);

        if ($user = auth('sanctum')->user()) {
            $query->withExists(['bookmarkedBy as is_bookmarked' => function($q) use ($user) {
                $q->where('user_id', $user->id);
            }]);
        }

        // Filter by user address (for Portfolio)
        if ($request->has('user_address')) {
            $query->whereHas('user', function($q) use ($request) {
                $q->where('stx_address', $request->user_address);
            });
        }

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

        // Filter NSFW: If not explicitly requesting NSFW, only show non-NSFW content.
        // If nsfw=true is passed, we show everything (NSFW and non-NSFW).
        $isNsfwRequested = filter_var($request->query('nsfw', false), FILTER_VALIDATE_BOOLEAN);
        if (!$isNsfwRequested) {
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
                $query->orderBy('price_sbtc', 'asc');
                break;
            case 'price_desc':
                $query->orderBy('price_sbtc', 'desc');
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
        $query = Prompt::with('user');

        if ($user = auth('sanctum')->user()) {
            $query->withExists(['bookmarkedBy as is_bookmarked' => function($q) use ($user) {
                $q->where('user_id', $user->id);
            }]);
        }

        return response()->json($query->findOrFail($id));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'price_sbtc' => 'required|numeric|min:0',
            'preview_image_url' => 'nullable|string',
            'cid_ipfs' => 'required|string',
            'ai_model' => 'nullable|string',
            'category' => 'nullable|string',
            'tags' => 'nullable|array',
            'content_type' => 'required|string|in:TEXT,IMAGE,VIDEO,AUDIO,CODE',
            'is_nsfw' => 'boolean',
            'license_type' => 'required|string|in:FREE,COMMERCIAL,EXCLUSIVE',
            'royalty_percentage' => 'nullable|integer|min:0|max:100',
            'stacks_tx_id' => 'nullable|string',
            'currency' => 'nullable|string|in:STX,sBTC',
            'additional_info' => 'nullable|array',
            'original_content' => 'nullable|string',
        ]);
        
        $validated['id'] = (string) \Illuminate\Support\Str::uuid();
        $validated['user_id'] = $request->user()->id ?? \App\Models\User::first()?->id;
        $validated['is_published'] = true;
        
        $prompt = Prompt::create($validated);
        
        // Trigger background sync to fetch the contract_id after broadcasting
        try {
            \Illuminate\Support\Facades\Artisan::call('app:sync-prompt-ids');
        } catch (\Exception $e) {
            \Log::error("Failed to auto-sync prompt IDs: " . $e->getMessage());
        }

        return response()->json($prompt, 201);
    }

    public function verifyPurchase(Request $request, $id)
    {
        $request->validate([
            'tx_id' => 'required|string',
        ]);

        $prompt = Prompt::findOrFail($id);
        $txId = $request->tx_id;
        if (!str_starts_with($txId, '0x')) {
            $txId = '0x' . $txId;
        }

        $network = env('STACKS_NETWORK', 'testnet');
        $baseUrl = $network === 'mainnet' ? 'https://api.hiro.so' : 'https://api.testnet.hiro.so';

        try {
            $response = \Illuminate\Support\Facades\Http::get("{$baseUrl}/extended/v1/tx/{$txId}");

            if ($response->successful()) {
                $txData = $response->json();

                // Optimistic: Allow 'pending' or 'success'
                $isSuccessful = $txData['tx_status'] === 'success' || $txData['tx_status'] === 'pending';
                
                if ($isSuccessful && $txData['tx_type'] === 'contract_call') {
                    // Extract amount for logging/verification if available
                    $extractedAmount = 0;
                    if (isset($txData['contract_call']['function_args'])) {
                        $extractedAmount = $this->extractAmount($txData['contract_call']['function_args']);
                    }

                    // Record in transactions table
                    \App\Models\Transaction::updateOrCreate(
                        ['tx_id' => $request->tx_id],
                        [
                            'buyer_address' => $txData['sender_address'],
                            'prompt_id' => $prompt->id,
                            'amount_paid' => $extractedAmount ?: $prompt->price_sbtc,
                            'currency' => $prompt->currency ?? 'STX',
                        ]
                    );

                    return response()->json([
                        'message' => 'Purchase Verified (Optimistic) and Recorded',
                        'tx_status' => $txData['tx_status'],
                        'prompt_id' => $prompt->id,
                        'original_content' => $prompt->original_content ?? 'Sample prompt content for demonstration.'
                    ]);
                }
                
                \Log::warning("Purchase verification failed for TX: {$txId}. Status: " . ($txData['tx_status'] ?? 'unknown'));
                return response()->json([
                    'message' => 'Transaction not successful on-chain', 
                    'status' => $txData['tx_status'] ?? 'unknown'
                ], 400);
            }

            if ($response->status() === 404) {
                 \Log::info("TX {$txId} not found in Hiro API yet (Propagating...)");
                 return response()->json(['message' => 'Transaction propagating on Stacks network. Please wait a few moments and try refreshing.'], 202);
            }

            \Log::error("Hiro API error for TX: {$txId}. Status Code: " . $response->status());
            return response()->json(['message' => 'Transaction verification error (Hiro API: ' . $response->status() . ')'], 502);
        } catch (\Exception $e) {
            \Log::error("Exception in verifyPurchase: " . $e->getMessage());
            return response()->json(['message' => 'Internal verification error: ' . $e->getMessage()], 500);
        }
    }

    private function extractAmount($args)
    {
        // Simple extraction for STX amount from contract call args
        // Depending on Hiro API format, this might need more robust parsing
        foreach ($args as $arg) {
            if (isset($arg['name']) && $arg['name'] === 'amount') {
                return (int)($arg['repr'] ?? 0) / 1000000; // Micro-STX to STX
            }
        }
        return 0;
    }

    public function curate($id, Request $request)
    {
        // Require Admin validation here in future
        $validated = $request->validate([
            'is_curated' => 'required|boolean'
        ]);

        $prompt = Prompt::findOrFail($id);
        $prompt->update(['is_curated' => $validated['is_curated']]);
        
        return response()->json($prompt);
    }

    public function purchased(Request $request)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        $purchasedPromptIds = \App\Models\Transaction::where('buyer_address', $user->stx_address)
            ->pluck('prompt_id');

        $prompts = Prompt::with('user')
            ->whereIn('id', $purchasedPromptIds)
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($prompts);
    }

    public function getContent($id)
    {
        $prompt = Prompt::findOrFail($id);
        $user = auth('sanctum')->user();

        // Check ownership or purchase
        $isOwner = $user && $user->id === $prompt->user_id;
        $hasPurchased = false;
        if ($user && !$isOwner) {
            $hasPurchased = \App\Models\Transaction::where('prompt_id', $prompt->id)
                ->where('buyer_address', $user->stx_address)
                ->exists();
        }

        if (!$isOwner && !$hasPurchased) {
            return response()->json(['message' => 'Payment Required', 'x402' => true], 402);
        }

        return response()->json([
            'id' => $prompt->id,
            'original_content' => $prompt->original_content ?? 'This is the premium prompt content protected by purchase verification.'
        ]);
    }
}
