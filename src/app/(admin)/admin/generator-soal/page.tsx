"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { notFound } from "next/navigation";
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Calculator,
  Code2,
  Layers,
  Wand2,
  Settings2,
  HelpCircle,
  Eye,
  EyeOff,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
} from "lucide-react";
import MathRenderer from "@/components/math/MathRenderer";
import { buildGeminiPrompt, normalizeOpsiJawaban, normalizeKunciJawaban } from "@/lib/quiz/normalize";
import {
  MAPEL_WAJIB,
  MAPEL_PILIHAN_GROUPS,
  isLanguageSubject,
  GENRE_TEKS_INDONESIA,
  GENRE_TEKS_ASING,
} from "@/lib/constants/subjects";

const PROGRESS_STEPS = [
  "Menginisialisasi parameter matriks asesmen TKA...",
  "Menyusun prompt berstandar Pusmendik & kaidah HOTS...",
  "Menghubungkan ke engine Google Gemini AI...",
  "Menganalisis wacana kontekstual & merancang opsi distraktor...",
  "Memvalidasi struktur butir soal, kunci & pembahasan...",
  "Menyimpan butir soal baru ke database sekolah...",
  "Selesai! Menampilkan hasil butir soal...",
];

export default function GeneratorSoalPage() {
  const { data: session, status: authStatus } = useSession();
  const userRole = (session?.user as any)?.role;

  if (authStatus === "loading") {
    return <div className="p-8 text-center text-xs text-slate-400">Memverifikasi hak akses...</div>;
  }

  if (userRole === "GURU") {
    notFound();
  }

  const [mapel, setMapel] = useState("MATEMATIKA");
  const [elemen, setElemen] = useState("");
  const [subElemen, setSubElemen] = useState("");
  const [kompetensi, setKompetensi] = useState("");
  const [batasan, setBatasan] = useState("");
  const [tipeSoal, setTipeSoal] = useState<"PILIHAN_GANDA" | "MCMA" | "PGK_KATEGORI">("PILIHAN_GANDA");
  const [jumlahSoal, setJumlahSoal] = useState(3);

  // Status Asesmen Rumpun Bahasa & Literasi
  const isLang = useMemo(() => isLanguageSubject(mapel), [mapel]);
  const [subKompetensi, setSubKompetensi] = useState("");
  const [modeStimulus, setModeStimulus] = useState<"AI_AUTO" | "CUSTOM_TEKS">("AI_AUTO");
  const [stimulusTeks, setStimulusTeks] = useState("");
  const [jenisTeks, setJenisTeks] = useState(GENRE_TEKS_INDONESIA[0]);
  const [topikTeks, setTopikTeks] = useState("");

  // Progress Bar & Overlay State
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState(PROGRESS_STEPS[0]);

  const handleMapelChange = (newMapel: string) => {
    setMapel(newMapel);
    if (isLanguageSubject(newMapel)) {
      if (newMapel.toUpperCase().includes("INGGRIS") || (newMapel.startsWith("B_") && newMapel !== "B_INDO_LANJUT")) {
        setJenisTeks(GENRE_TEKS_ASING[0]);
      } else {
        setJenisTeks(GENRE_TEKS_INDONESIA[0]);
      }
    }
  };

  // Status API State
  const [apiStatus, setApiStatus] = useState<{
    isConfigured: boolean;
    maskedKey: string | null;
    model: string;
  } | null>(null);
  const [checkingApi, setCheckingApi] = useState(true);

  // Live Prompt Preview State
  const [showPromptPreview, setShowPromptPreview] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  // Generation Results State
  const [isLoading, setIsLoading] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<any[]>([]);
  const [generationSource, setGenerationSource] = useState<string>("");
  const [generationStatusApi, setGenerationStatusApi] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Load API status on mount
  const checkApiStatus = async () => {
    setCheckingApi(true);
    try {
      const res = await fetch("/api/admin/generate-soal");
      const data = await res.json();
      if (data.success && data.apiStatus) {
        setApiStatus(data.apiStatus);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCheckingApi(false);
    }
  };

  useEffect(() => {
    checkApiStatus();
  }, []);



  // Kunci navigasi browser / pencegahan reload saat proses generate berlangsung
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isLoading) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    if (isLoading) {
      window.addEventListener("beforeunload", handleBeforeUnload);
    }
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isLoading]);

  // Real-time constructed prompt preview
  const livePrompt = useMemo(() => {
    return buildGeminiPrompt({
      mapel,
      tipeSoal,
      jumlahSoal,
      elemen: !isLang ? elemen : undefined,
      subElemen: !isLang ? subElemen : undefined,
      kompetensi,
      subKompetensi: isLang ? subKompetensi : undefined,
      batasan: !isLang ? batasan : undefined,
      jenisTeks: isLang ? jenisTeks : undefined,
      topikTeks: isLang ? topikTeks : undefined,
      stimulusTeks: isLang && modeStimulus === "CUSTOM_TEKS" ? stimulusTeks : undefined,
    });
  }, [
    mapel,
    tipeSoal,
    jumlahSoal,
    elemen,
    subElemen,
    kompetensi,
    subKompetensi,
    batasan,
    isLang,
    jenisTeks,
    topikTeks,
    modeStimulus,
    stimulusTeks,
  ]);

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(livePrompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!kompetensi.trim()) {
      setErrorMsg("Kompetensi wajib diisi.");
      return;
    }

    if (isLang && !subKompetensi.trim()) {
      setErrorMsg("Sub-Kompetensi untuk mata pelajaran bahasa wajib diisi.");
      return;
    }

    setIsLoading(true);
    setProgress(5);
    setProgressStep(PROGRESS_STEPS[0]);

    // Timer simulasi pergerakan progress bar multi-tahap
    let currentP = 5;
    const progressInterval = setInterval(() => {
      currentP += Math.max(0.4, (92 - currentP) * 0.08);
      if (currentP > 92) currentP = 92;
      setProgress(currentP);

      if (currentP < 20) {
        setProgressStep(PROGRESS_STEPS[0]);
      } else if (currentP < 38) {
        setProgressStep(PROGRESS_STEPS[1]);
      } else if (currentP < 58) {
        setProgressStep(PROGRESS_STEPS[2]);
      } else if (currentP < 76) {
        setProgressStep(PROGRESS_STEPS[3]);
      } else if (currentP < 88) {
        setProgressStep(PROGRESS_STEPS[4]);
      } else {
        setProgressStep(PROGRESS_STEPS[5]);
      }
    }, 200);

    try {
      const res = await fetch("/api/admin/generate-soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mapel,
          elemen: !isLang ? elemen : undefined,
          subElemen: !isLang ? subElemen : undefined,
          kompetensi,
          subKompetensi: isLang ? subKompetensi : undefined,
          batasan: !isLang ? batasan : undefined,
          tipeSoal,
          jumlahSoal,
          jenisTeks: isLang ? jenisTeks : undefined,
          topikTeks: isLang ? topikTeks : undefined,
          stimulusTeks: isLang && modeStimulus === "CUSTOM_TEKS" ? stimulusTeks : undefined,
        }),
      });

      const data = await res.json();
      clearInterval(progressInterval);

      if (data.success) {
        setProgress(100);
        setProgressStep(PROGRESS_STEPS[6]);
        // Tahan 400ms pada 100% sebelum overlay ditutup secara mulus
        await new Promise((resolve) => setTimeout(resolve, 400));

        setGeneratedResults(data.soal);
        setGenerationSource(data.source);
        setGenerationStatusApi(data.statusApi);
        setSuccessMsg(data.message);
      } else {
        setErrorMsg(data.error || "Gagal men-generate soal AI.");
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      setErrorMsg(err.message || "Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
      setProgress(0);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Fullscreen Overlay & Animated Progress Bar Saat Generate */}
      {isLoading && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-4 sm:p-6 select-none"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative w-full max-w-lg bg-slate-900/95 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl text-center backdrop-blur-xl overflow-hidden">
            {/* Efek Cahaya Latar / Aura Glow */}
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 right-0 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

            {/* Ikon Animasi Berputar & Berpendar */}
            <div className="relative mx-auto w-20 h-20 mb-5 flex items-center justify-center">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-500 animate-spin opacity-75 blur-md" />
              <div className="relative w-16 h-16 rounded-2xl bg-slate-950 border border-blue-400/40 flex items-center justify-center shadow-inner">
                <Sparkles className="w-8 h-8 text-blue-400 animate-pulse" />
              </div>
            </div>

            {/* Judul & Penjelasan */}
            <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Memproses Pembuatan Soal AI
            </h3>
            <p className="text-xs text-slate-300 mt-2 max-w-sm mx-auto leading-relaxed">
              Google Gemini AI sedang merangkai butir soal HOTS terstandar Pusmendik Kemendikdasmen berdasarkan matriks asesmen yang ditentukan.
            </p>

            {/* Metadata Soal yang Sedang Digenerate */}
            <div className="mt-4 inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/90 border border-slate-700 text-xs text-slate-200 font-medium shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span className="font-semibold">{mapel.replace(/_/g, " ")}</span>
              <span className="text-slate-500">&bull;</span>
              <span>{jumlahSoal} Butir Soal</span>
              <span className="text-slate-500">&bull;</span>
              <span className="text-blue-300 font-mono text-[11px]">{tipeSoal}</span>
            </div>

            {/* Progress Bar & Status Dinamis */}
            <div className="mt-6 space-y-2.5 text-left">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 text-blue-400 font-medium truncate max-w-[80%]">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin shrink-0 text-blue-400" />
                  <span className="truncate">{progressStep}</span>
                </div>
                <span className="text-white font-mono font-bold text-sm shrink-0">
                  {Math.round(progress)}%
                </span>
              </div>

              <div className="w-full h-3.5 bg-slate-800 rounded-full overflow-hidden p-0.5 border border-slate-700 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 transition-all duration-300 ease-out shadow-sm shadow-blue-500/50"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Peringatan Penguncian Halaman */}
            <div className="mt-6 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/25 text-[11px] text-amber-200 flex items-center justify-center gap-2 text-left">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>
                <strong>Halaman terkunci sementara:</strong> Mohon tidak menutup tab atau berpindah menu hingga seluruh butir soal selesai dibuat dan disimpan ke bank soal.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Soal Generator TKA</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Generator Soal AI Berbasis Matriks Asesmen
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Menghasilkan butir soal latihan baru merujuk pada standar kerangka asesmen TKA Pusmendik Kemendikdasmen. Seluruh parameter form dijadikan instruksi acuan prompt ke Gemini AI.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/validasi-soal"
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 w-fit cursor-pointer"
          >
            <span>Ke Menu Validasi Soal</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* API Status Alert Banner */}
      {!checkingApi && apiStatus && (
        <div>
          {apiStatus.isConfigured ? (
            <div className="p-4 rounded-3xl bg-emerald-50/80 border border-emerald-200 text-emerald-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-extrabold text-slate-900 flex items-center gap-2">
                    <span>Status Gemini AI: Aktif & Siap Digunakan</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-black">
                      TERHUBUNG
                    </span>
                  </div>
                  <p className="text-[11px] text-emerald-800 mt-0.5">
                    Kunci API terdeteksi di <code>.env</code> ({apiStatus.maskedKey}). Model acuan: <strong>{apiStatus.model}</strong>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={checkApiStatus}
                className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Cek Ulang</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex flex-col sm:flex-row sm:items-start justify-between gap-3 shadow-xs">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="font-extrabold text-amber-950 flex items-center gap-2">
                    <span>Status Gemini AI: Belum Dikonfigurasi di file .env</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-200 text-amber-950 font-black">
                      API KEY KOSONG
                    </span>
                  </div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Variabel <code>GEMINI_API_KEY</code> di file <code>.env</code> masih kosong. Tambahkan kunci API Gemini Anda di file <code>.env</code> server untuk mengaktifkan koneksi Live Google Gemini.
                  </p>
                  <div className="text-[11px] text-amber-900 bg-amber-100/80 px-3 py-1.5 rounded-xl font-medium border border-amber-200/60">
                    💡 <strong>Mode Simulasi Kontekstual Aktif:</strong> Anda tetap dapat men-generate soal! Sistem akan menyusun butir soal secara kontekstual yang 100% mengadopsi Elemen, Sub-Elemen, Kompetensi, dan Batasan yang Anda isi di form.
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={checkApiStatus}
                className="text-[11px] font-bold text-amber-800 hover:text-amber-950 flex items-center gap-1 self-start sm:self-auto cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Refresh Status</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Banner Informasi Kerangka Asesmen Pusmendik */}
      <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-center gap-2.5">
          <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
          <span className="font-semibold text-slate-800">
            Gunakan Kerangka Asesmen TKA Kemendikdasmen sebagai acuan untuk generate soal.{" "}
            <a
              href="https://pusmendik.kemendikdasmen.go.id/tka/tka/view/mata-pelajaran-wajib/sma"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 font-bold underline hover:text-blue-800 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Cek Disini</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </span>
        </div>
      </div>


      {/* Main Generator Form */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleGenerate} className="space-y-6">
          <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
            <span className="font-bold text-slate-800">Parameter Konfigurasi Generator</span>
            <span className="text-[11px] text-slate-400">
              Tanda <span className="text-rose-500 font-bold">*</span> wajib diisi
            </span>
          </div>

          {/* Top Row: Mapel, Tipe Soal, Jumlah */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span>Mata Pelajaran</span>
                  <span className="text-rose-500 font-bold">*</span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">Acuan Prompt #1</span>
              </label>
              <select
                value={mapel}
                onChange={(e) => handleMapelChange(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white cursor-pointer focus:ring-2 focus:ring-blue-500"
              >
                <optgroup label="Mata Pelajaran Wajib (TKA)">
                  {MAPEL_WAJIB.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </optgroup>
                {MAPEL_PILIHAN_GROUPS.map((group) => (
                  <optgroup key={group.groupName} label={group.groupName}>
                    {group.subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span>Bentuk Soal</span>
                  <span className="text-rose-500 font-bold">*</span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">Acuan Prompt #2</span>
              </label>
              <select
                value={tipeSoal}
                onChange={(e) => setTipeSoal(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white cursor-pointer focus:ring-2 focus:ring-blue-500"
              >
                <option value="PILIHAN_GANDA">Pilihan Ganda Tunggal (5 Opsi A–E, 1 Kunci)</option>
                <option value="MCMA">MCMA (Pilihan Ganda Kompleks Multi-Jawaban)</option>
                <option value="PGK_KATEGORI">PGK Kategori (Matriks Benar/Salah)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <span>Jumlah Butir Soal</span>
                  <span className="text-rose-500 font-bold">*</span>
                </div>
                <span className="text-[10px] text-slate-400 font-normal">Acuan Prompt #3</span>
              </label>
              <select
                value={jumlahSoal}
                onChange={(e) => setJumlahSoal(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white cursor-pointer focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1 Butir Soal</option>
                <option value={3}>3 Butir Soal (Rekomendasi)</option>
                <option value={5}>5 Butir Soal</option>
                <option value={10}>10 Butir Soal</option>
              </select>
            </div>
          </div>

          {/* Panel Khusus Rumpun Bahasa & Literasi Membaca */}
          {isLang && (
            <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-indigo-50/90 via-blue-50/50 to-slate-50 border-2 border-indigo-200/80 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-indigo-100/80 pb-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-base shadow-xs shrink-0">
                    📖
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-indigo-950 flex items-center gap-2">
                      <span>Parameter Khusus Asesmen Bahasa & Literasi Membaca</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-200 text-indigo-900 font-black tracking-wide">
                        AKTIF
                      </span>
                    </h3>
                    <p className="text-[11px] text-indigo-700/80 mt-0.5">
                      Disesuaikan untuk mata pelajaran rumpun bahasa (berbasis teks wacana bacaan dan analisis kebahasaan).
                    </p>
                  </div>
                </div>

                {/* Mode Stimulus Switcher */}
                <div className="flex items-center bg-white p-1 rounded-xl border border-indigo-200 text-xs font-bold shrink-0 self-start sm:self-auto shadow-xs">
                  <button
                    type="button"
                    onClick={() => setModeStimulus("AI_AUTO")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      modeStimulus === "AI_AUTO"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    🤖 AI Susun Wacana Otomatis
                  </button>
                  <button
                    type="button"
                    onClick={() => setModeStimulus("CUSTOM_TEKS")}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      modeStimulus === "CUSTOM_TEKS"
                        ? "bg-indigo-600 text-white shadow-xs"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    ✍️ Tempel Wacana Sendiri
                  </button>
                </div>
              </div>

              {/* Baris 1: Genre Teks & Topik Bacaan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Jenis / Genre Teks Wacana</span>
                    <span className="text-[10px] text-indigo-600 font-semibold">Struktur Teks</span>
                  </label>
                  <select
                    value={jenisTeks}
                    onChange={(e) => setJenisTeks(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {(mapel.toUpperCase().includes("INGGRIS") || (mapel.startsWith("B_") && mapel !== "B_INDO_LANJUT")
                      ? GENRE_TEKS_ASING
                      : GENRE_TEKS_INDONESIA
                    ).map((genre) => (
                      <option key={genre} value={genre}>
                        {genre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>Topik / Tema Kontekstual Wacana</span>
                    <span className="text-[10px] text-indigo-600 font-semibold">Konteks Bacaan</span>
                  </label>
                  <input
                    type="text"
                    value={topikTeks}
                    onChange={(e) => setTopikTeks(e.target.value)}
                    placeholder="mis: Keselamatan Kerja (K3), Otomatisasi AI di Industri, Etika Komunikasi..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>



              {/* Baris 3: Teks Wacana Mandiri (Jika mode CUSTOM_TEKS) */}
              {modeStimulus === "CUSTOM_TEKS" ? (
                <div className="space-y-1.5 bg-white p-4 rounded-2xl border border-indigo-200 shadow-xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-indigo-950 flex items-center gap-2">
                      <span>Teks Wacana / Stimulus Bacaan Milik Guru</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 font-bold">
                        SUMBER RESMI GURU
                      </span>
                    </label>
                    <span className="text-[11px] text-slate-400">
                      {stimulusTeks.trim() ? `${stimulusTeks.trim().split(/\s+/).length} kata` : "Belum diisi"}
                    </span>
                  </div>
                  <textarea
                    rows={6}
                    value={stimulusTeks}
                    onChange={(e) => setStimulusTeks(e.target.value)}
                    placeholder="Tempelkan paragraf bacaan, naskah dialog percakapan, dokumen SOP bengkel, cerpen, atau artikel jurnal Anda di sini (disarankan 100 - 350 kata). Seluruh butir soal yang di-generate AI akan 100% mengacu pada teks ini..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 focus:ring-2 focus:ring-indigo-500 leading-relaxed"
                    required={modeStimulus === "CUSTOM_TEKS"}
                  />
                  <p className="text-[10px] text-slate-500">
                    💡 <strong>Jaminan Ketat:</strong> Gemini AI akan diperintahkan secara absolut untuk tidak mengarang teks lain dan hanya menyusun soal berdasarkan wacana bacaan yang Anda tempel di atas.
                  </p>
                </div>
              ) : (
                <div className="p-3 bg-white/80 rounded-2xl border border-indigo-100 text-[11px] text-indigo-900 flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>
                    <strong>Mode AI Otomatis:</strong> Gemini akan terlebih dahulu menyusun wacana bacaan baru yang berkualitas sesuai genre <em>"{jenisTeks}"</em> bertema <em>"{topikTeks.trim() || "Dunia Kerja, Industri Vokasi & Inovasi Modern (Default)"}"</em>, lalu membuat butir soal yang menguji pemahaman teks tersebut.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Parameter Asesmen: Rumpun Bahasa (Kompetensi & Sub-Kompetensi Saja) VS Non-Bahasa (4 Parameter Pusmendik) */}
          {isLang ? (
            <div className="bg-white p-5 sm:p-6 rounded-3xl border border-indigo-200/80 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <span className="text-xs font-extrabold text-indigo-950 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Kompetensi & Sub-Kompetensi Asesmen Bahasa</span>
                </span>
                <span className="text-[10px] text-slate-400 font-medium">Acuan Target Pembelajaran</span>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span>1. Kompetensi</span>
                      <span className="text-rose-500 font-bold">*</span>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-semibold">Capaian Pembelajaran Bahasa</span>
                  </label>
                  <input
                    type="text"
                    value={kompetensi}
                    onChange={(e) => setKompetensi(e.target.value)}
                    placeholder="Wajib diisi mengacu pada Matriks Asesmen pada Kerangka Asesmen bagian Kompetensi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      <span>2. Sub-Kompetensi</span>
                      <span className="text-rose-500 font-bold">*</span>
                    </div>
                    <span className="text-[10px] text-indigo-600 font-semibold">Indikator Ketercapaian HOTS</span>
                  </label>
                  <textarea
                    rows={2}
                    value={subKompetensi}
                    onChange={(e) => setSubKompetensi(e.target.value)}
                    placeholder="Wajib diisi mengacu pada Matriks Asesmen pada Kerangka Asesmen bagian Sub-Kompetensi"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500"
                    required={isLang}
                  />
                </div>
              </div>
            </div>
          ) : (
            /* 4 Parameter Asesmen untuk Mapel Non-Bahasa (Eksak, Akademik & Kejuruan SMK) */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <span>1. Kompetensi / Indikator Asesmen (HOTS)</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </div>
                  <span className="text-[10px] text-blue-600 font-semibold">Fokus Utama Pengukuran</span>
                </label>
                <textarea
                  rows={2}
                  value={kompetensi}
                  onChange={(e) => setKompetensi(e.target.value)}
                  placeholder="Wajib diisi mengacu pada Matriks Asesmen pada Kerangka Asesmen bagian Kompetensi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                  required
                />
                <p className="text-[10px] text-slate-400">
                  Target kemampuan utama yang harus diukur dalam butir soal. Gunakan kata kerja operasional HOTS (menganalisis, mengevaluasi, memecahkan masalah).
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>2. Elemen / Materi Pokok</span>
                  <span className="text-[10px] text-slate-400 font-normal">Acuan Materi</span>
                </label>
                <input
                  type="text"
                  value={elemen}
                  onChange={(e) => setElemen(e.target.value)}
                  placeholder="Opsional mengacu pada Kerangka Asesmen bagian Elemen/materi"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>3. Sub-Elemen / Sub-Materi</span>
                  <span className="text-[10px] text-slate-400 font-normal">Acuan Sub-Topik</span>
                </label>
                <input
                  type="text"
                  value={subElemen}
                  onChange={(e) => setSubElemen(e.target.value)}
                  placeholder="Opsional mengacu pada Kerangka Asesmen bagian Sub-Elemen"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1.5 sm:col-span-2">
                <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                  <span>4. Batasan Konteks & Catatan Materi</span>
                  <span className="text-[10px] text-slate-400 font-normal">Catatan Tambahan</span>
                </label>
                <textarea
                  rows={2}
                  value={batasan}
                  onChange={(e) => setBatasan(e.target.value)}
                  placeholder="Opsional mengacu pada Kerangka Asesmen bagian Batasan/Catatan"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-[10px] text-slate-400">
                  Opsional. Boleh dikosongkan jika mata pelajaran (seperti Kimia, PKn, Ekonomi, Geografi, Sosiologi, Sejarah, Antropologi, dsb.) tidak memiliki catatan batasan khusus.
                </p>
              </div>
            </div>
          )}

          {/* Live Prompt Preview Section */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPromptPreview(!showPromptPreview)}
              className="w-full px-4 py-3 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-700 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Code2 className="w-4 h-4 text-blue-600" />
                <span>Pratinjau Prompt AI yang Dikirim ke Gemini ({showPromptPreview ? "Sembunyikan" : "Tampilkan"})</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                <span>{showPromptPreview ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</span>
              </div>
            </button>

            {showPromptPreview && (
              <div className="p-4 bg-slate-900 text-slate-200 text-[11px] font-mono space-y-3">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                  <span className="text-slate-400 text-[10px]">
                    Prompt ini dirangkai secara otomatis berdasarkan 7 parameter input di atas:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold flex items-center gap-1 cursor-pointer transition-all"
                  >
                    {copiedPrompt ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedPrompt ? "Tersalin!" : "Salin Prompt"}</span>
                  </button>
                </div>
                <pre className="whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto pr-2 text-slate-300">
                  {livePrompt}
                </pre>
              </div>
            )}
          </div>

          {/* Messages */}
          {errorMsg && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Submit */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500">
              Soal yang dihasilkan akan tersimpan di database dengan status <strong>MENUNGGU_VALIDASI</strong>.
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 w-full sm:w-auto justify-center"
            >
              <Sparkles className="w-4 h-4" />
              <span>{isLoading ? "Sedang Men-generate Soal AI..." : "Generate Soal dengan Gemini AI"}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Generated Results Preview */}
      {generatedResults.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Hasil Generate ({generatedResults.length} Butir Soal Baru)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Merujuk pada Elemen <strong>{elemen}</strong>, Sub-Elemen <strong>{subElemen}</strong> ({mapel}).
                {isLang ? (
                  <>
                    Merujuk pada Kompetensi <strong>{kompetensi}</strong> ({mapel}).
                  </>
                ) : (
                  <>
                    Merujuk pada Kompetensi <strong>{kompetensi}</strong>
                    {elemen && <> &bull; Elemen <strong>{elemen}</strong></>}
                    {subElemen && <> ({subElemen})</>} ({mapel}).
                  </>
                )}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs px-3 py-1 rounded-full font-bold border ${
                  generationSource === "AI_GEMINI"
                    ? "bg-blue-50 text-blue-800 border-blue-200"
                    : "bg-purple-50 text-purple-800 border-purple-200"
                }`}
              >
                {generationSource === "AI_GEMINI" ? "✨ Dihasilkan oleh Google Gemini 1.5 Flash" : "⚡ Dihasilkan oleh Mesin Simulasi Kontekstual"}
              </span>
              <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-full font-bold border border-amber-200">
                Status: Menunggu Validasi Guru
              </span>
            </div>
          </div>

          <div className="space-y-4">
            {generatedResults.map((q, idx) => {
              // Parse & Normalize options and answer keys
              const parsedOpsi = normalizeOpsiJawaban(q.opsiJawaban);
              const parsedKunci = normalizeKunciJawaban(q.kunciJawaban, q.tipeSoal);

              return (
                <div key={q.id || idx} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <span className="font-extrabold text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                      Butir #{idx + 1} • {q.tipeSoal}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">Mapel: {q.mapel}</span>
                  </div>

                  {/* Question Stem */}
                  <div className="text-xs text-slate-800 leading-relaxed font-medium">
                    <MathRenderer content={q.pertanyaan} />
                  </div>

                  {/* Options Rendering Based on Type */}
                  {q.tipeSoal === "PILIHAN_GANDA" && Array.isArray(parsedOpsi) && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Pilihan Jawaban (A-E):
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {parsedOpsi.map((opt: any, oIdx: number) => {
                          const optId = String(opt.id || opt.kunci || opt.key || String.fromCharCode(65 + oIdx)).toUpperCase();
                          const optLabel = String(opt.label || opt.teks || opt.text || opt.value || "");
                          const isCorrect = optId === String(parsedKunci).toUpperCase();
                          return (
                            <div
                              key={optId}
                              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                                isCorrect
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold"
                                  : "bg-slate-50/70 border-slate-200 text-slate-700 font-medium"
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-lg flex items-center justify-center font-black text-[11px] shrink-0 ${
                                  isCorrect ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200"
                                }`}
                              >
                                {optId}
                              </span>
                              <div className="flex-1">
                                <MathRenderer content={optLabel} />
                              </div>
                              {isCorrect && (
                                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md uppercase">
                                  Kunci Benar
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* MCMA Multiple Answers */}
                  {q.tipeSoal === "MCMA" && Array.isArray(parsedOpsi) && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Pilihan Jawaban Kompleks (Multi-Jawaban):
                      </span>
                      <div className="grid grid-cols-1 gap-2">
                        {parsedOpsi.map((opt: any, oIdx: number) => {
                          const optId = String(opt.id || opt.kunci || opt.key || String.fromCharCode(65 + oIdx)).toUpperCase();
                          const optLabel = String(opt.label || opt.teks || opt.text || opt.value || "");
                          const isCorrect = Array.isArray(parsedKunci)
                            ? parsedKunci.includes(optId)
                            : String(parsedKunci).toUpperCase().includes(optId);

                          return (
                            <div
                              key={optId}
                              className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                                isCorrect
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-950 font-bold"
                                  : "bg-slate-50/70 border-slate-200 text-slate-700 font-medium"
                              }`}
                            >
                              <span
                                className={`w-5 h-5 rounded-lg flex items-center justify-center font-black text-[11px] shrink-0 ${
                                  isCorrect ? "bg-emerald-600 text-white" : "bg-white text-slate-600 border border-slate-200"
                                }`}
                              >
                                {optId}
                              </span>
                              <div className="flex-1">
                                <MathRenderer content={optLabel} />
                              </div>
                              {isCorrect && (
                                <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md uppercase">
                                  Jawaban Benar
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* PGK Kategori Matrix */}
                  {q.tipeSoal === "PGK_KATEGORI" && parsedOpsi?.statements && (
                    <div className="space-y-2 pt-2">
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                        Matriks Pernyataan Kategori (Benar / Salah):
                      </span>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left border-collapse border border-slate-200 rounded-xl overflow-hidden">
                          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-600 border-b border-slate-200">
                            <tr>
                              <th className="p-2.5 w-10 text-center">No</th>
                              <th className="p-2.5">Pernyataan</th>
                              <th className="p-2.5 w-28 text-center">Kunci Evaluasi</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {parsedOpsi.statements.map((stmt: any, sIdx: number) => {
                              const ansItem = Array.isArray(parsedKunci)
                                ? parsedKunci.find((k: any) => k.id === stmt.id)
                                : null;
                              const evalAnswer = ansItem ? ansItem.answer : "Benar";
                              return (
                                <tr key={stmt.id || sIdx} className="hover:bg-slate-50">
                                  <td className="p-2.5 text-center font-bold text-slate-400">{sIdx + 1}</td>
                                  <td className="p-2.5 text-slate-800 font-medium">
                                    <MathRenderer content={stmt.text} />
                                  </td>
                                  <td className="p-2.5 text-center">
                                    <span
                                      className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase ${
                                        evalAnswer === "Benar" || evalAnswer === "Sesuai"
                                          ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                          : "bg-rose-100 text-rose-800 border border-rose-200"
                                      }`}
                                    >
                                      {evalAnswer}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Explanation */}
                  <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1.5">
                    <span className="font-extrabold text-emerald-950 block">Kunci Jawaban & Pembahasan Lengkap:</span>
                    <div className="text-slate-700 leading-relaxed">
                      <MathRenderer content={q.pembahasan} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-5 rounded-3xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="font-extrabold text-slate-900 text-xs">Selanjutnya: Validasi Butir Soal</h4>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Butir soal telah tersimpan di antrean validasi guru. Guru pengampu dapat meninjau, mengoreksi, atau menerbitkan soal ke bank soal latihan siswa.
              </p>
            </div>
            <Link
              href="/admin/validasi-soal"
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0"
            >
              <span>Validasi di Menu Bank Soal</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}