import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * Debug endpoint to check database connectivity
 */
export async function GET() {
  try {
    // Check if DATABASE_URL is set
    const dbUrl = process.env.DATABASE_URL;
    
    if (!dbUrl) {
      return NextResponse.json({
        status: 'error',
        message: 'DATABASE_URL not configured',
        details: 'Set DATABASE_URL in Vercel Environment Variables'
      }, { status: 503 });
    }

    // Try to connect and run a simple query
    const userCount = await db.user.count();
    const sessionCount = await db.session.count();
    
    return NextResponse.json({
      status: 'ok',
      message: 'Database connection successful',
      details: {
        userCount,
        sessionCount,
        databaseUrlPrefix: dbUrl.substring(0, 20) + '...',
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return NextResponse.json({
      status: 'error',
      message: 'Database connection failed',
      details: errorMessage
    }, { status: 503 });
  }
}
