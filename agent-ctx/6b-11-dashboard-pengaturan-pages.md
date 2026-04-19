# Task 6b-11 - Dashboard Page and Pengaturan Page Components

## Summary
Created two TTE frontend components: Dashboard Page and Pengaturan (Settings/Logo Upload) Page.

## Files Created

1. **`/src/components/tte/dashboard-page.tsx`**
   - 4 statistics cards in responsive grid (Total Pegawai/emerald, Pegawai Aktif/sky, Dokumen Ditandatangani/amber, Dokumen Bulan Ini/purple)
   - Quick Actions section with "Upload & Tanda Tangani" and "Kelola Pegawai" buttons
   - Recent Documents table (last 5) with columns: Nama Dokumen, Penandatangan, Tanggal, Status, Aksi
   - Loading, empty states handled properly
   - API calls: GET /api/pegawai?limit=1, GET /api/pegawai?limit=1&statusAktif=true, GET /api/dokumen?limit=5, GET /api/dokumen?limit=1 with date range for monthly count
   - Uses Zustand store for page navigation

2. **`/src/components/tte/pengaturan-page.tsx`**
   - Current logo display with placeholder fallback
   - Logo upload form with file validation (PNG/JPG, max 2MB), preview, and loading state
   - Info card explaining logo usage in QR Code, supported formats, size limits, and recommendations
   - Tips card with additional guidance
   - Proper URL.revokeObjectURL cleanup for preview URLs

## Technical Notes
- Both components use 'use client' directive
- All shadcn/ui components used: Card, Button, Input, Label, Separator, Badge, Table
- Lucide icons: Users, UserCheck, FileCheck, Calendar, Plus, Settings, Upload, Image, Info, Eye, Loader2, CheckCircle2, X
- Sonner for toast notifications
- No indigo colors used (sky instead of blue per design rules)
- ESLint: 0 errors, 0 warnings
- Sonner Toaster already present in layout
