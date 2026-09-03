import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Akses tidak sah" }, { status: 401 });
    }

    const student = await prisma.siswa.findUnique({
      where: { id: userId },
      select: {
        id: true,
        nis: true,
        nama: true,
        email: true,
        jurusan: true,
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

    return NextResponse.json({ success: true, student });
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

    if (!targetId) {
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

    const student = await prisma.siswa.findUnique({
      where: { id: targetId },
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