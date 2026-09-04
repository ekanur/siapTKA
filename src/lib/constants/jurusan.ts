export interface JurusanInfo {
  id: string; // Unique code (e.g. "DPIB", "TITL", "SIJA")
  namaLengkap: string;
  singkatan: string;
  tingkatDefault: number;
  rombelDefault: string[];
}

export const DAFTAR_JURUSAN: JurusanInfo[] = [
  {
    id: "DPIB",
    namaLengkap: "Desain Pemodelan dan Informasi Bangunan",
    singkatan: "DPIB",
    tingkatDefault: 12,
    rombelDefault: ["12 DPIB A", "12 DPIB B"],
  },
  {
    id: "TITL",
    namaLengkap: "Teknik Instalasi Tenaga Listrik",
    singkatan: "TITL",
    tingkatDefault: 12,
    rombelDefault: ["12 TITL A", "12 TITL B"],
  },
  {
    id: "TOI",
    namaLengkap: "Teknik Otomasi Industri",
    singkatan: "TOI",
    tingkatDefault: 12,
    rombelDefault: ["12 TOI A", "12 TOI B"],
  },
  {
    id: "TP",
    namaLengkap: "Teknik Pemesinan",
    singkatan: "TP",
    tingkatDefault: 12,
    rombelDefault: ["12 TP A", "12 TP B"],
  },
  {
    id: "TKR",
    namaLengkap: "Teknik Kendaraan Ringan",
    singkatan: "TKR",
    tingkatDefault: 12,
    rombelDefault: ["12 TKR A", "12 TKR B"],
  },
  {
    id: "TBKR",
    namaLengkap: "Teknik Bodi Kendaraan Ringan",
    singkatan: "TBKR",
    tingkatDefault: 12,
    rombelDefault: ["12 TBKR A"],
  },
  {
    id: "TEK",
    namaLengkap: "Teknik Elektronika Komunikasi",
    singkatan: "TEK",
    tingkatDefault: 12,
    rombelDefault: ["12 TEK A", "12 TEK B"],
  },
  {
    id: "TKI",
    namaLengkap: "Teknik Kimia Industri",
    singkatan: "TKI",
    tingkatDefault: 12,
    rombelDefault: ["12 TKI A", "12 TKI B"],
  },
  {
    id: "KA",
    namaLengkap: "Kimia Analisis",
    singkatan: "KA",
    tingkatDefault: 13,
    rombelDefault: ["13 KA A", "13 KA B"],
  },
  {
    id: "TFLM",
    namaLengkap: "Teknik Fabrikasi Logam dan Manufaktur",
    singkatan: "TFLM",
    tingkatDefault: 13,
    rombelDefault: ["13 TFLM A"],
  },
  {
    id: "GP",
    namaLengkap: "Geologi Pertambangan",
    singkatan: "GP",
    tingkatDefault: 13,
    rombelDefault: ["13 GP A", "13 GP B"],
  },
  {
    id: "SIJA",
    namaLengkap: "Sistem Informasi Jaringan dan Aplikasi",
    singkatan: "SIJA",
    tingkatDefault: 13,
    rombelDefault: ["13 SIJA A", "13 SIJA B"],
  },
];

export function getJurusanName(code: string): string {
  if (!code) return "-";
  const found = DAFTAR_JURUSAN.find(
    (j) => j.id.toUpperCase() === code.toUpperCase() || j.singkatan.toUpperCase() === code.toUpperCase()
  );
  return found ? found.namaLengkap : code;
}
