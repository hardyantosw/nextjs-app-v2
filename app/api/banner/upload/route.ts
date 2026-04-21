import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import path from 'path';
import { randomUUID } from 'crypto';
import { uploadFile } from '@/lib/storage';

/**
 * POST /api/banner/upload
 * Upload banner image (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('image') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Format file tidak didukung. Gunakan PNG, JPG, atau WebP' }, { status: 400 });
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'Ukuran file maksimal 5MB' }, { status: 400 });
    }

    // Generate unique filename
    const ext = path.extname(file.name).toLowerCase() || '.png';
    const filename = `${randomUUID()}${ext}`;

    // Upload file to storage (local or cloud)
    const buffer = Buffer.from(await file.arrayBuffer());
    await uploadFile(`banners/${filename}`, buffer, { contentType: file.type });

    return NextResponse.json({ imagePath: filename });
  } catch (error) {
    console.error('Error uploading banner image:', error);
    return NextResponse.json({ error: 'Gagal mengunggah gambar' }, { status: 500 });
  }
}
