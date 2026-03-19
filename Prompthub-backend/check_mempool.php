<?php
$address = 'ST2PFEWWGQVY8ERW3F60ZYKHPRK5BJ35ENKWW1G05';
$url = "https://api.testnet.hiro.so/extended/v1/address/$address/mempool?limit=5";

echo "Fetching mempool for $address...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
foreach ($data['results'] as $tx) {
    if ($tx['tx_type'] === 'contract_call') {
        $func = $tx['contract_call']['function_name'];
        echo "PENDING TX ID: {$tx['tx_id']} | Func: $func\n";
    }
}
if (empty($data['results'])) echo "No pending transactions in mempool.\n";
