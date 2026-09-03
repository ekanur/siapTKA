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
      pesanPengumuman: settings?.pesanPengumuman || "Batas pengumpulan surat pernyataan dan perubahan pilihan TKA adalah 10 September 2026.",
      jadwalTka: {
        batasSuratPernyataan: settings?.batasSuratPernyataan || "10 September 2026",
        pendaftaranSistemTka: settings?.pendaftaranSistemTka || "27 Juli – 27 September 2026 (* dilakukan sekolah)",
        simulasiTka: settings?.simulasiTka || "21 – 27 September 2026",
        gladiBersihTka: settings?.gladiBersihTka || "5 – 18 Oktober 2026",
        pelaksanaanGel1: settings?.pelaksanaanGel1 || "26 – 29 Oktober 2026",
        pelaksanaanGel2: settings?.pelaksanaanGel2 || "2 – 5 November 2026",
      },
    });
  } catch (error: any) {
    console.error("GET Public Lini Masa Error:", error);
    return NextResponse.json({
      success: true,
      isKonfirmasiOpen: true,
      isWithinPeriod: true,
      tanggalMulai: null,
      tanggalSelesai: null,
      pesanPengumuman: "Batas pengumpulan surat pernyataan dan perubahan pilihan TKA adalah 10 September 2026.",
      jadwalTka: {
        batasSuratPernyataan: "10 September 2026",
        pendaftaranSistemTka: "27 Juli – 27 September 2026 (* dilakukan sekolah)",
        simulasiTka: "21 – 27 September 2026",
        gladiBersihTka: "5 – 18 Oktober 2026",
        pelaksanaanGel1: "26 – 29 Oktober 2026",
        pelaksanaanGel2: "2 – 5 November 2026",
      },
    });
  }
}
