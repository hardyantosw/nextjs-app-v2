import { NextRequest, NextResponse } from 'next/server';
import { deleteSession, getTokenFromRequest, createLogoutCookie } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const token = getTokenFromRequest(request);

    if (token) {
      await deleteSession(token);
    }

    const response = NextResponse.json({
      success: true,
      message: 'Logout berhasil',
    });

    // Clear session cookie
    response.headers.set('Set-Cookie', createLogoutCookie());

    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
