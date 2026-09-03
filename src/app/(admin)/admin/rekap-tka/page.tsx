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
  School,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
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
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [filterKelas, setFilterKelas] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  // Pagination (10 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const loadClasses = async () => {
    try {
      const res = await fetch("/api/admin/kelas");
      const data = await res.json();
      if (data.success) {
        setClasses(data.classes);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const queryParts = [];
      if (filterStatus !== "ALL") queryParts.push(`statusTka=${filterStatus}`);
      if (filterKelas !== "ALL") queryParts.push(`kelas=${encodeURIComponent(filterKelas)}`);
      const url = queryParts.length > 0 ? `/api/admin/siswa?${queryParts.join("&")}` : `/api/admin/siswa`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
        setCurrentPage(1); // Reset page on filter
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    loadData();
  }, [filterStatus, filterKelas]);

  // Export to CSV
  const handleExportCsv = () => {
    const exportData = filteredStudents.map((s, idx) => ({
      No: idx + 1,
      NIS: s.nis,
      Nama_Lengkap: s.nama,
      Kelas: s.namaKelas || s.kelas?.nama || "Tanpa Kelas",
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

  // Quick action: Show students in class who have not responded
  const handleTindakLanjutKelas = (className: string) => {
    setFilterKelas(className);
    setFilterStatus("BELUM_MERESPONS");
    setSearchTerm("");
    // Scroll to student table
    const el = document.getElementById("tabel-siswa-detail");
    if (el) el.scrollIntoView({ behavior: "smooth" });
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
        loadClasses();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const ikutCount = students.filter((s) => s.statusTka === "IKUT").length;
  const tidakIkutCount = students.filter((s) => s.statusTka === "TIDAK_IKUT").length;
  const belumCount = students.filter((s) => s.statusTka === "BELUM_MERESPONS").length;
  const totalCount = students.length;

  // Pie chart data
  const pieChartData = [
    { name: "Bersedia Ikut", value: ikutCount, fill: "#2563eb" },
    { name: "Tidak Ikut", value: tidakIkutCount, fill: "#f43f5e" },
    { name: "Belum Merespons", value: belumCount, fill: "#94a3b8" },
  ];

  // Bar chart per class data
  const classBarData = classes.map((c) => ({
    name: c.nama,
    ikut: c.ikut,
    tidakIkut: c.tidakIkut,
    belum: c.belumRespons,
    percent: c.percentKonfirmasi,
  }));

  const filteredStudents = students.filter((s) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.nama.toLowerCase().includes(term) ||
      s.nis.toLowerCase().includes(term) ||
      (s.namaKelas && s.namaKelas.toLowerCase().includes(term)) ||
      s.namaIndustriPkl.toLowerCase().includes(term)
    );
  });

  // Pagination Calculations
  const totalFiltered = filteredStudents.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalFiltered);
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold mb-1">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Monitoring Konfirmasi TKA Berbasis Kelas</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Rekapitulasi Keikutsertaan Siswa & Rombel
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau status respon pendaftaran TKA siswa per kelas, identifikasi rombel yang belum merespons, dan sebaran mata pelajaran pilihan kejuruan.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
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
        <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Siswa Terdaftar</span>
          <div className="text-2xl font-black text-slate-900">{totalCount}</div>
        </div>

        <button
          onClick={() => setFilterStatus(filterStatus === "IKUT" ? "ALL" : "IKUT")}
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            filterStatus === "IKUT"
              ? "border-blue-600 bg-blue-50 ring-1 ring-blue-500"
              : "border-slate-200 bg-white hover:bg-slate-50"
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
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            filterStatus === "TIDAK_IKUT"
              ? "border-rose-600 bg-rose-50 ring-1 ring-rose-500"
              : "border-slate-200 bg-white hover:bg-slate-50"
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
          className={`p-4 rounded-3xl border text-left transition-all cursor-pointer ${
            filterStatus === "BELUM_MERESPONS"
              ? "border-slate-600 bg-slate-100 ring-1 ring-slate-500"
              : "border-slate-200 bg-white hover:bg-slate-50"
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
            <span>Belum Merespons</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-black text-slate-700">{belumCount} Siswa</div>
        </button>
      </div>

      {/* Rekapitulasi per Kelas (PENTING untuk Tindak Lanjut Sekolah) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <School className="w-4 h-4 text-blue-600" />
              <span>Rekapitulasi Kesiapan Konfirmasi per Rombel Kelas</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Identifikasi kelas yang tingkat konfirmasinya belum mencapai 100% untuk ditindaklanjuti wali kelas.
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
            {classes.length} Rombel Terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-3 px-4">Nama Kelas</th>
                <th className="py-3 px-4 text-center">Total Siswa</th>
                <th className="py-3 px-4 text-center">Ikut</th>
                <th className="py-3 px-4 text-center">Tidak Ikut</th>
                <th className="py-3 px-4 text-center">Belum Konfirmasi</th>
                <th className="py-3 px-4 text-center">% Respon</th>
                <th className="py-3 px-4 text-center">Status Kesiapan</th>
                <th className="py-3 px-4 text-center">Tindak Lanjut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {classes.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3 px-4">
                    <span className="font-bold text-slate-900">{c.nama}</span>
                    <span className="text-[10px] text-slate-400 block font-normal">{c.jurusan}</span>
                  </td>
                  <td className="py-3 px-4 text-center font-bold text-slate-800">{c.totalSiswa}</td>
                  <td className="py-3 px-4 text-center font-bold text-blue-600">{c.ikut}</td>
                  <td className="py-3 px-4 text-center font-bold text-rose-600">{c.tidakIkut}</td>
                  <td className="py-3 px-4 text-center font-bold text-slate-600">
                    {c.belumRespons > 0 ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[11px]">
                        {c.belumRespons} Siswa
                      </span>
                    ) : (
                      <span className="text-slate-400">0</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            c.percentKonfirmasi === 100
                              ? "bg-emerald-500"
                              : c.percentKonfirmasi >= 80
                              ? "bg-blue-600"
                              : "bg-amber-500"
                          }`}
                          style={{ width: `${c.percentKonfirmasi}%` }}
                        />
                      </div>
                      <span className="font-extrabold text-slate-800 text-[11px]">{c.percentKonfirmasi}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    {c.statusKesiapan === "TUNTAS" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Tuntas (100%)</span>
                      </span>
                    ) : c.statusKesiapan === "CUKUP" ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                        <span>Cukup Baik</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 animate-pulse">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Perlu Tindak Lanjut</span>
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {c.belumRespons > 0 ? (
                      <button
                        onClick={() => handleTindakLanjutKelas(c.nama)}
                        className="px-3 py-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] flex items-center gap-1 mx-auto transition-all shadow-xs cursor-pointer"
                      >
                        <span>Lihat {c.belumRespons} Siswa</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <span className="text-emerald-600 font-bold text-[11px]">Lengkap</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart 1: Donut Status */}
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
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

        {/* Chart 2: Komparasi Respon Antar Kelas */}
        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Komparasi Respon Antar Kelas</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold">Tingkat 13 PKL</span>
          </div>

          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={classBarData} margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "6px" }} />
                <Bar dataKey="ikut" name="Ikut TKA" fill="#2563eb" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="tidakIkut" name="Tidak Ikut" fill="#f43f5e" stackId="a" radius={[0, 0, 0, 0]} />
                <Bar dataKey="belum" name="Belum Respons" fill="#94a3b8" stackId="a" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Student Detail Table Section with Pagination */}
      <div id="tabel-siswa-detail" className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
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

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Filter Kelas */}
            <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
              <School className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterKelas}
                onChange={(e) => setFilterKelas(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white cursor-pointer"
              >
                <option value="ALL">Semua Kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.nama}>
                    {c.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Status */}
            <div className="flex items-center gap-1 text-xs text-slate-500 font-semibold">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white cursor-pointer"
              >
                <option value="ALL">Semua Status</option>
                <option value="IKUT">Bersedia Ikut</option>
                <option value="TIDAK_IKUT">Tidak Ikut</option>
                <option value="BELUM_MERESPONS">Belum Merespons</option>
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">No</th>
                <th className="px-4 py-3.5">NIS & Nama</th>
                <th className="px-4 py-3.5">Kelas</th>
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
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Memuat data siswa...
                  </td>
                </tr>
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Tidak ada data siswa yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 text-center text-slate-400 font-mono">
                      {startIndex + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{s.nama}</div>
                      <div className="text-[11px] text-slate-400 font-mono">NIS: {s.nis}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                        {s.namaKelas || s.kelas?.nama || "Tanpa Kelas"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[170px]">{s.namaIndustriPkl}</span>
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
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-800 font-bold text-[11px] rounded-full border border-amber-200">
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

        {/* Standard Pagination (10 data per page) */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Menampilkan <span className="font-bold text-slate-800">{totalFiltered > 0 ? startIndex + 1 : 0}</span> s.d.{" "}
            <span className="font-bold text-slate-800">{endIndex}</span> dari{" "}
            <span className="font-bold text-slate-800">{totalFiltered}</span> siswa
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 font-semibold"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Sebelumnya</span>
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
                if (pg === 1 || pg === totalPages || (pg >= currentPage - 1 && pg <= currentPage + 1)) {
                  return (
                    <button
                      key={pg}
                      onClick={() => setCurrentPage(pg)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        currentPage === pg
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {pg}
                    </button>
                  );
                } else if (pg === currentPage - 2 || pg === currentPage + 2) {
                  return (
                    <span key={pg} className="px-1 text-slate-400">
                      ...
                    </span>
                  );
                }
                return null;
              })}
            </div>

            <button
              onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 font-semibold"
            >
              <span>Selanjutnya</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Koreksi Data Siswa */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Koreksi Status Siswa</h3>
                <p className="text-xs text-slate-500 font-medium mt-0.5">
                  {editingStudent.nama} ({editingStudent.nis}) • {editingStudent.namaKelas || "Tanpa Kelas"}
                </p>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
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
                            <option key={sub.id} value={sub.id}>
                              {sub.name}
                            </option>
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
                            <option key={sub.id} value={sub.id}>
                              {sub.name}
                            </option>
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