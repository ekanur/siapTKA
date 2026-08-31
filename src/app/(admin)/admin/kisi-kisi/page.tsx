"use client";

import React, { useState, useEffect } from "react";
import {
  BookMarked,
  Plus,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  X,
  Calculator,
  Code2,
} from "lucide-react";

export default function KisiKisiPage() {
  const [kisiKisiList, setKisiKisiList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [mapel, setMapel] = useState("MATEMATIKA");
  const [topik, setTopik] = useState("");
  const [definisi, setDefinisi] = useState("");
  const [muatan, setMuatan] = useState("");
  const [kompetensi, setKompetensi] = useState("");
  const [matriksAsesmen, setMatriksAsesmen] = useState("");
  const [contohSoal, setContohSoal] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const loadKisiKisi = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/kisi-kisi");
      const data = await res.json();
      if (data.success) {
        setKisiKisiList(data.kisiKisi);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadKisiKisi();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/admin/kisi-kisi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mapel,
          topik,
          definisi,
          muatan,
          kompetensi,
          matriksAsesmen,
          contohSoal,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg("Kisi-kisi 5 pilar resmi berhasil ditambahkan.");
        setIsModalOpen(false);
        // Reset form
        setTopik("");
        setDefinisi("");
        setMuatan("");
        setKompetensi("");
        setMatriksAsesmen("");
        setContohSoal("");
        loadKisiKisi();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold mb-1">
            <BookMarked className="w-3.5 h-3.5 text-blue-600" />
            <span>Basis Data Kurikulum Resmi TKA</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            5 Pilar Kisi-Kisi TKA Kemendikbud
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Data acuan terstruktur: Definisi, Muatan, Kompetensi, Matriks Asesmen, dan Contoh Soal sebagai basis kecerdasan Gemini AI.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kisi-Kisi 5 Pilar</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg("")} className="font-bold">
            Tutup
          </button>
        </div>
      )}

      {/* Grid of Kisi-Kisi Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {kisiKisiList.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 hover:border-blue-400 transition-all"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                {item.mapel === "MATEMATIKA" ? (
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Calculator className="w-4 h-4" />
                  </div>
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center">
                    <Code2 className="w-4 h-4" />
                  </div>
                )}
                <span className="text-xs font-extrabold text-slate-900">{item.topik}</span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                {item._count?.soalList || 0} Soal Dibuat
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-blue-900 block mb-0.5">1. Definisi:</span>
                <p className="text-slate-600 leading-relaxed">{item.definisi}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-blue-900 block mb-0.5">2. Muatan:</span>
                <p className="text-slate-600 leading-relaxed">{item.muatan}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-blue-900 block mb-0.5">3. Kompetensi:</span>
                <p className="text-slate-600 leading-relaxed">{item.kompetensi}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-blue-900 block mb-0.5">4. Matriks Asesmen:</span>
                <p className="text-slate-600 leading-relaxed">{item.matriksAsesmen}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-blue-900 block mb-0.5">5. Contoh Soal:</span>
                <p className="text-slate-600 italic leading-relaxed">{item.contohSoal}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-extrabold text-slate-900 text-base">
                Tambah 5 Pilar Kisi-Kisi Resmi TKA
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Mata Pelajaran</label>
                  <select
                    value={mapel}
                    onChange={(e) => setMapel(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                    <option value="MATEMATIKA">Matematika</option>
                    <option value="PPLG">PPLG (Kejuruan)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Topik / Materi</label>
                  <input
                    type="text"
                    required
                    placeholder="mis: Statistika & Peluang"
                    value={topik}
                    onChange={(e) => setTopik(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                  >
                  </input>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">1. Definisi</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Ruang lingkup materi..."
                  value={definisi}
                  onChange={(e) => setDefinisi(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">2. Muatan</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Materi pokok..."
                  value={muatan}
                  onChange={(e) => setMuatan(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">3. Kompetensi</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Keterampilan yang diuji..."
                  value={kompetensi}
                  onChange={(e) => setKompetensi(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">4. Matriks Asesmen & Level</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Indikator dan level kognitif L1/L2/L3..."
                  value={matriksAsesmen}
                  onChange={(e) => setMatriksAsesmen(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">5. Contoh Soal Acuan</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Contoh soal resmi acuan bahasa..."
                  value={contohSoal}
                  onChange={(e) => setContohSoal(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md"
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Kisi-Kisi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}