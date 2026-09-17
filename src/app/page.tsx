import React from "react";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import {
  WifiOff,
  Brain,
  ShieldCheck,
  School,
  ArrowRight,
  ChevronRight,
  Menu,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  Award,
  Clock,
  Check,
} from "lucide-react";
import prisma from "@/lib/prisma";
import {
  formatDateIndo,
  formatDateRangeIndo,
  getMilestoneStatus,
} from "@/lib/utils/timeline-helpers";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  // Fetch real statistics from database
  const totalSiswa = await prisma.siswa.count();
  const siswaAktif = await prisma.siswa.count({ where: { statusAkun: "AKTIF" } });
  const konfirmasiIkut = await prisma.siswa.count({ where: { statusTka: "IKUT" } });
  const percentConfirmed = totalSiswa > 0 ? Math.round(((siswaAktif + konfirmasiIkut) / (totalSiswa * 2)) * 100) : 0;

  const settings = await prisma.pengaturanTka.findUnique({ where: { id: "default" } });
  const now = new Date();

  // 6 Milestones with status
  const pendaftaranMulai = settings?.pendaftaranMulai || new Date("2026-07-27T00:00:00.000Z");
  const pendaftaranSelesai = settings?.pendaftaranSelesai || new Date("2026-09-27T23:59:59.999Z");
  const batasSuratPernyataan = settings?.batasSuratPernyataan || new Date("2026-09-10T23:59:59.999Z");
  const simulasiMulai = settings?.simulasiMulai || new Date("2026-09-21T00:00:00.000Z");
  const simulasiSelesai = settings?.simulasiSelesai || new Date("2026-09-27T23:59:59.999Z");
  const gladiMulai = settings?.gladiMulai || new Date("2026-10-05T00:00:00.000Z");
  const gladiSelesai = settings?.gladiSelesai || new Date("2026-10-18T23:59:59.999Z");
  const gelombang1Mulai = settings?.gelombang1Mulai || new Date("2026-10-26T00:00:00.000Z");
  const gelombang1Selesai = settings?.gelombang1Selesai || new Date("2026-10-29T23:59:59.999Z");
  const gelombang2Mulai = settings?.gelombang2Mulai || new Date("2026-11-02T00:00:00.000Z");
  const gelombang2Selesai = settings?.gelombang2Selesai || new Date("2026-11-05T23:59:59.999Z");

  const milestones = [
    {
      id: 1,
      step: "Tahap 1",
      title: "Batas Surat Pernyataan & Pas Foto",
      category: "Konfirmasi Siswa",
      dateLabel: formatDateIndo(batasSuratPernyataan),
      description: "Batas akhir pengumpulan berkas dan pemilihan 2 mata pelajaran pilihan oleh siswa di sistem.",
      status: getMilestoneStatus(pendaftaranMulai, batasSuratPernyataan, now),
    },
    {
      id: 2,
      step: "Tahap 2",
      title: "Pendaftaran ke Sistem TKA",
      category: "Operator Sekolah",
      dateLabel: formatDateRangeIndo(pendaftaranMulai, pendaftaranSelesai, "dilakukan sekolah"),
      description: "Pendaftaran resmi data peserta ke portal pusat asesmen Kemendikdasmen oleh sekolah.",
      status: getMilestoneStatus(pendaftaranMulai, pendaftaranSelesai, now),
    },
    {
      id: 3,
      step: "Tahap 3",
      title: "Simulasi TKA",
      category: "Uji Coba",
      dateLabel: formatDateRangeIndo(simulasiMulai, simulasiSelesai),
      description: "Uji coba teknis aplikasi ujian, kestabilan server, dan adaptasi format butir soal oleh siswa.",
      status: getMilestoneStatus(simulasiMulai, simulasiSelesai, now),
    },
    {
      id: 4,
      step: "Tahap 4",
      title: "Gladi Bersih TKA",
      category: "Gladi Bersih",
      dateLabel: formatDateRangeIndo(gladiMulai, gladiSelesai),
      description: "Simulasi skala penuh dengan kondisi menyerupai hari ujian sesungguhnya.",
      status: getMilestoneStatus(gladiMulai, gladiSelesai, now),
    },
    {
      id: 5,
      step: "Tahap 5",
      title: "Pelaksanaan Gelombang 1",
      category: "Ujian Resmi",
      dateLabel: formatDateRangeIndo(gelombang1Mulai, gelombang1Selesai),
      description: "Pelaksanaan tes kemampuan akademik sesi pertama sesuai pembagian rombel sekolah.",
      status: getMilestoneStatus(gelombang1Mulai, gelombang1Selesai, now),
    },
    {
      id: 6,
      step: "Tahap 6",
      title: "Pelaksanaan Gelombang 2",
      category: "Ujian Resmi",
      dateLabel: formatDateRangeIndo(gelombang2Mulai, gelombang2Selesai),
      description: "Pelaksanaan tes kemampuan akademik sesi kedua dan susulan resmi sekolah.",
      status: getMilestoneStatus(gelombang2Mulai, gelombang2Selesai, now),
    },
  ];

  const role = (session?.user as any)?.role;
  const destinationHref = role === "ADMIN" || role === "GURU" ? "/admin/dashboard" : "/latihan";

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-sans antialiased selection:bg-primary selection:text-white">
      {/* Header Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 w-full z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Brand Logo */}
            <Link href={session?.user ? destinationHref : "/"} className="flex items-center gap-2 sm:gap-2.5 group">
              <div className="relative w-8 h-8 sm:w-9 sm:h-9 shrink-0 group-hover:scale-105 transition-transform flex items-center justify-center">
                <Image
                  src="/logo/icon-only.png"
                  alt="Logo Simbol SiapTKA"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <Image
                  src="/logo/horizontal.png"
                  alt="siapTKA"
                  width={140}
                  height={36}
                  className="h-7 sm:h-8 w-auto object-contain"
                  priority
                />
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 font-bold rounded-full">
                  SMKN 2 Depok
                </span>
              </div>
            </Link>

            {/* Menu Navigasi Siswa (Hanya Muncul jika User yang Login adalah SISWA) */}
            {session?.user && role === "SISWA" && (
              <nav className="flex items-center gap-1 sm:gap-1.5">
                <Link
                  href="/latihan"
                  className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
                >
                  Latihan
                </Link>
                <Link
                  href="/onboarding-tka"
                  className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all"
                >
                  Konfirmasi
                </Link>
              </nav>
            )}
          </div>

          {/* CTA Action */}
          <div className="flex items-center gap-3">
            {session?.user ? (
              <Link
                href={destinationHref}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
              >
                <span>Buka Dashboard ({session.user.name?.split(" ")[0]})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
              >
                <span>Masuk Akun</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* 1. Hero Section */}
        <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-32 bg-linear-to-b from-surface to-surface-container-low">
          <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-high rounded-full border border-outline-variant/30 text-xs text-on-surface-variant">
                <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="font-semibold text-primary">Persiapan Asesmen TKA Mandiri</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-on-surface leading-[1.1]">
                PKL Lancar, <br />
                <span className="text-primary underline decoration-primary/30 decoration-wavy">TKA Bersinar</span>
              </h1>

              <p className="text-base sm:text-lg text-on-surface-variant max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Platform persiapan Tes Kemampuan Akademik adaptif untuk Siswa SMKN 2 Depok Sleman yang sedang Praktik Kerja Lapangan (PKL). Dirancang untuk tetap belajar optimal di sela kesibukan industri.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href={session?.user ? destinationHref : "/login"}
                  className="w-full sm:w-auto px-8 py-3.5 bg-primary text-on-primary font-bold text-sm rounded-xl shadow-lg shadow-primary/25 hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
                >
                  <span>{session?.user ? "Lanjutkan Latihan" : "Mulai Persiapan TKA"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>

                <a
                  href="#jadwal"
                  className="w-full sm:w-auto px-6 py-3.5 bg-surface-container-highest text-on-surface font-semibold text-sm rounded-xl border border-outline-variant hover:bg-surface-variant transition-all text-center"
                >
                  Lihat Linimasa 2026
                </a>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 text-xs text-on-surface-variant font-medium">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Sesuai Kurikulum TKA Kemendikbud</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-primary" />
                  <span>Dukungan Mode PWA Offline</span>
                </div>
              </div>
            </div>

            {/* Right Card / Mockup */}
            <div className="lg:col-span-5 relative">
              <div className="bg-surface-container-lowest border border-outline-variant/60 rounded-3xl p-6 shadow-2xl space-y-5 relative">
                {/* Visual Header */}
                <div className="flex items-center justify-between border-b border-outline-variant/40 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-fixed text-primary font-bold flex items-center justify-center text-sm shadow-inner">
                      TKA
                    </div>
                    <div>
                      <p className="text-xs font-bold text-on-surface">Simulasi Mode Offline</p>
                      <p className="text-[11px] text-on-surface-variant">Siswa PKL Tetap Siap Ujian</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold rounded-lg border border-emerald-200 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                    Auto-Sync Siap
                  </span>
                </div>

                {/* Subject Cards Mock */}
                <div className="space-y-3">
                  <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center">
                        MTK
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface">Matematika Wajib</p>
                        <p className="text-[11px] text-on-surface-variant">Penalaran Matematis & Aljabar</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-primary">100% Offline</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center">
                        RPL
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface">Mapel Pilihan: PPLG</p>
                        <p className="text-[11px] text-on-surface-variant">Algoritma, Web & Database</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-primary">Tersinkron</span>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-surface-container border border-outline-variant/40 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center">
                        ENG
                      </div>
                      <div>
                        <p className="text-xs font-bold text-on-surface">Bahasa Inggris Wajib</p>
                        <p className="text-[11px] text-on-surface-variant">Reading Comprehension & Analysis</p>
                      </div>
                    </div>
                    <span className="text-xs font-extrabold text-primary">Siap Dikerjakan</span>
                  </div>
                </div>

                {/* Progress bar info */}
                <div className="pt-2 border-t border-outline-variant/40 flex items-center justify-between text-xs text-on-surface-variant">
                  <span>Penyimpanan Offline Lokal</span>
                  <span className="font-semibold text-on-surface">Aman & Terenkripsi</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Mengapa TKA Penting */}
        <section className="max-w-7xl mx-auto px-6 md:px-12 py-16 md:py-24" id="tentang">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Peran Strategis TKA</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-on-background tracking-tight">
              Mengapa Siswa SMK Butuh TKA?
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
              Tes Kemampuan Akademik menjadi indikator standarisasi kompetensi nasional yang membuka berbagai peluang masa depan lulusan SMK.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/50 shadow-xs hover:border-primary transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-primary-container text-on-primary-container flex items-center justify-center font-black text-lg">
                1
              </div>
              <h3 className="text-lg font-bold text-on-background">Validasi Kualitas Rapor</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                TKA berperan sebagai instrumen objektif penstandaran nilai rapor antarsekolah, memastikan keadilan dalam seleksi SNBP perguruan tinggi negeri.
              </p>
            </div>

            <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/50 shadow-xs hover:border-primary transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-secondary-container text-on-secondary-container flex items-center justify-center font-black text-lg">
                2
              </div>
              <h3 className="text-lg font-bold text-on-background">Bobot Kejuruan Linear</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Siswa memilih 2 mata pelajaran pilihan yang linear dengan program keahlian SMK, memberikan keunggulan kompetitif saat mendaftar prodi vokasi/akademik.
              </p>
            </div>

            <div className="bg-surface-container-lowest p-8 rounded-3xl border border-outline-variant/50 shadow-xs hover:border-primary transition-all space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-tertiary-container text-on-tertiary-container flex items-center justify-center font-black text-lg">
                3
              </div>
              <h3 className="text-lg font-bold text-on-background">Peluang Lanjut Studi</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Memberikan peluang setara bagi siswa SMK yang berkeinginan melanjutkan pendidikan tinggi tanpa mengabaikan pencapaian kompetensi vokasinya.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Kenapa Siap TKA Section */}
        <section className="bg-surface-container-lowest py-16 md:py-24 border-t border-outline-variant/30" id="fitur">
          <div className="max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/50 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                <WifiOff className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-on-background mb-2">Offline-First Practice</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Unduh bank soal saat terkoneksi WiFi, lalu kerjakan di mess industri tanpa kuota internet. Jawaban tersimpan aman di perangkat dan auto-sinkron saat online.
              </p>
            </div>

            <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/50 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 bg-tertiary-fixed rounded-xl flex items-center justify-center mb-6 text-tertiary group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-on-background mb-2">Persiapkan TKA Lebih Baik</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Bentuk layanan nyata sekolah dalam memfasilitasi siswa mempersiapkan TKA di tengah padatnya jam kerja PKL industri, dengan semangat <em>&quot;PKL lancar, TKA bersinar&quot;</em>.
              </p>
            </div>

            <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/50 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 bg-secondary-fixed rounded-xl flex items-center justify-center mb-6 text-secondary group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-on-background mb-2">Teacher Validation & AI</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Bank soal di-generate oleh AI berbasis 5 Pilar resmi Kemendikbud dan divalidasi langsung oleh guru pengampu. Progres dan tingkat kesukaran dipetakan secara terstruktur.
              </p>
            </div>
          </div>
        </section>

        {/* 4. Timeline Section */}
        <section className="bg-surface-container-low py-16 md:py-24 border-y border-outline-variant/30" id="jadwal">
          <div className="max-w-6xl mx-auto px-6 md:px-12">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-bold text-primary bg-primary-fixed/50 px-3 py-1 rounded-full uppercase tracking-wider">
                Jadwal Resmi Sekolah
              </span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-primary mt-2 tracking-tight">
                Linimasa Pelaksanaan TKA 2026
              </h2>
              <p className="text-xs sm:text-sm text-on-surface-variant mt-2 leading-relaxed">
                Agenda penting persiapan, simulasi, hingga pelaksanaan resmi Tes Kemampuan Akademik SMKN 2 Depok Sleman.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {milestones.map((item) => {
                const isOngoing = item.status === "BERLANGSUNG";
                const isPast = item.status === "SELESAI";

                return (
                  <div
                    key={item.id}
                    className={`p-5 rounded-3xl transition-all relative flex flex-col justify-between ${
                      isOngoing
                        ? "bg-white border-2 border-blue-600 shadow-xl shadow-blue-500/10 ring-4 ring-blue-500/10"
                        : isPast
                        ? "bg-slate-100/80 border border-slate-200/80 opacity-60 grayscale-[30%] shadow-none"
                        : "bg-surface-container-lowest border border-outline-variant/60 shadow-xs hover:border-outline transition-all"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          {item.step} • {item.category}
                        </span>

                        {isOngoing ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-blue-600 text-white shadow-xs">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                            <span>SEDANG BERLANGSUNG</span>
                          </div>
                        ) : isPast ? (
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-600">
                            <Check className="w-3 h-3 text-slate-500" />
                            <span>SUDAH BERLALU</span>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>AKAN DATANG</span>
                          </div>
                        )}
                      </div>

                      <h3
                        className={`font-bold text-sm leading-snug ${
                          isOngoing
                            ? "text-blue-950 font-extrabold"
                            : isPast
                            ? "text-slate-600 line-through decoration-slate-400"
                            : "text-on-background"
                        }`}
                      >
                        {item.title}
                      </h3>

                      <p
                        className={`text-xs font-black flex items-center gap-1.5 pt-1 ${
                          isOngoing ? "text-blue-600" : isPast ? "text-slate-500" : "text-on-surface"
                        }`}
                      >
                        <Calendar className={`w-3.5 h-3.5 ${isOngoing ? "text-blue-600" : "text-slate-400"}`} />
                        <span>{item.dateLabel}</span>
                      </p>

                      <p
                        className={`text-[11px] leading-relaxed ${
                          isOngoing
                            ? "text-blue-900/80 font-medium"
                            : isPast
                            ? "text-slate-400"
                            : "text-on-surface-variant"
                        }`}
                      >
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 5. Statistics Section */}
        <section className="max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-16" id="statistik">
          <div className="bg-inverse-surface rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 overflow-hidden relative shadow-2xl">
            <div className="z-10 space-y-3 max-w-md">
              <span className="px-3 py-1 bg-white/10 text-cyan-300 rounded-full text-xs font-bold">
                Persiapan TKA Mandiri SMKN 2 Depok Sleman
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-inverse-on-surface tracking-tight">
                Kesiapan Siswa Menghadapi TKA
              </h2>
              <p className="text-xs sm:text-sm text-surface-variant leading-relaxed">
                Bergabunglah dengan siswa SMKN 2 Depok Sleman yang telah mempersiapkan diri untuk mengamankan nilai rapor dan seleksi prodi perguruan tinggi melalui latihan komprehensif.
              </p>
            </div>

            <div className="z-10 bg-surface-container-lowest p-6 rounded-2xl flex items-center gap-6 shadow-xl border border-outline-variant/30">
              <div className="relative w-24 h-24 shrink-0">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle className="stroke-surface-container-low" cx="18" cy="18" fill="none" r="16" strokeWidth="3" />
                  <circle
                    className="stroke-primary"
                    cx="18"
                    cy="18"
                    fill="none"
                    r="16"
                    strokeDasharray="100 100"
                    strokeDashoffset={100 - percentConfirmed}
                    strokeLinecap="round"
                    strokeWidth="3"
                  />
                </svg>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                  <span className="text-xl font-extrabold text-on-background">{percentConfirmed}%</span>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold text-on-background">Siswa Telah Konfirmasi</p>
                <p className="text-xs text-on-surface-variant mt-0.5">Dari total {totalSiswa} siswa terdaftar</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-high w-full py-12 border-t border-outline-variant/50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="relative w-7 h-7 shrink-0 flex items-center justify-center">
                <Image
                  src="/logo/icon-only.png"
                  alt="Logo Simbol SiapTKA"
                  width={28}
                  height={28}
                  className="w-full h-full object-contain"
                />
              </div>
              <Image
                src="/logo/horizontal.png"
                alt="siapTKA"
                width={110}
                height={28}
                className="h-6 w-auto object-contain"
              />
            </div>
            <p className="text-xs text-on-surface-variant max-w-sm leading-relaxed">
              Platform persiapan mandiri Tes Kemampuan Akademik untuk Siswa SMKN 2 Depok Sleman yang sedang menjalani Praktik Kerja Lapangan (PKL).
            </p>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Navigasi</span>
            <div className="flex flex-col gap-2 text-xs">
              <a className="text-on-surface-variant hover:text-primary hover:underline transition-all" href="#tentang">
                Tentang TKA
              </a>
              <a className="text-on-surface-variant hover:text-primary hover:underline transition-all" href="#fitur">
                Fitur Offline Sync
              </a>
              <a className="text-on-surface-variant hover:text-primary hover:underline transition-all" href="#jadwal">
                Linimasa Pelaksanaan
              </a>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-bold text-on-surface uppercase tracking-wider">Portal Masuk</span>
            <div className="flex flex-col gap-2 text-xs">
              <Link className="text-on-surface-variant hover:text-primary hover:underline transition-all font-semibold" href="/login">
                Portal Siswa Google SSO
              </Link>
              <Link className="text-on-surface-variant hover:text-primary hover:underline transition-all font-semibold" href="/login">
                Portal Guru & Sekolah
              </Link>
            </div>
          </div>

          <div className="md:col-span-4 mt-6 pt-6 border-t border-outline-variant/30 flex flex-col sm:flex-row items-center justify-between text-xs text-on-surface-variant gap-2">
            <p>© 2026 Siap TKA - SMKN 2 Depok Sleman. Hak Cipta Dilindungi.</p>
            <p className="text-[11px] text-outline">Versi 1.0.0 • SMKN 2 Depok Sleman</p>
          </div>
        </div>
      </footer>
    </div>
  );
}