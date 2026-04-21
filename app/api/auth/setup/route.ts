import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';

export async function POST() {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not configured');
      return NextResponse.json(
        {
          success: false,
          message: 'Database tidak terkonfigurasi',
          detail: 'DATABASE_URL harus diset di Vercel Environment Variables. Pastikan sudah dikonfigurasi sebelum menggunakan aplikasi.'
        },
        { status: 503 }
      );
    }

    // Check if any user exists
    let userCount;
    try {
      userCount = await db.user.count();
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json(
        {
          success: false,
          message: 'Kesalahan koneksi database',
          detail: 'Tidak dapat mengakses database. Pastikan DATABASE_URL sudah benar dan database dapat diakses dari internet.'
        },
        { status: 503 }
      );
    }

    if (userCount > 0) {
      return NextResponse.json(
        { success: false, message: 'User sudah ada. Setup tidak diperlukan.' },
        { status: 400 }
      );
    }

    // Create default admin user
    let hashedPassword;
    try {
      hashedPassword = hashPassword('admin123');
    } catch (hashError) {
      console.error('Password hashing error:', hashError);
      return NextResponse.json(
        { success: false, message: 'Kesalahan hashing password' },
        { status: 500 }
      );
    }

    let admin;
    try {
      admin = await db.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          nama: 'Administrator',
          role: 'admin',
        },
      });
    } catch (createError) {
      console.error('User creation error:', createError);
      return NextResponse.json(
        {
          success: false,
          message: 'Gagal membuat user admin',
          detail: 'Tidak dapat membuat user admin di database.'
        },
        { status: 500 }
      );
    }

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
    const errorStack = error instanceof Error ? error.stack : '';
    const isDatabaseError = errorMessage.includes('ECONNREFUSED') ||
                            errorMessage.includes('PrismaClientInitializationError') ||
                            errorMessage.includes('getaddrinfo') ||
                            errorMessage.includes('P1001') ||
                            errorMessage.includes('P1002') ||
                            errorMessage.includes('P1003');
    
    console.error('Setup error:', errorMessage);
    console.error('Stack:', errorStack);
    
    if (isDatabaseError) {
      return NextResponse.json(
        {
          success: false,
          message: 'Database connection error',
          detail: 'Pastikan DATABASE_URL sudah diset dengan benar di Vercel Environment Variables dan database dapat diakses dari internet.'
        },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server', detail: errorMessage },
      { status: 500 }
    );
  }
}
