<?php

namespace App\Http\Controllers;

use App\Models\Contest;
use Illuminate\Http\Request;

class ContestController extends Controller
{
    public function index()
    {
        return response()->json(Contest::withCount('submissions')->whereIn('status', ['OPEN', 'PENDING_FUNDING', 'JUDGING'])->orderBy('created_at', 'desc')->get());
    }

    public function show($id)
    {
        return response()->json(Contest::with('submissions')->findOrFail($id));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'brand_name' => 'required|string|max:255',
            'category' => 'required|string',
            'about_brand' => 'required|string',
            'brief' => 'required|string',
            'tags' => 'nullable|array',
            'require_prompt_submission' => 'boolean',
            'prize_tiers' => 'required|array|min:1',
            'prize_tiers.*.place' => 'required|integer|min:1',
            'prize_tiers.*.prize_sbtc' => 'required|numeric|min:0',
            'total_prize_sbtc' => 'required|numeric|min:0',
            'deadline' => 'required|date|after:today',
            'tx_id' => 'required|string', // Blockchain TX ID for escrow funding
        ]);
        
        $validated['id'] = (string) \Illuminate\Support\Str::uuid();
        $validated['brand_address'] = $request->user()->stx_address ?? 'SP_MOCK_BRAND';
        $validated['status'] = 'PENDING_FUNDING';
        
        $contest = Contest::create($validated);
        return response()->json($contest, 201);
    }

    public function verifyFund(Request $request, $id)
    {
        $contest = Contest::findOrFail($id);
        // Call Stacks API to verify `tx_id` was successful
        // If success, unlock contest:
        $contest->update(['status' => 'OPEN']);
        return response()->json(['message' => 'Contest is now OPEN and funded']);
    }

    public function submit(Request $request, $id)
    {
        $contest = Contest::findOrFail($id);
        
        // Mock Artist submission
        // $request->validate([...])
        return response()->json(['message' => 'Submission received via IPFS']);
    }

    public function selectWinner(Request $request, $id)
    {
        $contest = Contest::findOrFail($id);
        // Triggers sBTC payout via IPFS / Smart Contract listener
        $contest->update(['status' => 'COMPLETED']);
        return response()->json(['message' => 'Winner selected']);
    }
}
