import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { downloadFile, fileExists } from '@/lib/storage';

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
    
    // Check if file exists
    const exists = await fileExists(`logos/${sanitizedFilename}`);
    if (!exists) {
      return NextResponse.json(
        { error: 'File logo tidak ditemukan' },
        { status: 404 }
      );
    }

    // Download file
    const fileBuffer = await downloadFile(`logos/${sanitizedFilename}`);

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

    return new NextResponse(fileBuffer, {
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
