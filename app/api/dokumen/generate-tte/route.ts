import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, getTokenFromRequest } from '@/lib/auth';
import {
  generateQRCodeWithLogo,
  generateVerificationToken,
  ensureUploadsDir,
} from '@/lib/tte-utils';
import { uploadFile, downloadFile } from '@/lib/storage';
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
 * POST /api/dokumen/generate-tte
 * Generate a TTE stamp image for a pegawai and create a pending Dokumen record.
 * - Admin: can generate for any pegawai
 * - Pegawai: can only generate for themselves
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }
    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Sesi berakhir' }, { status: 401 });
    }

    const body = await request.json();
    let { pegawaiId } = body;

    if (!pegawaiId) {
      return NextResponse.json({ error: 'Pegawai ID wajib diisi' }, { status: 400 });
    }

    // Pegawai can only generate for themselves
    if (session.role === 'pegawai') {
      if (session.pegawaiId !== pegawaiId) {
        return NextResponse.json(
          { error: 'Anda hanya dapat generate TTE untuk diri sendiri' },
          { status: 403 }
        );
      }
      pegawaiId = session.pegawaiId;
    }

    // Verify pegawai exists
    const pegawai = await db.pegawai.findUnique({ where: { id: pegawaiId } });
    if (!pegawai) {
      return NextResponse.json({ error: 'Pegawai tidak ditemukan' }, { status: 404 });
    }

    ensureUploadsDir();

    // Generate verification token
    const tokenVerifikasi = generateVerificationToken();

    // Generate QR code
    const verificationUrl = `/?verify=${tokenVerifikasi}`;

    // Check if logo exists
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

    // Generate composite TTE stamp image (QR + text)
    const qrResized = await sharp(qrBuffer).resize(300, 300).png().toBuffer();

    const textSvg = createTextSvg(pegawai.nama, pegawai.nip, pegawai.jabatan, pegawai.opd);
    const textBuffer = await sharp(Buffer.from(textSvg)).png().toBuffer();
    const textMeta = await sharp(textBuffer).metadata();

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

    // Add border
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

    // Upload TTE stamp image
    const tteStampPath = await uploadFile(`tte-stamps/${tokenVerifikasi}.png`, bordered, { contentType: 'image/png' });
    
    // Also upload the QR code
    await uploadFile(`qrcodes/${tokenVerifikasi}.png`, qrBuffer, { contentType: 'image/png' });

    // Create Dokumen record with status 'tte_stamp' for TTE stamp images
    const dokumen = await db.dokumen.create({
      data: {
        namaFile: `TTE_${pegawai.nama.replace(/\s+/g, '_')}.png`,
        judulDokumen: null,
        pathFileAsli: '',
        pathFileTtd: tteStampPath,
        hashFile: '',
        pegawaiId,
        tglTtd: new Date(),
        tokenVerifikasi,
        status: 'tte_stamp',
        aktifSelamanya: true,
      },
      include: {
        pegawai: true,
      },
    });

    return NextResponse.json({ data: dokumen }, { status: 201 });
  } catch (error) {
    console.error('Error generating TTE:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : '';
    console.error('Stack:', errorStack);
    
    // Check for specific errors
    if (errorMessage.includes('BLOB_READ_WRITE_TOKEN')) {
      return NextResponse.json(
        { error: 'Konfigurasi storage belum lengkap. Hubungi administrator untuk setup Vercel Blob.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Gagal membuat TTE', detail: errorMessage },
      { status: 500 }
    );
  }
}
