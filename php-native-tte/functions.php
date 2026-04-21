<?php
require_once __DIR__ . '/db.php';

function h($value) {
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function redirect($url) {
    header('Location: ' . $url);
    exit;
}

function isLoggedIn() {
    return !empty($_SESSION['admin']);
}

function requireLogin() {
    if (!isLoggedIn()) {
        redirect('login.php');
    }
}

function flash($name, $message = null) {
    if ($message === null) {
        if (!empty($_SESSION['flash'][$name])) {
            $msg = $_SESSION['flash'][$name];
            unset($_SESSION['flash'][$name]);
            return $msg;
        }
        return null;
    }

    $_SESSION['flash'][$name] = $message;
}

function generateToken() {
    return bin2hex(random_bytes(12));
}

function uploadFile($file, $folder) {
    if (empty($file['name']) || $file['error'] !== UPLOAD_ERR_OK) {
        return null;
    }

    $allowed = ['pdf', 'doc', 'docx', 'png', 'jpg', 'jpeg'];
    $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($ext, $allowed, true)) {
        return null;
    }

    $filename = time() . '_' . preg_replace('/[^a-zA-Z0-9-_\.]/', '_', basename($file['name']));
    $target = __DIR__ . '/uploads/' . $filename;

    if (move_uploaded_file($file['tmp_name'], $target)) {
        return $filename;
    }

    return null;
}
