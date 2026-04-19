import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { calculateBufferHash } from '@/lib/tte-utils';

/**
 * POST /api/verifikasi/cek
 * Verify a document file by uploading it and comparing hash
 * against all signed documents in the database.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'File wajib diunggah' },
        { status: 400 }
      );
    }

    // Calculate SHA-256 hash of uploaded file
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const uploadedHash = calculateBufferHash(fileBuffer);

    // Search for a matching document by hash (only signed documents, not tte_stamp)
    const dokumen = await db.dokumen.findFirst({
      where: {
        hashFile: uploadedHash,
        status: 'signed',
      },
      include: {
        pegawai: true,
      },
    });

    if (!dokumen) {
      return NextResponse.json({
        valid: false,
        message: 'Dokumen tidak valid. File tidak terdaftar dalam sistem TTE atau telah dimodifikasi.',
      });
    }

    // Check if expired
    const isExpired = !dokumen.aktifSelamanya &&
      dokumen.tanggalExpired &&
      new Date() > new Date(dokumen.tanggalExpired);

    return NextResponse.json({
      valid: true,
      message: isExpired
        ? 'Dokumen terverifikasi namun telah kedaluwarsa.'
        : 'Dokumen valid. File sesuai dengan dokumen yang ditandatangani secara elektronik.',
      data: {
        namaFile: dokumen.namaFile,
        judulDokumen: dokumen.judulDokumen,
        pegawai: {
          nama: dokumen.pegawai.nama,
          nip: dokumen.pegawai.nip,
          jabatan: dokumen.pegawai.jabatan,
          opd: dokumen.pegawai.opd,
        },
        tglTtd: dokumen.tglTtd,
        status: dokumen.status,
        hashFile: dokumen.hashFile,
        isExpired: isExpired || false,
        aktifSelamanya: dokumen.aktifSelamanya,
        tanggalExpired: dokumen.tanggalExpired,
        keterangan: dokumen.keterangan,
        tembusan: dokumen.tembusan,
      },
    });
  } catch (error) {
    console.error('Error checking dokumen hash:', error);
    return NextResponse.json(
      { error: 'Gagal memverifikasi file dokumen' },
      { status: 500 }
    );
  }
}
