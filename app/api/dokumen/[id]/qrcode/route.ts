import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, getTokenFromRequest } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/dokumen/[id]/qrcode
 * Serve the QR code image for a signed document
 * Query params:
 *   - download=true: Sets Content-Disposition to attachment (download) instead of inline
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Auth check
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }
    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Sesi berakhir' }, { status: 401 });
    }

    const dokumen = await db.dokumen.findUnique({
      where: { id },
    });

    if (!dokumen) {
      return NextResponse.json(
        { error: 'Dokumen tidak ditemukan' },
        { status: 404 }
      );
    }

    // Authorization check: pegawai can only access their own documents
    if (session.role === 'pegawai' && dokumen.pegawaiId !== session.pegawaiId) {
      return NextResponse.json({ error: 'Tidak memiliki akses' }, { status: 403 });
    }

    // QR code is saved at uploads/qrcodes/{tokenVerifikasi}.png
    const qrPath = path.join(
      process.cwd(),
      'uploads',
      'qrcodes',
      `${dokumen.tokenVerifikasi}.png`
    );

    if (!fs.existsSync(qrPath)) {
      return NextResponse.json(
        { error: 'QR Code tidak ditemukan di server' },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(qrPath);

    // Check if download query param is set
    const url = new URL(request.url);
    const isDownload = url.searchParams.get('download') === 'true';

    const headers: Record<string, string> = {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': fileBuffer.length.toString(),
    };

    if (isDownload) {
      headers['Content-Disposition'] = `attachment; filename="QRCode_${dokumen.tokenVerifikasi}.png"`;
    } else {
      headers['Content-Disposition'] = 'inline';
    }

    return new NextResponse(fileBuffer, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('Error serving QR code:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil QR Code' },
      { status: 500 }
    );
  }
}
