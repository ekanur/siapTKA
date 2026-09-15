const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const DATA_71_SISWA = [
  { nis: "21141", nama: "ADRIANO ANANTA PUTRA RAHARIANTO", email: "21141@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "Cargloss Group" },
  { nis: "21142", nama: "ADRIANO KIANDRA CAESAR RAMADHAN", email: "21142@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "Cargloss Group" },
  { nis: "21143", nama: "AGITAMI KARTIKA PUTERI", email: "21143@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "Cargloss Group" },
  { nis: "21145", nama: "AISYAH MUNA FATIH", email: "21145@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "PT. Aksa Digital Group" },
  { nis: "21146", nama: "ALIFA QONITA AGUSTINA", email: "21146@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "Cargloss Group" },
  { nis: "21147", nama: "ALVINSA ISNANDA PUTRA", email: "21147@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "PT Gamatechno Indonesia" },
  { nis: "21148", nama: "AMANDA MAYA WIJAYANTI", email: "21148@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "Cargloss Group" },
  { nis: "21149", nama: "ARDIANSYAH RIZKY PRATAMA", email: "21149@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "PT Aksa Digital Group" },
  { nis: "21150", nama: "ATHAYA FATIH AZIZ", email: "21150@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "PT. Aksa Digital Group" },
  { nis: "21151", nama: "AURAFELA FATTAHUNESWARI", email: "21151@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "PT. Aksa Digital Group" },
  { nis: "21152", nama: "AZIZ HADI WICAKSONO", email: "21152@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "Cargloss Group" },
  { nis: "21153", nama: "BINTANG PRATAMA PUTRA SULISTYO", email: "21153@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "Cargloss Group" },
  { nis: "21154", nama: "DAFFA HAFIDZUDIN ARSYAD", email: "21154@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "PT. Aksa Digital Group" },
  { nis: "21155", nama: "DALIL AMINUDDIN", email: "21155@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "PT. Aksa Digital Group" },
  { nis: "21156", nama: "DHEA PENI NADINE SHAFIRA", email: "21156@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "Cargloss Group" },
  { nis: "21157", nama: "DIKA SETYA PRATAMA", email: "21157@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "PT Aksa Digital Group" },
  { nis: "21158", nama: "DONITA CESARE HUDI", email: "21158@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "PT. Aksa Digital Group" },
  { nis: "21159", nama: "ELFREDA FARREL YUWANA", email: "21159@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "PLN Icon Plus" },
  { nis: "21160", nama: "FADHIRRAHMAN ADZDZAKY", email: "21160@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "PT. Gamatechno Indonesia" },
  { nis: "21161", nama: "FAKHRI DARMANSYAH ARSYAD", email: "21161@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "Cargloss Group" },
  { nis: "21162", nama: "FALIH ARKAN AL FATHANI RASENDRIYA", email: "21162@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "PT. Gamatechno Indonesia" },
  { nis: "21163", nama: "GEMA SABDA BHASKARA", email: "21163@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "MultiIntegra Technology Group" },
  { nis: "21164", nama: "GHANIA ANJANI HUSNA", email: "21164@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "TEFA" },
  { nis: "21165", nama: "GUNAWAN WIBISANA", email: "21165@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "MultiIntegra Technology Group" },
  { nis: "21166", nama: "HANIF NAUFAL SANI", email: "21166@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "CV Karya Hidup Sentosa" },
  { nis: "21167", nama: "HILMY DAMARJATI BUDIHARTO", email: "21167@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "Cargloss Group" },
  { nis: "21168", nama: "ILHAM NURHIDAYAT", email: "21168@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "CV Karya Hidup Sentosa" },
  { nis: "21169", nama: "ILHAM RAHMAWAN PUTRA", email: "21169@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "Cargloss Group" },
  { nis: "21170", nama: "JONAS ADRIAN PRADANA", email: "21170@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "PT. AINO INDONESIA" },
  { nis: "21171", nama: "KHEYZA AMRINA ROSHADA", email: "21171@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "CV Karya Hidup Sentosa" },
  { nis: "21172", nama: "KHILYA KHOIRINA", email: "21172@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "PT Gamatechno Indonesia" },
  { nis: "21173", nama: "LIDWINA AIRA WASISTHA DWIYUSA", email: "21173@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "PT. Urban Plastik Indonesia" },
  { nis: "21174", nama: "LUNETA GAVRILLA KODRI", email: "21174@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "PT. AINO INDONESIA" },
  { nis: "21175", nama: "LUTFIANSYAH AUFAWINDRA", email: "21175@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "PT Gamatechno Indonesia" },
  { nis: "21176", nama: "MARVELLINO APRIEDO", email: "21176@student.stembayo.sch.id", kelas: "13 SIJA A", jurusan: "SIJA", namaIndustriPkl: "MultiIntegra Technology Group" },
  { nis: "21177", nama: "MIFTAHUL HUDA", email: "21177@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "PT. Aksa Digital Group" },
  { nis: "21178", nama: "MUHAMMAD AHSAN SANADI", email: "21178@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "PT Divistant Teknologi Indonesia" },
  { nis: "21179", nama: "MUHAMMAD ARIZAL AFRIANTARA", email: "21179@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "CV Karya Hidup Sentosa" },
  { nis: "21180", nama: "MUHAMMAD DWI PRAYOGA", email: "21180@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "PT. SIMS - Life Media" },
  { nis: "21181", nama: "MUHAMMAD EMIRZA DEWANTARA", email: "21181@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "PT. Kereta Api Indonesia" },
  { nis: "21182", nama: "MUHAMMAD FARREL RABBANI", email: "21182@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "MultiIntegra Technology Group" },
  { nis: "21183", nama: "MUHAMMAD QURTIFA WIJAYA", email: "21183@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "PT Botika Teknologi Indonesia" },
  { nis: "21184", nama: "MUHAMMAD RIDHWAN KURNIAWAN", email: "21184@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "MultiIntegra Technology Group" },
  { nis: "21185", nama: "MUHAMMAD ZAKI 'ILMIN HUDA", email: "21185@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "TEFA" },
  { nis: "21186", nama: "NANDA ISNAINI MUHYI", email: "21186@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "PT Gunung Sejahtera Ibu Pertiwi" },
  { nis: "21187", nama: "NAYLA RAZAQ AZ-ZAHRA", email: "21187@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "Cargloss Group" },
  { nis: "21188", nama: "NISA NUR AINI", email: "21188@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "Cargloss Group" },
  { nis: "21189", nama: "NISRINA RAIHANA PUTRI", email: "21189@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "PT KAI DAOP 6 Yogyakarta" },
  { nis: "21190", nama: "RAFI AHMAD ZAINI", email: "21190@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "MultiIntegra Technology Group" },
  { nis: "21191", nama: "RAFIF ARIBAH", email: "21191@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "PT Aksa Digital Group" },
  { nis: "21192", nama: "RAFSA RAYHAN SAPUTRA", email: "21192@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "CV Karya Hidup Sentosa" },
  { nis: "21193", nama: "RAHMADHANA DITYA ARDIYANTO", email: "21193@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "PT. Kereta Api Indonesia" },
  { nis: "21194", nama: "RANI KRISMANTARI", email: "21194@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "PT Aksa Digital Group" },
  { nis: "21195", nama: "RANI LESTARI PUTRI", email: "21195@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "PT. Javis Teknologi Albarokah" },
  { nis: "21196", nama: "REJAKA ABIMANYU SUSANTO", email: "21196@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "PT Botika Teknologi Indonesia" },
  { nis: "21197", nama: "RENDI SUSANTO", email: "21197@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "PT. Kereta Api Indonesia" },
  { nis: "21198", nama: "RIZKY FAUZAN HANIF", email: "21198@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "PT Era Awan Digital (Eranyacloud)" },
  { nis: "21199", nama: "SALLY OKTAVINA YUSUF", email: "21199@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "Cargloss Group" },
  { nis: "21200", nama: "SALSABILA RAFEYFA ASYLA", email: "21200@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "Cargloss Group" },
  { nis: "21201", nama: "SASONGKO ALFAUZAN SUDIRAYUDA", email: "21201@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "PT Aksa Digital Group" },
  { nis: "21202", nama: "SELLY OKTA RAMADHANI", email: "21202@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "CV Karya Hidup Sentosa" },
  { nis: "21203", nama: "SHAFA OCTAZA RAMADHAN", email: "21203@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "PT Aksa Digital Group" },
  { nis: "21204", nama: "SHAZIA EL HAMID", email: "21204@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "PT. Javis Teknologi Albarokah" },
  { nis: "21205", nama: "SHEILA NUR ARINI", email: "21205@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "CV Karya Hidup Sentosa" },
  { nis: "21206", nama: "SHIFA NABILA AMANDA", email: "21206@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "Cargloss Group" },
  { nis: "21207", nama: "SULTHAN RASYA FIRJATULLAH", email: "21207@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "PT. Kereta Api Indonesia" },
  { nis: "21208", nama: "TAUFIQUL UMAM CHENA", email: "21208@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "PT. Aksa Digital Group" },
  { nis: "21209", nama: "VALENTINO LOVERADO RINUMPOKO", email: "21209@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "TEFA" },
  { nis: "21210", nama: "YOGANTA AURELIAN RAMADHANI", email: "21210@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "Cargloss Group" },
  { nis: "21211", nama: "YUNUS BAHRAN NUFAIL", email: "21211@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "PT Aksa Digital Group" },
  { nis: "21212", nama: "ZAHBARQAL SYAHZINHOULHAQ", email: "21212@student.stembayo.sch.id", kelas: "13 SIJA B", jurusan: "SIJA", namaIndustriPkl: "PT. Kereta Api Indonesia" },
];

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

  // 4. Masukkan seluruh 71 Siswa (Upsert aman tanpa ketergantungan file luar)
  let restored = 0;
  for (const s of DATA_71_SISWA) {
    const kelasId = classMap[s.kelas] || null;

    await prisma.siswa.upsert({
      where: { nis: s.nis },
      create: {
        nis: s.nis,
        nama: s.nama,
        email: s.email,
        jurusan: s.jurusan,
        kelasId,
        namaKelas: s.kelas,
        namaIndustriPkl: s.namaIndustriPkl,
        statusAkun: "BELUM_AKTIF",
        statusTka: "BELUM_MERESPONS",
      },
      update: {
        nama: s.nama,
        email: s.email,
        jurusan: s.jurusan,
        kelasId: kelasId || undefined,
        namaKelas: s.kelas,
        namaIndustriPkl: s.namaIndustriPkl || undefined,
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
