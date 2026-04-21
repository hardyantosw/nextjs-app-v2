<?php
require_once __DIR__ . '/functions.php';
requireLogin();

$error = null;
$success = null;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $title = trim($_POST['title'] ?? '');
    $description = trim($_POST['description'] ?? '');
    $fileName = uploadFile($_FILES['document'] ?? [], 'uploads');

    if (!$title || !$fileName) {
        $error = 'Judul dan file dokumen wajib diisi dan memiliki format valid.';
    } else {
        $token = generateToken();
        $db = db_connect();
        $stmt = $db->prepare('INSERT INTO documents (title, description, original_file, token) VALUES (?, ?, ?, ?)');
        $stmt->bind_param('ssss', $title, $description, $fileName, $token);

        if ($stmt->execute()) {
            flash('success', 'Dokumen berhasil diunggah. Token: ' . $token);
            redirect('dashboard.php');
        }
        $error = 'Gagal menyimpan dokumen. Silakan coba lagi.';
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Upload Dokumen - TTE</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <header class="topbar">
    <div class="container">
      <h1>Upload Dokumen</h1>
      <a href="dashboard.php" class="btn btn-secondary">Kembali</a>
    </div>
  </header>
  <main class="container">
    <section class="card">
      <h2>Upload Dokumen Baru</h2>
      <?php if ($error): ?>
        <div class="alert alert-error"><?php echo h($error); ?></div>
      <?php endif; ?>
      <form method="post" action="" enctype="multipart/form-data">
        <label>Judul Dokumen
          <input type="text" name="title" value="<?php echo h($_POST['title'] ?? ''); ?>" required>
        </label>
        <label>Deskripsi
          <textarea name="description"><?php echo h($_POST['description'] ?? ''); ?></textarea>
        </label>
        <label>File Dokumen
          <input type="file" name="document" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" required>
        </label>
        <button type="submit">Upload & Generate Token</button>
      </form>
    </section>
  </main>
</body>
</html>
