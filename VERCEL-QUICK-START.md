# Quick Start: Deploy ke Vercel dalam 5 Menit

## Prasyarat
- Vercel account (gratis di https://vercel.com)
- GitHub/GitLab/Bitbucket repository
- Database cloud (PostgreSQL, MySQL, SQLite cloud)

## 1. Pilih Database Cloud

**Recommended untuk testing cepat: Vercel Postgres**
- Gratis dengan Vercel account
- Paling mudah di-setup
- Link langsung dari Vercel dashboard

Atau gunakan:
- **Neon** (free PostgreSQL): https://neon.tech
- **Turso** (free SQLite): https://turso.tech
- **PlanetScale** (free MySQL): https://planetscale.com

## 2. Get Connection String

Setiap database provider akan kasih connection string, contoh:
```
postgresql://user:password@host:port/dbname
```

Simpan ini untuk langkah berikutnya.

## 3. Update Database Provider (jika bukan SQLite)

Edit `prisma/schema.prisma`:

**Untuk PostgreSQL/Neon:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**Untuk MySQL/PlanetScale:**
```prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

Sudah setDefault? Skip step ini, tapi edit `vercel.json` build command:

```json
{
  "buildCommand": "npm run build && npx prisma migrate deploy",
  "env": {
    "DATABASE_URL": "@database_url"
  }
}
```

## 4. Deploy ke Vercel

1. Push code ke Git:
```bash
git add .
git commit -m "Ready for Vercel deployment"
git push
```

2. Buka https://vercel.com/new
3. Import repository Anda
4. Click "Deploy" (Vercel auto-detect Next.js)

## 5. Add Environment Variables di Vercel

1. Setelah deployment, go to **Settings > Environment Variables**
2. Add variable:
   - **Name:** `DATABASE_URL`
   - **Value:** Connection string dari step 2
3. Click "Save"
4. Redeploy project (Settings > Deployments > Redeploy)

## 6. Verify & Test

1. Tunggu deployment selesai
2. Click "Visit" untuk buka aplikasi
3. Check Vercel logs jika ada error: Deployments > (...) > View Logs

## Done! ✅

Aplikasi Anda sekarang running di Vercel!

URL: https://tte-hardy-yhk-oke.vercel.app/

---

## Troubleshooting Cepat

| Error | Solution |
|-------|----------|
| "Cannot find module" | Run `npm install` locally, commit, redeploy |
| "Connection refused" | Check DATABASE_URL di Environment Variables |
| "File not found" | Check file permissions, jangan simpan files ke disk |
| Build timeout | Check Prisma migration time, optimize queries |

Lihat [DEPLOYMENT.md](DEPLOYMENT.md) untuk details lebih lengkap.
