<?php
$contract = 'ST2PFEWWGQVY8ERW3F60ZYKHPRK5BJ35ENKWW1G05.prompthub-marketplace';
$url = "https://api.testnet.hiro.so/extended/v1/address/$contract/transactions?limit=30";

echo "Scanning $url...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
$found = false;
foreach ($data['results'] as $tx) {
    if ($tx['tx_status'] === 'success' && $tx['tx_type'] === 'contract_call') {
        if ($tx['contract_call']['function_name'] === 'buy-prompt') {
            echo "SUCCESSFUL PURCHASE! ID: {$tx['tx_id']} | Buyer: {$tx['sender_address']}\n";
            $found = true;
        }
    }
}
if (!$found) echo "No successful buy-prompt transactions found in the last 30 txs.\n";
