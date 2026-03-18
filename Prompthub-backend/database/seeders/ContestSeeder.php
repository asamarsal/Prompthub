<?php

namespace Database\Seeders;

use App\Models\Contest;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ContestSeeder extends Seeder
{
    public function run(): void
    {
        $brand = User::where('email', 'test@example.com')->first();
        if (!$brand) {
            $brand = User::create([
                'stx_address' => 'SP_SEEDER_BRAND',
                'email' => 'test@example.com',
                'name' => 'NeonX Labs',
                'roles' => ['BRAND'],
            ]);
        }

        Contest::truncate();

        $contests = [
            [
                'id' => Str::uuid()->toString(),
                'brand_address' => $brand->stx_address,
                'title' => 'Neon Horizon — Brand Visual Identity',
                'brand_name' => 'NeonX Labs',
                'about_brand' => 'We\'re a Web3 gaming studio launching our new IP, Neon Horizon. We need a signature visual identity — think cyberpunk meets anime, bold neon palette, and futuristic typography feel.',
                'brief' => 'Create a hero visual (1920×1080) that encapsulates the Neon Horizon brand universe. Must include: a central character silhouette, neon cityscape, and the text \'NEON HORIZON\' styled to match the world.',
                'total_prize_sbtc' => 0.5,
                'prize_tiers' => [
                    ['place' => 1, 'prize_sbtc' => 0.25],
                    ['place' => 2, 'prize_sbtc' => 0.15],
                    ['place' => 3, 'prize_sbtc' => 0.07],
                    ['place' => 4, 'prize_sbtc' => 0.01],
                ],
                'category' => 'Brand Visual Identity',
                'tags' => ['cyberpunk', 'gaming', 'anime', 'neon'],
                'deadline' => now()->addDays(7),
                'status' => 'OPEN',
                'tx_id' => '0xMockTxId1',
            ],
            [
                'id' => Str::uuid()->toString(),
                'brand_address' => $brand->stx_address,
                'title' => 'StacksBrew — Product Launch Campaign',
                'brand_name' => 'StacksBrew Coffee',
                'about_brand' => 'StacksBrew is the world\'s first Bitcoin-native coffee brand. We\'re launching our limited edition sBTC Roast and need campaign visuals that blend coffee culture with Web3 aesthetics.',
                'brief' => 'Create 3 social media visuals (1:1 format) for our sBTC Roast launch. Mood: warm, premium, with subtle Bitcoin/blockchain motifs. No text required — visuals only.',
                'total_prize_sbtc' => 0.3,
                'prize_tiers' => [
                    ['place' => 1, 'prize_sbtc' => 0.15],
                    ['place' => 2, 'prize_sbtc' => 0.09],
                    ['place' => 3, 'prize_sbtc' => 0.06],
                ],
                'category' => 'Product Launch Campaign',
                'tags' => ['coffee', 'bitcoin', 'lifestyle', 'product'],
                'deadline' => now()->addDays(2),
                'status' => 'OPEN',
                'tx_id' => '0xMockTxId2',
            ],
            [
                'id' => Str::uuid()->toString(),
                'brand_address' => $brand->stx_address,
                'title' => 'DreamDAO — NFT Character Design Challenge',
                'brand_name' => 'DreamDAO',
                'about_brand' => 'DreamDAO is launching a 10,000-piece PFP NFT collection. We need a signature character — our \'Dreamer\' — that will define the collection\'s visual identity.',
                'brief' => 'Design the base Dreamer character: humanoid, expressive, Web3-native aesthetic. Must be adaptable for trait variation. Deliverable: full body + portrait crop.',
                'total_prize_sbtc' => 0.8,
                'prize_tiers' => [
                    ['place' => 1, 'prize_sbtc' => 0.4],
                    ['place' => 2, 'prize_sbtc' => 0.22],
                    ['place' => 3, 'prize_sbtc' => 0.1],
                    ['place' => 4, 'prize_sbtc' => 0.02],
                ],
                'category' => 'NFT Collection Design',
                'tags' => ['nft', 'character', 'pfp', 'dao'],
                'deadline' => now()->addDays(14),
                'status' => 'OPEN',
                'tx_id' => '0xMockTxId3',
            ]
        ];

        foreach ($contests as $contest) {
            Contest::create($contest);
        }
    }
}
