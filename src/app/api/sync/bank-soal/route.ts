import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { encryptAnswerKey, encryptExplanation } from "@/lib/security/crypto";
import { normalizeOpsiJawaban } from "@/lib/quiz/normalize";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mapel = searchParams.get("mapel");

    const whereClause: any = {
      status: "AKTIF",
    };
    if (mapel) {
      const norm = mapel.replace(/-/g, "_").toUpperCase();
      if (norm === "AIJ" || norm === "ADMINISTRASI_INFRASTRUKTUR_JARINGAN") {
        whereClause.mapel = { in: ["ADMINISTRASI_INFRASTRUKTUR_JARINGAN", "AIJ"] };
      } else {
        whereClause.mapel = norm;
      }
    }

    const questions = await prisma.soal.findMany({
      where: whereClause,
      orderBy: {
        createdAt: "desc",
      },
    });

    const formatted = questions.map((q) => ({
      id: q.id,
      mapel: q.mapel,
      topik: "Latihan Mandiri TKA",
      tipeSoal: q.tipeSoal,
      pertanyaan: q.pertanyaan,
      opsiJawaban: JSON.stringify(normalizeOpsiJawaban(q.opsiJawaban)),
      kunciJawaban: encryptAnswerKey(q.kunciJawaban, q.id),
      pembahasan: encryptExplanation(q.pembahasan || "", q.id),
      status: q.status,
      updatedAt: q.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      success: true,
      count: formatted.length,
      soal: formatted,
    });
  } catch (error: any) {
    console.error("API Bank Soal error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat bank soal" },
      { status: 500 }
    );
  }
}