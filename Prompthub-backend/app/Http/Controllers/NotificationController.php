<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $address = $request->user()->stx_address ?? 'SP_MOCK';
        $notifications = Notification::where('user_address', $address)->latest()->get();
        return response()->json($notifications);
    }

    public function markAsRead(Request $request)
    {
        $address = $request->user()->stx_address ?? 'SP_MOCK';
        Notification::where('user_address', $address)
            ->where('is_read', false)
            ->update(['is_read' => true]);
        return response()->json(['message' => 'Notifications marked as read']);
    }
}
