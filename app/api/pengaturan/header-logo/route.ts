import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { db } from '@/lib/db';
import { generateUniqueFilename, ensureUploadsDir } from '@/lib/tte-utils';

/**
 * POST /api/pengaturan/header-logo
 * Upload header logo image (PNG/JPG/WebP).
 * Accepts multipart form data with file field named "logo".
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('logo') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'File logo tidak ditemukan' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Gunakan PNG, JPG, atau WebP.' },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Ukuran file terlalu besar. Maksimum 2MB.' },
        { status: 400 }
      );
    }

    // Ensure uploads directory exists
    ensureUploadsDir();

    // Use 'logos' directory for header logos too
    const uploadDir = path.join(process.cwd(), 'uploads', 'logos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(file.name);
    const filePath = path.join(uploadDir, uniqueFilename);

    // Save file to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    // Update pengaturan with new header logo path
    let pengaturan = await db.pengaturan.findFirst();

    if (!pengaturan) {
      pengaturan = await db.pengaturan.create({
        data: {
          headerLogoPath: uniqueFilename,
        },
      });
    } else {
      // Delete old header logo file if exists
      if (pengaturan.headerLogoPath) {
        const oldFilePath = path.join(uploadDir, pengaturan.headerLogoPath);
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (err) {
            console.error('Error deleting old header logo:', err);
          }
        }
      }

      pengaturan = await db.pengaturan.update({
        where: { id: pengaturan.id },
        data: { headerLogoPath: uniqueFilename },
      });
    }

    return NextResponse.json({
      message: 'Logo header berhasil diunggah',
      data: {
        headerLogoPath: uniqueFilename,
        headerLogoUrl: `/api/pengaturan/header-logo/${uniqueFilename}`,
        pengaturan,
      },
    });
  } catch (error) {
    console.error('Error uploading header logo:', error);
    return NextResponse.json(
      { error: 'Gagal mengunggah logo header' },
      { status: 500 }
    );
  }
}
