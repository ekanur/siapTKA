import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database siapTKA...");

  // 1. Clean existing records
  await prisma.progresLatihan.deleteMany();
  await prisma.soal.deleteMany();
  await prisma.kisiKisi.deleteMany();
  await prisma.siswa.deleteMany();
  await prisma.userAdmin.deleteMany();

  // 2. Seed Admin Users
  await prisma.userAdmin.createMany({
    data: [
      {
        username: "admin",
        password: "adminpassword2026", // For dashboard login
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
        nama: "Ahmad Fauzi, S.Kom., M.T. (Guru PPLG)",
        role: "GURU",
      },
    ],
  });

  // 3. Seed 72 Siswa SIJA with PKL Industries
  const industriList = [
    "PT Telkom Akses",
    "PT Len Industri (Persero)",
    "PT Pindad (Persero)",
    "Dinas Kominfo Kota",
    "PT Kalimantan Prima Coal (Kalimantan)",
    "PT Berau Coal Energy (Kalimantan)",
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

    // Status variation for realistic testing
    let statusAkun = "BELUM_AKTIF";
    let statusTka = "BELUM_MERESPONS";
    let mapelPilihan1 = null;
    let mapelPilihan2 = null;
    let tanggalAktivasi = null;

    if (i <= 20) {
      statusAkun = "AKTIF";
      statusTka = "IKUT";
      mapelPilihan1 = "PPLG";
      mapelPilihan2 = "Teknik Komputer & Jaringan";
      tanggalAktivasi = new Date(Date.now() - (72 - i) * 3600000);
    } else if (i <= 25) {
      statusAkun = "AKTIF";
      statusTka = "TIDAK_IKUT";
      tanggalAktivasi = new Date(Date.now() - (72 - i) * 3600000);
    } else if (i <= 30) {
      statusAkun = "AKTIF";
      statusTka = "BELUM_MERESPONS";
      tanggalAktivasi = new Date(Date.now() - (72 - i) * 3600000);
    }

    // Add demo test student for easy instant login
    if (i === 1) {
      siswaData.push({
        nis: "22231001",
        nama: "Aditya Pratama (Siswa PKL Kalimantan)",
        email: "siswa.demo@gmail.com", // For instant testing with any Google login
        jurusan: "SIJA",
        namaIndustriPkl: "PT Kalimantan Prima Coal (Kalimantan)",
        statusAkun: "AKTIF",
        tanggalAktivasi: new Date(),
        statusTka: "IKUT",
        mapelPilihan1: "PPLG",
        mapelPilihan2: "Bahasa Inggris Lanjutan",
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

  // 4. Seed Official 5-Pillar Kisi-Kisi TKA
  const kisiKisiMatematika = await prisma.kisiKisi.create({
    data: {
      mapel: "MATEMATIKA",
      topik: "Aljabar, Fungsi Kuadrat & Matriks",
      definisi: "Mengukur kemampuan analisis aljabar, pemecahan persamaan fungsi kuadrat, dan operasi matriks dalam pemodelan masalah nyata.",
      muatan: "Persamaan dan Pertidaksamaan Linear/Kuadrat, Determinan & Invers Matriks 2x2 dan 3x3, Sistem Persamaan Linear Tiga Variabel (SPLTV).",
      kompetensi: "Peserta mampu mengidentifikasi sifat-sifat determinan matriks, menentukan nilai ekstrem fungsi kuadrat, dan menyelesaikan masalah optimasi sederhana.",
      matriksAsesmen: "Level Kognitif L2 (Penerapan) dan L3 (Penalaran): Peserta didik dapat mengkombinasikan sifat aljabar untuk menyelesaikan studi kasus.",
      contohSoal: "Diketahui matriks A = [[2, 1], [3, 4]] dan B = [[1, 0], [2, 3]]. Tentukan nilai determinan dari (A * B^T).",
    },
  });

  const kisiKisiKalkulus = await prisma.kisiKisi.create({
    data: {
      mapel: "MATEMATIKA",
      topik: "Kalkulus (Turunan & Integral Tentu)",
      definisi: "Mengukur pemahaman konsep laju perubahan sesaat, gradien garis singgung kurva, dan luas daerah dengan integral tentu.",
      muatan: "Turunan Fungsi Aljabar & Trigonometri, Titik Stasioner, Integral Tentu dan Luas Daerah di bawah kurva.",
      kompetensi: "Mampu menentukan interval fungsi naik/turun, titik maksimum/minimum, dan menghitung luas daerah yang dibatasi oleh dua kurva.",
      matriksAsesmen: "Level Kognitif L3 (Penalaran): Menghitung luas daerah antara parabola y = x^2 dan garis linear y = 2x + 3.",
      contohSoal: "Luas daerah yang dibatasi kurva y = x^2 - 4x + 3 dan sumbu-X pada interval 1 <= x <= 3 adalah...",
    },
  });

  const kisiKisiPplg = await prisma.kisiKisi.create({
    data: {
      mapel: "PPLG",
      topik: "Pemrograman Web, REST API & Arsitektur Backend",
      definisi: "Mengukur pemahaman struktur backend, protokol HTTP, siklus request-response, status code, dan pengolahan data JSON.",
      muatan: "RESTful API Best Practices, HTTP Methods (GET, POST, PUT, DELETE), Status Code (200, 201, 400, 401, 403, 404, 500), JSON Serialization, Middleware Keamanan.",
      kompetensi: "Mampu merancang endpoint API yang aman, menentukan HTTP method dan status code yang tepat, serta menguji respon API.",
      matriksAsesmen: "Level Kognitif L2 (Aplikasi) & L3 (Analisis): Menganalisis skenario request API dengan autentikasi Bearer Token dan penanganan error.",
      contohSoal: "Sebuah request POST ke /api/v1/users berhasil membuat record baru. Status code HTTP yang paling tepat dikembalikan adalah 201 Created.",
    },
  });

  const kisiKisiDatabase = await prisma.kisiKisi.create({
    data: {
      mapel: "PPLG",
      topik: "Basis Data Relasional & Optimasi Kueri SQL",
      definisi: "Mengukur kemampuan normalisasi database, relasi tabel (1-N, N-N), JOIN kueri, indexing, dan transaksi ACID.",
      muatan: "DDL & DML SQL, Normalisasi 1NF-3NF, Foreign Key & Cascading, Indexing (B-Tree), Perbedaan INNER JOIN, LEFT JOIN, FULL JOIN.",
      kompetensi: "Mampu menulis kueri SQL kompleks untuk agregasi data dan menganalisis performa kueri menggunakan indeks.",
      matriksAsesmen: "Level Kognitif L2 & L3: Menganalisis hasil dari perintah LEFT JOIN ketika data di tabel kanan tidak memiliki pasangan yang cocok.",
      contohSoal: "SELECT s.nama, COUNT(p.id) FROM siswa s LEFT JOIN progres p ON s.id = p.siswa_id GROUP BY s.id.",
    },
  });

  // 5. Seed Questions for all 3 official TKA Formats (PILIHAN_GANDA, MCMA, PGK_KATEGORI)
  const sampleSoal = [
    // Soal 1: Matematika - Pilihan Ganda (Formula KaTeX)
    {
      mapel: "MATEMATIKA",
      kisiKisiId: kisiKisiMatematika.id,
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
      pembahasan: "Untuk fungsi $f(x) = ax^2 + bx + c$ dengan $a = -2$, $b = 8$, $c = -3$:\n- Absis titik puncak: $x_p = -\\frac{b}{2a} = -\\frac{8}{2(-2)} = 2$\n- Ordinat titik puncak: $y_p = f(2) = -2(2)^2 + 8(2) - 3 = -8 + 16 - 3 = 5$\nJadi, koordinat titik puncak adalah **$(2, 5)$** (Opsi A).",
      status: "AKTIF",
      source: "AI_GEMINI",
    },
    // Soal 2: Matematika - Kalkulus (Pilihan Ganda LaTeX)
    {
      mapel: "MATEMATIKA",
      kisiKisiId: kisiKisiKalkulus.id,
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
      pembahasan: "Cari antiturunan fungsi:\n$$\\int (3x^2 - 4x + 2) \\, dx = x^3 - 2x^2 + 2x$$\nEvaluasi batas dari $1$ sampai $3$:\n$$F(3) = (3)^3 - 2(3)^2 + 2(3) = 27 - 18 + 6 = 15$$\n$$F(1) = (1)^3 - 2(1)^2 + 2(1) = 1 - 2 + 2 = 1$$\n$$F(3) - F(1) = 15 - 1 = 14$$\nJadi nilainya adalah **$14$** (Opsi B).",
      status: "AKTIF",
      source: "AI_GEMINI",
    },
    // Soal 3: Matematika - MCMA (Multiple Choice Multiple Answer)
    {
      mapel: "MATEMATIKA",
      kisiKisiId: kisiKisiMatematika.id,
      tipeSoal: "MCMA",
      pertanyaan: "Diberikan matriks $A = \\begin{pmatrix} 2 & 1 \\\\ 4 & 3 \\end{pmatrix}$. Manakah pernyataan-pernyataan berikut yang bernilai **BENAR**? *(Pilih lebih dari satu jawaban yang sesuai)*",
      opsiJawaban: JSON.stringify([
        { id: "A", label: "Determinan dari matriks $A$ adalah $|A| = 2$" },
        { id: "B", label: "Matriks $A$ memiliki invers karena determinannya tidak sama dengan nol" },
        { id: "C", label: "Invers matriks $A$ adalah $A^{-1} = \\frac{1}{2} \\begin{pmatrix} 3 & -1 \\\\ -4 & 2 \\end{pmatrix}$" },
        { id: "D", label: "Transpose matriks $A$ adalah $A^T = \\begin{pmatrix} 3 & 4 \\\\ 1 & 2 \\end{pmatrix}$" },
        { id: "E", label: "Determinan dari $A^T$ bernilai $-2$" }
      ]),
      kunciJawaban: JSON.stringify(["A", "B", "C"]),
      pembahasan: "Analisis setiap pernyataan:\n1. $|A| = (2)(3) - (1)(4) = 6 - 4 = 2$ -> **BENAR (A)**\n2. Karena $|A| = 2 \\neq 0$, matriks memiliki invers -> **BENAR (B)**\n3. $A^{-1} = \\frac{1}{2} \\begin{pmatrix} 3 & -1 \\\\ -4 & 2 \\end{pmatrix}$ -> **BENAR (C)**\n4. $A^T = \\begin{pmatrix} 2 & 4 \\\\ 1 & 3 \\end{pmatrix}$ -> Salah (D)\n5. $|A^T| = |A| = 2$ -> Salah (E)\nJadi pernyataan benar adalah **A, B, dan C**.",
      status: "AKTIF",
      source: "AI_GEMINI",
    },
    // Soal 4: Matematika - PGK Kategori (Pilihan Ganda Kompleks Matriks Pernyataan)
    {
      mapel: "MATEMATIKA",
      kisiKisiId: kisiKisiKalkulus.id,
      tipeSoal: "PGK_KATEGORI",
      pertanyaan: "Perhatikan kurva fungsi $f(x) = x^3 - 3x^2 - 9x + 5$. Tentukan kategori kebenaran (*Benar* atau *Salah*) untuk setiap pernyataan berikut:",
      opsiJawaban: JSON.stringify({
        categories: ["Benar", "Salah"],
        statements: [
          { id: 1, text: "Turunan pertama fungsi adalah $f'(x) = 3x^2 - 6x - 9$" },
          { id: 2, text: "Titik stasioner fungsi tercapai pada saat $x = -1$ dan $x = 3$" },
          { id: 3, text: "Fungsi $f(x)$ selalu naik pada interval $-1 < x < 3$" },
          { id: 4, text: "Nilai maksimum lokal fungsi terjadi pada $x = -1$ dengan nilai $f(-1) = 10$" }
        ]
      }),
      kunciJawaban: JSON.stringify([
        { id: 1, answer: "Benar" },
        { id: 2, answer: "Benar" },
        { id: 3, answer: "Salah" },
        { id: 4, answer: "Benar" }
      ]),
      pembahasan: "- $f'(x) = 3x^2 - 6x - 9$ (Pernyataan 1: **Benar**)\n- $3(x^2 - 2x - 3) = 0 \\implies 3(x - 3)(x + 1) = 0 \\implies x = 3$ atau $x = -1$ (Pernyataan 2: **Benar**)\n- Untuk $-1 < x < 3$, nilai $f'(x) < 0$, artinya fungsi **turun**, bukan naik (Pernyataan 3: **Salah**)\n- $f(-1) = (-1)^3 - 3(-1)^2 - 9(-1) + 5 = -1 - 3 + 9 + 5 = 10$ adalah titik balik maksimum (Pernyataan 4: **Benar**)",
      status: "AKTIF",
      source: "AI_GEMINI",
    },
    // Soal 5: PPLG - Pilihan Ganda (REST API & Status Code)
    {
      mapel: "PPLG",
      kisiKisiId: kisiKisiPplg.id,
      tipeSoal: "PILIHAN_GANDA",
      pertanyaan: "Dalam perancangan REST API, seorang developer ingin mengembalikan respon saat klien mengirimkan request data JSON yang tidak valid (misal: format email salah atau field wajib kosong). Status Code HTTP yang paling sesuai standar adalah...",
      opsiJawaban: JSON.stringify([
        { id: "A", label: "200 OK" },
        { id: "B", label: "400 Bad Request" },
        { id: "C", label: "401 Unauthorized" },
        { id: "D", label: "403 Forbidden" },
        { id: "E", label: "500 Internal Server Error" }
      ]),
      kunciJawaban: "B",
      pembahasan: "- **400 Bad Request**: Digunakan saat terjadi kesalahan input/validasi di sisi klien (klien mengirim data yang tidak sesuai skema).\n- 401: Belum login / token tidak ada.\n- 403: Sudah login tapi tidak punya hak akses.\n- 500: Terjadi error/crash di sisi server.\nMaka jawaban yang paling tepat adalah **400 Bad Request** (Opsi B).",
      status: "AKTIF",
      source: "AI_GEMINI",
    },
    // Soal 6: PPLG - MCMA (Multiple Choice Multiple Answer)
    {
      mapel: "PPLG",
      kisiKisiId: kisiKisiPplg.id,
      tipeSoal: "MCMA",
      pertanyaan: "Manakah praktik-praktik berikut yang termasuk ke dalam standar keamanan (*security best practices*) dalam pengembangan REST API modern? *(Pilih lebih dari satu)*",
      opsiJawaban: JSON.stringify([
        { id: "A", label: "Menggunakan HTTPS untuk mengenkripsi data payload selama transmisi" },
        { id: "B", label: "Menyimpan password pengguna dalam database menggunakan hashing satu arah (misal: bcrypt/argon2) ber-salt" },
        { id: "C", label: "Menerapkan Rate Limiting untuk mencegah serangan Brute Force dan Denial of Service (DoS)" },
        { id: "D", label: "Menampilkan stack trace error database secara lengkap ke respon klien agar mudah di-debug pengguna umum" },
        { id: "E", label: "Menyimpan API Secret Key dan Database Password langsung di dalam file Javascript frontend (client-side bundle)" }
      ]),
      kunciJawaban: JSON.stringify(["A", "B", "C"]),
      pembahasan: "- A (HTTPS), B (Password Hashing), dan C (Rate Limiting) adalah pilar keamanan API.\n- D salah karena stack trace error mengekspos struktur internal database ke penyerang.\n- E salah fatal karena secret key tidak boleh diekspos di sisi klien.\nJawaban yang benar adalah **A, B, dan C**.",
      status: "AKTIF",
      source: "AI_GEMINI",
    },
    // Soal 7: PPLG - PGK Kategori (Database SQL Matrix Statements)
    {
      mapel: "PPLG",
      kisiKisiId: kisiKisiDatabase.id,
      tipeSoal: "PGK_KATEGORI",
      pertanyaan: "Berikut adalah pernyataan mengenai konsep Basis Data Relasional dan SQL. Tentukan kategori (*Sesuai* atau *Tidak Sesuai*) untuk setiap pernyataan:",
      opsiJawaban: JSON.stringify({
        categories: ["Sesuai", "Tidak Sesuai"],
        statements: [
          { id: 1, text: "Klausa 'WHERE' digunakan untuk memfilter baris data sebelum dilakukan pengelompokan ('GROUP BY')" },
          { id: 2, text: "Klausa 'HAVING' dapat menggunakan fungsi agregasi seperti COUNT(), SUM(), atau AVG()" },
          { id: 3, text: "Operasi 'INNER JOIN' akan tetap menampilkan record dari tabel kiri meskipun tidak memiliki kecocokan di tabel kanan" },
          { id: 4, text: "Pemberian Index (B-Tree) pada kolom yang sering digunakan di klausa WHERE dapat mempercepat performa pencarian query SELECT" }
        ]
      }),
      kunciJawaban: JSON.stringify([
        { id: 1, answer: "Sesuai" },
        { id: 2, answer: "Sesuai" },
        { id: 3, answer: "Tidak Sesuai" },
        { id: 4, answer: "Sesuai" }
      ]),
      pembahasan: "- Pernyataan 1: Sesuai (WHERE memfilter baris individual sebelum GROUP BY).\n- Pernyataan 2: Sesuai (HAVING memfilter hasil setelah fungsi agregasi).\n- Pernyataan 3: Tidak Sesuai (Itu adalah sifat LEFT JOIN, INNER JOIN hanya menampilkan data yang cocok di kedua tabel).\n- Pernyataan 4: Sesuai (Indeks mengoptimalkan lookup data).",
      status: "AKTIF",
      source: "AI_GEMINI",
    }
  ];

  for (const item of sampleSoal) {
    await prisma.soal.create({ data: item });
  }

  // 6. Seed mock Progres Latihan for item difficulty analysis demonstration
  const allActiveSoal = await prisma.soal.findMany({ where: { status: "AKTIF" } });
  const activeSiswa = await prisma.siswa.findMany({ where: { statusAkun: "AKTIF" }, take: 15 });

  for (let sIdx = 0; sIdx < activeSiswa.length; sIdx++) {
    const siswa = activeSiswa[sIdx];
    for (let qIdx = 0; qIdx < allActiveSoal.length; qIdx++) {
      const q = allActiveSoal[qIdx];
      // Simulate realistic correctness rate:
      // Soal 1 (Aljabar): 80% correct (Mudah)
      // Soal 2 (Kalkulus): 35% correct (Sulit)
      // Soal 3 (MCMA Math): 50% correct (Sedang)
      // Soal 5 (REST API): 85% correct (Mudah)
      // Soal 7 (SQL PGK): 45% correct (Sedang)
      let isBenar = false;
      let userAns = "";

      if (q.tipeSoal === "PILIHAN_GANDA") {
        const correct = q.kunciJawaban;
        if (qIdx === 0) isBenar = (sIdx % 5 !== 0); // 80%
        else if (qIdx === 1) isBenar = (sIdx % 3 === 0); // 33%
        else isBenar = (sIdx % 6 !== 0); // 83%
        userAns = isBenar ? correct : (correct === "A" ? "B" : "C");
      } else if (q.tipeSoal === "MCMA") {
        isBenar = (sIdx % 2 === 0);
        userAns = isBenar ? q.kunciJawaban : JSON.stringify(["A", "D"]);
      } else if (q.tipeSoal === "PGK_KATEGORI") {
        isBenar = (sIdx % 2 !== 0);
        userAns = isBenar ? q.kunciJawaban : JSON.stringify([{ id: 1, answer: "Salah" }, { id: 2, answer: "Salah" }, { id: 3, answer: "Sesuai" }, { id: 4, answer: "Sesuai" }]);
      }

      await prisma.progresLatihan.create({
        data: {
          id: `sub-${siswa.nis}-${q.id}-${Date.now()}-${sIdx}-${qIdx}`,
          siswaId: siswa.id,
          soalId: q.id,
          jawabanSiswa: typeof userAns === "string" ? userAns : JSON.stringify(userAns),
          isBenar,
          skor: isBenar ? 100 : 0,
          waktuPengerjaan: Math.floor(Math.random() * 90) + 30,
          syncedAt: new Date(Date.now() - Math.floor(Math.random() * 86400000)),
        },
      });
    }
  }

  console.log("Seeding selesai! 72 Siswa, Kisi-kisi 5 Pilar, Bank Soal 3 Tipe, dan Progres Latihan awal berhasil dibuat.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
