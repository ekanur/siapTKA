"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import {
  BookOpen,
  FileCheck,
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
  Download,
  RotateCcw,
  Play,
  CloudDownload,
  ShieldAlert,
  AlertCircle,
} from "lucide-react";
import { clientDb } from "@/lib/db/client-db";
import { downloadActiveBankSoal, syncPendingSubmissions, getOfflineSyncStatus } from "@/lib/sync/sync-manager";
import { getSubjectDisplayName } from "@/lib/constants/subjects";

function CloudCheckIcon({ className = "w-6 h-6 text-blue-600" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      <polyline points="9 13.5 11.5 16 15.5 11" strokeWidth="2.2" />
    </svg>
  );
}

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
  const [mapelQuestionCounts, setMapelQuestionCounts] = useState<Record<string, number>>({});
  const [downloadingMapel, setDownloadingMapel] = useState<string | null>(null);
  const [resetMapels, setResetMapels] = useState<string[]>([]);
  const [mapelStats, setMapelStats] = useState<{
    [code: string]: { cached: number; worked: number; percent: number; isOfflineReady: boolean; hasQuestions: boolean };
  }>({});

  const mapel1 = studentProfile?.mapelPilihan1 || null;
  const mapel2 = studentProfile?.mapelPilihan2 || null;
  const statusTka = studentProfile?.statusTka || (session?.user as any)?.statusTka || "IKUT";

  const subjectRows = useMemo(() => {
    const getBankCount = (code: string, fallbackDefault = 0) => {
      const norm = code.replace(/-/g, "_").toUpperCase();
      if (mapelQuestionCounts[norm] !== undefined) {
        return mapelQuestionCounts[norm];
      }
      return fallbackDefault;
    };

    const rows = [
      {
        code: "MATEMATIKA",
        name: "Matematika",
        type: "WAJIB",
        slug: "matematika",
        totalBank: getBankCount("MATEMATIKA", 2),
        defaultPercent: 37.5,
        defaultReady: true,
      },
      {
        code: "BAHASA_INDONESIA",
        name: "Bahasa Indonesia",
        type: "WAJIB",
        slug: "bahasa_indonesia",
        totalBank: getBankCount("BAHASA_INDONESIA", 1),
        defaultPercent: 20,
        defaultReady: true,
      },
      {
        code: "BAHASA_INGGRIS",
        name: "Bahasa Inggris",
        type: "WAJIB",
        slug: "bahasa_inggris",
        totalBank: getBankCount("BAHASA_INGGRIS", 1),
        defaultPercent: 6.6,
        defaultReady: false,
      },
    ];

    if (mapel1) {
      const count1 = getBankCount(mapel1, 0);
      rows.push({
        code: mapel1,
        name: getSubjectDisplayName(mapel1, true),
        type: "PILIHAN",
        slug: mapel1.toLowerCase(),
        totalBank: count1,
        defaultPercent: count1 > 0 ? 42.5 : 0,
        defaultReady: count1 > 0,
      });
    }

    if (mapel2 && mapel2 !== mapel1) {
      const count2 = getBankCount(mapel2, 0);
      rows.push({
        code: mapel2,
        name: getSubjectDisplayName(mapel2, true),
        type: "PILIHAN",
        slug: mapel2.toLowerCase(),
        totalBank: count2,
        defaultPercent: 0,
        defaultReady: count2 > 0,
      });
    }

    return rows;
  }, [mapel1, mapel2, mapelQuestionCounts]);

  const getProgressColor = (percent: number) => {
    if (percent <= 25) {
      return "bg-[#a91d22]"; // 0% - 25%: Merah
    } else if (percent <= 70) {
      return "bg-amber-500"; // 26% - 70%: Kuning
    } else {
      return "bg-emerald-600"; // 71% - 100%: Hijau
    }
  };

  const refreshSubjectStats = async () => {
    try {
      const statsObj: any = {};
      for (const subj of subjectRows) {
        const norm = subj.code.replace(/-/g, "_").toUpperCase();
        const cached = await clientDb.soal
          .filter((s) => {
            const m = s.mapel.replace(/-/g, "_").toUpperCase();
            if (norm === "AIJ" || norm === "ADMINISTRASI_INFRASTRUKTUR_JARINGAN") {
              return m === "AIJ" || m === "ADMINISTRASI_INFRASTRUKTUR_JARINGAN";
            }
            return m === norm;
          })
          .count();

        const worked = await clientDb.offlineSubmissions
          .filter((s) => {
            const m = s.mapel.replace(/-/g, "_").toUpperCase();
            if (norm === "AIJ" || norm === "ADMINISTRASI_INFRASTRUKTUR_JARINGAN") {
              return m === "AIJ" || m === "ADMINISTRASI_INFRASTRUKTUR_JARINGAN";
            }
            return m === norm;
          })
          .count();

        const isReset = resetMapels.includes(subj.code);
        const effectiveTotal = Math.max(subj.totalBank, cached);
        const hasQuestions = effectiveTotal > 0;

        let percent = subj.defaultPercent;
        if (isReset || !hasQuestions) {
          percent = 0;
        } else if (worked > 0) {
          percent = Math.min(100, Math.round((worked / effectiveTotal) * 1000) / 10);
        }

        const isOfflineReady = cached > 0;

        statsObj[subj.code] = {
          cached,
          worked,
          percent,
          isOfflineReady,
          hasQuestions,
        };
      }
      setMapelStats(statsObj);
    } catch (e) {
      console.error("Error calculating subject stats:", e);
    }
  };

  const getSubjectState = (subj: any) => {
    const s = mapelStats[subj.code];
    if (s) return s;
    const hasQuestions = subj.totalBank > 0;
    return {
      cached: 0,
      worked: 0,
      percent: resetMapels.includes(subj.code) || !hasQuestions ? 0 : subj.defaultPercent,
      isOfflineReady: subj.defaultReady,
      hasQuestions,
    };
  };

  const handleDownloadSubject = async (subj: any) => {
    setDownloadingMapel(subj.code);
    setSyncMessage("");
    try {
      const res = await downloadActiveBankSoal(subj.code);
      if (res.success) {
        setSyncMessage(`Berhasil mengunduh bank soal ${subj.name} (${res.count} soal) ke penyimpanan lokal.`);
        // Mark ready in local stats
        setMapelStats((prev) => ({
          ...prev,
          [subj.code]: {
            ...getSubjectState(subj),
            cached: res.count,
            isOfflineReady: true,
          },
        }));
        await refreshStats();
      } else {
        setSyncMessage(`Gagal mengunduh bank soal ${subj.name}: ${res.error}`);
      }
    } catch (err: any) {
      setSyncMessage(`Gagal mengunduh: ${err.message}`);
    } finally {
      setDownloadingMapel(null);
    }
  };

  const handleResetSubject = async (subj: any) => {
    const confirmReset = window.confirm(`Reset riwayat latihan mata pelajaran ${subj.name} menjadi 0%?`);
    if (!confirmReset) return;

    try {
      const norm = subj.code.replace(/-/g, "_").toUpperCase();
      const ids = await clientDb.offlineSubmissions
        .filter((s) => {
          const m = s.mapel.replace(/-/g, "_").toUpperCase();
          if (norm === "AIJ" || norm === "ADMINISTRASI_INFRASTRUKTUR_JARINGAN") {
            return m === "AIJ" || m === "ADMINISTRASI_INFRASTRUKTUR_JARINGAN";
          }
          return m === norm;
        })
        .primaryKeys();

      if (ids.length > 0) {
        await clientDb.offlineSubmissions.bulkDelete(ids);
      }

      setResetMapels((prev) => [...prev.filter((c) => c !== subj.code), subj.code]);
      setMapelStats((prev) => ({
        ...prev,
        [subj.code]: {
          ...getSubjectState(subj),
          worked: 0,
          percent: 0,
        },
      }));
      setSyncMessage(`Progres latihan ${subj.name} berhasil di-reset menjadi 0%.`);
      await refreshStats();
    } catch (err: any) {
      console.error(err);
    }
  };

  const refreshStats = async () => {
    const stats = await getOfflineSyncStatus();
    setCachedCount(stats.cachedQuestionsCount);
    setPendingCount(stats.pendingSubmissionsCount);
    setLastSyncTime(stats.lastBankSoalSync);
    setIsOnline(stats.isOnline);
  };

  const loadStudentProfile = async () => {
    // 1. Load instantly from local offline cache
    if (typeof window !== "undefined") {
      const cached = localStorage.getItem("siaptka_student_profile");
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          setStudentProfile(parsed);
        } catch {}
      }
      const cachedCounts = localStorage.getItem("siaptka_mapel_counts");
      if (cachedCounts) {
        try {
          setMapelQuestionCounts(JSON.parse(cachedCounts));
        } catch {}
      }
    }

    // 2. Refresh from server if online
    try {
      const res = await fetch(`/api/student/konfirmasi`);
      const data = await res.json();
      if (data.success && data.student) {
        setStudentProfile(data.student);
        if (typeof window !== "undefined") {
          localStorage.setItem("siaptka_student_profile", JSON.stringify(data.student));
          if (data.mapelQuestionCounts) {
            localStorage.setItem("siaptka_mapel_counts", JSON.stringify(data.mapelQuestionCounts));
          }
        }
        if (data.mapelQuestionCounts) {
          setMapelQuestionCounts(data.mapelQuestionCounts);
        }
      }
    } catch (e) {
      console.warn("Using offline cached student profile");
    }
  };

  useEffect(() => {
    refreshStats();
    loadStudentProfile();

    // Auto-cache active bank soal in background if local IndexedDB is empty and device is online
    clientDb.soal.count().then((count) => {
      if (count === 0 && (typeof navigator !== "undefined" ? navigator.onLine : true)) {
        downloadActiveBankSoal().then(() => {
          refreshStats();
          refreshSubjectStats();
        });
      }
    });

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

  useEffect(() => {
    refreshSubjectStats();
  }, [subjectRows, resetMapels]);

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
    await refreshSubjectStats();
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
    await refreshSubjectStats();
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/latihan" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                T
              </div>
              <span className="font-extrabold text-slate-900 leading-tight text-lg">siapTKA</span>
            </Link>

            {/* Menu Navigasi di Samping Logo */}
            <nav className="flex items-center gap-1 sm:gap-1.5">
              <Link
                href="/latihan"
                className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-50 text-blue-600 border border-blue-100 transition-all flex items-center gap-1.5 shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                <span>Latihan</span>
              </Link>
              <Link
                href="/onboarding-tka"
                className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-1.5"
              >
                <FileCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                <span>Konfirmasi</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
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
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-600" />
                  <span>Mode Offline</span>
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

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6 flex-1 w-full">
        {/* User Card */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="px-3 py-0.5 bg-white/10 border border-white/20 rounded-full text-xs font-bold text-cyan-300">
                  Siswa SIJA Kelas 13
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    statusTka === "IKUT"
                      ? "bg-emerald-500/20 border-emerald-400/30 text-emerald-300"
                      : "bg-rose-500/20 border-rose-400/30 text-rose-200"
                  }`}
                >
                  Status: {statusTka === "IKUT" ? "Peserta TKA" : "Tidak Ikut TKA"}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {session?.user?.name || "ADRIANO ANANTA"}
              </h2>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-300">
                <span>NIS: {(session?.user as any)?.nis || "21141"}</span>
                <span>•</span>
                <span className="flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-cyan-400" />
                  {(session?.user as any)?.namaIndustriPkl || "Cargloss Group"}
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

        {statusTka === "TIDAK_IKUT" ? (
          /* Pendekatan 2: Akses Penuh Ditutup dengan Notice Card */
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-6 shadow-sm max-w-2xl mx-auto my-4">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full border border-rose-200 uppercase tracking-wider">
                Status Non-Peserta TKA
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Anda Memilih Tidak Mengikuti TKA 2026
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed max-w-lg mx-auto">
                Konfirmasi resmi Anda telah tersimpan di sistem pendataan sekolah. Sesuai pilihan tersebut, akses pengerjaan bank soal latihan dinonaktifkan untuk akun Anda.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-2.5 text-slate-700 max-w-md mx-auto">
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">Nama Siswa:</span>
                <span className="font-bold text-slate-900">{session?.user?.name || "Siswa SIJA"}</span>
              </div>
              <div className="flex justify-between pb-2 border-b border-slate-200">
                <span className="text-slate-500">NIS Siswa:</span>
                <span className="font-mono font-bold text-slate-900">{(session?.user as any)?.nis || "21141"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Status Pendaftaran:</span>
                <span className="font-bold text-rose-600">Tidak Mengikuti TKA</span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Link
                href="/onboarding-tka"
                className="w-full sm:w-auto px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center justify-center gap-2"
              >
                <span>Ubah Konfirmasi Keikutsertaan</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <p className="text-[11px] text-slate-400">
              Perubahan pilihan hanya dapat dilakukan selama rentang jadwal lini masa konfirmasi masih dibuka oleh Admin/Guru.
            </p>
          </div>
        ) : (
          <>
            {/* Offline Engine Sync Panel */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3.5">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Pusat Penyimpanan Offline Siswa</span>
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

        {/* Banner Peringatan jika Mapel Pilihan Belum Ada Soal */}
        {subjectRows.some((s) => s.type === "PILIHAN" && !getSubjectState(s).hasQuestions) && (
          <div className="p-4 sm:p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3.5 shadow-xs">
            <div className="p-2 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-900 text-sm">
                Pemberitahuan Bank Soal Mata Pelajaran Pilihan
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mata pelajaran pilihan Anda (
                <strong>
                  {subjectRows
                    .filter((s) => s.type === "PILIHAN" && !getSubjectState(s).hasQuestions)
                    .map((s) => s.name)
                    .join(", ")}
                </strong>
                ) belum memiliki butir soal latihan aktif di sistem.{" "}
                <span className="font-semibold text-amber-800">
                  Belum ada soal, silakan hubungi tim Persiapan TKA Sekolah.
                </span>
              </p>
            </div>
          </div>
        )}

        {/* Status Latihan Mata Pelajaran (Responsive Dual-Mode: Table di Desktop & Cards di Smartphone) */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          {/* Card Title */}
          <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Status Latihan Mata Pelajaran
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Progres latihan mandiri offline & sinkronisasi materi TKA Kemendikbud
              </p>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium">
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Sistem Offline Siap</span>
            </div>
          </div>

          {/* DESKTOP / TABLET VIEW: Table Layout persis desain gambar */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#0052cc] text-white">
                <tr>
                  <th className="py-3.5 px-6 font-bold text-xs tracking-wider uppercase">Mata Pelajaran</th>
                  <th className="py-3.5 px-4 font-bold text-xs tracking-wider uppercase">Jumlah Bank Soal</th>
                  <th className="py-3.5 px-4 font-bold text-xs tracking-wider uppercase">Soal Dikerjakan</th>
                  <th className="py-3.5 px-4 font-bold text-xs tracking-wider uppercase text-center">Status Offline</th>
                  <th className="py-3.5 px-6 font-bold text-xs tracking-wider uppercase text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {subjectRows.map((subj) => {
                  const state = getSubjectState(subj);
                  const isReady = state.isOfflineReady;
                  const percent = state.percent;
                  const isSyncing = downloadingMapel === subj.code;

                  return (
                    <tr key={subj.code} className="hover:bg-slate-50/60 transition-colors">
                      {/* 1. Mata Pelajaran */}
                      <td className="py-4 px-6">
                        <div className="font-bold text-slate-900 text-sm leading-snug">
                          {subj.name}
                        </div>
                        <div className="text-[11px] font-semibold text-slate-400 tracking-wider mt-0.5 uppercase">
                          {subj.type}
                        </div>
                      </td>

                      {/* 2. Jumlah Bank Soal */}
                      <td className="py-4 px-4">
                        {!state.hasQuestions ? (
                          <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                            0 Soal
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-slate-700">
                            {subj.totalBank} Soal
                          </span>
                        )}
                      </td>

                      {/* 3. Soal Dikerjakan (Pill Progress Bar / Pesan Belum Ada Soal) */}
                      <td className="py-4 px-4">
                        {!state.hasQuestions ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                            <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>Belum ada soal, silakan hubungi tim Persiapan TKA Sekolah</span>
                          </span>
                        ) : (
                          <div className="w-36 h-6 rounded-full bg-slate-200/90 relative overflow-hidden flex items-center justify-center">
                            {percent > 0 && (
                              <div
                                className={`absolute left-0 top-0 bottom-0 transition-all duration-500 rounded-full ${getProgressColor(percent)}`}
                                style={{ width: `${percent}%` }}
                              />
                            )}
                            <span className="relative z-10 text-xs font-bold text-slate-700 select-none">
                              {percent}%
                            </span>
                          </div>
                        )}
                      </td>

                      {/* 4. Status Offline */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center">
                          {!state.hasQuestions ? (
                            <span className="text-[11px] text-slate-400 font-medium italic">
                              Belum Tersedia
                            </span>
                          ) : isReady ? (
                            <div title="Tersimpan di perangkat & siap offline">
                              <CloudCheckIcon className="w-7 h-7 text-blue-600" />
                            </div>
                          ) : (
                            <div title="Belum diunduh / butuh update">
                              <CloudDownload className="w-7 h-7 text-slate-700 stroke-[1.8]" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* 5. Aksi */}
                      <td className="py-4 px-6 text-center">
                        {!state.hasQuestions ? (
                          <div className="flex items-center justify-center">
                            <Link
                              href={`/latihan/${subj.slug}`}
                              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-semibold border border-amber-200 transition-colors"
                              title="Belum ada soal, silakan hubungi tim Persiapan TKA Sekolah"
                            >
                              Belum Ada Soal
                            </Link>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            {/* Button 1: Download */}
                            <button
                              type="button"
                              onClick={() => handleDownloadSubject(subj)}
                              disabled={isSyncing}
                              className="w-9 h-9 rounded-lg bg-[#dce7f9] hover:bg-blue-200 text-blue-600 flex items-center justify-center transition-colors disabled:opacity-50"
                              title={`Unduh Bank Soal ${subj.name} untuk Mode Offline`}
                            >
                              <Download className={`w-4 h-4 ${isSyncing ? "animate-bounce" : ""}`} />
                            </button>

                            {/* Button 2: Reset */}
                            <button
                              type="button"
                              onClick={() => handleResetSubject(subj)}
                              className="w-9 h-9 rounded-lg bg-[#dce7f9] hover:bg-blue-200 text-slate-600 flex items-center justify-center transition-colors"
                              title={`Reset Progres Latihan ${subj.name}`}
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>

                            {/* Button 3: Play / Start */}
                            <Link
                              href={`/latihan/${subj.slug}`}
                              className="w-9 h-9 rounded-lg bg-[#0052cc] hover:bg-blue-700 text-white flex items-center justify-center shadow-sm transition-colors group"
                              title={`Mulai Latihan ${subj.name}`}
                            >
                              <Play className="w-4 h-4 fill-white text-white translate-x-0.5 group-hover:scale-110 transition-transform" />
                            </Link>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* MOBILE VIEW: Adaptif Thumb-Friendly Cards (Tanpa scroll samping, tidak meluap di HP) */}
          <div className="block md:hidden p-4 space-y-3.5 bg-slate-50/50">
            {subjectRows.map((subj) => {
              const state = getSubjectState(subj);
              const isReady = state.isOfflineReady;
              const percent = state.percent;
              const isSyncing = downloadingMapel === subj.code;

              return (
                <div
                  key={subj.code}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3"
                >
                  {/* Top Bar: Subject Name & Offline Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-slate-900 text-base">
                          {subj.name}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase bg-slate-100 text-slate-600">
                          {subj.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Bank Soal:{" "}
                        <strong className={state.hasQuestions ? "text-slate-800" : "text-amber-600"}>
                          {subj.totalBank} Soal
                        </strong>
                      </p>
                    </div>

                    <div className="shrink-0">
                      {!state.hasQuestions ? (
                        <div className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200">
                          Belum Ada Soal
                        </div>
                      ) : isReady ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                          <CloudCheckIcon className="w-4 h-4" />
                          <span>Offline OK</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-100 px-2 py-1 rounded-lg">
                          <CloudDownload className="w-4 h-4 stroke-[1.8]" />
                          <span>Unduh</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Middle Bar: Progress Bar or Empty State */}
                  {!state.hasQuestions ? (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-amber-900">Belum Ada Soal Latihan</p>
                        <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                          Belum ada soal, silakan hubungi tim Persiapan TKA Sekolah.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                        <span>Progres Latihan</span>
                        <span className="font-bold text-slate-800">{percent}% Dikerjakan</span>
                      </div>
                      <div className="w-full h-5 rounded-full bg-slate-200/90 relative overflow-hidden flex items-center justify-center">
                        {percent > 0 && (
                          <div
                            className={`absolute left-0 top-0 bottom-0 transition-all duration-500 rounded-full ${getProgressColor(percent)}`}
                            style={{ width: `${percent}%` }}
                          />
                        )}
                        <span className="relative z-10 text-[11px] font-bold text-slate-700 select-none">
                          {percent}%
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Bottom Bar: Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                    {!state.hasQuestions ? (
                      <Link
                        href={`/latihan/${subj.slug}`}
                        className="w-full py-2.5 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs rounded-xl border border-amber-200 text-center transition-colors"
                      >
                        Belum Ada Soal — Hubungi Tim TKA
                      </Link>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleDownloadSubject(subj)}
                          disabled={isSyncing}
                          className="flex-1 py-2 px-3 bg-[#dce7f9] hover:bg-blue-200 text-blue-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
                        >
                          <Download className={`w-3.5 h-3.5 ${isSyncing ? "animate-bounce" : ""}`} />
                          <span>{isSyncing ? "Mengunduh..." : "Unduh Bank"}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleResetSubject(subj)}
                          className="p-2 bg-[#dce7f9] hover:bg-blue-200 text-slate-700 font-bold text-xs rounded-xl flex items-center justify-center transition-colors"
                          title="Reset progres latihan"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>

                        <Link
                          href={`/latihan/${subj.slug}`}
                          className="flex-1 py-2 px-3 bg-[#0052cc] hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-sm transition-colors"
                        >
                          <Play className="w-3.5 h-3.5 fill-white text-white" />
                          <span>Mulai Latihan</span>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {(!mapel1 || !mapel2) && (
          <div className="p-5 sm:p-6 bg-gradient-to-r from-amber-50/80 via-orange-50/60 to-amber-50/80 rounded-2xl border border-amber-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-100 text-amber-700 rounded-xl shrink-0 mt-0.5 sm:mt-0">
                <BookMarked className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-slate-900 text-sm">
                  {!mapel1 && !mapel2
                    ? "Mata Pelajaran Pilihan TKA Belum Ditentukan"
                    : "Mata Pelajaran Pilihan Belum Lengkap (1 dari 2)"}
                </h4>
                <p className="text-xs text-slate-600 max-w-xl leading-relaxed">
                  Siswa berhak memilih hingga 2 mata pelajaran pilihan sesuai peminatan atau kejuruan. Silakan tentukan pilihan Anda melalui formulir konfirmasi TKA agar modul dan bank soal latihan pilihan aktif.
                </p>
              </div>
            </div>
            <Link
              href="/onboarding-tka"
              className="shrink-0 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
            >
              <span>Pilih Mata Pelajaran</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </>
    )}
  </main>
 
      {/* Footer */}
      <footer className="bg-slate-100 w-full py-8 px-4 sm:px-6 mt-auto flex flex-col md:flex-row justify-between items-center gap-4 border-t border-slate-200 text-xs text-slate-600">
        <div className="font-bold text-[#004ac6] text-sm flex items-center gap-2">
          Siap TKA
        </div>
        <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
          <span className="hover:text-blue-600 cursor-pointer">Tentang Kami</span>
          <span className="hover:text-blue-600 cursor-pointer">Pusat Bantuan</span>
          <span className="hover:text-blue-600 cursor-pointer">Kebijakan Privasi</span>
          <span className="hover:text-blue-600 cursor-pointer">Syarat & Ketentuan</span>
        </div>
        <div>© 2026 Siap TKA - SMKN 2 Depok Sleman</div>
      </footer>
    </div>
  );
}