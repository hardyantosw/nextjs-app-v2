import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, getTokenFromRequest } from '@/lib/auth';
import { downloadFile, fileExists, uploadFile } from '@/lib/storage';
import { generateQRCodeWithLogo } from '@/lib/tte-utils';

/**
 * GET /api/dokumen/[id]/qrcode
 * Serve the QR code image for a signed document or TTE stamp
 * If QR code doesn't exist, regenerate it
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
      include: { Pegawai: true },
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

    // In production, we need to regenerate QR code since we don't store the QR URL separately
    // The TTE stamp URL is stored, but QR code URL is different in Vercel Blob
    // For local development, try to find the existing QR code file
    if (!isProduction) {
      // Local development - use relative path
      const qrPath = `qrcodes/${dokumen.tokenVerifikasi}.png`;
      
      if (await fileExists(qrPath)) {
        try {
          qrBuffer = await downloadFile(qrPath);
        } catch (error) {
          console.warn('Failed to read existing QR code:', error);
        }
      }
    }

    // If QR code doesn't exist (or in production), regenerate it
    if (!qrBuffer) {
      console.log('Regenerating QR code for document:', dokumen.id);
      
      // Generate verification URL - use the production URL if available
      const host = request.headers.get('host') || 'localhost:3000';
      const protocol = request.headers.get('x-forwarded-proto') || 'https';
      const baseUrl = isProduction ? `${protocol}://${host}` : 'http://localhost:3000';
      const verificationUrl = `${baseUrl}/?verify=${dokumen.tokenVerifikasi}`;
      
      // Try to get logo from pengaturan
      const pengaturan = await db.pengaturan.findFirst();
      let logoBuffer: Buffer | null = null;
      if (pengaturan?.logoPath) {
        try {
          logoBuffer = await downloadFile(pengaturan.logoPath);
        } catch (error) {
          console.warn('Failed to load logo for QR code:', error);
        }
      }
      
      // Generate QR code
      qrBuffer = await generateQRCodeWithLogo(verificationUrl, logoBuffer);
      
      // Upload QR code for future use (in production)
      if (isProduction) {
        try {
          await uploadFile(`qrcodes/${dokumen.tokenVerifikasi}.png`, qrBuffer, { contentType: 'image/png' });
          console.log('QR code uploaded successfully');
        } catch (uploadError) {
          console.warn('Failed to upload QR code, but continuing with response:', uploadError);
        }
      }
    }

    if (!qrBuffer) {
      return NextResponse.json(
        { error: 'Gagal membuat QR Code' },
        { status: 500 }
      );
    }

    // Check if download query param is set
    const url = new URL(request.url);
    const isDownload = url.searchParams.get('download') === 'true';

    const headers: Record<string, string> = {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-cache',
      'Content-Length': qrBuffer.length.toString(),
    };

    if (isDownload) {
      const pegawaiName = dokumen.Pegawai?.nama?.replace(/\s+/g, '_') || 'Unknown';
      headers['Content-Disposition'] = `attachment; filename="QRCode_${pegawaiName}.png"`;
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
