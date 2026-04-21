import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, getTokenFromRequest } from '@/lib/auth';
import { downloadFile, fileExists } from '@/lib/storage';
import path from 'path';

/**
 * GET /api/dokumen/[id]/download
 * Serve the signed document file for download
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

    // Authorization check
    if (session.role === 'pegawai' && dokumen.pegawaiId !== session.pegawaiId) {
      return NextResponse.json({ error: 'Tidak memiliki akses' }, { status: 403 });
    }

    // Determine which file to serve
    // For signed documents: serve pathFileTtd (the uploaded signed document)
    // For tte_stamp: serve the TTE stamp image
    let filePath = dokumen.pathFileTtd || dokumen.pathFileAsli;

    if (!filePath) {
      return NextResponse.json(
        { error: 'File dokumen tidak ditemukan di server' },
        { status: 404 }
      );
    }

    // If it's a full URL (Vercel Blob), redirect to it
    if (filePath.startsWith('http')) {
      return NextResponse.redirect(filePath);
    }

    // Check if file exists using storage abstraction
    const exists = await fileExists(filePath);
    if (!exists) {
      return NextResponse.json(
        { error: 'File dokumen tidak ditemukan di server' },
        { status: 404 }
      );
    }

    // Download file using storage abstraction
    const fileBuffer = await downloadFile(filePath);
    const filename = dokumen.judulDokumen
      ? `${dokumen.judulDokumen.replace(/[^a-zA-Z0-9_-]/g, '_')}${path.extname(dokumen.namaFile)}`
      : dokumen.namaFile;

    // Determine content type based on file extension
    const ext = path.extname(filePath).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
    };
    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error downloading dokumen:', error);
    return NextResponse.json(
      { error: 'Gagal mengunduh dokumen' },
      { status: 500 }
    );
  }
}
