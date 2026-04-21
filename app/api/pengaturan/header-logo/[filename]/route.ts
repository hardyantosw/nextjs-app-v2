import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { downloadFile, fileExists } from '@/lib/storage';
import { db } from '@/lib/db';

/**
 * GET /api/pengaturan/header-logo/[filename]
 * Serve the header logo file from uploads/logos/
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Prevent directory traversal attacks
    const sanitizedFilename = path.basename(filename);

    // First, try to find the pengaturan in the database to get the actual headerLogoPath
    const pengaturan = await db.pengaturan.findFirst();

    let filePath: string;

    if (pengaturan?.headerLogoPath) {
      // Check if the stored path matches the requested filename
      if (pengaturan.headerLogoPath.includes(sanitizedFilename) || pengaturan.headerLogoPath === sanitizedFilename) {
        filePath = pengaturan.headerLogoPath;
      } else {
        // Fallback to constructing the path
        filePath = `logos/${sanitizedFilename}`;
      }
    } else {
      // Fallback to constructing the path
      filePath = `logos/${sanitizedFilename}`;
    }

    // If it's a full URL (Vercel Blob), redirect to it
    if (filePath.startsWith('http')) {
      return NextResponse.redirect(filePath);
    }
    
    // Check if file exists
    const exists = await fileExists(filePath);
    if (!exists) {
      return NextResponse.json(
        { error: 'File logo tidak ditemukan' },
        { status: 404 }
      );
    }

    // Download file
    const fileBuffer = await downloadFile(filePath);

    // Determine content type based on file extension
    const ext = path.extname(sanitizedFilename).toLowerCase();
    let contentType = 'application/octet-stream';

    switch (ext) {
      case '.png':
        contentType = 'image/png';
        break;
      case '.jpg':
      case '.jpeg':
        contentType = 'image/jpeg';
        break;
      case '.webp':
        contentType = 'image/webp';
        break;
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error serving header logo file:', error);
    return NextResponse.json(
      { error: 'Gagal membaca file logo' },
      { status: 500 }
    );
  }
}
