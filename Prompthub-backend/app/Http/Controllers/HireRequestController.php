<?php

namespace App\Http\Controllers;

use App\Models\HireRequest;
use Illuminate\Http\Request;

class HireRequestController extends Controller
{
    public function index(Request $request)
    {
        $address = $request->user()->stx_address ?? 'SP_MOCK';
        $requests = HireRequest::where('client_address', $address)
            ->orWhere('artist_address', $address)
            ->get();
        return response()->json($requests);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'artist_address' => 'required|string',
            'project_brief' => 'required|string',
            'budget_sbtc' => 'nullable|numeric',
            'tx_id' => 'required|string', // Escrow funding TX ID
        ]);
        
        $validated['client_address'] = $request->user()->stx_address ?? 'SP_MOCK';
        $validated['status'] = 'PENDING_FUNDING'; // Requires Stacks block confirmation
        
        $hire = HireRequest::create($validated);
        return response()->json($hire, 201);
    }

    public function verifyEscrow(Request $request, $id)
    {
        $hire = HireRequest::findOrFail($id);
        // Verify via Stacks API that smart contract received funds
        $hire->update(['status' => 'IN_PROGRESS']); 
        return response()->json(['message' => 'Escrow verified. Job in progress.']);
    }

    public function updateStatus(Request $request, $id)
    {
        $hire = HireRequest::findOrFail($id);
        $hire->update(['status' => $request->status]);
        return response()->json($hire);
    }
}
