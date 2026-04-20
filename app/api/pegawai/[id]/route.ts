import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, getTokenFromRequest } from '@/lib/auth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// Helper to check authentication
async function checkAuth(request: NextRequest) {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return await getSession(token);
}

// GET /api/pegawai/[id] - Get single pegawai by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await checkAuth(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    const { id } = await params;

    const pegawai = await db.pegawai.findUnique({
      where: { id },
      include: {
        dokumen: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            namaFile: true,
            status: true,
            tglTtd: true,
            createdAt: true,
          },
        },
        _count: {
          select: { dokumen: true },
        },
      },
    });

    if (!pegawai) {
      return NextResponse.json(
        { success: false, message: 'Pegawai tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: pegawai.id,
        nama: pegawai.nama,
        nip: pegawai.nip,
        jabatan: pegawai.jabatan,
        opd: pegawai.opd,
        statusAktif: pegawai.statusAktif,
        createdAt: pegawai.createdAt,
        updatedAt: pegawai.updatedAt,
        totalDokumen: pegawai._count.dokumen,
        dokumen: pegawai.dokumen,
      },
    });
  } catch (error) {
    console.error('Get pegawai detail error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// PUT /api/pegawai/[id] - Update pegawai
export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await checkAuth(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if pegawai exists
    const existingPegawai = await db.pegawai.findUnique({
      where: { id },
    });

    if (!existingPegawai) {
      return NextResponse.json(
        { success: false, message: 'Pegawai tidak ditemukan' },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { nama, nip, jabatan, opd, statusAktif } = body;

    // If NIP is being changed, check for uniqueness
    if (nip && nip !== existingPegawai.nip) {
      const nipExists = await db.pegawai.findUnique({
        where: { nip },
      });
      if (nipExists) {
        return NextResponse.json(
          { success: false, message: 'NIP sudah terdaftar' },
          { status: 409 }
        );
      }
    }

    // Build update data (only include fields that are provided)
    const updateData: Record<string, unknown> = {};
    if (nama !== undefined) updateData.nama = nama;
    if (nip !== undefined) updateData.nip = nip;
    if (jabatan !== undefined) updateData.jabatan = jabatan;
    if (opd !== undefined) updateData.opd = opd;
    if (statusAktif !== undefined) updateData.statusAktif = statusAktif;

    const pegawai = await db.pegawai.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      message: 'Pegawai berhasil diperbarui',
      data: pegawai,
    });
  } catch (error) {
    console.error('Update pegawai error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}

// DELETE /api/pegawai/[id] - Delete pegawai
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await checkAuth(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: 'Tidak terautentikasi' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if pegawai exists
    const existingPegawai = await db.pegawai.findUnique({
      where: { id },
      include: {
        _count: {
          select: { dokumen: true },
        },
      },
    });

    if (!existingPegawai) {
      return NextResponse.json(
        { success: false, message: 'Pegawai tidak ditemukan' },
        { status: 404 }
      );
    }

    // Check if pegawai has associated documents
    if (existingPegawai._count.dokumen > 0) {
      return NextResponse.json(
        {
          success: false,
          message: `Pegawai tidak dapat dihapus karena masih memiliki ${existingPegawai._count.dokumen} dokumen terkait`,
        },
        { status: 409 }
      );
    }

    // Delete pegawai
    await db.pegawai.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Pegawai berhasil dihapus',
    });
  } catch (error) {
    console.error('Delete pegawai error:', error);
    return NextResponse.json(
      { success: false, message: 'Terjadi kesalahan pada server' },
      { status: 500 }
    );
  }
}
