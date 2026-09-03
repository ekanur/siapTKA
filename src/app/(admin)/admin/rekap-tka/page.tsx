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
  X,
  PieChart as PieChartIcon,
  BarChart3,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import { getSubjectDisplayName, MAPEL_PILIHAN_GROUPS } from "@/lib/constants/subjects";

export default function RekapTkaPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
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

  // Export to CSV
  const handleExportCsv = () => {
    const exportData = students.map((s, idx) => ({
      No: idx + 1,
      NIS: s.nis,
      Nama_Lengkap: s.nama,
      Jurusan: s.jurusan,
      Industri_PKL: s.namaIndustriPkl,
      Email_Institusi: s.email,
      Status_Keikutsertaan_TKA: s.statusTka,
      Mapel_Pilihan_1: s.mapelPilihan1 ? getSubjectDisplayName(s.mapelPilihan1) : "-",
      Mapel_Pilihan_2: s.mapelPilihan2 ? getSubjectDisplayName(s.mapelPilihan2) : "-",
      Status_Aktivasi: s.statusAkun,
    }));

    const csvString = Papa.unparse(exportData);
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Rekap_Konfirmasi_TKA_${new Date().toISOString().slice(0, 10)}.csv`);
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
  const totalCount = students.length;

  // Chart 1: Donut Chart data
  const pieChartData = [
    { name: "Bersedia Ikut", value: ikutCount, fill: "#2563eb" },
    { name: "Tidak Ikut", value: tidakIkutCount, fill: "#f43f5e" },
    { name: "Belum Merespons", value: belumCount, fill: "#94a3b8" },
  ];

  // Chart 2: Elective distribution
  const mapelCounts: { [mapelId: string]: number } = {};
  students.forEach((s) => {
    if (s.statusTka === "IKUT") {
      if (s.mapelPilihan1) mapelCounts[s.mapelPilihan1] = (mapelCounts[s.mapelPilihan1] || 0) + 1;
      if (s.mapelPilihan2) mapelCounts[s.mapelPilihan2] = (mapelCounts[s.mapelPilihan2] || 0) + 1;
    }
  });

  const barChartData = Object.entries(mapelCounts)
    .map(([key, count]) => ({
      name: getSubjectDisplayName(key),
      shortName: key,
      peminat: count,
    }))
    .sort((a, b) => b.peminat - a.peminat);

  const filteredStudents = students.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.nama.toLowerCase().includes(term) ||
      s.nis.toLowerCase().includes(term) ||
      s.namaIndustriPkl.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold mb-1">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Monitoring Konfirmasi TKA</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Rekapitulasi Keikutsertaan Siswa
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau status respon pendaftaran TKA siswa serta distribusi pemilihan mata pelajaran pilihan kejuruan.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Ekspor Data (CSV)</span>
        </button>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl font-bold flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg("")} className="text-blue-500 hover:text-blue-700 cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Siswa Terdaftar</span>
          <div className="text-2xl font-black text-slate-900">{totalCount}</div>
        </div>

        <button
          onClick={() => setFilterStatus(filterStatus === "IKUT" ? "ALL" : "IKUT")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === "IKUT" ? "border-blue-600 bg-blue-50 ring-1 ring-blue-500" : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
            <span>Bersedia Ikut</span>
            <CheckCircle2 className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-blue-900">{ikutCount} Siswa</div>
        </button>

        <button
          onClick={() => setFilterStatus(filterStatus === "TIDAK_IKUT" ? "ALL" : "TIDAK_IKUT")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === "TIDAK_IKUT" ? "border-rose-600 bg-rose-50 ring-1 ring-rose-500" : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
            <span>Tidak Ikut</span>
            <XCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-900">{tidakIkutCount} Siswa</div>
        </button>

        <button
          onClick={() => setFilterStatus(filterStatus === "BELUM_MERESPONS" ? "ALL" : "BELUM_MERESPONS")}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            filterStatus === "BELUM_MERESPONS" ? "border-slate-600 bg-slate-100 ring-1 ring-slate-500" : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
            <span>Belum Merespons</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-700">{belumCount} Siswa</div>
        </button>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Donut Status */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <PieChartIcon className="w-4 h-4 text-blue-600" />
              <span>Proporsi Status Keikutsertaan</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold">{totalCount} Siswa</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Bar Elective Subjects */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Sebaran Mata Pelajaran Pilihan</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold">{ikutCount} Peserta Ikut</span>
          </div>

          <div className="h-60 w-full">
            {barChartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                Belum ada siswa yang memilih mapel pilihan.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} margin={{ top: 10, right: 20, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="shortName" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip
                    formatter={(val, name, item: any) => [val, item.payload.name]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  />
                  <Bar dataKey="peminat" name="Jumlah Pemilih" fill="#004ac6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Student Table Section */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Search & Filter Bar */}
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama, NIS, atau industri PKL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="ALL">Semua Status ({totalCount})</option>
              <option value="IKUT">Bersedia Ikut ({ikutCount})</option>
              <option value="TIDAK_IKUT">Tidak Ikut ({tidakIkutCount})</option>
              <option value="BELUM_MERESPONS">Belum Merespons ({belumCount})</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="px-4 py-3.5">NIS & Nama</th>
                <th className="px-4 py-3.5">Industri PKL</th>
                <th className="px-4 py-3.5">Status TKA</th>
                <th className="px-4 py-3.5">Mapel Pilihan 1</th>
                <th className="px-4 py-3.5">Mapel Pilihan 2</th>
                <th className="px-4 py-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Memuat data siswa...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada data siswa yang cocok.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{s.nama}</div>
                      <div className="text-[11px] text-slate-400 font-mono">NIS: {s.nis}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{s.namaIndustriPkl}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {s.statusTka === "IKUT" && (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold text-[11px] rounded-full border border-blue-200">
                          IKUT
                        </span>
                      )}
                      {s.statusTka === "TIDAK_IKUT" && (
                        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-bold text-[11px] rounded-full border border-rose-200">
                          TIDAK IKUT
                        </span>
                      )}
                      {s.statusTka === "BELUM_MERESPONS" && (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-600 font-medium text-[11px] rounded-full">
                          Belum Respons
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {s.mapelPilihan1 ? getSubjectDisplayName(s.mapelPilihan1) : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {s.mapelPilihan2 ? getSubjectDisplayName(s.mapelPilihan2) : "-"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setEditingStudent(s)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg transition-all flex items-center gap-1 ml-auto cursor-pointer"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Koreksi</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Koreksi Data Siswa */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Koreksi Status Siswa</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">{editingStudent.nama} ({editingStudent.nis})</p>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOverride} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-slate-700 block">Status Keikutsertaan TKA</label>
                <select
                  value={editingStudent.statusTka}
                  onChange={(e) => setEditingStudent({ ...editingStudent, statusTka: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800"
                >
                  <option value="IKUT">IKUT (Bersedia)</option>
                  <option value="TIDAK_IKUT">TIDAK IKUT</option>
                  <option value="BELUM_MERESPONS">BELUM MERESPONS</option>
                </select>
              </div>

              {editingStudent.statusTka === "IKUT" && (
                <>
                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">Mapel Pilihan 1</label>
                    <select
                      value={editingStudent.mapelPilihan1 || "PPLG"}
                      onChange={(e) => setEditingStudent({ ...editingStudent, mapelPilihan1: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 font-medium"
                    >
                      {MAPEL_PILIHAN_GROUPS.map((g) => (
                        <optgroup key={g.groupName} label={g.groupName}>
                          {g.subjects.map((sub) => (
                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="font-bold text-slate-700 block">Mapel Pilihan 2</label>
                    <select
                      value={editingStudent.mapelPilihan2 || "AIJ"}
                      onChange={(e) => setEditingStudent({ ...editingStudent, mapelPilihan2: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-slate-800 font-medium"
                    >
                      {MAPEL_PILIHAN_GROUPS.map((g) => (
                        <optgroup key={g.groupName} label={g.groupName}>
                          {g.subjects.map((sub) => (
                            <option key={sub.id} value={sub.id}>{sub.name}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
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