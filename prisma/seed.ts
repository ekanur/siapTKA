import { PrismaClient } from "@prisma/client";
import { DAFTAR_JURUSAN } from "../src/lib/constants/jurusan";
import fs from "fs";
import path from "path";
import Papa from "papaparse";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database siapTKA dengan 12 Jurusan Resmi SMKN 2 Depok Sleman...");

  // 1. Bersihkan database
  await prisma.progresLatihan.deleteMany();
  await prisma.soal.deleteMany();
  await prisma.siswa.deleteMany();
  await prisma.kelas.deleteMany();
  await prisma.userAdmin.deleteMany();

  // 2. Akun Guru & Admin Resmi
  await prisma.userAdmin.createMany({
    data: [
      {
        username: "eka.nur",
        email: "eka.nur@stembayo.sch.id",
        password: "GuruTKA2026!",
        nama: "Eka Nur Ahmad Romadhoni, S.Pd",
        role: "GURU",
        mapel: "PPLG",
      },
      {
        username: "admin_TKA",
        email: "admin@sekolah.sch.id",
        password: "AdminTKA2026!",
        nama: "Administrator Sekolah",
        role: "ADMIN",
        mapel: null,
      },
    ],
  });

  // 2b. Pengaturan Default Lini Masa TKA
  await prisma.pengaturanTka.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      isKonfirmasiOpen: true,
      tanggalMulai: new Date("2026-07-27T00:00:00.000Z"),
      tanggalSelesai: new Date("2026-09-10T23:59:59.999Z"),
      pesanPengumuman: "Batas pengumpulan surat pernyataan dan perubahan pilihan mapel TKA adalah 10 September 2026.",
      batasSuratPernyataan: new Date("2026-09-10T23:59:59.999Z"),
      pendaftaranMulai: new Date("2026-07-27T00:00:00.000Z"),
      pendaftaranSelesai: new Date("2026-09-27T23:59:59.999Z"),
      simulasiMulai: new Date("2026-09-21T00:00:00.000Z"),
      simulasiSelesai: new Date("2026-09-27T23:59:59.999Z"),
      gladiMulai: new Date("2026-10-05T00:00:00.000Z"),
      gladiSelesai: new Date("2026-10-18T23:59:59.999Z"),
      gelombang1Mulai: new Date("2026-10-26T00:00:00.000Z"),
      gelombang1Selesai: new Date("2026-10-29T23:59:59.999Z"),
      gelombang2Mulai: new Date("2026-11-02T00:00:00.000Z"),
      gelombang2Selesai: new Date("2026-11-05T23:59:59.999Z"),
    },
    update: {
      isKonfirmasiOpen: true,
      tanggalMulai: new Date("2026-07-27T00:00:00.000Z"),
      tanggalSelesai: new Date("2026-09-10T23:59:59.999Z"),
      pesanPengumuman: "Batas pengumpulan surat pernyataan dan perubahan pilihan mapel TKA adalah 10 September 2026.",
      batasSuratPernyataan: new Date("2026-09-10T23:59:59.999Z"),
      pendaftaranMulai: new Date("2026-07-27T00:00:00.000Z"),
      pendaftaranSelesai: new Date("2026-09-27T23:59:59.999Z"),
      simulasiMulai: new Date("2026-09-21T00:00:00.000Z"),
      simulasiSelesai: new Date("2026-09-27T23:59:59.999Z"),
      gladiMulai: new Date("2026-10-05T00:00:00.000Z"),
      gladiSelesai: new Date("2026-10-18T23:59:59.999Z"),
      gelombang1Mulai: new Date("2026-10-26T00:00:00.000Z"),
      gelombang1Selesai: new Date("2026-10-29T23:59:59.999Z"),
      gelombang2Mulai: new Date("2026-11-02T00:00:00.000Z"),
      gelombang2Selesai: new Date("2026-11-05T23:59:59.999Z"),
    },
  });

  // 2c. Master Kelas untuk 12 Jurusan Resmi SMKN 2 Depok Sleman
  const classMap: { [rombelName: string]: any } = {};
  for (const jur of DAFTAR_JURUSAN) {
    for (const rombel of jur.rombelDefault) {
      const cls = await prisma.kelas.create({
        data: {
          nama: rombel,
          tingkat: jur.tingkatDefault,
          jurusan: jur.id,
        },
      });
      classMap[rombel] = cls;
    }
  }

  // 3. Siswa Berbasis Data CSV Resmi Sekolah
  const siswaCsvPath = path.join(process.cwd(), "public", "templates", "template_siswa.csv");
  const siswaCsvContent = fs.readFileSync(siswaCsvPath, "utf8");
  const siswaParsed = Papa.parse(siswaCsvContent, { header: true, skipEmptyLines: true });

  for (const st of siswaParsed.data as any[]) {
    if (!st.nis || !st.nama || !st.email) continue;
    const rawKelas = (st.kelas || "").trim().toUpperCase();
    const assignedClass = classMap[rawKelas];

    await prisma.siswa.create({
      data: {
        nis: String(st.nis).trim(),
        nama: String(st.nama).trim(),
        email: String(st.email).trim().toLowerCase(),
        jurusan: (st.jurusan || "SIJA").trim().toUpperCase(),
        kelasId: assignedClass?.id || null,
        namaKelas: rawKelas,
        namaIndustriPkl: (st.namaIndustriPkl || "").trim() || "Belum Ditentukan",
        statusAkun: "BELUM_AKTIF",
        statusTka: "BELUM_MERESPONS",
      },
    });
  }

  // 4. BANK SOAL AKTIF RESMI TKA (Termasuk 3 Butir Soal Resmi dari Web TKA)
  const bankSoalData = [
    // Soal 1: PPLG Resmi Kemendikbud (Profesi UI/UX Designer)
    {
      mapel: "PPLG",
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
      tipeSoal: "PGK_KATEGORI",
      pertanyaan: `Perhatikan potongan program Python berikut:

\`\`\`python
nilai = [70, 85, 60, 90]
jumlah_lulus = 0

for n in nilai:
    if n >= 75:
        jumlah_lulus += 1
\`\`\`

Berdasarkan kode di atas, tentukan kebenaran setiap pernyataan berikut (Benar / Salah)!`,
      opsiJawaban: JSON.stringify([
        { id: 1, pernyataan: "Variabel jumlah_lulus digunakan untuk menghitung banyaknya siswa yang tuntas.", answer: "Sesuai" },
        { id: 2, pernyataan: "Nilai akhir variabel jumlah_lulus setelah perulangan selesai adalah 2.", answer: "Sesuai" },
        { id: 3, pernyataan: "Nilai 70 dan 60 memenuhi kondisi percabangan `if n >= 75`.", answer: "Salah" },
      ]),
      kunciJawaban: JSON.stringify([
        { id: 1, answer: "Sesuai" },
        { id: 2, answer: "Sesuai" },
        { id: 3, answer: "Salah" },
      ]),
      pembahasan: `Analisis eksekusi program:
1. Variabel 'jumlah_lulus' bertindak sebagai counter pencacah yang di-increment setiap kali ditemukan nilai yang >= 75. (Pernyataan 1: Sesuai/Benar).
2. Elemen array:
   - 70 >= 75 -> False
   - 85 >= 75 -> True (counter = 1)
   - 60 >= 75 -> False
   - 90 >= 75 -> True (counter = 2)
   Nilai akhir 'jumlah_lulus' adalah 2. (Pernyataan 2: Sesuai/Benar).
3. Nilai 70 dan 60 bernilai lebih kecil dari 75, sehingga TIDAK memenuhi kondisi 'n >= 75'. (Pernyataan 3: Salah).`,
      status: "AKTIF",
      source: "KEMENDIKBUD_RESMI",
    },
    // Soal 4: AIJ
    {
      mapel: "AIJ",
      tipeSoal: "PILIHAN_GANDA",
      pertanyaan: "Dalam perancangan VLAN pada switch manageable gedung bengkel SMKN 2 Depok, port yang menghubungkan switch utama ke router gateway harus dikonfigurasi dalam mode…",
      opsiJawaban: JSON.stringify([
        { id: "A", label: "Access Port dengan Native VLAN" },
        { id: "B", label: "Trunk Port dengan enkapsulasi IEEE 802.1Q" },
        { id: "C", label: "Port Mirroring untuk monitoring lalu lintas data" },
        { id: "D", label: "Dynamic Desirable tanpa enkapsulasi" },
        { id: "E", label: "Loopback Port untuk routing internal" }
      ]),
      kunciJawaban: "B",
      pembahasan: "Trunk port (IEEE 802.1Q) berfungsi meneruskan frame beberapa VLAN sekaligus melalui satu jalur fisik menuju router (inter-VLAN routing / router-on-a-stick).",
      status: "AKTIF",
      source: "AI_GENERATED",
    },
    // Soal 5: Matematika
    {
      mapel: "MATEMATIKA",
      tipeSoal: "PILIHAN_GANDA",
      pertanyaan: "Sebuah lintasan peluru di bengkel fabrikasi mengikuti fungsi kuadrat \\( h(t) = -2t^2 + 8t + 10 \\) meter, di mana \\( t \\) dalam detik. Tinggi maksimum yang dapat dicapai peluru tersebut adalah…",
      opsiJawaban: JSON.stringify([
        { id: "A", label: "16 meter" },
        { id: "B", label: "18 meter" },
        { id: "C", label: "20 meter" },
        { id: "D", label: "22 meter" },
        { id: "E", label: "24 meter" }
      ]),
      kunciJawaban: "B",
      pembahasan: "Titik waktu puncak t = -b/(2a) = -8 / (2 * -2) = 2 detik. Tinggi maksimum h(2) = -2(2)^2 + 8(2) + 10 = -8 + 16 + 10 = 18 meter.",
      status: "AKTIF",
      source: "KEMENDIKBUD_RESMI",
    },
    // Soal 6: Matematika MCMA
    {
      mapel: "MATEMATIKA",
      tipeSoal: "MCMA",
      pertanyaan: "Manakah pernyataan matematika berikut yang bernilai **BENAR** terkait sifat matriks dan determinan? *(Pilih 2 jawaban yang tepat)*",
      opsiJawaban: JSON.stringify([
        { id: "A", label: "Jika det(A) = 0, maka matriks A tidak memiliki invers (matriks singular)." },
        { id: "B", label: "Operasi perkalian matriks selalu bersifat komutatif (A x B = B x A)." },
        { id: "C", label: "Determinan dari matriks transpos A^T selalu sama dengan det(A)." },
        { id: "D", label: "Matriks identitas selalu memiliki nilai determinan sama dengan 0." }
      ]),
      kunciJawaban: JSON.stringify(["A", "C"]),
      pembahasan: "- A: Benar, syarat matriks invertible adalah det(A) ≠ 0.\n- B: Salah, perkalian matriks umumnya tidak komutatif (AB ≠ BA).\n- C: Benar, det(A^T) = det(A).\n- D: Salah, det(I) = 1.",
      status: "AKTIF",
      source: "KEMENDIKBUD_RESMI",
    },
    // Soal 7: Bahasa Indonesia
    {
      mapel: "BAHASA_INDONESIA",
      tipeSoal: "PILIHAN_GANDA",
      pertanyaan: "Cermati kutipan teks laporan hasil observasi industri berikut:\n\n*\"Proses pengelasan SMAW pada rangka baja menggunakan elektroda berdiameter 3,2 mm. Operator harus menjaga jarak busur listrik secara konsisten agar tidak timbul cacat porositas.\"*\n\nMakna istilah teknis **porositas** dalam kutipan di atas adalah…",
      opsiJawaban: JSON.stringify([
        { id: "A", label: "Keretakan pada permukaan logam akibat pendinginan cepat" },
        { id: "B", label: "Cacat berupa rongga-rongga udara kecil di dalam logam las" },
        { id: "C", label: "Penetrasi las yang tembus melebihi batas ketebalan pelat" },
        { id: "D", label: "Percikan terak las yang menempel pada benda kerja" },
        { id: "E", label: "Ketidaksejajaran sambungan pelat saat dilakukan tack weld" }
      ]),
      kunciJawaban: "B",
      pembahasan: "Porositas (porosity) pada teknik pengelasan adalah cacat las berupa lubang atau rongga-rongga udara kecil mirip pori-pori yang terjebak di dalam logam lasan.",
      status: "AKTIF",
      source: "AI_GENERATED",
    },
    // Soal 8: Bahasa Inggris
    {
      mapel: "BAHASA_INGGRIS",
      tipeSoal: "PILIHAN_GANDA",
      pertanyaan: "Read the workplace notice below:\n\n*\"All interns entering the mining geology laboratory must wear safety goggles, steel-toed boots, and high-visibility vests at all times. Failure to comply will result in immediate suspension of lab access.\"*\n\nWhat is the primary purpose of the notice?",
      opsiJawaban: JSON.stringify([
        { id: "A", label: "To invite interns to visit the mining geology laboratory" },
        { id: "B", label: "To inform interns about PPE requirements and safety compliance in the lab" },
        { id: "C", label: "To announce the schedule of geology equipment calibration" },
        { id: "D", label: "To explain the procedure for testing mineral samples" },
        { id: "E", label: "To distribute safety gear to new laboratory visitors" }
      ]),
      kunciJawaban: "B",
      pembahasan: "Teks tersebut menyampaikan instruksi wajib pemakaian Alat Pelindung Diri (PPE: safety goggles, boots, vest) serta sanksi jika melanggar. Tujuannya adalah menginformasikan persyaratan keselamatan kerja dan kepatuhan.",
      status: "AKTIF",
      source: "AI_GENERATED",
    },
  ];

  for (const s of bankSoalData) {
    await prisma.soal.create({ data: s });
  }

  // 7. Seed mock progres latihan siswa aktif di berbagai rombel kelas
  const allActiveSoal = await prisma.soal.findMany({ where: { status: "AKTIF" } });
  const activeSiswa = await prisma.siswa.findMany({ where: { statusAkun: "AKTIF" }, take: 25 });

  for (let sIdx = 0; sIdx < activeSiswa.length; sIdx++) {
    const siswa = activeSiswa[sIdx];
    for (let qIdx = 0; qIdx < allActiveSoal.length; qIdx++) {
      const q = allActiveSoal[qIdx];
      let isBenar = false;
      let userAns: any = "";

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

  console.log("Seeding selesai untuk 12 Jurusan Resmi SMKN 2 Depok Sleman!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });