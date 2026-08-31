import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");
    const mapel = searchParams.get("mapel");

    const where: any = {};
    if (status) where.status = status;
    if (mapel) where.mapel = mapel.toUpperCase();

    const list = await prisma.soal.findMany({
      where,
      include: {
        kisiKisi: {
          select: {
            topik: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({ success: true, count: list.length, soal: list });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Gagal memuat daftar soal" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, pertanyaan, opsiJawaban, kunciJawaban, pembahasan } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID soal wajib disertakan" }, { status: 400 });
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (pertanyaan !== undefined) updateData.pertanyaan = pertanyaan;
    if (opsiJawaban !== undefined) updateData.opsiJawaban = typeof opsiJawaban === "string" ? opsiJawaban : JSON.stringify(opsiJawaban);
    if (kunciJawaban !== undefined) updateData.kunciJawaban = typeof kunciJawaban === "string" ? kunciJawaban : JSON.stringify(kunciJawaban);
    if (pembahasan !== undefined) updateData.pembahasan = pembahasan;

    const updated = await prisma.soal.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      soal: updated,
      message: `Status soal berhasil diubah menjadi ${updated.status}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Gagal memperbarui data soal" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID soal wajib ada" }, { status: 400 });

    await prisma.soal.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Soal berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Gagal menghapus soal" }, { status: 500 });
  }
}