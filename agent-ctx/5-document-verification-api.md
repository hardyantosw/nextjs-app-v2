# Task 5 - Document and Verification API Routes

## Summary
Created all 6 API route files for the TTE (Tanda Tangan Elektronik) system's Document and Verification endpoints.

## Files Created

1. **`/src/app/api/dokumen/route.ts`**
   - GET: List documents with pagination (`page`, `limit`), search (`search`), and filters (`pegawaiId`, `startDate`, `endDate`). Includes pegawai relation. Returns total count for pagination.
   - POST: Full document signing pipeline — accepts multipart form (PDF file + pegawaiId), saves original PDF, calculates SHA-256 hash, generates verification token, generates QR code with optional logo overlay, signs PDF with QR + signer info, saves signed PDF, creates database record with status "signed".

2. **`/src/app/api/dokumen/[id]/route.ts`**
   - GET: Fetch single document by ID including pegawai relation data.

3. **`/src/app/api/dokumen/[id]/download/route.ts`**
   - GET: Serve PDF file for download. Prefers signed version; falls back to original. Sets `Content-Disposition: attachment`.

4. **`/src/app/api/dokumen/[id]/preview/route.ts`**
   - GET: Serve PDF file for inline preview. Prefers signed version; falls back to original. Sets `Content-Disposition: inline`.

5. **`/src/app/api/verifikasi/[token]/route.ts`**
   - GET: Public verification endpoint. Looks up document by `tokenVerifikasi`. Returns namaFile, pegawai info (nama, nip, jabatan, opd), tglTtd, and status.

6. **`/src/app/api/verifikasi/cek/route.ts`**
   - POST: Verify file integrity. Accepts multipart form (PDF file + dokumenId). Calculates SHA-256 hash of uploaded file and compares against stored hash. Returns `{ valid, message }`.

## Technical Notes
- All routes use `NextRequest`/`NextResponse` from Next.js
- Database access via `import { db } from '@/lib/db'`
- TTE utilities imported from `@/lib/tte-utils` as specified
- QR code verification URL: `/?verify=${token}` (relative)
- ESLint passes with 0 errors, 0 warnings
