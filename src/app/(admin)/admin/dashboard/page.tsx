import React from "react";
import prisma from "@/lib/prisma";
import Link from "next/link";
import {
  Users,
  CheckCircle2,
  Clock,
  Sparkles,
  BarChart3,
  Building2,
  Award,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  BookOpen,
} from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  // Fetch real aggregated data
  const totalSiswa = await prisma.siswa.count();
  const siswaAktif = await prisma.siswa.count({ where: { statusAkun: "AKTIF" } });
  const konfirmasiIkut = await prisma.siswa.count({ where: { statusTka: "IKUT" } });
  const konfirmasiTidakIkut = await prisma.siswa.count({ where: { statusTka: "TIDAK_IKUT" } });
  const konfirmasiBelum = await prisma.siswa.count({ where: { statusTka: "BELUM_MERESPONS" } });

  const totalSoalAktif = await prisma.soal.count({ where: { status: "AKTIF" } });
  const soalMenungguValidasi = await prisma.soal.count({ where: { status: "MENUNGGU_VALIDASI" } });
  const totalSubmissions = await prisma.progresLatihan.count();

  // Accuracy calculation
  const correctSubmissions = await prisma.progresLatihan.count({ where: { isBenar: true } });
  const averageAccuracy = totalSubmissions > 0 ? Math.round((correctSubmissions / totalSubmissions) * 100) : 0;

  // Student PKL distribution
  const pklKalimantan = await prisma.siswa.count({
    where: { namaIndustriPkl: { contains: "Kalimantan" } },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Monitoring Pilot TKA 2026
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Dashboard Pemantauan & Analitik Sekolah
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Rekap kesiapan 72 siswa SIJA kelas 13 yang sedang PKL menghadapi Tes Kemampuan Akademik (TKA).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/generator-soal"
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Soal AI</span>
          </Link>
        </div>
      </div>

      {/* Top 4 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: 72 Siswa */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Target Siswa SIJA</span>
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{totalSiswa}</span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">Siswa</span>
          </div>
          <div className="text-[11px] text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>{siswaAktif} Akun Teraktivasi via Google SSO</span>
          </div>
        </div>

        {/* Card 2: Konfirmasi TKA */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Konfirmasi Ikut TKA</span>
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Award className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-indigo-900">{konfirmasiIkut}</span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">Siswa Bersedia</span>
          </div>
          <div className="text-[11px] text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg font-medium flex items-center justify-between">
            <span>Tidak Ikut: <strong>{konfirmasiTidakIkut}</strong></span>
            <span>Belum Respon: <strong>{konfirmasiBelum}</strong></span>
          </div>
        </div>

        {/* Card 3: Total Pengerjaan Offline Synced */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Total Soal Dikerjakan</span>
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center">
              <BarChart3 className="w-5 h-5" />
            </div>
          </div>
          <div>
            <span className="text-3xl font-black text-slate-900">{totalSubmissions}</span>
            <span className="text-xs text-slate-500 ml-1.5 font-medium">Percobaan Jawaban</span>
          </div>
          <div className="text-[11px] text-teal-800 bg-teal-50 px-2.5 py-1 rounded-lg font-bold flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Rata-Rata Akurasi Siswa: {averageAccuracy}%</span>
          </div>
        </div>

        {/* Card 4: Bank Soal & Validasi */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">Bank Soal Aktif</span>
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
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
              <span>{soalMenungguValidasi} Soal AI Menunggu Validasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <div className="text-[11px] text-slate-500 bg-slate-50 px-2.5 py-1 rounded-lg">
              Semua soal AI telah divalidasi
            </div>
          )}
        </div>
      </div>

      {/* Highlights & Action Banners */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Remote PKL Monitoring (Kalimantan) */}
        <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white rounded-3xl p-6 shadow-md space-y-4">
          <div className="flex items-center gap-2 text-cyan-400 text-xs font-bold">
            <Building2 className="w-4 h-4" />
            <span>Pemantauan Siswa PKL Daerah Terbatas</span>
          </div>
          <h3 className="text-lg font-bold leading-snug">
            Kesiapan Siswa PKL Luar Kota / Akses Internet Minim
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Siswa yang menjalani PKL di lokasi dengan sinyal terbatas telah mengunduh bank soal secara mandiri dan mengerjakan latihan secara offline.
          </p>
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-slate-400">Siswa Terdata di Lokasi Terpencil:</span>
            <span className="font-extrabold text-cyan-300 text-sm">{pklKalimantan} Siswa</span>
          </div>
        </div>

        {/* Item Analysis Shortcut Banner */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4 lg:col-span-2 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-blue-600 text-xs font-bold uppercase tracking-wider">
              <BarChart3 className="w-4 h-4" />
              <span>Diagnostik Butir Soal</span>
            </div>
            <h3 className="text-lg font-extrabold text-slate-900">
              Analisis Tingkat Kesukaran & Pemetaan Materi Sulit
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Ketahui topik mana yang paling banyak dijawab salah oleh siswa saat latihan offline, analisis pilihan pengecoh (*distractor*), dan lakukan tindak lanjut pembelajaran terarah.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 font-bold text-emerald-700">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Mudah (&gt;70%)
              </span>
              <span className="flex items-center gap-1.5 font-bold text-amber-700">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Sedang (40-70%)
              </span>
              <span className="flex items-center gap-1.5 font-bold text-rose-700">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Sulit (&lt;40%)
              </span>
            </div>

            <Link
              href="/admin/analisis-soal"
              className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            >
              <span>Buka Analisis Butir Soal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}