"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useSession } from "next-auth/react";
import { notFound } from "next/navigation";
import {
  ShieldCheck,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  GraduationCap,
  BookOpen,
  Sparkles,
  Info,
  Check,
  UploadCloud,
  FileSpreadsheet,
} from "lucide-react";
import Papa from "papaparse";
import {
  MAPEL_WAJIB,
  MAPEL_PILIHAN_GROUPS,
  getSubjectDisplayName,
  getSubjectCategoryInfo,
  SUBJECT_ALIASES,
} from "@/lib/constants/subjects";

export default function MasterPenggunaPage() {
  const { data: session, status: authStatus } = useSession();
  const userRole = (session?.user as any)?.role;
  const currentUserId = (session?.user as any)?.id;

  if (authStatus === "loading") {
    return <div className="p-8 text-center text-xs text-slate-400">Memverifikasi hak akses...</div>;
  }

  if (userRole === "GURU") {
    notFound();
  }

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | "GURU" | "ADMIN">("ALL");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"ADD" | "EDIT">("ADD");
  const [formData, setFormData] = useState({
    id: "",
    nama: "",
    email: "",
    username: "",
    role: "GURU",
    mapel: "MATEMATIKA",
    password: "",
  });
  const [saving, setSaving] = useState(false);

  // CSV Import State for Guru & Staf
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [csvStatusMsg, setCsvStatusMsg] = useState("");
  const [csvUploading, setCsvUploading] = useState(false);

  const handleCsvFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvStatusMsg("Menganalisis berkas CSV...");
    setCsvUploading(true);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const parsedData = results.data as any[];
          if (!parsedData || parsedData.length === 0) {
            setCsvStatusMsg("Berkas CSV kosong atau format tidak valid.");
            setCsvUploading(false);
            return;
          }

          setCsvStatusMsg(`Mengimpor ${parsedData.length} data guru dan staf...`);

          const res = await fetch("/api/admin/pengguna", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ users: parsedData }),
          });

          const data = await res.json();
          if (data.success) {
            setCsvStatusMsg(`Berhasil! ${data.count} akun berhasil diimpor/disinkronkan.`);
            fetchUsers();
            setTimeout(() => {
              setIsCsvModalOpen(false);
              setCsvStatusMsg("");
            }, 1800);
          } else {
            setCsvStatusMsg(`Gagal: ${data.error || "Gagal mengimpor data"}`);
          }
        } catch (err: any) {
          setCsvStatusMsg(`Gagal: ${err.message || "Terjadi kesalahan jaringan"}`);
        } finally {
          setCsvUploading(false);
        }
      },
      error: (err) => {
        setCsvStatusMsg(`Gagal membaca CSV: ${err.message}`);
        setCsvUploading(false);
      },
    });
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/pengguna");
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      } else {
        setStatusMsg({ type: "error", text: data.error || "Gagal memuat pengguna" });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Terjadi kesalahan jaringan" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleOpenAdd = (initialRole: "GURU" | "ADMIN" = "GURU") => {
    setModalMode("ADD");
    setFormData({
      id: "",
      nama: "",
      email: "",
      username: "",
      role: initialRole,
      mapel: "MATEMATIKA",
      password: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: any) => {
    setModalMode("EDIT");
    let currentMapel = (u.mapel || "MATEMATIKA").toUpperCase().trim();
    if (SUBJECT_ALIASES[currentMapel]) {
      currentMapel = SUBJECT_ALIASES[currentMapel];
    }
    setFormData({
      id: u.id,
      nama: u.nama,
      email: u.email,
      username: u.username,
      role: u.role,
      mapel: currentMapel,
      password: "",
    });
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      const method = modalMode === "ADD" ? "POST" : "PUT";
      const res = await fetch("/api/admin/pengguna", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: "success", text: data.message });
        setIsModalOpen(false);
        fetchUsers();
      } else {
        setStatusMsg({ type: "error", text: data.error || "Gagal menyimpan data" });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Terjadi kesalahan jaringan" });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: any) => {
    if (u.id === currentUserId) {
      alert("Anda tidak dapat menghapus akun Anda sendiri yang sedang aktif.");
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin menghapus akun ${u.nama} (${u.role})?`)) return;

    try {
      const res = await fetch(`/api/admin/pengguna?id=${u.id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: "success", text: data.message });
        fetchUsers();
      } else {
        setStatusMsg({ type: "error", text: data.error || "Gagal menghapus akun" });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Terjadi kesalahan" });
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== "ALL" && u.role !== roleFilter) return false;
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const namaMatch = u.nama?.toLowerCase().includes(term);
      const emailMatch = u.email?.toLowerCase().includes(term);
      const usernameMatch = u.username?.toLowerCase().includes(term);
      const mapelCodeMatch = u.mapel && u.mapel.toLowerCase().includes(term);
      const mapelNameMatch =
        u.mapel && getSubjectDisplayName(u.mapel).toLowerCase().includes(term);
      return namaMatch || emailMatch || usernameMatch || mapelCodeMatch || mapelNameMatch;
    });
  }, [users, roleFilter, searchTerm]);

  const selectedSubjectInfo = useMemo(() => {
    return getSubjectCategoryInfo(formData.mapel);
  }, [formData.mapel]);


  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Master Staf & Guru</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Akun Administrator & Guru Mapel
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftarkan email Google Workspace staf pengajar. Hak akses modul, validasi, dan analisis butir soal dibatasi secara otomatis sesuai mata pelajaran yang diampu masing-masing guru (3 Mapel Wajib + 69 Mapel Pilihan TKA).
          </p>
        </div>

        {/* Primary and Secondary Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setIsCsvModalOpen(true)}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <UploadCloud className="w-4 h-4 text-emerald-600" />
            <span>Import CSV Guru</span>
          </button>
          <button
            onClick={() => handleOpenAdd("GURU")}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer"
          >
            <GraduationCap className="w-4 h-4" />
            <span>Tambah Guru Mata Pelajaran</span>
          </button>
          <button
            onClick={() => handleOpenAdd("ADMIN")}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4 text-purple-600" />
            <span>Tambah Admin</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-between ${
            statusMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          <span>{statusMsg.text}</span>
          <button onClick={() => setStatusMsg(null)} className="opacity-70 hover:opacity-100 cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-fit flex-wrap">
          <button
            onClick={() => setRoleFilter("ALL")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              roleFilter === "ALL"
                ? "bg-white text-slate-900 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Semua ({users.length})
          </button>
          <button
            onClick={() => setRoleFilter("GURU")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              roleFilter === "GURU"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Guru Mapel ({users.filter((u) => u.role === "GURU").length})</span>
          </button>
          <button
            onClick={() => setRoleFilter("ADMIN")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              roleFilter === "ADMIN"
                ? "bg-white text-purple-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Admin ({users.filter((u) => u.role === "ADMIN").length})</span>
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, email, username, mapel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[10px] uppercase tracking-wider">
              <tr>
                <th className="p-4">Nama Lengkap</th>
                <th className="p-4">Email Google Workspace</th>
                <th className="p-4">Username</th>
                <th className="p-4">Peran (Role)</th>
                <th className="p-4">Mata Pelajaran yang Diampu</th>
                <th className="p-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Memuat data staf...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400">
                    Tidak ada data staf yang cocok.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => {
                  const subInfo = u.mapel ? getSubjectCategoryInfo(u.mapel) : null;
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-xs shrink-0 ${
                          u.role === "ADMIN"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-blue-100 text-blue-700"
                        }`}>
                          {u.nama.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{u.nama}</div>
                          <div className="text-[10px] text-slate-400">ID: {u.id.slice(-6)}</div>
                        </div>
                      </td>

                      <td className="p-4 font-mono text-[11px] text-slate-600">{u.email}</td>

                      <td className="p-4 font-mono text-[11px] text-slate-500">@{u.username}</td>

                      <td className="p-4">
                        {u.role === "ADMIN" ? (
                          <span className="px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg font-bold text-[11px] flex items-center gap-1 w-fit">
                            <ShieldCheck className="w-3 h-3" />
                            <span>ADMINISTRATOR</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg font-bold text-[11px] flex items-center gap-1 w-fit">
                            <GraduationCap className="w-3 h-3" />
                            <span>GURU MAPEL</span>
                          </span>
                        )}
                      </td>

                      <td className="p-4">
                        {u.role === "GURU" ? (
                          <div className="space-y-1">
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                              <BookOpen className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                              <span>{getSubjectDisplayName(u.mapel)}</span>
                            </div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded font-mono text-[10px] font-bold">
                                {u.mapel}
                              </span>
                              {subInfo && (
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                                    subInfo.group === "WAJIB"
                                      ? "bg-blue-50 text-blue-700 border border-blue-200"
                                      : subInfo.group === "SMK"
                                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                                      : "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  }`}
                                >
                                  {subInfo.groupLabel} • {subInfo.category}
                                </span>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-[11px] font-bold">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Akses Penuh Seluruh Mapel</span>
                          </span>
                        )}
                      </td>

                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEdit(u)}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all cursor-pointer"
                            title="Edit Pengguna"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            disabled={u.id === currentUserId}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                            title={u.id === currentUserId ? "Akun Anda sendiri" : "Hapus Pengguna"}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah / Edit Pengguna */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                  formData.role === "GURU"
                    ? "bg-blue-100 text-blue-700"
                    : "bg-purple-100 text-purple-700"
                }`}>
                  {formData.role === "GURU" ? (
                    <GraduationCap className="w-5 h-5" />
                  ) : (
                    <ShieldCheck className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">
                    {modalMode === "ADD"
                      ? formData.role === "GURU"
                        ? "Tambah Guru Mata Pelajaran"
                        : "Tambah Administrator Sekolah"
                      : formData.role === "GURU"
                      ? "Edit Guru Mata Pelajaran"
                      : "Edit Administrator Sekolah"}
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    {formData.role === "GURU"
                      ? "Pilih mata pelajaran yang diampu untuk pembatasan modul soal TKA."
                      : "Administrator memiliki akses penuh ke seluruh modul sistem."}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Dra. Siti Rahmawati, M.Pd"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-medium text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Email Google Workspace Sekolah</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="guru.mapel@smkn2depok.sch.id"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
                <span className="text-[10px] text-slate-400">
                  Digunakan untuk login cepat lewat tombol Masuk dengan Google.
                </span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="guru_mapel"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Peran Pengguna (Role)</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="GURU">GURU MATA PELAJARAN (Akses Terbatas Sesuai Mapel)</option>
                  <option value="ADMIN">ADMINISTRATOR (Akses Penuh Seluruh Sistem)</option>
                </select>
              </div>

              {/* Subject Selection for GURU */}
              {formData.role === "GURU" && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 block">
                      Mata Pelajaran yang Diampu
                    </label>
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                      3 Wajib & 69 Pilihan TKA
                    </span>
                  </div>

                  <select
                    value={formData.mapel}
                    onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-900 bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <optgroup label="🌟 Mata Pelajaran Wajib TKA (3 Mapel)">
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
                            {sub.name} ({sub.category})
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>

                  {/* Selected Subject Preview Card */}
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-600">Rumpun Mapel:</span>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                          selectedSubjectInfo.group === "WAJIB"
                            ? "bg-blue-100 text-blue-800"
                            : selectedSubjectInfo.group === "SMK"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-800"
                        }`}
                      >
                        {selectedSubjectInfo.groupLabel} • {selectedSubjectInfo.category}
                      </span>
                    </div>
                    <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                      <span>{getSubjectDisplayName(formData.mapel)}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      Akun guru ini akan secara otomatis dibatasi untuk memvalidasi butir soal, membuat/menginput soal mandiri, serta melihat statistik analisis butir soal pada mata pelajaran ini.
                    </p>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Password Login Manual {modalMode === "EDIT" && "(Kosongkan jika tidak diubah)"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                  required={modalMode === "ADD"}
                />
              </div>

              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                >
                  {saving
                    ? "Menyimpan..."
                    : modalMode === "ADD"
                    ? formData.role === "GURU"
                      ? "Simpan Guru Mapel"
                      : "Simpan Administrator"
                    : "Perbarui Data"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CSV Import Modal for Guru & Staf */}
      {isCsvModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">Import Data Guru & Staf CSV</h3>
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
                nama,email,username,password,role,mapel
              </code>
              <p className="text-[11px] text-slate-500">
                Kolom <strong>role</strong>: <code className="text-slate-700 font-semibold">GURU</code> atau <code className="text-slate-700 font-semibold">ADMIN</code>.<br />
                Kolom <strong>mapel</strong>: Sesuai kode/nama mapel (contoh: <code className="text-slate-700 font-semibold">PPLG</code>, <code className="text-slate-700 font-semibold">MATEMATIKA</code>, <code className="text-slate-700 font-semibold">TJKT</code>, dsb).
              </p>
            </div>

            <div className="flex items-center justify-between gap-2 p-3 bg-blue-50/70 border border-blue-100 rounded-2xl">
              <div className="flex items-center gap-2 text-xs font-semibold text-blue-900">
                <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                <span>Belum punya format berkas?</span>
              </div>
              <a
                href="/api/admin/template-csv?type=guru"
                download="template_guru.csv"
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-xs"
              >
                Unduh Template CSV
              </a>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center space-y-2 hover:border-blue-500 transition-colors">
              <UploadCloud className="w-8 h-8 text-blue-600 mx-auto" />
              <p className="text-xs font-bold text-slate-700">Pilih berkas CSV dari komputer</p>
              <input
                type="file"
                accept=".csv"
                disabled={csvUploading}
                onChange={handleCsvFileUpload}
                className="text-xs text-slate-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer disabled:opacity-50"
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

