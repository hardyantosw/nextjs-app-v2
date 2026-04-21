<?php
require_once __DIR__ . '/functions.php';
unset($_SESSION['admin']);
session_destroy();
redirect('login.php');
