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
} from "lucide-react";
import { getSubjectDisplayName } from "@/lib/constants/subjects";

export default function AdminSiswaPage() {
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatusTka, setSelectedStatusTka] = useState("ALL");
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvStatusMsg, setCsvStatusMsg] = useState("");

  // Modal manual add/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT">("ADD");
  const [formData, setFormData] = useState({
    id: "",
    nis: "",
    nama: "",
    email: "",
    jurusan: "SIJA",
    namaIndustriPkl: "",
  });
  const [savingData, setSavingData] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const loadStudents = async () => {
    setLoading(true);
    try {
      let url = `/api/admin/siswa`;
      const queryParts = [];
      if (selectedStatusTka !== "ALL") queryParts.push(`statusTka=${selectedStatusTka}`);
      if (searchTerm) queryParts.push(`search=${encodeURIComponent(searchTerm)}`);
      if (queryParts.length > 0) url += `?${queryParts.join("&")}`;

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
    loadStudents();
  }, [selectedStatusTka]);

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
          } else {
            setCsvStatusMsg(`Gagal impor: ${data.error}`);
          }
        } catch (err: any) {
          setCsvStatusMsg(`Error: ${err.message}`);
        }
      },
    });
  };

  const handleOpenAdd = () => {
    setModalMode("ADD");
    setFormData({
      id: "",
      nis: "",
      nama: "",
      email: "",
      jurusan: "SIJA",
      namaIndustriPkl: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (s: any) => {
    setModalMode("EDIT");
    setFormData({
      id: s.id,
      nis: s.nis,
      nama: s.nama,
      email: s.email,
      jurusan: s.jurusan || "SIJA",
      namaIndustriPkl: s.namaIndustriPkl || "",
    });
    setIsModalOpen(true);
  };

  const handleSaveStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingData(true);
    setFeedbackMsg(null);

    try {
      if (modalMode === "ADD") {
        const res = await fetch("/api/admin/siswa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ student: formData }),
        });
        const data = await res.json();
        if (data.success) {
          setFeedbackMsg({ type: "success", text: data.message });
          setIsModalOpen(false);
          loadStudents();
        } else {
          setFeedbackMsg({ type: "error", text: data.error || "Gagal menambah siswa" });
        }
      } else {
        const res = await fetch("/api/admin/siswa", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        const data = await res.json();
        if (data.success) {
          setFeedbackMsg({ type: "success", text: data.message });
          setIsModalOpen(false);
          loadStudents();
        } else {
          setFeedbackMsg({ type: "error", text: data.error || "Gagal memperbarui siswa" });
        }
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message || "Terjadi kesalahan jaringan" });
    } finally {
      setSavingData(false);
    }
  };

  const handleDelete = async (s: any) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus data siswa ${s.nama} (${s.nis})?`)) return;

    try {
      const res = await fetch(`/api/admin/siswa?id=${s.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setFeedbackMsg({ type: "success", text: data.message });
        loadStudents();
      } else {
        setFeedbackMsg({ type: "error", text: data.error || "Gagal menghapus siswa" });
      }
    } catch (err: any) {
      setFeedbackMsg({ type: "error", text: err.message || "Terjadi kesalahan" });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold mb-1">
            <Users className="w-3.5 h-3.5" />
            <span>Master Data Siswa</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Data Siswa & Lokasi PKL
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Kelola data akun siswa, penempatan industri PKL, dan pemantauan status aktivasi Google SSO.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </button>

          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Import CSV</span>
          </button>
        </div>
      </div>

      {feedbackMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
            feedbackMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <span>{feedbackMsg.text}</span>
          <button onClick={() => setFeedbackMsg(null)} className="opacity-70 hover:opacity-100">
            Tutup
          </button>
        </div>
      )}

      {/* Filter & Search */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari berdasarkan NIS, Nama, atau Industri PKL..."
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
          />
        </form>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-slate-500">Status TKA:</span>
          {["ALL", "IKUT", "TIDAK_IKUT", "BELUM_MERESPONS"].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatusTka(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedStatusTka === st
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {st === "ALL" ? "Semua" : st === "IKUT" ? "Ikut" : st === "TIDAK_IKUT" ? "Tidak Ikut" : "Belum Respon"}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-extrabold text-slate-900">
            Total Siswa Terdaftar: {students.length} Siswa
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-4">NIS & Nama Siswa</th>
                <th className="p-4">Email Google Workspace</th>
                <th className="p-4">Industri Tempat PKL</th>
                <th className="p-4">Status Akun SSO</th>
                <th className="p-4">Status TKA</th>
                <th className="p-4">Mapel Pilihan</th>
                <th className="p-4 text-center">Latihan Dikerjakan</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Memuat data siswa...
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400">
                    Tidak ada data siswa yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                students.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{s.nama}</div>
                      <div className="text-[11px] font-mono text-slate-400">NIS: {s.nis}</div>
                    </td>

                    <td className="p-4 text-slate-600 font-mono text-[11px]">{s.email}</td>

                    <td className="p-4">
                      <div className="flex items-center gap-1.5 font-medium text-slate-800">
                        <Building2 className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                        <span className="truncate max-w-[170px]">{s.namaIndustriPkl}</span>
                      </div>
                    </td>

                    <td className="p-4">
                      {s.statusAkun === "AKTIF" ? (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg font-bold flex items-center gap-1 w-fit">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Aktif SSO</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-500 rounded-lg font-medium">
                          Belum Login
                        </span>
                      )}
                    </td>

                    <td className="p-4">
                      {s.statusTka === "IKUT" ? (
                        <span className="px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-200">
                          Ikut TKA
                        </span>
                      ) : s.statusTka === "TIDAK_IKUT" ? (
                        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-bold rounded-lg border border-rose-200">
                          Tidak Ikut
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-medium rounded-lg">
                          Belum Respon
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-slate-600">
                      {s.statusTka === "IKUT" && (s.mapelPilihan1 || s.mapelPilihan2) ? (
                        <div className="space-y-0.5 text-[11px]">
                          <div className="font-semibold text-slate-800">• {getSubjectDisplayName(s.mapelPilihan1)}</div>
                          <div className="text-slate-500">• {getSubjectDisplayName(s.mapelPilihan2)}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">-</span>
                      )}
                    </td>

                    <td className="p-4 text-center font-extrabold text-slate-900">
                      <span className="px-3 py-1 bg-slate-100 rounded-full">
                        {s._count?.progres || 0} Soal
                      </span>
                    </td>

                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(s)}
                          className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                          title="Edit Siswa"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(s)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
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
      </div>

      {/* Modal Add/Edit Student */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                {modalMode === "ADD" ? "Tambah Data Siswa Baru" : "Edit Data Siswa"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveStudent} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Nomor Induk Siswa (NIS)</label>
                <input
                  type="text"
                  value={formData.nis}
                  onChange={(e) => setFormData({ ...formData, nis: e.target.value })}
                  placeholder="Contoh: 22231001"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-slate-900"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Nama Lengkap Siswa</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Nama sesuai absen..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900 font-semibold"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Email Akun Google Workspace</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="nama.nis@smkn2depok.sch.id"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Konsentrasi Keahlian</label>
                  <input
                    type="text"
                    value={formData.jurusan}
                    onChange={(e) => setFormData({ ...formData, jurusan: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-slate-800"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Industri Tempat PKL</label>
                  <input
                    type="text"
                    value={formData.namaIndustriPkl}
                    onChange={(e) => setFormData({ ...formData, namaIndustriPkl: e.target.value })}
                    placeholder="Nama instansi/PT..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-slate-900"
                    required
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingData}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                >
                  {savingData ? "Menyimpan..." : "Simpan Siswa"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-5 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h2 className="font-extrabold text-slate-900 text-base">
                Import Data Siswa (CSV)
              </h2>
              <button onClick={() => setIsCsvModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Upload file CSV berisi data siswa sekolah. Header kolom yang didukung:{" "}
              <code className="bg-slate-100 px-1 py-0.5 rounded font-mono font-bold">
                nis, nama, email, jurusan, namaIndustriPkl
              </code>
            </p>

            {csvStatusMsg && (
              <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl font-bold">
                {csvStatusMsg}
              </div>
            )}

            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center space-y-2 hover:border-blue-500 transition-colors">
              <UploadCloud className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-xs font-bold text-slate-700">Pilih file CSV dari komputer</div>
              <input
                type="file"
                accept=".csv"
                onChange={handleCsvFileUpload}
                className="text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}