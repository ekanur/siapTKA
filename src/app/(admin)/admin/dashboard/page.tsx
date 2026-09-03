import React from "react";
import prisma from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  Award,
  ArrowRight,
  TrendingUp,
  BookOpen,
  Calendar,
  FileSpreadsheet,
  CheckSquare,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const session = await getServerSession(authOptions);
  const userRole = (session?.user as any)?.role || "ADMIN";
  const userMapel = (session?.user as any)?.mapel || null;

  // If user is a subject teacher, render the Teacher Dashboard view
  if (userRole === "GURU") {
    const mapelFilter = userMapel ? { mapel: userMapel } : {};
    const soalMapelAktif = await prisma.soal.count({
      where: { ...mapelFilter, status: "AKTIF" },
    });
    const soalMapelPending = await prisma.soal.count({
      where: { ...mapelFilter, status: "MENUNGGU_VALIDASI" },
    });
    const progresMapel = await prisma.progresLatihan.findMany({
      where: { soal: mapelFilter },
      select: { isBenar: true },
    });
    const totalPengerjaan = progresMapel.length;
    const benarCount = progresMapel.filter((p) => p.isBenar).length;
    const akurasiMapel = totalPengerjaan > 0 ? Math.round((benarCount / totalPengerjaan) * 100) : 0;

    return (
      <div className="space-y-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 w-fit mb-2">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Portal Guru Mata Pelajaran</span>
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Selamat Datang, {session?.user?.name || "Bapak/Ibu Guru"}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Pengampu Mata Pelajaran: <strong className="text-slate-800">{userMapel}</strong>. Kelola butir soal dan pantau capaian asesmen siswa secara terarah.
            </p>
          </div>
        </div>

        {/* KPI Cards Guru */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Bank Soal Aktif</span>
            <div className="text-3xl font-black text-slate-900">{soalMapelAktif} Butir</div>
            <p className="text-xs text-slate-500">Tersedia untuk latihan mandiri siswa</p>
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Menunggu Validasi Anda</span>
            <div className="text-3xl font-black text-amber-600">{soalMapelPending} Butir</div>
            {soalMapelPending > 0 ? (
              <Link
                href="/admin/validasi-soal"
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800"
              >
                <span>Validasi sekarang</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <p className="text-xs text-slate-500">Semua butir soal telah divalidasi</p>
            )}
          </div>

          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase">Rata-Rata Akurasi Siswa</span>
            <div className="text-3xl font-black text-emerald-600">{akurasiMapel}%</div>
            <p className="text-xs text-slate-500">Dari {totalPengerjaan} percobaan soal</p>
          </div>
        </div>

        {/* Action Modules Shortcut */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Link
            href="/admin/validasi-soal"
            className="group p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all space-y-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <CheckSquare className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base group-hover:text-blue-600 transition-colors">
              Validasi & Input Soal
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Review butir soal hasil AI atau tambahkan butir soal baru secara manual untuk bank soal {userMapel}.
            </p>
          </Link>

          <Link
            href="/admin/analisis-soal"
            className="group p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all space-y-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
              Analisis Butir Soal
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Ketahui butir soal yang memiliki tingkat kesalahan tinggi dan pola jawaban pengecoh (*distractor*).
            </p>
          </Link>

          <Link
            href="/admin/monitoring-progres"
            className="group p-6 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all space-y-3"
          >
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-5 h-5" />
            </div>
            <h3 className="font-extrabold text-slate-900 text-base group-hover:text-emerald-600 transition-colors">
              Monitoring Progres Siswa
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Pantau skor per siswa dan tingkat ketuntasan latihan mandiri materi pokok {userMapel}.
            </p>
          </Link>
        </div>
      </div>
    );
  }

  // Administrator View
  const totalSiswa = await prisma.siswa.count();
  const siswaAktif = await prisma.siswa.count({ where: { statusAkun: "AKTIF" } });
  const konfirmasiIkut = await prisma.siswa.count({ where: { statusTka: "IKUT" } });
  const konfirmasiTidakIkut = await prisma.siswa.count({ where: { statusTka: "TIDAK_IKUT" } });
  const konfirmasiBelum = await prisma.siswa.count({ where: { statusTka: "BELUM_MERESPONS" } });

  const totalSoalAktif = await prisma.soal.count({ where: { status: "AKTIF" } });
  const soalMenungguValidasi = await prisma.soal.count({ where: { status: "MENUNGGU_VALIDASI" } });
  const totalSubmissions = await prisma.progresLatihan.count();

  const correctSubmissions = await prisma.progresLatihan.count({ where: { isBenar: true } });
  const averageAccuracy = totalSubmissions > 0 ? Math.round((correctSubmissions / totalSubmissions) * 100) : 0;

  const totalGuru = await prisma.userAdmin.count({ where: { role: "GURU" } });
  const partisipasiPersen = totalSiswa > 0 ? Math.round((konfirmasiIkut / totalSiswa) * 100) : 0;

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 w-fit mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Pusat Kendali Asesmen TKA</span>
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Dashboard Pemantauan Asesmen Sekolah
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ringkasan menyeluruh keikutsertaan siswa, ketersediaan bank soal, dan keaktifan latihan mandiri.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/generator-soal"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generator Soal AI</span>
          </Link>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Siswa */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Siswa Terdata</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{totalSiswa}</span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">Siswa</span>
          </div>
          <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{siswaAktif} Siswa Teraktivasi SSO</span>
          </div>
        </div>

        {/* Card 2: Konfirmasi TKA */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Partisipasi TKA</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-indigo-900">{konfirmasiIkut}</span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">Siswa ({partisipasiPersen}%)</span>
          </div>
          <div className="text-[11px] text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg font-medium flex items-center justify-between">
            <span>Tidak: <strong>{konfirmasiTidakIkut}</strong></span>
            <span>Belum: <strong>{konfirmasiBelum}</strong></span>
          </div>
        </div>

        {/* Card 3: Total Submissions */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Pengerjaan Latihan</span>
            <div className="w-9 h-9 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{totalSubmissions}</span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">Butir Soal</span>
          </div>
          <div className="text-[11px] text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Akurasi Benar: {averageAccuracy}%</span>
          </div>
        </div>

        {/* Card 4: Bank Soal & Validasi */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Bank Soal Aktif</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-800 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{totalSoalAktif}</span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">Butir Soal</span>
          </div>
          {soalMenungguValidasi > 0 ? (
            <Link
              href="/admin/validasi-soal"
              className="text-[11px] text-amber-900 bg-amber-100 hover:bg-amber-200 px-2.5 py-1 rounded-lg font-bold flex items-center justify-between transition-colors"
            >
              <span>{soalMenungguValidasi} Butir Butuh Validasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div className="text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
              Semua butir soal telah valid
            </div>
          )}
        </div>
      </div>

      {/* Quick Navigation Cards to All Modules */}
      <div className="space-y-4">
        <h3 className="font-extrabold text-slate-900 text-base">Modul Operasional Asesmen TKA</h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Link
            href="/admin/lini-masa"
            className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all space-y-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Clock className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
              Lini Masa Konfirmasi
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Jadwal pembukaan dan batas akhir konfirmasi pemilihan mapel bagi siswa.
            </p>
          </Link>

          <Link
            href="/admin/rekap-tka"
            className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all space-y-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
              Monitoring Konfirmasi
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Visualisasi proporsi keikutsertaan siswa dan ekspor data CSV resmi.
            </p>
          </Link>

          <Link
            href="/admin/validasi-soal"
            className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all space-y-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <CheckSquare className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm group-hover:text-amber-600 transition-colors">
              Validasi & Bank Soal
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Kurasi butir soal terbitan AI dan penginputan butir soal mandiri guru.
            </p>
          </Link>

          <Link
            href="/admin/monitoring-progres"
            className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all space-y-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm group-hover:text-purple-600 transition-colors">
              Monitoring Progres
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Pantau capaian skor per topik dan tingkat kelulusan latihan siswa.
            </p>
          </Link>

          <Link
            href="/admin/analisis-soal"
            className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all space-y-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
              Analisis Butir Soal
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Evaluasi persentase benar/salah dan pemetaan daya pembeda butir soal.
            </p>
          </Link>

          <Link
            href="/admin/siswa"
            className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all space-y-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
              <Users className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm group-hover:text-sky-600 transition-colors">
              Master Data Siswa
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Pengelolaan biodata siswa, penempatan industri PKL, dan impor data CSV.
            </p>
          </Link>

          <Link
            href="/admin/pengguna"
            className="p-5 bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md transition-all space-y-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm group-hover:text-rose-600 transition-colors">
              Master Staf & Guru
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Registrasi akun Google Workspace sekolah dan penugasan guru mata pelajaran.
            </p>
          </Link>

          <Link
            href="/admin/generator-soal"
            className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl shadow-md shadow-blue-500/20 hover:scale-[1.02] transition-all space-y-2 group"
          >
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center font-bold">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h4 className="font-bold text-white text-sm">
              Generator Soal AI
            </h4>
            <p className="text-[11px] text-blue-100 leading-relaxed">
              Generate butir soal baru berbasis Matriks Asesmen Pusmendik Kemendikdasmen.
            </p>
          </Link>
        </div>
      </div>
    </div>
  );
}