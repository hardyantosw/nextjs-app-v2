import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { verifyPassword, createSession, createSessionCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL not configured');
      return NextResponse.json(
        { 
          success: false, 
          message: 'Database tidak terkonfigurasi',
          detail: 'Hubungi administrator untuk setup database'
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    // Find user by username
    const user = await db.user.findUnique({
      where: { username },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = verifyPassword(password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Create session
    const token = await createSession({
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      pegawaiId: user.pegawaiId,
    });

    // Build response
    const response = NextResponse.json({
      success: true,
      message: 'Login berhasil',
      data: {
        id: user.id,
        username: user.username,
        nama: user.nama,
        role: user.role,
        pegawaiId: user.pegawaiId,
      },
    });

    // Set session cookie
    response.headers.set('Set-Cookie', createSessionCookie(token));

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isDatabaseError = errorMessage.includes('ECONNREFUSED') || 
                            errorMessage.includes('PrismaClientInitializationError') ||
                            errorMessage.includes('getaddrinfo');
    
    console.error('Login error:', errorMessage, error);
    
    if (isDatabaseError) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Database connection error',
          detail: 'Pastikan DATABASE_URL sudah diset di Vercel Environment Variables'
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
