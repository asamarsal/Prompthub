<?php
$address = 'ST2PFEWWGQVY8ERW3F60ZYKHPRK5BJ35ENKWW1G05';
$url = "https://api.testnet.hiro.so/extended/v1/address/$address/transactions?limit=20";

echo "Scanning $url...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
foreach ($data['results'] as $tx) {
    echo "ID: {$tx['tx_id']} | Type: {$tx['tx_type']} | Status: {$tx['tx_status']}";
    if ($tx['tx_type'] === 'contract_call') {
        echo " | Func: {$tx['contract_call']['function_name']}";
    }
    echo "\n";
}
