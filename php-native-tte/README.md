# PHP Native TTE Dokumen

Project PHP native sederhana untuk Tanda Tangan Elektronik (TTE) dengan MySQL.

## Fitur

- Admin login
- Dashboard daftar dokumen
- Upload dokumen dan tanda tangani
- Detail dokumen
- Generate token dan download QR code TTE
- Upload dokumen signed / TTD
- Menu publik untuk verifikasi dokumen oleh token

## Setup

1. Copy folder `php-native-tte` ke root Apache / PHP local kamu.
2. Buat database MySQL baru.
3. Import `schema.sql`.
4. Sesuaikan koneksi database di `config.php`.
5. Jalankan `setup.php` sekali untuk membuat admin default.
6. Akses `login.php` dan login dengan:
   - username: `admin`
   - password: `admin123`

## Struktur

- `index.php` → halaman publik/verifikasi
- `login.php` → halaman admin login
- `dashboard.php` → daftar dokumen admin
- `upload.php` → upload dokumen baru
- `detail.php` → detail dokumen & upload signed file
- `verify.php` → hasil verifikasi publik
- `qr.php` → generate QR code image
- `setup.php` → create default admin user
- `uploads/` → simpan file dokumen

## Notes

- Pastikan folder `uploads/` writable.
- Jika ingin ubah kredensial admin, edit `setup.php` sebelum dijalankan.
