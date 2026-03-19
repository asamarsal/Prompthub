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
        $ownerAddress = $prompt->user?->stx_address ?? config('stacks.marketplace_contract_address', 'STKA3TNQ6GTB41XN057X1VK6RF11JZZTJ1BXBJT4');

        // Required amount: prompt price in microSTX (1 STX = 1,000,000 µSTX)
        $requiredMicroStx = (int) ($prompt->price_sbtc * 1_000_000);

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
                    $txType       = $tx['tx_type'] ?? '';
                    $isValidPayment = false;
                    $amount = 0;

                    if ($isConfirmed) {
                        // Case 1: Direct STX Transfer
                        if ($txType === 'token_transfer') {
                            $recipient = $tx['token_transfer']['recipient_address'] ?? '';
                            $amount = (int) ($tx['token_transfer']['amount'] ?? 0);
                            if ($recipient === $ownerAddress && $amount >= $requiredMicroStx) {
                                $isValidPayment = true;
                            }
                        }
                        // Case 2: Smart Contract Call (buy-prompt)
                        elseif ($txType === 'contract_call') {
                            $contractId = $tx['contract_call']['contract_id'] ?? '';
                            $functionName = $tx['contract_call']['function_name'] ?? '';
                            
                            // Check if it's the marketplace contract and buy-prompt function
                            // Note: contract address might vary based on deployer, 
                            // but usually it's the platform treasury address.
                            if ($functionName === 'buy-prompt') {
                                // Extract the prompt ID argument from the contract call
                                // Logic: buy-prompt(uint) -> args[0]
                                foreach ($tx['contract_call']['function_args'] ?? [] as $arg) {
                                    if ($arg['name'] === 'prompt-id' && (int)($arg['repr'] ?? 0) === $prompt->contract_id) {
                                        // Verify that STX was actually transferred as part of the internal events
                                        foreach ($tx['events'] ?? [] as $event) {
                                            if (($event['event_type'] ?? '') === 'stx_asset') {
                                                $assetEvent = $event['asset_event'];
                                                if ($assetEvent['asset_event_type'] === 'transfer' && 
                                                    $assetEvent['recipient'] === $ownerAddress) {
                                                    $amount = (int) ($assetEvent['amount'] ?? 0);
                                                    if ($amount >= ($requiredMicroStx * 0.95)) { // Allow 5% margin for fees
                                                        $isValidPayment = true;
                                                        break 2;
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }

                    if ($isValidPayment) {
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
