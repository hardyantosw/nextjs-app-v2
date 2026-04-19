# Task 2 - Modify TTE Download to Serve QR Code Only (Not Composite Stamp)

## Summary
Successfully modified the TTE (Electronic Signature) system so that when users download, they get ONLY the QR barcode with logo overlay — NOT the full composite TTE stamp image.

## Changes Made

### 1. `/home/z/my-project/src/app/api/dokumen/[id]/qrcode/route.ts`
- Added auth check using `getTokenFromRequest` and `getSession` from `@/lib/auth`
- Added authorization check: pegawai can only access their own documents
- Added `?download=true` query parameter support
  - When `download=true`: sets `Content-Disposition: attachment` with filename `QRCode_{tokenVerifikasi}.png`
  - When not set (default): sets `Content-Disposition: inline` for browser display
- Preserved existing QR code file lookup at `uploads/qrcodes/{tokenVerifikasi}.png`

### 2. `/home/z/my-project/src/components/tte/dokumen-page.tsx`
- Changed `handleDownloadTTE` (line ~240): from `/api/dokumen/${id}/tte-stamp` → `/api/dokumen/${id}/qrcode?download=true`
- Changed `handleDownloadStamp` (line ~320): from `/api/dokumen/${id}/tte-stamp` → `/api/dokumen/${id}/qrcode?download=true`
- Updated function comments to reflect QR code download

### 3. `/home/z/my-project/src/app/api/tte-image/[pegawaiId]/route.ts`
- Added `?qrcode=true` query parameter support
- When `qrcode=true`:
  - If existing stamp found and QR file exists at `uploads/qrcodes/tte_{tokenVerifikasi}.png`, serve it directly
  - If no existing stamp or QR file missing, generate the QR code and serve it (skip composite generation)
- Default behavior (no param): still returns the full composite TTE stamp image (preserved existing functionality)

### 4. `/home/z/my-project/src/components/tte/download-tte-page.tsx`
- Changed `handleDownload` function: from `/api/tte-image/${pegawaiId}` → `/api/tte-image/${pegawaiId}?qrcode=true`
- Changed preview `img` src: from `/api/tte-image/${id}` → `/api/tte-image/${id}?qrcode=true`
- Updated alt text: `TTE ${name}` → `QR Code TTE ${name}`
- Updated button text: `Download Gambar TTE` → `Download QR Code TTE`
- Updated toast message: `Download gambar TTE dimulai` → `Download QR Code TTE dimulai`

## Verification
- Lint check passed with no errors
- Dev server running without errors
- All existing functionality preserved (composite stamp still available via default tte-image endpoint)
