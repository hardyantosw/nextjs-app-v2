import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, getTokenFromRequest } from '@/lib/auth';
import { downloadFile, fileExists } from '@/lib/storage';

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
      include: { Pegawai: true },
    });

    if (!dokumen) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 });
    }

    // Authorization check
    if (session.role === 'pegawai' && dokumen.pegawaiId !== session.pegawaiId) {
      return NextResponse.json({ error: 'Tidak memiliki akses' }, { status: 403 });
    }

    const pegawaiName = dokumen.Pegawai.nama.replace(/\s+/g, '_');

    // Check if running in production/Vercel
    const isProduction = process.env.VERCEL === '1' || process.env.BLOB_READ_WRITE_TOKEN;

    let tteBuffer: Buffer | null = null;

    // In production, pathFileTtd contains the full URL to the TTE stamp
    if (isProduction && dokumen.pathFileTtd && dokumen.pathFileTtd.startsWith('http')) {
      try {
        tteBuffer = await downloadFile(dokumen.pathFileTtd);
      } catch (error) {
        console.warn('TTE stamp not found at:', dokumen.pathFileTtd, error);
      }
    } else {
      // Local development - check multiple paths
      const paths = [
        `tte-stamps/${dokumen.tokenVerifikasi}.png`,
        `tte-images/${dokumen.tokenVerifikasi}.png`,
      ];

      for (const p of paths) {
        if (await fileExists(p)) {
          tteBuffer = await downloadFile(p);
          break;
        }
      }
    }

    if (!tteBuffer) {
      return NextResponse.json(
        { error: 'TTE stamp image tidak ditemukan di server' },
        { status: 404 }
      );
    }

    return new NextResponse(new Uint8Array(tteBuffer), {
      headers: {
        'Content-Type': 'image/png',
        'Content-Disposition': `attachment; filename="TTE_${pegawaiName}.png"`,
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error serving TTE stamp:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil TTE stamp' },
      { status: 500 }
    );
  }
}
