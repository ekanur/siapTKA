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
} from "lucide-react";
import MathRenderer from "@/components/math/MathRenderer";

export default function GeneratorSoalPage() {
  const [mapel, setMapel] = useState("MATEMATIKA");
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
      setErrorMsg("Pilih salah satu kisi-kisi resmi terlebih dahulu.");
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
            Generate variasi butir soal latihan otomatis berbasis AI (Gemini) menggunakan 5 Pilar kurikulum resmi TKA.
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
            <h2 className="font-extrabold text-slate-900 text-sm">Parameter Pembuatan Soal</h2>

            {/* 1. Mapel Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Mata Pelajaran TKA
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMapel("MATEMATIKA")}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
                    mapel === "MATEMATIKA"
                      ? "border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-500"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
                  }`}
                >
                  <Calculator className="w-4 h-4" />
                  <span>Matematika</span>
                </button>
                <button
                  type="button"
                  onClick={() => setMapel("PPLG")}
                  className={`p-3 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
                    mapel === "PPLG"
                      ? "border-teal-600 bg-teal-50 text-teal-900 ring-1 ring-teal-500"
                      : "border-slate-200 bg-slate-50 text-slate-600 hover:bg-white"
                  }`}
                >
                  <Code2 className="w-4 h-4" />
                  <span>PPLG</span>
                </button>
              </div>
            </div>

            {/* 2. Topik Kisi-Kisi */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Topik Acuan 5-Pilar Kisi-Kisi Resmi
              </label>
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
            </div>

            {/* 3. Tipe Soal */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Format Bentuk Soal Resmi TKA
              </label>
              <div className="space-y-2">
                {[
                  { id: "PILIHAN_GANDA", label: "Pilihan Ganda (Single A-E)", desc: "1 jawaban benar" },
                  { id: "MCMA", label: "MCMA (Multiple Choice Multiple Answer)", desc: "Lebih dari 1 jawaban benar" },
                  { id: "PGK_KATEGORI", label: "PGK Kategori (Matriks Benar/Salah)", desc: "Tabel pernyataan kategori" },
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
                <option value={1}>1 Soal (Pratinjau Cepat)</option>
                <option value={3}>3 Soal (Rekomendasi Standar)</option>
                <option value={5}>5 Soal</option>
              </select>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
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
          {selectedKisiKisi && (
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase tracking-wider">
                <BookMarked className="w-4 h-4 text-blue-600" />
                <span>5 Pilar Acuan Resmi Web TKA Kemendikbud</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-blue-900 block mb-0.5">1. Definisi:</span>
                  <p className="text-slate-700">{selectedKisiKisi.definisi}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-blue-900 block mb-0.5">2. Muatan Materi Pokok:</span>
                  <p className="text-slate-700">{selectedKisiKisi.muatan}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-blue-900 block mb-0.5">3. Kompetensi yang Diukur:</span>
                  <p className="text-slate-700">{selectedKisiKisi.kompetensi}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-blue-900 block mb-0.5">4. Matriks Asesmen & Level:</span>
                  <p className="text-slate-700">{selectedKisiKisi.matriksAsesmen}</p>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="font-bold text-blue-900 block mb-0.5">5. Contoh Soal Acuan:</span>
                  <p className="text-slate-700 italic">{selectedKisiKisi.contohSoal}</p>
                </div>
              </div>
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