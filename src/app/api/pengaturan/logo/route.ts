import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import { db } from '@/lib/db';
import { generateUniqueFilename, ensureUploadsDir } from '@/lib/tte-utils';

/**
 * POST /api/pengaturan/logo
 * Upload logo image (PNG/JPG).
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
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Format file tidak didukung. Gunakan PNG atau JPG.' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'Ukuran file terlalu besar. Maksimum 5MB.' },
        { status: 400 }
      );
    }

    // Ensure uploads directory exists
    ensureUploadsDir();

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(file.name);
    const filePath = path.join(process.cwd(), 'uploads', 'logos', uniqueFilename);

    // Save file to disk
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    // Update pengaturan with new logo path
    let pengaturan = await db.pengaturan.findFirst();

    if (!pengaturan) {
      pengaturan = await db.pengaturan.create({
        data: {
          logoPath: uniqueFilename,
        },
      });
    } else {
      // Delete old logo file if exists
      if (pengaturan.logoPath) {
        const oldFilePath = path.join(
          process.cwd(),
          'uploads',
          'logos',
          pengaturan.logoPath
        );
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (err) {
            console.error('Error deleting old logo:', err);
          }
        }
      }

      pengaturan = await db.pengaturan.update({
        where: { id: pengaturan.id },
        data: { logoPath: uniqueFilename },
      });
    }

    return NextResponse.json({
      message: 'Logo berhasil diunggah',
      data: {
        logoPath: uniqueFilename,
        logoUrl: `/api/pengaturan/logo/${uniqueFilename}`,
        pengaturan,
      },
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    return NextResponse.json(
      { error: 'Gagal mengunggah logo' },
      { status: 500 }
    );
  }
}
