import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { randomUUID } from 'crypto';

/**
 * GET /api/pengaturan
 * Return current pengaturan. If no record exists, create one.
 */
export async function GET() {
  try {
    let pengaturan = await db.pengaturan.findFirst();

    if (!pengaturan) {
      pengaturan = await db.pengaturan.create({
        data: {
          id: randomUUID(),
          updatedAt: new Date(),
        },
      });
    }

    return NextResponse.json({ data: pengaturan });
  } catch (error) {
    console.error('Error fetching pengaturan:', error);
    return NextResponse.json(
      { error: 'Gagal mengambil data pengaturan' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/pengaturan
 * Update pengaturan (judul, subJudul, logo path, headerLogoPath, etc.)
 */
export async function PUT(request: NextRequest) {
  try {
    let pengaturan = await db.pengaturan.findFirst();

    if (!pengaturan) {
      pengaturan = await db.pengaturan.create({
        data: {
          id: randomUUID(),
          updatedAt: new Date(),
        },
      });
    }

    const body = await request.json();
    const { judul, subJudul, logoPath, headerLogoPath } = body;

    const updated = await db.pengaturan.update({
      where: { id: pengaturan.id },
      data: {
        ...(judul !== undefined && { judul }),
        ...(subJudul !== undefined && { subJudul }),
        ...(logoPath !== undefined && { logoPath }),
        ...(headerLogoPath !== undefined && { headerLogoPath }),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('Error updating pengaturan:', error);
    return NextResponse.json(
      { error: 'Gagal memperbarui data pengaturan' },
      { status: 500 }
    );
  }
}
