import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateSoalWithGemini } from "@/lib/ai/gemini-service";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { kisiKisiId, mapel, tipeSoal, jumlahSoal } = body;

    if (!kisiKisiId || !mapel || !tipeSoal) {
      return NextResponse.json({ success: false, error: "Parameter tidak lengkap" }, { status: 400 });
    }

    const kisiKisi = await prisma.kisiKisi.findUnique({
      where: { id: kisiKisiId },
    });

    if (!kisiKisi) {
      return NextResponse.json({ success: false, error: "Kisi-kisi tidak ditemukan" }, { status: 404 });
    }

    // Call Gemini Service
    const generatedList = await generateSoalWithGemini({
      mapel,
      tipeSoal,
      jumlahSoal: Number(jumlahSoal) || 3,
      kisiKisi: {
        topik: kisiKisi.topik,
        definisi: kisiKisi.definisi,
        muatan: kisiKisi.muatan,
        kompetensi: kisiKisi.kompetensi,
        matriksAsesmen: kisiKisi.matriksAsesmen,
        contohSoal: kisiKisi.contohSoal,
      },
    });

    // Save to Database with status MENUNGGU_VALIDASI
    const createdRecords = [];
    for (const item of generatedList) {
      const record = await prisma.soal.create({
        data: {
          mapel,
          kisiKisiId: kisiKisi.id,
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
      message: `Berhasil men-generate ${createdRecords.length} soal. Soal masuk ke antrean validasi guru.`,
    });
  } catch (error: any) {
    console.error("API Generate Soal error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal men-generate soal AI" },
      { status: 500 }
    );
  }
}