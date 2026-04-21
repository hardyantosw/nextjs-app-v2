import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, hashPassword } from '@/lib/auth';
import { randomUUID } from 'crypto';

// GET /api/users - List all users with pegawai info (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Hanya admin yang diizinkan.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);

    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { username: { contains: search } },
        { nama: { contains: search } },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      db.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          Pegawai: {
            select: {
              id: true,
              nama: true,
              nip: true,
              jabatan: true,
              opd: true,
            },
          },
        },
      }),
      db.user.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: users.map((u) => ({
        id: u.id,
        username: u.username,
        nama: u.nama,
        role: u.role,
        pegawaiId: u.pegawaiId,
        pegawai: u.Pegawai,
        createdAt: u.createdAt,
        updatedAt: u.updatedAt,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// POST /api/users - Create new user (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Hanya admin yang diizinkan.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { username, password, nama, role, pegawaiId } = body;

    // Validate required fields
    if (!username || !password || !nama || !role) {
      return NextResponse.json(
        { success: false, message: 'Username, password, nama, dan role wajib diisi' },
        { status: 400 }
      );
    }

    // Validate role
    if (role !== 'admin' && role !== 'pegawai') {
      return NextResponse.json(
        { success: false, message: 'Role harus admin atau pegawai' },
        { status: 400 }
      );
    }

    // If role is 'pegawai', pegawaiId is required
    if (role === 'pegawai' && !pegawaiId) {
      return NextResponse.json(
        { success: false, message: 'Pegawai wajib dipilih untuk role pegawai' },
        { status: 400 }
      );
    }

    // Check username uniqueness
    const existingUser = await db.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: 'Username sudah digunakan' },
        { status: 409 }
      );
    }

    // If pegawaiId is provided, check if it's already linked to another user
    if (pegawaiId) {
      const existingPegawaiUser = await db.user.findUnique({
        where: { pegawaiId },
      });

      if (existingPegawaiUser) {
        return NextResponse.json(
          { success: false, message: 'Pegawai ini sudah terhubung dengan user lain' },
          { status: 409 }
        );
      }

      // Verify pegawai exists
      const pegawai = await db.pegawai.findUnique({
        where: { id: pegawaiId },
      });

      if (!pegawai) {
        return NextResponse.json(
          { success: false, message: 'Pegawai tidak ditemukan' },
          { status: 404 }
        );
      }
    }

    // Create user
    const hashedPassword = hashPassword(password);

    const user = await db.user.create({
      data: {
        id: randomUUID(),
        username,
        password: hashedPassword,
        nama,
        role,
        pegawaiId: role === 'pegawai' ? pegawaiId : null,
        updatedAt: new Date(),
      },
      include: {
        Pegawai: {
          select: {
            id: true,
            nama: true,
            nip: true,
            jabatan: true,
            opd: true,
          },
        },
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: 'User berhasil ditambahkan',
        data: {
          id: user.id,
          username: user.username,
          nama: user.nama,
          role: user.role,
          pegawaiId: user.pegawaiId,
          pegawai: user.Pegawai,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
