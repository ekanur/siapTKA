import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { isSubjectAllowedForStudent } from "@/lib/constants/subjects";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const submissions = body.submissions || [];

    if (!Array.isArray(submissions) || submissions.length === 0) {
      return NextResponse.json({ success: true, syncedIds: [], total: 0 });
    }

    const syncedIds: string[] = [];
    const studentCache = new Map<string, any>();

    for (const sub of submissions) {
      const { id, siswaId, soalId, jawabanSiswa, waktuPengerjaan } = sub;
      if (!id || !siswaId || !soalId) continue;

      // 1. Fetch master question from database for Zero-Trust Validation
      const masterSoal = await prisma.soal.findUnique({
        where: { id: soalId },
      });

      if (!masterSoal) continue;

      // Check student authorization for this subject
      let student = studentCache.get(siswaId);
      if (student === undefined) {
        student = await prisma.siswa.findUnique({
          where: { id: siswaId },
          select: {
            statusTka: true,
            mapelPilihan1: true,
            mapelPilihan2: true,
          },
        });
        studentCache.set(siswaId, student || null);
      }

      if (student) {
        const authCheck = isSubjectAllowedForStudent(masterSoal.mapel, student);
        if (!authCheck.allowed) {
          // Skip submissions for subjects not chosen by student
          continue;
        }
      }

      // 2. Calculate true isBenar on the server
      let isBenar = false;
      let calculatedScore = 0;

      if (masterSoal.tipeSoal === "PILIHAN_GANDA") {
        const correctKey = masterSoal.kunciJawaban.trim().toUpperCase();
        const userKey = String(jawabanSiswa).trim().toUpperCase();
        isBenar = correctKey === userKey;
        calculatedScore = isBenar ? 100 : 0;
      } else if (masterSoal.tipeSoal === "MCMA") {
        let expectedArr: string[] = [];
        let userArr: string[] = [];
        try {
          expectedArr = JSON.parse(masterSoal.kunciJawaban);
        } catch {
          expectedArr = [masterSoal.kunciJawaban];
        }
        try {
          userArr = typeof jawabanSiswa === "string" ? JSON.parse(jawabanSiswa) : jawabanSiswa;
        } catch {
          userArr = [String(jawabanSiswa)];
        }

        const sortedExp = expectedArr.map((e) => e.trim().toUpperCase()).sort();
        const sortedUsr = userArr.map((u) => u.trim().toUpperCase()).sort();
        isBenar = sortedExp.length === sortedUsr.length && sortedExp.every((v, i) => v === sortedUsr[i]);
        calculatedScore = isBenar ? 100 : 0;
      } else if (masterSoal.tipeSoal === "PGK_KATEGORI") {
        let expectedList: { id: number; answer: string }[] = [];
        let userList: { id: number; answer: string }[] = [];
        try {
          expectedList = JSON.parse(masterSoal.kunciJawaban);
        } catch {
          expectedList = [];
        }
        try {
          userList = typeof jawabanSiswa === "string" ? JSON.parse(jawabanSiswa) : jawabanSiswa;
        } catch {
          userList = [];
        }

        if (expectedList.length > 0) {
          let correctCount = 0;
          for (const exp of expectedList) {
            const userPick = userList.find((u) => u.id === exp.id);
            if (userPick && userPick.answer.trim().toLowerCase() === exp.answer.trim().toLowerCase()) {
              correctCount++;
            }
          }
          isBenar = correctCount === expectedList.length;
          calculatedScore = Math.round((correctCount / expectedList.length) * 100);
        }
      }

      // 3. Upsert record idempotently via client UUID `id`
      await prisma.progresLatihan.upsert({
        where: { id },
        create: {
          id,
          siswaId,
          soalId,
          jawabanSiswa: typeof jawabanSiswa === "string" ? jawabanSiswa : JSON.stringify(jawabanSiswa),
          isBenar,
          skor: calculatedScore,
          waktuPengerjaan: Number(waktuPengerjaan) || 0,
          syncedAt: new Date(),
        },
        update: {
          isBenar,
          skor: calculatedScore,
          jawabanSiswa: typeof jawabanSiswa === "string" ? jawabanSiswa : JSON.stringify(jawabanSiswa),
          syncedAt: new Date(),
        },
      });

      syncedIds.push(id);
    }

    return NextResponse.json({
      success: true,
      syncedIds,
      totalProcessed: syncedIds.length,
    });
  } catch (error: any) {
    console.error("API Sync Progres error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menyinkronkan progres latihan" },
      { status: 500 }
    );
  }
}