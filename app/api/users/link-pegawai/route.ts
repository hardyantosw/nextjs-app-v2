import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, getTokenFromRequest } from '@/lib/auth';

/**
 * POST /api/users/link-pegawai
 * Link a user account to a pegawai record
 * Only admin can perform this action
 */
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

    // Only admin can link user to pegawai
    if (session.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Hanya admin yang dapat menghubungkan akun ke data pegawai' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { userId, pegawaiId } = body;

    if (!userId || !pegawaiId) {
      return NextResponse.json(
        { success: false, message: 'userId dan pegawaiId diperlukan' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, nama: true, pegawaiId: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if pegawai exists
    const pegawai = await db.pegawai.findUnique({
      where: { id: pegawaiId },
      select: { id: true, nama: true, nip: true }
    });

    if (!pegawai) {
      return NextResponse.json(
        { success: false, message: 'Data pegawai tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if pegawai is already linked to another user
    const existingLink = await db.user.findFirst({
      where: { 
        pegawaiId: pegawaiId,
        NOT: { id: userId }
      }
    });

    if (existingLink) {
      return NextResponse.json(
        { success: false, message: `Pegawai ${pegawai.nama} sudah terhubung ke akun ${existingLink.username}` },
        { status: 400 }
      );
    }

    // Update user with pegawaiId
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { pegawaiId: pegawaiId },
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        pegawaiId: true
      }
    });

    return NextResponse.json({
      success: true,
      message: `Akun ${user.username} berhasil dihubungkan ke data pegawai ${pegawai.nama}`,
      data: {
        user: updatedUser,
        pegawai: pegawai
      }
    });
  } catch (error) {
    console.error('Link pegawai error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/users/link-pegawai
 * Unlink a user account from pegawai record
 * Only admin can perform this action
 */
export async function DELETE(request: NextRequest) {
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

    // Only admin can unlink user from pegawai
    if (session.role !== 'admin') {
      return NextResponse.json(
        { success: false, message: 'Hanya admin yang dapat memutus hubungan akun dari data pegawai' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'userId diperlukan' },
        { status: 400 }
      );
    }

    // Check if user exists
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, pegawaiId: true }
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    if (!user.pegawaiId) {
      return NextResponse.json(
        { success: false, message: 'Akun ini tidak terhubung ke data pegawai manapun' },
        { status: 400 }
      );
    }

    // Update user to remove pegawaiId
    const updatedUser = await db.user.update({
      where: { id: userId },
      data: { pegawaiId: null },
      select: {
        id: true,
        username: true,
        nama: true,
        role: true,
        pegawaiId: true
      }
    });

    return NextResponse.json({
      success: true,
      message: `Hubungan akun ${user.username} dengan data pegawai berhasil diputus`,
      data: updatedUser
    });
  } catch (error) {
    console.error('Unlink pegawai error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
