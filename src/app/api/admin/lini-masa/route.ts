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
          tanggalMulai: new Date("2026-07-27T00:00:00.000Z"),
          tanggalSelesai: new Date("2026-09-10T23:59:59.999Z"),
          pesanPengumuman: "Batas pengumpulan surat pernyataan dan perubahan pilihan mapel TKA adalah 10 September 2026.",
          batasSuratPernyataan: new Date("2026-09-10T23:59:59.999Z"),
          pendaftaranMulai: new Date("2026-07-27T00:00:00.000Z"),
          pendaftaranSelesai: new Date("2026-09-27T23:59:59.999Z"),
          simulasiMulai: new Date("2026-09-21T00:00:00.000Z"),
          simulasiSelesai: new Date("2026-09-27T23:59:59.999Z"),
          gladiMulai: new Date("2026-10-05T00:00:00.000Z"),
          gladiSelesai: new Date("2026-10-18T23:59:59.999Z"),
          gelombang1Mulai: new Date("2026-10-26T00:00:00.000Z"),
          gelombang1Selesai: new Date("2026-10-29T23:59:59.999Z"),
          gelombang2Mulai: new Date("2026-11-02T00:00:00.000Z"),
          gelombang2Selesai: new Date("2026-11-05T23:59:59.999Z"),
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
      return NextResponse.json({ success: false, error: "Halaman tidak ditemukan." }, { status: 404 });
    }

    const body = await request.json();
    const {
      isKonfirmasiOpen,
      pesanPengumuman,
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
    } = body;

    // Helper to parse date
    const parseDateStart = (dStr: any) => {
      if (!dStr) return null;
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return null;
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const parseDateEnd = (dStr: any) => {
      if (!dStr) return null;
      const d = new Date(dStr);
      if (isNaN(d.getTime())) return null;
      d.setHours(23, 59, 59, 999);
      return d;
    };

    const parsedBatas = parseDateEnd(batasSuratPernyataan);
    const parsedPendaftaranMulai = parseDateStart(pendaftaranMulai);
    const parsedPendaftaranSelesai = parseDateEnd(pendaftaranSelesai);

    const dataPayload: any = {
      isKonfirmasiOpen: Boolean(isKonfirmasiOpen),
      pesanPengumuman: pesanPengumuman || "",
      tanggalMulai: parsedPendaftaranMulai || new Date("2026-07-27T00:00:00.000Z"),
      // Unify cutoff date to batasSuratPernyataan
      tanggalSelesai: parsedBatas || new Date("2026-09-10T23:59:59.999Z"),
      batasSuratPernyataan: parsedBatas || new Date("2026-09-10T23:59:59.999Z"),
      pendaftaranMulai: parsedPendaftaranMulai || new Date("2026-07-27T00:00:00.000Z"),
      pendaftaranSelesai: parsedPendaftaranSelesai || new Date("2026-09-27T23:59:59.999Z"),
      simulasiMulai: parseDateStart(simulasiMulai) || new Date("2026-09-21T00:00:00.000Z"),
      simulasiSelesai: parseDateEnd(simulasiSelesai) || new Date("2026-09-27T23:59:59.999Z"),
      gladiMulai: parseDateStart(gladiMulai) || new Date("2026-10-05T00:00:00.000Z"),
      gladiSelesai: parseDateEnd(gladiSelesai) || new Date("2026-10-18T23:59:59.999Z"),
      gelombang1Mulai: parseDateStart(gelombang1Mulai) || new Date("2026-10-26T00:00:00.000Z"),
      gelombang1Selesai: parseDateEnd(gelombang1Selesai) || new Date("2026-10-29T23:59:59.999Z"),
      gelombang2Mulai: parseDateStart(gelombang2Mulai) || new Date("2026-11-02T00:00:00.000Z"),
      gelombang2Selesai: parseDateEnd(gelombang2Selesai) || new Date("2026-11-05T23:59:59.999Z"),
    };

    const updated = await prisma.pengaturanTka.upsert({
      where: { id: "default" },
      create: {
        id: "default",
        ...dataPayload,
      },
      update: dataPayload,
    });

    return NextResponse.json({
      success: true,
      settings: updated,
      message: "Seluruh pengaturan jadwal linimasa TKA berhasil diperbarui.",
    });
  } catch (error: any) {
    console.error("POST Lini Masa Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal menyimpan pengaturan" }, { status: 500 });
  }
}
