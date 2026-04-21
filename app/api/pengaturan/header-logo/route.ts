import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { db } from '@/lib/db';
import { generateUniqueFilename } from '@/lib/tte-utils';
import { uploadFile, deleteFile } from '@/lib/storage';
import { randomUUID } from 'crypto';

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

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(file.name);

    // Upload file to storage (local or cloud)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const headerLogoPath = await uploadFile(`logos/${uniqueFilename}`, buffer, { contentType: file.type });

    // Update pengaturan with new header logo path
    let pengaturan = await db.pengaturan.findFirst();

    if (!pengaturan) {
      pengaturan = await db.pengaturan.create({
        data: {
          id: randomUUID(),
          headerLogoPath: headerLogoPath,
          updatedAt: new Date(),
        },
      });
    } else {
      // Delete old header logo file if exists
      if (pengaturan.headerLogoPath) {
        await deleteFile(pengaturan.headerLogoPath).catch(() => {
          // Silently ignore if file doesn't exist
        });
      }

      pengaturan = await db.pengaturan.update({
        where: { id: pengaturan.id },
        data: { headerLogoPath: headerLogoPath },
      });
    }

    return NextResponse.json({
      message: 'Logo header berhasil diunggah',
      data: {
        headerLogoPath: headerLogoPath,
        headerLogoUrl: headerLogoPath.startsWith('http') ? headerLogoPath : `/api/pengaturan/header-logo/${uniqueFilename}`,
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
