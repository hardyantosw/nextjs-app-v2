import { NextResponse } from 'next/server';

/**
 * Debug endpoint to check environment variables
 * Only shows whether variables are set, not their values
 */
export async function GET() {
  // Don't expose actual values, just check if they exist
  const envStatus = {
    NODE_ENV: process.env.NODE_ENV || 'not set',
    VERCEL: process.env.VERCEL || 'not set',
    DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set',
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ? 'set' : 'not set',
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(envStatus);
}
