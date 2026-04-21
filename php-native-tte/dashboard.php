<?php
require_once __DIR__ . '/functions.php';
requireLogin();
$db = db_connect();
$result = $db->query('SELECT * FROM documents ORDER BY created_at DESC');
$flash = flash('success');
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Dashboard - TTE Dokumen</title>
  <link rel="stylesheet" href="assets/style.css">
</head>
<body>
  <header class="topbar">
    <div class="container">
      <h1>Dashboard TTE</h1>
      <div>
        <a href="upload.php" class="btn">Upload Dokumen</a>
        <a href="logout.php" class="btn btn-secondary">Logout</a>
      </div>
    </div>
  </header>
  <main class="container">
    <?php if ($flash): ?>
      <div class="alert alert-success"><?php echo h($flash); ?></div>
    <?php endif; ?>
    <section class="card">
      <h2>Daftar Dokumen</h2>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>Judul</th>
            <th>Status</th>
            <th>Token</th>
            <th>Dibuat</th>
            <th>Aksi</th>
          </tr>
        </thead>
        <tbody>
          <?php while ($row = $result->fetch_assoc()): ?>
            <tr>
              <td><?php echo h($row['id']); ?></td>
              <td><?php echo h($row['title']); ?></td>
              <td><?php echo h($row['status']); ?></td>
              <td><?php echo h($row['token']); ?></td>
              <td><?php echo h($row['created_at']); ?></td>
              <td>
                <a href="detail.php?id=<?php echo h($row['id']); ?>">Detail</a>
                <?php if ($row['status'] === 'signed'): ?>
                  <a href="qr.php?data=<?php echo urlencode(BASE_URL . '/verify.php?token=' . $row['token']); ?>" target="_blank">QR</a>
                <?php endif; ?>
              </td>
            </tr>
          <?php endwhile; ?>
        </tbody>
      </table>
    </section>
  </main>
</body>
</html>
