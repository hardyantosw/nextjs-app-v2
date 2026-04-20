import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';

/**
 * GET /api/berita
 * List berita with pagination. Public: published only. Admin (?admin=true): all.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isAdmin = searchParams.get('admin') === 'true';
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '10')));

    if (isAdmin) {
      const session = await requireAdmin(request);
      if (!session) {
        return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
      }
      const total = await db.berita.count();
      const berita = await db.berita.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
      return NextResponse.json({
        data: berita,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    }

    const where = { published: true };
    const total = await db.berita.count({ where });
    const berita = await db.berita.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return NextResponse.json({
      data: berita,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching berita:', error);
    return NextResponse.json({ error: 'Gagal mengambil data berita' }, { status: 500 });
  }
}

/**
 * POST /api/berita
 * Create a new berita (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin(request);
    if (!session) {
      return NextResponse.json({ error: 'Akses ditolak' }, { status: 403 });
    }

    const body = await request.json();
    const { judul, isi, ringkas, imagePath, penulis, kategori, published } = body;

    if (!judul?.trim()) {
      return NextResponse.json({ error: 'Judul wajib diisi' }, { status: 400 });
    }
    if (!isi?.trim()) {
      return NextResponse.json({ error: 'Isi berita wajib diisi' }, { status: 400 });
    }

    const berita = await db.berita.create({
      data: {
        judul: judul.trim(),
        isi: isi.trim(),
        ringkas: ringkas?.trim() || null,
        imagePath: imagePath || null,
        penulis: penulis?.trim() || null,
        kategori: kategori?.trim() || null,
        published: typeof published === 'boolean' ? published : false,
      },
    });

    return NextResponse.json({ data: berita }, { status: 201 });
  } catch (error) {
    console.error('Error creating berita:', error);
    return NextResponse.json({ error: 'Gagal membuat berita' }, { status: 500 });
  }
}
