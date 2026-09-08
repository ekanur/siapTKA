import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { SUBJECT_ALIASES, getSubjectTkaDetail } from "@/lib/constants/subjects";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/mapel-info?mapel=...
 * Returns the subject description from database or falls back to official default Kemendikdasmen TKA description.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mapelParam = searchParams.get("mapel");

    if (!mapelParam) {
      return NextResponse.json(
        { success: false, error: "Parameter mapel wajib disertakan" },
        { status: 400 }
      );
    }

    const norm = mapelParam.replace(/-/g, "_").toUpperCase().trim();
    const canonical = SUBJECT_ALIASES[norm] || norm;

    // 1. Query custom description if saved (with raw SQLite fallback)
    let record: any = null;
    if ((prisma as any).mapelInfo?.findUnique) {
      try {
        record = await (prisma as any).mapelInfo.findUnique({
          where: { kode: canonical },
        });
      } catch {}
    }

    if (!record) {
      try {
        const rows: any = await prisma.$queryRawUnsafe(
          "SELECT kode, deskripsi, updatedBy, updatedAt, createdAt FROM MapelInfo WHERE kode = ? LIMIT 1",
          canonical
        );
        if (Array.isArray(rows) && rows.length > 0) {
          record = rows[0];
        }
      } catch (rawErr) {
        console.warn("Raw query MapelInfo fallback warning:", rawErr);
      }
    }

    const defaultTka = getSubjectTkaDetail(canonical);

    if (record && record.deskripsi?.trim()) {
      return NextResponse.json({
        success: true,
        kode: canonical,
        deskripsi: record.deskripsi,
        defaultDeskripsi: defaultTka.deskripsiTka,
        isCustom: true,
        updatedBy: record.updatedBy,
        updatedAt: record.updatedAt,
      });
    }

    return NextResponse.json({
      success: true,
      kode: canonical,
      deskripsi: defaultTka.deskripsiTka,
      defaultDeskripsi: defaultTka.deskripsiTka,
      isCustom: false,
      updatedBy: null,
      updatedAt: null,
    });
  } catch (error: any) {
    console.error("Error fetching mapel info:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil informasi mata pelajaran" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/mapel-info
 * Body: { mapel: string, deskripsi: string }
 * Updates or creates custom description for a subject.
 * Admin can edit all subjects. Guru can only edit their assigned subject.
 */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Tidak memiliki otorisasi (Silakan login)" },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role;
    const userMapel = (session.user as any)?.mapel;

    if (userRole !== "ADMIN" && userRole !== "GURU") {
      return NextResponse.json(
        { success: false, error: "Akses ditolak: Hanya Admin dan Guru yang dapat mengubah deskripsi" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { mapel, deskripsi } = body;

    if (!mapel || typeof deskripsi !== "string") {
      return NextResponse.json(
        { success: false, error: "Parameter mapel dan deskripsi wajib disertakan" },
        { status: 400 }
      );
    }

    const norm = mapel.replace(/-/g, "_").toUpperCase().trim();
    const canonical = SUBJECT_ALIASES[norm] || norm;

    // Check Guru permission
    if (userRole === "GURU") {
      const normGuruMapel = (userMapel || "").replace(/-/g, "_").toUpperCase().trim();
      const canonicalGuruMapel = SUBJECT_ALIASES[normGuruMapel] || normGuruMapel;

      if (canonical !== canonicalGuruMapel) {
        return NextResponse.json(
          {
            success: false,
            error: `Guru hanya dapat mengubah deskripsi untuk mata pelajaran ${canonicalGuruMapel}`,
          },
          { status: 403 }
        );
      }
    }

    const trimmedDesc = deskripsi.trim();
    const authorName = (session.user as any)?.nama || session.user.name || session.user.email || "Staf TKA";
    const updatedByStr = `${authorName} (${userRole})`;

    let saved: any = null;

    // Try standard Prisma model if available in memory
    if ((prisma as any).mapelInfo?.upsert) {
      try {
        saved = await (prisma as any).mapelInfo.upsert({
          where: { kode: canonical },
          update: {
            deskripsi: trimmedDesc,
            updatedBy: updatedByStr,
          },
          create: {
            kode: canonical,
            deskripsi: trimmedDesc,
            updatedBy: updatedByStr,
          },
        });
      } catch (upsertErr) {
        console.warn("Prisma mapelInfo.upsert failed, falling back to raw SQLite:", upsertErr);
      }
    }

    // Direct SQLite raw upsert fallback (guaranteed to succeed regardless of client cache)
    if (!saved) {
      const nowIso = new Date().toISOString();
      await prisma.$executeRawUnsafe(
        "INSERT INTO MapelInfo (kode, deskripsi, updatedBy, updatedAt, createdAt) VALUES (?, ?, ?, ?, ?) ON CONFLICT(kode) DO UPDATE SET deskripsi = excluded.deskripsi, updatedBy = excluded.updatedBy, updatedAt = excluded.updatedAt",
        canonical,
        trimmedDesc,
        updatedByStr,
        nowIso,
        nowIso
      );
      saved = {
        kode: canonical,
        deskripsi: trimmedDesc,
        updatedBy: updatedByStr,
        updatedAt: nowIso,
      };
    }

    return NextResponse.json({
      success: true,
      message: "Deskripsi mata pelajaran berhasil diperbarui",
      data: saved,
    });
  } catch (error: any) {
    console.error("Error saving mapel info:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan deskripsi mata pelajaran" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/mapel-info?mapel=...
 * Resets subject description to default by removing the custom record.
 */
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json(
        { success: false, error: "Tidak memiliki otorisasi" },
        { status: 401 }
      );
    }

    const userRole = (session.user as any)?.role;
    const userMapel = (session.user as any)?.mapel;

    if (userRole !== "ADMIN" && userRole !== "GURU") {
      return NextResponse.json(
        { success: false, error: "Akses ditolak" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const mapelParam = searchParams.get("mapel");
    if (!mapelParam) {
      return NextResponse.json(
        { success: false, error: "Parameter mapel wajib disertakan" },
        { status: 400 }
      );
    }

    const norm = mapelParam.replace(/-/g, "_").toUpperCase().trim();
    const canonical = SUBJECT_ALIASES[norm] || norm;

    if (userRole === "GURU") {
      const normGuruMapel = (userMapel || "").replace(/-/g, "_").toUpperCase().trim();
      const canonicalGuruMapel = SUBJECT_ALIASES[normGuruMapel] || normGuruMapel;

      if (canonical !== canonicalGuruMapel) {
        return NextResponse.json(
          { success: false, error: "Akses ditolak" },
          { status: 403 }
        );
      }
    }

    if ((prisma as any).mapelInfo?.deleteMany) {
      try {
        await (prisma as any).mapelInfo.deleteMany({
          where: { kode: canonical },
        });
      } catch {}
    }

    try {
      await prisma.$executeRawUnsafe("DELETE FROM MapelInfo WHERE kode = ?", canonical);
    } catch {}

    const defaultTka = getSubjectTkaDetail(canonical);

    return NextResponse.json({
      success: true,
      message: "Deskripsi berhasil dikembalikan ke standar TKA",
      defaultDeskripsi: defaultTka.deskripsiTka,
    });
  } catch (error: any) {
    console.error("Error resetting mapel info:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mereset deskripsi mata pelajaran" },
      { status: 500 }
    );
  }
}
