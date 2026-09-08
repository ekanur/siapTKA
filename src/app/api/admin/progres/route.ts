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

    if (!session || !["ADMIN", "GURU"].includes(userRole)) {
      return NextResponse.json({ success: false, error: "Akses tidak diizinkan" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let mapel = searchParams.get("mapel") || "ALL";
    const kelas = searchParams.get("kelas") || "ALL";

    if (userRole === "GURU" && userMapel) {
      mapel = userMapel;
    }

    const progressWhere: any = {};
    if (mapel !== "ALL") {
      const norm = mapel.replace(/-/g, "_").toUpperCase();
      if (norm === "AIJ" || norm === "ADMINISTRASI_INFRASTRUKTUR_JARINGAN") {
        progressWhere.soal = { mapel: { in: ["ADMINISTRASI_INFRASTRUKTUR_JARINGAN", "AIJ"] } };
      } else {
        progressWhere.soal = { mapel: norm };
      }
    }

    if (kelas !== "ALL") {
      progressWhere.siswa = {
        OR: [{ kelasId: kelas }, { namaKelas: kelas }],
      };
    }

    const records = await prisma.progresLatihan.findMany({
      where: progressWhere,
      include: {
        siswa: {
          select: {
            id: true,
            nis: true,
            nama: true,
            email: true,
            jurusan: true,
            kelasId: true,
            namaKelas: true,
            namaIndustriPkl: true,
            statusTka: true,
            mapelPilihan1: true,
            mapelPilihan2: true,
          },
        },
        soal: {
          select: {
            id: true,
            mapel: true,
            tipeSoal: true,
          },
        },
      },
      orderBy: { syncedAt: "desc" },
    });

    const totalSubmissions = records.length;
    const correctCount = records.filter((r) => r.isBenar).length;
    const overallAccuracy = totalSubmissions > 0 ? Math.round((correctCount / totalSubmissions) * 100) : 0;

    const studentMap: { [siswaId: string]: any } = {};
    records.forEach((r) => {
      const s = r.siswa;
      if (!studentMap[s.id]) {
        studentMap[s.id] = {
          id: s.id,
          nis: s.nis,
          nama: s.nama,
          namaKelas: s.namaKelas || "Tanpa Kelas",
          industri: s.namaIndustriPkl,
          totalPengerjaan: 0,
          totalBenar: 0,
          totalSkor: 0,
          lastSync: r.syncedAt,
        };
      }
      studentMap[s.id].totalPengerjaan++;
      if (r.isBenar) studentMap[s.id].totalBenar++;
      studentMap[s.id].totalSkor += r.skor;
      if (new Date(r.syncedAt) > new Date(studentMap[s.id].lastSync)) {
        studentMap[s.id].lastSync = r.syncedAt;
      }
    });

    const studentList = Object.values(studentMap).map((st: any) => {
      const avgScore = st.totalPengerjaan > 0 ? Math.round(st.totalSkor / st.totalPengerjaan) : 0;
      return {
        ...st,
        avgScore,
        status: avgScore >= 75 ? "Tuntas" : avgScore >= 50 ? "Cukup" : "Perlu Bimbingan",
      };
    });

    // Compute progress comparison per class
    const classMap: { [className: string]: { totalSkor: number; totalPengerjaan: number; students: Set<string> } } = {};
    records.forEach((r) => {
      const className = r.siswa.namaKelas || "Tanpa Kelas";
      if (!classMap[className]) {
        classMap[className] = { totalSkor: 0, totalPengerjaan: 0, students: new Set() };
      }
      classMap[className].totalSkor += r.skor;
      classMap[className].totalPengerjaan++;
      classMap[className].students.add(r.siswa.id);
    });

    const classProgressSummary = Object.entries(classMap).map(([namaKelas, val]) => {
      const avgScore = val.totalPengerjaan > 0 ? Math.round(val.totalSkor / val.totalPengerjaan) : 0;
      return {
        namaKelas,
        totalSiswaAktif: val.students.size,
        totalPengerjaan: val.totalPengerjaan,
        avgScore,
        status: avgScore >= 75 ? "BAIK" : avgScore >= 55 ? "CUKUP" : "PROGRES_LAMBAT",
      };
    });

    let scoreHigh = 0;
    let scoreMid = 0;
    let scoreLow = 0;
    studentList.forEach((s) => {
      if (s.avgScore >= 75) scoreHigh++;
      else if (s.avgScore >= 50) scoreMid++;
      else scoreLow++;
    });

    const scoreDistributionChart = [
      { name: "Tuntas (≥ 75)", value: scoreHigh, fill: "#10b981" },
      { name: "Cukup (50-74)", value: scoreMid, fill: "#f59e0b" },
      { name: "Perlu Penguatan (< 50)", value: scoreLow, fill: "#ef4444" },
    ];

    const topicMap: { [topic: string]: { totalScore: number; count: number } } = {};
    records.forEach((r) => {
      const t = r.soal?.mapel || "Latihan Mandiri";
      if (!topicMap[t]) topicMap[t] = { totalScore: 0, count: 0 };
      topicMap[t].totalScore += r.skor;
      topicMap[t].count++;
    });

    const topicChartData = Object.entries(topicMap)
      .map(([topik, val]) => ({
        topik: topik.length > 20 ? topik.slice(0, 18) + "..." : topik,
        fullTopik: topik,
        avgScore: Math.round(val.totalScore / val.count),
        count: val.count,
      }))
      .slice(0, 7);

    return NextResponse.json({
      success: true,
      currentMapel: mapel,
      currentKelas: kelas,
      isGuru: userRole === "GURU",
      summary: {
        totalSubmissions,
        uniqueStudents: studentList.length,
        overallAccuracy,
        scoreHigh,
        scoreMid,
        scoreLow,
      },
      classProgressSummary,
      scoreDistributionChart,
      topicChartData,
      students: studentList,
    });
  } catch (error: any) {
    console.error("GET Progres Error:", error);
    return NextResponse.json({ success: false, error: "Gagal memuat progres siswa" }, { status: 500 });
  }
}
