"use client";

import React, { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
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
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold mb-3">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Aktivasi Akun & Konfirmasi Pendaftaran TKA</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Konfirmasi Keikutsertaan & Mapel Pilihan TKA
          </h1>
          <p className="text-slate-600 text-xs sm:text-sm mt-1.5 max-w-xl mx-auto">
            Selamat datang, <span className="font-semibold text-slate-900">{session?.user?.name || "Siswa SIJA"}</span>!
            Form digital ini menggantikan surat fisik wali kelas untuk pengumpulan data resmi pendaftaran TKA Kemendikbud.
          </p>
        </div>

        {/* Student Info Card */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900">{session?.user?.name || "Aditya Pratama"}</span>
              <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-700 font-mono rounded font-semibold">
                NIS: {(session?.user as any)?.nis || "22231001"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>Lokasi Industri PKL: </span>
              <span className="font-medium text-slate-700">
                {(session?.user as any)?.namaIndustriPkl || "PT Kalimantan Prima Coal (Kalimantan)"}
              </span>
            </div>
          </div>
          <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Akun Teraktivasi via SSO
          </span>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
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
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-2">
                1. Apakah Anda bersedia mengikuti Tes Kemampuan Akademik (TKA)?
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setStatusTka("IKUT")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                    statusTka === "IKUT"
                      ? "border-blue-600 bg-blue-50/70 text-blue-950 font-bold ring-1 ring-blue-500"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        statusTka === "IKUT" ? "border-blue-600 bg-blue-600" : "border-slate-300"
                      }`}
                    >
                      {statusTka === "IKUT" && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold">Ya, Saya Bersedia Mengikuti TKA</div>
                      <div className="text-[11px] text-slate-500 font-normal">Wajib (Matematika, B. Indo, B. Inggris) + 2 Pilihan</div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setStatusTka("TIDAK_IKUT")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all flex items-center justify-between ${
                    statusTka === "TIDAK_IKUT"
                      ? "border-amber-600 bg-amber-50/70 text-amber-950 font-bold ring-1 ring-amber-500"
                      : "border-slate-200 bg-white hover:border-slate-300 text-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        statusTka === "TIDAK_IKUT" ? "border-amber-600 bg-amber-600" : "border-slate-300"
                      }`}
                    >
                      {statusTka === "TIDAK_IKUT" && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-bold">Tidak Mengikuti TKA</div>
                      <div className="text-[11px] text-slate-500 font-normal">Dapat diubah kembali sebelum pendaftaran ditutup</div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Step 2: Subject Selection & Official Rules */}
            {statusTka === "IKUT" && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                {/* Official Rules Box */}
                <div className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl text-xs space-y-2">
                  <div className="flex items-center gap-2 font-bold text-blue-950">
                    <Info className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Ketentuan Penting Pemilihan Mapel Pilihan TKA:</span>
                  </div>
                  <ul className="text-slate-700 space-y-1 pl-5 list-disc leading-relaxed">
                    <li>
                      <strong>Nilai Rapor:</strong> Pilih mata pelajaran yang nilainya tercantum di buku rapor Anda (semester kelas 10 s.d. kelas 12).
                    </li>
                    <li>
                      <strong>Kriteria Prodi Kuliah:</strong> Sesuaikan pilihan dengan jurusan/program studi perguruan tinggi yang diincar agar mendukung jalur seleksi PTN/PTS (SNBP, SNBT, atau Mandiri).
                    </li>
                    <li className="text-blue-900 font-semibold">
                      <em>Catatan Pilot: Pada tahap awal ini, bank soal aktif yang tersedia untuk latihan offline adalah <strong>Matematika (Wajib)</strong> dan <strong>Kejuruan PPLG (Pilihan)</strong>.</em>
                    </li>
                  </ul>
                </div>

                <label className="block text-sm font-bold text-slate-900">
                  2. Pilih 2 Mata Pelajaran Pilihan TKA (Dari Spektrum Resmi)
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Mapel Pilihan 1 (Kejuruan / Akademik Utama)
                    </label>
                    <select
                      value={mapel1}
                      onChange={(e) => setMapel1(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {MAPEL_PILIHAN_GROUPS.map((group) => (
                        <optgroup key={group.groupName} label={`📂 ${group.groupName}`}>
                          {group.subjects.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Mapel Pilihan 2 (Pilihan Tambahan)
                    </label>
                    <select
                      value={mapel2}
                      onChange={(e) => setMapel2(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      {MAPEL_PILIHAN_GROUPS.map((group) => (
                        <optgroup key={group.groupName} label={`📂 ${group.groupName}`}>
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
              </div>
            )}

            {/* Summary & Agreement */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 text-xs">
              <div className="flex items-center gap-2 font-bold text-slate-800 uppercase tracking-wider">
                <FileCheck className="w-4 h-4 text-blue-600" />
                <span>Ringkasan Konfirmasi Pendaftaran Anda</span>
              </div>
              <ul className="text-slate-600 space-y-1.5">
                <li>
                  • Status Keikutsertaan:{" "}
                  <strong className="text-slate-900">
                    {statusTka === "IKUT" ? "Bersedia Mengikuti TKA" : "Tidak Mengikuti TKA"}
                  </strong>
                </li>
                {statusTka === "IKUT" && (
                  <>
                    <li>
                      • Mapel Wajib TKA: <strong className="text-slate-900">Matematika, Bahasa Indonesia, Bahasa Inggris</strong>
                    </li>
                    <li>
                      • Mapel Pilihan 1: <strong className="text-blue-900">{getSubjectDisplayName(mapel1)}</strong>
                    </li>
                    <li>
                      • Mapel Pilihan 2: <strong className="text-blue-900">{getSubjectDisplayName(mapel2)}</strong>
                    </li>
                  </>
                )}
              </ul>

              <label className="flex items-start gap-2.5 pt-3 border-t border-slate-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isAgreementChecked}
                  onChange={(e) => setIsAgreementChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <span className="text-slate-700 font-medium leading-relaxed">
                  Saya menyatakan dengan sadar bahwa pilihan mata pelajaran ini telah sesuai dengan nilai rapor saya dan kriteria program studi tujuan kuliah, serta siap didaftarkan sekolah ke sistem resmi TKA Kemendikbud.
                </span>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !isAgreementChecked}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed cursor-pointer"
            >
              <span>{isSubmitting ? "Menyimpan Konfirmasi..." : "Kirim Konfirmasi & Buka Dashboard Latihan"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}