import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mapel = searchParams.get("mapel");

    const whereClause: any = {
      status: "AKTIF",
    };
    if (mapel) {
      whereClause.mapel = mapel.toUpperCase();
    }

    const questions = await prisma.soal.findMany({
      where: whereClause,
      include: {
        kisiKisi: {
          select: {
            topik: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const formatted = questions.map((q) => ({
      id: q.id,
      mapel: q.mapel,
      kisiKisiId: q.kisiKisiId,
      topik: q.kisiKisi?.topik || "Latihan Mandiri TKA",
      tipeSoal: q.tipeSoal,
      pertanyaan: q.pertanyaan,
      opsiJawaban: q.opsiJawaban,
      kunciJawaban: q.kunciJawaban,
      pembahasan: q.pembahasan,
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