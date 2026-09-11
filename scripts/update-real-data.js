const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function run() {
  console.log('=== Mulai Mengganti Data Guru, Admin, dan Siswa Sesuai Data Asli ===');

  // 1. Baca CSV Guru
  const guruPath = path.join(process.cwd(), 'public', 'templates', 'template_guru.csv');
  const guruCsvContent = fs.readFileSync(guruPath, 'utf8');
  const guruParsed = Papa.parse(guruCsvContent, { header: true, skipEmptyLines: true });
  console.log(`Ditemukan ${guruParsed.data.length} baris akun guru & staf`);

  // 2. Baca CSV Siswa
  const siswaPath = path.join(process.cwd(), 'public', 'templates', 'template_siswa.csv');
  const siswaCsvContent = fs.readFileSync(siswaPath, 'utf8');
  const siswaParsed = Papa.parse(siswaCsvContent, { header: true, skipEmptyLines: true });
  console.log(`Ditemukan ${siswaParsed.data.length} baris siswa`);

  // 3. Bersihkan data lama
  console.log('Membersihkan data lama ProgresLatihan, Siswa, dan UserAdmin...');
  await prisma.progresLatihan.deleteMany();
  await prisma.siswa.deleteMany();
  await prisma.userAdmin.deleteMany();

  // 4. Input Akun Guru & Admin Baru
  for (const g of guruParsed.data) {
    if (!g.username || !g.email || !g.nama) continue;
    const role = (g.role || 'GURU').toUpperCase().trim() === 'ADMIN' ? 'ADMIN' : 'GURU';
    const mapel = role === 'GURU' ? (g.mapel ? g.mapel.trim() : 'PPLG') : null;

    await prisma.userAdmin.create({
      data: {
        username: g.username.trim(),
        email: g.email.trim().toLowerCase(),
        nama: g.nama.trim(),
        password: g.password ? g.password.trim() : 'GuruTKA2026!',
        role,
        mapel,
      },
    });
    console.log(`+ UserAdmin: ${g.nama} (${g.username}) - Role: ${role} - Mapel: ${mapel || '-'}`);
  }

  // 5. Pastikan Kelas Terdaftar
  const existingClasses = await prisma.kelas.findMany();
  const classMap = new Map(existingClasses.map((c) => [c.nama.toUpperCase(), c]));

  // 6. Input Siswa Baru
  let siswaCreated = 0;
  for (const s of siswaParsed.data) {
    if (!s.nis || !s.nama || !s.email) continue;
    const rawKelas = (s.kelas || '').trim().toUpperCase();
    let kelasId = null;
    let namaKelas = null;

    if (rawKelas) {
      if (classMap.has(rawKelas)) {
        const k = classMap.get(rawKelas);
        kelasId = k.id;
        namaKelas = k.nama;
      } else {
        const newClass = await prisma.kelas.create({
          data: {
            nama: rawKelas,
            tingkat: 13,
            jurusan: (s.jurusan || 'SIJA').trim().toUpperCase(),
          },
        });
        classMap.set(rawKelas, newClass);
        kelasId = newClass.id;
        namaKelas = newClass.nama;
      }
    }

    await prisma.siswa.create({
      data: {
        nis: String(s.nis).trim(),
        nama: String(s.nama).trim(),
        email: String(s.email).trim().toLowerCase(),
        jurusan: (s.jurusan || 'SIJA').trim().toUpperCase(),
        kelasId,
        namaKelas,
        namaIndustriPkl: (s.namaIndustriPkl || '').trim() || 'Belum Ditentukan',
        statusAkun: 'BELUM_AKTIF',
        statusTka: 'BELUM_MERESPONS',
      },
    });
    siswaCreated++;
  }
  console.log(`+ Berhasil mengimpor ${siswaCreated} data siswa.`);

  const uCount = await prisma.userAdmin.count();
  const sCount = await prisma.siswa.count();
  const kCount = await prisma.kelas.count();
  console.log('=== Status Database Terbaru ===');
  console.log({ userAdmin: uCount, siswa: sCount, kelas: kCount });

  await prisma.$disconnect();
}

run().catch((e) => {
  console.error('Error saat update data:', e);
  process.exit(1);
});

