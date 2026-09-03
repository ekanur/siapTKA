import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateSoalWithGemini } from "@/lib/ai/gemini-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Akses ditolak. Generator Soal AI dikhususkan untuk Administrator." }, { status: 403 });
    }

    const body = await request.json();
    const { mapel, elemen, subElemen, kompetensi, batasan, tipeSoal, jumlahSoal, kisiKisiId } = body;

    if (!mapel || !tipeSoal) {
      return NextResponse.json({ success: false, error: "Mata pelajaran dan bentuk soal wajib dipilih." }, { status: 400 });
    }

    const finalElemen = elemen || "Aljabar dan Penalaran";
    const finalSubElemen = subElemen || "Pemecahan Masalah Kontekstual";
    const finalKompetensi = kompetensi || "Menganalisis dan memecahkan persoalan logika";
    const finalBatasan = batasan || "Sesuai kerangka kurikulum asesmen nasional";

    // Call Gemini Service with Pusmendik Assessment Matrix
    const generatedList = await generateSoalWithGemini({
      mapel,
      tipeSoal,
      jumlahSoal: Number(jumlahSoal) || 3,
      elemen: finalElemen,
      subElemen: finalSubElemen,
      kompetensi: finalKompetensi,
      batasan: finalBatasan,
    });

    // Save to Database with status MENUNGGU_VALIDASI
    const createdRecords = [];
    for (const item of generatedList) {
      const record = await prisma.soal.create({
        data: {
          mapel,
          kisiKisiId: kisiKisiId || null,
          tipeSoal: item.tipeSoal,
          pertanyaan: item.pertanyaan,
          opsiJawaban: typeof item.opsiJawaban === "string" ? item.opsiJawaban : JSON.stringify(item.opsiJawaban),
          kunciJawaban: typeof item.kunciJawaban === "string" ? item.kunciJawaban : JSON.stringify(item.kunciJawaban),
          pembahasan: item.pembahasan,
          status: "MENUNGGU_VALIDASI",
          source: "AI_GEMINI",
        },
      });
      createdRecords.push(record);
    }

    return NextResponse.json({
      success: true,
      count: createdRecords.length,
      soal: createdRecords,
      message: `Berhasil men-generate ${createdRecords.length} butir soal AI. Soal telah masuk ke antrean validasi guru ${mapel}.`,
    });
  } catch (error: any) {
    console.error("API Generate Soal error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal men-generate soal AI" },
      { status: 500 }
    );
  }
}