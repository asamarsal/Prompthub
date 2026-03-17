<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use App\Models\Prompt;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;

class X402Middleware
{
    /**
     * Handle an incoming request.
     * Implements x402 protocol v2 for STX payment gating on premium prompt content.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $promptId = $request->route('id');
        $prompt   = Prompt::with('user')->findOrFail($promptId);
        $user     = Auth::user();

        // The STX address of the prompt owner (payTo)
        $ownerAddress = $prompt->user?->stx_address ?? config('app.platform_treasury_address', 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM');

        // Required amount: prompt price in microSTX (1 STX = 1,000,000 µSTX)
        $requiredMicroStx = (int) ($prompt->price_stx * 1_000_000);

        // 1. Check ownership via transactions table (if user already purchased)
        if ($user) {
            $alreadyOwned = \App\Models\Transaction::where('prompt_id', $promptId)
                ->where('buyer_address', $user->stx_address)
                ->exists();

            if ($alreadyOwned) {
                return $next($request);
            }
        }

        // 2. Check for x402 Payment Signature header
        $txId = $request->header('X-Payment') ?? $request->header('payment-signature');

        if ($txId) {
            // Prevent double-spend: each txId can only unlock content once
            $cacheKey = "x402_used_tx:{$txId}";
            if (Cache::has($cacheKey)) {
                return response()->json([
                    'message' => 'Transaction already used.',
                    'error'   => 'x402_tx_already_used',
                ], 402);
            }

            // Verify on-chain via Hiro Stacks API
            $network  = config('stacks.network', 'testnet'); // 'mainnet' or 'testnet'
            $hiro     = $network === 'mainnet'
                ? 'https://api.hiro.so'
                : 'https://api.testnet.hiro.so';

            try {
                $txRes = Http::timeout(10)->get("{$hiro}/extended/v1/tx/{$txId}");

                if ($txRes->successful()) {
                    $tx = $txRes->json();

                    $isConfirmed  = ($tx['tx_status'] ?? '') === 'success';
                    $isStxTransfer = ($tx['tx_type'] ?? '') === 'token_transfer';
                    $recipient    = $tx['token_transfer']['recipient_address'] ?? '';
                    $amount       = (int) ($tx['token_transfer']['amount'] ?? 0);
                    $senderMatch  = true; // optional extra check: ($tx['sender_address'] ?? '') === $user?->stx_address

                    if ($isConfirmed && $isStxTransfer && $recipient === $ownerAddress && $amount >= $requiredMicroStx) {
                        // Mark this tx as used (cache for 30 days)
                        Cache::put($cacheKey, true, now()->addDays(30));

                        // Optionally record in transactions table for future ownership checks
                        if ($user) {
                            \App\Models\Transaction::firstOrCreate(
                                ['tx_id' => $txId],
                                [
                                    'buyer_address' => $user->stx_address,
                                    'prompt_id'     => $promptId,
                                    'amount_paid'   => $amount / 1_000_000,
                                    'currency'      => 'STX',
                                ]
                            );
                        }

                        return $next($request);
                    }
                }
            } catch (\Exception $e) {
                // Hiro API unreachable — fail open with 402 (don't block forever)
                \Log::warning('x402: Hiro API check failed: ' . $e->getMessage());
            }
        }

        // 3. No valid payment — return HTTP 402 with x402 v2 payload
        $paymentData = [
            'x402Version'        => 2,
            'paymentRequirements' => [
                'amount'  => (string) $requiredMicroStx,
                'asset'   => 'STX',
                'payTo'   => $ownerAddress,
                'network' => 'stacks:2147483648', // 2147483648 = Stacks testnet chain ID
            ],
        ];

        $encodedData = base64_encode(json_encode($paymentData));

        return response()->json([
            'message' => 'Payment Required',
            'error'   => 'x402_payment_required',
        ], 402, [
            'payment-required'          => $encodedData,
            'Access-Control-Expose-Headers' => 'payment-required',
        ]);
    }
}
