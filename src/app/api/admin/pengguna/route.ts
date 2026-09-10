import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

import { getSubjectDisplayName, SUBJECT_ALIASES } from "@/lib/constants/subjects";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Halaman tidak ditemukan." }, { status: 404 });
    }

    const users = await prisma.userAdmin.findMany({
      select: {
        id: true,
        username: true,
        email: true,
        nama: true,
        role: true,
        mapel: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, users });
  } catch (error: any) {
    console.error("GET Users Error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat data staf" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Halaman tidak ditemukan." }, { status: 404 });
    }

    const body = await request.json();

    // 1. Batch CSV Import for Guru & Staf
    if (Array.isArray(body.users) && body.users.length > 0) {
      let importedCount = 0;
      for (const u of body.users) {
        if (!u.username || !u.email || !u.nama) continue;
        const normalizedUsername = String(u.username).trim().toLowerCase();
        const normalizedEmail = String(u.email).trim().toLowerCase();
        const role = String(u.role || "GURU").toUpperCase().trim() === "ADMIN" ? "ADMIN" : "GURU";

        let finalMapel: string | null = null;
        if (role === "GURU") {
          const raw = String(u.mapel || "MATEMATIKA").toUpperCase().trim();
          finalMapel = SUBJECT_ALIASES[raw] || raw;
        }

        await prisma.userAdmin.upsert({
          where: { username: normalizedUsername },
          create: {
            username: normalizedUsername,
            email: normalizedEmail,
            nama: String(u.nama).trim(),
            role,
            mapel: finalMapel,
            password: u.password ? String(u.password).trim() : "GuruTKA2026!",
          },
          update: {
            email: normalizedEmail,
            nama: String(u.nama).trim(),
            role,
            mapel: finalMapel,
            ...(u.password ? { password: String(u.password).trim() } : {}),
          },
        });
        importedCount++;
      }

      return NextResponse.json({
        success: true,
        count: importedCount,
        message: `Berhasil mengimpor ${importedCount} data guru dan staf.`,
      });
    }

    const { username, email, nama, role, mapel, password } = body;

    if (!username || !email || !nama || !role) {
      return NextResponse.json({ success: false, error: "Field username, email, nama, dan role wajib diisi." }, { status: 400 });
    }

    const existing = await prisma.userAdmin.findFirst({
      where: {
        OR: [{ email: email.trim().toLowerCase() }, { username: username.trim().toLowerCase() }],
      },
    });

    if (existing) {
      return NextResponse.json({ success: false, error: "Email atau Username sudah terdaftar." }, { status: 400 });
    }

    let finalMapel: string | null = null;
    if (role === "GURU") {
      const raw = (mapel || "MATEMATIKA").toUpperCase().trim();
      finalMapel = SUBJECT_ALIASES[raw] || raw;
    }

    const newUser = await prisma.userAdmin.create({
      data: {
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        nama: nama.trim(),
        role: role === "ADMIN" ? "ADMIN" : "GURU",
        mapel: finalMapel,
        password: password ? password.trim() : "password2026",
      },
    });

    return NextResponse.json({
      success: true,
      user: newUser,
      message: `Berhasil menambahkan akun ${role === "GURU" ? "Guru Mapel" : "Administrator"} atas nama ${nama}.`,
    });
  } catch (error: any) {
    console.error("POST User Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal menambahkan akun" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Halaman tidak ditemukan." }, { status: 404 });
    }

    const body = await request.json();
    const { id, nama, email, username, role, mapel, password } = body;

    if (!id) {
      return NextResponse.json({ success: false, error: "ID pengguna diperlukan." }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (nama) dataToUpdate.nama = nama.trim();
    if (email) dataToUpdate.email = email.trim().toLowerCase();
    if (username) dataToUpdate.username = username.trim().toLowerCase();
    if (role) {
      dataToUpdate.role = role === "ADMIN" ? "ADMIN" : "GURU";
      if (role === "GURU") {
        const raw = (mapel || "MATEMATIKA").toUpperCase().trim();
        dataToUpdate.mapel = SUBJECT_ALIASES[raw] || raw;
      } else {
        dataToUpdate.mapel = null;
      }
    } else if (mapel !== undefined) {
      const raw = (mapel || "MATEMATIKA").toUpperCase().trim();
      dataToUpdate.mapel = SUBJECT_ALIASES[raw] || raw;
    }
    if (password) dataToUpdate.password = password.trim();

    const updated = await prisma.userAdmin.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json({
      success: true,
      user: updated,
      message: "Data pengguna berhasil diperbarui.",
    });
  } catch (error: any) {
    console.error("PUT User Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal memperbarui pengguna" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const currentUser = session?.user as any;

    if (currentUser?.role !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Halaman tidak ditemukan." }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ success: false, error: "ID pengguna diperlukan." }, { status: 400 });
    }

    if (currentUser.id === id) {
      return NextResponse.json({ success: false, error: "Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif." }, { status: 400 });
    }

    await prisma.userAdmin.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "Akun pengguna berhasil dihapus.",
    });
  } catch (error: any) {
    console.error("DELETE User Error:", error);
    return NextResponse.json({ success: false, error: error.message || "Gagal menghapus pengguna" }, { status: 500 });
  }
}
