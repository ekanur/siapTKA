export interface SubjectOption {
  id: string;
  name: string;
  category: string;
  isVocational?: boolean;
}

export const MAPEL_WAJIB = [
  { id: "MATEMATIKA", name: "Matematika (Wajib)", code: "MATEMATIKA" },
  { id: "BAHASA_INDONESIA", name: "Bahasa Indonesia (Wajib)", code: "BAHASA_INDONESIA" },
  { id: "BAHASA_INGGRIS", name: "Bahasa Inggris (Wajib)", code: "BAHASA_INGGRIS" },
];

export const MAPEL_PILIHAN_GROUPS: { groupName: string; subjects: SubjectOption[] }[] = [
  {
    groupName: "Rumpun TIK (Teknologi Informasi & Komunikasi)",
    subjects: [
      { id: "PPLG", name: "Pengembangan Perangkat Lunak & Gim (PPLG / RPL)", category: "TIK", isVocational: true },
      { id: "AIJ", name: "Administrasi Infrastruktur Jaringan", category: "TIK", isVocational: true },
      { id: "TKJ", name: "Teknik Jaringan Komputer & Telekomunikasi (TKJ)", category: "TIK", isVocational: true },
      { id: "SIJA", name: "Sistem Informatika, Jaringan & Aplikasi (SIJA)", category: "TIK", isVocational: true },
      { id: "DKV", name: "Desain Komunikasi Visual (DKV)", category: "TIK", isVocational: true },
      { id: "ANIMASI", name: "Animasi", category: "TIK", isVocational: true },
      { id: "PENGEMBANGAN_GIM", name: "Pengembangan Gim", category: "TIK", isVocational: true },
    ],
  },
  {
    groupName: "Khusus SMK (Kewirausahaan & Vokasi)",
    subjects: [
      { id: "PKK", name: "Produk atau Projek Kreatif dan Kewirausahaan (PKK)", category: "SMK", isVocational: true },
    ],
  },
  {
    groupName: "Rumpun Teknologi & Rekayasa (Kejuruan Teknik)",
    subjects: [
      { id: "TKR", name: "Teknik Kendaraan Ringan", category: "Teknik Otomotif", isVocational: true },
      { id: "TSM", name: "Teknik Sepeda Motor", category: "Teknik Otomotif", isVocational: true },
      { id: "TAB", name: "Teknik Alat Berat", category: "Teknik Otomotif", isVocational: true },
      { id: "TPM", name: "Teknik Pemesinan", category: "Teknik Mesin", isVocational: true },
      { id: "TMI", name: "Teknik Mekanik Industri", category: "Teknik Mesin", isVocational: true },
      { id: "LAS", name: "Teknik Pengelasan", category: "Teknik Mesin", isVocational: true },
      { id: "TAV", name: "Teknik Audio Video", category: "Teknik Elektronika", isVocational: true },
      { id: "MEKATRONIKA", name: "Teknik Mekatronika", category: "Teknik Elektronika", isVocational: true },
      { id: "OTOMASI", name: "Teknik Otomasi Industri", category: "Teknik Elektronika", isVocational: true },
      { id: "TITL", name: "Teknik Instalasi Tenaga Listrik", category: "Teknik Ketenagalistrikan", isVocational: true },
      { id: "TJTL", name: "Teknik Jaringan Tenaga Listrik", category: "Teknik Ketenagalistrikan", isVocational: true },
      { id: "BKP", name: "Konstruksi dan Perawatan Bangunan Sipil", category: "Teknik Konstruksi", isVocational: true },
      { id: "TKP", name: "Teknik Konstruksi dan Perumahan", category: "Teknik Konstruksi", isVocational: true },
    ],
  },
  {
    groupName: "Rumpun Bisnis, Manajemen & Pariwisata",
    subjects: [
      { id: "AKL", name: "Akuntansi", category: "Bisnis & Manajemen", isVocational: true },
      { id: "PERBANKAN", name: "Layanan Perbankan & Syariah", category: "Bisnis & Manajemen", isVocational: true },
      { id: "MPLB", name: "Manajemen Perkantoran dan Layanan Bisnis", category: "Bisnis & Manajemen", isVocational: true },
      { id: "LOGISTIK", name: "Manajemen Logistik", category: "Bisnis & Manajemen", isVocational: true },
      { id: "BISNIS_DIGITAL", name: "Bisnis Digital", category: "Pemasaran", isVocational: true },
      { id: "KULINER", name: "Kuliner (Tata Boga)", category: "Pariwisata & Kuliner", isVocational: true },
      { id: "PERHOTELAN", name: "Perhotelan", category: "Pariwisata & Kuliner", isVocational: true },
      { id: "BUSANA", name: "Tata Busana (Desain dan Produksi Busana)", category: "Seni Rupa & Kriya", isVocational: true },
    ],
  },
  {
    groupName: "Rumpun Agribisnis & Agriteknologi",
    subjects: [
      { id: "ATPH", name: "Agribisnis Tanaman Pangan dan Hortikultura", category: "Agribisnis", isVocational: true },
      { id: "PERKEBUNAN", name: "Agribisnis Tanaman Perkebunan", category: "Agribisnis", isVocational: true },
      { id: "PETERNAKAN", name: "Agribisnis Ternak Ruminansia / Unggas", category: "Agribisnis", isVocational: true },
      { id: "PERIKANAN", name: "Agribisnis Perikanan Air Tawar", category: "Agribisnis", isVocational: true },
      { id: "APHP", name: "Agribisnis Pengolahan Hasil Pertanian", category: "Agriteknologi", isVocational: true },
    ],
  },
  {
    groupName: "Rumpun Kesehatan, Pekerjaan Sosial & Kimia",
    subjects: [
      { id: "KEPERAWATAN", name: "Layanan Penunjang Keperawatan", category: "Kesehatan", isVocational: true },
      { id: "FARMASI", name: "Farmasi Klinis dan Komunitas", category: "Kesehatan", isVocational: true },
      { id: "KIMIA_ANALISIS", name: "Kimia Analisis & Pengujian Lab", category: "Kimia", isVocational: true },
    ],
  },
  {
    groupName: "Rumpun MIPA & Teknologi (Akademik)",
    subjects: [
      { id: "MTK_LANJUT", name: "Matematika Tingkat Lanjut", category: "MIPA" },
      { id: "FISIKA", name: "Fisika", category: "MIPA" },
      { id: "KIMIA", name: "Kimia", category: "MIPA" },
      { id: "BIOLOGI", name: "Biologi", category: "MIPA" },
    ],
  },
  {
    groupName: "Rumpun Bahasa Lanjut & Asing",
    subjects: [
      { id: "B_INDO_LANJUT", name: "Bahasa Indonesia Tingkat Lanjut", category: "Bahasa" },
      { id: "B_INGGRIS_LANJUT", name: "Bahasa Inggris Tingkat Lanjut", category: "Bahasa" },
      { id: "B_JEPANG", name: "Bahasa Jepang", category: "Bahasa" },
      { id: "B_MANDARIN", name: "Bahasa Mandarin", category: "Bahasa" },
      { id: "B_JERMAN", name: "Bahasa Jerman", category: "Bahasa" },
      { id: "B_PRANCIS", name: "Bahasa Prancis", category: "Bahasa" },
      { id: "B_KOREA", name: "Bahasa Korea", category: "Bahasa" },
      { id: "B_ARAB", name: "Bahasa Arab", category: "Bahasa" },
    ],
  },
  {
    groupName: "Rumpun Sosial & Humaniora",
    subjects: [
      { id: "EKONOMI", name: "Ekonomi", category: "Soshum" },
      { id: "GEOGRAFI", name: "Geografi", category: "Soshum" },
      { id: "SOSIOLOGI", name: "Sosiologi", category: "Soshum" },
      { id: "SEJARAH", name: "Sejarah", category: "Soshum" },
      { id: "ANTROPOLOGI", name: "Antropologi", category: "Soshum" },
      { id: "PPKN", name: "Pendidikan Pancasila dan Kewarganegaraan (PPKn)", category: "Soshum" },
    ],
  },
];

export function getAllSubjectsList(): SubjectOption[] {
  const list: SubjectOption[] = [];
  for (const g of MAPEL_PILIHAN_GROUPS) {
    list.push(...g.subjects);
  }
  return list;
}

export function getSubjectDisplayName(codeOrId: string, short = false): string {
  if (!codeOrId) return "-";
  const upper = codeOrId.toUpperCase();
  if (upper === "MATEMATIKA") return short ? "Matematika" : "Matematika (Wajib)";
  if (upper === "BAHASA_INDONESIA") return short ? "Bahasa Indonesia" : "Bahasa Indonesia (Wajib)";
  if (upper === "BAHASA_INGGRIS") return short ? "Bahasa Inggris" : "Bahasa Inggris (Wajib)";
  if (upper === "AIJ" || upper === "ADMINISTRASI_INFRASTRUKTUR_JARINGAN") return "Administrasi Infrastruktur Jaringan";
  if (upper === "PPLG") return short ? "PPLG" : "Pengembangan Perangkat Lunak & Gim (PPLG / RPL)";

  const found = getAllSubjectsList().find((s) => s.id.toUpperCase() === upper || s.name.toUpperCase().includes(upper));
  return found ? (short ? found.id : found.name) : codeOrId;
}

export interface SubjectTkaDetail {
  id: string;
  name: string;
  categoryTag: string;
  isWajib: boolean;
  deskripsiTka: string;
}

export function getSubjectTkaDetail(codeOrId: string): SubjectTkaDetail {
  const norm = (codeOrId || "").replace(/-/g, "_").toUpperCase();

  if (norm === "PPLG") {
    return {
      id: "PPLG",
      name: "Rekayasa Perangkat Lunak (PPLG)",
      categoryTag: "Pemrograman Web & Gim",
      isWajib: false,
      deskripsiTka:
        "Tes Kemampuan Akademik (TKA) pada Program Keahlian Pengembangan Perangkat Lunak dan Gim (PPLG) bertujuan mengukur penguasaan konsep, penalaran, dan penerapan pengetahuan dasar kejuruan dalam bidang pengembangan perangkat lunak dan gim. Ruang lingkup asesmen mencakup proses bisnis pengembangan perangkat lunak dan gim, perkembangan teknologi dan dunia kerja, profesi serta Kewirausahaan bidang PPLG, K3LH dan budaya kerja industri, penggunaan perangkat dan tools pengembangan, dasar basis data, pengelolaan aset dan antarmuka pengguna, algoritma, pemrograman terstruktur, serta pemrograman berorientasi objek pada konteks proyek perangkat lunak dan gim.",
    };
  }

  if (norm === "MATEMATIKA") {
    return {
      id: "MATEMATIKA",
      name: "Matematika",
      categoryTag: "Aljabar, Kalkulus & Matriks",
      isWajib: true,
      deskripsiTka:
        "Tes Kemampuan Akademik (TKA) Mata Pelajaran Matematika Wajib mengukur kemampuan berpikir logis, penalaran kuantitatif, analisis aljabar, fungsi kuadrat, operasi matriks, dan kalkulus terapan. Asesmen difokuskan pada penalaran matematis dalam pemodelan masalah kontekstual kejuruan, rekayasa teknologi, dan sains komputasi.",
    };
  }

  if (norm === "BAHASA_INDONESIA") {
    return {
      id: "BAHASA_INDONESIA",
      name: "Bahasa Indonesia",
      categoryTag: "Literasi Teks Ilmiah & Komunikasi",
      isWajib: true,
      deskripsiTka:
        "Tes Kemampuan Akademik (TKA) Bahasa Indonesia mengukur kompetensi literasi membaca kritis, pemahaman ide pokok, analisis argumentasi logis dalam teks ilmiah dan laporan teknis industri, serta penggunaan kaidah kebahasaan baku dalam komunikasi profesional dunia kerja.",
    };
  }

  if (norm === "BAHASA_INGGRIS") {
    return {
      id: "BAHASA_INGGRIS",
      name: "Bahasa Inggris",
      categoryTag: "Technical English & Global Workplace",
      isWajib: true,
      deskripsiTka:
        "Tes Kemampuan Akademik (TKA) Bahasa Inggris mengukur kecakapan pemahaman teks teknis (technical manuals, software documentations, system logs), penalaran kontekstual kejuruan, tata bahasa profesional (passive voice, conditional clauses, imperative procedures), serta komunikasi global.",
    };
  }

  if (norm === "AIJ" || norm === "ADMINISTRASI_INFRASTRUKTUR_JARINGAN") {
    return {
      id: "ADMINISTRASI_INFRASTRUKTUR_JARINGAN",
      name: "Administrasi Infrastruktur Jaringan",
      categoryTag: "Infrastruktur & Jaringan Komputer",
      isWajib: false,
      deskripsiTka:
        "Tes Kemampuan Akademik (TKA) Administrasi Infrastruktur Jaringan (AIJ) mengukur kompetensi perencanaan, konfigurasi, dan pemeliharaan arsitektur jaringan komputer. Ruang lingkup asesmen mencakup VLAN trunking (IEEE 802.1Q), routing dinamis (OSPF & BGP), manajemen bandwidth, firewall access control list (ACL), Network Address Translation (NAT), serta analisis troubleshooting konektivitas server.",
    };
  }

  // Generic fallback for any other elective
  const displayName = getSubjectDisplayName(codeOrId);
  return {
    id: norm,
    name: displayName,
    categoryTag: "Mata Pelajaran Pilihan TKA",
    isWajib: false,
    deskripsiTka: `Tes Kemampuan Akademik (TKA) untuk mata pelajaran ${displayName} mengukur penguasaan konsep esensial, keterampilan berpikir kritis, dan kemampuan penalaran aplikatif sesuai Capaian Pembelajaran Kurikulum Nasional Kemendikbudristek untuk persiapan seleksi perguruan tinggi dan standarisasi kompetensi vokasi.`,
  };
}
