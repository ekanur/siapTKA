"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  ShieldCheck,
  UserCheck,
  UserPlus,
  Edit2,
  Trash2,
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  GraduationCap,
  Lock,
} from "lucide-react";

export default function MasterPenggunaPage() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as any)?.id;

  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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

  const handleOpenAdd = () => {
    setModalMode("ADD");
    setFormData({
      id: "",
      nama: "",
      email: "",
      username: "",
      role: "GURU",
      mapel: "MATEMATIKA",
      password: "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: any) => {
    setModalMode("EDIT");
    setFormData({
      id: u.id,
      nama: u.nama,
      email: u.email,
      username: u.username,
      role: u.role,
      mapel: u.mapel || "MATEMATIKA",
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

  const filteredUsers = users.filter((u) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      u.nama.toLowerCase().includes(term) ||
      u.email.toLowerCase().includes(term) ||
      u.username.toLowerCase().includes(term) ||
      (u.mapel && u.mapel.toLowerCase().includes(term))
    );
  });

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Master Pengguna Sekolah</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Manajemen Akun Administrator & Guru Mapel
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Daftarkan email Google Workspace staf pengajar. Hak akses modul dan kurasi bank soal akan dibatasi secara otomatis sesuai mata pelajaran yang diampu masing-masing guru.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5 cursor-pointer w-fit"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </button>
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

      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nama, email, username, atau mapel..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <span className="text-xs text-slate-500 font-semibold">{filteredUsers.length} Pengguna</span>
      </div>

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
                filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 font-bold text-slate-900 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 font-extrabold text-[11px]">
                        {u.nama.charAt(0)}
                      </div>
                      <span>{u.nama}</span>
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

                    <td className="p-4 font-bold text-slate-700">
                      {u.role === "GURU" ? (
                        <span className="px-2 py-0.5 bg-slate-100 rounded text-[11px]">
                          {u.mapel || "Belum Ditentukan"}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic font-normal">Akses Seluruh Mapel</span>
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
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-extrabold text-slate-900 text-base">
                {modalMode === "ADD" ? "Tambah Akun Pengguna" : "Edit Akun Pengguna"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Nama Lengkap & Gelar</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                  placeholder="Dra. Siti Rahmawati, M.Pd"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-medium text-slate-900"
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
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-slate-900"
                  required
                />
                <span className="text-[10px] text-slate-400">Digunakan untuk login otomatis lewat tombol Masuk dengan Google.</span>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">Username</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="guru_mapel"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-slate-900"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">Peran (Role)</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 bg-white"
                  >
                    <option value="GURU">GURU MAPEL</option>
                    <option value="ADMIN">ADMINISTRATOR</option>
                  </select>
                </div>

                {formData.role === "GURU" && (
                  <div className="space-y-1">
                    <label className="font-bold text-slate-700 block">Mata Pelajaran</label>
                    <select
                      value={formData.mapel}
                      onChange={(e) => setFormData({ ...formData, mapel: e.target.value })}
                      className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-bold text-slate-900 bg-white"
                    >
                      <option value="MATEMATIKA">Matematika</option>
                      <option value="BAHASA_INDONESIA">Bahasa Indonesia</option>
                      <option value="BAHASA_INGGRIS">Bahasa Inggris</option>
                      <option value="PPLG">Kejuruan PPLG</option>
                      <option value="AIJ">Kejuruan AIJ</option>
                    </select>
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 block">
                  Password Login Manual {modalMode === "EDIT" && "(Kosongkan jika tidak diubah)"}
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 font-mono text-slate-900"
                  required={modalMode === "ADD"}
                />
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
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Menyimpan..." : "Simpan Pengguna"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
