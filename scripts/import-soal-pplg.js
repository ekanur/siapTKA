const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('=== MEMULAI IMPORT SOAL RESMI PPLG DARI EXCEL ===');
  
  const jsonPath = path.join(__dirname, '../docs/bank_soal/soal_pplg.json');
  const rawData = fs.readFileSync(jsonPath, 'utf-8');
  const questions = JSON.parse(rawData);

  console.log('Total butir soal yang dimuat:', questions.length);

  // 1. Hapus soal demo PPLG lama
  const del = await prisma.soal.deleteMany({
    where: { mapel: 'PPLG' }
  });
  console.log('Soal PPLG lama dibersihkan:', del.count);

  // 2. Insert soal baru
  let countPg = 0;
  let countMcma = 0;
  let countPgk = 0;

  for (const q of questions) {
    await prisma.soal.create({
      data: {
        mapel: 'PPLG',
        tipeSoal: q.tipeSoal,
        pertanyaan: q.pertanyaan,
        opsiJawaban: q.opsiJawaban,
        kunciJawaban: q.kunciJawaban,
        pembahasan: q.pembahasan,
        status: 'AKTIF',
        source: 'DOKUMEN_RESMI_PPLG',
      }
    });

    if (q.tipeSoal === 'PILIHAN_GANDA') countPg++;
    else if (q.tipeSoal === 'MCMA') countMcma++;
    else if (q.tipeSoal === 'PGK_KATEGORI') countPgk++;
  }

  // 3. Upsert MapelInfo untuk PPLG
  const deskripsiPplg = 'TKA Kejuruan Pengembangan Perangkat Lunak dan Gim mengukur penguasaan konsep rekayasa perangkat lunak, algoritma pemrograman, basis data, pemodelan sistem berorientasi objek, pengujian aplikasi, dan etika profesi teknologi informasi.';
  await prisma.mapelInfo.upsert({
    where: { kode: 'PPLG' },
    update: { deskripsi: deskripsiPplg, updatedBy: 'Eka Nur Ahmad Romadhoni, S.Pd' },
    create: { kode: 'PPLG', deskripsi: deskripsiPplg, updatedBy: 'Eka Nur Ahmad Romadhoni, S.Pd' }
  });

  console.log('=== HASIL IMPORT SOAL PPLG BERHASIL ===');
  console.log('- Total Soal Masuk:', questions.length);
  console.log('- Pilihan Ganda (PG):', countPg);
  console.log('- Pilihan Ganda Kompleks (MCMA):', countMcma);
  console.log('- PGK Kategori Matrix (PGK):', countPgk);
  console.log('- Status: AKTIF (Tersedia untuk Latihan Siswa)');
}

main()
  .catch((e) => {
    console.error('Error saat import:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
