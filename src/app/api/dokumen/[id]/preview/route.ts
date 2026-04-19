import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import fs from 'fs';

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

    if (!filePath || !fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'File dokumen tidak ditemukan di server' },
        { status: 404 }
      );
    }

    const fileBuffer = fs.readFileSync(filePath);

    return new NextResponse(fileBuffer, {
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
