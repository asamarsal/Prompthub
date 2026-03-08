<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

use App\Models\Prompt;
use Illuminate\Support\Facades\Auth;

class X402Middleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $promptId = $request->route('id');
        $prompt = Prompt::findOrFail($promptId);
        $user = Auth::user();

        // 1. Check if user already owns it (manual check for now)
        // In real app, check 'ownerships' or 'transactions' table
        $hasPaid = false; 
        
        if ($user) {
            // Logic to check purchase history
            // $hasPaid = $user->purchases()->where('prompt_id', $promptId)->exists();
        }

        // 2. Check for x402 Payment Signature
        if ($request->hasHeader('payment-signature')) {
            // Mocking verification: In a real implementation, 
            // you would verify the transaction hash on-chain.
            $hasPaid = true; 
        }

        if ($hasPaid) {
            return $next($request);
        }

        // 3. Trigger 402 Payment Required
        $paymentData = [
            'x402Version' => 2,
            'paymentRequirements' => [
                'amount' => (string) ($prompt->price_stx * 1000000), // Convert to microSTX
                'asset' => 'STX',
                'payTo' => 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM', // Mock owner address
                'network' => 'stacks:2147483648' // Testnet
            ]
        ];

        $encodedData = base64_encode(json_encode($paymentData));

        return response()->json([
            'message' => 'Payment Required',
            'error' => 'x402_payment_required'
        ], 402, [
            'payment-required' => $encodedData,
            'Access-Control-Expose-Headers' => 'payment-required'
        ]);
    }
}
