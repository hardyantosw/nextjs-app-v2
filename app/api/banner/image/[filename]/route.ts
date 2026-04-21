import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { downloadFile, fileExists } from '@/lib/storage';

/**
 * GET /api/banner/image/[filename]
 * Serve banner image file (public)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const safeName = path.basename(filename);

    // Check if file exists
    const exists = await fileExists(`banners/${safeName}`);
    if (!exists) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 });
    }

    // Download file from storage
    const buffer = await downloadFile(`banners/${safeName}`);
    const ext = path.extname(safeName).toLowerCase();

    const contentTypeMap: Record<string, string> = {
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.webp': 'image/webp',
    };

    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error serving banner image:', error);
    return NextResponse.json({ error: 'Gagal memuat gambar' }, { status: 500 });
  }
}
