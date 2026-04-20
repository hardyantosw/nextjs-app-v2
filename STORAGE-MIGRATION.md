# File Storage untuk Vercel

Aplikasi Anda menggunakan file system untuk menyimpan:
- QR codes
- TTE images
- Signed documents
- Uploads

**Ini tidak bisa berjalan di Vercel** karena file system adalah read-only & temporary.

## Solusi: Cloud Storage Integration

### Option 1: **Vercel Blob Storage** (RECOMMENDED)
- Native Vercel integration
- 1000 files gratis per bulan
- Simple setup

**Setup:**
```bash
npm install @vercel/blob
```

**Update kode untuk upload file:**
```typescript
import { put, get } from '@vercel/blob'

// Upload
const blob = await put('path/to/file', fileBuffer, {
  access: 'public',
})
// blob.url berisi URL file

// Download
const blob = await get('path/to/file')
const buffer = Buffer.from(await blob.arrayBuffer())
```

Database jangan simpan path lokal, simpan blob pathname:
```prisma
model Dokumen {
  // ...
  pathFileTtd String? // Simpan "dokumen/xyz123.pdf" bukan "/uploads/..."
  // ...
}
```

### Option 2: **Supabase Storage**
Jika Anda prefer PostgreSQL + Storage bundled:

```bash
npm install @supabase/supabase-js
```

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
)

// Upload
const { data, error } = await supabase.storage
  .from('documents')
  .upload('path/file.pdf', fileBuffer)

// Download
const { data, error } = await supabase.storage
  .from('documents')
  .download('path/file.pdf')
```

### Option 3: **AWS S3** / **Google Cloud Storage**
- Most reliable & scalable
- Free tier generous
- More complex setup

## Migration Strategy

### 1. Keep working locally (SQLite + local FS)

Update `next.config.ts` untuk disable Vercel deployment locally:
```typescript
const isVercel = process.env.VERCEL === '1'

const nextConfig: NextConfig = {
  output: isVercel ? "standalone" : undefined,
  // ...
}
```

### 2. Update code untuk support both local & cloud storage

Create `lib/storage.ts`:
```typescript
import * as fs from 'fs/promises'

const USE_VERCEL_BLOB = process.env.VERCEL === '1'

export async function uploadFile(
  path: string,
  buffer: Buffer
) {
  if (USE_VERCEL_BLOB) {
    const { put } = await import('@vercel/blob')
    const blob = await put(path, buffer, { access: 'public' })
    return blob.url
  } else {
    // Local development
    const filePath = `./uploads/${path}`
    await fs.mkdir('./uploads', { recursive: true })
    await fs.writeFile(filePath, buffer)
    return `/uploads/${path}`
  }
}

export async function downloadFile(path: string) {
  if (USE_VERCEL_BLOB) {
    const { get } = await import('@vercel/blob')
    const blob = await get(path)
    return Buffer.from(await blob.arrayBuffer())
  } else {
    return fs.readFile(`./uploads/${path}`)
  }
}
```

Gunakan di API routes:
```typescript
// Sebelum:
fs.writeFileSync(tteImagePath, bordered)

// Sesudah:
const url = await uploadFile(relativeImagePath, bordered)
// Simpan `url` atau pathname ke database
```

### 3. Environment Variables

**Local development (.env.local):**
```
DATABASE_URL="file:/path/to/db/custom.db"
# Vercel Blob tidak perlu (auto-detected)
```

**Vercel production (.env):**
```
DATABASE_URL="postgresql://..."
# Vercel Blob auto-configured, tidak perlu add
```

## Implementation Plan

1. ✅ **Setup database cloud** (PostgreSQL)
2. ✅ **Update package.json & next.config**
3. ✅ **Add Vercel Blob** (`npm install @vercel/blob`)
4. ⏳ **Create storage abstraction** (`lib/storage.ts`)
5. ⏳ **Update API routes** - Replace `fs` calls dengan `uploadFile()`
6. ⏳ **Test locally** & di staging
7. ⏳ **Deploy ke Vercel**

## Files Yang Perlu Update

High priority:
- [src/app/api/dokumen/route.ts](src/app/api/dokumen/route.ts#L196) - writeFileSync
- [src/app/api/dokumen/[id]/route.ts](src/app/api/dokumen/[id]/route.ts#L115) - mkdir & writeFile
- [src/app/api/tte-image/[pegawaiId]/route.ts](src/app/api/tte-image/[pegawaiId]/route.ts#L74) - mkdir, readFile, writeFile

## Cost & Limits

| Storage | Free Tier | Cost |
|---------|-----------|------|
| Vercel Blob | 1000 files/mo | $0.50/10k files |
| Supabase | 1GB | $5/mo for 100GB |
| AWS S3 | 12 mo free 5GB | $0.023/GB |

## Next Steps

1. Tentukan storage provider
2. Create storage abstraction layer
3. Update all fs calls
4. Deploy!

Lihat [DEPLOYMENT.md](DEPLOYMENT.md) untuk database setup.
