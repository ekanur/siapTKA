const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log("🚀 Memulai pemulihan data 71 siswa & akun sistem resmi SMKN 2 Depok Sleman...");

  // 1. Pastikan Akun Admin & Guru Tersedia
  await prisma.userAdmin.upsert({
    where: { username: "admin_TKA" },
    create: {
      username: "admin_TKA",
      email: "admin@sekolah.sch.id",
      password: "AdminTKA2026!",
      nama: "Administrator Sekolah",
      role: "ADMIN",
      mapel: null,
    },
    update: {},
  });

  await prisma.userAdmin.upsert({
    where: { username: "eka.nur" },
    create: {
      username: "eka.nur",
      email: "eka.nur@stembayo.sch.id",
      password: "GuruTKA2026!",
      nama: "Eka Nur Ahmad Romadhoni, S.Pd",
      role: "GURU",
      mapel: "PPLG",
    },
    update: {},
  });

  // 2. Pastikan Lini Masa Default Ada
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
    update: {},
  });

  // 3. Pastikan kelas 13 SIJA A dan 13 SIJA B ada
  const kelasA = await prisma.kelas.upsert({
    where: { nama: "13 SIJA A" },
    create: { nama: "13 SIJA A", tingkat: 13, jurusan: "SIJA" },
    update: { tingkat: 13, jurusan: "SIJA" },
  });

  const kelasB = await prisma.kelas.upsert({
    where: { nama: "13 SIJA B" },
    create: { nama: "13 SIJA B", tingkat: 13, jurusan: "SIJA" },
    update: { tingkat: 13, jurusan: "SIJA" },
  });

  const classMap = {
    "13 SIJA A": kelasA.id,
    "13 SIJA B": kelasB.id,
  };

  // 4. Baca CSV data siswa resmi
  const csvPath = path.join(__dirname, "..", "data", "real", "template_siswa.csv");
  if (!fs.existsSync(csvPath)) {
    console.error("❌ Berkas CSV tidak ditemukan di:", csvPath);
    process.exit(1);
  }

  const content = fs.readFileSync(csvPath, "utf8");
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);

  let restored = 0;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const matches = [];
    let current = "";
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const char = line[c];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        matches.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
    matches.push(current.trim());

    const nis = matches[0];
    const nama = matches[1];
    const email = matches[2];
    const kelas = matches[3];
    const jurusan = matches[4] || "SIJA";
    const namaIndustriPkl = matches[5] || "Belum Ditentukan";

    if (!nis || !nama || !email) continue;

    const kelasId = classMap[kelas] || null;

    await prisma.siswa.upsert({
      where: { nis: String(nis).trim() },
      create: {
        nis: String(nis).trim(),
        nama: String(nama).trim(),
        email: String(email).trim().toLowerCase(),
        jurusan: jurusan.trim().toUpperCase(),
        kelasId,
        namaKelas: kelas.trim(),
        namaIndustriPkl: namaIndustriPkl.trim() || "Belum Ditentukan",
        statusAkun: "BELUM_AKTIF",
        statusTka: "BELUM_MERESPONS",
      },
      update: {
        nama: String(nama).trim(),
        email: String(email).trim().toLowerCase(),
        jurusan: jurusan.trim().toUpperCase(),
        kelasId: kelasId || undefined,
        namaKelas: kelas.trim(),
        namaIndustriPkl: namaIndustriPkl.trim() || undefined,
      },
    });
    restored++;
  }

  const total = await prisma.siswa.count();
  console.log(`✅ Berhasil memulihkan ${restored} data siswa! Total siswa di database: ${total}`);
  console.log("🎉 Pemulihan selesai 100%! Seluruh akun dan data siswa siap digunakan.");
}

main()
  .catch((err) => {
    console.error("❌ Terjadi kesalahan pemulihan:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
