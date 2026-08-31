"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  BookOpen,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle2,
  Clock,
  ArrowRight,
  Code2,
  Calculator,
  DownloadCloud,
  UploadCloud,
  LogOut,
  Building2,
  Award,
  Layers,
  Sparkles,
  BookMarked,
  Info,
  GraduationCap,
} from "lucide-react";
import { clientDb } from "@/lib/db/client-db";
import { downloadActiveBankSoal, syncPendingSubmissions, getOfflineSyncStatus } from "@/lib/sync/sync-manager";
import { getSubjectDisplayName } from "@/lib/constants/subjects";

export default function LatihanHubPage() {
  const { data: session } = useSession();
  const [isOnline, setIsOnline] = useState(true);
  const [cachedCount, setCachedCount] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isSyncingBank, setIsSyncingBank] = useState(false);
  const [isSyncingSubmissions, setIsSyncingSubmissions] = useState(false);
  const [syncMessage, setSyncMessage] = useState("");

  const [studentProfile, setStudentProfile] = useState<any>(null);

  const refreshStats = async () => {
    const stats = await getOfflineSyncStatus();
    setCachedCount(stats.cachedQuestionsCount);
    setPendingCount(stats.pendingSubmissionsCount);
    setLastSyncTime(stats.lastBankSoalSync);
    setIsOnline(stats.isOnline);
  };

  const loadStudentProfile = async () => {
    try {
      const studentId = (session?.user as any)?.id;
      if (!studentId) return;
      const res = await fetch(`/api/admin/siswa`);
      const data = await res.json();
      if (data.success) {
        const found = data.students.find((s: any) => s.id === studentId || s.nis === (session?.user as any)?.nis);
        if (found) setStudentProfile(found);
      }
    } catch {}
  };

  useEffect(() => {
    refreshStats();
    loadStudentProfile();

    const handleOnline = () => {
      setIsOnline(true);
      syncPendingSubmissions().then(() => refreshStats());
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [session]);

  const handleDownloadBank = async () => {
    setIsSyncingBank(true);
    setSyncMessage("");
    const res = await downloadActiveBankSoal();
    if (res.success) {
      setSyncMessage(`Berhasil mengunduh ${res.count} butir soal aktif ke penyimpanan lokal perangkat.`);
    } else {
      setSyncMessage(`Gagal mengunduh: ${res.error}`);
    }
    setIsSyncingBank(false);
    await refreshStats();
  };

  const handleSyncSubmissions = async () => {
    setIsSyncingSubmissions(true);
    setSyncMessage("");
    const res = await syncPendingSubmissions();
    if (res.success) {
      setSyncMessage(`Berhasil mengirim ${res.syncedCount} jawaban ke server sekolah.`);
    } else {
      setSyncMessage(`Gagal kirim jawaban: ${res.error}`);
    }
    setIsSyncingSubmissions(false);
    await refreshStats();
  };

  const mapel1 = studentProfile?.mapelPilihan1 || "PPLG";
  const mapel2 = studentProfile?.mapelPilihan2 || "B_INGGRIS_LANJUT";
  const statusTka = studentProfile?.statusTka || "IKUT";

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-blue-500/20">
              T
            </div>
            <div>
              <h1 className="font-extrabold text-slate-900 leading-tight">siapTKA</h1>
              <p className="text-[11px] text-slate-500 font-medium">Latihan TKA Offline Siswa PKL</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Online Status Pill */}
            <div
              className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 border transition-all ${
                isOnline
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>Mode Offline (Tanpa Internet)</span>
                </>
              )}
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* User Card */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 bg-white/10 border border-white/20 rounded-full text-xs font-bold text-cyan-300">
                  Siswa SIJA Kelas 13
                </span>
                <span className="px-2.5 py-0.5 bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 rounded-full text-xs font-bold">
                  Status: {statusTka === "IKUT" ? "Peserta TKA" : "Tidak Ikut TKA"}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {session?.user?.name || "Aditya Pratama"}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300">
                <span>NIS: {(session?.user as any)?.nis || "22231001"}</span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  {(session?.user as any)?.namaIndustriPkl || "PT Kalimantan Prima Coal (Kalimantan)"}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Link
                href="/onboarding-tka"
                className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-all text-center"
              >
                Ubah / Cek Konfirmasi TKA
              </Link>
            </div>
          </div>
        </div>

        {/* Offline Engine Sync Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Pusat Penyimpanan Offline Siswa (IndexedDB)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Unduh bank soal saat berada di area bersinyal, lalu kerjakan latihan tanpa kuota di lokasi PKL.
              </p>
            </div>

            <div className="flex items-center gap-2">
              {pendingCount > 0 && (
                <span className="px-2.5 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-lg animate-pulse">
                  {pendingCount} Jawaban Menunggu Sync
                </span>
              )}
            </div>
          </div>

          {syncMessage && (
            <div className="p-3 bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{syncMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleDownloadBank}
              disabled={isSyncingBank || !isOnline}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 transition-all text-left flex items-start justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 group-hover:text-blue-700">
                  <DownloadCloud className="w-4 h-4 text-blue-600" />
                  <span>1. Unduh / Update Bank Soal Lengkap</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Tersimpan di perangkat: <strong className="text-slate-800">{cachedCount} butir soal</strong>
                </p>
                {lastSyncTime && (
                  <p className="text-[10px] text-slate-400">
                    Update terakhir: {new Date(lastSyncTime).toLocaleTimeString()}
                  </p>
                )}
              </div>
              <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                {isSyncingBank ? "Mengunduh..." : "Unduh"}
              </span>
            </button>

            <button
              onClick={handleSyncSubmissions}
              disabled={isSyncingSubmissions || !isOnline || pendingCount === 0}
              className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 transition-all text-left flex items-start justify-between group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 font-bold text-xs text-slate-900 group-hover:text-emerald-700">
                  <UploadCloud className="w-4 h-4 text-emerald-600" />
                  <span>2. Kirim Progres ke Server</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Antrean menunggu kirim: <strong className="text-slate-800">{pendingCount} jawaban</strong>
                </p>
                <p className="text-[10px] text-slate-400">
                  {isOnline ? "Koneksi tersedia untuk sync" : "Otomatis kirim saat online kembali"}
                </p>
              </div>
              <span className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                {isSyncingSubmissions ? "Mengirim..." : "Kirim"}
              </span>
            </button>
          </div>
        </div>

        {/* Dynamic Practice Subjects Tailored to Student's Confirmation */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">Mata Pelajaran Latihan TKA Anda</h3>
              <p className="text-xs text-slate-500">
                Menampilkan mapel wajib dan mapel pilihan yang Anda pilih saat konfirmasi pendaftaran TKA.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. Mapel Wajib: Matematika */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 hover:border-blue-500 transition-all shadow-sm p-6 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Calculator className="w-6 h-6" />
                </div>
                <div>
                  <div className="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px] font-bold mb-1">
                    Mapel Wajib TKA
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Matematika
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Aljabar, Fungsi Kuadrat, Kalkulus (Turunan & Integral), Matriks dengan rendering rumus KaTeX offline.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700">PG Single</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700">MCMA</span>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100">
                <Link
                  href="/latihan/matematika"
                  className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group-hover:shadow-blue-500/25"
                >
                  <span>Mulai Latihan Matematika</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* 2. Mapel Pilihan 1 (Dinamis: mis. PPLG) */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 hover:border-teal-500 transition-all shadow-sm p-6 flex flex-col justify-between group">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center">
                  <Code2 className="w-6 h-6" />
                </div>
                <div>
                  <div className="inline-block px-2.5 py-0.5 bg-teal-50 text-teal-700 rounded text-[11px] font-bold mb-1">
                    Mapel Pilihan 1 (Pilihan Anda)
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 group-hover:text-teal-600 transition-colors">
                    {getSubjectDisplayName(mapel1)}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Sesuai Capaian Pembelajaran Fase E/F: Wawasan Dunia Kerja, K3LH, Pemrograman Terstruktur, OOP, dan Jaringan.
                  </p>
                </div>

                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700">PG Single</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700">PGK Kategori</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-700">MCMA</span>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100">
                <Link
                  href="/latihan/pplg"
                  className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 group-hover:shadow-teal-500/25"
                >
                  <span>Mulai Latihan {mapel1}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* 3. Mapel Pilihan 2 (Dinamis) */}
            <div className="bg-white rounded-3xl border-2 border-slate-200 shadow-sm p-6 flex flex-col justify-between">
              <div className="space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <BookMarked className="w-6 h-6" />
                </div>
                <div>
                  <div className="inline-block px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[11px] font-bold mb-1">
                    Mapel Pilihan 2 (Pilihan Anda)
                  </div>
                  <h4 className="text-lg font-bold text-slate-900">
                    {getSubjectDisplayName(mapel2)}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                    Mata pelajaran pilihan tambahan yang Anda daftarkan untuk seleksi prodi perguruan tinggi.
                  </p>
                </div>

                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 font-medium">
                  Tahap Pilot: Bank soal aktif disiapkan bertahap setelah uji coba Matematika & PPLG.
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-slate-100">
                <Link
                  href="/latihan/matematika"
                  className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2 text-center"
                >
                  <span>Latihan Matematika / PPLG Dahulu</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}