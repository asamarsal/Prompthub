<?php
$address = 'ST13RNZYGR75YSMQY6E3Q004R0ZR9XJ8C194BRGD9';
$url = "https://api.testnet.hiro.so/extended/v1/address/$address/transactions?limit=10";

echo "Fetching $url...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
$results = $data['results'];

foreach ($results as $tx) {
    $func = $tx['contract_call']['function_name'] ?? 'N/A';
    echo "ID: {$tx['tx_id']} | Type: {$tx['tx_type']} | Status: {$tx['tx_status']} | Func: $func\n";
}
