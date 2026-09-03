"use client";

import React, { useState, useEffect } from "react";
import {
  Clock,
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Info,
} from "lucide-react";

export default function LiniMasaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isKonfirmasiOpen, setIsKonfirmasiOpen] = useState(true);
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [pesanPengumuman, setPesanPengumuman] = useState("");
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/lini-masa");
      const data = await res.json();
      if (data.success && data.settings) {
        setIsKonfirmasiOpen(data.settings.isKonfirmasiOpen);
        if (data.settings.tanggalMulai) {
          setTanggalMulai(new Date(data.settings.tanggalMulai).toISOString().slice(0, 16));
        }
        if (data.settings.tanggalSelesai) {
          setTanggalSelesai(new Date(data.settings.tanggalSelesai).toISOString().slice(0, 16));
        }
        setPesanPengumuman(data.settings.pesanPengumuman || "");
      }
    } catch (err) {
      console.error(err);
      setStatusMsg({ type: "error", text: "Gagal memuat pengaturan lini masa." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      const res = await fetch("/api/admin/lini-masa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isKonfirmasiOpen,
          tanggalMulai: tanggalMulai || null,
          tanggalSelesai: tanggalSelesai || null,
          pesanPengumuman,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: "success", text: "Pengaturan lini masa konfirmasi TKA berhasil disimpan." });
      } else {
        setStatusMsg({ type: "error", text: data.error || "Gagal menyimpan pengaturan." });
      }
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Terjadi kesalahan jaringan." });
    } finally {
      setSaving(false);
    }
  };

  const isPeriodActive = () => {
    if (!isKonfirmasiOpen) return false;
    const now = new Date();
    if (tanggalMulai && now < new Date(tanggalMulai)) return false;
    if (tanggalSelesai && now > new Date(tanggalSelesai)) return false;
    return true;
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold mb-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Pengaturan Waktu Akses</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Lini Masa Konfirmasi Keikutsertaan TKA
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Atur rentang waktu pendaftaran konfirmasi dan pemilihan mata pelajaran pilihan bagi siswa. Di luar rentang waktu ini, formulir konfirmasi siswa akan otomatis terkunci.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-2.5 ${
            statusMsg.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-rose-50 border-rose-200 text-rose-800"
          }`}
        >
          {statusMsg.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Status Sistem Saat Ini
          </span>
          <div className="flex items-center gap-3">
            <span
              className={`w-3.5 h-3.5 rounded-full animate-pulse ${
                isPeriodActive() ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <span className="text-lg font-extrabold text-slate-900">
              {isPeriodActive() ? "Pendaftaran DIBUKA" : "Pendaftaran DITUTUP"}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isPeriodActive()
              ? "Siswa saat ini dapat mengisi atau mengubah konfirmasi keikutsertaan dan 2 mapel pilihan."
              : "Formulir konfirmasi siswa saat ini terkunci (mode hanya-baca)."}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Tanggal Dibuka
          </span>
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Calendar className="w-4 h-4 text-blue-600" />
            <span>{tanggalMulai ? new Date(tanggalMulai).toLocaleString("id-ID") : "Belum Diatur"}</span>
          </div>
          <p className="text-[11px] text-slate-400">Waktu mulai siswa dapat merespons.</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Batas Akhir (Deadline)
          </span>
          <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
            <Calendar className="w-4 h-4 text-rose-600" />
            <span>{tanggalSelesai ? new Date(tanggalSelesai).toLocaleString("id-ID") : "Belum Diatur"}</span>
          </div>
          <p className="text-[11px] text-slate-400">Waktu penutupan resmi pendaftaran.</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Saklar Utama Pendaftaran (Master Switch)</span>
              </span>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                Matikan saklar ini jika Anda ingin menutup akses konfirmasi seketika (darurat/penutupan lebih awal), terlepas dari tanggal yang telah dijadwalkan.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsKonfirmasiOpen(!isKonfirmasiOpen)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                isKonfirmasiOpen
                  ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/20"
                  : "bg-slate-300 text-slate-700"
              }`}
            >
              {isKonfirmasiOpen ? (
                <>
                  <ToggleRight className="w-5 h-5" />
                  <span>STATUS: DIBUKA</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5" />
                  <span>STATUS: DITUTUP</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>Waktu Mulai Pendaftaran</span>
              </label>
              <input
                type="datetime-local"
                value={tanggalMulai}
                onChange={(e) => setTanggalMulai(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
              <span className="text-[11px] text-slate-400">Kosongkan jika ingin langsung dibuka sekarang.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-600" />
                <span>Waktu Batas Akhir (Deadline)</span>
              </label>
              <input
                type="datetime-local"
                value={tanggalSelesai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
              <span className="text-[11px] text-slate-400">Form akan otomatis terkunci begitu melewati waktu ini.</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>Pesan Pengumuman untuk Siswa</span>
            </label>
            <textarea
              rows={3}
              value={pesanPengumuman}
              onChange={(e) => setPesanPengumuman(e.target.value)}
              placeholder="Contoh: Periode konfirmasi keikutsertaan TKA dan pemilihan mapel pilihan dibuka sampai 30 September 2026..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-[11px] text-slate-400">
              Pesan ini akan ditampilkan sebagai informasi pengingat di bagian atas halaman konfirmasi siswa.
            </span>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? "Menyimpan..." : "Simpan Pengaturan Lini Masa"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
