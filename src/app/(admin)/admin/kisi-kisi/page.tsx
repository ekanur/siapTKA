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
  FolderTree,
} from "lucide-react";
import { MAPEL_WAJIB, MAPEL_PILIHAN_GROUPS, getAllSubjectsList, getSubjectDisplayName } from "@/lib/constants/subjects";

export default function KisiKisiPage() {
  const [kisiKisiList, setKisiKisiList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFilterMapel, setSelectedFilterMapel] = useState("ALL");

  // Form states
  const [mapel, setMapel] = useState("PPLG");
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
      const url = selectedFilterMapel !== "ALL" ? `/api/admin/kisi-kisi?mapel=${selectedFilterMapel}` : `/api/admin/kisi-kisi`;
      const res = await fetch(url);
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
  }, [selectedFilterMapel]);

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

  const allSubjects = getAllSubjectsList();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold mb-1">
            <BookMarked className="w-3.5 h-3.5 text-blue-600" />
            <span>Basis Data Kurikulum Resmi 5-Pilar TKA</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            5 Pilar Kisi-Kisi TKA Kemendikbud
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pusat acuan kurikulum resmi (Definisi, Muatan, Kompetensi, Matriks Asesmen, Contoh Soal) yang menjadi basis prompting deterministik Gemini AI.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah 5-Pilar Kisi-Kisi Baru</span>
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

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <span className="text-xs font-bold text-slate-500 px-2 flex items-center gap-1.5">
          <FolderTree className="w-3.5 h-3.5" /> Filter Mapel:
        </span>
        <select
          value={selectedFilterMapel}
          onChange={(e) => setSelectedFilterMapel(e.target.value)}
          className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
        >
          <option value="ALL">Semua Mapel</option>
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
                <div>
                  <span className="text-xs font-extrabold text-slate-900 block">{item.topik}</span>
                  <span className="text-[10px] text-blue-600 font-bold uppercase">{getSubjectDisplayName(item.mapel)}</span>
                </div>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                {item._count?.soalList || 0} Soal Aktif
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-blue-900 block mb-0.5">1. Definisi:</span>
                <p className="text-slate-600 leading-relaxed">{item.definisi}</p>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-blue-900 block mb-0.5">2. Muatan Materi Pokok:</span>
                <div className="text-slate-600 whitespace-pre-line leading-relaxed">{item.muatan}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-blue-900 block mb-0.5">3. Kompetensi:</span>
                <div className="text-slate-600 whitespace-pre-line leading-relaxed">{item.kompetensi}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-blue-900 block mb-0.5">4. Matriks Asesmen:</span>
                <div className="text-slate-600 whitespace-pre-line leading-relaxed">{item.matriksAsesmen}</div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <span className="font-bold text-blue-900 block mb-0.5">5. Contoh Soal Acuan:</span>
                <div className="text-slate-600 italic whitespace-pre-line leading-relaxed">{item.contohSoal}</div>
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
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
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
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nama Topik / Elemen Capaian</label>
                  <input
                    type="text"
                    required
                    placeholder="mis: Pemrograman Berorientasi Objek"
                    value={topik}
                    onChange={(e) => setTopik(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">1. Definisi</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Penjelasan ruang lingkup asesmen mapel..."
                  value={definisi}
                  onChange={(e) => setDefinisi(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">2. Muatan Materi Pokok</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Elemen-elemen materi esensial..."
                  value={muatan}
                  onChange={(e) => setMuatan(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">3. Kompetensi & Level Kognitif</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Kemampuan yang diukur & level kognitif (Knowing, Applying, Reasoning)..."
                  value={kompetensi}
                  onChange={(e) => setKompetensi(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">4. Matriks Asesmen</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Sub elemen dan batasan kompetensi..."
                  value={matriksAsesmen}
                  onChange={(e) => setMatriksAsesmen(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">5. Contoh Soal Acuan Resmi</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Sampel soal acuan format dan gaya bahasa..."
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
                  {isSubmitting ? "Menyimpan..." : "Simpan Kisi-Kisi 5-Pilar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}