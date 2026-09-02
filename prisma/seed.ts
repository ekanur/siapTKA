import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database siapTKA dengan Kurikulum Resmi TKA...");

  // 1. Bersihkan database
  await prisma.progresLatihan.deleteMany();
  await prisma.soal.deleteMany();
  await prisma.kisiKisi.deleteMany();
  await prisma.siswa.deleteMany();
  await prisma.userAdmin.deleteMany();

  // 2. Akun Guru & Admin
  await prisma.userAdmin.createMany({
    data: [
      {
        username: "admin",
        password: "adminpassword2026",
        nama: "Administrator Sekolah",
        role: "ADMIN",
      },
      {
        username: "guru_matematika",
        password: "gurumatematika2026",
        nama: "Dra. Siti Rahmawati, M.Pd (Guru Matematika)",
        role: "GURU",
      },
      {
        username: "guru_pplg",
        password: "gurupplg2026",
        nama: "Ahmad Fauzi, S.Kom., M.T. (Guru Kejuruan PPLG)",
        role: "GURU",
      },
    ],
  });

  // 3. 72 Siswa SIJA dengan Industri PKL
  const industriList = [
    "PT Telkom Akses",
    "PT Len Industri (Persero)",
    "PT Pindad (Persero)",
    "Dinas Komunikasi dan Informatika",
    "PT Kalimantan Prima Coal ",
    "PT Berau Coal Energy ",
    "PT Astra Graphia Information Technology",
    "PT Bank Central Asia Tbk",
    "PT Medco Energi Internasional",
    "PT Solusi Teknologi Nusantara",
    "PT Global Digital Niaga (Blibli)",
    "Pusat Data Nasional Kominfo",
  ];

  const namaDepan = [
    "Aditya", "Bagas", "Citra", "Dimas", "Eka", "Fadhil", "Galih", "Hafidz",
    "Indra", "Jovian", "Kevin", "Lutfi", "Muhammad", "Naufal", "Octavian", "Panji",
    "Raditya", "Satria", "Taufiq", "Utama", "Vino", "Wahyu", "Yoga", "Zaky",
    "Anisa", "Bella", "Cynthia", "Dina", "Elsa", "Fany", "Gita", "Hana",
    "Intan", "Jasmin", "Karin", "Lestari", "Maya", "Nabila", "Olivia", "Putri"
  ];
  const namaBelakang = [
    "Pratama", "Saputra", "Wijaya", "Kusuma", "Hidayat", "Ramadhan", "Setiawan", "Utomo",
    "Nugroho", "Santoso", "Firmansyah", "Pangestu", "Gunawan", "Mahendra", "Wibowo", "Syahputra"
  ];

  const siswaData = [];
  for (let i = 1; i <= 72; i++) {
    const nis = `2223${String(1000 + i)}`;
    const fName = namaDepan[(i - 1) % namaDepan.length];
    const lName = namaBelakang[(i * 3) % namaBelakang.length];
    const nama = `${fName} ${lName} (${i})`;
    const email = `sija.${nis}@sekolah.sch.id`;
    const industri = industriList[(i - 1) % industriList.length];

    let statusAkun = "BELUM_AKTIF";
    let statusTka = "BELUM_MERESPONS";
    let mapelPilihan1 = null;
    let mapelPilihan2 = null;
    let tanggalAktivasi = null;

    if (i <= 35) {
      statusAkun = "AKTIF";
      statusTka = "IKUT";
      mapelPilihan1 = "PPLG";
      mapelPilihan2 = i % 2 === 0 ? "B_INGGRIS_LANJUT" : "PKK";
      tanggalAktivasi = new Date(Date.now() - (72 - i) * 3600000);
    } else if (i <= 45) {
      statusAkun = "AKTIF";
      statusTka = "TIDAK_IKUT";
      tanggalAktivasi = new Date(Date.now() - (72 - i) * 3600000);
    } else if (i <= 55) {
      statusAkun = "AKTIF";
      statusTka = "BELUM_MERESPONS";
      tanggalAktivasi = new Date(Date.now() - (72 - i) * 3600000);
    }

    // Siswa Demo #1
    if (i === 1) {
      siswaData.push({
        nis: "22231001",
        nama: "Aditya Pratama",
        email: "siswa.demo@gmail.com",
        jurusan: "SIJA",
        namaIndustriPkl: "PT Kalimantan Prima Coal ",
        statusAkun: "AKTIF",
        tanggalAktivasi: new Date(),
        statusTka: "IKUT",
        mapelPilihan1: "PPLG",
        mapelPilihan2: "B_INGGRIS_LANJUT",
      });
      continue;
    }

    siswaData.push({
      nis,
      nama,
      email,
      jurusan: "SIJA",
      namaIndustriPkl: industri,
      statusAkun,
      tanggalAktivasi,
      statusTka,
      mapelPilihan1,
      mapelPilihan2,
    });
  }

  await prisma.siswa.createMany({ data: siswaData });

  // 4. 5 PILAR RESMI KISI-KISI TKA: PPLG (Sesuai Keputusan Kepala BSKAP No. 046/H/KR/2025)
  const kisiKisiPplgResmi = await prisma.kisiKisi.create({
    data: {
      mapel: "PPLG",
      topik: "Pengembangan Perangkat Lunak dan Gim (PPLG Fase E & F)",
      definisi: `Tes Kemampuan Akademik (TKA) pada Program Keahlian Pengembangan Perangkat Lunak dan Gim (PPLG) bertujuan mengukur penguasaan konsep, penalaran, dan penerapan pengetahuan dasar kejuruan dalam bidang pengembangan perangkat lunak dan gim. Ruang lingkup asesmen mencakup proses bisnis pengembangan perangkat lunak dan gim, perkembangan teknologi dan dunia kerja, profesi serta Kewirausahaan bidang PPLG, K3LH dan budaya kerja industri, penggunaan perangkat dan tools pengembangan, dasar basis data, pengelolaan aset dan antarmuka pengguna, algoritma, pemrograman terstruktur, serta pemrograman berorientasi objek pada konteks proyek perangkat lunak dan gim.`,
      muatan: `Muatan TKA PPLG disusun dengan merujuk pada elemen dan materi esensial dalam Capaian Pembelajaran Program Keahlian Pengembangan Perangkat Lunak dan Gim Fase E sebagaimana tercantum dalam Salinan Keputusan Kepala BSKAP Nomor 046/H/KR/2025:
1. Wawasan dunia kerja bidang pengembangan perangkat lunak dan gim: pemahaman terhadap proses bisnis pengembangan perangkat lunak dan gim, perkembangan teknologi, peluang usaha, manajemen proyek, HAKI, serta budaya industri.
2. Kecakapan kerja dasar (basic job skills), K3, dan budaya kerja: penerapan terhadap keselamatan kerja, penggunaan perangkat kerja, pengelolaan aset fisik dan digital, etika kerja, budaya kerja profesional, serta prosedur kerja di lingkungan pengembangan perangkat lunak dan gim.
3. Teknologi Jaringan Komputer: pemahaman konsep dasar jaringan komputer dalam konteks pengembangan perangkat lunak dan gim, meliputi konfigurasi dasar lingkungan pengembangan berbasis jaringan, alamat IP dan konektivitas antar perangkat, komunikasi client-server, penggunaan protokol aplikasi seperti HTTP/HTTPS, akses basis data atau layanan API melalui jaringan, serta analisis terhadap kendala koneksi yang mempengaruhi proses pengembangan, pengujian, dan distribusi aplikasi atau gim.
4. Pemrograman Terstruktur: pemahaman dan analisis penggunaan tipe data, struktur data, struktur kontrol percabangan dan perulangan, fungsi, prosedur, serta desain modular program untuk merancang solusi berbasis algoritma pada permasalahan kontekstual dalam pengembangan perangkat lunak atau gim.
5. Pemrograman Berorientasi Objek: pemahaman dan penerapan konsep class dan object, prinsip dasar OOP, access modifier, enkapsulasi, inheritance, dan polymorphism untuk merancang struktur program yang modular, terorganisasi, dan sesuai kebutuhan pada pengembangan perangkat lunak atau gim.`,
      kompetensi: `Kemampuan PPLG yang diukur meliputi:
- Pemahaman konseptual: memahami konsep dasar proses bisnis pengembangan perangkat lunak dan gim, lingkungan kerja PPLG, K3LH, teknologi penunjang, pemrograman terstruktur, dan pemrograman berorientasi objek.
- Penerapan konsep: menggunakan konsep dasar PPLG untuk menyelesaikan masalah kontekstual pada lingkungan pengembangan perangkat lunak atau gim.
- Analisis dan evaluasi: menganalisis efektivitas solusi, struktur program, desain modular, penerapan OOP, serta penggunaan teknologi jaringan penunjang dalam proses pengembangan, pengujian, atau distribusi aplikasi/gim.
- Keterampilan berpikir komputasional: memahami dan menggunakan logika program, struktur data, dekomposisi masalah, pola algoritmik, serta penyelesaian masalah berbasis algoritma.

Level Kognitif yang Diukur:
1. Pengetahuan dan Pemahaman (Knowing & Understanding): Mengidentifikasi profesi & tahapan manajemen proyek, Menjelaskan K3LH & kewirausahaan, Melaksanakan pengelolaan file/direktori, Menerapkan konfigurasi dasar & OOP.
2. Penerapan dan Implementasi (Applying & Implementation): Mengimplementasikan konfigurasi jaringan dasar, komunikasi data aplikasi, enkapsulasi, dan polymorphism.
3. Penalaran (Reasoning): Menganalisis kendala konektivitas & struktur data, Mengevaluasi efektivitas struktur kontrol & desain modular, Mengklasifikasi ketepatan access modifier & inheritance.`,
      matriksAsesmen: `Matriks Asesmen PPLG:
1. Wawasan dunia kerja PPLG: Profesi, tugas utama (UI/UX, Backend, QA, Devops), Technopreneurship, Manajemen proyek Agile/Scrum, Budaya mutu.
2. Kecakapan kerja dasar & K3: Prinsip K3LH teknologi informasi, Etika kerja profesional, Pengelolaan aset fisik & digital (source code, database, dokumentasi).
3. Teknologi jaringan komputer: Konfigurasi sistem operasi web server, izin akses (permission denied / chmod), protokol TCP/IP, HTTP/HTTPS, REST API.
4. Pemrograman Terstruktur: Tipe data primitif & komposit, Percabangan (if-else, switch), Perulangan (for, while), Fungsi & Prosedur, Modularitas.
5. Pemrograman Berorientasi Objek: Class & Object, Access Modifier (public, private, protected), Enkapsulasi getter-setter, Pewarisan (extends), Polymorphism (overriding).`,
      contohSoal: `Contoh Soal Resmi TKA Kemendikbud:
- Soal 1 (PG): Tugas utama UI/UX Designer -> Merancang tampilan antarmuka dan pengalaman pengguna aplikasi.
- Soal 2 (PG): Error Linux Server 'Permission denied: /var/www/html/index.php' -> Mengubah hak akses pada file atau direktori proyek.
- Soal 5 (PGK Kategori): Potongan kode Python perulangan 'if n >= 75: jumlah_lulus += 1' -> Menentukan status Benar/Salah untuk 3 pernyataan logika.`,
    },
  });

  // 5. 5 PILAR RESMI KISI-KISI TKA: MATEMATIKA (Mapel Wajib)
  const kisiKisiMatematikaResmi = await prisma.kisiKisi.create({
    data: {
      mapel: "MATEMATIKA",
      topik: "Aljabar, Fungsi Kuadrat & Kalkulus TKA",
      definisi: `Mengukur kemampuan berpikir logis, penalaran matematis, analisis aljabar, dan kalkulus terapan dalam pemodelan masalah kontekstual kejuruan dan sains.`,
      muatan: `1. Aljabar & Fungsi Kuadrat: Persamaan kuadrat, diskriminan, titik puncak ekstrem fungsi, pemodelan parabola.
2. Matriks & Transformasi: Operasi matriks, determinan, invers matriks 2x2 dan 3x3, transpos matriks.
3. Kalkulus Dasar: Turunan fungsi aljabar, titik stasioner, garis singgung kurva, integral tentu, dan luas daerah di bawah kurva.
4. Statistika & Peluang: Ukuran pemusatan data (Mean, Median, Modus), simpangan baku, kaidah pencacahan, peluang kejadian majemuk.`,
      kompetensi: `Level Kognitif:
- L1 (Pemahaman): Menentukan nilai variabel pada persamaan aljabar dan rumus dasar integral/turunan.
- L2 (Aplikasi): Menghitung luas daerah kurva dan menerapkan sifat matriks pada sistem persamaan linear.
- L3 (Penalaran): Menganalisis titik ekstrem optimum dan memecahkan studi kasus optimasi matematis.`,
      matriksAsesmen: `1. Fungsi Kuadrat: Koordinat titik puncak x_p = -b/(2a), y_p = f(x_p).
2. Determinan Matriks: Det(A) = ad - bc, Invers A^-1 = (1/det) * Adj(A).
3. Integral Tentu: Integral f(x) dx dari a ke b = F(b) - F(a).`,
      contohSoal: `Diketahui fungsi kuadrat f(x) = -2x^2 + 8x - 3. Titik puncak grafik adalah (2, 5). Integral tentu dari 1 ke 3 (3x^2 - 4x + 2) dx bernilai 14.`,
    },
  });

  // 6. BANK SOAL AKTIF RESMI TKA (Termasuk 3 Butir Soal Resmi dari Web TKA)
  const bankSoalData = [
    // Soal 1: PPLG Resmi Kemendikbud (Profesi UI/UX Designer)
    {
      mapel: "PPLG",
      kisiKisiId: kisiKisiPplgResmi.id,
      tipeSoal: "PILIHAN_GANDA",
      pertanyaan: "Dalam sebuah tim pengembangan perangkat lunak terdapat beberapa profesi dengan tugas yang berbeda. Tugas utama dari **UI/UX Designer** dalam proses pengembangan aplikasi adalah…",
      opsiJawaban: JSON.stringify([
        { id: "A", label: "Mengelola server agar aplikasi dapat berjalan stabil" },
        { id: "B", label: "Merancang tampilan antarmuka dan pengalaman pengguna aplikasi" },
        { id: "C", label: "Menulis kode program untuk memproses data pada sisi server" },
        { id: "D", label: "Melakukan pengujian keamanan terhadap sistem aplikasi" },
        { id: "E", label: "Mengatur proses distribusi aplikasi ke pengguna" }
      ]),
      kunciJawaban: "B",
      pembahasan: "Profesi dalam tim rekayasa perangkat lunak memiliki spesialisasi:\n- **UI/UX Designer**: Bertugas merancang *User Interface* (tampilan visual/antarmuka) dan *User Experience* (kemudahan dan pengalaman alur pengguna).\n- Backend Developer: Menulis kode sisi server dan database (Opsi C).\n- DevOps / SysAdmin: Mengelola server dan infrastruktur (Opsi A).\n- QA / Security Engineer: Pengujian sistem dan keamanan (Opsi D).\nMaka jawaban yang tepat adalah **Opsi B**.",
      status: "AKTIF",
      source: "KEMENDIKBUD_RESMI",
    },
    // Soal 2: PPLG Resmi Kemendikbud (Linux Server Permission Denied)
    {
      mapel: "PPLG",
      kisiKisiId: kisiKisiPplgResmi.id,
      tipeSoal: "PILIHAN_GANDA",
      pertanyaan: `Seorang pengembang aplikasi web sedang menyiapkan proyek pada server lokal untuk keperluan pengujian. Saat aplikasi diakses melalui browser, muncul pesan kesalahan berikut:

\`\`\`bash
Permission denied: /var/www/html/index.php
\`\`\`

Agar aplikasi web dapat diakses dengan normal, tindakan yang paling tepat adalah ....`,
      opsiJawaban: JSON.stringify([
        { id: "A", label: "Mengaktifkan layanan web server agar dapat memproses file PHP" },
        { id: "B", label: "Mengubah hak akses pada file atau direktori proyek" },
        { id: "C", label: "Memasang bahasa pemrograman PHP pada sistem server" },
        { id: "D", label: "Mengatur ulang port yang digunakan oleh web server" },
        { id: "E", label: "Memindahkan file aplikasi ke direktori lain pada sistem" }
      ]),
      kunciJawaban: "B",
      pembahasan: "Pesan kesalahan `Permission denied` pada sistem operasi Linux/Unix terjadi karena proses web server (misal `www-data` atau `nginx`) tidak memiliki hak izin baca/eksekusi (*read/execute permission*) terhadap file atau direktori target. Tindakan yang tepat adalah **mengubah hak akses/kepemilikan file** (misal menggunakan perintah `chmod` atau `chown`) agar web server dapat membaca file tersebut (Opsi B).",
      status: "AKTIF",
      source: "KEMENDIKBUD_RESMI",
    },
    // Soal 3: PPLG Resmi Kemendikbud (PGK Kategori Python Loop & Logic)
    {
      mapel: "PPLG",
      kisiKisiId: kisiKisiPplgResmi.id,
      tipeSoal: "PGK_KATEGORI",
      pertanyaan: `Perhatikan potongan program Python berikut:

\`\`\`python
nilai = [70, 85, 60, 90]
jumlah_lulus = 0

for n in nilai:
    if n >= 75:
        jumlah_lulus += 1

print(jumlah_lulus)
\`\`\`

Tentukan kategori (**Benar** atau **Salah**) untuk setiap pernyataan berikut berdasarkan program tersebut:`,
      opsiJawaban: JSON.stringify({
        categories: ["Benar", "Salah"],
        statements: [
          { id: 1, text: "Perulangan `for n in nilai:` digunakan untuk memeriksa setiap elemen nilai dalam daftar `nilai`" },
          { id: 2, text: "Nilai 75 masuk kategori kondisi Lulus (`n >= 75`)" },
          { id: 3, text: "Pada akhir program, isi variabel `jumlah_lulus` yang dicetak adalah 3" }
        ]
      }),
      kunciJawaban: JSON.stringify([
        { id: 1, answer: "Benar" },
        { id: 2, answer: "Benar" },
        { id: 3, answer: "Salah" }
      ]),
      pembahasan: "Analisis eksekusi program:\n- Pernyataan 1: **BENAR** (Perulangan `for` melakukan iterasi memeriksa tiap elemen dalam list `[70, 85, 60, 90]`).\n- Pernyataan 2: **BENAR** (Operator `>=` berarti nilai 75 memenuhi kondisi).\n- Pernyataan 3: **SALAH** (Nilai yang memenuhi `n >= 75` adalah 85 dan 90, sehingga total `jumlah_lulus` adalah **2**, bukan 3).",
      status: "AKTIF",
      source: "KEMENDIKBUD_RESMI",
    },
    // Soal 4: PPLG - MCMA (OOP Principles)
    {
      mapel: "PPLG",
      kisiKisiId: kisiKisiPplgResmi.id,
      tipeSoal: "MCMA",
      pertanyaan: "Dalam konsep Pemrograman Berorientasi Objek (OOP) pada pengembangan aplikasi perangkat lunak dan gim, manakah pernyataan-pernyataan berikut yang bernilai **BENAR**? *(Pilih lebih dari satu)*",
      opsiJawaban: JSON.stringify([
        { id: "A", label: "Enkapsulasi bertujuan menyembunyikan data internal objek dan hanya mengizinkan akses melalui method/accessor" },
        { id: "B", label: "Access modifier 'private' membuat atribut hanya dapat diakses dari dalam class itu sendiri" },
        { id: "C", label: "Inheritance memungkinkan class turunan (subclass) mewarisi atribut dan method dari class induk (superclass)" },
        { id: "D", label: "Polymorphism method overriding mengharuskan nama method dan tipe parameter diubah total dari class induk" },
        { id: "E", label: "Sebuah class hanya dapat membuat maksimal satu objek saja di dalam memori" }
      ]),
      kunciJawaban: JSON.stringify(["A", "B", "C"]),
      pembahasan: "- A, B, C adalah prinsip fundamental OOP.\n- D salah karena method overriding mempertahankan nama dan signature method.\n- E salah karena satu class bisa diinstansiasi menjadi banyak objek.",
      status: "AKTIF",
      source: "AI_GEMINI",
    },
    // Soal 5: Matematika - Pilihan Ganda (Fungsi Kuadrat)
    {
      mapel: "MATEMATIKA",
      kisiKisiId: kisiKisiMatematikaResmi.id,
      tipeSoal: "PILIHAN_GANDA",
      pertanyaan: "Diketahui fungsi kuadrat $f(x) = -2x^2 + 8x - 3$. Koordinat titik puncak (ekstrem) dari grafik fungsi tersebut adalah...",
      opsiJawaban: JSON.stringify([
        { id: "A", label: "$(2, 5)$" },
        { id: "B", label: "$(2, -5)$" },
        { id: "C", label: "$(-2, 5)$" },
        { id: "D", label: "$(4, 5)$" },
        { id: "E", label: "$(-4, -3)$" }
      ]),
      kunciJawaban: "A",
      pembahasan: "Untuk fungsi $f(x) = ax^2 + bx + c$ dengan $a = -2, b = 8, c = -3$:\n- $x_p = -\\frac{b}{2a} = -\\frac{8}{2(-2)} = 2$\n- $y_p = f(2) = -2(2)^2 + 8(2) - 3 = -8 + 16 - 3 = 5$\nKoordinat titik puncak adalah **$(2, 5)$** (Opsi A).",
      status: "AKTIF",
      source: "AI_GEMINI",
    },
    // Soal 6: Matematika - Pilihan Ganda (Integral Tentu)
    {
      mapel: "MATEMATIKA",
      kisiKisiId: kisiKisiMatematikaResmi.id,
      tipeSoal: "PILIHAN_GANDA",
      pertanyaan: "Nilai dari integral tentu $\\int_{1}^{3} (3x^2 - 4x + 2) \\, dx$ adalah...",
      opsiJawaban: JSON.stringify([
        { id: "A", label: "$12$" },
        { id: "B", label: "$14$" },
        { id: "C", label: "$16$" },
        { id: "D", label: "$18$" },
        { id: "E", label: "$20$" }
      ]),
      kunciJawaban: "B",
      pembahasan: "$$\\int (3x^2 - 4x + 2) \\, dx = [x^3 - 2x^2 + 2x]_1^3$$\n$$F(3) = 27 - 18 + 6 = 15$$\n$$F(1) = 1 - 2 + 2 = 1$$\n$$F(3) - F(1) = 15 - 1 = 14$$ (Opsi B).",
      status: "AKTIF",
      source: "AI_GEMINI",
    },
    // Soal 7: Matematika - MCMA (Matriks & Determinan)
    {
      mapel: "MATEMATIKA",
      kisiKisiId: kisiKisiMatematikaResmi.id,
      tipeSoal: "MCMA",
      pertanyaan: "Diberikan matriks $A = \\begin{pmatrix} 2 & 1 \\\\ 4 & 3 \\end{pmatrix}$. Manakah pernyataan-pernyataan berikut yang bernilai **BENAR**? *(Pilih lebih dari satu)*",
      opsiJawaban: JSON.stringify([
        { id: "A", label: "Determinan dari matriks $A$ adalah $|A| = 2$" },
        { id: "B", label: "Matriks $A$ memiliki invers karena determinannya tidak sama dengan nol" },
        { id: "C", label: "Invers matriks $A$ adalah $A^{-1} = \\frac{1}{2} \\begin{pmatrix} 3 & -1 \\\\ -4 & 2 \\end{pmatrix}$" },
        { id: "D", label: "Transpose matriks $A$ adalah $A^T = \\begin{pmatrix} 3 & 4 \\\\ 1 & 2 \\end{pmatrix}$" },
        { id: "E", label: "Determinan dari $A^T$ bernilai $-2$" }
      ]),
      kunciJawaban: JSON.stringify(["A", "B", "C"]),
      pembahasan: "1. $|A| = (2)(3) - (1)(4) = 6 - 4 = 2$ -> **BENAR (A)**\n2. Karena $|A| = 2 \\neq 0$, matriks memiliki invers -> **BENAR (B)**\n3. $A^{-1} = \\frac{1}{2} \\begin{pmatrix} 3 & -1 \\\\ -4 & 2 \\end{pmatrix}$ -> **BENAR (C)**\nPernyataan benar: **A, B, dan C**.",
      status: "AKTIF",
      source: "AI_GEMINI",
    },
    // Soal 8: Bahasa Indonesia - Pilihan Ganda (Ide Pokok Teks Ilmiah Industri)
    {
      mapel: "BAHASA_INDONESIA",
      tipeSoal: "PILIHAN_GANDA",
      pertanyaan: "Bacalah kutipan teks berikut:\n\n*Transformasi digital pada lini manufaktur dan industri modern tidak sekadar berfokus pada pergantian perangkat keras analog menjadi otomatisasi robotik. Keberhasilan integrasi sistem siber-fisik sangat ditentukan oleh kesiapan sumber daya manusia dalam mengolah dan menginterpretasikan arus data analitik secara tepat waktu untuk pengambilan keputusan preventif.*\n\nIde pokok paragraf di atas adalah...",
      opsiJawaban: JSON.stringify([
        { id: "A", label: "Pergantian perangkat keras analog menjadi mesin robotik di pabrik" },
        { id: "B", label: "Faktor penentu utama keberhasilan integrasi transformasi digital industri" },
        { id: "C", label: "Kelemahan tenaga kerja industri dalam mengoperasikan perangkat lunak analitik" },
        { id: "D", label: "Biaya investasi teknologi siber-fisik pada industri manufaktur modern" },
        { id: "E", label: "Tantangan kecepatan pengiriman data sensor pada sistem jaringan pabrik" }
      ]),
      kunciJawaban: "B",
      pembahasan: "Paragraf tersebut menegaskan bahwa transformasi digital tidak hanya soal mesin fisik, melainkan ditentukan oleh kesiapan SDM dalam interpretasi data (faktor penentu keberhasilan integrasi). Maka ide pokok yang tepat adalah **Opsi B**.",
      status: "AKTIF",
      source: "KEMENDIKBUD_RESMI",
    },
    // Soal 9: Bahasa Inggris - Pilihan Ganda (Technical Context & Passive Voice)
    {
      mapel: "BAHASA_INGGRIS",
      tipeSoal: "PILIHAN_GANDA",
      pertanyaan: "Read the technical notice below:\n\n*\"Before deploying the newly built microservice to the staging cluster, all automated regression tests ______ by the continuous integration pipeline to ensure zero downtime.\"*\n\nChoose the most appropriate phrase to complete the sentence:",
      opsiJawaban: JSON.stringify([
        { id: "A", label: "must be executed" },
        { id: "B", label: "has been executing" },
        { id: "C", label: "was executed" },
        { id: "D", label: "is executing" },
        { id: "E", label: "to execute" }
      ]),
      kunciJawaban: "A",
      pembahasan: "Subjek kalimat adalah 'all automated regression tests' (jamak/plural) yang menerima tindakan (pasif) dengan modal keharusan 'must'. Bentuk pasif modal yang benar adalah 'must be + V3' -> **must be executed** (Opsi A).",
      status: "AKTIF",
      source: "KEMENDIKBUD_RESMI",
    },
    // Soal 10: Administrasi Infrastruktur Jaringan - Pilihan Ganda (VLAN & Subnetting)
    {
      mapel: "ADMINISTRASI_INFRASTRUKTUR_JARINGAN",
      tipeSoal: "PILIHAN_GANDA",
      pertanyaan: "Pada topologi jaringan berbasis switch manageable, administrator ingin melewatkan beberapa VLAN ID (VLAN 10, VLAN 20, dan VLAN 30) melalui satu kabel uplink fisik menuju router gateway. Konfigurasi mode port switch yang wajib diterapkan pada antarmuka uplink tersebut adalah...",
      opsiJawaban: JSON.stringify([
        { id: "A", label: "Mode Access dengan PVID default 1" },
        { id: "B", label: "Mode Trunk dengan enkapsulasi IEEE 802.1Q" },
        { id: "C", label: "Mode Dynamic Auto tanpa tagging frame" },
        { id: "D", label: "Mode Port Security dengan batasan single MAC" },
        { id: "E", label: "Mode Loop Protect broadcast storm" }
      ]),
      kunciJawaban: "B",
      pembahasan: "Untuk melewatkan beberapa traffic VLAN (*multiple VLANs*) melalui satu sambungan fisik inter-switch atau switch-ke-router, port harus dikonfigurasi dalam mode **Trunk** menggunakan standar tagging frame **IEEE 802.1Q** (Opsi B).",
      status: "AKTIF",
      source: "KEMENDIKBUD_RESMI",
    }
  ];

  for (const s of bankSoalData) {
    await prisma.soal.create({ data: s });
  }

  // 7. Seed mock progres latihan siswa
  const allActiveSoal = await prisma.soal.findMany({ where: { status: "AKTIF" } });
  const activeSiswa = await prisma.siswa.findMany({ where: { statusAkun: "AKTIF" }, take: 20 });

  for (let sIdx = 0; sIdx < activeSiswa.length; sIdx++) {
    const siswa = activeSiswa[sIdx];
    for (let qIdx = 0; qIdx < allActiveSoal.length; qIdx++) {
      const q = allActiveSoal[qIdx];
      let isBenar = false;
      let userAns = "";

      if (q.tipeSoal === "PILIHAN_GANDA") {
        const correct = q.kunciJawaban;
        if (qIdx === 0) isBenar = (sIdx % 4 !== 0); // 75%
        else if (qIdx === 1) isBenar = (sIdx % 3 !== 0); // 66%
        else if (qIdx === 4) isBenar = (sIdx % 5 !== 0); // 80%
        else isBenar = (sIdx % 3 === 0); // 33%
        userAns = isBenar ? correct : (correct === "A" ? "B" : "C");
      } else if (q.tipeSoal === "MCMA") {
        isBenar = (sIdx % 2 === 0);
        userAns = isBenar ? q.kunciJawaban : JSON.stringify(["A", "D"]);
      } else if (q.tipeSoal === "PGK_KATEGORI") {
        isBenar = (sIdx % 2 !== 0);
        userAns = isBenar ? q.kunciJawaban : JSON.stringify([{ id: 1, answer: "Salah" }, { id: 2, answer: "Salah" }, { id: 3, answer: "Sesuai" }]);
      }

      await prisma.progresLatihan.create({
        data: {
          id: `sub-${siswa.nis}-${q.id}-${Date.now()}-${sIdx}-${qIdx}`,
          siswaId: siswa.id,
          soalId: q.id,
          jawabanSiswa: typeof userAns === "string" ? userAns : JSON.stringify(userAns),
          isBenar,
          skor: isBenar ? 100 : 0,
          waktuPengerjaan: Math.floor(Math.random() * 80) + 25,
          syncedAt: new Date(Date.now() - Math.floor(Math.random() * 86400000)),
        },
      });
    }
  }

  console.log("Seeding selesai dengan Kurikulum dan Soal Resmi TKA Kemendikbud!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });