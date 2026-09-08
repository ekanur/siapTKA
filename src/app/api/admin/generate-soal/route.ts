import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateSoalWithGemini, getGeminiApiStatus } from "@/lib/ai/gemini-service";

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
    const { mapel, elemen, subElemen, kompetensi, batasan, tipeSoal, jumlahSoal } = body;

    if (!mapel || !tipeSoal) {
      return NextResponse.json({ success: false, error: "Mata pelajaran dan bentuk soal wajib dipilih." }, { status: 400 });
    }

    const finalElemen = elemen?.trim() || "Materi Pokok Kurikulum";
    const finalSubElemen = subElemen?.trim() || "Fokus Sub-Topik Asesmen";
    const finalKompetensi = kompetensi?.trim() || "Menganalisis dan memecahkan persoalan kontekstual";
    const finalBatasan = batasan?.trim() || "Sesuai batasan ruang lingkup kurikulum";

    // Panggil Gemini Service dengan 7 parameter matriks asesmen
    const generationResult = await generateSoalWithGemini({
      mapel,
      tipeSoal,
      jumlahSoal: Number(jumlahSoal) || 3,
      elemen: finalElemen,
      subElemen: finalSubElemen,
      kompetensi: finalKompetensi,
      batasan: finalBatasan,
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