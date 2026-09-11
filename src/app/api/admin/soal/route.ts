import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { encryptAnswerKey, encryptExplanation, isEncrypted } from "@/lib/security/crypto";
import { SUBJECT_ALIASES, getSubjectDisplayName } from "@/lib/constants/subjects";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userMapel = (session?.user as any)?.mapel;

    if (!session || !["ADMIN", "GURU"].includes(userRole)) {
      return NextResponse.json({ success: false, error: "Akses tidak sah." }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const isSummary = searchParams.get("summary") === "true";

    // Summary endpoint for Admin overview
    if (isSummary) {
      const grouped = await prisma.soal.groupBy({
        by: ["mapel", "status"],
        _count: { id: true },
      });
      return NextResponse.json({
        success: true,
        summary: grouped,
      });
    }

    const status = searchParams.get("status");
    let mapel = searchParams.get("mapel");

    // Guard: Teacher locked to their assigned subject
    if (userRole === "GURU" && userMapel) {
      mapel = userMapel;
    }

    const where: any = {};
    if (status && status !== "ALL") where.status = status;
    if (mapel && mapel !== "ALL") {
      const norm = mapel.replace(/-/g, "_").toUpperCase().trim();
      const canonical = SUBJECT_ALIASES[norm] || norm;
      const matchingCodes = [canonical, norm];
      Object.entries(SUBJECT_ALIASES).forEach(([alias, target]) => {
        if (target === canonical) matchingCodes.push(alias);
      });
      where.mapel = { in: Array.from(new Set(matchingCodes)) };
    }

    const list = await prisma.soal.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      count: list.length,
      soal: list,
      isGuru: userRole === "GURU",
      assignedMapel: userMapel,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Gagal memuat daftar soal" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userMapel = (session?.user as any)?.mapel;

    if (!session || !["ADMIN", "GURU"].includes(userRole)) {
      return NextResponse.json({ success: false, error: "Akses tidak diizinkan." }, { status: 401 });
    }

    const body = await request.json();
    let { mapel, tipeSoal, pertanyaan, opsiJawaban, kunciJawaban, pembahasan } = body;

    // Guard: Teacher can only create questions for their subject
    if (userRole === "GURU" && userMapel) {
      mapel = userMapel;
    }

    if (!mapel || !pertanyaan || !opsiJawaban || !kunciJawaban) {
      return NextResponse.json({ success: false, error: "Mapel, pertanyaan, opsi, dan kunci jawaban wajib diisi." }, { status: 400 });
    }

    const rawOpsi = typeof opsiJawaban === "string" ? opsiJawaban : JSON.stringify(opsiJawaban);
    const rawKunci = typeof kunciJawaban === "string" ? kunciJawaban : JSON.stringify(kunciJawaban);

    const created = await prisma.soal.create({
      data: {
        mapel: mapel.toUpperCase(),
        tipeSoal: tipeSoal || "PILIHAN_GANDA",
        pertanyaan: pertanyaan.trim(),
        opsiJawaban: rawOpsi,
        kunciJawaban: rawKunci,
        pembahasan: pembahasan || "",
        status: "AKTIF", // Manual questions created by teacher are active immediately
        source: "MANUAL_GURU",
      },
    });

    return NextResponse.json({
      success: true,
      soal: created,
      message: "Soal manual berhasil ditambahkan ke Bank Soal.",
    });
  } catch (error: any) {
    console.error("POST Soal Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal menambah soal" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userMapel = (session?.user as any)?.mapel;

    const body = await request.json();
    const { id, status, bulkApproveMapel, pertanyaan, opsiJawaban, kunciJawaban, pembahasan } = body;

    // Bulk approve / Full Verifikasi for a specific subject
    if (bulkApproveMapel) {
      const userNorm = userMapel ? userMapel.replace(/-/g, "_").toUpperCase().trim() : null;
      const userCanonical = userNorm ? (SUBJECT_ALIASES[userNorm] || userNorm) : null;

      const targetNorm = bulkApproveMapel.replace(/-/g, "_").toUpperCase().trim();
      const targetCanonical = SUBJECT_ALIASES[targetNorm] || targetNorm;

      if (userRole !== "ADMIN" && userCanonical !== targetCanonical) {
        return NextResponse.json(
          { success: false, error: "Akses tidak diizinkan. Anda hanya dapat memvalidasi mata pelajaran yang diampu." },
          { status: 403 }
        );
      }

      const matchingCodes = [targetCanonical, targetNorm];
      Object.entries(SUBJECT_ALIASES).forEach(([alias, target]) => {
        if (target === targetCanonical) matchingCodes.push(alias);
      });
      const uniqueMatchingCodes = Array.from(new Set(matchingCodes));

      const result = await prisma.soal.updateMany({
        where: {
          mapel: { in: uniqueMatchingCodes },
          status: "MENUNGGU_VALIDASI",
        },
        data: {
          status: "AKTIF",
        },
      });

      const displayMapelName = getSubjectDisplayName(targetCanonical);

      return NextResponse.json({
        success: true,
        count: result.count,
        message: `Berhasil memvalidasi penuh ${result.count} butir soal menjadi AKTIF untuk mata pelajaran ${displayMapelName}.`,
      });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: "ID soal wajib disertakan" }, { status: 400 });
    }

    // Teacher can only edit questions of their subject
    if (userRole === "GURU" && userMapel) {
      const existing = await prisma.soal.findUnique({ where: { id } });
      if (existing) {
        const existingCanonical = SUBJECT_ALIASES[existing.mapel.toUpperCase().trim()] || existing.mapel.toUpperCase().trim();
        const userCanonical = SUBJECT_ALIASES[userMapel.toUpperCase().trim()] || userMapel.toUpperCase().trim();
        if (existingCanonical !== userCanonical) {
          return NextResponse.json({ success: false, error: "Anda tidak berhak mengedit soal di luar mapel Anda." }, { status: 403 });
        }
      }
    }

    const updateData: any = {};
    if (status) updateData.status = status;
    if (pertanyaan !== undefined) updateData.pertanyaan = pertanyaan;
    if (opsiJawaban !== undefined) updateData.opsiJawaban = typeof opsiJawaban === "string" ? opsiJawaban : JSON.stringify(opsiJawaban);
    if (kunciJawaban !== undefined) updateData.kunciJawaban = typeof kunciJawaban === "string" ? kunciJawaban : JSON.stringify(kunciJawaban);
    if (pembahasan !== undefined) updateData.pembahasan = pembahasan;

    const updated = await prisma.soal.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      soal: updated,
      message: `Status soal berhasil diubah menjadi ${updated.status}`,
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Gagal memperbarui data soal" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;
    const userMapel = (session?.user as any)?.mapel;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ success: false, error: "ID soal wajib ada" }, { status: 400 });

    // Teacher guard
    if (userRole === "GURU" && userMapel) {
      const existing = await prisma.soal.findUnique({ where: { id } });
      if (existing) {
        const existingCanonical = SUBJECT_ALIASES[existing.mapel.toUpperCase().trim()] || existing.mapel.toUpperCase().trim();
        const userCanonical = SUBJECT_ALIASES[userMapel.toUpperCase().trim()] || userMapel.toUpperCase().trim();
        if (existingCanonical !== userCanonical) {
          return NextResponse.json({ success: false, error: "Anda tidak berhak menghapus soal di luar mapel Anda." }, { status: 403 });
        }
      }
    }

    await prisma.soal.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Soal berhasil dihapus" });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: "Gagal menghapus soal" }, { status: 500 });
  }
}