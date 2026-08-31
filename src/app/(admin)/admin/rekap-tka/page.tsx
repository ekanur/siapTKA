"use client";

import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import {
  FileSpreadsheet,
  Download,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  Building2,
  Search,
  Filter,
  ShieldAlert,
  X,
} from "lucide-react";

export default function RekapTkaPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  const loadData = async () => {
    setLoading(true);
    try {
      const url = filterStatus !== "ALL" ? `/api/admin/siswa?statusTka=${filterStatus}` : `/api/admin/siswa`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [filterStatus]);

  // Export to CSV for school admin input into Kemendikbud TKA dashboard
  const handleExportCsv = () => {
    const exportData = students.map((s, idx) => ({
      No: idx + 1,
      NIS: s.nis,
      Nama_Lengkap: s.nama,
      Jurusan: s.jurusan,
      Industri_PKL: s.namaIndustriPkl,
      Email_Institusi: s.email,
      Status_Keikutsertaan_TKA: s.statusTka,
      Mapel_Pilihan_1: s.mapelPilihan1 || "-",
      Mapel_Pilihan_2: s.mapelPilihan2 || "-",
      Status_Aktivasi: s.statusAkun,
    }));

    const csvString = Papa.unparse(exportData);
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Konfirmasi_TKA_SIJA_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Override handler
  const handleSaveOverride = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;

    try {
      const res = await fetch("/api/admin/siswa", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingStudent.id,
          statusTka: editingStudent.statusTka,
          mapelPilihan1: editingStudent.statusTka === "IKUT" ? editingStudent.mapelPilihan1 : null,
          mapelPilihan2: editingStudent.statusTka === "IKUT" ? editingStudent.mapelPilihan2 : null,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(data.message);
        setEditingStudent(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const ikutCount = students.filter((s) => s.statusTka === "IKUT").length;
  const tidakIkutCount = students.filter((s) => s.statusTka === "TIDAK_IKUT").length;
  const belumCount = students.filter((s) => s.statusTka === "BELUM_MERESPONS").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-full text-xs font-bold mb-1">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Digitalisasi Konfirmasi Surat Fisik</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900">
            Rekap Konfirmasi TKA Resmi Siswa
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Data digital rapi untuk mempercepat proses input manual admin sekolah ke dashboard resmi TKA Kemendikbud.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Ekspor CSV Dashboard TKA</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl font-bold flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg("")} className="text-blue-500">
            Tutup
          </button>
        </div>
      )}

      {/* Filter & Summary Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button
          onClick={() => setFilterStatus("IKUT")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterStatus === "IKUT"
              ? "border-blue-600 bg-blue-50 text-blue-900 shadow-sm ring-1 ring-blue-500"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>Bersedia Ikut TKA</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{ikutCount} Siswa</div>
        </button>

        <button
          onClick={() => setFilterStatus("TIDAK_IKUT")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterStatus === "TIDAK_IKUT"
              ? "border-rose-600 bg-rose-50 text-rose-900 shadow-sm ring-1 ring-rose-500"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>Tidak Ikut TKA</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{tidakIkutCount} Siswa</div>
        </button>

        <button
          onClick={() => setFilterStatus("BELUM_MERESPONS")}
          className={`p-4 rounded-2xl border text-left transition-all ${
            filterStatus === "BELUM_MERESPONS"
              ? "border-amber-600 bg-amber-50 text-amber-900 shadow-sm ring-1 ring-amber-500"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between text-xs font-bold text-slate-500 mb-1">
            <span>Belum Merespons</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{belumCount} Siswa</div>
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-900">
            Daftar Konfirmasi Siswa ({students.length} Siswa)
          </span>
          {filterStatus !== "ALL" && (
            <button
              onClick={() => setFilterStatus("ALL")}
              className="text-xs text-blue-600 font-bold hover:underline"
            >
              Tampilkan Semua
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="p-4">NIS & Nama Siswa</th>
                <th className="p-4">Industri PKL</th>
                <th className="p-4">Status Konfirmasi</th>
                <th className="p-4">Mapel Pilihan 1</th>
                <th className="p-4">Mapel Pilihan 2</th>
                <th className="p-4 text-right">Aksi Override</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Memuat data...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Tidak ada data pada kategori ini.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{s.nama}</div>
                      <div className="text-[11px] font-mono text-slate-400">NIS: {s.nis}</div>
                    </td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-700">
                        <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span>{s.namaIndustriPkl}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      {s.statusTka === "IKUT" ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200 flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Bersedia Ikut</span>
                        </span>
                      ) : s.statusTka === "TIDAK_IKUT" ? (
                        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-bold rounded-lg border border-rose-200 flex items-center gap-1 w-fit">
                          <XCircle className="w-3 h-3" />
                          <span>Tidak Ikut</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-medium rounded-lg flex items-center gap-1 w-fit">
                          <Clock className="w-3 h-3" />
                          <span>Belum Merespons</span>
                        </span>
                      )}
                    </td>

                    <td className="p-4 font-semibold text-slate-800">
                      {s.mapelPilihan1 || <span className="text-slate-300 italic">-</span>}
                    </td>

                    <td className="p-4 text-slate-600">
                      {s.mapelPilihan2 || <span className="text-slate-300 italic">-</span>}
                    </td>

                    <td className="p-4 text-right">
                      <button
                        onClick={() => setEditingStudent({ ...s })}
                        className="p-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-600 rounded-lg text-xs font-bold transition-all"
                        title="Override Status"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Override Status Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-extrabold text-slate-900 text-base">
                  Override Status Konfirmasi Siswa
                </h2>
                <p className="text-xs text-slate-500">{editingStudent.nama} ({editingStudent.nis})</p>
              </div>
              <button onClick={() => setEditingStudent(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOverride} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Status Keikutsertaan</label>
                <select
                  value={editingStudent.statusTka}
                  onChange={(e) => setEditingStudent({ ...editingStudent, statusTka: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-bold"
                >
                  <option value="IKUT">IKUT (Bersedia)</option>
                  <option value="TIDAK_IKUT">TIDAK IKUT</option>
                  <option value="BELUM_MERESPONS">BELUM MERESPONS</option>
                </select>
              </div>

              {editingStudent.statusTka === "IKUT" && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mapel Pilihan 1</label>
                    <input
                      type="text"
                      value={editingStudent.mapelPilihan1 || ""}
                      onChange={(e) => setEditingStudent({ ...editingStudent, mapelPilihan1: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                      placeholder="mis: PPLG"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Mapel Pilihan 2</label>
                    <input
                      type="text"
                      value={editingStudent.mapelPilihan2 || ""}
                      onChange={(e) => setEditingStudent({ ...editingStudent, mapelPilihan2: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl"
                      placeholder="mis: Bahasa Inggris Lanjutan"
                    />
                  </div>
                </>
              )}

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-md"
                >
                  Simpan Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}