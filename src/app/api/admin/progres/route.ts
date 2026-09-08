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

    const WAJIB_CODES = ["MATEMATIKA", "BAHASA_INDONESIA", "BAHASA_INGGRIS"];
    const normMapel = mapel.replace(/-/g, "_").toUpperCase().trim();
    const canonicalMapel = SUBJECT_ALIASES[normMapel] || normMapel;
    const isWajib = mapel === "ALL" || WAJIB_CODES.includes(normMapel) || WAJIB_CODES.includes(canonicalMapel);

    // Subject aliases matching
    const matchingCodes = [canonicalMapel, normMapel];
    Object.entries(SUBJECT_ALIASES).forEach(([alias, target]) => {
      if (target === canonicalMapel) matchingCodes.push(alias);
    });
    const uniqueMatchingCodes = Array.from(new Set(matchingCodes));

    // Fetch all students to evaluate class & subject enrollment
    const allStudents = await prisma.siswa.findMany({
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

    // Check if student takes the active mapel
    const isStudentTakingMapel = (s: any): boolean => {
      if (s.statusTka === "TIDAK_IKUT") return false;
      if (isWajib) return true;
      return isSubjectAllowedForStudent(canonicalMapel, s).allowed;
    };

    // Determine target students:
    // Level 2 (kelas !== "ALL"): only students in that class who take this subject
    // Level 1 (kelas === "ALL"): all students taking this subject
    let eligibleStudents = allStudents.filter(isStudentTakingMapel);
    if (kelas !== "ALL") {
      eligibleStudents = eligibleStudents.filter(
        (s) => s.namaKelas === kelas || s.kelasId === kelas
      );
    }
    const eligibleStudentIds = eligibleStudents.map((s) => s.id);

    // Fetch progress records
    const progressWhere: any = {};
    if (eligibleStudentIds.length > 0) {
      progressWhere.siswaId = { in: eligibleStudentIds };
    } else {
      progressWhere.siswaId = "NONE";
    }

    // When viewing Level 1, only load records for this mapel if mapel !== "ALL"
    if (kelas === "ALL" && mapel !== "ALL") {
      progressWhere.soal = { mapel: { in: uniqueMatchingCodes } };
    }

    const records =
      eligibleStudentIds.length > 0
        ? await prisma.progresLatihan.findMany({
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
          })
        : [];

    // Filter active submissions for this mapel (for KPI)
    const activeSubmissions = records.filter((r) => {
      const mCode = (r.soal?.mapel || "").toUpperCase().trim();
      return (
        mapel === "ALL" ||
        uniqueMatchingCodes.includes(mCode) ||
        uniqueMatchingCodes.includes(SUBJECT_ALIASES[mCode] || mCode)
      );
    });

    const totalSubmissions = activeSubmissions.length;
    const correctCount = activeSubmissions.filter((r) => r.isBenar).length;
    const overallAccuracy =
      totalSubmissions > 0 ? Math.round((correctCount / totalSubmissions) * 100) : 0;

    // Build Student Map initialized with eligible students
    const studentMap: { [siswaId: string]: any } = {};

    eligibleStudents.forEach((s) => {
      studentMap[s.id] = {
        id: s.id,
        nis: s.nis,
        nama: s.nama,
        email: s.email,
        jurusan: s.jurusan,
        namaKelas: s.namaKelas || kelas || "Tanpa Kelas",
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

    // Process progress records
    records.forEach((r) => {
      const s = r.siswa;
      if (!studentMap[s.id]) return;

      let mCode = (r.soal?.mapel || "LAINNYA").toUpperCase().trim();
      if (SUBJECT_ALIASES[mCode]) mCode = SUBJECT_ALIASES[mCode];

      // Zero-Trust: only accumulate exercises for authorized subjects (3 Wajib + chosen electives)
      const auth = isSubjectAllowedForStudent(mCode, s);
      if (!auth.allowed) return;

      if (!studentMap[s.id].mapelProgress[mCode]) {
        studentMap[s.id].mapelProgress[mCode] = {
          totalPengerjaan: 0,
          totalBenar: 0,
          lastSync: r.syncedAt,
        };
      }

      studentMap[s.id].mapelProgress[mCode].totalPengerjaan++;
      if (r.isBenar) studentMap[s.id].mapelProgress[mCode].totalBenar++;

      // Only accumulate to student's table metrics if this question belongs to the active mapel
      const isRecordForActiveMapel =
        mapel === "ALL" ||
        uniqueMatchingCodes.includes(mCode) ||
        uniqueMatchingCodes.includes((r.soal?.mapel || "").toUpperCase().trim());

      if (isRecordForActiveMapel) {
        studentMap[s.id].totalPengerjaan++;
        if (r.isBenar) studentMap[s.id].totalBenar++;
        studentMap[s.id].totalSkor += r.skor;

        if (
          !studentMap[s.id].lastSync ||
          new Date(r.syncedAt) > new Date(studentMap[s.id].lastSync)
        ) {
          studentMap[s.id].lastSync = r.syncedAt;
        }
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

    // Compute progress comparison per class (Level 1)
    const registeredClasses = await prisma.kelas.findMany({
      select: {
        nama: true,
      },
      orderBy: { nama: "asc" },
    });

    const allClassesSet = new Set<string>();
    registeredClasses.forEach((k) => allClassesSet.add(k.nama));
    allStudents.forEach((s) => {
      if (s.namaKelas) allClassesSet.add(s.namaKelas);
    });
    const classList = Array.from(allClassesSet).sort((a, b) => a.localeCompare(b));

    const classProgressSummary: any[] = [];

    for (const className of classList) {
      const studentsInThisClass = allStudents.filter(
        (s) => s.namaKelas === className || s.kelasId === className
      );
      const eligibleInThisClass = studentsInThisClass.filter(isStudentTakingMapel);

      // Mapel Pilihan: ONLY show classes that have at least 1 student taking this subject
      // Mapel Wajib / ALL: show all classes
      if (!isWajib && eligibleInThisClass.length === 0) {
        continue;
      }

      const eligibleIds = new Set(eligibleInThisClass.map((s) => s.id));
      let classPengerjaan = 0;
      let classBenar = 0;
      const attemptedStudents = new Set<string>();

      records.forEach((r) => {
        if (eligibleIds.has(r.siswaId)) {
          const mCode = (r.soal?.mapel || "").toUpperCase().trim();
          const matches =
            mapel === "ALL" ||
            uniqueMatchingCodes.includes(mCode) ||
            uniqueMatchingCodes.includes(SUBJECT_ALIASES[mCode] || mCode);

          if (matches) {
            classPengerjaan++;
            if (r.isBenar) classBenar++;
            attemptedStudents.add(r.siswaId);
          }
        }
      });

      const avgScore =
        classPengerjaan > 0 ? Math.round((classBenar / classPengerjaan) * 100) : 0;

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

      classProgressSummary.push({
        namaKelas: className,
        totalSiswa: eligibleInThisClass.length,
        totalSiswaAktif: attemptedStudents.size,
        totalPengerjaan: classPengerjaan,
        totalBenar: classBenar,
        avgScore,
        status,
        statusLabel,
      });
    }

    // Sort classProgressSummary: classes with LAMBAT first, then CUKUP, then BAGUS
    classProgressSummary.sort((a, b) => {
      const pMap = { LAMBAT: 1, CUKUP: 2, BAGUS: 3 };
      if (
        pMap[a.status as "LAMBAT" | "CUKUP" | "BAGUS"] !==
        pMap[b.status as "LAMBAT" | "CUKUP" | "BAGUS"]
      ) {
        return (
          pMap[a.status as "LAMBAT" | "CUKUP" | "BAGUS"] -
          pMap[b.status as "LAMBAT" | "CUKUP" | "BAGUS"]
        );
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
      isWajib,
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

