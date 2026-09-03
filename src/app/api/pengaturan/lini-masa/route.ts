import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import {
  formatDateIndo,
  formatDateRangeIndo,
  getMilestoneStatus,
} from "@/lib/utils/timeline-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const settings = await prisma.pengaturanTka.findUnique({
      where: { id: "default" },
    });

    const now = new Date();
    let isWithinPeriod = true;

    // Default dates if null in database
    const batasSuratPernyataan = settings?.batasSuratPernyataan || new Date("2026-09-10T23:59:59.999Z");
    const pendaftaranMulai = settings?.pendaftaranMulai || new Date("2026-07-27T00:00:00.000Z");
    const pendaftaranSelesai = settings?.pendaftaranSelesai || new Date("2026-09-27T23:59:59.999Z");
    const simulasiMulai = settings?.simulasiMulai || new Date("2026-09-21T00:00:00.000Z");
    const simulasiSelesai = settings?.simulasiSelesai || new Date("2026-09-27T23:59:59.999Z");
    const gladiMulai = settings?.gladiMulai || new Date("2026-10-05T00:00:00.000Z");
    const gladiSelesai = settings?.gladiSelesai || new Date("2026-10-18T23:59:59.999Z");
    const gelombang1Mulai = settings?.gelombang1Mulai || new Date("2026-10-26T00:00:00.000Z");
    const gelombang1Selesai = settings?.gelombang1Selesai || new Date("2026-10-29T23:59:59.999Z");
    const gelombang2Mulai = settings?.gelombang2Mulai || new Date("2026-11-02T00:00:00.000Z");
    const gelombang2Selesai = settings?.gelombang2Selesai || new Date("2026-11-05T23:59:59.999Z");

    const cutoffDeadline = new Date(batasSuratPernyataan);
    cutoffDeadline.setHours(23, 59, 59, 999);

    if (settings) {
      if (!settings.isKonfirmasiOpen) {
        isWithinPeriod = false;
      }
      if (settings.tanggalMulai && now < new Date(settings.tanggalMulai)) {
        isWithinPeriod = false;
      }
      if (now > cutoffDeadline) {
        isWithinPeriod = false;
      }
    }

    // 6 Official Milestones with calculated status
    const milestones = [
      {
        id: 1,
        stepLabel: "Tahap 1",
        title: "Batas Pengumpulan Surat Pernyataan & Pas Foto",
        category: "Konfirmasi Siswa",
        startDate: pendaftaranMulai,
        endDate: batasSuratPernyataan,
        dateLabel: formatDateIndo(batasSuratPernyataan),
        description: "Batas akhir siswa mengisi & mengubah pilihan 2 mata pelajaran pilihan TKA di sistem.",
        status: getMilestoneStatus(pendaftaranMulai, batasSuratPernyataan, now),
      },
      {
        id: 2,
        stepLabel: "Tahap 2",
        title: "Pendaftaran Peserta ke Sistem TKA",
        category: "Operator Sekolah",
        startDate: pendaftaranMulai,
        endDate: pendaftaranSelesai,
        dateLabel: formatDateRangeIndo(pendaftaranMulai, pendaftaranSelesai, "dilakukan sekolah"),
        description: "Pendaftaran data peserta resmi ke portal pusat asesmen Kemendikdasmen oleh pihak sekolah.",
        status: getMilestoneStatus(pendaftaranMulai, pendaftaranSelesai, now),
      },
      {
        id: 3,
        stepLabel: "Tahap 3",
        title: "Simulasi TKA",
        category: "Uji Coba",
        startDate: simulasiMulai,
        endDate: simulasiSelesai,
        dateLabel: formatDateRangeIndo(simulasiMulai, simulasiSelesai),
        description: "Uji coba teknis aplikasi ujian, kestabilan server, dan adaptasi format soal siswa.",
        status: getMilestoneStatus(simulasiMulai, simulasiSelesai, now),
      },
      {
        id: 4,
        stepLabel: "Tahap 4",
        title: "Gladi Bersih TKA",
        category: "Gladi Bersih",
        startDate: gladiMulai,
        endDate: gladiSelesai,
        dateLabel: formatDateRangeIndo(gladiMulai, gladiSelesai),
        description: "Simulasi skala penuh dengan kondisi jaringan menyerupai hari ujian sesungguhnya.",
        status: getMilestoneStatus(gladiMulai, gladiSelesai, now),
      },
      {
        id: 5,
        stepLabel: "Tahap 5",
        title: "Pelaksanaan Gelombang 1",
        category: "Ujian Resmi",
        startDate: gelombang1Mulai,
        endDate: gelombang1Selesai,
        dateLabel: formatDateRangeIndo(gelombang1Mulai, gelombang1Selesai),
        description: "Pelaksanaan tes kemampuan akademik sesi pertama sesuai pembagian rombel sekolah.",
        status: getMilestoneStatus(gelombang1Mulai, gelombang1Selesai, now),
      },
      {
        id: 6,
        stepLabel: "Tahap 6",
        title: "Pelaksanaan Gelombang 2",
        category: "Ujian Resmi",
        startDate: gelombang2Mulai,
        endDate: gelombang2Selesai,
        dateLabel: formatDateRangeIndo(gelombang2Mulai, gelombang2Selesai),
        description: "Pelaksanaan tes kemampuan akademik sesi kedua dan susulan resmi sekolah.",
        status: getMilestoneStatus(gelombang2Mulai, gelombang2Selesai, now),
      },
    ];

    return NextResponse.json({
      success: true,
      isKonfirmasiOpen: settings ? settings.isKonfirmasiOpen : true,
      isWithinPeriod,
      tanggalMulai: settings?.tanggalMulai || pendaftaranMulai,
      tanggalSelesai: cutoffDeadline,
      pesanPengumuman:
        settings?.pesanPengumuman ||
        `Batas pengumpulan surat pernyataan dan perubahan pilihan TKA adalah ${formatDateIndo(batasSuratPernyataan)}.`,
      batasSuratPernyataanFormatted: formatDateIndo(batasSuratPernyataan),
      milestones,
      rawDates: {
        batasSuratPernyataan,
        pendaftaranMulai,
        pendaftaranSelesai,
        simulasiMulai,
        simulasiSelesai,
        gladiMulai,
        gladiSelesai,
        gelombang1Mulai,
        gelombang1Selesai,
        gelombang2Mulai,
        gelombang2Selesai,
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
      batasSuratPernyataanFormatted: "10 September 2026",
      milestones: [],
    });
  }
}
