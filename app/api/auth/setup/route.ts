import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST() {
  try {
    // Check if any user exists
    const userCount = await db.user.count();

    if (userCount > 0) {
      return NextResponse.json(
        { success: false, message: 'User sudah ada. Setup tidak diperlukan.' },
        { status: 400 }
      );
    }

    // Create default admin user
    const hashedPassword = hashPassword('admin123');

    const admin = await db.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        nama: 'Administrator',
        role: 'admin',
      },
    });

    return NextResponse.json({
      success: true,
      message: 'User admin berhasil dibuat',
      data: {
        id: admin.id,
        username: admin.username,
        nama: admin.nama,
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Setup error:', errorMessage, error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server', detail: errorMessage },
      { status: 500 }
    );
  }
}
