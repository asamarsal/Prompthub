<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Models\Prompt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SyncPromptIds extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:sync-prompt-ids';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Syncs the pending Prompt NFT contract IDs from the Stacks blockchain mapping via Hiro API.';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Starting Prompt ID Synchronization...");

        $pendingPrompts = Prompt::whereNull('contract_id')
            ->whereNotNull('stacks_tx_id')
            ->get();

        if ($pendingPrompts->isEmpty()) {
            $this->info("No pending prompts found.");
            return;
        }

        $network = env('STACKS_NETWORK', 'testnet');
        $baseUrl = $network === 'mainnet' 
            ? 'https://api.hiro.so' 
            : 'https://api.testnet.hiro.so';

        foreach ($pendingPrompts as $prompt) {
            $txId = $prompt->stacks_tx_id;
            
            // Hiro API expects txId to start with 0x
            if (!str_starts_with($txId, '0x')) {
                $txId = '0x' . $txId;
            }

            $this->info("Checking TX: {$txId} for Prompt: {$prompt->title}");

            try {
                $response = Http::timeout(10)->get("{$baseUrl}/extended/v1/tx/{$txId}");

                if ($response->successful()) {
                    $txData = $response->json();

                    if ($txData['tx_status'] === 'success' && $txData['tx_type'] === 'contract_call') {
                        $repr = $txData['tx_result']['repr'] ?? '';
                        
                        // Example repr: "(ok u42)" -> Extract 42
                        if (preg_match('/\(ok u(\d+)\)/', $repr, $matches)) {
                            $contractId = (int) $matches[1];
                            
                            $prompt->update(['contract_id' => $contractId]);
                            $this->info("✅ Successfully synced {$prompt->title} -> ID: {$contractId}");
                            Log::info("Synced contract_id {$contractId} for prompt {$prompt->id}");
                        } else {
                            $this->warn("TX was successful but return value could not be parsed: {$repr}");
                        }
                    } elseif ($txData['tx_status'] === 'pending') {
                        $this->line("TX is still pending...");
                    } elseif ($txData['tx_status'] === 'abort_by_response' || $txData['tx_status'] === 'abort_by_post_condition') {
                        $this->error("TX Failed on chain!");
                        // Optionally mark prompt as failed in DB
                    }
                } else {
                    $this->warn("API returned error or TX not found yet. Status: " . $response->status());
                }
            } catch (\Exception $e) {
                $this->error("Exception querying Hiro API: " . $e->getMessage());
                Log::error("Hiro API Sync Error: " . $e->getMessage());
            }

            // Sleep slightly to respect Hiro API rate limits
            usleep(500000); // 0.5s
        }

        $this->info("Synchronization complete.");
    }
}
