import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const submissions = body.submissions || [];

    if (!Array.isArray(submissions) || submissions.length === 0) {
      return NextResponse.json({ success: true, syncedIds: [], total: 0 });
    }

    // Attempt to identify current authenticated student from session
    const session = await getServerSession(authOptions);
    let sessionStudent: { id: string; email: string; nis: string } | null = null;
    if (session?.user) {
      const u = session.user as any;
      sessionStudent = await prisma.siswa.findFirst({
        where: {
          OR: [
            ...(u.id ? [{ id: u.id }] : []),
            ...(u.email ? [{ email: u.email }] : []),
            ...(u.nis ? [{ nis: u.nis }] : []),
          ],
        },
        select: { id: true, email: true, nis: true },
      });
    }

    // Default demo student fallback to guarantee foreign key integrity for offline testing
    const demoStudent = await prisma.siswa.findFirst({
      where: {
        OR: [{ nis: "22231001" }, { email: "siswa.demo@gmail.com" }],
      },
      select: { id: true, email: true, nis: true },
    });

    const fallbackStudent = demoStudent || (await prisma.siswa.findFirst({ select: { id: true, email: true, nis: true } }));

    const syncedIds: string[] = [];
    const studentCache = new Map<string, string>(); // maps input siswaId -> valid prisma.siswa.id

    for (const sub of submissions) {
      try {
        const { id, soalId, jawabanSiswa, waktuPengerjaan } = sub;
        const rawSiswaId = sub.siswaId;

        if (!id || !soalId) {
          if (id) syncedIds.push(id);
          continue;
        }

        // 1. Resolve to a guaranteed valid Siswa ID in database
        let resolvedSiswaId: string | null = null;

        if (sessionStudent) {
          resolvedSiswaId = sessionStudent.id;
        } else if (rawSiswaId && studentCache.has(rawSiswaId)) {
          resolvedSiswaId = studentCache.get(rawSiswaId)!;
        } else if (rawSiswaId && rawSiswaId !== "siswa-demo-id") {
          const matched = await prisma.siswa.findFirst({
            where: {
              OR: [{ id: rawSiswaId }, { nis: rawSiswaId }, { email: rawSiswaId }],
            },
            select: { id: true },
          });
          if (matched) {
            resolvedSiswaId = matched.id;
            studentCache.set(rawSiswaId, matched.id);
          }
        }

        // If not resolved yet, use demo student fallback
        if (!resolvedSiswaId && fallbackStudent) {
          resolvedSiswaId = fallbackStudent.id;
        }

        if (!resolvedSiswaId) {
          console.warn(`[Sync Progres] Could not resolve student for submission: ${id}`);
          syncedIds.push(id); // Clear from offline queue to avoid infinite blockage
          continue;
        }

        // 2. Fetch master question from database for Zero-Trust Validation
        const masterSoal = await prisma.soal.findUnique({
          where: { id: soalId },
        });

        if (!masterSoal) {
          // Question might have been deleted or modified on server; clear from queue
          syncedIds.push(id);
          continue;
        }

        // 3. Calculate true isBenar on the server
        let isBenar = false;
        let calculatedScore = 0;

        if (masterSoal.tipeSoal === "PILIHAN_GANDA") {
          const correctKey = masterSoal.kunciJawaban.trim().toUpperCase();
          const userKey = String(jawabanSiswa || "").trim().toUpperCase();
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
          const sortedUsr = (Array.isArray(userArr) ? userArr : [userArr]).map((u) => String(u).trim().toUpperCase()).sort();
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

          if (expectedList.length > 0 && Array.isArray(userList)) {
            let correctCount = 0;
            for (const exp of expectedList) {
              const userPick = userList.find((u) => u.id === exp.id);
              if (userPick && String(userPick.answer).trim().toLowerCase() === String(exp.answer).trim().toLowerCase()) {
                correctCount++;
              }
            }
            isBenar = correctCount === expectedList.length;
            calculatedScore = Math.round((correctCount / expectedList.length) * 100);
          }
        }

        // 4. Upsert record idempotently via client submission `id`
        await prisma.progresLatihan.upsert({
          where: { id },
          create: {
            id,
            siswaId: resolvedSiswaId,
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
      } catch (itemError: any) {
        console.error(`[Sync Progres] Error processing submission item ${sub?.id}:`, itemError);
      }
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