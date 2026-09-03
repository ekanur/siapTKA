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
  Layers,
  Sparkles,
} from "lucide-react";

export default function LiniMasaPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isKonfirmasiOpen, setIsKonfirmasiOpen] = useState(true);
  const [tanggalMulai, setTanggalMulai] = useState("");
  const [tanggalSelesai, setTanggalSelesai] = useState("");
  const [pesanPengumuman, setPesanPengumuman] = useState("");

  // 6 Milestones
  const [batasSuratPernyataan, setBatasSuratPernyataan] = useState("10 September 2026");
  const [pendaftaranSistemTka, setPendaftaranSistemTka] = useState("27 Juli – 27 September 2026 (* dilakukan sekolah)");
  const [simulasiTka, setSimulasiTka] = useState("21 – 27 September 2026");
  const [gladiBersihTka, setGladiBersihTka] = useState("5 – 18 Oktober 2026");
  const [pelaksanaanGel1, setPelaksanaanGel1] = useState("26 – 29 Oktober 2026");
  const [pelaksanaanGel2, setPelaksanaanGel2] = useState("2 – 5 November 2026");

  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/lini-masa");
      const data = await res.json();
      if (data.success && data.settings) {
        const s = data.settings;
        setIsKonfirmasiOpen(s.isKonfirmasiOpen);
        if (s.tanggalMulai) {
          setTanggalMulai(new Date(s.tanggalMulai).toISOString().slice(0, 16));
        }
        if (s.tanggalSelesai) {
          setTanggalSelesai(new Date(s.tanggalSelesai).toISOString().slice(0, 16));
        }
        setPesanPengumuman(s.pesanPengumuman || "");
        if (s.batasSuratPernyataan) setBatasSuratPernyataan(s.batasSuratPernyataan);
        if (s.pendaftaranSistemTka) setPendaftaranSistemTka(s.pendaftaranSistemTka);
        if (s.simulasiTka) setSimulasiTka(s.simulasiTka);
        if (s.gladiBersihTka) setGladiBersihTka(s.gladiBersihTka);
        if (s.pelaksanaanGel1) setPelaksanaanGel1(s.pelaksanaanGel1);
        if (s.pelaksanaanGel2) setPelaksanaanGel2(s.pelaksanaanGel2);
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
          batasSuratPernyataan,
          pendaftaranSistemTka,
          simulasiTka,
          gladiBersihTka,
          pelaksanaanGel1,
          pelaksanaanGel2,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: "success", text: "Seluruh jadwal linimasa dan pengaturan akses berhasil disimpan." });
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
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold mb-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Pengaturan Lini Masa & Agenda Sekolah</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Lini Masa & Jadwal Pelaksanaan TKA 2026
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Kelola agenda resmi pelaksanaan TKA sekolah, batas pengumpulan surat pernyataan, dan sinkronisasi otomatis ke landing page serta halaman siswa.
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

      {/* Real-time Status Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Status Pendaftaran Siswa
          </span>
          <div className="flex items-center gap-3">
            <span
              className={`w-3.5 h-3.5 rounded-full animate-pulse ${
                isPeriodActive() ? "bg-emerald-500" : "bg-rose-500"
              }`}
            />
            <span className="text-lg font-extrabold text-slate-900">
              {isPeriodActive() ? "Sistem DIBUKA" : "Sistem DITUTUP"}
            </span>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed">
            {isPeriodActive()
              ? "Siswa saat ini dapat mengisi atau mengubah konfirmasi keikutsertaan dan mapel pilihan."
              : "Formulir konfirmasi siswa saat ini terkunci (mode hanya-baca)."}
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Batas Pengumpulan Berkas
          </span>
          <div className="text-slate-900 font-extrabold text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{batasSuratPernyataan}</span>
          </div>
          <p className="text-[11px] text-slate-500">Batas akhir siswa memilih & mengubah mapel.</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Pendaftaran Sistem TKA
          </span>
          <div className="text-slate-900 font-bold text-sm flex items-center gap-2">
            <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="truncate">{pendaftaranSistemTka}</span>
          </div>
          <p className="text-[11px] text-slate-400">* Dilakukan pihak sekolah</p>
        </div>
      </div>

      {/* Main Form */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* Section 1: Master Switch & Form Cutoff */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span>Kontrol Akses Pendaftaran Siswa</span>
          </h3>

          <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="font-bold text-slate-900 text-xs sm:text-sm">
                Saklar Utama Pendaftaran (Master Switch)
              </span>
              <p className="text-xs text-slate-500 leading-relaxed max-w-xl">
                Matikan saklar ini jika Anda ingin menutup akses konfirmasi seketika (darurat/penutupan lebih awal), terlepas dari tanggal yang telah dijadwalkan.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsKonfirmasiOpen(!isKonfirmasiOpen)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
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
              <span className="text-[11px] text-slate-400">Default: 27 Juli 2026</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-rose-600" />
                <span>Waktu Batas Akhir Sistem (Deadline Cutoff)</span>
              </label>
              <input
                type="datetime-local"
                value={tanggalSelesai}
                onChange={(e) => setTanggalSelesai(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
              <span className="text-[11px] text-slate-400">Default: 10 September 2026 23:59 WIB</span>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>Pesan Pengumuman Pengingat untuk Siswa</span>
            </label>
            <textarea
              rows={2}
              value={pesanPengumuman}
              onChange={(e) => setPesanPengumuman(e.target.value)}
              placeholder="Contoh: Batas pengumpulan surat pernyataan dan perubahan pilihan mapel TKA adalah 10 September 2026."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Section 2: 6 Official School Milestones */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Format Linimasa Pelaksanaan TKA Sekolah</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Teks rentang waktu di bawah akan disinkronkan langsung ke Landing Page publik dan Halaman Konfirmasi Siswa.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* 1 */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-blue-50/50 border border-blue-200/80">
              <label className="font-bold text-blue-950 block">
                1. Batas Pengumpulan Surat Pernyataan & Pas Foto
              </label>
              <input
                type="text"
                value={batasSuratPernyataan}
                onChange={(e) => setBatasSuratPernyataan(e.target.value)}
                placeholder="10 September 2026"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                required
              />
              <span className="text-[10px] text-blue-700">Batas akhir siswa mengisi & mengubah pilihan TKA.</span>
            </div>

            {/* 2 */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <label className="font-bold text-slate-800 block">
                2. Pendaftaran Peserta ke Sistem TKA (* Sekolah)
              </label>
              <input
                type="text"
                value={pendaftaranSistemTka}
                onChange={(e) => setPendaftaranSistemTka(e.target.value)}
                placeholder="27 Juli – 27 September 2026 (* dilakukan sekolah)"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                required
              />
              <span className="text-[10px] text-slate-500">Pendaftaran resmi oleh pihak operator sekolah.</span>
            </div>

            {/* 3 */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <label className="font-bold text-slate-800 block">
                3. Simulasi TKA
              </label>
              <input
                type="text"
                value={simulasiTka}
                onChange={(e) => setSimulasiTka(e.target.value)}
                placeholder="21 – 27 September 2026"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                required
              />
              <span className="text-[10px] text-slate-500">Uji coba sistem dan jaringan.</span>
            </div>

            {/* 4 */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
              <label className="font-bold text-slate-800 block">
                4. Gladi Bersih TKA
              </label>
              <input
                type="text"
                value={gladiBersihTka}
                onChange={(e) => setGladiBersihTka(e.target.value)}
                placeholder="5 – 18 Oktober 2026"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                required
              />
              <span className="text-[10px] text-slate-500">Simulasi skala penuh menyerupai ujian resmi.</span>
            </div>

            {/* 5 */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80">
              <label className="font-bold text-amber-950 block">
                5. Pelaksanaan Gelombang 1
              </label>
              <input
                type="text"
                value={pelaksanaanGel1}
                onChange={(e) => setPelaksanaanGel1(e.target.value)}
                placeholder="26 – 29 Oktober 2026"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
                required
              />
              <span className="text-[10px] text-amber-700">Ujian TKA Gelombang 1.</span>
            </div>

            {/* 6 */}
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-amber-50/50 border border-amber-200/80">
              <label className="font-bold text-amber-950 block">
                6. Pelaksanaan Gelombang 2
              </label>
              <input
                type="text"
                value={pelaksanaanGel2}
                onChange={(e) => setPelaksanaanGel2(e.target.value)}
                placeholder="2 – 5 November 2026"
                className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
                required
              />
              <span className="text-[10px] text-amber-700">Ujian TKA Gelombang 2.</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Menyimpan..." : "Simpan Seluruh Pengaturan Lini Masa"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
