<?php

namespace App\Http\Controllers;

use App\Models\Message;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function index(Request $request)
    {
        $address = $request->user()->stx_address ?? 'SP_MOCK';
        $messages = Message::where('sender_address', $address)
            ->orWhere('receiver_address', $address)
            ->latest()
            ->get();
        return response()->json($messages);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'receiver_address' => 'required|string',
            'hire_request_id' => 'nullable|uuid',
            'content' => 'required|string',
            'attachment_url' => 'nullable|string',
        ]);
        
        $validated['sender_address'] = $request->user()->stx_address ?? 'SP_MOCK';
        
        $message = Message::create($validated);
        // In full flow: broadcast(new MessageSent($message)); for WebSockets
        return response()->json($message, 201);
    }
}
