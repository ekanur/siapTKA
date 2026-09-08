import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getSubjectDisplayName, SUBJECT_ALIASES, isSubjectAllowedForStudent } from "@/lib/constants/subjects";

export const dynamic = "force-dynamic";

function getProgressStatus(score: number, hasAttempted: boolean) {
  if (!hasAttempted) {
    return { status: "BELUM_MULAI", label: "Belum Dikerjakan", color: "slate" };
  }
  if (score <= 50) {
    return { status: "LAMBAT", label: "Progres Lambat", color: "rose" };
  }
  if (score <= 75) {
    return { status: "CUKUP", label: "Progres Cukup", color: "amber" };
  }
  return { status: "BAGUS", label: "Progres Bagus", color: "emerald" };
}

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
      const matchedMapels = [norm];
      Object.entries(SUBJECT_ALIASES).forEach(([alias, target]) => {
        if (target === norm) matchedMapels.push(alias);
      });
      if (SUBJECT_ALIASES[norm]) {
        matchedMapels.push(SUBJECT_ALIASES[norm]);
      }
      progressWhere.soal = { mapel: { in: matchedMapels } };
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
    const overallAccuracy =
      totalSubmissions > 0 ? Math.round((correctCount / totalSubmissions) * 100) : 0;

    // Build Student Map
    const studentMap: { [siswaId: string]: any } = {};

    // If viewing a specific class, fetch all students in that class so 0-attempt students are also listed
    if (kelas !== "ALL") {
      const classStudents = await prisma.siswa.findMany({
        where: {
          OR: [{ kelasId: kelas }, { namaKelas: kelas }],
        },
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
        orderBy: { nama: "asc" },
      });

      classStudents.forEach((s) => {
        studentMap[s.id] = {
          id: s.id,
          nis: s.nis,
          nama: s.nama,
          email: s.email,
          jurusan: s.jurusan,
          namaKelas: s.namaKelas || kelas,
          industri: s.namaIndustriPkl,
          mapelPilihan1: s.mapelPilihan1,
          mapelPilihan2: s.mapelPilihan2,
          statusTka: s.statusTka,
          totalPengerjaan: 0,
          totalBenar: 0,
          totalSkor: 0,
          lastSync: null,
          mapelProgress: {},
        };
      });
    }

    // Process progress records
    records.forEach((r) => {
      const s = r.siswa;
      if (!studentMap[s.id]) {
        studentMap[s.id] = {
          id: s.id,
          nis: s.nis,
          nama: s.nama,
          email: s.email,
          jurusan: s.jurusan,
          namaKelas: s.namaKelas || "Tanpa Kelas",
          industri: s.namaIndustriPkl,
          mapelPilihan1: s.mapelPilihan1,
          mapelPilihan2: s.mapelPilihan2,
          statusTka: s.statusTka,
          totalPengerjaan: 0,
          totalBenar: 0,
          totalSkor: 0,
          lastSync: r.syncedAt,
          mapelProgress: {},
        };
      }

      let mCode = (r.soal?.mapel || "LAINNYA").toUpperCase().trim();
      if (SUBJECT_ALIASES[mCode]) mCode = SUBJECT_ALIASES[mCode];

      // Zero-Trust: only accumulate exercises for authorized subjects (3 Wajib + chosen electives)
      const auth = isSubjectAllowedForStudent(mCode, s);
      if (!auth.allowed) {
        return;
      }

      if (!studentMap[s.id].mapelProgress[mCode]) {
        studentMap[s.id].mapelProgress[mCode] = {
          totalPengerjaan: 0,
          totalBenar: 0,
          lastSync: r.syncedAt,
        };
      }

      studentMap[s.id].totalPengerjaan++;
      if (r.isBenar) studentMap[s.id].totalBenar++;
      studentMap[s.id].totalSkor += r.skor;

      studentMap[s.id].mapelProgress[mCode].totalPengerjaan++;
      if (r.isBenar) studentMap[s.id].mapelProgress[mCode].totalBenar++;

      if (
        !studentMap[s.id].lastSync ||
        new Date(r.syncedAt) > new Date(studentMap[s.id].lastSync)
      ) {
        studentMap[s.id].lastSync = r.syncedAt;
      }
      if (
        !studentMap[s.id].mapelProgress[mCode].lastSync ||
        new Date(r.syncedAt) > new Date(studentMap[s.id].mapelProgress[mCode].lastSync)
      ) {
        studentMap[s.id].mapelProgress[mCode].lastSync = r.syncedAt;
      }
    });

    const studentList = Object.values(studentMap).map((st: any) => {
      const avgScore =
        st.totalPengerjaan > 0 ? Math.round((st.totalBenar / st.totalPengerjaan) * 100) : 0;
      const statusObj = getProgressStatus(avgScore, st.totalPengerjaan > 0);

      // Build subject breakdown (3 Wajib TKA + Mapel Pilihan 1 & 2)
      const subjectBreakdown: any[] = [];

      // 1. Three Wajib TKA
      const WAJIB_SUBJECTS = [
        { id: "MATEMATIKA", name: "Matematika (Wajib)" },
        { id: "BAHASA_INDONESIA", name: "Bahasa Indonesia (Wajib)" },
        { id: "BAHASA_INGGRIS", name: "Bahasa Inggris (Wajib)" },
      ];

      WAJIB_SUBJECTS.forEach((w) => {
        const p = st.mapelProgress[w.id] || {
          totalPengerjaan: 0,
          totalBenar: 0,
          lastSync: null,
        };
        const score =
          p.totalPengerjaan > 0 ? Math.round((p.totalBenar / p.totalPengerjaan) * 100) : 0;
        const subStatus = getProgressStatus(score, p.totalPengerjaan > 0);
        subjectBreakdown.push({
          id: w.id,
          name: w.name,
          category: "WAJIB",
          categoryLabel: "Mata Pelajaran Wajib TKA",
          totalPengerjaan: p.totalPengerjaan,
          totalBenar: p.totalBenar,
          totalSalah: p.totalPengerjaan - p.totalBenar,
          score,
          status: subStatus.status,
          statusLabel: subStatus.label,
          color: subStatus.color,
          lastSync: p.lastSync,
        });
      });

      // 2. Elective 1 (Pilihan 1)
      if (st.mapelPilihan1) {
        let p1Code = st.mapelPilihan1.toUpperCase().trim();
        if (SUBJECT_ALIASES[p1Code]) p1Code = SUBJECT_ALIASES[p1Code];
        const p =
          st.mapelProgress[p1Code] ||
          st.mapelProgress[st.mapelPilihan1] || {
            totalPengerjaan: 0,
            totalBenar: 0,
            lastSync: null,
          };
        const score =
          p.totalPengerjaan > 0 ? Math.round((p.totalBenar / p.totalPengerjaan) * 100) : 0;
        const subStatus = getProgressStatus(score, p.totalPengerjaan > 0);
        subjectBreakdown.push({
          id: p1Code,
          name: getSubjectDisplayName(p1Code),
          category: "PILIHAN_1",
          categoryLabel: "Mata Pelajaran Pilihan 1",
          totalPengerjaan: p.totalPengerjaan,
          totalBenar: p.totalBenar,
          totalSalah: p.totalPengerjaan - p.totalBenar,
          score,
          status: subStatus.status,
          statusLabel: subStatus.label,
          color: subStatus.color,
          lastSync: p.lastSync,
        });
      }

      // 3. Elective 2 (Pilihan 2)
      if (st.mapelPilihan2) {
        let p2Code = st.mapelPilihan2.toUpperCase().trim();
        if (SUBJECT_ALIASES[p2Code]) p2Code = SUBJECT_ALIASES[p2Code];
        const p =
          st.mapelProgress[p2Code] ||
          st.mapelProgress[st.mapelPilihan2] || {
            totalPengerjaan: 0,
            totalBenar: 0,
            lastSync: null,
          };
        const score =
          p.totalPengerjaan > 0 ? Math.round((p.totalBenar / p.totalPengerjaan) * 100) : 0;
        const subStatus = getProgressStatus(score, p.totalPengerjaan > 0);
        subjectBreakdown.push({
          id: p2Code,
          name: getSubjectDisplayName(p2Code),
          category: "PILIHAN_2",
          categoryLabel: "Mata Pelajaran Pilihan 2",
          totalPengerjaan: p.totalPengerjaan,
          totalBenar: p.totalBenar,
          totalSalah: p.totalPengerjaan - p.totalBenar,
          score,
          status: subStatus.status,
          statusLabel: subStatus.label,
          color: subStatus.color,
          lastSync: p.lastSync,
        });
      }

      return {
        ...st,
        avgScore,
        status: statusObj.status,
        statusLabel: statusObj.label,
        color: statusObj.color,
        subjectBreakdown,
      };
    });

    // Compute progress comparison per class
    // Include all registered classes
    const registeredClasses = await prisma.kelas.findMany({
      select: {
        nama: true,
      },
      orderBy: { nama: "asc" },
    });

    const classMap: {
      [className: string]: {
        totalSkor: number;
        totalPengerjaan: number;
        totalBenar: number;
        students: Set<string>;
      };
    } = {};

    registeredClasses.forEach((k) => {
      classMap[k.nama] = {
        totalSkor: 0,
        totalPengerjaan: 0,
        totalBenar: 0,
        students: new Set(),
      };
    });

    records.forEach((r) => {
      const className = r.siswa.namaKelas || "Tanpa Kelas";
      if (!classMap[className]) {
        classMap[className] = {
          totalSkor: 0,
          totalPengerjaan: 0,
          totalBenar: 0,
          students: new Set(),
        };
      }
      classMap[className].totalSkor += r.skor;
      classMap[className].totalPengerjaan++;
      if (r.isBenar) classMap[className].totalBenar++;
      classMap[className].students.add(r.siswa.id);
    });

    // Class Progress Summary with user-specified thresholds:
    // 0 - 50%: Progres Lambat
    // 51 - 75%: Progres Cukup
    // 76 - 100%: Progres Bagus
    const classProgressSummary = Object.entries(classMap)
      .filter(([_, val]) => val.totalPengerjaan > 0 || kelas !== "ALL")
      .map(([namaKelas, val]) => {
        const avgScore =
          val.totalPengerjaan > 0 ? Math.round((val.totalBenar / val.totalPengerjaan) * 100) : 0;
        let status: "LAMBAT" | "CUKUP" | "BAGUS" = "LAMBAT";
        let statusLabel = "Progres Lambat";

        if (avgScore > 75) {
          status = "BAGUS";
          statusLabel = "Progres Bagus";
        } else if (avgScore > 50) {
          status = "CUKUP";
          statusLabel = "Progres Cukup";
        } else {
          status = "LAMBAT";
          statusLabel = "Progres Lambat";
        }

        return {
          namaKelas,
          totalSiswaAktif: val.students.size,
          totalPengerjaan: val.totalPengerjaan,
          avgScore,
          status,
          statusLabel,
        };
      });

    // Sort classProgressSummary: classes with LAMBAT first, then CUKUP, then BAGUS
    classProgressSummary.sort((a, b) => {
      const pMap = { LAMBAT: 1, CUKUP: 2, BAGUS: 3 };
      if (pMap[a.status] !== pMap[b.status]) {
        return pMap[a.status] - pMap[b.status];
      }
      return a.avgScore - b.avgScore;
    });

    // Summary counts based on student readiness
    let scoreBagus = 0; // 76 - 100%
    let scoreCukup = 0; // 51 - 75%
    let scoreLambat = 0; // 0 - 50%
    studentList.forEach((s) => {
      if (s.avgScore > 75) scoreBagus++;
      else if (s.avgScore > 50) scoreCukup++;
      else scoreLambat++;
    });

    const scoreDistributionChart = [
      { name: "Progres Bagus (76-100%)", value: scoreBagus, fill: "#10b981" },
      { name: "Progres Cukup (51-75%)", value: scoreCukup, fill: "#f59e0b" },
      { name: "Progres Lambat (0-50%)", value: scoreLambat, fill: "#ef4444" },
    ];

    const topicMap: { [topic: string]: { totalBenar: number; totalPengerjaan: number } } = {};
    records.forEach((r) => {
      let t = r.soal?.mapel || "Latihan Mandiri";
      if (SUBJECT_ALIASES[t]) t = SUBJECT_ALIASES[t];
      t = getSubjectDisplayName(t, true);

      if (!topicMap[t]) topicMap[t] = { totalBenar: 0, totalPengerjaan: 0 };
      topicMap[t].totalPengerjaan++;
      if (r.isBenar) topicMap[t].totalBenar++;
    });

    const topicChartData = Object.entries(topicMap)
      .map(([topik, val]) => ({
        topik: topik.length > 20 ? topik.slice(0, 18) + "..." : topik,
        fullTopik: topik,
        avgScore: Math.round((val.totalBenar / val.totalPengerjaan) * 100),
        count: val.totalPengerjaan,
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
        scoreBagus,
        scoreCukup,
        scoreLambat,
        scoreHigh: scoreBagus,
        scoreMid: scoreCukup,
        scoreLow: scoreLambat,
      },
      classProgressSummary,
      scoreDistributionChart,
      topicChartData,
      students: studentList,
    });
  } catch (error: any) {
    console.error("GET Progres Error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat progres siswa" },
      { status: 500 }
    );
  }
}

