import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const statusTka = searchParams.get("statusTka");
    const industri = searchParams.get("industri");
    const search = searchParams.get("search");
    const kelas = searchParams.get("kelas");

    const where: any = {};
    if (statusTka && statusTka !== "ALL") where.statusTka = statusTka;
    if (industri) where.namaIndustriPkl = { contains: industri };
    if (kelas && kelas !== "ALL") {
      where.OR = [
        { kelasId: kelas },
        { namaKelas: kelas },
      ];
    }
    if (search) {
      const searchConditions = [
        { nama: { contains: search } },
        { nis: { contains: search } },
        { email: { contains: search } },
      ];
      if (where.OR) {
        where.AND = [
          { OR: where.OR },
          { OR: searchConditions },
        ];
        delete where.OR;
      } else {
        where.OR = searchConditions;
      }
    }

    const students = await prisma.siswa.findMany({
      where,
      include: {
        kelas: {
          select: { id: true, nama: true, jurusan: true },
        },
        _count: {
          select: { progres: true },
        },
      },
      orderBy: { nis: "asc" },
    });

    return NextResponse.json({ success: true, count: students.length, students });
  } catch (error) {
    console.error("GET Siswa Error:", error);
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

      let kelasId = s.kelasId || null;
      let namaKelas = s.namaKelas || null;

      if (kelasId && !namaKelas) {
        const k = await prisma.kelas.findUnique({ where: { id: kelasId } });
        if (k) namaKelas = k.nama;
      } else if (namaKelas && !kelasId) {
        const k = await prisma.kelas.findUnique({ where: { nama: namaKelas } });
        if (k) kelasId = k.id;
      }

      const created = await prisma.siswa.create({
        data: {
          nis: String(s.nis).trim(),
          nama: String(s.nama).trim(),
          email: String(s.email).trim().toLowerCase(),
          jurusan: s.jurusan || "SIJA",
          kelasId,
          namaKelas,
          namaIndustriPkl: s.namaIndustriPkl || "Belum Ditentukan",
          statusAkun: "BELUM_AKTIF",
          statusTka: s.statusTka || "BELUM_MERESPONS",
          mapelPilihan1: s.mapelPilihan1 || null,
          mapelPilihan2: s.mapelPilihan2 || null,
        },
        include: {
          kelas: true,
        },
      });

      return NextResponse.json({
        success: true,
        student: created,
        message: `Siswa ${created.nama} (${created.namaKelas || "Tanpa Kelas"}) berhasil ditambahkan.`,
      });
    }

    // 2. Batch CSV Import
    const { students } = body;
    if (!Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ success: false, error: "Data siswa CSV kosong" }, { status: 400 });
    }

    // Cache existing classes
    const existingClasses = await prisma.kelas.findMany();
    const classMap = new Map(existingClasses.map((k) => [k.nama.toUpperCase(), k]));

    let insertedCount = 0;
    for (const s of students) {
      if (!s.nis || !s.email || !s.nama) continue;

      let kelasId = null;
      let namaKelas = null;

      const rawKelas = (s.kelas || s.Kelas || s.KELAS || "").trim().toUpperCase();
      if (rawKelas) {
        if (classMap.has(rawKelas)) {
          const k = classMap.get(rawKelas)!;
          kelasId = k.id;
          namaKelas = k.nama;
        } else {
          // Auto create class if not existing with smart jurusan & tingkat detection
          let detectedJurusan = (s.jurusan || "").trim().toUpperCase();
          if (!detectedJurusan) {
            const parts = rawKelas.split(" ");
            detectedJurusan = parts.length > 1 ? parts[1] : "UMUM";
          }
          const tingkatMatch = rawKelas.match(/^(\d+)/);
          const detectedTingkat = tingkatMatch ? parseInt(tingkatMatch[1], 10) : 12;

          const newClass = await prisma.kelas.create({
            data: {
              nama: rawKelas,
              tingkat: detectedTingkat,
              jurusan: detectedJurusan,
            },
          });
          classMap.set(rawKelas, newClass);
          kelasId = newClass.id;
          namaKelas = newClass.nama;
        }
      }

      await prisma.siswa.upsert({
        where: { nis: String(s.nis).trim() },
        create: {
          nis: String(s.nis).trim(),
          nama: String(s.nama).trim(),
          email: String(s.email).trim().toLowerCase(),
          jurusan: s.jurusan || "SIJA",
          kelasId,
          namaKelas,
          namaIndustriPkl: s.namaIndustriPkl || "Belum Ditentukan",
          statusAkun: "BELUM_AKTIF",
          statusTka: "BELUM_MERESPONS",
        },
        update: {
          nama: String(s.nama).trim(),
          email: String(s.email).trim().toLowerCase(),
          jurusan: s.jurusan || undefined,
          kelasId: kelasId || undefined,
          namaKelas: namaKelas || undefined,
          namaIndustriPkl: s.namaIndustriPkl || undefined,
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
    const {
      id,
      nis,
      nama,
      email,
      jurusan,
      kelasId,
      namaKelas,
      namaIndustriPkl,
      statusAkun,
      statusTka,
      mapelPilihan1,
      mapelPilihan2,
    } = body;

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

    if (kelasId !== undefined) {
      updateData.kelasId = kelasId || null;
      if (kelasId) {
        const k = await prisma.kelas.findUnique({ where: { id: kelasId } });
        updateData.namaKelas = k ? k.nama : null;
      } else {
        updateData.namaKelas = null;
      }
    } else if (namaKelas !== undefined) {
      updateData.namaKelas = namaKelas || null;
    }

    const updated = await prisma.siswa.update({
      where: { id },
      data: updateData,
      include: {
        kelas: true,
      },
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