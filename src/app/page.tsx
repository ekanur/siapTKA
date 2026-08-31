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

  const role = (session?.user as any)?.role;
  const destinationHref = role === "ADMIN" || role === "GURU" ? "/admin/dashboard" : "/latihan";

  return (
    <div className="bg-background text-on-background min-h-screen flex flex-col font-sans antialiased selection:bg-primary selection:text-white">
      {/* Header Navigation */}
      <header className="bg-surface-container-lowest/90 backdrop-blur-md fixed top-0 w-full z-50 border-b border-outline-variant/40 shadow-sm transition-all">
        <div className="flex justify-between items-center h-16 px-6 md:px-12 max-w-7xl mx-auto">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-primary text-white font-extrabold text-base flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              T
            </div>
            <div>
              <span className="text-xl font-bold text-primary tracking-tight">SiapTKA</span>
              <span className="hidden sm:inline-block text-[10px] ml-2 px-2 py-0.5 bg-primary-fixed text-on-primary-fixed font-bold rounded-full">
                SMKN 2 Depok
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-8 text-sm font-medium">
            <Link
              href="/"
              className="text-primary font-bold border-b-2 border-primary pb-1 active:scale-95 duration-150"
            >
              Beranda
            </Link>
            <Link
              href="#tentang"
              className="text-on-surface-variant hover:text-primary transition-colors px-2 py-1 rounded hover:bg-surface-container-low"
            >
              Tentang TKA
            </Link>
            <Link
              href="#fitur"
              className="text-on-surface-variant hover:text-primary transition-colors px-2 py-1 rounded hover:bg-surface-container-low"
            >
              Keunggulan
            </Link>
            <Link
              href="#jadwal"
              className="text-on-surface-variant hover:text-primary transition-colors px-2 py-1 rounded hover:bg-surface-container-low"
            >
              Jadwal
            </Link>
            <Link
              href="#statistik"
              className="text-on-surface-variant hover:text-primary transition-colors px-2 py-1 rounded hover:bg-surface-container-low"
            >
              Statistik
            </Link>
          </nav>

          {/* CTA Action */}
          <div className="flex items-center gap-3">
            {session?.user ? (
              <Link
                href={destinationHref}
                className="px-5 py-2.5 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 hover:opacity-95 transition-all flex items-center gap-2"
              >
                <span>Buka Dashboard ({session.user.name?.split(" ")[0]})</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <Link
                href="/login"
                className="px-5 py-2.5 bg-primary hover:bg-primary-container text-white text-xs font-bold rounded-xl shadow-md shadow-primary/20 hover:opacity-95 transition-all flex items-center gap-1.5"
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
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-primary-fixed text-on-primary-fixed text-xs font-bold border border-primary-fixed-dim">
                <WifiOff className="w-3.5 h-3.5 text-primary" />
                <span>PWA Offline-First • Khusus Siswa PKL Vokasi</span>
              </div>

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
                  <span>5 Pilar Kisi-Kisi Resmi</span>
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
                Unduh paket soal saat terhubung internet, kerjakan di mana saja tanpa kuota. Jawaban otomatis tersinkronisasi saat Anda kembali online. Sangat ideal bagi siswa di lokasi PKL minim sinyal (seperti luar pulau / Kalimantan).
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
          <div className="max-w-4xl mx-auto px-6 md:px-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-primary text-center mb-16 tracking-tight">
              Linimasa Pelaksanaan TKA
            </h2>

            <div className="relative border-l-2 border-outline-variant ml-4 md:ml-0 md:border-l-0">
              <div className="hidden md:block absolute top-1/2 w-full border-t-2 border-outline-variant -z-10" />
              <div className="hidden md:block absolute top-1/2 w-3/4 border-t-2 border-primary -z-10" />

              <div className="flex flex-col md:flex-row justify-between gap-8 md:gap-4 relative z-10">
                {/* Step 1 */}
                <div className="pl-8 md:pl-0 relative flex flex-col md:items-center">
                  <div className="absolute md:relative left-[-33px] md:left-auto md:mb-4 w-6 h-6 bg-primary rounded-full border-4 border-surface-container-low shadow-sm" />
                  <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm min-w-[160px]">
                    <p className="text-[11px] font-bold text-primary mb-1 uppercase tracking-wider">Januari</p>
                    <h4 className="text-xs sm:text-sm font-bold text-on-background">Aktivasi Akun</h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">Konfirmasi data siswa</p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="pl-8 md:pl-0 relative flex flex-col md:items-center">
                  <div className="absolute md:relative left-[-33px] md:left-auto md:mb-4 w-6 h-6 bg-primary rounded-full border-4 border-surface-container-low shadow-sm" />
                  <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant shadow-sm min-w-[160px]">
                    <p className="text-[11px] font-bold text-primary mb-1 uppercase tracking-wider">Jan - Mar</p>
                    <h4 className="text-xs sm:text-sm font-bold text-on-background">Latihan Mandiri</h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">Mengerjakan modul offline</p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="pl-8 md:pl-0 relative flex flex-col md:items-center">
                  <div className="absolute md:relative left-[-33px] md:left-auto md:mb-4 w-6 h-6 bg-primary rounded-full border-4 border-surface-container-low shadow-sm" />
                  <div className="bg-primary-container text-white p-4 rounded-xl border border-primary shadow-sm min-w-[160px]">
                    <p className="text-[11px] font-bold text-primary-fixed mb-1 uppercase tracking-wider">Maret</p>
                    <h4 className="text-xs sm:text-sm font-bold text-on-primary">Simulasi Sekolah</h4>
                    <p className="text-[11px] text-on-primary-container mt-0.5">Ujian uji coba</p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="pl-8 md:pl-0 relative flex flex-col md:items-center opacity-75">
                  <div className="absolute md:relative left-[-33px] md:left-auto md:mb-4 w-6 h-6 bg-surface-variant rounded-full border-4 border-surface-container-low" />
                  <div className="bg-surface-container-lowest p-4 rounded-xl border border-outline-variant border-dashed min-w-[160px]">
                    <p className="text-[11px] font-bold text-on-surface-variant mb-1 uppercase tracking-wider">April</p>
                    <h4 className="text-xs sm:text-sm font-bold text-on-background">Pelaksanaan TKA</h4>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">Ujian resmi Kemendikbud</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 5. Statistics Section */}
        <section className="max-w-7xl mx-auto px-6 md:px-12 py-10 md:py-16" id="statistik">
          <div className="bg-inverse-surface rounded-3xl p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12 overflow-hidden relative shadow-2xl">
            <div className="z-10 space-y-3 max-w-md">
              <span className="px-3 py-1 bg-white/10 text-cyan-300 rounded-full text-xs font-bold">
                Pilot SIJA SMKN 2 Depok Sleman
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