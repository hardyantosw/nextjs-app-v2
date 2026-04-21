<?php
require_once __DIR__ . '/config.php';

function db_connect() {
    static $connection;

    if (!isset($connection)) {
        $connection = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
        if ($connection->connect_error) {
            die('Database connection failed: ' . $connection->connect_error);
        }
        $connection->set_charset('utf8mb4');
    }

    return $connection;
}
