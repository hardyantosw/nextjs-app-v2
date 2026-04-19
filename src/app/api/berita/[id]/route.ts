import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, checkAuth } from '@/lib/auth';

/**
 * GET /api/berita/[id]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const berita = await db.berita.findUnique({ where: { id } });
    if (!berita) {
      return NextResponse.json({ error: 'Berita tidak ditemukan' }, { status: 404 });
    }

    // Public can only see published berita
    if (!berita.published) {
      const auth = await checkAuth(request);
      if (!auth || auth.session.role !== 'admin') {
        return NextResponse.json({ error: 'Berita tidak ditemukan' }, { status: 404 });
      }
    }

    return NextResponse.json({ data: berita });
  } catch (error) {
    console.error('Error fetching berita:', error);
    return NextResponse.json({ error: 'Gagal mengambil data berita' }, { status: 500 });
  }
}

/**
 * PUT /api/berita/[id]
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { judul, isi, ringkas, imagePath, penulis, kategori, published } = body;

    const existing = await db.berita.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Berita tidak ditemukan' }, { status: 404 });
    }

    const berita = await db.berita.update({
      where: { id },
      data: {
        ...(judul !== undefined && { judul: judul.trim() }),
        ...(isi !== undefined && { isi: isi.trim() }),
        ...(ringkas !== undefined && { ringkas: ringkas?.trim() || null }),
        ...(imagePath !== undefined && { imagePath: imagePath || null }),
        ...(penulis !== undefined && { penulis: penulis?.trim() || null }),
        ...(kategori !== undefined && { kategori: kategori?.trim() || null }),
        ...(published !== undefined && { published }),
      },
    });

    return NextResponse.json({ data: berita });
  } catch (error) {
    console.error('Error updating berita:', error);
    return NextResponse.json({ error: 'Gagal memperbarui berita' }, { status: 500 });
  }
}

/**
 * DELETE /api/berita/[id]
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const { id } = await params;
    const existing = await db.berita.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Berita tidak ditemukan' }, { status: 404 });
    }

    await db.berita.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting berita:', error);
    return NextResponse.json({ error: 'Gagal menghapus berita' }, { status: 500 });
  }
}
