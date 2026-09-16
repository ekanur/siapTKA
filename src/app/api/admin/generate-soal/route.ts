import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateSoalWithGemini, getGeminiApiStatus } from "@/lib/ai/gemini-service";
import { isLanguageSubject } from "@/lib/constants/subjects";

export const dynamic = "force-dynamic";

/**
 * GET: Mengembalikan status ketersediaan GEMINI_API_KEY di environment server
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || userRole !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Halaman tidak ditemukan." }, { status: 404 });
    }

    const apiStatus = getGeminiApiStatus();
    return NextResponse.json({
      success: true,
      apiStatus,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Gagal memeriksa status API." }, { status: 500 });
  }
}

/**
 * POST: Men-generate butir soal berdasarkan 7 parameter matriks asesmen
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (!session || userRole !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Halaman tidak ditemukan." }, { status: 404 });
    }

    const body = await request.json();
    const {
      mapel,
      elemen,
      subElemen,
      kompetensi,
      subKompetensi,
      batasan,
      tipeSoal,
      jumlahSoal,
      jenisTeks,
      topikTeks,
      stimulusTeks,
      fokusKebahasaan,
    } = body;

    if (!mapel || !tipeSoal) {
      return NextResponse.json({ success: false, error: "Mata pelajaran dan bentuk soal wajib dipilih." }, { status: 400 });
    }

    if (!kompetensi || !kompetensi.trim()) {
      return NextResponse.json({ success: false, error: "Kompetensi / Indikator Asesmen wajib diisi." }, { status: 400 });
    }

    if (isLanguageSubject(mapel) && (!subKompetensi || !subKompetensi.trim())) {
      return NextResponse.json({ success: false, error: "Sub-Kompetensi untuk mata pelajaran bahasa wajib diisi." }, { status: 400 });
    }

    const finalElemen = elemen?.trim() || undefined;
    const finalSubElemen = subElemen?.trim() || undefined;
    const finalKompetensi = kompetensi.trim();
    const finalSubKompetensi = subKompetensi?.trim() || undefined;
    const finalBatasan = batasan?.trim() || undefined;
    const finalFokusKebahasaan = fokusKebahasaan?.trim() || (finalSubKompetensi ? `${finalKompetensi} (${finalSubKompetensi})` : finalKompetensi);

    // Panggil Gemini Service dengan parameter matriks asesmen & parameter bahasa
    const generationResult = await generateSoalWithGemini({
      mapel,
      tipeSoal,
      jumlahSoal: Number(jumlahSoal) || 3,
      elemen: finalElemen,
      subElemen: finalSubElemen,
      kompetensi: finalKompetensi,
      subKompetensi: finalSubKompetensi,
      batasan: finalBatasan,
      jenisTeks: jenisTeks?.trim(),
      topikTeks: topikTeks?.trim(),
      stimulusTeks: stimulusTeks?.trim(),
      fokusKebahasaan: finalFokusKebahasaan,
    });

    // Simpan ke Database dengan status MENUNGGU_VALIDASI
    const createdRecords = [];
    for (const item of generationResult.soal) {
      const record = await prisma.soal.create({
        data: {
          mapel,
          tipeSoal: item.tipeSoal,
          pertanyaan: item.pertanyaan,
          opsiJawaban: typeof item.opsiJawaban === "string" ? item.opsiJawaban : JSON.stringify(item.opsiJawaban),
          kunciJawaban: typeof item.kunciJawaban === "string" ? item.kunciJawaban : JSON.stringify(item.kunciJawaban),
          pembahasan: item.pembahasan,
          status: "MENUNGGU_VALIDASI",
          source: generationResult.source,
        },
      });
      createdRecords.push(record);
    }

    return NextResponse.json({
      success: true,
      count: createdRecords.length,
      soal: createdRecords,
      source: generationResult.source,
      statusApi: generationResult.statusApi,
      message: generationResult.message,
      promptUsed: generationResult.promptUsed,
    });
  } catch (error: any) {
    console.error("API Generate Soal error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal men-generate soal AI" },
      { status: 500 }
    );
  }
}