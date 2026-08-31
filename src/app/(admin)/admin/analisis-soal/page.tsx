"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Filter,
  RefreshCw,
  TrendingDown,
  Layers,
} from "lucide-react";
import MathRenderer from "@/components/math/MathRenderer";

interface AnalyzedQuestion {
  id: string;
  mapel: string;
  topik: string;
  tipeSoal: string;
  pertanyaan: string;
  kunciJawaban: string;
  pembahasan: string;
  totalAttempts: number;
  correctAttempts: number;
  wrongAttempts: number;
  accuracyPercent: number;
  errorPercent: number;
  difficulty: "MUDAH" | "SEDANG" | "SULIT" | "BELUM_DIKERJAKAN";
  distractorMap: { [key: string]: number };
  avgDurationSec: number;
}

export default function AnalisisSoalPage() {
  const [items, setItems] = useState<AnalyzedQuestion[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMapel, setSelectedMapel] = useState<string>("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [expandedDistractorId, setExpandedDistractorId] = useState<string | null>(null);

  const fetchAnalysis = async () => {
    setLoading(true);
    try {
      const url = selectedMapel !== "ALL" ? `/api/admin/analisis?mapel=${selectedMapel}` : `/api/admin/analisis`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setItems(data.items);
        setSummary(data.summary);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalysis();
  }, [selectedMapel]);

  const filteredItems = items.filter((item) => {
    if (selectedDifficulty !== "ALL" && item.difficulty !== selectedDifficulty) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-full text-xs font-bold mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Diagnostik Akurasi & Tingkat Kesukaran</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Analisis Butir Soal (% Benar & % Salah)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Evaluasi otomatis hasil latihan offline seluruh siswa untuk mengidentifikasi butir soal dan topik yang masih sulit dipahami.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnalysis}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan Data</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-2">
            <span className="text-xs font-bold text-slate-500">Soal Dianalisis</span>
            <div className="text-2xl font-black text-slate-900">{summary.totalQuestionsAnalyzed}</div>
            <div className="text-[11px] text-slate-500">
              Total pengerjaan: <strong>{summary.totalAllAttempts}</strong> kali
            </div>
          </div>

          <div className="bg-rose-50/70 rounded-2xl p-5 border border-rose-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-800">Kategori SULIT (&lt;40%)</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-900">{summary.difficultQuestionsCount} Butir</div>
            <div className="text-[11px] text-rose-700 font-medium">Perlu remedial / pendampingan guru</div>
          </div>

          <div className="bg-amber-50/70 rounded-2xl p-5 border border-amber-200 shadow-sm space-y-2">
            <span className="text-xs font-bold text-amber-800">Kategori SEDANG (40-70%)</span>
            <div className="text-2xl font-black text-amber-900">{summary.moderateQuestionsCount} Butir</div>
            <div className="text-[11px] text-amber-700 font-medium">Pemahaman siswa cukup memadai</div>
          </div>

          <div className="bg-emerald-50/70 rounded-2xl p-5 border border-emerald-200 shadow-sm space-y-2">
            <span className="text-xs font-bold text-emerald-800">Kategori MUDAH (&gt;70%)</span>
            <div className="text-2xl font-black text-emerald-900">{summary.easyQuestionsCount} Butir</div>
            <div className="text-[11px] text-emerald-700 font-medium">Materi sudah dikuasai mayoritas</div>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter Mapel:
          </span>
          {["ALL", "MATEMATIKA", "PPLG"].map((m) => (
            <button
              key={m}
              onClick={() => setSelectedMapel(m)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedMapel === m
                  ? "bg-blue-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {m === "ALL" ? "Semua Mapel" : m}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-slate-500 mr-1">Kesukaran:</span>
          {[
            { id: "ALL", label: "Semua" },
            { id: "SULIT", label: "🔴 Sulit" },
            { id: "SEDANG", label: "🟡 Sedang" },
            { id: "MUDAH", label: "🟢 Mudah" },
          ].map((d) => (
            <button
              key={d.id}
              onClick={() => setSelectedDifficulty(d.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedDifficulty === d.id
                  ? "bg-slate-900 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Item Analysis Table / Cards */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-extrabold text-slate-900 text-sm">
            Rincian Diagnostik Butir Soal ({filteredItems.length} Butir)
          </h2>
          <span className="text-xs text-slate-500">
            Diurutkan berdasarkan pengerjaan terbaru
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredItems.map((item, idx) => {
            const isExpanded = expandedDistractorId === item.id;

            return (
              <div key={item.id} className="p-6 hover:bg-slate-50/50 transition-colors space-y-4">
                {/* Meta & Tags */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-md">
                      {item.mapel}
                    </span>
                    <span className="text-xs font-semibold text-slate-600">
                      Topik: {item.topik}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.difficulty === "SULIT" && (
                      <span className="px-3 py-1 bg-rose-100 text-rose-800 font-extrabold text-xs rounded-full flex items-center gap-1.5 border border-rose-200">
                        <TrendingDown className="w-3.5 h-3.5" />
                        <span>Sulit (Remedial)</span>
                      </span>
                    )}
                    {item.difficulty === "SEDANG" && (
                      <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full border border-amber-200">
                        Sedang
                      </span>
                    )}
                    {item.difficulty === "MUDAH" && (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200">
                        Mudah
                      </span>
                    )}
                    {item.difficulty === "BELUM_DIKERJAKAN" && (
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 font-medium text-xs rounded-full">
                        Belum Dikerjakan Siswa
                      </span>
                    )}
                  </div>
                </div>

                {/* Question snippet */}
                <div className="p-4 bg-slate-50/70 rounded-2xl border border-slate-200/70 text-slate-900 text-sm">
                  <MathRenderer content={item.pertanyaan} />
                </div>

                {/* Accuracy / Error Progress Bar */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                  <div className="md:col-span-8 space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Benar: {item.accuracyPercent}% ({item.correctAttempts} siswa)
                      </span>
                      <span className="text-rose-700 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Salah: {item.errorPercent}% ({item.wrongAttempts} siswa)
                      </span>
                    </div>

                    {/* Visual bar */}
                    <div className="h-3 w-full bg-rose-200 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${item.accuracyPercent}%` }}
                        className="h-full bg-emerald-500 transition-all duration-500"
                      />
                    </div>
                  </div>

                  <div className="md:col-span-4 flex items-center justify-end gap-2">
                    <button
                      onClick={() =>
                        setExpandedDistractorId(isExpanded ? null : item.id)
                      }
                      className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
                    >
                      {isExpanded ? "Tutup Analisis Pengecoh" : "Cek Pilihan Pengecoh"}
                    </button>

                    {item.difficulty === "SULIT" && (
                      <Link
                        href={`/admin/generator-soal?topic=${encodeURIComponent(item.topik)}&mapel=${item.mapel}`}
                        className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                        <span>AI Remedial</span>
                      </Link>
                    )}
                  </div>
                </div>

                {/* Distractor Breakdown Section (Accordion) */}
                {isExpanded && (
                  <div className="p-4 bg-slate-100/70 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                      <span>Distribusi Pilihan Siswa (Distractor Analysis)</span>
                      <span>Rata-Rata Waktu: {item.avgDurationSec} detik</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {Object.entries(item.distractorMap).map(([choice, count]) => {
                        const isCorrectKey = choice === item.kunciJawaban;

                        return (
                          <div
                            key={choice}
                            className={`p-3 rounded-xl border text-xs ${
                              isCorrectKey
                                ? "bg-emerald-50 border-emerald-200 text-emerald-950 font-bold"
                                : "bg-white border-slate-200 text-slate-800"
                            }`}
                          >
                            <div className="text-[10px] text-slate-400 uppercase font-mono truncate">
                              {isCorrectKey ? "Kunci Jawaban" : "Pilihan Terpilih"}
                            </div>
                            <div className="text-sm font-black truncate">{choice}</div>
                            <div className="text-[11px] text-slate-500 mt-1">
                              Dipilih oleh <strong>{count}</strong> siswa
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}