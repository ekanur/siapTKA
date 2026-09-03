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
    if (statusTka && statusTka !== "ALL") where.statusTka = statusTka;
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

    // 1. Single Student Add Manual
    if (body.student) {
      const s = body.student;
      if (!s.nis || !s.nama || !s.email) {
        return NextResponse.json({ success: false, error: "NIS, Nama, dan Email wajib diisi." }, { status: 400 });
      }

      // Check unique
      const existing = await prisma.siswa.findFirst({
        where: {
          OR: [{ nis: String(s.nis).trim() }, { email: String(s.email).trim().toLowerCase() }],
        },
      });
      if (existing) {
        return NextResponse.json({ success: false, error: "NIS atau Email siswa sudah terdaftar." }, { status: 400 });
      }

      const created = await prisma.siswa.create({
        data: {
          nis: String(s.nis).trim(),
          nama: String(s.nama).trim(),
          email: String(s.email).trim().toLowerCase(),
          jurusan: s.jurusan || "SIJA",
          namaIndustriPkl: s.namaIndustriPkl || "Belum Ditentukan",
          statusAkun: "BELUM_AKTIF",
          statusTka: s.statusTka || "BELUM_MERESPONS",
          mapelPilihan1: s.mapelPilihan1 || null,
          mapelPilihan2: s.mapelPilihan2 || null,
        },
      });

      return NextResponse.json({
        success: true,
        student: created,
        message: `Siswa ${created.nama} berhasil ditambahkan.`,
      });
    }

    // 2. Batch CSV Import
    const { students } = body;
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
    return NextResponse.json({ success: false, error: error.message || "Gagal menyimpan data siswa" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, nis, nama, email, jurusan, namaIndustriPkl, statusAkun, statusTka, mapelPilihan1, mapelPilihan2 } = body;

    if (!id) return NextResponse.json({ success: false, error: "ID siswa wajib ada" }, { status: 400 });

    const updateData: any = {};
    if (nis !== undefined) updateData.nis = String(nis).trim();
    if (nama !== undefined) updateData.nama = String(nama).trim();
    if (email !== undefined) updateData.email = String(email).trim().toLowerCase();
    if (jurusan !== undefined) updateData.jurusan = jurusan;
    if (namaIndustriPkl !== undefined) updateData.namaIndustriPkl = namaIndustriPkl;
    if (statusAkun !== undefined) updateData.statusAkun = statusAkun;
    if (statusTka !== undefined) updateData.statusTka = statusTka;
    if (mapelPilihan1 !== undefined) updateData.mapelPilihan1 = mapelPilihan1;
    if (mapelPilihan2 !== undefined) updateData.mapelPilihan2 = mapelPilihan2;

    const updated = await prisma.siswa.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, student: updated, message: "Data siswa berhasil diperbarui." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Gagal memperbarui data siswa" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ success: false, error: "ID siswa wajib ada" }, { status: 400 });

    await prisma.siswa.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Data siswa berhasil dihapus." });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal menghapus siswa" }, { status: 500 });
  }
}