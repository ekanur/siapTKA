import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const mapel = searchParams.get("mapel");

    const where: any = {};
    if (mapel) where.mapel = mapel.toUpperCase();

    const list = await prisma.kisiKisi.findMany({
      where,
      include: {
        _count: {
          select: { soalList: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, count: list.length, kisiKisi: list });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Gagal memuat kisi-kisi" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { mapel, topik, definisi, muatan, kompetensi, matriksAsesmen, contohSoal } = body;

    if (!mapel || !topik) {
      return NextResponse.json({ success: false, error: "Mapel dan Topik wajib diisi" }, { status: 400 });
    }

    const created = await prisma.kisiKisi.create({
      data: {
        mapel: mapel.toUpperCase(),
        topik,
        definisi: definisi || "",
        muatan: muatan || "",
        kompetensi: kompetensi || "",
        matriksAsesmen: matriksAsesmen || "",
        contohSoal: contohSoal || "",
      },
    });

    return NextResponse.json({ success: true, kisiKisi: created });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message || "Gagal membuat kisi-kisi" }, { status: 500 });
  }
}