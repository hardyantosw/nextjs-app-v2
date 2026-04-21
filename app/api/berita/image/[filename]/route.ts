import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { downloadFile, fileExists } from '@/lib/storage';
import { db } from '@/lib/db';

/**
 * GET /api/berita/image/[filename]
 * Serve berita image file (public)
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const safeName = path.basename(filename);

    // First, try to find the berita in the database to get the actual imagePath
    const berita = await db.berita.findFirst({
      where: {
        imagePath: {
          contains: safeName
        }
      }
    });

    let filePath: string;

    if (berita?.imagePath) {
      // Use the stored path from database
      filePath = berita.imagePath;
    } else {
      // Fallback to constructing the path
      filePath = `berita/${safeName}`;
    }

    // If it's a full URL (Vercel Blob), redirect to it
    if (filePath.startsWith('http')) {
      return NextResponse.redirect(filePath);
    }

    // Check if file exists
    const exists = await fileExists(filePath);
    if (!exists) {
      // Return a placeholder SVG if image doesn't exist
      const placeholderSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
        <rect width="400" height="300" fill="#e0e0e0"/>
        <text x="200" y="150" font-family="Arial, sans-serif" font-size="18" fill="#999" text-anchor="middle">Gambar tidak tersedia</text>
      </svg>`;
      return new NextResponse(placeholderSvg, {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Download file from storage
    const buffer = await downloadFile(filePath);
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
    console.error('Error serving berita image:', error);
    return NextResponse.json({ error: 'Gagal memuat gambar' }, { status: 500 });
  }
}
