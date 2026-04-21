<?php
require_once __DIR__ . '/functions.php';
requireLogin();
$db = db_connect();

$id = intval($_GET['id'] ?? 0);
if ($id <= 0) {
    redirect('dashboard.php');
}

$stmt = $db->prepare('SELECT * FROM documents WHERE id = ? LIMIT 1');
$stmt->bind_param('i', $id);
$stmt->execute();
$document = $stmt->get_result()->fetch_assoc();
if (!$document) {
    redirect('dashboard.php');
}

$error = null;
$success = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['signed_file'])) {
    $signedName = uploadFile($_FILES['signed_file'], 'uploads');
    if (!$signedName) {
        $error = 'File tanda tangan wajib diunggah dengan format yang benar.';
    } else {
        $stmt = $db->prepare('UPDATE documents SET signed_file = ?, status = ?, verified_at = NOW() WHERE id = ?');
        $status = 'signed';
        $stmt->bind_param('ssi', $signedName, $status, $id);
        if ($stmt->execute()) {
            flash('success', 'Dokumen berhasil ditandatangani.');
            redirect('dashboard.php');
        }
        $error = 'Gagal menyimpan file tanda tangan.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Detail Dokumen - TTE</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <header class="topbar">
    <div class="container">
      <h1>Detail Dokumen</h1>
      <a href="dashboard.php" class="btn btn-secondary">Kembali</a>
    </div>
  </header>
  <main class="container">
    <section class="card split">
      <div>
        <h2><?php echo h($document['title']); ?></h2>
        <p><?php echo nl2br(h($document['description'])); ?></p>
        <dl>
          <dt>Status</dt>
          <dd><?php echo h($document['status']); ?></dd>
          <dt>Token</dt>
          <dd><?php echo h($document['token']); ?></dd>
          <dt>Created</dt>
          <dd><?php echo h($document['created_at']); ?></dd>
          <dt>Verified at</dt>
          <dd><?php echo h($document['verified_at'] ?: '-'); ?></dd>
        </dl>
        <p>
          <strong>Original file</strong>: <a href="uploads/<?php echo h($document['original_file']); ?>" target="_blank">Download</a>
        </p>
        <?php if ($document['signed_file']): ?>
          <p>
            <strong>Signed file</strong>: <a href="uploads/<?php echo h($document['signed_file']); ?>" target="_blank">Download</a>
          </p>
        <?php endif; ?>
        <?php if ($document['status'] === 'signed'): ?>
          <p>
            <a href="qr.php?data=<?php echo urlencode(BASE_URL . '/verify.php?token=' . $document['token']); ?>" class="btn">Download QR Code</a>
          </p>
        <?php endif; ?>
      </div>
      <div>
        <h3>Upload Tanda Tangan</h3>
        <?php if ($error): ?>
          <div class="alert alert-error"><?php echo h($error); ?></div>
        <?php endif; ?>
        <form method="post" action="" enctype="multipart/form-data">
          <label>File TTD
            <input type="file" name="signed_file" accept=".pdf,.png,.jpg,.jpeg" required>
          </label>
          <button type="submit">Upload & Tandatangani</button>
        </form>
      </div>
    </section>
  </main>
</body>
</html>
