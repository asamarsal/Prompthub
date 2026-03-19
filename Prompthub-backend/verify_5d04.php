<?php
$txId = '0x5d04167664870f7cf4b6697818e32306f89025e1a2f6460699025e174b74f669'; // Approximate from screenshot

$url = "https://api.testnet.hiro.so/extended/v1/tx/$txId";
echo "Fetching $url...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
if (isset($data['tx_status'])) {
    echo "ID: {$data['tx_id']} | Status: {$data['tx_status']} | Sender: {$data['sender_address']}\n";
    if (isset($data['contract_call'])) {
        echo "Func: {$data['contract_call']['function_name']}\n";
    }
} else {
    echo "Transaction not found or error: " . print_r($data, true) . "\n";
}
