import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

import { SUBJECT_ALIASES } from "@/lib/constants/subjects";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const userEmail = session?.user?.email ? session.user.email.toLowerCase().trim() : null;
    const userNis = (session?.user as any)?.nis;

    if (!userId && !userEmail) {
      return NextResponse.json({ success: false, error: "Akses tidak sah" }, { status: 401 });
    }

    const student = await prisma.siswa.findFirst({
      where: {
        OR: [
          ...(userId ? [{ id: userId }] : []),
          ...(userEmail ? [{ email: userEmail }] : []),
          ...(userNis ? [{ nis: userNis }] : []),
        ],
      },
      select: {
        id: true,
        nis: true,
        nama: true,
        email: true,
        jurusan: true,
        namaKelas: true,
        kelas: {
          select: {
            nama: true,
          },
        },
        namaIndustriPkl: true,
        statusTka: true,
        mapelPilihan1: true,
        mapelPilihan2: true,
        statusAkun: true,
        tanggalAktivasi: true,
      },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: "Data siswa tidak ditemukan" }, { status: 404 });
    }

    // Aggregate active questions count per mapel
    const groupedCounts = await prisma.soal.groupBy({
      by: ["mapel"],
      where: { status: "AKTIF" },
      _count: { id: true },
    });

    const mapelQuestionCounts: Record<string, number> = {};
    for (const item of groupedCounts) {
      const norm = item.mapel.replace(/-/g, "_").toUpperCase();
      mapelQuestionCounts[norm] = (mapelQuestionCounts[norm] || 0) + item._count.id;
    }

    // Expand aliases
    Object.entries(SUBJECT_ALIASES).forEach(([alias, canonical]) => {
      const canonicalCount = mapelQuestionCounts[canonical] || 0;
      const aliasCount = mapelQuestionCounts[alias] || 0;
      const maxCount = Math.max(canonicalCount, aliasCount);
      if (maxCount > 0) {
        mapelQuestionCounts[alias] = maxCount;
        mapelQuestionCounts[canonical] = maxCount;
      }
    });

    // Aggregate real student progress from progresLatihan (unique worked questions)
    const studentProgressRecords = await prisma.progresLatihan.findMany({
      where: { siswaId: student.id },
      select: {
        soalId: true,
        soal: {
          select: { mapel: true },
        },
      },
    });

    const mapelWorkedCounts: Record<string, number> = {};
    const seenSoalPerMapel: Record<string, Set<string>> = {};

    for (const record of studentProgressRecords) {
      const rawMapel = record.soal?.mapel || "";
      if (!rawMapel) continue;
      const norm = rawMapel.replace(/-/g, "_").toUpperCase();
      const canonical = SUBJECT_ALIASES[norm] || norm;

      if (!seenSoalPerMapel[canonical]) {
        seenSoalPerMapel[canonical] = new Set();
      }
      seenSoalPerMapel[canonical].add(record.soalId);
    }

    for (const [mapelKey, soalSet] of Object.entries(seenSoalPerMapel)) {
      mapelWorkedCounts[mapelKey] = soalSet.size;
    }

    // Expand aliases for worked counts
    Object.entries(SUBJECT_ALIASES).forEach(([alias, canonical]) => {
      const canonicalWorked = mapelWorkedCounts[canonical] || 0;
      const aliasWorked = mapelWorkedCounts[alias] || 0;
      const maxWorked = Math.max(canonicalWorked, aliasWorked);
      if (maxWorked > 0) {
        mapelWorkedCounts[alias] = maxWorked;
        mapelWorkedCounts[canonical] = maxWorked;
      }
    });

    const resolvedNamaKelas = student.namaKelas || student.kelas?.nama || null;

    return NextResponse.json({
      success: true,
      student: {
        ...student,
        namaKelas: resolvedNamaKelas,
      },
      mapelQuestionCounts,
      mapelWorkedCounts,
    });
  } catch (error: any) {
    console.error("GET Student Konfirmasi error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat status konfirmasi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const { statusTka, mapelPilihan1, mapelPilihan2, studentId } = body;
    const targetId = session?.user ? (session.user as any).id : studentId;
    const userEmail = session?.user?.email ? session.user.email.toLowerCase().trim() : null;
    const userNis = (session?.user as any)?.nis;

    if (!targetId && !userEmail) {
      return NextResponse.json({ success: false, error: "Akses tidak sah" }, { status: 401 });
    }

    // Check timeline deadline
    const settings = await prisma.pengaturanTka.findUnique({
      where: { id: "default" },
    });

    const now = new Date();
    if (settings) {
      if (!settings.isKonfirmasiOpen) {
        return NextResponse.json(
          { success: false, error: "Periode konfirmasi atau pengubahan pilihan TKA sedang ditutup oleh pihak sekolah." },
          { status: 403 }
        );
      }
      if (settings.tanggalMulai && now < new Date(settings.tanggalMulai)) {
        return NextResponse.json(
          { success: false, error: "Periode pendaftaran konfirmasi TKA belum dimulai." },
          { status: 403 }
        );
      }
      if (settings.tanggalSelesai && now > new Date(settings.tanggalSelesai)) {
        return NextResponse.json(
          {
            success: false,
            error: `Batas waktu pengumpulan surat pernyataan dan perubahan pilihan TKA telah berakhir pada ${
              settings.batasSuratPernyataan || "10 September 2026"
            }.`,
          },
          { status: 403 }
        );
      }
    }

    const student = await prisma.siswa.findFirst({
      where: {
        OR: [
          ...(targetId ? [{ id: targetId }] : []),
          ...(userEmail ? [{ email: userEmail }] : []),
          ...(userNis ? [{ nis: userNis }] : []),
        ],
      },
    });

    if (!student) {
      return NextResponse.json({ success: false, error: "Data siswa tidak ditemukan" }, { status: 404 });
    }

    // Update confirmation
    const updated = await prisma.siswa.update({
      where: { id: student.id },
      data: {
        statusTka: statusTka || "BELUM_MERESPONS",
        mapelPilihan1: statusTka === "IKUT" ? mapelPilihan1 : null,
        mapelPilihan2: statusTka === "IKUT" ? mapelPilihan2 : null,
        statusAkun: "AKTIF",
        tanggalAktivasi: student.tanggalAktivasi || new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Konfirmasi keikutsertaan TKA berhasil disimpan.",
      student: {
        id: updated.id,
        nama: updated.nama,
        statusTka: updated.statusTka,
        mapelPilihan1: updated.mapelPilihan1,
        mapelPilihan2: updated.mapelPilihan2,
        namaKelas: updated.namaKelas,
      },
    });
  } catch (error: any) {
    console.error("Konfirmasi TKA error:", error);
    return NextResponse.json(
      { success: false, error: "Terjadi kesalahan saat menyimpan konfirmasi" },
      { status: 500 }
    );
  }
}