import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusTka = searchParams.get("statusTka");
    const industri = searchParams.get("industri");
    const search = searchParams.get("search");

    const where: any = {};
    if (statusTka) where.statusTka = statusTka;
    if (industri) where.namaIndustriPkl = { contains: industri };
    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { nis: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const students = await prisma.siswa.findMany({
      where,
      include: {
        _count: {
          select: { progres: true },
        },
      },
      orderBy: { nis: "asc" },
    });

    return NextResponse.json({ success: true, count: students.length, students });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Gagal memuat data siswa" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { students } = body; // Array of { nis, nama, email, jurusan, namaIndustriPkl }

    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ success: false, error: "Data siswa CSV kosong" }, { status: 400 });
    }

    let insertedCount = 0;
    for (const s of students) {
      if (!s.nis || !s.email || !s.nama) continue;
      await prisma.siswa.upsert({
        where: { nis: String(s.nis).trim() },
        create: {
          nis: String(s.nis).trim(),
          nama: String(s.nama).trim(),
          email: String(s.email).trim().toLowerCase(),
          jurusan: s.jurusan || "SIJA",
          namaIndustriPkl: s.namaIndustriPkl || "Belum Ditentukan",
          statusAkun: "BELUM_AKTIF",
          statusTka: "BELUM_MERESPONS",
        },
        update: {
          nama: String(s.nama).trim(),
          email: String(s.email).trim().toLowerCase(),
          namaIndustriPkl: s.namaIndustriPkl || "Belum Ditentukan",
        },
      });
      insertedCount++;
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil mengimpor/memperbarui ${insertedCount} data siswa.`,
      count: insertedCount,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal impor siswa" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, statusTka, mapelPilihan1, mapelPilihan2, namaIndustriPkl } = body;

    if (!id) return NextResponse.json({ success: false, error: "ID siswa wajib ada" }, { status: 400 });

    const updateData: any = {};
    if (statusTka !== undefined) updateData.statusTka = statusTka;
    if (mapelPilihan1 !== undefined) updateData.mapelPilihan1 = mapelPilihan1;
    if (mapelPilihan2 !== undefined) updateData.mapelPilihan2 = mapelPilihan2;
    if (namaIndustriPkl !== undefined) updateData.namaIndustriPkl = namaIndustriPkl;

    const updated = await prisma.siswa.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, student: updated, message: "Data siswa berhasil di-override admin." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Gagal memperbarui status siswa" }, { status: 500 });
  }
}