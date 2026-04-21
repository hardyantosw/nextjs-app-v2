import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { downloadFile, fileExists } from '@/lib/storage';
import { db } from '@/lib/db';

/**
 * GET /api/pengaturan/logo/[filename]
 * Serve the logo file from uploads/logos/
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Prevent directory traversal attacks
    const sanitizedFilename = path.basename(filename);

    // First, try to find the pengaturan in the database to get the actual logoPath
    const pengaturan = await db.pengaturan.findFirst();

    let filePath: string;

    if (pengaturan?.logoPath) {
      // Check if the stored path matches the requested filename
      if (pengaturan.logoPath.includes(sanitizedFilename) || pengaturan.logoPath === sanitizedFilename) {
        filePath = pengaturan.logoPath;
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
      // Return a placeholder SVG if logo doesn't exist
      const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" viewBox="0 0 200 80">
        <rect width="200" height="80" fill="#f0f0f0"/>
        <text x="100" y="45" font-family="Arial, sans-serif" font-size="14" fill="#999" text-anchor="middle">Logo tidak tersedia</text>
      </svg>`;
      return new NextResponse(placeholderSvg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache',
        },
      });
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
    }

    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error serving logo file:', error);
    return NextResponse.json(
      { error: 'Gagal membaca file logo' },
      { status: 500 }
    );
  }
}
