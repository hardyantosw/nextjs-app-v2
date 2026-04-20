# ⚠️ VERCEL DEPLOYMENT - ACTION REQUIRED

Sudah saya siapkan konfigurasi initial untuk Vercel. Tapi ada 2 blocker sebelum bisa deploy:

## 🔴 BLOCKER 1: Database (Wajib)

Aplikasi sekarang pakai SQLite lokal yang **tidak bisa bekerja di Vercel** (file system temporary).

**Pilih salah satu:**

### A. Vercel Postgres (Recommended - Termudah)
```bash
# 1. Buka https://vercel.com/dashboard
# 2. Klik "Storage" tab
# 3. Create "Postgres" database
# 4. Copy connection string

# 2. Add ke Vercel environment variables:
DATABASE_URL="postgres://..."
```

### B. Neon (Free PostgreSQL)
```bash
# 1. Signup https://neon.tech
# 2. Create project
# 3. Copy connection string

DATABASE_URL="postgres://..."
```

### C. Turso (Free SQLite Cloud)
```bash
# 1. Signup https://turso.tech  
# 2. Create database
# 3. Get connection string

DATABASE_URL="libsql://..."
```

Setelah dapat connection string → Lanjut ke step BLOCKER 2.

---

## 🔴 BLOCKER 2: File Storage (Wajib)

Aplikasi simpan file ke disk:
- ❌ QR codes
- ❌ TTE images  
- ❌ Dokumen signed
- ❌ Uploads

**Ini tidak bisa di Vercel** karena file system ephemeral!

**Solusi: Gunakan cloud storage**

### A. Vercel Blob (Termudah)
```bash
npm install @vercel/blob
```

**Update code untuk upload:**
```typescript
// lib/storage.ts
import { put, get } from '@vercel/blob'

export async function uploadFile(path: string, buffer: Buffer) {
  const blob = await put(path, buffer, { access: 'public' })
  return blob.url
}
```

**Replace di API routes:**
```typescript
// Sebelum:
fs.writeFileSync(path, buffer)

// Sesudah:
const url = await uploadFile(path, buffer)
```

### B. Supabase Storage (Alternative)
```bash
npm install @supabase/supabase-js
```

### C. AWS S3 / Google Cloud Storage
- Lebih kompleks tapi powerful

Files yang perlu update:
- `src/app/api/dokumen/route.ts` - upload dokumen
- `src/app/api/dokumen/[id]/route.ts` - sign dokumen
- `src/app/api/tte-image/[pegawaiId]/route.ts` - generate QR/TTE image

---

## ✅ Sudah Siap (Done)

- ✅ `next.config.ts` - Standalone mode
- ✅ `package.json` - Removed custom server
- ✅ `vercel.json` - Build configuration
- ✅ `.env.example` - Documentation
- ✅ Deployment guides created

---

## 📋 Checklist Deployment

- [ ] **1. Pilih & setup database cloud** (Vercel Postgres / Neon / Turso)
- [ ] **2. Pilih & setup file storage** (Vercel Blob / Supabase / S3)
- [ ] **3. Update code** untuk use cloud storage
- [ ] **4. Test locally:**
  ```bash
  npm run build
  npm run start
  ```
- [ ] **5. Push ke Git:**
  ```bash
  git add .
  git commit -m "Prepare for Vercel deployment"
  git push
  ```
- [ ] **6. Create Vercel project** https://vercel.com/new
- [ ] **7. Add environment variables:**
  - `DATABASE_URL` = cloud database connection string
  - (Vercel Blob otomatis, tidak perlu add)
- [ ] **8. Deploy & monitor logs**

---

## 📚 Documentation

- [DEPLOYMENT.md](DEPLOYMENT.md) - Detail database options
- [STORAGE-MIGRATION.md](STORAGE-MIGRATION.md) - File storage solutions
- [VERCEL-QUICK-START.md](VERCEL-QUICK-START.md) - 5-minute quick setup

---

## 🚀 Quick Deploy Command

Setelah setup database & storage:

```bash
# 1. Test build locally
npm run build

# 2. Commit & push
git add .
git commit -m "Ready for Vercel"
git push

# 3. Deploy
vercel --prod
```

---

## 🆘 Need Help?

- Stuck pilih database? → Gunakan **Vercel Postgres** (easiest)
- Stuck pilih storage? → Gunakan **Vercel Blob** (easiest)
- Build error? → Check `DEPLOYMENT.md` troubleshooting section
- Code update help? → Ask me untuk modify API routes

Ready? Pick your options dari BLOCKER 1 & 2, dan lanjutkan! 🎯
