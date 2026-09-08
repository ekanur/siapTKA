import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SUBJECT_ALIASES } from "@/lib/constants/subjects";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userMapel = (session?.user as any)?.mapel;

    const { searchParams } = new URL(request.url);
    const isSummaryOnly = searchParams.get("summary") === "true";
    let mapel = searchParams.get("mapel");

    // For GURU, force mapel to userMapel
    if (userRole === "GURU" && userMapel) {
      mapel = userMapel;
    }

    // -------------------------------------------------------------
    // CASE 1: SUMMARY ONLY (For Admin Subject Overview Grid)
    // -------------------------------------------------------------
    if (isSummaryOnly && userRole === "ADMIN") {
      const allActiveQuestions = await prisma.soal.findMany({
        where: { status: "AKTIF" },
        select: {
          id: true,
          mapel: true,
          createdAt: true,
          progres: {
            select: {
              isBenar: true,
            },
          },
        },
      });

      const summaryByMapel: {
        [key: string]: {
          total: number;
          sulit: number;
          sedang: number;
          mudah: number;
          belumDikerjakan: number;
          totalAttempts: number;
          totalCorrect: number;
        };
      } = {};

      for (const q of allActiveQuestions) {
        let canonicalMapel = q.mapel.toUpperCase().trim();
        if (SUBJECT_ALIASES[canonicalMapel]) {
          canonicalMapel = SUBJECT_ALIASES[canonicalMapel];
        }

        if (!summaryByMapel[canonicalMapel]) {
          summaryByMapel[canonicalMapel] = {
            total: 0,
            sulit: 0,
            sedang: 0,
            mudah: 0,
            belumDikerjakan: 0,
            totalAttempts: 0,
            totalCorrect: 0,
          };
        }

        const totalAttempts = q.progres.length;
        const correctAttempts = q.progres.filter((p) => p.isBenar).length;
        const accuracyPercent =
          totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;

        summaryByMapel[canonicalMapel].total++;
        summaryByMapel[canonicalMapel].totalAttempts += totalAttempts;
        summaryByMapel[canonicalMapel].totalCorrect += correctAttempts;

        if (totalAttempts === 0) {
          summaryByMapel[canonicalMapel].belumDikerjakan++;
        } else if (accuracyPercent < 40) {
          summaryByMapel[canonicalMapel].sulit++;
        } else if (accuracyPercent < 70) {
          summaryByMapel[canonicalMapel].sedang++;
        } else {
          summaryByMapel[canonicalMapel].mudah++;
        }
      }

      const grandSummary = {
        totalQuestions: allActiveQuestions.length,
        totalDifficult: Object.values(summaryByMapel).reduce((acc, curr) => acc + curr.sulit, 0),
        totalModerate: Object.values(summaryByMapel).reduce((acc, curr) => acc + curr.sedang, 0),
        totalEasy: Object.values(summaryByMapel).reduce((acc, curr) => acc + curr.mudah, 0),
        totalUnattempted: Object.values(summaryByMapel).reduce(
          (acc, curr) => acc + curr.belumDikerjakan,
          0
        ),
        totalAttempts: Object.values(summaryByMapel).reduce(
          (acc, curr) => acc + curr.totalAttempts,
          0
        ),
        totalSubjects: Object.keys(summaryByMapel).length,
      };

      return NextResponse.json({
        success: true,
        summaryByMapel,
        grandSummary,
      });
    }

    // -------------------------------------------------------------
    // CASE 2: DETAILED QUESTIONS FOR DRILL-DOWN OR GURU
    // -------------------------------------------------------------
    const whereSoal: any = {
      status: "AKTIF",
    };

    if (mapel && mapel !== "ALL") {
      const norm = mapel.replace(/-/g, "_").toUpperCase();
      const matchedMapels = [norm];

      // Include all aliases that point to this subject
      Object.entries(SUBJECT_ALIASES).forEach(([alias, target]) => {
        if (target === norm) matchedMapels.push(alias);
      });

      // Also check if norm itself is an alias pointing to another subject
      if (SUBJECT_ALIASES[norm]) {
        matchedMapels.push(SUBJECT_ALIASES[norm]);
      }

      whereSoal.mapel = { in: matchedMapels };
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

      const accuracyPercent =
        totalAttempts > 0 ? Math.round((correctAttempts / totalAttempts) * 100) : 0;
      const errorPercent = totalAttempts > 0 ? 100 - accuracyPercent : 0;

      // Difficulty Classification
      let difficulty: "SULIT" | "SEDANG" | "MUDAH" | "BELUM_DIKERJAKAN" = "BELUM_DIKERJAKAN";
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
        createdAt: q.createdAt,
      };
    });

    // Default sorting: TINGKAT KESULITAN TERTINGGI (Highest difficulty first)
    // 1. SULIT (lowest accuracy first, highest wrong attempts)
    // 2. SEDANG (lowest accuracy first)
    // 3. MUDAH (lowest accuracy first)
    // 4. BELUM_DIKERJAKAN (recent first)
    const difficultyPriority: Record<string, number> = {
      SULIT: 4,
      SEDANG: 3,
      MUDAH: 2,
      BELUM_DIKERJAKAN: 1,
    };

    analyzedItems.sort((a, b) => {
      const prioA = difficultyPriority[a.difficulty] || 0;
      const prioB = difficultyPriority[b.difficulty] || 0;
      if (prioB !== prioA) {
        return prioB - prioA; // Higher priority (SULIT) first
      }

      if (a.difficulty === "SULIT" || a.difficulty === "SEDANG" || a.difficulty === "MUDAH") {
        if (a.accuracyPercent !== b.accuracyPercent) {
          return a.accuracyPercent - b.accuracyPercent; // Lower accuracy means harder!
        }
        return b.wrongAttempts - a.wrongAttempts; // More wrong attempts first
      }

      // If both BELUM_DIKERJAKAN, sort by createdAt desc
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    // Summary KPIs for current view
    const totalQuestionsAnalyzed = analyzedItems.length;
    const totalAllAttempts = analyzedItems.reduce((acc, curr) => acc + curr.totalAttempts, 0);
    const difficultQuestionsCount = analyzedItems.filter((i) => i.difficulty === "SULIT").length;
    const moderateQuestionsCount = analyzedItems.filter((i) => i.difficulty === "SEDANG").length;
    const easyQuestionsCount = analyzedItems.filter((i) => i.difficulty === "MUDAH").length;
    const unattemptedCount = analyzedItems.filter(
      (i) => i.difficulty === "BELUM_DIKERJAKAN"
    ).length;

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
        unattemptedCount,
      },
      items: analyzedItems,
    });
  } catch (error) {
    console.error("Analisis API error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memproses analisis butir soal" },
      { status: 500 }
    );
  }
}