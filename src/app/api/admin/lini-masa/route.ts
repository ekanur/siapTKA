import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let settings = await prisma.pengaturanTka.findUnique({
      where: { id: "default" },
    });

    if (!settings) {
      settings = await prisma.pengaturanTka.create({
        data: {
          id: "default",
          isKonfirmasiOpen: true,
          tanggalMulai: new Date(),
          tanggalSelesai: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          pesanPengumuman: "Periode konfirmasi keikutsertaan TKA dan pemilihan 2 mata pelajaran pilihan sedang berlangsung.",
        },
      });
    }

    return NextResponse.json({ success: true, settings });
  } catch (error: any) {
    console.error("GET Lini Masa Error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat pengaturan lini masa" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Akses ditolak. Khusus Administrator." }, { status: 403 });
    }

    const body = await request.json();
    const { isKonfirmasiOpen, tanggalMulai, tanggalSelesai, pesanPengumuman } = body;

    const updated = await prisma.pengaturanTka.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        isKonfirmasiOpen: Boolean(isKonfirmasiOpen),
        tanggalMulai: tanggalMulai ? new Date(tanggalMulai) : null,
        tanggalSelesai: tanggalSelesai ? new Date(tanggalSelesai) : null,
        pesanPengumuman: pesanPengumuman || "",
      },
      update: {
        isKonfirmasiOpen: Boolean(isKonfirmasiOpen),
        tanggalMulai: tanggalMulai ? new Date(tanggalMulai) : null,
        tanggalSelesai: tanggalSelesai ? new Date(tanggalSelesai) : null,
        pesanPengumuman: pesanPengumuman || "",
      },
    });

    return NextResponse.json({
      success: true,
      settings: updated,
      message: "Pengaturan lini masa konfirmasi TKA berhasil diperbarui.",
    });
  } catch (error: any) {
    console.error("POST Lini Masa Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal menyimpan pengaturan" }, { status: 500 });
  }
}
