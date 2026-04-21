<?php
require_once __DIR__ . '/functions.php';

if (isLoggedIn()) {
    redirect('dashboard.php');
}

$error = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = trim($_POST['username'] ?? '');
    $password = $_POST['password'] ?? '';

    if ($username === '' || $password === '') {
        $error = 'Username dan password wajib diisi.';
    } else {
        $db = db_connect();
        $stmt = $db->prepare('SELECT id, username, password, display_name FROM users WHERE username = ? LIMIT 1');
        $stmt->bind_param('s', $username);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();

        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['admin'] = [
                'id' => $user['id'],
                'username' => $user['username'],
                'name' => $user['display_name'],
            ];
            redirect('dashboard.php');
        }

        $error = 'Login gagal. Username atau password salah.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Login - TTE Dokumen</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <main class="container center">
    <div class="card">
      <h1>Admin Login</h1>
      <?php if ($error): ?>
        <div class="alert alert-error"><?php echo h($error); ?></div>
      <?php endif; ?>
      <form method="post" action="">
        <label>Username
          <input type="text" name="username" value="<?php echo h($_POST['username'] ?? ''); ?>" required>
        </label>
        <label>Password
          <input type="password" name="password" required>
        </label>
        <button type="submit">Masuk</button>
      </form>
      <p class="helper">Default: <strong>admin</strong> / <strong>admin123</strong></p>
    </div>
  </main>
</body>
</html>
