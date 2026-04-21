import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { deleteFile } from '@/lib/storage';
import path from 'path';

/**
 * GET /api/banner/[id]
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const banner = await db.banner.findUnique({ where: { id } });
    if (!banner) {
      return NextResponse.json({ error: 'Banner tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json({ data: banner });
  } catch (error) {
    console.error('Error fetching banner:', error);
    return NextResponse.json({ error: 'Gagal mengambil data banner' }, { status: 500 });
  }
}

/**
 * PUT /api/banner/[id]
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
    const { judul, deskripsi, imagePath, urutan, aktif } = body;

    const existing = await db.banner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Banner tidak ditemukan' }, { status: 404 });
    }

    const banner = await db.banner.update({
      where: { id },
      data: {
        ...(judul !== undefined && { judul: judul.trim() }),
        ...(deskripsi !== undefined && { deskripsi: deskripsi?.trim() || null }),
        ...(imagePath !== undefined && { imagePath: imagePath || null }),
        ...(urutan !== undefined && { urutan }),
        ...(aktif !== undefined && { aktif }),
      },
    });

    return NextResponse.json({ data: banner });
  } catch (error) {
    console.error('Error updating banner:', error);
    return NextResponse.json({ error: 'Gagal memperbarui banner' }, { status: 500 });
  }
}

/**
 * DELETE /api/banner/[id]
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
    const existing = await db.banner.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'Banner tidak ditemukan' }, { status: 404 });
    }

    // Delete associated image file using storage abstraction
    if (existing.imagePath) {
      try {
        // If it's a full URL, delete directly, otherwise construct path
        const filePath = existing.imagePath.startsWith('http')
          ? existing.imagePath
          : `banners/${path.basename(existing.imagePath)}`;
        await deleteFile(filePath);
      } catch (error) {
        console.warn('Failed to delete banner image:', error);
        // Continue with deletion even if file delete fails
      }
    }

    await db.banner.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting banner:', error);
    return NextResponse.json({ error: 'Gagal menghapus banner' }, { status: 500 });
  }
}
