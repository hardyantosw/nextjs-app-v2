<?php
require_once __DIR__ . '/functions.php';
$token = trim($_GET['token'] ?? '');
if ($token === '') {
    redirect('index.php');
}
$db = db_connect();
$stmt = $db->prepare('SELECT * FROM documents WHERE token = ? LIMIT 1');
$stmt->bind_param('s', $token);
$stmt->execute();
$document = $stmt->get_result()->fetch_assoc();
if (!$document) {
    redirect('index.php');
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Verifikasi Dokumen - <?php echo h($document['title']); ?></title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <main class="container center">
    <div class="card card-public">
      <h1>Dokumen Terverifikasi</h1>
      <p>Detail dokumen berhasil diverifikasi menggunakan token.</p>
      <div class="verify-result">
        <p><strong>Judul:</strong> <?php echo h($document['title']); ?></p>
        <p><strong>Status:</strong> <?php echo h($document['status']); ?></p>
        <p><strong>Token:</strong> <?php echo h($document['token']); ?></p>
        <p><strong>Created:</strong> <?php echo h($document['created_at']); ?></p>
        <p><strong>Verified at:</strong> <?php echo h($document['verified_at'] ?: '-'); ?></p>
        <p><strong>Original file:</strong> <a href="uploads/<?php echo h($document['original_file']); ?>" target="_blank">Download</a></p>
        <?php if ($document['signed_file']): ?>
          <p><strong>Signed file:</strong> <a href="uploads/<?php echo h($document['signed_file']); ?>" target="_blank">Download</a></p>
        <?php endif; ?>
      </div>
      <p><a href="index.php" class="btn btn-secondary">Kembali ke Verifikasi</a></p>
    </div>
  </main>
</body>
</html>
