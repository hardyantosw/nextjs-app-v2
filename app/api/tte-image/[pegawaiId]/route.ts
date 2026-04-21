import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, getTokenFromRequest } from '@/lib/auth';
import { generateQRCodeWithLogo, generateVerificationToken, ensureUploadsDir } from '@/lib/tte-utils';
import { uploadFile, downloadFile, fileExists } from '@/lib/storage';
import sharp from 'sharp';

function escapeXml(str: string): string {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function createTextSvg(nama: string, nip: string, jabatan: string, opd: string): string {
  const fontSize = 13;
  const lineHeight = 18;
  const width = 380;
  const lines = [
    'Ditandatangani secara elektronik oleh:',
    nama,
    `NIP: ${nip}`,
    jabatan,
    opd,
  ];
  const height = lines.length * lineHeight + 10;

  let textElements = '';
  lines.forEach((line, i) => {
    const isBold = i === 1;
    textElements += `<text x="${width / 2}" y="${(i + 1) * lineHeight}" font-family="Arial, Helvetica, sans-serif" font-size="${fontSize}" ${isBold ? 'font-weight="bold"' : ''} fill="#1a1a1a" text-anchor="middle">${escapeXml(line)}</text>`;
  });

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="${height}" fill="white"/>
    ${textElements}
  </svg>`;
}

/**
 * GET /api/tte-image/[pegawaiId]
 * Generate and return a TTE stamp image for a pegawai
 * Query params:
 *   - qrcode=true: Serve only the QR code with logo (not the full composite stamp)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pegawaiId: string }> }
) {
  try {
    // 1. Auth check
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }
    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Sesi berakhir' }, { status: 401 });
    }

    const { pegawaiId } = await params;

    // Admin can download any, pegawai can only download their own
    if (session.role === 'pegawai' && session.pegawaiId !== pegawaiId) {
      return NextResponse.json({ error: 'Tidak memiliki akses' }, { status: 403 });
    }

    // 2. Find pegawai
    const pegawai = await db.pegawai.findUnique({ where: { id: pegawaiId } });
    if (!pegawai) {
      return NextResponse.json({ error: 'Pegawai tidak ditemukan' }, { status: 404 });
    }

    // 3. Check if TTE stamp already exists for this pegawai
    const existingStamp = await db.dokumen.findFirst({
      where: { pegawaiId, status: 'tte_stamp' },
    });

    let tokenVerifikasi: string;

    if (existingStamp) {
      tokenVerifikasi = existingStamp.tokenVerifikasi;

      // Check if qrcode=true query param is set
      const url = new URL(request.url);
      const isQrCodeOnly = url.searchParams.get('qrcode') === 'true';

      if (isQrCodeOnly) {
        // Serve the QR code with logo
        try {
          // QR code is stored at qrcodes/${tokenVerifikasi}.png
          // Construct the URL from the tokenVerifikasi
          if (existingStamp.tokenVerifikasi) {
            // In production (Vercel Blob), construct the URL from the blob store base URL
            if (process.env.VERCEL === '1' || process.env.BLOB_READ_WRITE_TOKEN) {
              // Extract base URL from the TTE stamp path
              if (existingStamp.pathFileTtd && existingStamp.pathFileTtd.startsWith('http')) {
                const baseUrl = existingStamp.pathFileTtd.substring(0, existingStamp.pathFileTtd.lastIndexOf('/'));
                const parentDir = baseUrl.substring(0, baseUrl.lastIndexOf('/'));
                const qrUrl = `${parentDir}/qrcodes/${existingStamp.tokenVerifikasi}.png`;
                const qrFileExists = await fileExists(qrUrl);
                if (qrFileExists) {
                  const qrBuffer = await downloadFile(qrUrl);
                  return new NextResponse(new Uint8Array(qrBuffer), {
                    headers: {
                      'Content-Type': 'image/png',
                      'Content-Disposition': `attachment; filename="QRCode_${pegawai.nama.replace(/\s+/g, '_')}.png"`,
                      'Cache-Control': 'no-cache',
                    },
                  });
                }
              }
            } else {
              // Local development - use relative path
              const qrPath = `qrcodes/${existingStamp.tokenVerifikasi}.png`;
              const qrFileExists = await fileExists(qrPath);
              if (qrFileExists) {
                const qrBuffer = await downloadFile(qrPath);
                return new NextResponse(new Uint8Array(qrBuffer), {
                  headers: {
                    'Content-Type': 'image/png',
                    'Content-Disposition': `attachment; filename="QRCode_${pegawai.nama.replace(/\s+/g, '_')}.png"`,
                    'Cache-Control': 'no-cache',
                  },
                });
              }
            }
          }
        } catch (error) {
          console.warn('Failed to load QR code:', error);
          // Continue below to generate QR code
        }
      } else {
        // Default: serve the composite TTE stamp
        try {
          if (existingStamp.pathFileTtd) {
            const tteFileExists = await fileExists(existingStamp.pathFileTtd);
            if (tteFileExists) {
              const tteBuffer = await downloadFile(existingStamp.pathFileTtd);
              return new NextResponse(new Uint8Array(tteBuffer), {
                headers: {
                  'Content-Type': 'image/png',
                  'Content-Disposition': `attachment; filename="TTE_${pegawai.nama.replace(/\s+/g, '_')}.png"`,
                },
              });
            }
          }
        } catch (error) {
          console.warn('Failed to load TTE image:', error);
          // Continue below to generate TTE image
        }
      }
    } else {
      tokenVerifikasi = generateVerificationToken();
    }

    // 4. Generate QR code
    const verificationUrl = `/?verify=${tokenVerifikasi}`;

    const pengaturan = await db.pengaturan.findFirst();
    let logoBuffer: Buffer | null = null;
    if (pengaturan?.logoPath) {
      try {
        logoBuffer = await downloadFile(pengaturan.logoPath);
      } catch (error) {
        console.warn('Failed to load logo:', error);
        // Continue without logo
      }
    }

    const qrBuffer = await generateQRCodeWithLogo(verificationUrl, logoBuffer);

    // Check if only QR code is requested
    const url = new URL(request.url);
    const isQrCodeOnly = url.searchParams.get('qrcode') === 'true';

    if (isQrCodeOnly) {
      // Upload and serve the QR code with logo only
      await uploadFile(`qrcodes/tte_${tokenVerifikasi}.png`, qrBuffer, { contentType: 'image/png' });
      return new NextResponse(new Uint8Array(qrBuffer), {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="QRCode_${pegawai.nama.replace(/\s+/g, '_')}.png"`,
          'Cache-Control': 'no-cache',
        },
      });
    }

    // 5. Generate composite TTE image
    const qrResized = await sharp(qrBuffer).resize(300, 300).png().toBuffer();

    // Create text SVG
    const textSvg = createTextSvg(pegawai.nama, pegawai.nip, pegawai.jabatan, pegawai.opd);
    const textBuffer = await sharp(Buffer.from(textSvg)).png().toBuffer();
    const textMeta = await sharp(textBuffer).metadata();

    // Composite: QR on top, text below, with border
    const totalWidth = 400;
    const padding = 20;
    const qrTop = padding + 10;
    const textTop = qrTop + 300 + 5;
    const totalHeight = textTop + (textMeta.height || 120) + padding;

    const compositeImage = await sharp({
      create: {
        width: totalWidth,
        height: totalHeight,
        channels: 4,
        background: { r: 255, g: 255, b: 255, alpha: 1 },
      },
    })
      .composite([
        { input: qrResized, top: qrTop, left: Math.floor((totalWidth - 300) / 2) },
        { input: textBuffer, top: textTop, left: Math.floor((totalWidth - (textMeta.width || 360)) / 2) },
      ])
      .png()
      .toBuffer();

    // Add 2px border
    const bordered = await sharp({
      create: {
        width: totalWidth + 4,
        height: totalHeight + 4,
        channels: 4,
        background: { r: 180, g: 180, b: 180, alpha: 1 },
      },
    })
      .composite([{ input: compositeImage, top: 2, left: 2 }])
      .png()
      .toBuffer();

    // Upload images
    const tteImagePath = await uploadFile(`tte-images/${tokenVerifikasi}.png`, bordered, { contentType: 'image/png' });
    await uploadFile(`qrcodes/tte_${tokenVerifikasi}.png`, qrBuffer, { contentType: 'image/png' });

    // 6. Save to database (if not exists)
    if (!existingStamp) {
      await db.dokumen.create({
        data: {
          namaFile: `TTE_${pegawai.nama.replace(/\s+/g, '_')}.png`,
          pathFileAsli: '',
          pathFileTtd: tteImagePath,
          hashFile: '',
          pegawaiId,
          tglTtd: new Date(),
          tokenVerifikasi,
          status: 'tte_stamp',
        },
      });
    } else {
      // Update the path if it was missing
      await db.dokumen.update({
        where: { id: existingStamp.id },
        data: { pathFileTtd: tteImagePath },
      });
    }

    // 7. Return image
    return new NextResponse(new Uint8Array(bordered), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="TTE_${pegawai.nama.replace(/\s+/g, '_')}.png"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error generating TTE image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Stack:', errorStack);
    
    // Check for specific errors
    if (errorMessage.includes('BLOB_READ_WRITE_TOKEN')) {
      return NextResponse.json(
        { error: 'Konfigurasi storage belum lengkap. Hubungi administrator.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Gagal membuat gambar TTE', detail: errorMessage },
      { status: 500 }
    );
  }
}
