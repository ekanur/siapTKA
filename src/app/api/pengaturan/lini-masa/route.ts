import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.pengaturanTka.findUnique({
      where: { id: "default" },
    });

    const now = new Date();
    let isWithinPeriod = true;

    if (settings) {
      if (!settings.isKonfirmasiOpen) {
        isWithinPeriod = false;
      }
      if (settings.tanggalMulai && now < new Date(settings.tanggalMulai)) {
        isWithinPeriod = false;
      }
      if (settings.tanggalSelesai && now > new Date(settings.tanggalSelesai)) {
        isWithinPeriod = false;
      }
    }

    return NextResponse.json({
      success: true,
      isKonfirmasiOpen: settings ? settings.isKonfirmasiOpen : true,
      isWithinPeriod,
      tanggalMulai: settings?.tanggalMulai || null,
      tanggalSelesai: settings?.tanggalSelesai || null,
      pesanPengumuman: settings?.pesanPengumuman || "Periode konfirmasi keikutsertaan TKA sedang dibuka.",
    });
  } catch (error: any) {
    console.error("GET Public Lini Masa Error:", error);
    return NextResponse.json({
      success: true,
      isKonfirmasiOpen: true,
      isWithinPeriod: true,
      tanggalMulai: null,
      tanggalSelesai: null,
      pesanPengumuman: "Periode konfirmasi keikutsertaan TKA dibuka.",
    });
  }
}
