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
          detail: 'Hubungi administrator untuk setup database. Pastikan DATABASE_URL sudah diset di Vercel Environment Variables.'
        },
        { status: 503 }
      );
    }

    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: 'Request body tidak valid' },
        { status: 400 }
      );
    }
    
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'Username dan password wajib diisi' },
        { status: 400 }
      );
    }

    // Find user by username
    let user;
    try {
      user = await db.user.findUnique({
        where: { username: username.trim().toLowerCase() },
      });
    } catch (dbError) {
      console.error('Database query error:', dbError);
      return NextResponse.json(
        {
          success: false,
          message: 'Kesalahan koneksi database',
          detail: 'Tidak dapat mengakses database. Pastikan DATABASE_URL sudah benar dan database dapat diakses.'
        },
        { status: 503 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Verify password
    let isValid = false;
    try {
      isValid = verifyPassword(password, user.password);
    } catch (pwdError) {
      console.error('Password verification error:', pwdError);
      return NextResponse.json(
        { success: false, message: 'Kesalahan verifikasi password' },
        { status: 500 }
      );
    }
    
    if (!isValid) {
      return NextResponse.json(
        { success: false, message: 'Username atau password salah' },
        { status: 401 }
      );
    }

    // Create session
    let token;
    try {
      token = await createSession({
        id: user.id,
        username: user.username,
        nama: user.nama,
        role: user.role,
        pegawaiId: user.pegawaiId,
      });
    } catch (sessionError) {
      console.error('Session creation error:', sessionError);
      return NextResponse.json(
        {
          success: false,
          message: 'Gagal membuat sesi',
          detail: 'Tidak dapat membuat sesi login. Coba lagi nanti.'
        },
        { status: 500 }
      );
    }

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
    const errorStack = error instanceof Error ? error.stack : '';
    const isDatabaseError = errorMessage.includes('ECONNREFUSED') ||
                            errorMessage.includes('PrismaClientInitializationError') ||
                            errorMessage.includes('getaddrinfo') ||
                            errorMessage.includes('P1001') ||
                            errorMessage.includes('P1002') ||
                            errorMessage.includes('P1003');
    
    console.error('Login error:', errorMessage);
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
