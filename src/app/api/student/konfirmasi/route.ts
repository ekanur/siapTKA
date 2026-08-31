import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await request.json();

    const { statusTka, mapelPilihan1, mapelPilihan2, studentId } = body;
    const targetId = session?.user ? (session.user as any).id : studentId;

    if (!targetId) {
      return NextResponse.json({ success: false, error: "Akses tidak sah" }, { status: 401 });
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