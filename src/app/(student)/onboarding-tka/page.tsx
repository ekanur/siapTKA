"use client";

import React, { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Building2,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Info,
  GraduationCap,
  LogOut,
  Calendar,
  Clock,
  Edit3,
  BookOpen,
} from "lucide-react";
import { MAPEL_PILIHAN_GROUPS, getSubjectDisplayName } from "@/lib/constants/subjects";

export default function OnboardingTkaPage() {
  const { data: session, update } = useSession();
  const router = useRouter();

  const [statusTka, setStatusTka] = useState<"IKUT" | "TIDAK_IKUT" | "">("IKUT");
  const [mapel1, setMapel1] = useState("PPLG");
  const [mapel2, setMapel2] = useState("B_INGGRIS_LANJUT");
  const [isAgreementChecked, setIsAgreementChecked] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);
  const [alreadyConfirmed, setAlreadyConfirmed] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [studentProfile, setStudentProfile] = useState<any>(null);

  const [timeline, setTimeline] = useState<{
    isWithinPeriod: boolean;
    pesanPengumuman: string;
    tanggalSelesai: string | null;
    jadwalTka: {
      batasSuratPernyataan: string;
      pendaftaranSistemTka: string;
      simulasiTka: string;
      gladiBersihTka: string;
      pelaksanaanGel1: string;
      pelaksanaanGel2: string;
    };
  }>({
    isWithinPeriod: true,
    pesanPengumuman: "",
    tanggalSelesai: null,
    jadwalTka: {
      batasSuratPernyataan: "10 September 2026",
      pendaftaranSistemTka: "27 Juli – 27 September 2026 (* dilakukan sekolah)",
      simulasiTka: "21 – 27 September 2026",
      gladiBersihTka: "5 – 18 Oktober 2026",
      pelaksanaanGel1: "26 – 29 Oktober 2026",
      pelaksanaanGel2: "2 – 5 November 2026",
    },
  });

  useEffect(() => {
    // 1. Fetch public timeline settings
    fetch("/api/pengaturan/lini-masa")
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setTimeline({
            isWithinPeriod: d.isWithinPeriod,
            pesanPengumuman: d.pesanPengumuman || "",
            tanggalSelesai: d.tanggalSelesai || null,
            jadwalTka: d.jadwalTka || {
              batasSuratPernyataan: "10 September 2026",
              pendaftaranSistemTka: "27 Juli – 27 September 2026 (* dilakukan sekolah)",
              simulasiTka: "21 – 27 September 2026",
              gladiBersihTka: "5 – 18 Oktober 2026",
              pelaksanaanGel1: "26 – 29 Oktober 2026",
              pelaksanaanGel2: "2 – 5 November 2026",
            },
          });
        }
      })
      .catch((err) => console.error(err));

    // 2. Fetch current student's existing confirmation data
    fetch("/api/student/konfirmasi")
      .then((r) => r.json())
      .then((d) => {
        if (d.success && d.student) {
          const s = d.student;
          setStudentProfile(s);
          if (s.statusTka && s.statusTka !== "BELUM_MERESPONS") {
            setStatusTka(s.statusTka);
            setAlreadyConfirmed(true);
            setIsAgreementChecked(true);
          }
          if (s.mapelPilihan1) setMapel1(s.mapelPilihan1);
          if (s.mapelPilihan2) setMapel2(s.mapelPilihan2);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoadingData(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusTka) {
      setErrorMsg("Pilih status keikutsertaan TKA terlebih dahulu.");
      return;
    }
    if (statusTka === "IKUT" && (!mapel1 || !mapel2)) {
      setErrorMsg("Pilih kedua mapel pilihan kejuruan/akademik Anda.");
      return;
    }
    if (statusTka === "IKUT" && mapel1 === mapel2) {
      setErrorMsg("Mapel Pilihan 1 dan Mapel Pilihan 2 tidak boleh sama.");
      return;
    }
    if (!isAgreementChecked) {
      setErrorMsg("Harap centang konfirmasi kesesuaian data sebelum submit.");
      return;
    }

    setErrorMsg("");
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/student/konfirmasi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          statusTka,
          mapelPilihan1: statusTka === "IKUT" ? mapel1 : null,
          mapelPilihan2: statusTka === "IKUT" ? mapel2 : null,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal menyimpan konfirmasi");
      }

      setIsSuccess(true);
      setAlreadyConfirmed(true);
      await update();

      setTimeout(() => {
        router.push("/latihan");
      }, 1500);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan pada server");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Top Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-6">
            <Link href="/latihan" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                T
              </div>
              <span className="font-extrabold text-slate-900 leading-tight text-lg">siapTKA</span>
            </Link>

            {/* Menu Navigasi di Samping Logo */}
            <nav className="flex items-center gap-1 sm:gap-1.5">
              <Link
                href="/latihan"
                className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-1.5"
              >
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                <span>Latihan</span>
              </Link>
              <Link
                href="/onboarding-tka"
                className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-50 text-blue-600 border border-blue-100 transition-all flex items-center gap-1.5 shadow-xs"
              >
                <FileCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                <span>Konfirmasi</span>
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {session?.user && (
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-900">{session.user.name}</p>
                <p className="text-[11px] text-slate-500 font-mono">{session.user.email}</p>
              </div>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
              title="Keluar Akun"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="max-w-4xl mx-auto px-4 py-8 sm:py-10 space-y-6 flex-1 w-full">
        {/* Header Title */}
        <div className="text-center sm:text-left space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold">
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Konfirmasi Keikutsertaan Asesmen TKA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {alreadyConfirmed ? "Ubah Konfirmasi & Pilihan Mapel TKA" : "Konfirmasi Keikutsertaan & Pilihan Mapel TKA"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-2xl">
            Pastikan pilihan mata pelajaran sesuai dengan nilai rapor terbaik Anda dan syarat program studi tujuan kuliah.
          </p>
        </div>

        {/* Banner: Sudah Pernah Konfirmasi & Izin Ubah */}
        {alreadyConfirmed && timeline.isWithinPeriod && (
          <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <Edit3 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="font-extrabold text-blue-950 flex items-center gap-2">
                  <span>Pilihan Sebelumnya Telah Tersimpan</span>
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                    Status: Sudah Dikonfirmasi
                  </span>
                </strong>
                <p className="text-blue-800 leading-relaxed">
                  Anda masih dapat <strong>mengubah status keikutsertaan maupun 2 mata pelajaran pilihan</strong> kapan saja hingga batas akhir pengumpulan berkas:{" "}
                  <strong className="text-blue-950 underline">{timeline.jadwalTka.batasSuratPernyataan}</strong>. Pilihan terakhir yang Anda simpan akan dijadikan acuan resmi pendaftaran oleh sekolah.
                </p>
              </div>
            </div>
            <Link
              href="/latihan"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm whitespace-nowrap transition-all self-stretch sm:self-auto justify-center cursor-pointer shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Ke Menu Latihan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Banner: Periode Berakhir / Terkunci */}
        {!timeline.isWithinPeriod && (
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong className="font-extrabold text-amber-950 block">
                  Periode Konfirmasi & Perubahan Pilihan Telah Berakhir
                </strong>
                <p className="text-amber-800 leading-relaxed">
                  Batas waktu pengisian dan pengubahan konfirmasi ({timeline.jadwalTka.batasSuratPernyataan}) telah ditutup oleh sekolah. Formulir saat ini berstatus <strong>terkunci (hanya-baca)</strong>. Hubungi administrator sekolah jika terdapat kekeliruan data darurat.
                </p>
              </div>
            </div>
            <Link
              href="/latihan"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm whitespace-nowrap transition-all self-stretch sm:self-auto justify-center cursor-pointer shrink-0"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Ke Menu Latihan</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        {/* Student Identity Card */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg shadow-inner shrink-0">
              {session?.user?.name?.charAt(0) || "S"}
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm sm:text-base">
                {studentProfile?.nama || session?.user?.name || "Memuat Nama Siswa..."}
              </h2>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-0.5">
                <span className="font-mono font-medium">NIS: {studentProfile?.nis || (session?.user as any)?.nis || "-"}</span>
                <span>•</span>
                <span>
                  {studentProfile?.namaKelas || (session?.user as any)?.namaKelas
                    ? `Kelas: ${studentProfile?.namaKelas || (session?.user as any)?.namaKelas}`
                    : `Jurusan: ${studentProfile?.jurusan || (session?.user as any)?.jurusan || "-"}`}
                </span>
                <span>•</span>
                <span className="text-slate-700 font-semibold flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  {studentProfile?.namaIndustriPkl || (session?.user as any)?.namaIndustriPkl || "Belum Ditentukan"}
                </span>
              </div>
            </div>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-xl flex items-center gap-1.5 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Akun SSO Aktif</span>
          </span>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Gagal Menyimpan</p>
                <p>{errorMsg}</p>
              </div>
            </div>
          )}

          {isSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <p className="font-bold">Konfirmasi berhasil disimpan! Mengarahkan ke dashboard latihan...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step 1: Decision */}
            <div className="space-y-2.5">
              <label className="block text-sm font-bold text-slate-900">
                1. Apakah Anda bersedia mengikuti Tes Kemampuan Akademik (TKA)?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={!timeline.isWithinPeriod}
                  onClick={() => setStatusTka("IKUT")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                    statusTka === "IKUT"
                      ? "border-blue-600 bg-blue-50/70 text-blue-950 font-bold ring-1 ring-blue-500"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  } ${!timeline.isWithinPeriod ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div>
                    <p className="text-sm font-bold">Ya, Saya Bersedia Ikut</p>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">
                      Direkomendasikan untuk validasi nilai rapor & SNBP/SNBT
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      statusTka === "IKUT" ? "border-blue-600 bg-blue-600" : "border-slate-300"
                    }`}
                  >
                    {statusTka === "IKUT" && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>

                <button
                  type="button"
                  disabled={!timeline.isWithinPeriod}
                  onClick={() => setStatusTka("TIDAK_IKUT")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                    statusTka === "TIDAK_IKUT"
                      ? "border-rose-600 bg-rose-50/70 text-rose-950 font-bold ring-1 ring-rose-500"
                      : "border-slate-200 hover:border-slate-300 text-slate-700"
                  } ${!timeline.isWithinPeriod ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}`}
                >
                  <div>
                    <p className="text-sm font-bold">Tidak Ikut TKA</p>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">
                      Fokus langsung bekerja setelah lulus SMK
                    </p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      statusTka === "TIDAK_IKUT" ? "border-rose-600 bg-rose-600" : "border-slate-300"
                    }`}
                  >
                    {statusTka === "TIDAK_IKUT" && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </button>
              </div>
            </div>

            {/* Step 2: Elective Subjects Selection */}
            {statusTka === "IKUT" && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    2. Pilih 2 Mata Pelajaran Pilihan TKA
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mata pelajaran wajib (Matematika, B. Indonesia, B. Inggris) sudah otomatis diujikan. Pilih 2 mapel pendukung prodi:
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Mapel Pilihan 1 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Mata Pelajaran Pilihan 1
                    </label>
                    <select
                      disabled={!timeline.isWithinPeriod}
                      value={mapel1}
                      onChange={(e) => setMapel1(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
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

                  {/* Mapel Pilihan 2 */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 block">
                      Mata Pelajaran Pilihan 2
                    </label>
                    <select
                      disabled={!timeline.isWithinPeriod}
                      value={mapel2}
                      onChange={(e) => setMapel2(e.target.value)}
                      className="w-full p-3 rounded-xl border border-slate-300 bg-white text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-hidden disabled:bg-slate-100 disabled:cursor-not-allowed"
                    >
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
                </div>

                {mapel1 === mapel2 && (
                  <p className="text-xs text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Mata pelajaran pilihan 1 dan pilihan 2 tidak boleh sama.</span>
                  </p>
                )}
              </div>
            )}

            {/* Summary & Agreement */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs space-y-3">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>Ringkasan Konfirmasi Anda</span>
              </div>
              <ul className="space-y-1 text-slate-600 list-disc list-inside">
                <li>
                  Status Keikutsertaan:{" "}
                  <strong className="text-slate-900">
                    {statusTka === "IKUT" ? "Bersedia Ikut TKA" : "Tidak Mengikuti TKA"}
                  </strong>
                </li>
                {statusTka === "IKUT" && (
                  <>
                    <li>
                      Mapel Pilihan 1:{" "}
                      <strong className="text-slate-900">{getSubjectDisplayName(mapel1)}</strong>
                    </li>
                    <li>
                      Mapel Pilihan 2:{" "}
                      <strong className="text-slate-900">{getSubjectDisplayName(mapel2)}</strong>
                    </li>
                  </>
                )}
                <li className="text-blue-700 font-semibold">
                  Batas Akhir Perubahan Pilihan: {timeline.jadwalTka.batasSuratPernyataan}
                </li>
              </ul>

              <label
                className={`flex items-start gap-2.5 pt-3 border-t border-slate-200 ${
                  !timeline.isWithinPeriod ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
                }`}
              >
                <input
                  type="checkbox"
                  disabled={!timeline.isWithinPeriod}
                  checked={isAgreementChecked}
                  onChange={(e) => setIsAgreementChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer disabled:cursor-not-allowed"
                />
                <span className="text-slate-700 font-medium leading-relaxed">
                  Saya menyatakan dengan sadar bahwa pilihan mata pelajaran ini telah sesuai dengan nilai rapor saya dan kriteria program studi tujuan kuliah, serta siap didaftarkan sekolah ke sistem resmi TKA Kemendikdasmen.
                </span>
              </label>
            </div>

            {/* Submit & Navigation Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <button
                type="submit"
                disabled={!timeline.isWithinPeriod || isSubmitting || !isAgreementChecked}
                className="flex-1 w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
              >
                <span>
                  {!timeline.isWithinPeriod
                    ? "Periode Konfirmasi Ditutup (Form Terkunci)"
                    : isSubmitting
                    ? "Menyimpan Konfirmasi..."
                    : alreadyConfirmed
                    ? "Simpan Perubahan Konfirmasi"
                    : "Kirim Konfirmasi & Buka Dashboard Latihan"}
                </span>
                {timeline.isWithinPeriod && <ArrowRight className="w-4 h-4" />}
              </button>

              {alreadyConfirmed && (
                <Link
                  href="/latihan"
                  className="w-full sm:w-auto py-3.5 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs sm:text-sm rounded-2xl transition-all flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                >
                  <BookOpen className="w-4 h-4 text-slate-500" />
                  <span>Ke Halaman Latihan</span>
                </Link>
              )}
            </div>
          </form>
        </div>

        {/* School TKA Timeline Card (6 Milestones) */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h3 className="font-extrabold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <span>Jadwal & Linimasa Pelaksanaan TKA 2026</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold hidden sm:inline-block">
              Agenda Resmi Sekolah
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            {/* 1 */}
            <div className="p-3.5 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-1">
              <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">
                Tahap 1 • Batas Konfirmasi
              </span>
              <p className="font-bold text-blue-950">Surat Pernyataan & Pas Foto</p>
              <div className="text-[11px] font-black text-blue-800 flex items-center gap-1 pt-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{timeline.jadwalTka.batasSuratPernyataan}</span>
              </div>
              <p className="text-[10px] text-blue-700/80">Batas siswa memilih/mengubah mapel</p>
            </div>

            {/* 2 */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Tahap 2 • Sekolah
              </span>
              <p className="font-bold text-slate-800">Pendaftaran ke Sistem TKA</p>
              <div className="text-[11px] font-black text-slate-900 flex items-center gap-1 pt-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{timeline.jadwalTka.pendaftaranSistemTka}</span>
              </div>
              <p className="text-[10px] text-slate-500">* Dilakukan pihak sekolah</p>
            </div>

            {/* 3 */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Tahap 3 • Uji Coba
              </span>
              <p className="font-bold text-slate-800">Simulasi TKA</p>
              <div className="text-[11px] font-black text-slate-900 flex items-center gap-1 pt-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{timeline.jadwalTka.simulasiTka}</span>
              </div>
              <p className="text-[10px] text-slate-500">Uji coba server & kesiapan</p>
            </div>

            {/* 4 */}
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Tahap 4 • Gladi
              </span>
              <p className="font-bold text-slate-800">Gladi Bersih TKA</p>
              <div className="text-[11px] font-black text-slate-900 flex items-center gap-1 pt-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{timeline.jadwalTka.gladiBersihTka}</span>
              </div>
              <p className="text-[10px] text-slate-500">Simulasi skala penuh</p>
            </div>

            {/* 5 */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                Tahap 5 • Pelaksanaan
              </span>
              <p className="font-bold text-amber-950">Pelaksanaan Gelombang 1</p>
              <div className="text-[11px] font-black text-amber-900 flex items-center gap-1 pt-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>{timeline.jadwalTka.pelaksanaanGel1}</span>
              </div>
              <p className="text-[10px] text-amber-700/80">Sesi ujian resmi tahap I</p>
            </div>

            {/* 6 */}
            <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-1">
              <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
                Tahap 6 • Pelaksanaan
              </span>
              <p className="font-bold text-amber-950">Pelaksanaan Gelombang 2</p>
              <div className="text-[11px] font-black text-amber-900 flex items-center gap-1 pt-1">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>{timeline.jadwalTka.pelaksanaanGel2}</span>
              </div>
              <p className="text-[10px] text-amber-700/80">Sesi ujian resmi tahap II</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-100 w-full py-6 px-4 sm:px-6 mt-auto flex flex-col md:flex-row justify-between items-center gap-3 border-t border-slate-200 text-xs text-slate-600">
        <div className="font-bold text-[#004ac6] text-sm flex items-center gap-2">
          Siap TKA
        </div>
        <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-500">
          <Link href="/latihan" className="hover:text-blue-600">Dashboard Latihan</Link>
          <span className="hover:text-blue-600 cursor-pointer">Pusat Bantuan</span>
          <span className="hover:text-blue-600 cursor-pointer">Kebijakan Privasi</span>
        </div>
        <div>© 2026 Siap TKA - SMKN 2 Depok Sleman</div>
      </footer>
    </div>
  );
}