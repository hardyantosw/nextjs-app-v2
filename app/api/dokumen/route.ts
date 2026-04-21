import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, getTokenFromRequest } from '@/lib/auth';
import {
  calculateBufferHash,
  generateVerificationToken,
  generateUniqueFilename,
  generateQRCodeWithLogo,
  signPDF,
  ensureUploadsDir,
} from '@/lib/tte-utils';
import { uploadFile, downloadFile } from '@/lib/storage';

/**
 * GET /api/dokumen
 * List all signed documents with pagination, search, and filter.
 * - Admin: can see all documents (tte_stamp records excluded)
 * - Pegawai: can only see their own documents (tte_stamp records excluded)
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }
    const session = await getSession(token);
    if (!session) {
      return NextResponse.json(
        { error: 'Sesi berakhir' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const pegawaiId = searchParams.get('pegawaiId') || undefined;
    const startDate = searchParams.get('startDate') || undefined;
    const endDate = searchParams.get('endDate') || undefined;
    const search = searchParams.get('search') || undefined;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: Record<string, unknown> = {};

    // Exclude tte_stamp records from document listing
    where.status = { not: 'tte_stamp' };

    // Pegawai can only see their own documents
    if (session.role === 'pegawai') {
      where.pegawaiId = session.pegawaiId;
    } else if (pegawaiId) {
      where.pegawaiId = pegawaiId;
    }

    if (startDate || endDate) {
      where.tglTtd = {};
      if (startDate) {
        (where.tglTtd as Record<string, unknown>).gte = new Date(startDate);
      }
      if (endDate) {
        (where.tglTtd as Record<string, unknown>).lte = new Date(endDate);
      }
    }

    if (search) {
      where.OR = [
        { namaFile: { contains: search } },
        { judulDokumen: { contains: search } },
        { Pegawai: { nama: { contains: search } } },
        { Pegawai: { nip: { contains: search } } },
      ];
    }

    const [dokumen, total] = await Promise.all([
      db.dokumen.findMany({
        where,
        include: {
          Pegawai: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      db.dokumen.count({ where }),
    ]);

    return NextResponse.json({
      data: dokumen,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error listing dokumen:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data dokumen' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/dokumen
 * Upload and sign a document.
 * - Admin: can sign for any pegawai
 * - Pegawai: can only sign for themselves (pegawaiId is forced to their own)
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { error: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }
    const session = await getSession(token);
    if (!session) {
      return NextResponse.json(
        { error: 'Sesi berakhir' },
        { status: 401 }
      );
    }

    ensureUploadsDir();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    let pegawaiId = formData.get('pegawaiId') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'File PDF wajib diunggah' },
        { status: 400 }
      );
    }

    if (!pegawaiId) {
      return NextResponse.json(
        { error: 'Pegawai ID wajib diisi' },
        { status: 400 }
      );
    }

    // Pegawai can only sign for themselves
    if (session.role === 'pegawai') {
      if (session.pegawaiId !== pegawaiId) {
        return NextResponse.json(
          { error: 'Anda hanya dapat menandatangani dokumen untuk diri sendiri' },
          { status: 403 }
        );
      }
      pegawaiId = session.pegawaiId;
    }

    // Verify pegawai exists
    const pegawai = await db.pegawai.findUnique({
      where: { id: pegawaiId },
    });

    if (!pegawai) {
      return NextResponse.json(
        { error: 'Pegawai tidak ditemukan' },
        { status: 404 }
      );
    }

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return NextResponse.json(
        { error: 'Hanya file PDF yang diperbolehkan' },
        { status: 400 }
      );
    }

    // Step 1: Save original PDF to uploads/original/
    const originalFilename = generateUniqueFilename(file.name);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const originalPath = await uploadFile(`original/${originalFilename}`, fileBuffer, { contentType: 'application/pdf' });

    // Step 2: Calculate SHA-256 hash of original file
    const hashFile = calculateBufferHash(fileBuffer);

    // Step 3: Generate unique verification token
    const tokenVerifikasi = generateVerificationToken();

    // Step 4: Generate QR code containing verification URL
    const verificationUrl = `/?verify=${tokenVerifikasi}`;

    // Step 5: Check if logo exists in pengaturan
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

    // Generate QR code with optional logo overlay
    const qrImageBuffer = await generateQRCodeWithLogo(verificationUrl, logoBuffer);

    // Step 6: Sign the PDF (add QR code + text to bottom-right of last page)
    const tglTtd = new Date();
    const tanggalStr = tglTtd.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const signedPdfBuffer = await signPDF(fileBuffer, qrImageBuffer, {
      nama: pegawai.nama,
      nip: pegawai.nip,
      jabatan: pegawai.jabatan,
      opd: pegawai.opd,
      tanggal: tanggalStr,
    });

    // Step 7: Upload signed PDF
    const signedFilename = generateUniqueFilename(file.name);
    const signedPath = await uploadFile(`signed/${signedFilename}`, signedPdfBuffer, { contentType: 'application/pdf' });

    // Step 8: Upload QR code
    const qrPath = await uploadFile(`qrcodes/${tokenVerifikasi}.png`, qrImageBuffer, { contentType: 'image/png' });

    // Step 9: Save document record to database
    const dokumen = await db.dokumen.create({
      data: {
        namaFile: file.name,
        pathFileAsli: originalPath,
        pathFileTtd: signedPath,
        hashFile,
        pegawaiId,
        tglTtd,
        tokenVerifikasi,
        status: 'signed',
      },
      include: {
        Pegawai: true,
      },
    });

    return NextResponse.json({ data: dokumen }, { status: 201 });
  } catch (error) {
    console.error('Error uploading and signing dokumen:', error);
    return NextResponse.json(
      { error: 'Gagal mengunggah dan menandatangani dokumen' },
      { status: 500 }
    );
  }
}
