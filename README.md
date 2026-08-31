# siapTKA 🚀
### Platform Latihan TKA Offline-First & Diagnostik Butir Soal Berbasis AI untuk Siswa PKL

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=flat&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![PWA Offline](https://img.shields.io/badge/PWA-Offline--First-teal?style=flat&logo=pwa)](https://web.dev/progressive-web-apps/)
[![Dexie.js](https://img.shields.io/badge/IndexedDB-Dexie.js-orange?style=flat)](https://dexie.org/)
[![Gemini AI](https://img.shields.io/badge/AI-Google%20Gemini-purple?style=flat&logo=google)](https://ai.google.dev/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=flat&logo=docker)](https://www.docker.com/)

---

## 📌 Latar Belakang Masalah
Siswa kelas 13 jurusan SIJA sedang menjalani kegiatan Praktik Kerja Lapangan (PKL) yang tersebar di berbagai industri, termasuk luar kota dan luar pulau (salah satunya di Kalimantan dengan akses internet sangat terbatas). Di saat yang sama, mereka wajib mempersiapkan diri menghadapi **Tes Kemampuan Akademik (TKA)** resmi Kemendikbud sebagai tolok ukur kelulusan dan seleksi perguruan tinggi.

**siapTKA** hadir sebagai solusi inovatif yang memungkinkan siswa berlatih secara mandiri **100% tanpa koneksi internet (Offline-First)**, dengan bank soal yang di-generate oleh AI berbasis **5 Pilar Kisi-Kisi Resmi TKA Kemendikbud**, serta dilengkapi modul **Analisis Butir Soal (% Benar/Salah & Diagnostik Kesukaran)** bagi guru/sekolah.

---

## ✨ Fitur-Fitur Utama

### 1. 📴 PWA Offline-First Engine (Dexie.js IndexedDB)
- Unduh bank soal lengkap (beserta rumus LaTeX, kunci jawaban, dan pembahasan terenkripsi) ke penyimpanan lokal browser.
- Pengerjaan latihan, koreksi nilai, dan evaluasi langkah demi langkah berjalan secara mandiri saat *Airplane Mode* / tanpa sinyal.
- **Auto-Sync Engine Ber-Idempotensi**: Otomatis mengirim antrean jawaban lokal ke server saat perangkat kembali online tanpa risiko duplikasi data.

### 2. 📝 Dukungan 3 Bentuk Soal Resmi TKA Kemendikbud
1. **Pilihan Ganda (Single Choice A–E)** lengkap dengan rendering rumus matematika LaTeX via **KaTeX** offline.
2. **MCMA (Multiple Choice Multiple Answer)** untuk memilih lebih dari satu jawaban benar.
3. **PGK Kategori (Pilihan Ganda Kompleks Kategori)** berupa matriks tabel pernyataan dengan seleksi kategori (*Benar/Salah*, *Sesuai/Tidak Sesuai*).

### 3. 🎯 Modul Analisis Butir Soal & Diagnostik Kesukaran
- Menghitung persentase pengerjaan (% Benar & % Salah) per butir soal.
- Klasifikasi tingkat kesukaran otomatis: **Mudah** (>70%), **Sedang** (40-70%), dan **Sulit** (<40%).
- **Analisis Pengecoh (*Distractor Analysis*)**: Memetakan opsi jawaban salah mana yang paling banyak mengecoh siswa.
- **Rekomendasi Remedial**: Menandai topik yang mendesak untuk dibahas guru pembimbing.

### 4. 🤖 Generator Soal AI (Google Gemini) Berbasis 5 Pilar Resmi TKA
- Menggunakan parameter 5 pilar resmi: *Definisi*, *Muatan*, *Kompetensi*, *Matriks Asesmen*, dan *Contoh Soal*.
- **Human-in-the-loop Validation Center**: Guru meninjau, mengedit inline, menyetujui, atau menolak soal AI sebelum dipublikasikan ke siswa.

### 5. 🔐 Single Sign-On (SSO) Google Workspace & Onboarding TKA Digital
- Login 1-klik menggunakan akun Google Workspace sekolah dengan pencocokan otomatis ke whitelist 72 siswa SIJA.
- Menggantikan surat fisik wali kelas dengan form digital konfirmasi keikutsertaan TKA dan pemilihan 2 mata pelajaran pilihan.
- Fitur ekspor CSV untuk mempermudah admin sekolah menginput data ke dashboard resmi Kemendikbud.

### 6. 🛡️ Keamanan Kunci Soal Offline Berlapis (Anti-Inspect & Zero-Trust)
- Kunci jawaban tidak disimpan dalam bentuk *plain text*, melainkan **Salted SHA-256 Hash**.
- Teks pembahasan dienkripsi (**AES-GCM**) dan baru di-dekripsi setelah siswa submit latihan.
- **Zero-Trust Server Re-validation**: Server mengoreksi ulang jawaban siswa dengan Master Key di database server saat sinkronisasi online.

---

## 🛠️ Tech Stack
- **Frontend & Framework**: Next.js 14 (App Router, TypeScript), Tailwind CSS, Lucide React, KaTeX
- **Client Offline Storage**: Dexie.js (IndexedDB) + PWA Service Worker
- **Backend & Database**: Next.js Route Handlers, Prisma ORM, SQLite (Dev) / MySQL / PostgreSQL (Production)
- **Autentikasi**: NextAuth.js (Google Workspace SSO)
- **AI Engine**: Google Gemini API (`@google/generative-ai`)
- **DevOps**: Docker Multi-Stage Build (`node:20-alpine`), Docker Compose, Nginx Reverse Proxy
- **Target Hosting**: VPS Jagoanhosting (2 Core CPU, 2 GB RAM, 40 GB Storage)

---

## 🚀 Menjalankan Aplikasi Secara Lokal

1. **Clone repository & install dependencies**:
   ```bash
   git clone https://github.com/USERNAME/siapTKA.git
   cd siapTKA
   npm install
   ```

2. **Inisialisasi Database & Seeding 72 Siswa SIJA**:
   ```bash
   npx prisma db push
   npx ts-node prisma/seed.ts
   ```

3. **Jalankan Development Server**:
   ```bash
   npm run dev
   ```
   Buka `http://localhost:3000` pada browser Anda.

4. **Kredensial Demo Pengujian Instan**:
   - **Siswa Demo PKL Kalimantan**: Klik tombol *"Login Siswa Demo (PKL Kalimantan)"* pada halaman login atau gunakan NIS: `22231001`.
   - **Guru Matematika**: Username `guru_matematika`, Password `gurumatematika2026`
   - **Guru PPLG**: Username `guru_pplg`, Password `gurupplg2026`
   - **Administrator**: Username `admin`, Password `adminpassword2026`

---

## 📦 Deployment ke VPS Jagoanhosting (Docker)
Lihat panduan lengkap pada [DEPLOYMENT_GUIDE_JAGOANHOSTING.md](./DEPLOYMENT_GUIDE_JAGOANHOSTING.md).

```bash
docker compose up -d --build
```