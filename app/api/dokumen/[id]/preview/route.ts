import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { downloadFile, fileExists } from '@/lib/storage';

/**
 * GET /api/dokumen/[id]/preview
 * Serve the signed PDF file for inline preview
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const dokumen = await db.dokumen.findUnique({
      where: { id },
    });

    if (!dokumen) {
      return NextResponse.json(
        { error: 'Dokumen tidak ditemukan' },
        { status: 404 }
      );
    }

    // Determine which file to serve
    const filePath = dokumen.pathFileTtd || dokumen.pathFileAsli;

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

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'inline',
        'Content-Length': fileBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error previewing dokumen:', error);
    return NextResponse.json(
      { error: 'Gagal mempratinjau dokumen' },
      { status: 500 }
    );
  }
}
