<?php
require_once __DIR__ . '/functions.php';
$db = db_connect();

$username = 'admin';
$password = 'admin123';
$displayName = 'Administrator';

$stmt = $db->prepare('SELECT COUNT(*) AS count FROM users WHERE username = ?');
$stmt->bind_param('s', $username);
$stmt->execute();
$result = $stmt->get_result()->fetch_assoc();
if ($result && $result['count'] > 0) {
    echo 'Admin sudah ada. Gunakan login page.';
    exit;
}

$hash = password_hash($password, PASSWORD_DEFAULT);
$stmt = $db->prepare('INSERT INTO users (username, password, display_name) VALUES (?, ?, ?)');
$stmt->bind_param('sss', $username, $hash, $displayName);
if ($stmt->execute()) {
    echo 'Admin default berhasil dibuat. Username: admin, Password: admin123';
} else {
    echo 'Gagal membuat admin: ' . $db->error;
}
