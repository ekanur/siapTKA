import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userMapel = (session?.user as any)?.mapel;

    const { searchParams } = new URL(request.url);
    let mapel = searchParams.get("mapel");

    if (userRole === "GURU" && userMapel) {
      mapel = userMapel;
    }

    const whereSoal: any = {
      status: "AKTIF",
    };
    if (mapel && mapel !== "ALL") {
      const norm = mapel.replace(/-/g, "_").toUpperCase();
      if (norm === "AIJ" || norm === "ADMINISTRASI_INFRASTRUKTUR_JARINGAN") {
        whereSoal.mapel = { in: ["ADMINISTRASI_INFRASTRUKTUR_JARINGAN", "AIJ"] };
      } else {
        whereSoal.mapel = norm;
      }
    }

    const questions = await prisma.soal.findMany({
      where: whereSoal,
      include: {
        progres: {
          select: {
            isBenar: true,
            jawabanSiswa: true,
            waktuPengerjaan: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const analyzedItems = questions.map((q) => {
      const totalAttempts = q.progres.length;
      const correctAttempts = q.progres.filter((p) => p.isBenar).length;
      const wrongAttempts = totalAttempts - correctAttempts;

      const accuracyPercent = totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
      const errorPercent = totalAttempts > 0 ? 100 - accuracyPercent : 0;

      // Difficulty Classification
      let difficulty = "BELUM_DIKERJAKAN";
      if (totalAttempts > 0) {
        if (accuracyPercent >= 70) difficulty = "MUDAH";
        else if (accuracyPercent >= 40) difficulty = "SEDANG";
        else difficulty = "SULIT";
      }

      // Distractor choices analysis
      const distractorMap: { [key: string]: number } = {};
      let totalSeconds = 0;

      for (const p of q.progres) {
        totalSeconds += p.waktuPengerjaan || 0;
        let cleanAns = p.jawabanSiswa;
        try {
          const parsed = JSON.parse(p.jawabanSiswa);
          if (Array.isArray(parsed)) cleanAns = parsed.join(", ");
        } catch {}

        distractorMap[cleanAns] = (distractorMap[cleanAns] || 0) + 1;
      }

      const avgDurationSec = totalAttempts > 0 ? Math.round(totalSeconds / totalAttempts) : 0;

      return {
        id: q.id,
        mapel: q.mapel,
        topik: "Latihan Mandiri TKA",
        tipeSoal: q.tipeSoal,
        pertanyaan: q.pertanyaan,
        kunciJawaban: q.kunciJawaban,
        pembahasan: q.pembahasan,
        totalAttempts,
        correctAttempts,
        wrongAttempts,
        accuracyPercent,
        errorPercent,
        difficulty,
        distractorMap,
        avgDurationSec,
      };
    });

    // Summary KPIs
    const totalQuestionsAnalyzed = analyzedItems.length;
    const totalAllAttempts = analyzedItems.reduce((acc, curr) => acc + curr.totalAttempts, 0);
    const difficultQuestionsCount = analyzedItems.filter((i) => i.difficulty === "SULIT").length;
    const moderateQuestionsCount = analyzedItems.filter((i) => i.difficulty === "SEDANG").length;
    const easyQuestionsCount = analyzedItems.filter((i) => i.difficulty === "MUDAH").length;

    return NextResponse.json({
      success: true,
      isGuru: userRole === "GURU",
      assignedMapel: userMapel,
      summary: {
        totalQuestionsAnalyzed,
        totalAllAttempts,
        difficultQuestionsCount,
        moderateQuestionsCount,
        easyQuestionsCount,
      },
      items: analyzedItems,
    });
  } catch (error) {
    console.error("Analisis API error:", error);
    return NextResponse.json({ success: false, error: "Gagal memproses analisis butir soal" }, { status: 500 });
  }
}