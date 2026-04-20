import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { requireAdmin, hashPassword, checkAuth } from '@/lib/auth';

// GET /api/users/[id] - Get single user with pegawai info (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Hanya admin yang diizinkan.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    const user = await db.user.findUnique({
      where: { id },
      include: {
        pegawai: {
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

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        nama: user.nama,
        role: user.role,
        pegawaiId: user.pegawaiId,
        pegawai: user.pegawai,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// PUT /api/users/[id] - Update user (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Hanya admin yang diizinkan.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { username, password, nama, role, pegawaiId } = body;

    // Build update data
    const updateData: Record<string, unknown> = {};

    if (username !== undefined) {
      // Check username uniqueness (excluding current user)
      const duplicateUser = await db.user.findUnique({
        where: { username },
      });
      if (duplicateUser && duplicateUser.id !== id) {
        return NextResponse.json(
          { success: false, message: 'Username sudah digunakan' },
          { status: 409 }
        );
      }
      updateData.username = username;
    }

    if (password !== undefined && password !== '') {
      updateData.password = hashPassword(password);
    }

    if (nama !== undefined) {
      updateData.nama = nama;
    }

    if (role !== undefined) {
      // Validate role
      if (role !== 'admin' && role !== 'pegawai') {
        return NextResponse.json(
          { success: false, message: 'Role harus admin atau pegawai' },
          { status: 400 }
        );
      }
      updateData.role = role;

      // If role changes to 'admin', clear pegawaiId
      if (role === 'admin') {
        updateData.pegawaiId = null;
      }

      // If role changes to 'pegawai', pegawaiId is required
      if (role === 'pegawai') {
        const effectivePegawaiId = pegawaiId !== undefined ? pegawaiId : existingUser.pegawaiId;
        if (!effectivePegawaiId) {
          return NextResponse.json(
            { success: false, message: 'Pegawai wajib dipilih untuk role pegawai' },
            { status: 400 }
          );
        }
        updateData.pegawaiId = effectivePegawaiId;
      }
    } else if (pegawaiId !== undefined) {
      // pegawaiId is being changed without changing role
      if (existingUser.role === 'pegawai' && !pegawaiId) {
        return NextResponse.json(
          { success: false, message: 'Pegawai wajib dipilih untuk role pegawai' },
          { status: 400 }
        );
      }
      updateData.pegawaiId = pegawaiId || null;
    }

    // If pegawaiId is being set, check if it's already linked to another user
    if (updateData.pegawaiId) {
      const existingPegawaiUser = await db.user.findUnique({
        where: { pegawaiId: updateData.pegawaiId as string },
      });

      if (existingPegawaiUser && existingPegawaiUser.id !== id) {
        return NextResponse.json(
          { success: false, message: 'Pegawai ini sudah terhubung dengan user lain' },
          { status: 409 }
        );
      }

      // Verify pegawai exists
      const pegawai = await db.pegawai.findUnique({
        where: { id: updateData.pegawaiId as string },
      });

      if (!pegawai) {
        return NextResponse.json(
          { success: false, message: 'Pegawai tidak ditemukan' },
          { status: 404 }
        );
      }
    }

    // Update user
    const user = await db.user.update({
      where: { id },
      data: updateData,
      include: {
        pegawai: {
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

    return NextResponse.json({
      success: true,
      message: 'User berhasil diperbarui',
      data: {
        id: user.id,
        username: user.username,
        nama: user.nama,
        role: user.role,
        pegawaiId: user.pegawaiId,
        pegawai: user.pegawai,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user (admin only, cannot delete self)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Akses ditolak. Hanya admin yang diizinkan.' },
        { status: 403 }
      );
    }

    const { id } = await params;

    // Cannot delete self
    if (session.userId === id) {
      return NextResponse.json(
        { success: false, message: 'Tidak dapat menghapus akun sendiri' },
        { status: 400 }
      );
    }

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Delete user
    await db.user.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'User berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
