"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  BookMarked,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Calculator,
  Code2,
  Layers,
  Wand2,
  Settings2,
} from "lucide-react";
import MathRenderer from "@/components/math/MathRenderer";
import { MAPEL_WAJIB, MAPEL_PILIHAN_GROUPS } from "@/lib/constants/subjects";

export default function GeneratorSoalPage() {
  const [mapel, setMapel] = useState("PPLG");
  const [kisiKisiList, setKisiKisiList] = useState<any[]>([]);
  const [selectedKisiKisiId, setSelectedKisiKisiId] = useState("");
  const [tipeSoal, setTipeSoal] = useState<"PILIHAN_GANDA" | "MCMA" | "PGK_KATEGORI">("PILIHAN_GANDA");
  const [jumlahSoal, setJumlahSoal] = useState(3);

  const [isLoading, setIsLoading] = useState(false);
  const [generatedResults, setGeneratedResults] = useState<any[]>([]);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const loadKisiKisi = async () => {
    try {
      const res = await fetch(`/api/admin/kisi-kisi?mapel=${mapel}`);
      const data = await res.json();
      if (data.success) {
        setKisiKisiList(data.kisiKisi);
        if (data.kisiKisi.length > 0) {
          setSelectedKisiKisiId(data.kisiKisi[0].id);
        } else {
          setSelectedKisiKisiId("");
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadKisiKisi();
  }, [mapel]);

  const selectedKisiKisi = kisiKisiList.find((k) => k.id === selectedKisiKisiId);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedKisiKisiId) {
      setErrorMsg("Pilih salah satu kisi-kisi 5 pilar resmi terlebih dahulu (atau buat di menu Kisi-Kisi jika belum ada).");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");
    setGeneratedResults([]);

    try {
      const res = await fetch("/api/admin/generate-soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kisiKisiId: selectedKisiKisiId,
          mapel,
          tipeSoal,
          jumlahSoal,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal generate soal");
      }

      setGeneratedResults(data.soal);
      setSuccessMsg(data.message);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat memanggil Gemini AI");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold mb-1">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>AI Bank Generator • Standar Kisi-Kisi Kemendikbud</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Generator Soal AI (5 Pilar Kisi-Kisi)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate variasi butir soal latihan otomatis berbasis AI (Gemini) menggunakan 5 Pilar kurikulum resmi TKA (Definisi, Muatan, Kompetensi, Matriks Asesmen, dan Contoh Soal).
          </p>
        </div>

        <Link
          href="/admin/validasi-soal"
          className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
        >
          <span>Buka Antrean Validasi Guru</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-3">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold">{successMsg}</span>
          </div>
          <Link
            href="/admin/validasi-soal"
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Tinjau di Validasi
          </Link>
        </div>
      )}

      {/* Main Form & 5-Pillar Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Parameters (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          <form onSubmit={handleGenerate} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-extrabold text-slate-900 text-sm">Parameter Pembuatan Soal</h2>
              <span className="text-[11px] text-blue-600 font-bold">5-Pilar AI Engine</span>
            </div>

            {/* 1. Mapel Selection from School Spectrum */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mata Pelajaran TKA (Sesuai Spektrum Kejuruan Sekolah)
              </label>
              <select
                value={mapel}
                onChange={(e) => setMapel(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <optgroup label="⭐ Mapel Wajib TKA">
                  <option value="MATEMATIKA">Matematika (Wajib)</option>
                  <option value="BAHASA_INDONESIA">Bahasa Indonesia (Wajib)</option>
                  <option value="BAHASA_INGGRIS">Bahasa Inggris (Wajib)</option>
                </optgroup>
                <optgroup label="💻 Rumpun TIK (Kejuruan)">
                  <option value="PPLG">PPLG (Pengembangan Perangkat Lunak & Gim)</option>
                  <option value="TKJ">TKJ (Teknik Jaringan Komputer)</option>
                  <option value="SIJA">SIJA (Sistem Informatika Jaringan & Aplikasi)</option>
                  <option value="DKV">DKV (Desain Komunikasi Visual)</option>
                </optgroup>
                <optgroup label="🏭 Khusus SMK & Kejuruan Lain">
                  <option value="PKK">Produk Kreatif & Kewirausahaan (PKK)</option>
                  <option value="B_INGGRIS_LANJUT">Bahasa Inggris Tingkat Lanjut</option>
                  <option value="MTK_LANJUT">Matematika Tingkat Lanjut</option>
                </optgroup>
              </select>
            </div>

            {/* 2. Topik Kisi-Kisi */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Topik Acuan 5-Pilar Kisi-Kisi
                </label>
                <Link href="/admin/kisi-kisi" className="text-[11px] text-blue-600 font-bold hover:underline">
                  + Kelola Kisi-Kisi
                </Link>
              </div>

              {kisiKisiList.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900">
                  Belum ada kisi-kisi 5 pilar untuk mapel ini. Silakan tambahkan di menu <strong>5 Pilar Kisi-Kisi</strong>.
                </div>
              ) : (
                <select
                  value={selectedKisiKisiId}
                  onChange={(e) => setSelectedKisiKisiId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {kisiKisiList.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.topik}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* 3. Tipe Soal */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Format Bentuk Soal Resmi TKA
              </label>
              <div className="space-y-2">
                {[
                  { id: "PILIHAN_GANDA", label: "Pilihan Ganda (Single A-E)", desc: "1 pilihan paling tepat (A–E)" },
                  { id: "MCMA", label: "MCMA (Multiple Choice Multiple Answer)", desc: "Pilih lebih dari 1 jawaban yang benar" },
                  { id: "PGK_KATEGORI", label: "PGK Kategori (Matriks Benar/Salah)", desc: "Tabel pernyataan kategori (Benar/Salah)" },
                ].map((t) => (
                  <label
                    key={t.id}
                    onClick={() => setTipeSoal(t.id as any)}
                    className={`p-3 rounded-xl border flex items-start gap-3 cursor-pointer transition-all ${
                      tipeSoal === t.id
                        ? "border-blue-600 bg-blue-50/70 text-blue-950 font-bold"
                        : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="tipeSoal"
                      checked={tipeSoal === t.id}
                      onChange={() => {}}
                      className="mt-0.5 text-blue-600 focus:ring-blue-500"
                    />
                    <div>
                      <div className="text-xs">{t.label}</div>
                      <div className="text-[10px] text-slate-500 font-normal">{t.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* 4. Jumlah Soal */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Jumlah Soal Dihasilkan (Batch)
              </label>
              <select
                value={jumlahSoal}
                onChange={(e) => setJumlahSoal(Number(e.target.value))}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>1 Soal (Uji Coba Cepat)</option>
                <option value={3}>3 Soal (Rekomendasi Standar)</option>
                <option value={5}>5 Soal</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !selectedKisiKisiId}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4" />
              <span>{isLoading ? "Gemini AI Sedang Men-generate..." : "Generate Soal dengan Gemini AI"}</span>
            </button>
          </form>
        </div>

        {/* Right Area: 5-Pillar Inspector & Generated Previews (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* 5-Pillar Inspector Card */}
          {selectedKisiKisi ? (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <BookMarked className="w-4 h-4 text-blue-600" />
                <span>5 Pilar Acuan Resmi Web TKA: {selectedKisiKisi.topik}</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-blue-900 block mb-0.5">1. Definisi:</span>
                  <p className="text-slate-700 leading-relaxed">{selectedKisiKisi.definisi}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-blue-900 block mb-0.5">2. Muatan Materi Pokok (Fase E & F):</span>
                  <div className="text-slate-700 whitespace-pre-line leading-relaxed">{selectedKisiKisi.muatan}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-blue-900 block mb-0.5">3. Kompetensi & Level Kognitif:</span>
                  <div className="text-slate-700 whitespace-pre-line leading-relaxed">{selectedKisiKisi.kompetensi}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-blue-900 block mb-0.5">4. Matriks Asesmen:</span>
                  <div className="text-slate-700 whitespace-pre-line leading-relaxed">{selectedKisiKisi.matriksAsesmen}</div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-blue-900 block mb-0.5">5. Contoh Soal Acuan Resmi:</span>
                  <div className="text-slate-700 italic whitespace-pre-line leading-relaxed">{selectedKisiKisi.contohSoal}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-xs text-slate-500 space-y-2">
              <BookMarked className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-700">Pilih mata pelajaran untuk melihat 5 pilar kisi-kisi acuan AI.</p>
            </div>
          )}

          {/* Generated Instant Previews */}
          {generatedResults.length > 0 && (
            <div className="bg-white rounded-3xl border border-emerald-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Hasil Generate Terbaru ({generatedResults.length} Soal)</span>
                </div>
                <span className="text-[11px] font-bold px-2 py-0.5 bg-amber-100 text-amber-800 rounded">
                  Status: Menunggu Validasi Guru
                </span>
              </div>

              <div className="space-y-4">
                {generatedResults.map((item, idx) => (
                  <div key={item.id || idx} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold">
                      <span>Soal AI #{idx + 1}</span>
                      <span className="text-blue-600 uppercase">{item.tipeSoal}</span>
                    </div>
                    <div className="text-slate-900 font-medium">
                      <MathRenderer content={item.pertanyaan} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}