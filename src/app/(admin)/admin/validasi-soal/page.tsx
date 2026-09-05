"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
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
  PlusCircle,
  GraduationCap,
  Sparkles,
  BookOpen,
} from "lucide-react";
import MathRenderer from "@/components/math/MathRenderer";
import { normalizeOpsiJawaban, normalizeKunciJawaban } from "@/lib/quiz/normalize";
import { MAPEL_WAJIB, MAPEL_PILIHAN_GROUPS } from "@/lib/constants/subjects";

export default function ValidasiSoalPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const userMapel = (session?.user as any)?.mapel;

  const [soalList, setSoalList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"MENUNGGU_VALIDASI" | "AKTIF" | "DITOLAK">("MENUNGGU_VALIDASI");
  const [selectedMapel, setSelectedMapel] = useState(userMapel || "ALL");
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  // Manual input form state
  const [manualMapel, setManualMapel] = useState(userMapel || "MATEMATIKA");
  const [manualTipe, setManualTipe] = useState("PILIHAN_GANDA");
  const [manualPertanyaan, setManualPertanyaan] = useState("");
  const [manualOpsi, setManualOpsi] = useState({
    A: "",
    B: "",
    C: "",
    D: "",
    E: "",
  });
  const [manualKunci, setManualKunci] = useState("A");
  const [manualPembahasan, setManualPembahasan] = useState("");
  const [isSavingManual, setIsSavingManual] = useState(false);

  useEffect(() => {
    if (userRole === "GURU" && userMapel) {
      setSelectedMapel(userMapel);
      setManualMapel(userMapel);
    }
  }, [userRole, userMapel]);

  const loadSoal = async () => {
    setLoading(true);
    try {
      const mapelParam = userRole === "GURU" ? userMapel : selectedMapel;
      const res = await fetch(`/api/admin/soal?status=${activeTab}&mapel=${mapelParam}`);
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
  }, [activeTab, selectedMapel]);

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
    if (!confirm("Apakah Anda yakin ingin menghapus butir soal ini?")) return;
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
          pembahasan: editingItem.pembahasan,
          kunciJawaban: editingItem.kunciJawaban,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg("Revisi soal berhasil disimpan.");
        setEditingItem(null);
        loadSoal();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateManualSoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingManual(true);

    const formattedOpsi = [
      { id: "A", label: manualOpsi.A },
      { id: "B", label: manualOpsi.B },
      { id: "C", label: manualOpsi.C },
      { id: "D", label: manualOpsi.D },
      { id: "E", label: manualOpsi.E },
    ];

    try {
      const res = await fetch("/api/admin/soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mapel: manualMapel,
          tipeSoal: manualTipe,
          pertanyaan: manualPertanyaan,
          opsiJawaban: formattedOpsi,
          kunciJawaban: manualKunci,
          pembahasan: manualPembahasan,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMsg(data.message);
        setIsManualModalOpen(false);
        // Reset
        setManualPertanyaan("");
        setManualOpsi({ A: "", B: "", C: "", D: "", E: "" });
        setManualPembahasan("");
        setActiveTab("AKTIF");
        loadSoal();
      } else {
        alert(data.error || "Gagal menambah soal.");
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan jaringan.");
    } finally {
      setIsSavingManual(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Kurasi & Bank Soal</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Validasi & Input Manual Soal TKA
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {userRole === "GURU"
              ? `Login sebagai Guru Mapel ${userMapel}. Anda berwenang memvalidasi soal hasil generate AI dan menambahkan soal manual untuk mapel Anda.`
              : "Validasi butir soal hasil generate AI dan input soal manual oleh guru mata pelajaran."}
          </p>
        </div>

        <button
          onClick={() => setIsManualModalOpen(true)}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer w-fit"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Input Soal Manual</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl font-bold flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg("")} className="text-blue-500 hover:text-blue-700">
            Tutup
          </button>
        </div>
      )}

      {/* Tabs & Mapel Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("MENUNGGU_VALIDASI")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "MENUNGGU_VALIDASI"
                ? "bg-amber-100 text-amber-900 shadow-xs"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Menunggu Validasi
          </button>
          <button
            onClick={() => setActiveTab("AKTIF")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "AKTIF"
                ? "bg-emerald-100 text-emerald-900 shadow-xs"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Bank Soal Aktif
          </button>
          <button
            onClick={() => setActiveTab("DITOLAK")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "DITOLAK"
                ? "bg-rose-100 text-rose-900 shadow-xs"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Ditolak
          </button>
        </div>

        {/* Mapel Filter (if Admin) or Badge (if Guru) */}
        {userRole === "GURU" ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span>Mapel: {userMapel}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
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
        )}
      </div>

      {/* List of Soal */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
          Memuat daftar soal...
        </div>
      ) : soalList.length === 0 ? (
        <div className="p-12 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200 space-y-2">
          <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="font-semibold">Tidak ada butir soal dalam kategori ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {soalList.map((item, idx) => {
            const parsedOpsi = normalizeOpsiJawaban(item.opsiJawaban);
            const parsedKunci = normalizeKunciJawaban(item.kunciJawaban, item.tipeSoal);

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Meta Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                      #{idx + 1} • {item.mapel}
                    </span>
                    <span className="text-[11px] font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {item.tipeSoal}
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Sumber: {item.source || "MANUAL"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status === "MENUNGGU_VALIDASI" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(item.id, "AKTIF")}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-sm cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Setujui (Terbitkan)</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(item.id, "DITOLAK")}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => setEditingItem(item)}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      title="Edit Soal"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      title="Hapus Soal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Content */}
                <div className="text-xs text-slate-900 leading-relaxed font-medium">
                  <MathRenderer content={item.pertanyaan} />
                </div>

                {/* Options Preview */}
                {Array.isArray(parsedOpsi) && parsedOpsi.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2">
                    {parsedOpsi.map((op: any, oIdx: number) => {
                      const opId = String(op.id || op.kunci || op.key || String.fromCharCode(65 + oIdx)).toUpperCase();
                      const opLabel = String(op.label || op.teks || op.text || op.value || "");
                      const isCorrect = Array.isArray(parsedKunci)
                        ? parsedKunci.includes(opId)
                        : String(parsedKunci).toUpperCase().includes(opId);

                      return (
                        <div
                          key={oIdx}
                          className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                            isCorrect
                              ? "bg-emerald-50/60 border-emerald-300 text-emerald-950 font-semibold"
                              : "bg-slate-50 border-slate-200 text-slate-700"
                          }`}
                        >
                          <span className="font-bold shrink-0">{opId}.</span>
                          <div className="leading-relaxed">
                            <MathRenderer content={opLabel} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Explanation */}
                {item.pembahasan && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                    <span className="font-bold text-slate-800 block text-[11px] uppercase">
                      Kunci Jawaban & Pembahasan:
                    </span>
                    <div className="text-slate-600">
                      <MathRenderer content={item.pembahasan} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Input Manual Soal */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Input Butir Soal Manual</h3>
                <p className="text-xs text-slate-500">Tambahkan soal baru langsung ke Bank Soal Aktif.</p>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateManualSoal} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Mata Pelajaran</label>
                  {userRole === "GURU" ? (
                    <input
                      type="text"
                      disabled
                      value={manualMapel}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-700"
                    />
                  ) : (
                    <select
                      value={manualMapel}
                      onChange={(e) => setManualMapel(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800"
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
                  )}
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Bentuk Soal</label>
                  <select
                    value={manualTipe}
                    onChange={(e) => setManualTipe(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800"
                  >
                    <option value="PILIHAN_GANDA">Pilihan Ganda (A-E)</option>
                    <option value="MCMA">MCMA</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Pertanyaan Soal (Dukungan LaTeX $...$)</label>
                <textarea
                  rows={3}
                  value={manualPertanyaan}
                  onChange={(e) => setManualPertanyaan(e.target.value)}
                  placeholder="Ketikkan teks soal di sini..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800"
                  required
                />
              </div>

              {/* Opsi A - E */}
              <div className="space-y-2">
                <label className="font-bold text-slate-700 block">Opsi Jawaban A–E:</label>
                {(["A", "B", "C", "D", "E"] as const).map((letter) => (
                  <div key={letter} className="flex items-center gap-2">
                    <span className="font-bold text-slate-700 w-5">{letter}.</span>
                    <input
                      type="text"
                      value={(manualOpsi as any)[letter]}
                      onChange={(e) => setManualOpsi({ ...manualOpsi, [letter]: e.target.value })}
                      placeholder={`Pilihan jawaban ${letter}...`}
                      className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-slate-800"
                      required
                    />
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Kunci Jawaban Benar</label>
                  <select
                    value={manualKunci}
                    onChange={(e) => setManualKunci(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-bold text-slate-800"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="D">D</option>
                    <option value="E">E</option>
                  </select>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700">Pembahasan Lengkap</label>
                  <textarea
                    rows={3}
                    value={manualPembahasan}
                    onChange={(e) => setManualPembahasan(e.target.value)}
                    placeholder="Langkah penyelesaian soal..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingManual}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSavingManual ? "Menyimpan..." : "Simpan ke Bank Soal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Soal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Revisi Butir Soal</h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Pertanyaan</label>
                <textarea
                  rows={4}
                  value={editingItem.pertanyaan}
                  onChange={(e) => setEditingItem({ ...editingItem, pertanyaan: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Kunci Jawaban</label>
                <input
                  type="text"
                  value={editingItem.kunciJawaban}
                  onChange={(e) => setEditingItem({ ...editingItem, kunciJawaban: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 font-bold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Pembahasan</label>
                <textarea
                  rows={4}
                  value={editingItem.pembahasan}
                  onChange={(e) => setEditingItem({ ...editingItem, pembahasan: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  Simpan Revisi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}