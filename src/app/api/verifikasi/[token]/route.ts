import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

/**
 * GET /api/verifikasi/[token]
 * Public verification endpoint.
 * Works for both signed documents and TTE stamp records.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    const dokumen = await db.dokumen.findUnique({
      where: { tokenVerifikasi: token },
      include: {
        pegawai: true,
      },
    });

    if (!dokumen) {
      return NextResponse.json(
        { error: 'Dokumen tidak ditemukan atau token verifikasi tidak valid' },
        { status: 404 }
      );
    }

    const isStamp = dokumen.status === 'tte_stamp';

    // Check if expired
    const isExpired = !dokumen.aktifSelamanya &&
      dokumen.tanggalExpired &&
      new Date() > new Date(dokumen.tanggalExpired);

    if (isStamp) {
      return NextResponse.json({
        data: {
          isStamp: true,
          pegawai: {
            nama: dokumen.pegawai.nama,
            nip: dokumen.pegawai.nip,
            jabatan: dokumen.pegawai.jabatan,
            opd: dokumen.pegawai.opd,
          },
          tglTtd: dokumen.tglTtd,
          status: dokumen.status,
          isExpired: isExpired || false,
          aktifSelamanya: dokumen.aktifSelamanya,
          tanggalExpired: dokumen.tanggalExpired,
          keterangan: dokumen.keterangan,
        },
      });
    }

    // Regular signed document verification
    return NextResponse.json({
      data: {
        isStamp: false,
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
    console.error('Error verifying dokumen:', error);
    return NextResponse.json(
      { error: 'Gagal memverifikasi dokumen' },
      { status: 500 }
    );
  }
}
