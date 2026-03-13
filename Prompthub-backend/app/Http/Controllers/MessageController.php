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
            ->orderBy('created_at', 'desc')
            ->get();
            
        // Group by conversation
        $conversations = [];
        foreach ($messages as $msg) {
            $other = $msg->sender_address === $address ? $msg->receiver_address : $msg->sender_address;
            if (!isset($conversations[$other])) {
                $conversations[$other] = $msg;
            }
        }
        
        return response()->json(array_values($conversations));
    }

    public function history(Request $request, $otherAddress)
    {
        $address = $request->user()->stx_address ?? 'SP_MOCK';
        $messages = Message::where(function($q) use ($address, $otherAddress) {
                $q->where('sender_address', $address)->where('receiver_address', $otherAddress);
            })->orWhere(function($q) use ($address, $otherAddress) {
                $q->where('sender_address', $otherAddress)->where('receiver_address', $address);
            })->oldest()->get();
            
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
        
        $sender_address = $request->user()->stx_address ?? 'SP_MOCK';
        $receiver_address = $validated['receiver_address'];

        // Check connection
        $connectionExists = \App\Models\Connection::where(function($q) use ($sender_address, $receiver_address) {
            $q->where('requester_address', $sender_address)
              ->where('recipient_address', $receiver_address);
        })->orWhere(function($q) use ($sender_address, $receiver_address) {
            $q->where('requester_address', $receiver_address)
              ->where('recipient_address', $sender_address);
        })->where('status', 'accepted')->exists();

        if (!$connectionExists && $sender_address !== $receiver_address) {
            return response()->json(['message' => 'You must be friends to send a message.'], 403);
        }

        $validated['sender_address'] = $sender_address;
        
        $message = Message::create($validated);
        broadcast(new \App\Events\MessageSent($message));
        return response()->json($message, 201);
    }
}
