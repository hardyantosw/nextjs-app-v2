import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getSession, getTokenFromRequest } from '@/lib/auth';
import {
  calculateBufferHash,
  generateUniqueFilename,
  ensureUploadsDir,
} from '@/lib/tte-utils';
import { uploadFile, deleteFile } from '@/lib/storage';

/**
 * GET /api/dokumen/[id]
 * Get single document by ID with pegawai relation
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const dokumen = await db.dokumen.findUnique({
      where: { id },
      include: {
        pegawai: true,
      },
    });

    if (!dokumen) {
      return NextResponse.json(
        { error: 'Dokumen tidak ditemukan' },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: dokumen });
  } catch (error) {
    console.error('Error getting dokumen:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data dokumen' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/dokumen/[id]
 * Update a pending document with form data and signed file.
 * Changes status from 'pending' to 'signed'.
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Auth check
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }
    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Sesi berakhir' }, { status: 401 });
    }

    // Find the document
    const existingDoc = await db.dokumen.findUnique({ where: { id } });
    if (!existingDoc) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 });
    }

    // Only pending documents can be updated
    if (existingDoc.status !== 'pending') {
      return NextResponse.json(
        { error: 'Hanya dokumen berstatus pending yang dapat diperbarui' },
        { status: 400 }
      );
    }

    // Authorization: pegawai can only update their own documents
    if (session.role === 'pegawai' && existingDoc.pegawaiId !== session.pegawaiId) {
      return NextResponse.json({ error: 'Tidak memiliki akses' }, { status: 403 });
    }

    ensureUploadsDir();

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const judulDokumen = formData.get('judulDokumen') as string | null;
    const aktifSelamanya = formData.get('aktifSelamanya') as string | null;
    const tanggalExpired = formData.get('tanggalExpired') as string | null;
    const keterangan = formData.get('keterangan') as string | null;
    const tembusan = formData.get('tembusan') as string | null;

    if (!file) {
      return NextResponse.json(
        { error: 'File yang ditandatangani wajib diunggah' },
        { status: 400 }
      );
    }

    if (!judulDokumen?.trim()) {
      return NextResponse.json(
        { error: 'Judul dokumen wajib diisi' },
        { status: 400 }
      );
    }

    // Save uploaded file
    const signedFilename = generateUniqueFilename(file.name);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const signedPath = await uploadFile(`signed/${signedFilename}`, fileBuffer, { contentType: 'application/pdf' });

    // Calculate hash
    const hashFile = calculateBufferHash(fileBuffer);

    // Update document
    const dokumen = await db.dokumen.update({
      where: { id },
      data: {
        namaFile: file.name,
        judulDokumen: judulDokumen.trim(),
        pathFileAsli: signedPath,
        pathFileTtd: signedPath,
        hashFile,
        status: 'signed',
        tglTtd: new Date(),
        aktifSelamanya: aktifSelamanya === 'true',
        tanggalExpired: aktifSelamanya !== 'true' && tanggalExpired ? new Date(tanggalExpired) : null,
        keterangan: keterangan?.trim() || null,
        tembusan: tembusan?.trim() || null,
      },
      include: {
        pegawai: true,
      },
    });

    return NextResponse.json({ data: dokumen });
  } catch (error) {
    console.error('Error updating dokumen:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui dokumen' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/dokumen/[id]
 * Delete a document and its files
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Auth check
    const token = getTokenFromRequest(request);
    if (!token) {
      return NextResponse.json({ error: 'Tidak terautentikasi' }, { status: 401 });
    }
    const session = await getSession(token);
    if (!session) {
      return NextResponse.json({ error: 'Sesi berakhir' }, { status: 401 });
    }

    // Find the document
    const dokumen = await db.dokumen.findUnique({ where: { id } });
    if (!dokumen) {
      return NextResponse.json({ error: 'Dokumen tidak ditemukan' }, { status: 404 });
    }

    // Authorization: pegawai can only delete their own, admin can delete any
    if (session.role === 'pegawai' && dokumen.pegawaiId !== session.pegawaiId) {
      return NextResponse.json({ error: 'Tidak memiliki akses' }, { status: 403 });
    }

    // Clean up files
    try {
      if (dokumen.pathFileAsli && fs.existsSync(dokumen.pathFileAsli)) {
        fs.unlinkSync(dokumen.pathFileAsli);
      }
      if (dokumen.pathFileTtd && fs.existsSync(dokumen.pathFileTtd)) {
        fs.unlinkSync(dokumen.pathFileTtd);
      }
      if (dokumen.pathFileAsli) {
        await deleteFile(dokumen.pathFileAsli).catch(() => {
          // Silently ignore if file doesn't exist
        });
      }
      if (dokumen.pathFileTtd) {
        await deleteFile(dokumen.pathFileTtd).catch(() => {
          // Silently ignore if file doesn't exist
        });
      }
      // Clean up QR code
      await deleteFile(`qrcodes/${dokumen.tokenVerifikasi}.png`).catch(() => {
        // Silently ignore if file doesn't exist
      });
      // Clean up TTE stamp/image
      await deleteFile(`tte-images/${dokumen.tokenVerifikasi}.png`).catch(() => {
        // Silently ignore if file doesn't exist
      });
    } catch (error) {
      console.warn('Error cleaning dokumen files:', error);
    }

    // Delete from database
    await db.dokumen.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting dokumen:', error);
    return NextResponse.json(
      { error: 'Gagal menghapus dokumen' },
      { status: 500 }
    );
  }
}
