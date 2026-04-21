import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, getTokenFromRequest } from '@/lib/auth';
import { downloadFile, fileExists } from '@/lib/storage';

/**
 * GET /api/dokumen/[id]/qrcode
 * Serve the QR code image for a signed document or TTE stamp
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

    // Check if running in production/Vercel
    const isProduction = process.env.VERCEL === '1' || process.env.BLOB_READ_WRITE_TOKEN;

    let qrBuffer: Buffer | null = null;

    if (isProduction && dokumen.pathFileTtd && dokumen.pathFileTtd.startsWith('http')) {
      // In production, construct QR code URL from the TTE stamp URL
      // pathFileTtd is like: https://xxx.public.blob.vercel-storage.com/tte-stamps/abc.png
      // QR code is at: https://xxx.public.blob.vercel-storage.com/qrcodes/abc.png
      const urlObj = new URL(dokumen.pathFileTtd);
      const qrUrl = `${urlObj.origin}/qrcodes/${dokumen.tokenVerifikasi}.png`;
      
      try {
        qrBuffer = await downloadFile(qrUrl);
      } catch (error) {
        console.warn('QR code not found at:', qrUrl, error);
        // QR code doesn't exist, return error
        return NextResponse.json(
          { error: 'QR Code tidak ditemukan di server' },
          { status: 404 }
        );
      }
    } else {
      // Local development - use relative path
      const qrPath = `qrcodes/${dokumen.tokenVerifikasi}.png`;
      
      if (await fileExists(qrPath)) {
        qrBuffer = await downloadFile(qrPath);
      } else {
        return NextResponse.json(
          { error: 'QR Code tidak ditemukan di server' },
          { status: 404 }
        );
      }
    }

    if (!qrBuffer) {
      return NextResponse.json(
        { error: 'QR Code tidak ditemukan di server' },
        { status: 404 }
      );
    }

    // Check if download query param is set
    const url = new URL(request.url);
    const isDownload = url.searchParams.get('download') === 'true';

    const headers: Record<string, string> = {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Length': qrBuffer.length.toString(),
    };

    if (isDownload) {
      headers['Content-Disposition'] = `attachment; filename="QRCode_${dokumen.tokenVerifikasi}.png"`;
    } else {
      headers['Content-Disposition'] = 'inline';
    }

    return new NextResponse(new Uint8Array(qrBuffer), {
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
