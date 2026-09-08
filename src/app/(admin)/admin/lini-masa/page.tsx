"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { notFound } from "next/navigation";
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
  Check,
} from "lucide-react";
import {
  formatDateIndo,
  formatDateRangeIndo,
  getMilestoneStatus,
  toInputDateString,
} from "@/lib/utils/timeline-helpers";

export default function LiniMasaPage() {
  const { data: session, status: authStatus } = useSession();
  const userRole = (session?.user as any)?.role;

  if (authStatus === "loading") {
    return <div className="p-8 text-center text-xs text-slate-400">Memverifikasi hak akses...</div>;
  }

  if (userRole === "GURU") {
    notFound();
  }
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isKonfirmasiOpen, setIsKonfirmasiOpen] = useState(true);
  const [pesanPengumuman, setPesanPengumuman] = useState("");

  // 6 Agenda Dates as YYYY-MM-DD
  const [batasSuratPernyataan, setBatasSuratPernyataan] = useState("2026-09-10");
  const [pendaftaranMulai, setPendaftaranMulai] = useState("2026-07-27");
  const [pendaftaranSelesai, setPendaftaranSelesai] = useState("2026-09-27");
  const [simulasiMulai, setSimulasiMulai] = useState("2026-09-21");
  const [simulasiSelesai, setSimulasiSelesai] = useState("2026-09-27");
  const [gladiMulai, setGladiMulai] = useState("2026-10-05");
  const [gladiSelesai, setGladiSelesai] = useState("2026-10-18");
  const [gelombang1Mulai, setGelombang1Mulai] = useState("2026-10-26");
  const [gelombang1Selesai, setGelombang1Selesai] = useState("2026-10-29");
  const [gelombang2Mulai, setGelombang2Mulai] = useState("2026-11-02");
  const [gelombang2Selesai, setGelombang2Selesai] = useState("2026-11-05");

  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/lini-masa");
      const data = await res.json();
      if (data.success && data.settings) {
        const s = data.settings;
        setIsKonfirmasiOpen(s.isKonfirmasiOpen);
        setPesanPengumuman(s.pesanPengumuman || "");
        if (s.batasSuratPernyataan) setBatasSuratPernyataan(toInputDateString(s.batasSuratPernyataan));
        if (s.pendaftaranMulai) setPendaftaranMulai(toInputDateString(s.pendaftaranMulai));
        if (s.pendaftaranSelesai) setPendaftaranSelesai(toInputDateString(s.pendaftaranSelesai));
        if (s.simulasiMulai) setSimulasiMulai(toInputDateString(s.simulasiMulai));
        if (s.simulasiSelesai) setSimulasiSelesai(toInputDateString(s.simulasiSelesai));
        if (s.gladiMulai) setGladiMulai(toInputDateString(s.gladiMulai));
        if (s.gladiSelesai) setGladiSelesai(toInputDateString(s.gladiSelesai));
        if (s.gelombang1Mulai) setGelombang1Mulai(toInputDateString(s.gelombang1Mulai));
        if (s.gelombang1Selesai) setGelombang1Selesai(toInputDateString(s.gelombang1Selesai));
        if (s.gelombang2Mulai) setGelombang2Mulai(toInputDateString(s.gelombang2Mulai));
        if (s.gelombang2Selesai) setGelombang2Selesai(toInputDateString(s.gelombang2Selesai));
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
          pesanPengumuman,
          batasSuratPernyataan,
          pendaftaranMulai,
          pendaftaranSelesai,
          simulasiMulai,
          simulasiSelesai,
          gladiMulai,
          gladiSelesai,
          gelombang1Mulai,
          gelombang1Selesai,
          gelombang2Mulai,
          gelombang2Selesai,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({ type: "success", text: "Seluruh tanggal agenda linimasa TKA berhasil disimpan." });
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
    if (batasSuratPernyataan) {
      const deadline = new Date(batasSuratPernyataan);
      deadline.setHours(23, 59, 59, 999);
      if (now > deadline) return false;
    }
    return true;
  };

  const renderStatusBadge = (status: "BERLANGSUNG" | "SELESAI" | "MENDATANG") => {
    if (status === "BERLANGSUNG") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
          <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
          <span>SEDANG BERLANGSUNG</span>
        </span>
      );
    }
    if (status === "SELESAI") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">
          <Check className="w-3 h-3 text-slate-400" />
          <span>SUDAH BERLALU</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
        <Clock className="w-3 h-3 text-amber-600" />
        <span>AKAN DATANG</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold mb-1.5">
          <Clock className="w-3.5 h-3.5" />
          <span>Pengaturan Lini Masa Berbasis Tanggal</span>
        </div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
          Kelola Jadwal & Linimasa Pelaksanaan TKA 2026
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Gunakan input pemilih tanggal (*date picker*) untuk meminimalisasi kesalahan format. Batas pengumpulan otomatis memvalidasi kuncian formulir siswa di halaman konfirmasi.
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

      {/* Real-time Status Counter Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Status Form Konfirmasi Siswa
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
            Batas Akhir Siswa (Deadline Cutoff)
          </span>
          <div className="text-slate-900 font-extrabold text-base flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600 shrink-0" />
            <span>{formatDateIndo(batasSuratPernyataan)}</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Formulir siswa terkunci otomatis setelah pukul 23:59 WIB pada tanggal ini.
          </p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Rentang Pendaftaran Sistem
          </span>
          <div className="text-slate-900 font-bold text-xs flex items-center gap-1.5 pt-1">
            <Clock className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{formatDateRangeIndo(pendaftaranMulai, pendaftaranSelesai)}</span>
          </div>
          <p className="text-[11px] text-slate-400">* Dilakukan pihak operator sekolah</p>
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

        {/* Section 2: 6 Agenda Form with Date Pickers */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Jadwal 6 Agenda Pelaksanaan TKA Sekolah</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Input menggunakan tanggal resmi (date picker). Sistem akan memformat tanggal ke Bahasa Indonesia secara otomatis di Landing Page publik dan Halaman Siswa.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            {/* 1. Batas Surat Pernyataan */}
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-blue-950 text-sm block">
                    1. Batas Pengumpulan Surat Pernyataan & Unggah Pas Foto Terbaru
                  </span>
                  <p className="text-[11px] text-blue-700 mt-0.5">
                    Batas akhir bagi siswa untuk mengisi atau mengubah pilihan mata pelajaran TKA di sistem.
                  </p>
                </div>
                {renderStatusBadge(getMilestoneStatus(pendaftaranMulai, batasSuratPernyataan))}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-full sm:w-64">
                  <input
                    type="date"
                    value={batasSuratPernyataan}
                    onChange={(e) => setBatasSuratPernyataan(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    required
                  />
                </div>
                <div className="text-xs font-bold text-blue-900">
                  Format Tampilan: <span className="underline">{formatDateIndo(batasSuratPernyataan)}</span>
                </div>
              </div>
            </div>

            {/* 2. Pendaftaran Peserta ke Sistem TKA */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">
                    2. Pendaftaran Peserta ke Sistem TKA (* Dilakukan Sekolah)
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Periode pendaftaran peserta resmi oleh pihak sekolah ke sistem pusat asesmen.
                  </p>
                </div>
                {renderStatusBadge(getMilestoneStatus(pendaftaranMulai, pendaftaranSelesai))}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={pendaftaranMulai}
                    onChange={(e) => setPendaftaranMulai(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    required
                  />
                  <span className="text-slate-400 font-bold">s.d.</span>
                  <input
                    type="date"
                    value={pendaftaranSelesai}
                    onChange={(e) => setPendaftaranSelesai(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    required
                  />
                </div>
                <div className="text-xs font-bold text-slate-700">
                  Format: {formatDateRangeIndo(pendaftaranMulai, pendaftaranSelesai, "dilakukan sekolah")}
                </div>
              </div>
            </div>

            {/* 3. Simulasi TKA */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">
                    3. Simulasi TKA
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Uji coba aplikasi ujian dan kestabilan server sebelum gladi bersih.
                  </p>
                </div>
                {renderStatusBadge(getMilestoneStatus(simulasiMulai, simulasiSelesai))}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={simulasiMulai}
                    onChange={(e) => setSimulasiMulai(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    required
                  />
                  <span className="text-slate-400 font-bold">s.d.</span>
                  <input
                    type="date"
                    value={simulasiSelesai}
                    onChange={(e) => setSimulasiSelesai(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    required
                  />
                </div>
                <div className="text-xs font-bold text-slate-700">
                  Format: {formatDateRangeIndo(simulasiMulai, simulasiSelesai)}
                </div>
              </div>
            </div>

            {/* 4. Gladi Bersih TKA */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-slate-900 text-sm block">
                    4. Gladi Bersih TKA
                  </span>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Simulasi skala penuh dengan kesiapan ruang dan perangkat menyerupai hari ujian.
                  </p>
                </div>
                {renderStatusBadge(getMilestoneStatus(gladiMulai, gladiSelesai))}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={gladiMulai}
                    onChange={(e) => setGladiMulai(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    required
                  />
                  <span className="text-slate-400 font-bold">s.d.</span>
                  <input
                    type="date"
                    value={gladiSelesai}
                    onChange={(e) => setGladiSelesai(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                    required
                  />
                </div>
                <div className="text-xs font-bold text-slate-700">
                  Format: {formatDateRangeIndo(gladiMulai, gladiSelesai)}
                </div>
              </div>
            </div>

            {/* 5. Pelaksanaan Gelombang 1 */}
            <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-amber-950 text-sm block">
                    5. Pelaksanaan Gelombang 1
                  </span>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Pelaksanaan tes kemampuan akademik sesi pertama sesuai jadwal sekolah.
                  </p>
                </div>
                {renderStatusBadge(getMilestoneStatus(gelombang1Mulai, gelombang1Selesai))}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={gelombang1Mulai}
                    onChange={(e) => setGelombang1Mulai(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    required
                  />
                  <span className="text-slate-400 font-bold">s.d.</span>
                  <input
                    type="date"
                    value={gelombang1Selesai}
                    onChange={(e) => setGelombang1Selesai(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    required
                  />
                </div>
                <div className="text-xs font-bold text-amber-900">
                  Format: {formatDateRangeIndo(gelombang1Mulai, gelombang1Selesai)}
                </div>
              </div>
            </div>

            {/* 6. Pelaksanaan Gelombang 2 */}
            <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/80 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="font-bold text-amber-950 text-sm block">
                    6. Pelaksanaan Gelombang 2
                  </span>
                  <p className="text-[11px] text-amber-700 mt-0.5">
                    Pelaksanaan tes kemampuan akademik sesi kedua dan susulan sekolah.
                  </p>
                </div>
                {renderStatusBadge(getMilestoneStatus(gelombang2Mulai, gelombang2Selesai))}
              </div>

              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={gelombang2Mulai}
                    onChange={(e) => setGelombang2Mulai(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    required
                  />
                  <span className="text-slate-400 font-bold">s.d.</span>
                  <input
                    type="date"
                    value={gelombang2Selesai}
                    onChange={(e) => setGelombang2Selesai(e.target.value)}
                    className="px-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 cursor-pointer"
                    required
                  />
                </div>
                <div className="text-xs font-bold text-amber-900">
                  Format: {formatDateRangeIndo(gelombang2Mulai, gelombang2Selesai)}
                </div>
              </div>
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
            <span>{saving ? "Menyimpan..." : "Simpan Seluruh Tanggal Linimasa"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
