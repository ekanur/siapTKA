import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { encryptAnswerKey, encryptExplanation } from "@/lib/security/crypto";
import { normalizeOpsiJawaban } from "@/lib/quiz/normalize";
import { SUBJECT_ALIASES, isSubjectAllowedForStudent, getAllowedSubjectsForStudent } from "@/lib/constants/subjects";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = (session?.user as any)?.id;
    const userRole = (session?.user as any)?.role;

    const { searchParams } = new URL(request.url);
    const mapel = searchParams.get("mapel");

    const whereClause: any = {
      status: "AKTIF",
    };

    // If requester is a student, enforce that only Wajib and selected electives are accessible
    if (userRole === "SISWA" && userId) {
      const student = await prisma.siswa.findUnique({
        where: { id: userId },
        select: {
          statusTka: true,
          mapelPilihan1: true,
          mapelPilihan2: true,
        },
      });

      if (student) {
        if (student.statusTka === "TIDAK_IKUT") {
          return NextResponse.json({ success: true, count: 0, soal: [] });
        }

        if (mapel) {
          const authCheck = isSubjectAllowedForStudent(mapel, student);
          if (!authCheck.allowed) {
            return NextResponse.json(
              {
                success: false,
                error: "Mata pelajaran ini tidak aktif atau tidak termasuk dalam pilihan TKA Anda",
              },
              { status: 403 }
            );
          }
        } else {
          // If no specific mapel requested, limit download to only authorized subjects
          const allowedList = getAllowedSubjectsForStudent(student);
          const expandedAllowed = new Set<string>();
          for (const s of allowedList) {
            const normS = s.replace(/-/g, "_").toUpperCase();
            expandedAllowed.add(normS);
            if (SUBJECT_ALIASES[normS]) expandedAllowed.add(SUBJECT_ALIASES[normS]);
            Object.entries(SUBJECT_ALIASES).forEach(([k, v]) => {
              if (v === normS) expandedAllowed.add(k);
            });
          }
          whereClause.mapel = { in: Array.from(expandedAllowed) };
        }
      }
    }

    if (mapel) {
      const norm = mapel.replace(/-/g, "_").toUpperCase();
      const matched = [norm];
      if (SUBJECT_ALIASES[norm]) matched.push(SUBJECT_ALIASES[norm]);
      Object.entries(SUBJECT_ALIASES).forEach(([k, v]) => {
        if (v === norm) matched.push(k);
      });
      whereClause.mapel = { in: matched };
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