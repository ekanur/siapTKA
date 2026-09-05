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
    groupName: "Mata Pelajaran Pilihan Akademik (Umum)",
    subjects: [
      { id: "MTK_LANJUT", name: "Matematika Tingkat Lanjut", category: "MIPA" },
      { id: "B_INDO_LANJUT", name: "Bahasa Indonesia Tingkat Lanjut", category: "Bahasa" },
      { id: "B_INGGRIS_LANJUT", name: "Bahasa Inggris Tingkat Lanjut", category: "Bahasa" },
      { id: "FISIKA", name: "Fisika", category: "MIPA" },
      { id: "KIMIA", name: "Kimia", category: "MIPA" },
      { id: "BIOLOGI", name: "Biologi", category: "MIPA" },
      { id: "PPKN", name: "Pendidikan Pancasila dan Kewarganegaraan", category: "Soshum" },
      { id: "EKONOMI", name: "Ekonomi", category: "Soshum" },
      { id: "GEOGRAFI", name: "Geografi", category: "Soshum" },
      { id: "SOSIOLOGI", name: "Sosiologi", category: "Soshum" },
      { id: "SEJARAH", name: "Sejarah", category: "Soshum" },
      { id: "ANTROPOLOGI", name: "Antropologi", category: "Soshum" },
      { id: "B_PRANCIS", name: "Bahasa Prancis", category: "Bahasa" },
      { id: "B_JERMAN", name: "Bahasa Jerman", category: "Bahasa" },
      { id: "B_JEPANG", name: "Bahasa Jepang", category: "Bahasa" },
      { id: "B_MANDARIN", name: "Bahasa Mandarin", category: "Bahasa" },
      { id: "B_KOREA", name: "Bahasa Korea", category: "Bahasa" },
      { id: "B_ARAB", name: "Bahasa Arab", category: "Bahasa" },
    ],
  },
  {
    groupName: "Mata Pelajaran Kejuruan SMK",
    subjects: [
      { id: "PKK", name: "SMK - Produk atau Projek Kreatif dan Kewirausahaan", category: "SMK", isVocational: true },
      { id: "TPG", name: "SMK - Teknik Perawatan Gedung", category: "Konstruksi & Properti", isVocational: true },
      { id: "BKP", name: "SMK - Konstruksi dan Perawatan Bangunan Sipil", category: "Konstruksi & Properti", isVocational: true },
      { id: "TKP", name: "SMK - Teknik Konstruksi dan Perumahan", category: "Konstruksi & Properti", isVocational: true },
      { id: "DPIB", name: "SMK - Desain Pemodelan dan Informasi Bangunan", category: "Konstruksi & Properti", isVocational: true },
      { id: "TF", name: "SMK - Teknik Furnitur", category: "Konstruksi & Properti", isVocational: true },
      { id: "TM", name: "SMK - Teknik Mesin", category: "Teknologi & Rekayasa", isVocational: true },
      { id: "TO", name: "SMK - Teknik Otomotif", category: "Teknologi & Rekayasa", isVocational: true },
      { id: "TPFL", name: "SMK - Teknik Pengelasan dan Fabrikasi Logam", category: "Teknologi & Rekayasa", isVocational: true },
      { id: "LOGISTIK", name: "SMK - Teknik Logistik", category: "Bisnis & Manajemen", isVocational: true },
      { id: "TE", name: "SMK - Teknik Elektronika", category: "Teknologi & Rekayasa", isVocational: true },
      { id: "TPU", name: "SMK - Teknik Pesawat Udara", category: "Teknologi & Rekayasa", isVocational: true },
      { id: "TKK", name: "SMK - Teknik Konstruksi Kapal", category: "Teknologi & Rekayasa", isVocational: true },
      { id: "KA", name: "SMK - Kimia Analisis", category: "Kimia", isVocational: true },
      { id: "TKI", name: "SMK - Teknik Kimia Industri", category: "Kimia", isVocational: true },
      { id: "TT", name: "SMK - Teknik Tekstil", category: "Teknologi & Rekayasa", isVocational: true },
      { id: "TITL", name: "SMK - Teknik Ketenagalistrikan", category: "Teknologi & Rekayasa", isVocational: true },
      { id: "TET", name: "SMK - Teknik Energi Terbarukan", category: "Teknologi & Rekayasa", isVocational: true },
      { id: "TG", name: "SMK - Teknik Geospasial", category: "Teknologi & Rekayasa", isVocational: true },
      { id: "GP", name: "SMK - Teknik Geologi Pertambangan", category: "Teknologi & Rekayasa", isVocational: true },
      { id: "TP", name: "SMK - Teknik Perminyakan", category: "Teknologi & Rekayasa", isVocational: true },
      { id: "PPLG", name: "SMK - Pengembangan Perangkat Lunak dan Gim", category: "TIK", isVocational: true },
      { id: "TJKT", name: "SMK - Teknik Jaringan Komputer dan Telekomunikasi", category: "TIK", isVocational: true },
      { id: "LK", name: "SMK - Layanan Kesehatan", category: "Kesehatan", isVocational: true },
      { id: "TLM", name: "SMK - Teknik Laboratorium Medik", category: "Kesehatan", isVocational: true },
      { id: "FARMASI", name: "SMK - Teknologi Farmasi", category: "Kesehatan", isVocational: true },
      { id: "PS", name: "SMK - Pekerjaan Sosial", category: "Kesehatan", isVocational: true },
      { id: "AT", name: "SMK - Agribisnis Tanaman", category: "Agribisnis", isVocational: true },
      { id: "ATER", name: "SMK - Agribisnis Ternak", category: "Agribisnis", isVocational: true },
      { id: "AP", name: "SMK - Agribisnis Perikanan", category: "Agribisnis", isVocational: true },
      { id: "UPT", name: "SMK - Usaha Pertanian Terpadu", category: "Agribisnis", isVocational: true },
      { id: "APHP", name: "SMK - Agriteknologi Pengolahan Hasil Pertanian", category: "Agribisnis", isVocational: true },
      { id: "KH", name: "SMK - Kehutanan", category: "Agribisnis", isVocational: true },
      { id: "TKPI", name: "SMK - Teknika Kapal Penangkap Ikan", category: "Kemaritiman", isVocational: true },
      { id: "NKPI", name: "SMK - Nautika Kapal Penangkap Ikan", category: "Kemaritiman", isVocational: true },
      { id: "TKN", name: "SMK - Teknika Kapal Niaga", category: "Kemaritiman", isVocational: true },
      { id: "NKN", name: "SMK - Nautika Kapal Niaga", category: "Kemaritiman", isVocational: true },
      { id: "PEMASARAN", name: "SMK - Pemasaran", category: "Bisnis & Manajemen", isVocational: true },
      { id: "MPLB", name: "SMK - Manajemen Perkantoran dan Layanan Bisnis", category: "Bisnis & Manajemen", isVocational: true },
      { id: "AKL", name: "SMK - Akuntansi dan Keuangan Lembaga", category: "Bisnis & Manajemen", isVocational: true },
      { id: "ULP", name: "SMK - Usaha Layanan Pariwisata", category: "Pariwisata", isVocational: true },
      { id: "PERHOTELAN", name: "SMK - Perhotelan", category: "Pariwisata", isVocational: true },
      { id: "KULINER", name: "SMK - Kuliner", category: "Pariwisata", isVocational: true },
      { id: "KS", name: "SMK - Kecantikan dan Spa", category: "Pariwisata", isVocational: true },
      { id: "SR", name: "SMK - Seni Rupa", category: "Seni & Ekraf", isVocational: true },
      { id: "DKV", name: "SMK - Desain Komunikasi Visual", category: "Seni & Ekraf", isVocational: true },
      { id: "DPK", name: "SMK - Desain dan Produksi Kriya", category: "Seni & Ekraf", isVocational: true },
      { id: "SP", name: "SMK - Seni Pertunjukan", category: "Seni & Ekraf", isVocational: true },
      { id: "BP", name: "SMK - Broadcasting dan Perfilman", category: "Seni & Ekraf", isVocational: true },
      { id: "ANIMASI", name: "SMK - Animasi", category: "Seni & Ekraf", isVocational: true },
      { id: "BUSANA", name: "SMK - Busana", category: "Seni & Ekraf", isVocational: true },
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

export const SUBJECT_ALIASES: Record<string, string> = {
  AIJ: "TJKT",
  TKJ: "TJKT",
  SIJA: "TJKT",
  TPM: "TM",
  TKR: "TO",
  TBKR: "TO",
  TSM: "TO",
  TAB: "TO",
  LAS: "TPFL",
  TFLM: "TPFL",
  TEK: "TE",
  TOI: "TE",
  OTOMASI: "TE",
  MEKATRONIKA: "TE",
  TAV: "TE",
  TJTL: "TITL",
  KIMIA_ANALISIS: "KA",
  KEPERAWATAN: "LK",
  ATPH: "AT",
  PERKEBUNAN: "AT",
  PETERNAKAN: "ATER",
  PERIKANAN: "AP",
  BISNIS_DIGITAL: "PEMASARAN",
  PERBANKAN: "AKL",
};

export function getSubjectDisplayName(codeOrId: string, short = false): string {
  if (!codeOrId) return "-";
  let upper = codeOrId.toUpperCase().trim();

  // Check alias
  if (SUBJECT_ALIASES[upper]) {
    upper = SUBJECT_ALIASES[upper];
  }

  if (upper === "MATEMATIKA") return short ? "Matematika" : "Matematika (Wajib)";
  if (upper === "BAHASA_INDONESIA") return short ? "Bahasa Indonesia" : "Bahasa Indonesia (Wajib)";
  if (upper === "BAHASA_INGGRIS") return short ? "Bahasa Inggris" : "Bahasa Inggris (Wajib)";

  const found = getAllSubjectsList().find(
    (s) =>
      s.id.toUpperCase() === upper ||
      s.name.toUpperCase() === upper ||
      s.name.toUpperCase().replace(/^SMK - /, "") === upper
  );

  if (found) {
    if (short) {
      return found.name.replace(/^SMK - /, "");
    }
    return found.name;
  }

  return codeOrId;
}

export interface SubjectTkaDetail {
  id: string;
  name: string;
  categoryTag: string;
  isWajib: boolean;
  deskripsiTka: string;
}

export function getSubjectTkaDetail(codeOrId: string): SubjectTkaDetail {
  let norm = (codeOrId || "").replace(/-/g, "_").toUpperCase();
  if (SUBJECT_ALIASES[norm]) {
    norm = SUBJECT_ALIASES[norm];
  }

  if (norm === "PPLG") {
    return {
      id: "PPLG",
      name: "SMK - Pengembangan Perangkat Lunak dan Gim",
      categoryTag: "Pemrograman Web & Gim",
      isWajib: false,
      deskripsiTka:
        "Tes Kemampuan Akademik (TKA) pada Program Keahlian Pengembangan Perangkat Lunak dan Gim (PPLG) bertujuan mengukur penguasaan konsep, penalaran, dan penerapan pengetahuan dasar kejuruan dalam bidang pengembangan perangkat lunak dan gim. Ruang lingkup asesmen mencakup proses bisnis pengembangan perangkat lunak dan gim, perkembangan teknologi dan dunia kerja, profesi serta Kewirausahaan bidang PPLG, K3LH dan budaya kerja industri, penggunaan perangkat dan tools pengembangan, dasar basis data, pengelolaan aset dan antarmuka pengguna, algoritma, pemrograman terstruktur, serta pemrograman berorientasi objek pada konteks proyek perangkat lunak dan gim.",
    };
  }

  if (norm === "TJKT") {
    return {
      id: "TJKT",
      name: "SMK - Teknik Jaringan Komputer dan Telekomunikasi",
      categoryTag: "Infrastruktur & Jaringan Komputer",
      isWajib: false,
      deskripsiTka:
        "Tes Kemampuan Akademik (TKA) Teknik Jaringan Komputer dan Telekomunikasi (TJKT / SIJA / AIJ) mengukur kompetensi perencanaan, konfigurasi, dan pemeliharaan arsitektur jaringan komputer. Ruang lingkup asesmen mencakup VLAN trunking (IEEE 802.1Q), routing dinamis (OSPF & BGP), manajemen bandwidth, firewall access control list (ACL), Network Address Translation (NAT), serta analisis troubleshooting konektivitas server.",
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
