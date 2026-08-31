"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Edit3,
  Trash2,
  AlertCircle,
  Filter,
  Check,
  X,
  Sparkles,
} from "lucide-react";
import MathRenderer from "@/components/math/MathRenderer";

export default function ValidasiSoalPage() {
  const [soalList, setSoalList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"MENUNGGU_VALIDASI" | "AKTIF" | "DITOLAK">("MENUNGGU_VALIDASI");
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  const loadSoal = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/soal?status=${activeTab}`);
      const data = await res.json();
      if (data.success) {
        setSoalList(data.soal);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSoal();
  }, [activeTab]);

  const handleUpdateStatus = async (id: string, newStatus: "AKTIF" | "DITOLAK") => {
    try {
      const res = await fetch("/api/admin/soal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(data.message);
        loadSoal();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus soal ini?")) return;
    try {
      const res = await fetch(`/api/admin/soal?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setStatusMsg("Soal berhasil dihapus.");
        loadSoal();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    try {
      const res = await fetch("/api/admin/soal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem.id,
          pertanyaan: editingItem.pertanyaan,
          kunciJawaban: editingItem.kunciJawaban,
          pembahasan: editingItem.pembahasan,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingItem(null);
        setStatusMsg("Perubahan soal berhasil disimpan.");
        loadSoal();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-bold mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Human-in-the-loop Validation</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Validasi & Manajemen Bank Soal AI
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Guru bertindak sebagai validator konten untuk meninjau, mengedit, menyetujui, atau menolak soal hasil generate AI sebelum tayang ke siswa.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg("")} className="text-blue-500 font-bold">
            Tutup
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm max-w-md">
        <button
          onClick={() => setActiveTab("MENUNGGU_VALIDASI")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "MENUNGGU_VALIDASI"
              ? "bg-amber-500 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Menunggu Validasi
        </button>
        <button
          onClick={() => setActiveTab("AKTIF")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "AKTIF"
              ? "bg-emerald-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Bank Soal Aktif
        </button>
        <button
          onClick={() => setActiveTab("DITOLAK")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "DITOLAK"
              ? "bg-rose-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          Ditolak
        </button>
      </div>

      {/* Question Cards List */}
      {loading ? (
        <div className="p-12 text-center text-slate-500 text-xs">Memuat daftar soal...</div>
      ) : soalList.length === 0 ? (
        <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center space-y-2">
          <p className="font-bold text-slate-800 text-sm">Tidak ada soal pada tab ini.</p>
          <p className="text-xs text-slate-500">
            Gunakan menu Generator Soal AI untuk menghasilkan butir soal baru.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {soalList.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4 transition-all hover:border-slate-300"
            >
              {/* Card Meta */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-bold">
                    {item.mapel}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {item.kisiKisi?.topik || "Latihan Mandiri TKA"}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                    Tipe: {item.tipeSoal}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">
                    Source: {item.source}
                  </span>
                </div>
              </div>

              {/* Question Body */}
              <div className="text-slate-900 text-sm font-medium leading-relaxed">
                <MathRenderer content={item.pertanyaan} />
              </div>

              {/* Options Box */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <span className="font-bold text-slate-700 block">Kunci Jawaban:</span>
                <div className="font-mono bg-white p-2.5 rounded-xl border border-slate-200 text-emerald-700 font-bold">
                  {item.kunciJawaban}
                </div>
              </div>

              {/* Explanation Box */}
              {item.pembahasan && (
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 text-xs space-y-1">
                  <span className="font-bold text-emerald-900 block">Pembahasan Guru:</span>
                  <div className="text-slate-700 leading-relaxed">
                    <MathRenderer content={item.pembahasan} />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setEditingItem(item)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Edit Konten</span>
                  </button>

                  <button
                    onClick={() => handleDelete(item.id)}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-500 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  {item.status !== "DITOLAK" && (
                    <button
                      onClick={() => handleUpdateStatus(item.id, "DITOLAK")}
                      className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Tolak Soal</span>
                    </button>
                  )}

                  {item.status !== "AKTIF" && (
                    <button
                      onClick={() => handleUpdateStatus(item.id, "AKTIF")}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Setujui & Terbitkan ke Siswa</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-extrabold text-slate-900 text-base">
                Edit Redaksi Soal & Pembahasan
              </h2>
              <button onClick={() => setEditingItem(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Teks Pertanyaan (Mendukung LaTeX $...$)
                </label>
                <textarea
                  rows={4}
                  value={editingItem.pertanyaan}
                  onChange={(e) => setEditingItem({ ...editingItem, pertanyaan: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Kunci Jawaban
                </label>
                <input
                  type="text"
                  value={editingItem.kunciJawaban}
                  onChange={(e) => setEditingItem({ ...editingItem, kunciJawaban: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Teks Pembahasan
                </label>
                <textarea
                  rows={4}
                  value={editingItem.pembahasan}
                  onChange={(e) => setEditingItem({ ...editingItem, pembahasan: e.target.value })}
                  className="w-full p-3 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}