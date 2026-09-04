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
  ArrowLeft,
  GraduationCap,
  Users,
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
import { getJurusanName } from "@/lib/constants/jurusan";

export default function RekapTkaPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [classesLoading, setClassesLoading] = useState(true);

  // Level 2 Drill-Down State
  const [selectedClassDetail, setSelectedClassDetail] = useState<any | null>(null);

  // Students for Selected Class (Loaded only in Level 2)
  const [students, setStudents] = useState<any[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingStudent, setEditingStudent] = useState<any | null>(null);
  const [statusMsg, setStatusMsg] = useState("");

  // Pagination (10 per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Load Classes (Level 1)
  const loadClasses = async () => {
    setClassesLoading(true);
    try {
      const res = await fetch("/api/admin/kelas");
      const data = await res.json();
      if (data.success) {
        setClasses(data.classes);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClassesLoading(false);
    }
  };

  // Load Students for Selected Class (Level 2)
  const loadStudentsForClass = async (className: string, status = filterStatus) => {
    setStudentsLoading(true);
    try {
      let url = `/api/admin/siswa?kelas=${encodeURIComponent(className)}`;
      if (status !== "ALL") url += `&statusTka=${status}`;
      if (searchTerm.trim()) url += `&search=${encodeURIComponent(searchTerm.trim())}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setStudentsLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    if (selectedClassDetail) {
      loadStudentsForClass(selectedClassDetail.nama, filterStatus);
    }
  }, [selectedClassDetail, filterStatus]);

  const handleSelectClass = (cls: any, initialStatus = "ALL") => {
    setSelectedClassDetail(cls);
    setFilterStatus(initialStatus);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleBackToClasses = () => {
    setSelectedClassDetail(null);
    setStudents([]);
    loadClasses();
  };

  const handleStudentSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClassDetail) {
      loadStudentsForClass(selectedClassDetail.nama, filterStatus);
    }
  };

  // Global KPI Calculations from Classes
  const totalCount = classes.reduce((sum, c) => sum + (c.totalSiswa || 0), 0);
  const ikutCount = classes.reduce((sum, c) => sum + (c.ikut || 0), 0);
  const tidakIkutCount = classes.reduce((sum, c) => sum + (c.tidakIkut || 0), 0);
  const belumCount = classes.reduce((sum, c) => sum + (c.belumRespons || 0), 0);
  const percentTotal = totalCount > 0 ? Math.round(((ikutCount + tidakIkutCount) / totalCount) * 100) : 0;

  // Chart Data
  const pieChartData = [
    { name: "Bersedia Ikut", value: ikutCount, fill: "#2563eb" },
    { name: "Tidak Ikut", value: tidakIkutCount, fill: "#f43f5e" },
    { name: "Belum Merespons", value: belumCount, fill: "#94a3b8" },
  ];

  const classBarData = classes.map((c) => ({
    name: c.nama,
    ikut: c.ikut,
    tidakIkut: c.tidakIkut,
    belum: c.belumRespons,
  }));

  // Export Class Students to CSV
  const handleExportClassCsv = () => {
    if (!selectedClassDetail) return;
    const exportData = students.map((s, idx) => ({
      No: idx + 1,
      NIS: s.nis,
      Nama_Lengkap: s.nama,
      Kelas: s.namaKelas || selectedClassDetail.nama,
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
    link.setAttribute("download", `Rekap_Konfirmasi_TKA_${selectedClassDetail.nama.replace(/\s+/g, "_")}.csv`);
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
        if (selectedClassDetail) {
          loadStudentsForClass(selectedClassDetail.nama, filterStatus);
        }
        loadClasses();
        setTimeout(() => setStatusMsg(""), 3000);
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Level 2: Pagination Calculations
  const filteredStudents = students.filter((s) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      s.nama.toLowerCase().includes(q) ||
      s.nis.includes(q) ||
      (s.namaIndustriPkl && s.namaIndustriPkl.toLowerCase().includes(q))
    );
  });

  const totalFiltered = filteredStudents.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalFiltered);
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold mb-1.5">
            <School className="w-3.5 h-3.5" />
            <span>Monitoring Kesiapan TKA Sekolah</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Monitoring Konfirmasi Keikutsertaan TKA
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pantau rekapitulasi respon per rombel kelas terlebih dahulu, lalu buka detail siswa per rombel untuk tindak lanjut cepat.
          </p>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold rounded-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 1: REKAPITULASI PER KELAS & CHARTS (Default View) */}
      {/* ========================================================================= */}
      {!selectedClassDetail ? (
        <div className="space-y-6">
          {/* Top KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="p-4 rounded-3xl border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                <span>Total Siswa</span>
                <Users className="w-4 h-4 text-slate-400" />
              </div>
              <div className="text-2xl font-black text-slate-900">{totalCount}</div>
              <div className="text-[10px] text-slate-400 mt-0.5">{classes.length} Rombel Terdaftar</div>
            </div>

            <div className="p-4 rounded-3xl border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                <span>Bersedia Ikut</span>
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-blue-900">{ikutCount}</div>
              <div className="text-[10px] text-blue-600 font-semibold mt-0.5">
                {totalCount > 0 ? Math.round((ikutCount / totalCount) * 100) : 0}% dari siswa
              </div>
            </div>

            <div className="p-4 rounded-3xl border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                <span>Tidak Ikut</span>
                <XCircle className="w-4 h-4 text-rose-600" />
              </div>
              <div className="text-2xl font-black text-rose-900">{tidakIkutCount}</div>
              <div className="text-[10px] text-rose-600 font-semibold mt-0.5">
                {totalCount > 0 ? Math.round((tidakIkutCount / totalCount) * 100) : 0}% tidak ikut
              </div>
            </div>

            <div className="p-4 rounded-3xl border border-slate-200 bg-white shadow-xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                <span>Belum Konfirmasi</span>
                <Clock className="w-4 h-4 text-amber-500" />
              </div>
              <div className="text-2xl font-black text-amber-900">{belumCount}</div>
              <div className="text-[10px] text-amber-600 font-semibold mt-0.5">Perlu tindak lanjut</div>
            </div>

            <div className="col-span-2 lg:col-span-1 p-4 rounded-3xl border border-slate-200 bg-linear-to-br from-blue-600 to-indigo-700 text-white shadow-xs">
              <span className="text-[11px] font-bold text-blue-100 uppercase tracking-wider block">Respon Sekolah</span>
              <div className="text-2xl font-black mt-1">{percentTotal}%</div>
              <div className="w-full bg-white/20 rounded-full h-1.5 mt-2 overflow-hidden">
                <div className="bg-white h-full rounded-full" style={{ width: `${percentTotal}%` }} />
              </div>
            </div>
          </div>

          {/* Rekapitulasi per Kelas Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <School className="w-4 h-4 text-blue-600" />
                  <span>Rekapitulasi Kesiapan Konfirmasi per Rombel Kelas</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Klik pada baris kelas atau tombol <strong>Buka Siswa</strong> untuk melihat dan mengelola data siswa di kelas tersebut.
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
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {classesLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Memuat data rekapitulasi kelas...
                      </td>
                    </tr>
                  ) : classes.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Belum ada data rombel kelas terdaftar.
                      </td>
                    </tr>
                  ) : (
                    classes.map((c) => (
                      <tr
                        key={c.id}
                        onClick={() => handleSelectClass(c)}
                        className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                      >
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {c.nama}
                          </span>
                          <span className="text-[10px] text-slate-400 block font-normal">
                            {getJurusanName(c.jurusan)}
                          </span>
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
                        <td className="py-3 px-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleSelectClass(c, c.belumRespons > 0 ? "BELUM_MERESPONS" : "ALL")}
                            className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 mx-auto transition-all shadow-xs cursor-pointer"
                          >
                            <span>Buka Siswa</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
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
                <span className="text-[11px] text-slate-400 font-semibold">Semua Jurusan</span>
              </div>

              <div className="h-60 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classBarData} margin={{ top: 10, right: 20, left: -20, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
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
        </div>
      ) : (
        /* ========================================================================= */
        /* LEVEL 2: RINCIAN SISWA KELAS TERPILIH (Setelah Kelas Diklik) */
        /* ========================================================================= */
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Class Banner & Back Button */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <button
                onClick={handleBackToClasses}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer mb-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Rekapitulasi Rombel Kelas</span>
              </button>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-black text-slate-900">
                  Rincian Siswa: {selectedClassDetail.nama}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                  {selectedClassDetail.jurusan}
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  • {getJurusanName(selectedClassDetail.jurusan)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleExportClassCsv}
                className="px-4 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <Download className="w-4 h-4 text-blue-600" />
                <span>Ekspor CSV Kelas Ini</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics of Selected Class */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => setFilterStatus("ALL")}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                filterStatus === "ALL"
                  ? "border-slate-800 bg-slate-900 text-white shadow-xs"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <span className="text-[10px] font-bold block opacity-75">SEMUA SISWA KELAS</span>
              <div className="text-lg font-black mt-0.5">{selectedClassDetail.totalSiswa} Siswa</div>
            </button>

            <button
              onClick={() => setFilterStatus("IKUT")}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                filterStatus === "IKUT"
                  ? "border-blue-600 bg-blue-50 ring-1 ring-blue-500"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <span className="text-[10px] font-bold text-slate-500 block">BERSEDIA IKUT</span>
              <div className="text-lg font-black text-blue-700 mt-0.5">{selectedClassDetail.ikut} Siswa</div>
            </button>

            <button
              onClick={() => setFilterStatus("TIDAK_IKUT")}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                filterStatus === "TIDAK_IKUT"
                  ? "border-rose-600 bg-rose-50 ring-1 ring-rose-500"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <span className="text-[10px] font-bold text-slate-500 block">TIDAK IKUT</span>
              <div className="text-lg font-black text-rose-700 mt-0.5">{selectedClassDetail.tidakIkut} Siswa</div>
            </button>

            <button
              onClick={() => setFilterStatus("BELUM_MERESPONS")}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer ${
                filterStatus === "BELUM_MERESPONS"
                  ? "border-amber-500 bg-amber-50 ring-1 ring-amber-500"
                  : "border-slate-200 bg-white hover:bg-slate-50"
              }`}
            >
              <span className="text-[10px] font-bold text-slate-500 block">BELUM KONFIRMASI</span>
              <div className="text-lg font-black text-amber-700 mt-0.5">{selectedClassDetail.belumRespons} Siswa</div>
            </button>
          </div>

          {/* Student Search Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <form onSubmit={handleStudentSearch} className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, NIS, atau industri PKL..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </form>
            <div className="text-xs text-slate-500">
              Filter aktif: <strong>{filterStatus}</strong> • Menampilkan <strong>{totalFiltered}</strong> siswa
            </div>
          </div>

          {/* Student Detail Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="px-4 py-3.5 w-12 text-center">No</th>
                    <th className="px-4 py-3.5">NIS & Nama</th>
                    <th className="px-4 py-3.5">Industri PKL</th>
                    <th className="px-4 py-3.5">Status TKA</th>
                    <th className="px-4 py-3.5">Mapel Pilihan 1</th>
                    <th className="px-4 py-3.5">Mapel Pilihan 2</th>
                    <th className="px-4 py-3.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {studentsLoading ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
                        Memuat data siswa kelas {selectedClassDetail.nama}...
                      </td>
                    </tr>
                  ) : paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-400">
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
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[170px]">{s.namaIndustriPkl || "-"}</span>
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
                          {(!s.statusTka || s.statusTka === "BELUM_MERESPONS") && (
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
                <span className="font-bold text-slate-800">{totalFiltered}</span> siswa di kelas {selectedClassDetail.nama}
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
        </div>
      )}

      {/* Modal Koreksi / Override Status */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Koreksi Data Siswa</h3>
                <p className="text-xs text-slate-500">Ubah status keikutsertaan atau mapel pilihan siswa.</p>
              </div>
              <button
                onClick={() => setEditingStudent(null)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveOverride} className="space-y-3.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-2xl space-y-1 text-slate-700">
                <div className="font-bold text-slate-900">{editingStudent.nama}</div>
                <div className="text-[11px] text-slate-500">NIS: {editingStudent.nis} • Kelas: {editingStudent.namaKelas || selectedClassDetail?.nama}</div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700">Status Keikutsertaan TKA</label>
                <select
                  value={editingStudent.statusTka}
                  onChange={(e) => setEditingStudent({ ...editingStudent, statusTka: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="IKUT">IKUT (Bersedia)</option>
                  <option value="TIDAK_IKUT">TIDAK IKUT</option>
                  <option value="BELUM_MERESPONS">BELUM MERESPONS</option>
                </select>
              </div>

              {editingStudent.statusTka === "IKUT" && (
                <>
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Mapel Pilihan 1 (Kejuruan/Akademik)</label>
                    <select
                      value={editingStudent.mapelPilihan1 || ""}
                      onChange={(e) => setEditingStudent({ ...editingStudent, mapelPilihan1: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="">-- Pilih Mata Pelajaran --</option>
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

                  <div className="space-y-1">
                    <label className="font-bold text-slate-700">Mapel Pilihan 2 (Pendukung/Akademik)</label>
                    <select
                      value={editingStudent.mapelPilihan2 || ""}
                      onChange={(e) => setEditingStudent({ ...editingStudent, mapelPilihan2: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    >
                      <option value="">-- Pilih Mata Pelajaran --</option>
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
                </>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold cursor-pointer"
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