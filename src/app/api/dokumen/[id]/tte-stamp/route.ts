import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, getTokenFromRequest } from '@/lib/auth';
import fs from 'fs';
import path from 'path';

/**
 * GET /api/dokumen/[id]/tte-stamp
 * Serve the TTE stamp image for a document
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
      include: { pegawai: true },
    });

    if (!dokumen) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 });
    }

    // Authorization check
    if (session.role === 'pegawai' && dokumen.pegawaiId !== session.pegawaiId) {
      return NextResponse.json({ error: 'Tidak memiliki akses' }, { status: 403 });
    }

    // Look for the TTE stamp image
    // First check the tte-stamps directory using token
    const tteStampPath = path.join(
      process.cwd(),
      'uploads',
      'tte-stamps',
      `${dokumen.tokenVerifikasi}.png`
    );

    if (fs.existsSync(tteStampPath)) {
      const fileBuffer = fs.readFileSync(tteStampPath);
      const pegawaiName = dokumen.pegawai.nama.replace(/\s+/g, '_');
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="TTE_${pegawaiName}.png"`,
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Fallback: check pathFileTtd if it's a TTE stamp (pending status)
    if (dokumen.status === 'pending' && dokumen.pathFileTtd && fs.existsSync(dokumen.pathFileTtd)) {
      const fileBuffer = fs.readFileSync(dokumen.pathFileTtd);
      const pegawaiName = dokumen.pegawai.nama.replace(/\s+/g, '_');
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="TTE_${pegawaiName}.png"`,
          'Cache-Control': 'no-cache',
        },
      });
    }

    // Also check the old tte-images directory
    const oldTtePath = path.join(
      process.cwd(),
      'uploads',
      'tte-images',
      `${dokumen.tokenVerifikasi}.png`
    );
    if (fs.existsSync(oldTtePath)) {
      const fileBuffer = fs.readFileSync(oldTtePath);
      const pegawaiName = dokumen.pegawai.nama.replace(/\s+/g, '_');
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'image/png',
          'Content-Disposition': `attachment; filename="TTE_${pegawaiName}.png"`,
          'Cache-Control': 'no-cache',
        },
      });
    }

    return NextResponse.json(
      { error: 'TTE stamp image tidak ditemukan di server' },
      { status: 404 }
    );
  } catch (error) {
    console.error('Error serving TTE stamp:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil TTE stamp' },
      { status: 500 }
    );
  }
}
