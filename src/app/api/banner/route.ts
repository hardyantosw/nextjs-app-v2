import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /api/banner
 * List banners. Public: only aktif=true. Admin (?admin=true): all.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';

    if (isAdmin) {
      const session = await requireAdmin(request);
      if (!session) {
        return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
      }
      const banners = await db.banner.findMany({
        orderBy: { urutan: 'asc' },
      });
      return NextResponse.json({ data: banners });
    }

    const banners = await db.banner.findMany({
      where: { aktif: true },
      orderBy: { urutan: 'asc' },
    });
    return NextResponse.json({ data: banners });
  } catch (error) {
    console.error('Error fetching banners:', error);
    return NextResponse.json({ error: 'Gagal mengambil data banner' }, { status: 500 });
  }
}

/**
 * POST /api/banner
 * Create a new banner (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const body = await request.json();
    const { judul, deskripsi, imagePath, urutan, aktif } = body;

    if (!judul?.trim()) {
      return NextResponse.json({ error: 'Judul wajib diisi' }, { status: 400 });
    }

    const banner = await db.banner.create({
      data: {
        judul: judul.trim(),
        deskripsi: deskripsi?.trim() || null,
        imagePath: imagePath || null,
        urutan: typeof urutan === 'number' ? urutan : 0,
        aktif: typeof aktif === 'boolean' ? aktif : true,
      },
    });

    return NextResponse.json({ data: banner }, { status: 201 });
  } catch (error) {
    console.error('Error creating banner:', error);
    return NextResponse.json({ error: 'Gagal membuat banner' }, { status: 500 });
  }
}
