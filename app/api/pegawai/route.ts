import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, getTokenFromRequest } from '@/lib/auth';

// GET /api/pegawai - List all pegawai with search, pagination, and status filter
// - Admin: can see all pegawai
// - Pegawai: can only see their own data
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }
    const session = await getSession(token);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Sesi telah berakhir' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const statusAktif = searchParams.get('statusAktif');

    // Build where clause
    const where: Record<string, unknown> = {};

    // Pegawai can only see their own data
    if (session.role === 'pegawai') {
      // If pegawaiId is not set, return empty result
      if (!session.pegawaiId) {
        return NextResponse.json({
          success: true,
          data: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            totalPages: 0,
          },
          message: 'Akun Anda belum terhubung ke data pegawai. Silakan hubungi administrator.',
        });
      }
      where.id = session.pegawaiId;
    } else {
      // Admin can search/filter
      if (search) {
        where.OR = [
          { nama: { contains: search } },
          { nip: { contains: search } },
        ];
      }

      if (statusAktif !== null && statusAktif !== '' && statusAktif !== undefined) {
        where.statusAktif = statusAktif === 'true';
      }
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    const [pegawai, total] = await Promise.all([
      db.pegawai.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { dokumen: true },
          },
        },
      }),
      db.pegawai.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: pegawai.map((p) => ({
        id: p.id,
        nama: p.nama,
        nip: p.nip,
        jabatan: p.jabatan,
        opd: p.opd,
        statusAktif: p.statusAktif,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        totalDokumen: p._count.dokumen,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Get pegawai error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// POST /api/pegawai - Create new pegawai
// Only admin can create pegawai
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }
    const session = await getSession(token);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Sesi telah berakhir' },
        { status: 401 }
      );
    }

    // Only admin can create pegawai
    if (session.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Hanya admin yang dapat menambahkan pegawai' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { nama, nip, jabatan, opd, statusAktif } = body;

    // Validate required fields
    if (!nama || !nip || !jabatan || !opd) {
      return NextResponse.json(
        { success: false, message: 'Nama, NIP, jabatan, dan OPD wajib diisi' },
        { status: 400 }
      );
    }

    // Check if NIP already exists
    const existingPegawai = await db.pegawai.findUnique({
      where: { nip },
    });

    if (existingPegawai) {
      return NextResponse.json(
        { success: false, message: 'NIP sudah terdaftar' },
        { status: 409 }
      );
    }

    // Create pegawai
    const pegawai = await db.pegawai.create({
      data: {
        nama,
        nip,
        jabatan,
        opd,
        statusAktif: statusAktif !== undefined ? statusAktif : true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Pegawai berhasil ditambahkan',
        data: pegawai,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create pegawai error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
