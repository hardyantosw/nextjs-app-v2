# ✅ READY TO DEPLOY - Final Setup Steps

Selamat! Aplikasi Anda sudah siap untuk deploy ke Vercel. Semua kode sudah di-push ke Git.

Sekarang tinggal 2 langkah terakhir:

---

## 🔴 STEP 1: Setup Database (Vercel Postgres)

### 1.1 Buat Vercel Postgres Database

1. Buka https://vercel.com/dashboard
2. Klik "Storage" tab
3. Klik "Create Database" → Pilih "Postgres"
4. Beri nama: `nextjs-app-postgres`
5. Tunggu database selesai dibuat

### 1.2 Get Connection String

1. Di Vercel dashboard, klik database Postgres yang baru dibuat
2. Klik "Quickstart" atau "Connect"
3. Copy connection string (format: `postgresql://user:password@...`)

### 1.3 Setup Environment Variable

1. Buka project settings di Vercel
2. Klik "Environment Variables"
3. Add variable:
   - **Name**: `DATABASE_URL`
   - **Value**: Paste connection string dari step 1.2
   - **Environments**: Select "Production", "Preview", dan "Development"
4. Klik "Save"

---

## 🔵 STEP 2: Deploy ke Vercel

### 2.1 Create Vercel Project

1. Buka https://vercel.com/new
2. Import repository: `hardyantosw/nextjs-app-v2`
3. Klik "Import"

### 2.2 Configure Project

**Project Name**: `tte-hardy-yhk-oke` (atau sesuai keinginan)

**Framework Preset**: Next.js (auto-detected)

**Environment Variables**: Sudah ada dari Step 1? Skip

Klik "Deploy"

### 2.3 Monitor Deployment

1. Vercel akan menampilkan build progress
2. Tunggu sampai build selesai (biasanya 2-3 menit)
3. Jika ada error, check "View Logs" untuk debug

### 2.4 Setup Database Migrations

Setelah build successful:

1. Buka project settings
2. Klik "Integrations"
3. Cari "Vercel Postgres"
4. Connect/Link database

Database schema akan auto-created saat pertama kali app start.

Jika diperlukan, jalankan:
```bash
vercel env pull .env.local  # Pull env vars
npx prisma migrate deploy    # Run migrations
```

---

## ✨ DONE!

Aplikasi Anda sekarang live di:
**https://tte-hardy-yhk-oke.vercel.app**

---

## 🆘 Troubleshooting

### Build Failed?

Check these in order:
1. **Environment Variable**: Pastikan `DATABASE_URL` sudah di-set dengan benar
2. **Logs**: Klik "View Logs" di Vercel dashboard
3. **Prisma Schema**: Pastikan prisma/schema.prisma sudah update ke PostgreSQL

### Error "DATABASE_URL not set"?

Add env var di Vercel:
```
DATABASE_URL=postgres://...
```

### Error "Connection refused"?

Database connection issue. Check:
1. Connection string valid? (contains username, password, host, port, dbname)
2. Firewall? Vercel Postgres allows all by default
3. Try reconnecting database

### Error "File not found"?

Files stored in Vercel Blob now, not local filesystem. Check:
1. Upload API working? Try upload test file
2. Vercel Blob connected?
3. Check API logs in Vercel dashboard

---

## 📚 Useful Commands

```bash
# Check environment variables locally
vercel env pull

# Deploy immediately
vercel --prod

# Check logs
vercel logs

# Rollback to previous deployment
vercel rollback
```

---

## 🎯 Next Steps (Optional)

- [ ] Setup custom domain (tte.yourdomain.com)
- [ ] Enable auto-deployments on Git push
- [ ] Setup GitHub Actions for automated testing
- [ ] Monitor performance with Vercel Analytics
- [ ] Setup alerts for build failures

---

**Questions?** Check DEPLOYMENT.md or STORAGE-MIGRATION.md for more details.

**Ready?** Go to Step 1 above! 🚀
