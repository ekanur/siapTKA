import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || !["ADMIN", "GURU"].includes(userRole)) {
      return NextResponse.json({ success: false, error: "Akses tidak sah." }, { status: 401 });
    }

    const classes = await prisma.kelas.findMany({
      include: {
        siswa: {
          select: {
            id: true,
            statusTka: true,
            statusAkun: true,
          },
        },
      },
      orderBy: { nama: "asc" },
    });

    const formattedClasses = classes.map((k) => {
      const totalSiswa = k.siswa.length;
      const ikut = k.siswa.filter((s) => s.statusTka === "IKUT").length;
      const tidakIkut = k.siswa.filter((s) => s.statusTka === "TIDAK_IKUT").length;
      const belumRespons = k.siswa.filter((s) => !s.statusTka || s.statusTka === "BELUM_MERESPONS").length;
      const percent = totalSiswa > 0 ? Math.round(((ikut + tidakIkut) / totalSiswa) * 100) : 0;

      return {
        id: k.id,
        nama: k.nama,
        tingkat: k.tingkat,
        jurusan: k.jurusan,
        totalSiswa,
        ikut,
        tidakIkut,
        belumRespons,
        percentKonfirmasi: percent,
        statusKesiapan: percent === 100 ? "TUNTAS" : percent >= 80 ? "CUKUP" : "PERLU_TINDAK_LANJUT",
      };
    });

    return NextResponse.json({
      success: true,
      classes: formattedClasses,
    });
  } catch (error: any) {
    console.error("GET Kelas Error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat data kelas." }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Khusus Administrator." }, { status: 403 });
    }

    const body = await request.json();
    const { nama, tingkat, jurusan } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json({ success: false, error: "Nama kelas wajib diisi (contoh: 13 SIJA A)." }, { status: 400 });
    }

    const cleanNama = nama.trim().toUpperCase();

    const existing = await prisma.kelas.findUnique({
      where: { nama: cleanNama },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: `Kelas ${cleanNama} sudah terdaftar.` }, { status: 400 });
    }

    // Auto extract jurusan from name if not provided (e.g. "13 SIJA A" -> "SIJA")
    let detectedJurusan = jurusan ? jurusan.trim().toUpperCase() : "";
    if (!detectedJurusan) {
      const parts = cleanNama.split(" ");
      detectedJurusan = parts.length > 1 ? parts[1] : "SIJA";
    }

    const created = await prisma.kelas.create({
      data: {
        nama: cleanNama,
        tingkat: Number(tingkat) || 13,
        jurusan: detectedJurusan,
      },
    });

    return NextResponse.json({
      success: true,
      kelas: created,
      message: `Kelas ${created.nama} berhasil ditambahkan.`,
    });
  } catch (error: any) {
    console.error("POST Kelas Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal menambah kelas." }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Khusus Administrator." }, { status: 403 });
    }

    const body = await request.json();
    const { id, nama, tingkat, jurusan } = body;

    if (!id || !nama || !nama.trim()) {
      return NextResponse.json({ success: false, error: "ID dan Nama kelas wajib diisi." }, { status: 400 });
    }

    const cleanNama = nama.trim().toUpperCase();

    const updated = await prisma.kelas.update({
      where: { id },
      data: {
        nama: cleanNama,
        tingkat: Number(tingkat) || 13,
        jurusan: jurusan ? jurusan.trim().toUpperCase() : undefined,
      },
    });

    // Also update cached namaKelas on associated students
    await prisma.siswa.updateMany({
      where: { kelasId: id },
      data: { namaKelas: cleanNama },
    });

    return NextResponse.json({
      success: true,
      kelas: updated,
      message: `Kelas ${updated.nama} berhasil diperbarui.`,
    });
  } catch (error: any) {
    console.error("PUT Kelas Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal memperbarui kelas." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Khusus Administrator." }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID kelas diperlukan." }, { status: 400 });
    }

    // Unassign students from this class before deletion
    await prisma.siswa.updateMany({
      where: { kelasId: id },
      data: { kelasId: null, namaKelas: null },
    });

    await prisma.kelas.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Kelas berhasil dihapus. Siswa terkait telah dialihkan ke status tanpa kelas.",
    });
  } catch (error: any) {
    console.error("DELETE Kelas Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal menghapus kelas." }, { status: 500 });
  }
}

