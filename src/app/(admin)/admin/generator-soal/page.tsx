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
} from "lucide-react";
import MathRenderer from "@/components/math/MathRenderer";
import { buildGeminiPrompt, normalizeOpsiJawaban, normalizeKunciJawaban } from "@/lib/quiz/normalize";
import {
  MAPEL_WAJIB,
  MAPEL_PILIHAN_GROUPS,
  isLanguageSubject,
  GENRE_TEKS_INDONESIA,
  GENRE_TEKS_ASING,
  FOKUS_KEBAHASAAN_OPTIONS,
} from "@/lib/constants/subjects";

// Pusmendik framework presets covering multiple vocational disciplines
const PUSMENDIK_PRESETS = [
  {
    mapel: "MATEMATIKA",
    label: "Matematika: Fungsi Kuadrat",
    elemen: "Aljabar dan Fungsi",
    subElemen: "Persamaan dan Fungsi Kuadrat",
    kompetensi: "Menyelesaikan masalah kontekstual yang berkaitan dengan nilai optimum fungsi kuadrat.",
    batasan: "Fungsi kuadrat dalam bentuk standar f(x) = ax^2 + bx + c dengan nilai diskriminan D >= 0, tidak melibatkan akar bilangan imajiner.",
  },
  {
    mapel: "BAHASA_INDONESIA",
    label: "B. Indonesia: Teks Eksplanasi Industri",
    elemen: "Membaca dan Memirsa",
    subElemen: "Teks Eksplanasi & Artikel Ilmiah Populer",
    kompetensi: "Mengevaluasi gagasan pokok, hubungan sebab-akibat (kausalitas), dan kalimat fakta vs opini dalam teks teknologis.",
    batasan: "Panjang teks stimulus 150-250 kata dengan topik inovasi teknologi atau rekayasa industri modern.",
    jenisTeks: "Teks Eksplanasi (Penjelasan Sebab-Akibat Fenomena Teknis/Ilmiah)",
    topikTeks: "Otomatisasi Industri & Keselamatan Kerja Vokasi",
    fokusKebahasaan: "Menganalisis Makna Tersirat & Inferensi Logis (Inference / Implicit Meaning)",
  },
  {
    mapel: "BAHASA_INGGRIS",
    label: "B. Inggris: Analytical Exposition K3",
    elemen: "Reading and Viewing",
    subElemen: "Analytical Exposition on Vocational Workplaces",
    kompetensi: "Menganalisis argumen utama, thesis statement, dan makna idiomatis/kosakata teknis dalam konteks keselamatan kerja (K3).",
    batasan: "Teks bacaan bahasa Inggris dengan panjang 180-220 kata bertema Occupational Safety and Health.",
    jenisTeks: "Analytical Exposition (Critical Issues, Safety, Technology)",
    topikTeks: "Occupational Safety and Health (K3) Protocols in Modern Workshops",
    fokusKebahasaan: "Menentukan Ide Pokok, Kalimat Utama & Gagasan Utama (Main Idea)",
  },
  {
    mapel: "BAHASA_INGGRIS",
    label: "B. Inggris: Technical Manual & SOP",
    elemen: "Reading and Viewing",
    subElemen: "Technical Procedure & Industrial Operating Manual",
    kompetensi: "Menganalisis urutan instruksi kerja logis, makna istilah teknis spesifik, dan kata kerja imperatif dalam SOP bengkel.",
    batasan: "Teks prosedur manual instruksi teknis pengoperasian alat workshop.",
    jenisTeks: "Procedure Text / Operating Manual & SOP",
    topikTeks: "Safe Operation and Preventive Maintenance of CNC Machines",
    fokusKebahasaan: "Makna Kosakata Kontekstual, Istilah Teknis & Sinonim/Antonim",
  },
  {
    mapel: "TJKT",
    label: "TJKT: Keamanan Jaringan & VLAN",
    elemen: "Infrastruktur Jaringan dan Komputasi Awan",
    subElemen: "Virtual LAN (VLAN) & Network Access Control",
    kompetensi: "Merancang konfigurasi trunking 802.1Q dan Access Control List (ACL) untuk segmentasi lalu lintas jaringan departemen.",
    batasan: "Topologi jaringan enterprise dengan maksimal 3 switch terkelola dan 1 router gateway.",
  },
  {
    mapel: "PPLG",
    label: "PPLG: OOP & Arsitektur Perangkat Lunak",
    elemen: "Pemrograman Berorientasi Objek (OOP)",
    subElemen: "Prinsip Enkapsulasi, Pewarisan, dan Polimorfisme",
    kompetensi: "Menganalisis perancangan kelas, hierarki inheritance, dan interface untuk membangun kode modular yang mudah diuji.",
    batasan: "Bahasa pemrograman modern (Java / TypeScript / Python), kedalaman hierarki inheritance maksimal 3 level.",
  },
  {
    mapel: "DPIB",
    label: "DPIB: Pemodelan Struktur Bangunan",
    elemen: "Desain Pemodelan dan Informasi Bangunan",
    subElemen: "Analisis Beban Struktur & Gambar Kerja 2D/3D",
    kompetensi: "Menghitung pembebanan struktur balok beton bertulang dan menganalisis simbol kerja standar konstruksi sipil.",
    batasan: "Konstruksi bangunan gedung bertingkat rendah (1-2 lantai) dengan beban mati dan beban hidup standar SNI.",
  },
  {
    mapel: "TITL",
    label: "TITL: Kendali Motor Listrik",
    elemen: "Instalasi Tenaga Listrik",
    subElemen: "Sistem Kendali Elektromagnetik Motor 3 Fasa",
    kompetensi: "Mendiagnosis rangkaian daya dan kontrol forward-reverse serta sistem proteksi Thermal Overload Relay (TOR).",
    batasan: "Tegangan kerja 380V/220V dengan proteksi MCB dan TOR standar PUIL 2011.",
  },
  {
    mapel: "TM",
    label: "Teknik Mesin: Parameter Bubut CNC",
    elemen: "Teknik Pemesinan Bubut dan Frais",
    subElemen: "Perhitungan Parameter Pemotongan (Cutting Speed & Feed Rate)",
    kompetensi: "Menentukan kecepatan putar spindel (RPM) dan waktu pemesinan efektif berdasarkan karakteristik material benda kerja.",
    batasan: "Material baja karbon menengah (St 42 / St 60) dengan pahat HSS dan karbida, toleransi pembubutan ISO standar.",
  },
  {
    mapel: "TO",
    label: "Teknik Otomotif: Electronic Fuel Injection",
    elemen: "Pemeliharaan Mesin Kendaraan Ringan",
    subElemen: "Sistem Electronic Fuel Injection (EFI) & Sensor Mesin",
    kompetensi: "Mendiagnosis malafungsi sinyal sensor Mass Air Flow (MAF) dan O2 Sensor menggunakan scan tool dan multimeter.",
    batasan: "Sistem injeksi bensin multi-point (MPI) 4-silinder siklus Otto.",
  },
  {
    mapel: "KA",
    label: "Kimia Analisis: Titrasi Volumetri",
    elemen: "Analisis Kimia Kuantitatif",
    subElemen: "Titrasi Asam-Basa (Asidi-Alkalimetri)",
    kompetensi: "Menghitung konsentrasi analit dan mengevaluasi pemilihan indikator pH yang tepat berdasarkan kurva titrasi.",
    batasan: "Titrasi asam kuat - basa kuat dan asam lemah - basa kuat, mengabaikan efek kekuatan ionik sekunder.",
  },
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
  const [elemen, setElemen] = useState(PUSMENDIK_PRESETS[0].elemen);
  const [subElemen, setSubElemen] = useState(PUSMENDIK_PRESETS[0].subElemen);
  const [kompetensi, setKompetensi] = useState(PUSMENDIK_PRESETS[0].kompetensi);
  const [batasan, setBatasan] = useState(PUSMENDIK_PRESETS[0].batasan);
  const [tipeSoal, setTipeSoal] = useState<"PILIHAN_GANDA" | "MCMA" | "PGK_KATEGORI">("PILIHAN_GANDA");
  const [jumlahSoal, setJumlahSoal] = useState(3);

  // Status Asesmen Rumpun Bahasa & Literasi
  const isLang = useMemo(() => isLanguageSubject(mapel), [mapel]);
  const [modeStimulus, setModeStimulus] = useState<"AI_AUTO" | "CUSTOM_TEKS">("AI_AUTO");
  const [stimulusTeks, setStimulusTeks] = useState("");
  const [jenisTeks, setJenisTeks] = useState(GENRE_TEKS_INDONESIA[0]);
  const [topikTeks, setTopikTeks] = useState("Otomatisasi Industri & Keselamatan Kerja Vokasi");
  const [fokusKebahasaan, setFokusKebahasaan] = useState(FOKUS_KEBAHASAAN_OPTIONS[0]);

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

  const handleApplyPreset = (idx: number) => {
    const p = PUSMENDIK_PRESETS[idx] as any;
    setMapel(p.mapel);
    setElemen(p.elemen);
    setSubElemen(p.subElemen);
    setKompetensi(p.kompetensi);
    setBatasan(p.batasan);
    if (p.jenisTeks) setJenisTeks(p.jenisTeks);
    if (p.topikTeks) setTopikTeks(p.topikTeks);
    if (p.fokusKebahasaan) setFokusKebahasaan(p.fokusKebahasaan);
    if (p.stimulusTeks) {
      setStimulusTeks(p.stimulusTeks);
      setModeStimulus("CUSTOM_TEKS");
    } else {
      setModeStimulus("AI_AUTO");
    }
  };

  // Real-time constructed prompt preview
  const livePrompt = useMemo(() => {
    return buildGeminiPrompt({
      mapel,
      tipeSoal,
      jumlahSoal,
      elemen,
      subElemen,
      kompetensi,
      batasan,
      jenisTeks: isLang ? jenisTeks : undefined,
      topikTeks: isLang ? topikTeks : undefined,
      stimulusTeks: isLang && modeStimulus === "CUSTOM_TEKS" ? stimulusTeks : undefined,
      fokusKebahasaan: isLang ? fokusKebahasaan : undefined,
    });
  }, [
    mapel,
    tipeSoal,
    jumlahSoal,
    elemen,
    subElemen,
    kompetensi,
    batasan,
    isLang,
    jenisTeks,
    topikTeks,
    modeStimulus,
    stimulusTeks,
    fokusKebahasaan,
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
    setIsLoading(true);

    try {
      const res = await fetch("/api/admin/generate-soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mapel,
          elemen,
          subElemen,
          kompetensi,
          batasan,
          tipeSoal,
          jumlahSoal,
          jenisTeks: isLang ? jenisTeks : undefined,
          topikTeks: isLang ? topikTeks : undefined,
          stimulusTeks: isLang && modeStimulus === "CUSTOM_TEKS" ? stimulusTeks : undefined,
          fokusKebahasaan: isLang ? fokusKebahasaan : undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setGeneratedResults(data.soal);
        setGenerationSource(data.source);
        setGenerationStatusApi(data.statusApi);
        setSuccessMsg(data.message);
      } else {
        setErrorMsg(data.error || "Gagal men-generate soal AI.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan jaringan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
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

      {/* Preset Quick Select */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Preset Cepat Matriks Pusmendik (1-Klik Isi Seluruh Parameter Form)</span>
          </span>
          <span className="text-slate-400 font-medium text-[11px]">Pilih untuk mengisi form otomatis</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {PUSMENDIK_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(idx)}
              className="p-2.5 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-left transition-all cursor-pointer group"
            >
              <span className="text-[10px] font-extrabold text-blue-700 block uppercase tracking-wider group-hover:text-blue-800">
                {p.mapel}
              </span>
              <span className="text-xs font-bold text-slate-800 block line-clamp-1 mt-0.5">
                {p.label.split(":")[1] || p.label}
              </span>
              <span className="text-[10px] text-slate-400 block line-clamp-1 mt-0.5">
                {p.elemen}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Generator Form */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleGenerate} className="space-y-6">
          {/* Top Row: Mapel, Tipe Soal, Jumlah */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>Mata Pelajaran</span>
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
                <span>Bentuk Soal</span>
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
                <span>Jumlah Butir Soal</span>
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

              {/* Baris 2: Fokus Aspek Kebahasaan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>Fokus Aspek Kebahasaan yang Diuji</span>
                  <span className="text-[10px] text-indigo-600 font-semibold">Target Pengukuran HOTS</span>
                </label>
                <select
                  value={fokusKebahasaan}
                  onChange={(e) => setFokusKebahasaan(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-indigo-200 bg-white text-xs font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                >
                  {FOKUS_KEBAHASAAN_OPTIONS.map((fokus) => (
                    <option key={fokus} value={fokus}>
                      {fokus}
                    </option>
                  ))}
                </select>
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
                    <strong>Mode AI Otomatis:</strong> Gemini akan terlebih dahulu menyusun wacana bacaan baru yang berkualitas sesuai genre <em>"{jenisTeks}"</em> bertema <em>"{topikTeks}"</em>, lalu membuat butir soal yang menguji pemahaman teks tersebut.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 4 Pusmendik Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>{isLang ? "1. Elemen / Keterampilan Bahasa" : "1. Elemen / Materi Pokok"}</span>
                <span className="text-[10px] text-slate-400 font-normal">Acuan Prompt #4</span>
              </label>
              <input
                type="text"
                value={elemen}
                onChange={(e) => setElemen(e.target.value)}
                placeholder={isLang ? "Contoh: Membaca dan Memirsa (Reading & Viewing)..." : "Contoh: Aljabar dan Fungsi..."}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>{isLang ? "2. Sub-Elemen / Struktur Wacana" : "2. Sub-Elemen / Sub-Materi"}</span>
                <span className="text-[10px] text-slate-400 font-normal">Acuan Prompt #5</span>
              </label>
              <input
                type="text"
                value={subElemen}
                onChange={(e) => setSubElemen(e.target.value)}
                placeholder={isLang ? "Contoh: Teks Eksplanasi / Analytical Exposition..." : "Contoh: Persamaan dan Fungsi Kuadrat..."}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>3. Kompetensi / Indikator Asesmen (HOTS)</span>
                <span className="text-[10px] text-slate-400 font-normal">Acuan Prompt #6</span>
              </label>
              <textarea
                rows={2}
                value={kompetensi}
                onChange={(e) => setKompetensi(e.target.value)}
                placeholder={
                  isLang
                    ? "Contoh: Menganalisis ide pokok, hubungan sebab-akibat, dan inferensi makna tersirat dalam wacana..."
                    : "Contoh: Menyelesaikan masalah kontekstual yang berkaitan dengan nilai optimum fungsi kuadrat..."
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-[10px] text-slate-400">
                Gunakan kata kerja operasional HOTS (menganalisis, mengevaluasi, memecahkan masalah, merancang, mengidentifikasi malafungsi).
              </p>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 flex items-center justify-between">
                <span>4. Batasan Konteks & Ruang Lingkup Materi</span>
                <span className="text-[10px] text-slate-400 font-normal">Acuan Prompt #7</span>
              </label>
              <textarea
                rows={2}
                value={batasan}
                onChange={(e) => setBatasan(e.target.value)}
                placeholder={
                  isLang
                    ? "Contoh: Panjang teks wacana 150-250 kata, konteks keselamatan kerja industri, kaidah ejaan baku..."
                    : "Contoh: Nilai diskriminan D >= 0, tidak melibatkan bilangan imajiner, fungsi standar f(x) = ax^2 + bx + c..."
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                required
              />
              <p className="text-[10px] text-slate-400">
                Menjadi koridor pembatas ketat agar AI tidak membuat soal di luar lingkup materi yang dipelajari siswa.
              </p>
            </div>
          </div>

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