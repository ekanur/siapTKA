import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

interface GenerateParams {
  mapel: string;
  tipeSoal: "PILIHAN_GANDA" | "MCMA" | "PGK_KATEGORI";
  jumlahSoal?: number;
  kisiKisi: {
    topik: string;
    definisi: string;
    muatan: string;
    kompetensi: string;
    matriksAsesmen: string;
    contohSoal: string;
  };
}

interface GeneratedSoalResult {
  pertanyaan: string;
  tipeSoal: string;
  opsiJawaban: any;
  kunciJawaban: any;
  pembahasan: string;
}

export async function generateSoalWithGemini(params: GenerateParams): Promise<GeneratedSoalResult[]> {
  const apiKey = process.env.GEMINI_API_KEY;

  // Fallback realistic generator if API key is not yet configured by the user
  if (!apiKey || apiKey === "your-gemini-api-key") {
    return generateMockAiQuestions(params);
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      temperature: 0.7,
    },
  });

  const prompt = `
Anda adalah Pakar Pembuat Soal Tes Kemampuan Akademik (TKA) Standar Kemendikbud untuk jenjang SMK SIJA (Sistem Informatika, Jaringan, dan Aplikasi).
Tugas Anda adalah menghasilkan ${params.jumlahSoal || 3} butir soal latihan baru berkualitas tinggi berdasarkan 5 Pilar Kisi-Kisi Resmi TKA berikut:

- MATA PELAJARAN: ${params.mapel}
- TOPIK / MATERI: ${params.kisiKisi.topik}
- PILAR 1 (DEFINISI): ${params.kisiKisi.definisi}
- PILAR 2 (MUATAN): ${params.kisiKisi.muatan}
- PILAR 3 (KOMPETENSI): ${params.kisiKisi.kompetensi}
- PILAR 4 (MATRIKS ASESMEN & LEVEL KOGNITIF): ${params.kisiKisi.matriksAsesmen}
- PILAR 5 (CONTOH SOAL ACUAN): ${params.kisiKisi.contohSoal}
- TIPE SOAL YANG HARUS DIBUAT: ${params.tipeSoal}

PETUNJUK FORMATTING KHUSUS:
1. Jika soal Matematika, gunakan LaTeX standar dengan tanda dollar ($ untuk inline, $$ untuk block display) seperti $f(x) = ax^2 + bx + c$, $\\int_a^b$, $\\frac{a}{b}$, \\begin{pmatrix}...\\end{pmatrix}.
2. Jika tipeSoal == "PILIHAN_GANDA":
   - "opsiJawaban": Array of 5 options: [{"id": "A", "label": "..."}, {"id": "B", "label": "..."}, {"id": "C", "label": "..."}, {"id": "D", "label": "..."}, {"id": "E", "label": "..."}]
   - "kunciJawaban": String huruf ("A", "B", "C", "D", atau "E")
3. Jika tipeSoal == "MCMA" (Multiple Choice Multiple Answer):
   - "opsiJawaban": Array of 5 options: [{"id": "A", "label": "..."}, ...]
   - "kunciJawaban": Array of string huruf benar, misal ["A", "C"] atau ["B", "D", "E"]
4. Jika tipeSoal == "PGK_KATEGORI" (Pilihan Ganda Kompleks Kategori):
   - "opsiJawaban": {"categories": ["Benar", "Salah"], "statements": [{"id": 1, "text": "..."}, {"id": 2, "text": "..."}, {"id": 3, "text": "..."}, {"id": 4, "text": "..."}]}
   - "kunciJawaban": Array of answers: [{"id": 1, "answer": "Benar"}, {"id": 2, "answer": "Salah"}, ...]
5. "pembahasan": Jelaskan langkah penyelesaian matematis atau rasional konseptual secara lengkap langkah demi langkah.

Hasilkan JSON array valid tanpa markdown tick tambahan. Format JSON:
[
  {
    "pertanyaan": "...",
    "tipeSoal": "${params.tipeSoal}",
    "opsiJawaban": ...,
    "kunciJawaban": ...,
    "pembahasan": "..."
  }
]
`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    const parsed = JSON.parse(text);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    // Fallback to high-quality template generator
    return generateMockAiQuestions(params);
  }
}

/**
 * Fallback high-quality generator with authentic TKA curriculum templates
 */
function generateMockAiQuestions(params: GenerateParams): GeneratedSoalResult[] {
  const isMath = params.mapel === "MATEMATIKA";
  const count = params.jumlahSoal || 3;
  const results: GeneratedSoalResult[] = [];

  for (let i = 1; i <= count; i++) {
    const seed = Date.now() + i;
    if (isMath) {
      if (params.tipeSoal === "PILIHAN_GANDA") {
        results.push({
          pertanyaan: `Diberikan sistem persamaan kuadrat $f(x) = (x - ${i + 1})^2 - ${i * 4}$. Nilai pembuat nol fungsi ($f(x) = 0$) dari kurva tersebut adalah...`,
          tipeSoal: "PILIHAN_GANDA",
          opsiJawaban: [
            { id: "A", label: `$x = ${i + 1 - i * 2}$ atau $x = ${i + 1 + i * 2}$` },
            { id: "B", label: `$x = -${i + 1}$ atau $x = ${i * 4}$` },
            { id: "C", label: `$x = ${i * 2}$ atau $x = -${i * 2}$` },
            { id: "D", label: `$x = 0$ atau $x = ${i + 5}$` },
            { id: "E", label: `$x = 1$ atau $x = -1$` },
          ],
          kunciJawaban: "A",
          pembahasan: `Untuk mencari pembuat nol fungsi, set $f(x) = 0$:\n$$(x - ${i + 1})^2 - ${i * 4} = 0 \\implies (x - ${i + 1})^2 = ${i * 4}$$\n$$x - ${i + 1} = \\pm ${i * 2}$$\nMaka akar-akarnya adalah $x_1 = ${i + 1 - i * 2}$ dan $x_2 = ${i + 1 + i * 2}$ (Opsi A).`,
        });
      } else if (params.tipeSoal === "MCMA") {
        results.push({
          pertanyaan: `Diketahui matriks $B = \\begin{pmatrix} ${i + 2} & 1 \\\\ 2 & ${i + 1} \\end{pmatrix}$. Manakah pernyataan-pernyataan berikut yang bernilai **BENAR**? *(Pilih lebih dari satu)*`,
          tipeSoal: "MCMA",
          opsiJawaban: [
            { id: "A", label: `Determinan matriks $B$ adalah $|B| = ${ (i + 2) * (i + 1) - 2 }$` },
            { id: "B", label: `Transpose matriks $B^T = \\begin{pmatrix} ${i + 2} & 2 \\\\ 1 & ${i + 1} \\end{pmatrix}$` },
            { id: "C", label: `Elemen pada baris ke-1 kolom ke-2 adalah $1$` },
            { id: "D", label: `Determinan $B$ selalu bernilai negatif untuk setiap bilangan asli` },
            { id: "E", label: `Matriks $B$ adalah matriks identitas` },
          ],
          kunciJawaban: ["A", "B", "C"],
          pembahasan: `1. $|B| = (${i + 2})(${i + 1}) - (1)(2) = ${ (i + 2) * (i + 1) - 2 }$ (Pernyataan A Benar)\n2. $B^T$ membalik baris dan kolom sehingga menjadi $\\begin{pmatrix} ${i + 2} & 2 \\\\ 1 & ${i + 1} \\end{pmatrix}$ (Pernyataan B Benar)\n3. Baris 1 kolom 2 bernilai $1$ (Pernyataan C Benar).`,
        });
      } else {
        results.push({
          pertanyaan: `Perhatikan fungsi integral tentu $I = \\int_{0}^{${i + 1}} (${i * 2}x + 3) \\, dx$. Tentukan kategori (*Benar* atau *Salah*) untuk setiap pernyataan berikut:`,
          tipeSoal: "PGK_KATEGORI",
          opsiJawaban: {
            categories: ["Benar", "Salah"],
            statements: [
              { id: 1, text: `Antiturunan fungsi integran adalah $F(x) = ${i}x^2 + 3x + C$` },
              { id: 2, text: `Nilai $F(${i + 1}) - F(0)$ bernilai positif` },
              { id: 3, text: `Integral tentu menghasilkan konstanta sembarang $+ C$` },
              { id: 4, text: `Luas daerah di bawah kurva selalu bernilai nol` },
            ],
          },
          kunciJawaban: [
            { id: 1, answer: "Benar" },
            { id: 2, answer: "Benar" },
            { id: 3, answer: "Salah" },
            { id: 4, answer: "Salah" },
          ],
          pembahasan: `- Pernyataan 1 Benar (Turunan dari $${i}x^2 + 3x$ adalah $${i * 2}x + 3$).\n- Pernyataan 2 Benar karena batas atas positif.\n- Pernyataan 3 Salah (Integral tentu menghasilkan nilai skalar riil, bukan konstanta + C).\n- Pernyataan 4 Salah.`,
        });
      }
    } else {
      // PPLG
      if (params.tipeSoal === "PILIHAN_GANDA") {
        results.push({
          pertanyaan: `Seorang programmer membuat endpoint backend \`POST /api/v1/auth/login\`. Jika kredensial yang dimasukkan pengguna tidak cocok, status code HTTP dan pesan respon yang paling sesuai dengan standar REST API adalah...`,
          tipeSoal: "PILIHAN_GANDA",
          opsiJawaban: [
            { id: "A", label: "401 Unauthorized: Invalid username or password" },
            { id: "B", label: "200 OK: Data tidak ditemukan" },
            { id: "C", label: "404 Not Found: Halaman login hilang" },
            { id: "D", label: "500 Internal Server Error: Database crash" },
            { id: "E", label: "301 Moved Permanently: Redirect" },
          ],
          kunciJawaban: "A",
          pembahasan: `Status code **401 Unauthorized** secara spesifik ditujukan untuk kegagalan autentikasi (kredensial login tidak valid). Status 200 tidak boleh digunakan untuk merespon error autentikasi.`,
        });
      } else if (params.tipeSoal === "MCMA") {
        results.push({
          pertanyaan: `Manakah dari pernyataan berikut yang merupakan prinsip-prinsip dasar dari **ACID Transactions** dalam sistem manajemen basis data relasional (RDBMS)? *(Pilih lebih dari satu)*`,
          tipeSoal: "MCMA",
          opsiJawaban: [
            { id: "A", label: "Atomicity: Semua operasi berhasil seluruhnya atau dibatalkan seluruhnya (all-or-nothing)" },
            { id: "B", label: "Consistency: Transaksi membawa database dari satu kondisi valid ke kondisi valid lainnya" },
            { id: "C", label: "Isolation: Transaksi yang berjalan konkuren tidak saling mengganggu sebelum selesai" },
            { id: "D", label: "Durability: Data yang telah di-commit tersimpan permanen meski sistem reboot/mati listrik" },
            { id: "E", label: "Availability: Server selalu membalas request meski data belum selesai ditulis" },
          ],
          kunciJawaban: ["A", "B", "C", "D"],
          pembahasan: `ACID adalah singkatan dari **Atomicity, Consistency, Isolation, dan Durability**. Opsi E (Availability) adalah bagian dari teorema CAP, bukan pilar transaksi ACID.`,
        });
      } else {
        results.push({
          pertanyaan: `Perhatikan pernyataan mengenai arsitektur perangkat lunak dan manajemen Git berikut. Tentukan kategori (*Sesuai* atau *Tidak Sesuai*):`,
          tipeSoal: "PGK_KATEGORI",
          opsiJawaban: {
            categories: ["Sesuai", "Tidak Sesuai"],
            statements: [
              { id: 1, text: "Perintah 'git checkout -b feature/login' membuat sekaligus berpindah ke branch baru" },
              { id: 2, text: "Dalam Git Flow, branch 'main/master' selalu berisi kode yang siap rilis ke tahap produksi" },
              { id: 3, text: "File '.env' yang berisi credential database harus selalu di-commit ke public repository GitHub" },
              { id: 4, text: "Pull Request (PR) digunakan untuk code review sebelum menggabungkan kode ke branch utama" },
            ],
          },
          kunciJawaban: [
            { id: 1, answer: "Sesuai" },
            { id: 2, answer: "Sesuai" },
            { id: 3, answer: "Tidak Sesuai" },
            { id: 4, answer: "Sesuai" },
          ],
          pembahasan: `- 1 Sesuai (Flag -b membuat branch baru).\n- 2 Sesuai (Main adalah production release).\n- 3 Tidak Sesuai (File .env berisi rahasia kredensial dan WAJIB masuk .gitignore).\n- 4 Sesuai (PR memfasilitasi peer review).`,
        });
      }
    }
  }

  return results;
}