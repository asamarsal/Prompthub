<?php

namespace App\Http\Controllers;

use App\Models\Contest;
use Illuminate\Http\Request;

class ContestController extends Controller
{
    public function index()
    {
        return response()->json(Contest::where('status', 'OPEN')->get());
    }

    public function show($id)
    {
        return response()->json(Contest::with('submissions')->findOrFail($id));
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'brief' => 'required|string',
            'prize_sbtc' => 'nullable|numeric',
            'deadline' => 'nullable|date',
            'tx_id' => 'required|string', // Blockchain TX ID for funding
        ]);
        
        $validated['brand_address'] = $request->user()->stx_address ?? 'SP_MOCK_BRAND';
        $validated['status'] = 'PENDING_FUNDING'; // Wait for Stacks confirmation
        
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
