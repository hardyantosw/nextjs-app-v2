import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { checkAuth, verifyPassword, hashPassword } from '@/lib/auth';

// POST /api/users/change-password - Change own password
export async function POST(request: NextRequest) {
  try {
    const result = await checkAuth(request);
    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    const { session } = result;

    const body = await request.json();
    const { currentPassword, newPassword } = body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { success: false, message: 'Password saat ini dan password baru wajib diisi' },
        { status: 400 }
      );
    }

    // Get user from database
    const user = await db.user.findUnique({
      where: { id: session.userId },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'User tidak ditemukan' },
        { status: 404 }
      );
    }

    // Verify current password
    const isValid = verifyPassword(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Password saat ini salah' },
        { status: 400 }
      );
    }

    // Hash and update new password
    const hashedPassword = hashPassword(newPassword);

    await db.user.update({
      where: { id: session.userId },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      success: true,
      message: 'Password berhasil diubah',
    });
  } catch (error) {
    console.error('Change password error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
