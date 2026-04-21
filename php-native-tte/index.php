<?php
require_once __DIR__ . '/functions.php';
$message = null;
$results = null;

token:
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $token = trim($_POST['token'] ?? '');
    if ($token === '') {
        $message = 'Token verifikasi wajib diisi.';
    } else {
        $db = db_connect();
        $stmt = $db->prepare('SELECT * FROM documents WHERE token = ? LIMIT 1');
        $stmt->bind_param('s', $token);
        $stmt->execute();
        $results = $stmt->get_result()->fetch_assoc();
        if (!$results) {
            $message = 'Dokumen tidak ditemukan. Pastikan token benar.';
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Verifikasi Dokumen - TTE</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <main class="container center">
    <div class="card card-public">
      <h1>Verifikasi Dokumen TTE</h1>
      <form method="post" action="">
        <label>Masukkan Token Verifikasi
          <input type="text" name="token" value="<?php echo h($_POST['token'] ?? ''); ?>" required>
        </label>
        <button type="submit">Verifikasi</button>
      </form>
      <?php if ($message): ?>
        <div class="alert alert-error"><?php echo h($message); ?></div>
      <?php endif; ?>
      <?php if ($results): ?>
        <div class="verify-result">
          <h2>Detail Dokumen</h2>
          <p><strong>Judul:</strong> <?php echo h($results['title']); ?></p>
          <p><strong>Status:</strong> <?php echo h($results['status']); ?></p>
          <p><strong>Token:</strong> <?php echo h($results['token']); ?></p>
          <p><strong>Created:</strong> <?php echo h($results['created_at']); ?></p>
          <p><strong>Verified at:</strong> <?php echo h($results['verified_at'] ?: '-'); ?></p>
          <p><strong>Original file:</strong> <a href="uploads/<?php echo h($results['original_file']); ?>" target="_blank">Download</a></p>
          <?php if ($results['signed_file']): ?>
            <p><strong>Signed file:</strong> <a href="uploads/<?php echo h($results['signed_file']); ?>" target="_blank">Download</a></p>
          <?php endif; ?>
        </div>
      <?php endif; ?>
    </div>
  </main>
</body>
</html>
