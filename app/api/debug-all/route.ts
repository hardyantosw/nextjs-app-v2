import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { fileExists, uploadFile, downloadFile, deleteFile } from '@/lib/storage';

/**
 * Comprehensive debug endpoint to test all functions
 */
export async function GET() {
  const results: Record<string, { status: 'ok' | 'error'; message: string; details?: unknown }> = {};

  // 1. Check Environment Variables
  try {
    const envCheck = {
      NODE_ENV: process.env.NODE_ENV || 'not set',
      VERCEL: process.env.VERCEL || 'not set',
      DATABASE_URL: process.env.DATABASE_URL ? 'set' : 'not set',
      BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN ? 'set' : 'not set',
    };
    results['environment'] = { status: 'ok', message: 'Environment variables checked', details: envCheck };
  } catch (error) {
    results['environment'] = { status: 'error', message: 'Failed to check environment', details: String(error) };
  }

  // 2. Test Database Connection
  try {
    const userCount = await db.user.count();
    const sessionCount = await db.session.count();
    const pegawaiCount = await db.pegawai.count();
    const dokumenCount = await db.dokumen.count();
    const bannerCount = await db.banner.count();
    const beritaCount = await db.berita.count();
    const pengaturanCount = await db.pengaturan.count();
    
    results['database'] = { 
      status: 'ok', 
      message: 'Database connection successful',
      details: { userCount, sessionCount, pegawaiCount, dokumenCount, bannerCount, beritaCount, pengaturanCount }
    };
  } catch (error) {
    results['database'] = { status: 'error', message: 'Database connection failed', details: String(error) };
  }

  // 3. Test Storage - File Exists Check
  try {
    const testPath = 'test/debug-test.txt';
    const exists = await fileExists(testPath);
    results['storage_exists'] = { 
      status: 'ok', 
      message: `File exists check works (result: ${exists})`,
      details: { testPath, exists }
    };
  } catch (error) {
    results['storage_exists'] = { status: 'error', message: 'File exists check failed', details: String(error) };
  }

  // 4. Test Storage - Upload
  try {
    const testContent = `Debug test file created at ${new Date().toISOString()}`;
    const testBuffer = Buffer.from(testContent);
    const uploadPath = await uploadFile('test/debug-test.txt', testBuffer, { contentType: 'text/plain' });
    
    results['storage_upload'] = { 
      status: 'ok', 
      message: 'File upload successful',
      details: { uploadPath }
    };
  } catch (error) {
    results['storage_upload'] = { status: 'error', message: 'File upload failed', details: String(error) };
  }

  // 5. Test Storage - Download
  try {
    const downloaded = await downloadFile('test/debug-test.txt');
    const content = downloaded.toString();
    
    results['storage_download'] = { 
      status: 'ok', 
      message: 'File download successful',
      details: { contentLength: content.length, preview: content.substring(0, 50) }
    };
  } catch (error) {
    results['storage_download'] = { status: 'error', message: 'File download failed', details: String(error) };
  }

  // 6. Test Storage - Delete
  try {
    await deleteFile('test/debug-test.txt');
    
    results['storage_delete'] = { 
      status: 'ok', 
      message: 'File delete successful'
    };
  } catch (error) {
    results['storage_delete'] = { status: 'error', message: 'File delete failed', details: String(error) };
  }

  // 7. Check Pengaturan (Logo paths)
  try {
    const pengaturan = await db.pengaturan.findFirst();
    results['pengaturan'] = { 
      status: 'ok', 
      message: 'Pengaturan check',
      details: {
        found: !!pengaturan,
        logoPath: pengaturan?.logoPath || null,
        headerLogoPath: pengaturan?.headerLogoPath || null
      }
    };
  } catch (error) {
    results['pengaturan'] = { status: 'error', message: 'Pengaturan check failed', details: String(error) };
  }

  // 8. Check Banners
  try {
    const banners = await db.banner.findMany({ take: 5 });
    results['banners'] = { 
      status: 'ok', 
      message: `Found ${banners.length} banners`,
      details: banners.map(b => ({ id: b.id, judul: b.judul, imagePath: b.imagePath }))
    };
  } catch (error) {
    results['banners'] = { status: 'error', message: 'Banner check failed', details: String(error) };
  }

  // 9. Check Berita
  try {
    const berita = await db.berita.findMany({ take: 5 });
    results['berita'] = { 
      status: 'ok', 
      message: `Found ${berita.length} berita`,
      details: berita.map(b => ({ id: b.id, judul: b.judul, imagePath: b.imagePath }))
    };
  } catch (error) {
    results['berita'] = { status: 'error', message: 'Berita check failed', details: String(error) };
  }

  // 10. Check Users
  try {
    const users = await db.user.findMany({
      select: { id: true, username: true, nama: true, role: true }
    });
    results['users'] = { 
      status: 'ok', 
      message: `Found ${users.length} users`,
      details: users
    };
  } catch (error) {
    results['users'] = { status: 'error', message: 'User check failed', details: String(error) };
  }

  // Determine overall status
  const hasErrors = Object.values(results).some(r => r.status === 'error');
  
  return NextResponse.json({
    status: hasErrors ? 'error' : 'ok',
    timestamp: new Date().toISOString(),
    results
  });
}
