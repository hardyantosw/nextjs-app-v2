# Task 3 - Change Document Verification from Token-based to Upload-based

## Summary
Successfully modified the TTE (Electronic Signature) system to change the document verification feature from token-based input to file upload-based verification.

## Changes Made

### 1. `/home/z/my-project/src/app/api/verifikasi/cek/route.ts`
- **Removed**: `dokumenId` requirement from the POST endpoint
- **Changed**: Now only requires `file` upload (no dokumenId needed)
- **Added**: Hash-based search across ALL signed documents in the database using `findFirst` with `hashFile` and `status: 'signed'`
- **Added**: Included `pegawai` relation in the query for returning signer information
- **Added**: Expired document check with appropriate messaging
- **Added**: Full document details in the response including pegawai info, dates, status, hash, etc.
- **Kept**: Error handling for missing file and server errors

### 2. `/home/z/my-project/src/components/tte/public-page.tsx`
- **Replaced**: Token input field with file upload dropzone (drag & drop + click to select)
- **Added new imports**: `Upload`, `X`, `FileUp` from lucide-react
- **Removed**: `Search` icon import (no longer needed)
- **Added new state**: `verifyFile`, `isDragOver`
- **Removed**: `verifyToken` state (no longer needed for manual input)
- **Added new functions**:
  - `handleVerifyUpload()` - sends file to `/api/verifikasi/cek` endpoint
  - `formatFileSize()` - formats bytes to human-readable size
  - `handleDragOver()`, `handleDragLeave()`, `handleDrop()` - drag & drop handlers
  - `handleFileSelect()` - file input change handler
  - `handleRemoveFile()` - clears selected file
- **Renamed**: `handleVerify()` → `handleVerifyByToken()` (used only for QR code URL parameter flow)
- **Updated**: Description text from "Masukkan token verifikasi..." to "Upload dokumen yang akan diverifikasi keasliannya"
- **Updated**: Error dialog hint from token-based to upload-based messaging
- **Preserved**: `?verify=token` URL parameter flow for QR code scanning
- **Preserved**: Verification result dialog handles both upload and QR scan results
- **Preserved**: All existing functionality (banners, berita, login, footer)

## UI Design
- File upload area with dashed border and hover effect
- Green/emerald color theme maintained
- After selecting a file: shows file name, size, and remove (X) button
- Verify button disabled when no file is selected
- Supported formats: PDF, DOC, DOCX, JPG, PNG (max 25MB)
- Three info cards preserved below the upload area
