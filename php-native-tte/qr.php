<?php
require_once __DIR__ . '/functions.php';
$data = trim($_GET['data'] ?? '');
if ($data === '') {
    http_response_code(400);
    exit('Missing data');
}

header('Content-Type: image/png');
$encoded = urlencode($data);
$qrUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=' . $encoded;
readfile($qrUrl);
