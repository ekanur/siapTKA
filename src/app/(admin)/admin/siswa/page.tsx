"use client";

import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import {
  Users,
  UploadCloud,
  CheckCircle2,
  Clock,
  Search,
  Building2,
  Filter,
  FileSpreadsheet,
  AlertCircle,
  X,
  PlusCircle,
  Edit2,
  Trash2,
  School,
  ChevronLeft,
  ChevronRight,
  Layers,
  Sparkles,
} from "lucide-react";
import { getSubjectDisplayName } from "@/lib/constants/subjects";

export default function AdminSiswaPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusTka, setSelectedStatusTka] = useState("ALL");
  const [selectedKelas, setSelectedKelas] = useState("ALL");

  // Pagination (10 data per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // CSV Modal
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvStatusMsg, setCsvStatusMsg] = useState("");

  // Modal Student Add/Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT">("ADD");
  const [formData, setFormData] = useState({
    id: "",
    nis: "",
    nama: "",
    email: "",
    jurusan: "SIJA",
    kelasId: "",
    namaIndustriPkl: "",
  });
  const [savingData, setSavingData] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal Manage Classes
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassJurusan, setNewClassJurusan] = useState("SIJA");
  const [classSaving, setClassSaving] = useState(false);
  const [classMsg, setClassMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadClasses = async () => {
    try {
      const res = await fetch("/api/admin/kelas");
      const data = await res.json();
      if (data.success) {
        setClasses(data.classes);
      }
    } catch (err) {
      console.error("Load classes error:", err);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/siswa`;
      const queryParts = [];
      if (selectedStatusTka !== "ALL") queryParts.push(`statusTka=${selectedStatusTka}`);
      if (selectedKelas !== "ALL") queryParts.push(`kelas=${encodeURIComponent(selectedKelas)}`);
      if (searchTerm) queryParts.push(`search=${encodeURIComponent(searchTerm)}`);
      if (queryParts.length > 0) url += `?${queryParts.join("&")}`;

      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setStudents(data.students);
        setCurrentPage(1); // Reset to page 1 on filter
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
    loadStudents();
  }, [selectedStatusTka, selectedKelas]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadStudents();
  };

  // CSV Import Parser
  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rawRows: any[] = results.data;
        const formattedStudents = rawRows.map((r) => ({
          nis: r.nis || r.NIS || r.Nis,
          nama: r.nama || r.Nama || r.NAMA,
          email: r.email || r.Email || r.EMAIL,
          jurusan: r.jurusan || r.Jurusan || "SIJA",
          kelas: r.kelas || r.Kelas || r.KELAS || "",
          namaIndustriPkl: r.namaIndustriPkl || r.industri || r.Industri || "Belum Ditentukan",
        }));

        try {
          const res = await fetch("/api/admin/siswa", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ students: formattedStudents }),
          });
          const data = await res.json();
          if (data.success) {
            setCsvStatusMsg(data.message);
            loadStudents();
            loadClasses();
          } else {
            setCsvStatusMsg(data.error || "Gagal mengimpor data");
          }
        } catch (err: any) {
          setCsvStatusMsg(err.message || "Kesalahan jaringan");
        }
      },
    });
  };

  // Manual Add/Edit Student
  const handleOpenAddModal = () => {
    setModalMode("ADD");
    setFormData({
      id: "",
      nis: "",
      nama: "",
      email: "",
      jurusan: "SIJA",
      kelasId: classes[0]?.id || "",
      namaIndustriPkl: "",
    });
    setFeedbackMsg(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (s: any) => {
    setModalMode("EDIT");
    setFormData({
      id: s.id,
      nis: s.nis,
      nama: s.nama,
      email: s.email,
      jurusan: s.jurusan || "SIJA",
      kelasId: s.kelasId || "",
      namaIndustriPkl: s.namaIndustriPkl || "",
    });
    setFeedbackMsg(null);
    setIsModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingData(true);
    setFeedbackMsg(null);

    try {
      const selectedK = classes.find((c) => c.id === formData.kelasId);
      const payload: any = {
        ...formData,
        namaKelas: selectedK?.nama || null,
      };

      if (modalMode === "ADD") {
        const res = await fetch("/api/admin/siswa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student: payload }),
        });
        const data = await res.json();
        if (data.success) {
          setFeedbackMsg({ type: "success", text: data.message });
          loadStudents();
          loadClasses();
          setTimeout(() => setIsModalOpen(false), 1200);
        } else {
          setFeedbackMsg({ type: "error", text: data.error });
        }
      } else {
        const res = await fetch("/api/admin/siswa", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (data.success) {
          setFeedbackMsg({ type: "success", text: data.message });
          loadStudents();
          loadClasses();
          setTimeout(() => setIsModalOpen(false), 1200);
        } else {
          setFeedbackMsg({ type: "error", text: data.error });
        }
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message || "Kesalahan jaringan" });
    } finally {
      setSavingData(false);
    }
  };

  const handleDeleteStudent = async (id: string, nama: string) => {
    if (!confirm(`Hapus data siswa ${nama}? Data progres latihan siswa ini juga akan terhapus.`)) return;

    try {
      const res = await fetch(`/api/admin/siswa?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        loadStudents();
        loadClasses();
      } else {
        alert(data.error || "Gagal menghapus siswa");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Class Handler
  const handleAddClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;

    setClassSaving(true);
    setClassMsg(null);
    try {
      const res = await fetch("/api/admin/kelas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama: newClassName.trim().toUpperCase(),
          jurusan: newClassJurusan,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setClassMsg({ type: "success", text: data.message });
        setNewClassName("");
        loadClasses();
      } else {
        setClassMsg({ type: "error", text: data.error });
      }
    } catch (err: any) {
      setClassMsg({ type: "error", text: err.message || "Kesalahan jaringan" });
    } finally {
      setClassSaving(false);
    }
  };

  const handleDeleteClass = async (id: string, nama: string) => {
    if (!confirm(`Hapus kelas ${nama}? Siswa di kelas ini akan dialihkan ke status tanpa kelas.`)) return;

    try {
      const res = await fetch(`/api/admin/kelas?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        loadClasses();
        loadStudents();
      } else {
        alert(data.error);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Pagination Calculations
  const totalItems = students.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
  const paginatedStudents = students.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold mb-1.5">
            <Users className="w-3.5 h-3.5" />
            <span>Master Data Peserta Didik</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Data Siswa & Manajemen Kelas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data siswa, alokasi kelas (13 SIJA A, 13 SIJA B, dst), tempat industri PKL, serta pemetaan mata pelajaran pilihan TKA.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setIsClassModalOpen(true);
              setClassMsg(null);
            }}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <School className="w-4 h-4 text-blue-600" />
            <span>Kelola Kelas ({classes.length})</span>
          </button>

          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-emerald-600" />
            <span>Import CSV</span>
          </button>

          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>
        </div>
      </div>

      {/* Class Statistics Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <button
          onClick={() => setSelectedKelas("ALL")}
          className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
            selectedKelas === "ALL"
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          }`}
        >
          Semua Kelas ({students.length})
        </button>
        {classes.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedKelas(c.nama)}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5 ${
              selectedKelas === c.nama
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
            }`}
          >
            <span>{c.nama}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedKelas === c.nama ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"
              }`}
            >
              {c.totalSiswa}
            </span>
          </button>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari NIS, Nama, atau Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </form>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold shrink-0">
            <Filter className="w-3.5 h-3.5" />
            <span>Status TKA:</span>
          </div>
          <select
            value={selectedStatusTka}
            onChange={(e) => setSelectedStatusTka(e.target.value)}
            className="w-full sm:w-auto px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">Semua Status</option>
            <option value="IKUT">Bersedia Ikut (IKUT)</option>
            <option value="TIDAK_IKUT">Tidak Ikut</option>
            <option value="BELUM_MERESPONS">Belum Konfirmasi</option>
          </select>
        </div>
      </div>

      {/* Students Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-extrabold uppercase tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">No</th>
                <th className="py-3.5 px-4">Siswa</th>
                <th className="py-3.5 px-4">Kelas</th>
                <th className="py-3.5 px-4">Industri PKL</th>
                <th className="py-3.5 px-4">Status TKA</th>
                <th className="py-3.5 px-4">Mapel Pilihan</th>
                <th className="py-3.5 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Memuat data siswa...
                  </td>
                </tr>
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Tidak ditemukan data siswa sesuai filter.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((s, idx) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-400 font-mono">
                      {startIndex + idx + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-slate-900">{s.nama}</p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          NIS: {s.nis} • {s.email}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                        {s.namaKelas || s.kelas?.nama || "Tanpa Kelas"}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[160px]">{s.namaIndustriPkl}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {s.statusTka === "IKUT" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Ikut TKA</span>
                        </span>
                      ) : s.statusTka === "TIDAK_IKUT" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <span>Tidak Ikut</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3" />
                          <span>Belum Respons</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {s.statusTka === "IKUT" ? (
                        <div className="text-[11px] space-y-0.5">
                          <p className="font-semibold text-slate-800 truncate max-w-[170px]">
                            1. {getSubjectDisplayName(s.mapelPilihan1)}
                          </p>
                          <p className="font-semibold text-slate-800 truncate max-w-[170px]">
                            2. {getSubjectDisplayName(s.mapelPilihan2)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-[11px]">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenEditModal(s)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                          title="Edit Data Siswa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteStudent(s.id, s.nama)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Hapus Siswa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
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
            Menampilkan <span className="font-bold text-slate-800">{totalItems > 0 ? startIndex + 1 : 0}</span> s.d.{" "}
            <span className="font-bold text-slate-800">{endIndex}</span> dari{" "}
            <span className="font-bold text-slate-800">{totalItems}</span> siswa
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
                // Show first, last, and pages around current
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

      {/* Modal Add/Edit Student */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                {modalMode === "ADD" ? "Tambah Siswa Baru" : "Edit Data Siswa"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {feedbackMsg && (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  feedbackMsg.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                {feedbackMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{feedbackMsg.text}</span>
              </div>
            )}

            <form onSubmit={handleSaveStudent} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">NIS *</label>
                  <input
                    type="text"
                    required
                    value={formData.nis}
                    onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                    placeholder="Contoh: 22231001"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Kelas *</label>
                  <select
                    value={formData.kelasId}
                    onChange={(e) => setFormData({ ...formData, kelasId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="">-- Pilih Kelas --</option>
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nama} ({c.jurusan})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Nama Lengkap *</label>
                <input
                  type="text"
                  required
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Nama Lengkap Siswa"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Email Institusi / Google SSO *</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="sija.22231001@sekolah.sch.id"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Industri Tempat PKL</label>
                <input
                  type="text"
                  value={formData.namaIndustriPkl}
                  onChange={(e) => setFormData({ ...formData, namaIndustriPkl: e.target.value })}
                  placeholder="Contoh: PT Telkom Akses"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 font-semibold focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingData}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                >
                  {savingData ? "Menyimpan..." : "Simpan Siswa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Manage Classes */}
      {isClassModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-xl w-full p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <School className="w-4 h-4 text-blue-600" />
                  <span>Manajemen Data Kelas</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Daftar rombel kelas tingkat 13 PKL SMKN 2 Depok Sleman.
                </p>
              </div>
              <button
                onClick={() => setIsClassModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {classMsg && (
              <div
                className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
                  classMsg.type === "success"
                    ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                    : "bg-rose-50 border-rose-200 text-rose-800"
                }`}
              >
                {classMsg.type === "success" ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                )}
                <span>{classMsg.text}</span>
              </div>
            )}

            {/* Add New Class Form */}
            <form onSubmit={handleAddClass} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <span className="font-bold text-slate-800 text-xs block">Tambah Rombel Kelas Baru:</span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div className="sm:col-span-2">
                  <input
                    type="text"
                    required
                    placeholder="Nama Kelas (Contoh: 13 SIJA B, 13 KA A)"
                    value={newClassName}
                    onChange={(e) => setNewClassName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <select
                    value={newClassJurusan}
                    onChange={(e) => setNewClassJurusan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="SIJA">SIJA</option>
                    <option value="KA">KA (Kimia Analisis)</option>
                    <option value="KI">KI (Kimia Industri)</option>
                    <option value="GP">GP (Geologi Pertambangan)</option>
                    <option value="LAINNYA">Lainnya</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={classSaving}
                  className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer disabled:opacity-50"
                >
                  {classSaving ? "Menyimpan..." : "+ Tambah Kelas"}
                </button>
              </div>
            </form>

            {/* Classes List Table */}
            <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 font-extrabold sticky top-0">
                  <tr className="border-b border-slate-200">
                    <th className="py-2.5 px-3">Nama Kelas</th>
                    <th className="py-2.5 px-3">Jurusan</th>
                    <th className="py-2.5 px-3 text-center">Jumlah Siswa</th>
                    <th className="py-2.5 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {classes.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-bold text-slate-900">{c.nama}</td>
                      <td className="py-2.5 px-3 text-slate-500">{c.jurusan}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px]">
                          {c.totalSiswa} Siswa
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleDeleteClass(c.id, c.nama)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                          title="Hapus Kelas"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Import Data Siswa CSV</h3>
              <button
                onClick={() => setIsCsvModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
              <p className="font-bold text-slate-800">Format Kolom Header CSV:</p>
              <code className="block p-2 rounded-lg bg-white border border-slate-200 text-slate-700 font-mono text-[11px]">
                nis,nama,email,kelas,jurusan,namaIndustriPkl
              </code>
              <p className="text-[11px] text-slate-500">
                Contoh isi kelas: <strong>13 SIJA A</strong>, <strong>13 SIJA B</strong>.
              </p>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center space-y-2 hover:border-blue-500 transition-colors">
              <UploadCloud className="w-8 h-8 text-blue-600 mx-auto" />
              <p className="text-xs font-bold text-slate-700">Pilih berkas CSV dari komputer</p>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvFileUpload}
                className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>

            {csvStatusMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold">
                {csvStatusMsg}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}