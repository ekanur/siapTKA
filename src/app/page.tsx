import React from "react";
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
} from "lucide-react";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function LandingPage() {
  const session = await getServerSession(authOptions);

  // Fetch real statistics from database
  const totalSiswa = await prisma.siswa.count();
  const siswaAktif = await prisma.siswa.count({ where: { statusAkun: "AKTIF" } });
  const konfirmasiIkut = await prisma.siswa.count({ where: { statusTka: "IKUT" } });
  const percentConfirmed = totalSiswa > 0 ? Math.round(((siswaAktif + konfirmasiIkut) / (totalSiswa * 2)) * 100) : 85;

  const settings = await prisma.pengaturanTka.findUnique({ where: { id: "default" } });
  const jadwalTka = {
    batasSuratPernyataan: settings?.batasSuratPernyataan || "10 September 2026",
    pendaftaranSistemTka: settings?.pendaftaranSistemTka || "27 Juli – 27 September 2026 (* dilakukan sekolah)",
    simulasiTka: settings?.simulasiTka || "21 – 27 September 2026",
    gladiBersihTka: settings?.gladiBersihTka || "5 – 18 Oktober 2026",
    pelaksanaanGel1: settings?.pelaksanaanGel1 || "26 – 29 Oktober 2026",
    pelaksanaanGel2: settings?.pelaksanaanGel2 || "2 – 5 November 2026",
  };

  const role = (session?.user as any)?.role;
  const destinationHref = role === "ADMIN" || role === "GURU" ? "/admin/dashboard" : "/latihan";

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-sans antialiased selection:bg-primary selection:text-white">
      {/* Header Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 w-full z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Brand Logo */}
            <Link href={session?.user ? destinationHref : "/"} className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-extrabold text-lg flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                T
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-extrabold text-slate-900 tracking-tight">siapTKA</span>
                <span className="hidden sm:inline-block text-[10px] px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 font-bold rounded-full">
                  SMKN 2 Depok
                </span>
              </div>
            </Link>

            {/* Menu Navigasi di Samping Logo (Hanya Muncul Setelah Login) */}
            {session?.user && (
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
                <span>Masuk Sistem</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-16 flex-1 space-y-16 md:space-y-24">
        {/* 1. Hero Section */}
        <section className="max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-on-background tracking-tight leading-tight">
                <span className="text-primary block mb-1">Siap TKA:</span>
                Persiapan TKA Lebih Mudah & Mandiri
              </h1>

              <p className="text-sm sm:text-base text-on-surface-variant max-w-lg leading-relaxed">
                Platform latihan Tes Kemampuan Akademik khusus siswa SMK. Dirancang dengan fitur <strong>offline-sync</strong> untuk mendukung persiapan optimal bahkan saat Anda sedang menjalani Praktik Kerja Lapangan (PKL) di lokasi minim sinyal.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href={session?.user ? destinationHref : "/login"}
                  className="px-6 py-3.5 bg-primary hover:bg-primary-container text-white text-sm font-bold rounded-xl shadow-lg shadow-primary/25 hover:opacity-95 transition-all flex items-center gap-2.5"
                >
                  <span>{session?.user ? "Lanjutkan Latihan" : "Mulai Latihan Sekarang"}</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#tentang"
                  className="px-6 py-3.5 border border-outline-variant text-on-surface text-sm font-bold rounded-xl hover:bg-surface-container-low transition-colors"
                >
                  Pelajari Lebih Lanjut
                </a>
              </div>

              <div className="flex items-center gap-6 pt-4 text-xs text-on-surface-variant border-t border-outline-variant/30">
                <div className="flex items-center gap-1.5 font-semibold text-on-surface">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  <span>Sesuai Kisi-Kisi Resmi</span>
                </div>
                <div className="flex items-center gap-1.5 font-semibold text-on-surface">
                  <CheckCircle2 className="w-4 h-4 text-secondary" />
                  <span>3 Format Soal TKA</span>
                </div>
              </div>
            </div>

            {/* Visual Hero Graphic / Interactive Card Preview */}
            <div className="relative flex justify-center md:justify-end">
              <div className="absolute inset-0 bg-primary-fixed rounded-full blur-3xl opacity-30 -z-10" />

              <div className="w-full max-w-md bg-surface-container-lowest rounded-3xl p-6 sm:p-7 border border-outline-variant shadow-xl space-y-5">
                <div className="flex items-center justify-between border-b border-outline-variant/40 pb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-error" />
                    <div className="w-3 h-3 rounded-full bg-secondary-fixed-dim" />
                    <div className="w-3 h-3 rounded-full bg-primary-container" />
                  </div>
                  <span className="text-[11px] font-bold text-secondary bg-secondary-container px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <WifiOff className="w-3 h-3" />
                    <span>Mode Offline Aktif</span>
                  </span>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-primary">Simulasi Matematika TKA</span>
                    <span className="font-mono text-on-surface-variant">Soal 1 dari 10</span>
                  </div>
                  <p className="text-xs text-on-surface font-medium leading-relaxed bg-surface-container-low p-3.5 rounded-xl border border-outline-variant/30">
                    Diketahui fungsi kuadrat f(x) = -2x² + 8x - 3. Titik puncak ekstrem dari kurva tersebut adalah...
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="p-2.5 rounded-lg border border-primary bg-primary-fixed/40 text-on-primary-fixed font-bold flex items-center justify-between">
                      <span>A. (2, 5)</span>
                      <CheckCircle2 className="w-4 h-4 text-primary" />
                    </div>
                    <div className="p-2.5 rounded-lg border border-outline-variant text-on-surface-variant bg-surface-container-lowest opacity-75">
                      <span>B. (2, -5)</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-secondary-container/40 border border-secondary-container rounded-xl flex items-center justify-between text-xs text-on-secondary-container">
                  <span className="font-bold">Jawaban tersimpan otomatis di perangkat</span>
                  <Sparkles className="w-4 h-4 text-secondary" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. Purpose of TKA (Mengapa TKA Penting?) */}
        <section className="bg-surface-container-lowest py-16 md:py-24 border-y border-outline-variant/30" id="tentang">
          <div className="max-w-4xl mx-auto px-6 md:px-12 text-center space-y-8">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
              Mengapa TKA Penting?
            </h2>

            <div className="bg-surface p-8 sm:p-10 rounded-2xl border border-outline-variant/50 relative overflow-hidden text-left sm:text-center shadow-sm">
              <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                <School className="w-28 h-28 text-primary" />
              </div>
              <p className="text-sm sm:text-base text-on-surface-variant leading-relaxed relative z-10">
                Tes Kemampuan Akademik (TKA) bukan sekadar ujian akhir. Ini adalah <strong className="text-on-surface">validasi krusial atas nilai rapor</strong> yang Anda kumpulkan selama di SMK (kelas 10 hingga 12). Lebih dari itu, hasil TKA merupakan salah satu syarat utama untuk Seleksi Nasional Masuk Perguruan Tinggi (SNBP / SNBT / Jalur Mandiri Vokasi). Mempersiapkan TKA dengan baik adalah investasi untuk masa depan karier dan akademik Anda.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Why Siap TKA (Kenapa Menggunakan Siap TKA?) */}
        <section className="max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-16" id="fitur">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-primary tracking-tight">
              Kenapa Menggunakan Siap TKA?
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant mt-2 max-w-md mx-auto">
              Inovasi solusi pendidikan vokasi yang menjembatani rutinitas industri PKL dengan kesiapan akademik.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/50 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 bg-primary-fixed rounded-xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                <WifiOff className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-on-background mb-2">Offline Sync untuk PKL</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Unduh paket soal saat terhubung internet, kerjakan di mana saja tanpa kuota. Jawaban otomatis tersinkronisasi saat Anda kembali online. Sangat ideal bagi siswa di lokasi PKL minim sinyal (seperti di industri atau area dengan akses internet terbatas).
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/50 hover:shadow-lg transition-all group">
              <div className="w-12 h-12 bg-tertiary-fixed rounded-xl flex items-center justify-center mb-6 text-tertiary group-hover:scale-110 transition-transform">
                <Brain className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-on-background mb-2">Persiapkan TKA Lebih Baik</h3>
              <p className="text-xs sm:text-sm text-on-surface-variant leading-relaxed">
                Bentuk layanan nyata sekolah dalam memfasilitasi siswa mempersiapkan TKA di tengah padatnya jam kerja PKL industri, dengan semangat <em>&quot;PKL lancar, TKA bersinar&quot;</em>.
              </p>
            </div>

            {/* Feature 3 */}
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
              {/* Tahap 1 */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-primary/40 shadow-sm space-y-2 hover:border-primary transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-primary bg-primary-fixed px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Tahap 1 • Konfirmasi Siswa
                  </span>
                </div>
                <h3 className="font-bold text-sm text-on-background">Surat Pernyataan & Pas Foto</h3>
                <p className="text-xs font-black text-primary flex items-center gap-1.5 pt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{jadwalTka.batasSuratPernyataan}</span>
                </p>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Batas akhir pengumpulan berkas dan pemilihan 2 mata pelajaran pilihan oleh siswa di sistem.
                </p>
              </div>

              {/* Tahap 2 */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm space-y-2 hover:border-primary transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-secondary bg-secondary-container px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Tahap 2 • Operator Sekolah
                  </span>
                </div>
                <h3 className="font-bold text-sm text-on-background">Pendaftaran ke Sistem TKA</h3>
                <p className="text-xs font-black text-on-surface flex items-center gap-1.5 pt-1">
                  <Calendar className="w-3.5 h-3.5 text-secondary" />
                  <span>{jadwalTka.pendaftaranSistemTka}</span>
                </p>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Pendaftaran resmi data peserta ke portal pusat asesmen Kemendikdasmen oleh sekolah.
                </p>
              </div>

              {/* Tahap 3 */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm space-y-2 hover:border-primary transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-tertiary bg-tertiary-fixed px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Tahap 3 • Uji Coba
                  </span>
                </div>
                <h3 className="font-bold text-sm text-on-background">Simulasi TKA</h3>
                <p className="text-xs font-black text-on-surface flex items-center gap-1.5 pt-1">
                  <Calendar className="w-3.5 h-3.5 text-tertiary" />
                  <span>{jadwalTka.simulasiTka}</span>
                </p>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Uji coba teknis aplikasi ujian, kestabilan server, dan adaptasi format butir soal oleh siswa.
                </p>
              </div>

              {/* Tahap 4 */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-outline-variant/60 shadow-sm space-y-2 hover:border-primary transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Tahap 4 • Gladi Bersih
                  </span>
                </div>
                <h3 className="font-bold text-sm text-on-background">Gladi Bersih TKA</h3>
                <p className="text-xs font-black text-on-surface flex items-center gap-1.5 pt-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-600" />
                  <span>{jadwalTka.gladiBersihTka}</span>
                </p>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Simulasi skala penuh dengan kondisi menyerupai hari ujian sesungguhnya.
                </p>
              </div>

              {/* Tahap 5 */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-amber-300 shadow-sm space-y-2 hover:border-amber-500 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Tahap 5 • Ujian Resmi
                  </span>
                </div>
                <h3 className="font-bold text-sm text-on-background">Pelaksanaan Gelombang 1</h3>
                <p className="text-xs font-black text-amber-900 flex items-center gap-1.5 pt-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>{jadwalTka.pelaksanaanGel1}</span>
                </p>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Pelaksanaan tes kemampuan akademik sesi pertama sesuai pembagian rombel sekolah.
                </p>
              </div>

              {/* Tahap 6 */}
              <div className="bg-surface-container-lowest p-5 rounded-2xl border border-amber-300 shadow-sm space-y-2 hover:border-amber-500 transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    Tahap 6 • Ujian Resmi
                  </span>
                </div>
                <h3 className="font-bold text-sm text-on-background">Pelaksanaan Gelombang 2</h3>
                <p className="text-xs font-black text-amber-900 flex items-center gap-1.5 pt-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-600" />
                  <span>{jadwalTka.pelaksanaanGel2}</span>
                </p>
                <p className="text-[11px] text-on-surface-variant leading-relaxed">
                  Pelaksanaan tes kemampuan akademik sesi kedua dan susulan resmi sekolah.
                </p>
              </div>
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
                Bergabunglah dengan siswa SIJA yang telah mempersiapkan diri untuk mengamankan nilai rapor dan seleksi prodi perguruan tinggi melalui latihan komprehensif.
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
                <p className="text-xs text-on-surface-variant mt-0.5">Dari target 72 siswa SIJA kelas 13 PKL</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-surface-container-high w-full py-12 border-t border-outline-variant/50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary text-white font-extrabold text-xs flex items-center justify-center">
                T
              </div>
              <span className="text-base font-bold text-on-surface">Siap TKA</span>
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
            <p className="text-[11px] text-outline">Versi 1.0.0 • Pilot Project JHIC</p>
          </div>
        </div>
      </footer>
    </div>
  );
}