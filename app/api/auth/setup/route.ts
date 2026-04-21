import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { randomUUID } from 'crypto';

export async function POST() {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not configured');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Database tidak terkonfigurasi',
          detail: 'DATABASE_URL harus diset di environment variables'
        },
        { status: 503 }
      );
    }

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
        id: randomUUID(),
        username: 'admin',
        password: hashedPassword,
        nama: 'Administrator',
        role: 'admin',
        updatedAt: new Date(),
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
    const isDatabaseError = errorMessage.includes('ECONNREFUSED') || 
                            errorMessage.includes('PrismaClientInitializationError') ||
                            errorMessage.includes('getaddrinfo');
    
    console.error('Setup error:', errorMessage, error);
    
    if (isDatabaseError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Database connection error',
          detail: 'Pastikan DATABASE_URL sudah diset dengan benar di Vercel Environment Variables'
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
