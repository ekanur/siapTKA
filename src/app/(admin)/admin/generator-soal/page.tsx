"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Sparkles,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Calculator,
  Code2,
  Layers,
  Wand2,
  Settings2,
  HelpCircle,
} from "lucide-react";
import MathRenderer from "@/components/math/MathRenderer";

// Official Pusmendik framework presets
const PUSMENDIK_PRESETS = [
  {
    mapel: "MATEMATIKA",
    elemen: "Aljabar dan Fungsi",
    subElemen: "Persamaan dan Fungsi Kuadrat",
    kompetensi: "Menyelesaikan masalah kontekstual yang berkaitan dengan nilai optimum fungsi kuadrat.",
    batasan: "Fungsi kuadrat dalam bentuk standar f(x) = ax^2 + bx + c dengan nilai diskriminan D >= 0, tidak melibatkan akar bilangan imajiner.",
  },
  {
    mapel: "MATEMATIKA",
    elemen: "Geometri dan Pengukuran",
    subElemen: "Trigonometri Sudut Istimewa",
    kompetensi: "Menerapkan perbandingan trigonometri sudut elevasi dan depresi dalam pengukuran jarak/ketinggian objek nyata.",
    batasan: "Sudut istimewa (30, 45, 60 derajat), tidak melibatkan identitas invers tingkat lanjut.",
  },
  {
    mapel: "PPLG",
    elemen: "Pemrograman Perangkat Lunak",
    subElemen: "Pemrograman Berorientasi Objek (OOP)",
    kompetensi: "Menganalisis konsep enkapsulasi, pewarisan (inheritance), dan polimorfisme dalam perancangan kelas aplikasi.",
    batasan: "Bahasa pemrograman modern (Java / TypeScript / Python), maksimal kedalaman 3 hierarki inheritance.",
  },
  {
    mapel: "AIJ",
    elemen: "Infrastruktur Jaringan",
    subElemen: "Virtual LAN (VLAN) & Inter-VLAN Routing",
    kompetensi: "Merancang konfigurasi trunking 802.1Q dan Router-on-a-Stick untuk segmentasi lalu lintas jaringan lokal.",
    batasan: "Topologi jaringan dengan maksimal 3 switch dan 1 router.",
  },
  {
    mapel: "BAHASA_INDONESIA",
    elemen: "Membaca dan Memirsa",
    subElemen: "Teks Laporan Hasil Observasi & Eksplanasi",
    kompetensi: "Mengevaluasi gagasan pokok, kalimat fakta vs opini, dan konjungsi kausalitas dalam teks artikel ilmiah populer.",
    batasan: "Teks panjang 150-250 kata berkonteks sains atau teknologi terkini.",
  },
];

export default function GeneratorSoalPage() {
  const [mapel, setMapel] = useState("MATEMATIKA");
  const [elemen, setElemen] = useState(PUSMENDIK_PRESETS[0].elemen);
  const [subElemen, setSubElemen] = useState(PUSMENDIK_PRESETS[0].subElemen);
  const [kompetensi, setKompetensi] = useState(PUSMENDIK_PRESETS[0].kompetensi);
  const [batasan, setBatasan] = useState(PUSMENDIK_PRESETS[0].batasan);
  const [tipeSoal, setTipeSoal] = useState<"PILIHAN_GANDA" | "MCMA" | "PGK_KATEGORI">("PILIHAN_GANDA");
  const [jumlahSoal, setJumlahSoal] = useState(3);

  const [isLoading, setIsLoading] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleApplyPreset = (idx: number) => {
    const p = PUSMENDIK_PRESETS[idx];
    setMapel(p.mapel);
    setElemen(p.elemen);
    setSubElemen(p.subElemen);
    setKompetensi(p.kompetensi);
    setBatasan(p.batasan);
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
        }),
      });

      const data = await res.json();
      if (data.success) {
        setGeneratedResults(data.soal);
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
            <span>AI Soal Generator</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Generator Soal AI Berbasis Matriks Asesmen
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Menghasilkan butir soal latihan baru merujuk pada standar kerangka asesmen TKA Pusmendik Kemendikdasmen. Soal hasil generate akan masuk ke antrean validasi guru mata pelajaran.
          </p>
        </div>

        <Link
          href="/admin/validasi-soal"
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-2 w-fit"
        >
          <span>Ke Menu Validasi Soal</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Preset Quick Select */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between text-xs">
          <span className="font-extrabold text-slate-800 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Preset Cepat Matriks Pusmendik (1-Klik Isi)</span>
          </span>
          <span className="text-slate-400 font-medium">Opsional</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {PUSMENDIK_PRESETS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(idx)}
              className="px-3 py-2 rounded-xl bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 text-xs text-slate-700 font-semibold transition-all cursor-pointer text-left"
            >
              <strong className="text-blue-700 block">{p.mapel}</strong>
              <span className="text-[11px] text-slate-500">{p.elemen}</span>
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
              <label className="text-xs font-bold text-slate-700">Mata Pelajaran</label>
              <select
                value={mapel}
                onChange={(e) => setMapel(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
              >
                <option value="MATEMATIKA">Matematika</option>
                <option value="BAHASA_INDONESIA">Bahasa Indonesia</option>
                <option value="BAHASA_INGGRIS">Bahasa Inggris</option>
                <option value="PPLG">Kejuruan PPLG</option>
                <option value="AIJ">Kejuruan AIJ</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Bentuk Soal</label>
              <select
                value={tipeSoal}
                onChange={(e) => setTipeSoal(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
              >
                <option value="PILIHAN_GANDA">Pilihan Ganda (Single Choice A–E)</option>
                <option value="MCMA">MCMA (Pilihan Ganda Kompleks Multi-Jawaban)</option>
                <option value="PGK_KATEGORI">PGK Kategori (Matriks Benar/Salah)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Jumlah Butir Soal</label>
              <select
                value={jumlahSoal}
                onChange={(e) => setJumlahSoal(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
              >
                <option value={1}>1 Butir Soal</option>
                <option value={3}>3 Butir Soal</option>
                <option value={5}>5 Butir Soal</option>
                <option value={10}>10 Butir Soal</option>
              </select>
            </div>
          </div>

          {/* 4 Pusmendik Parameters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                1. Elemen / Materi Pokok
              </label>
              <input
                type="text"
                value={elemen}
                onChange={(e) => setElemen(e.target.value)}
                placeholder="Contoh: Aljabar dan Fungsi..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 block">
                2. Sub-Elemen / Sub-Materi
              </label>
              <input
                type="text"
                value={subElemen}
                onChange={(e) => setSubElemen(e.target.value)}
                placeholder="Contoh: Persamaan dan Fungsi Kuadrat..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block">
                3. Kompetensi / Indikator Asesmen
              </label>
              <textarea
                rows={2}
                value={kompetensi}
                onChange={(e) => setKompetensi(e.target.value)}
                placeholder="Contoh: Menyelesaikan masalah kontekstual yang berkaitan dengan nilai optimum fungsi kuadrat..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-bold text-slate-700 block">
                4. Batasan Konteks & Ruang Lingkup Materi
              </label>
              <textarea
                rows={2}
                value={batasan}
                onChange={(e) => setBatasan(e.target.value)}
                placeholder="Contoh: Nilai diskriminan D >= 0, tidak melibatkan bilangan imajiner..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
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
          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
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
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Hasil Generate ({generatedResults.length} Butir Soal Baru)</span>
            </h3>
            <span className="text-xs text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full font-bold border border-amber-200">
              Status: Menunggu Validasi Guru
            </span>
          </div>

          <div className="space-y-4">
            {generatedResults.map((q, idx) => (
              <div key={q.id || idx} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="font-extrabold text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                    Butir #{idx + 1} • {q.tipeSoal}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Mapel: {q.mapel}</span>
                </div>

                {/* Question */}
                <div className="text-xs text-slate-800 leading-relaxed font-medium">
                  <MathRenderer content={q.pertanyaan} />
                </div>

                {/* Explanation */}
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
                  <span className="font-bold text-emerald-900 block">Kunci Jawaban & Pembahasan AI:</span>
                  <div className="text-slate-700">
                    <MathRenderer content={q.pembahasan} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}