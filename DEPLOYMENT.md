# Setup Database untuk Vercel

Aplikasi ini menggunakan Prisma dengan SQLite untuk development. Untuk deployment di Vercel, Anda perlu switch ke database cloud provider karena Vercel's file system adalah ephemeral (temporary).

## Pilihan Database untuk Vercel

### 1. **Vercel Postgres** (Recommended)
- Managed PostgreSQL dari Vercel
- Free tier tersedia
- Best integration dengan Vercel

**Setup:**
```bash
# Install Vercel CLI
npm i -g vercel

# Link project ke Vercel
vercel link

# Create Postgres database di Vercel dashboard
# https://vercel.com/docs/storage/vercel-postgres

# Get DATABASE_URL dari Vercel dashboard, add ke .env.local:
DATABASE_URL="postgres://user:password@ep-*.compute.verceldb.com/..."
```

### 2. **Neon (PostgreSQL)**
- Free tier 3 projects + 0.5GB storage
- PostgreSQL compatibility
- Modern & reliable

**Setup:**
```
1. Sign up di https://neon.tech
2. Create project & database
3. Copy connection string ke DATABASE_URL
```

### 3. **Turso (SQLite)**
- SQLite compatibility dengan replication
- Free tier generous
- Tetap bisa pakai Prisma SQLite provider

**Setup:**
```bash
# Install Turso CLI & create account
turso signup

# Create database
turso db create mydb

# Get token
turso db tokens create mydb

# DATABASE_URL format:
# libsql://mydb-username.turso.io?authToken=...
```

### 4. **PlanetScale (MySQL)**
- MySQL compatibility
- Free tier dengan 5GB storage
- Serverless MySQL

**Setup:**
```
1. Sign up di https://planetscale.com
2. Create database
3. Get connection string untuk DATABASE_URL
```

## Setup Steps untuk Vercel

### 1. Update Prisma Schema (jika switch dari SQLite)

**Untuk PostgreSQL:**
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

### 2. Deploy ke Vercel

```bash
# Push code ke Git
git add .
git commit -m "Configure for Vercel deployment"
git push

# Deploy
vercel --prod
```

### 3. Setup Environment Variables di Vercel

Di Vercel Dashboard:
1. Go to Settings > Environment Variables
2. Add `DATABASE_URL` dengan value dari database provider Anda
3. Redeploy

### 4. Setup Prisma Migrations

```bash
# Sebelum deploy pertama kali:
npm run db:migrate
# atau
npx prisma migrate deploy
```

Atau setup post-build script di `vercel.json`:
```json
{
  "buildCommand": "npm run build && npx prisma migrate deploy",
  "env": {
    "DATABASE_URL": "@database_url"
  }
}
```

## Database Migration dari SQLite

Jika Anda sudah punya data di SQLite lokal:

### Option 1: Export-Import
```bash
# Export dari SQLite
sqlite3 db/custom.db ".dump" > backup.sql

# Import ke target database
# (Depends on target DB type)
```

### Option 2: Prisma Data Platform
```bash
# Setup Prisma Data Platform untuk automated sync
# https://www.prisma.io/data-platform
```

## Testing Sebelum Deploy

```bash
# Build locally dengan production config
npm run build

# Test dengan production environment
NODE_ENV=production npm run start

# Atau gunakan Vercel CLI local mode
vercel dev
```

## Troubleshooting

### "Cannot find module" errors
- Ensure all dependencies terinstall: `npm install`
- Run: `npm run db:generate`

### Database connection errors
- Verify DATABASE_URL di Vercel Environment Variables
- Check firewall/IP whitelist di database provider
- Ensure migrations sudah berjalan: `npx prisma migrate deploy`

### File upload errors
- Ensure `uploads/` folder writable (atau gunakan cloud storage)
- Vercel file system read-only untuk deployments, hanya `/tmp` yang writable

## Resources

- [Vercel Next.js Deployment](https://vercel.com/docs/frameworks/nextjs)
- [Prisma Deployment](https://www.prisma.io/docs/orm/overview/databases)
- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
