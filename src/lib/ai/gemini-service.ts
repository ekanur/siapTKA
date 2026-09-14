import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  normalizeOpsiJawaban,
  normalizeKunciJawaban,
  buildGeminiPrompt,
  GeneratePromptParams,
} from "@/lib/quiz/normalize";

import { isLanguageSubject } from "@/lib/constants/subjects";

export { normalizeOpsiJawaban, normalizeKunciJawaban, buildGeminiPrompt };
export type { GeneratePromptParams };

export interface GenerateParams extends GeneratePromptParams {}

export interface GeneratedSoalResult {
  pertanyaan: string;
  tipeSoal: string;
  opsiJawaban: any;
  kunciJawaban: any;
  pembahasan: string;
}

export interface GenerationResponse {
  success: boolean;
  soal: GeneratedSoalResult[];
  source: "AI_GEMINI" | "AI_SIMULASI_KONTEKSTUAL";
  statusApi: "READY" | "NOT_CONFIGURED" | "RATE_LIMITED" | "INVALID_KEY" | "ERROR";
  message: string;
  promptUsed: string;
}

/**
 * Cek status konfigurasi GEMINI_API_KEY dari environment (.env)
 */
export function getGeminiApiStatus() {
  const rawKey = process.env.GEMINI_API_KEY || "";
  const cleanKey = rawKey.replace(/^["']|["']$/g, "").trim();
  const isConfigured = Boolean(cleanKey && cleanKey !== "your-gemini-api-key");

  let maskedKey: string | null = null;
  if (isConfigured) {
    if (cleanKey.length > 10) {
      maskedKey = `${cleanKey.substring(0, 6)}...${cleanKey.slice(-4)}`;
    } else {
      maskedKey = "Aktif (Terkonfigurasi)";
    }
  }

  return {
    isConfigured,
    maskedKey,
    model: "gemini-3.6-flash",
  };
}

/**
 * Membersihkan format teks respon Gemini dari kemungkinan markdown codeblock
 */
function cleanJsonOutput(text: string): string {
  let clean = text.trim();
  if (clean.startsWith("```json")) {
    clean = clean.slice(7);
  } else if (clean.startsWith("```")) {
    clean = clean.slice(3);
  }
  if (clean.endsWith("```")) {
    clean = clean.slice(0, -3);
  }
  return clean.trim();
}

/**
 * Fungsi utama generate soal:
 * 1. Mengecek ketersediaan GEMINI_API_KEY dari .env
 * 2. Jika ada, memanggil Google Generative AI (Gemini 3.6/3.7 Flash)
 * 3. Menangani error status seperti Rate Limit (429) atau Invalid Key (400/403)
 * 4. Jika key belum diisi atau mengalami limit, beralih ke Mesin Simulasi Kontekstual
 *    yang tetap secara cerdas menyusun soal berdasarkan 7 parameter form pengguna.
 */
export async function generateSoalWithGemini(params: GenerateParams): Promise<GenerationResponse> {
  const apiStatus = getGeminiApiStatus();
  const prompt = buildGeminiPrompt(params);

  // Jika API Key belum diisi di .env
  if (!apiStatus.isConfigured) {
    const contextualSoal = generateContextualSimulatedQuestions(params);
    return {
      success: true,
      soal: contextualSoal,
      source: "AI_SIMULASI_KONTEKSTUAL",
      statusApi: "NOT_CONFIGURED",
      message: `GEMINI_API_KEY belum dikonfigurasi di file .env. Soal berhasil disintesis menggunakan Mesin Generator Kontekstual internal yang menyesuaikan Elemen, Sub-Elemen, Kompetensi, dan Batasan yang Anda masukkan.`,
      promptUsed: prompt,
    };
  }

  const rawKey = (process.env.GEMINI_API_KEY || "").replace(/^["']|["']$/g, "").trim();

  try {
    const genAI = new GoogleGenerativeAI(rawKey);
    const candidateModels = [
      "gemini-3.6-flash",
      "gemini-3.7-flash",
      "gemini-2.5-flash-lite",
      "gemini-flash-latest",
      "gemini-1.5-flash",
    ];

    let result = null;
    let successfulModel = "gemini-3.6-flash";
    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const model = genAI.getGenerativeModel({
          model: modelName,
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7,
          },
        });
        result = await model.generateContent(prompt);
        successfulModel = modelName;
        break;
      } catch (err: any) {
        lastError = err;
        console.warn(`Model ${modelName} tidak tersedia/gagal, beralih ke kandidat berikutnya...`, err.message);
      }
    }

    if (!result) {
      throw lastError || new Error("Seluruh kandidat model Gemini gagal merespon.");
    }

    const rawText = result.response.text();
    const cleanedText = cleanJsonOutput(rawText);
    const parsed = JSON.parse(cleanedText);
    const rawSoalList = Array.isArray(parsed) ? parsed : [parsed];

    // Lakukan normalisasi ketat pada setiap butir soal hasil AI
    const soalList: GeneratedSoalResult[] = rawSoalList.map((item: any) => ({
      pertanyaan: item.pertanyaan || "Pertanyaan Asesmen TKA",
      tipeSoal: item.tipeSoal || params.tipeSoal,
      opsiJawaban: normalizeOpsiJawaban(item.opsiJawaban),
      kunciJawaban: normalizeKunciJawaban(item.kunciJawaban, item.tipeSoal || params.tipeSoal),
      pembahasan: item.pembahasan || "Pembahasan komprehensif butir soal.",
    }));

    return {
      success: true,
      soal: soalList,
      source: "AI_GEMINI",
      statusApi: "READY",
      message: `Berhasil men-generate ${soalList.length} butir soal menggunakan Google Gemini AI (Model: ${successfulModel}) secara presisi merujuk pada matriks asesmen yang Anda inputkan.`,
      promptUsed: prompt,
    };
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    const errorMsg = error?.message || String(error);

    let statusApi: "RATE_LIMITED" | "INVALID_KEY" | "ERROR" = "ERROR";
    let notice = "Terjadi gangguan saat memanggil Gemini API.";

    if (errorMsg.includes("429") || errorMsg.includes("quota") || errorMsg.includes("ResourceExhausted")) {
      statusApi = "RATE_LIMITED";
      notice = "Kuota limit Gemini API tercapai (Rate Limit / Quota Exceeded).";
    } else if (
      errorMsg.includes("API_KEY_INVALID") ||
      errorMsg.includes("400") ||
      errorMsg.includes("403") ||
      errorMsg.includes("unregistered")
    ) {
      statusApi = "INVALID_KEY";
      notice = "GEMINI_API_KEY pada file .env tidak valid atau ditolak oleh Google.";
    }

    // Fallback cerdas agar pengguna tetap mendapatkan soal yang relevan dengan form
    const contextualSoal = generateContextualSimulatedQuestions(params);

    return {
      success: true,
      soal: contextualSoal,
      source: "AI_SIMULASI_KONTEKSTUAL",
      statusApi,
      message: `${notice} Sistem otomatis mengaktifkan Mesin Simulasi Kontekstual agar proses penyusunan soal tetap berjalan sesuai Elemen, Sub-Elemen, Kompetensi, dan Batasan yang Anda tentukan.`,
      promptUsed: prompt,
    };
  }
}

/**
 * Mesin Generator Simulasi Kontekstual Dinamis:
 * Mengkonstruksi butir soal, stimulus, opsi jawaban, dan pembahasan secara dinamis
 * yang langsung menyuntikkan dan merefleksikan nilai 7 parameter form:
 * - mapel, tipeSoal, jumlahSoal, elemen, subElemen, kompetensi, dan batasan.
 */
export function generateContextualSimulatedQuestions(params: GenerateParams): GeneratedSoalResult[] {
  const count = params.jumlahSoal || 3;
  const elemen = params.elemen?.trim() || "Materi Pokok Kejuruan & Akademik";
  const subElemen = params.subElemen?.trim() || "Fokus Sub-Topik Asesmen";
  const kompetensi = params.kompetensi?.trim() || "Menganalisis dan memecahkan persoalan kontekstual";
  const batasan = params.batasan?.trim() || "Sesuai batasan ruang lingkup kurikulum";
  const mapel = params.mapel || "MATEMATIKA";
  const tipeSoal = params.tipeSoal || "PILIHAN_GANDA";

  const results: GeneratedSoalResult[] = [];
  const isMath = mapel.toUpperCase().includes("MATEMATIKA");

  const isLang =
    isLanguageSubject(mapel) ||
    Boolean(params.jenisTeks || params.stimulusTeks || params.fokusKebahasaan);

  for (let i = 1; i <= count; i++) {
    if (tipeSoal === "PILIHAN_GANDA") {
      let pertanyaan = "";
      let opsiJawaban = [];
      let kunciJawaban = "A";
      let pembahasan = "";

      if (isMath) {
        pertanyaan = `Dalam konteks materi **${elemen}** (khususnya kajian **${subElemen}**), seorang analis dihadapkan pada model fungsi terapan $f(x) = ${i + 1}x^2 - ${i * 4}x + ${i * 2 + 1}$. Berdasarkan indikator asesmen: *"${kompetensi}"*, dengan batasan ruang lingkup: *"${batasan}"*, maka nilai kritis atau nilai optimum fungsi tersebut adalah...`;
        opsiJawaban = [
          {
            id: "A",
            label: `$x = \\frac{${i * 2}}{${i + 1}}$ dengan nilai minimum $f(x) = ${i * 2 + 1 - ((i * 4) * (i * 4)) / (4 * (i + 1))}$`,
          },
          { id: "B", label: `$x = -\\frac{${i * 2}}{${i + 1}}$ dengan nilai maksimum tak terdefinisi` },
          { id: "C", label: `$x = ${i * 4}$ dengan nilai diskriminan $D < 0$` },
          { id: "D", label: `$x = 0$ menghasilkan akar bilangan imajiner` },
          { id: "E", label: `$x = ${i + 1}$ dengan titik potong sumbu-Y di nol` },
        ];
        kunciJawaban = "A";
        pembahasan = `**Langkah Analisis (${elemen} — ${subElemen}):**
1. Sesuai batasan materi: "${batasan}", fungsi kuadrat memiliki bentuk standar $f(x) = ax^2 + bx + c$ dengan $a = ${i + 1}$, $b = -${i * 4}$, dan $c = ${i * 2 + 1}$.
2. Titik puncak (sumbu simetri) dihitung dengan $x_p = -\\frac{b}{2a} = -\\frac{-${i * 4}}{2(${i + 1})} = \\frac{${i * 2}}{${i + 1}}$.
3. Karena $a = ${i + 1} > 0$, kurva membuka ke atas sehingga menghasilkan nilai minimum, sesuai dengan kompetensi: "${kompetensi}".
4. Nilai optimum diperoleh dengan mensubstitusikan $x_p$ ke fungsi. Jadi Opsi A adalah jawaban yang benar dan presisi.`;
      } else if (isLang) {
        const isEnglish = mapel.toUpperCase().includes("INGGRIS");
        const customPassage = params.stimulusTeks?.trim();
        const passage =
          customPassage ||
          (isEnglish
            ? `The implementation of occupational safety and health (K3) protocols in technical workshops significantly mitigates industrial hazards. Recent research demonstrates that standardized operating procedures (SOP), regular equipment calibration, and mandatory personal protective equipment (PPE) reduce workplace accidents by up to 40%. Vocational technicians who proactively comply with safety guidelines demonstrate higher operational productivity and workplace efficiency.`
            : `Penerapan prosedur keselamatan dan kesehatan kerja (K3) di lingkungan industri dan bengkel kerja vokasi terbukti efektif mereduksi risiko insiden kerja hingga 40%. Seorang teknisi tidak hanya dituntut menguasai keterampilan mengoperasikan mesin, tetapi juga harus cermat menelaah petunjuk teknis (SOP) dan simbol peringatan bahaya. Kepatuhan terhadap standar operasional kerja secara konsisten mampu meminimalkan downtime mesin dan meningkatkan efisiensi operasional secara berkelanjutan.`);

        if (isEnglish) {
          pertanyaan = `Read the following text carefully:\n\n"${passage}"\n\nBased on the text above, which of the following statements best reflects the primary focus regarding "${params.fokusKebahasaan || kompetensi}"?`;
          opsiJawaban = [
            {
              id: "A",
              label: `Strict adherence to standardized workplace safety procedures directly diminishes industrial risks and boosts operational productivity.`,
            },
            {
              id: "B",
              label: `Personal protective equipment is solely required during heavy machinery maintenance operations.`,
            },
            {
              id: "C",
              label: `Operational productivity remains unaffected by the implementation of occupational safety guidelines.`,
            },
            {
              id: "D",
              label: `Vocational technicians are exempted from safety compliance if machines are calibrated regularly.`,
            },
            {
              id: "E",
              label: `The research indicates that safety guidelines only apply to newly recruited technicians.`,
            },
          ];
          kunciJawaban = "A";
          pembahasan = `**Reading Comprehension Analysis:**\n- **Target Competency:** ${params.fokusKebahasaan || kompetensi}\n- **Text Focus:** ${params.jenisTeks || "Analytical/Exposition Text"}\n- **Correct Answer (A):** Statement A accurately captures the main synthesis of the passage that adhering to safety procedures reduces industrial risks while boosting efficiency.\n- **Distractor Analysis:** Options B, C, D, and E contradict explicit facts stated in the reading stimulus.`;
        } else {
          pertanyaan = `Cermatilah wacana bacaan berikut dengan saksama:\n\n"${passage}"\n\nBerdasarkan wacana di atas, berkaitan dengan fokus pengujian *"${params.fokusKebahasaan || kompetensi}"*, gagasan pokok atau simpulan yang paling tepat dan selaras dengan isi teks adalah...`;
          opsiJawaban = [
            {
              id: "A",
              label: `Penerapan prosedur operasional dan standar K3 secara konsisten mereduksi risiko bahaya industri sekaligus meningkatkan produktivitas kerja.`,
            },
            {
              id: "B",
              label: `Kepatuhan terhadap SOP hanya diperlukan pada saat pengoperasian mesin berat berisiko tinggi.`,
            },
            {
              id: "C",
              label: `Penggunaan alat pelindung diri tidak memberikan dampak signifikan terhadap efisiensi operasional bengkel.`,
            },
            {
              id: "D",
              label: `Kecelakaan kerja di bengkel vokasi sepenuhnya merupakan tanggung jawab instruktur bengkel.`,
            },
            {
              id: "E",
              label: `Penelitian membuktikan bahwa efisiensi kerja hanya dapat dicapai dengan mengabaikan prosedur yang rumit.`,
            },
          ];
          kunciJawaban = "A";
          pembahasan = `**Analisis Literasi Membaca (${mapel}):**\n- **Fokus Kebahasaan:** ${params.fokusKebahasaan || kompetensi}\n- **Genre Wacana:** ${params.jenisTeks || "Teks Eksplanasi/Eksposisi"}\n- **Pembuktian Jawaban Benar (A):** Paragraf menyatakan secara lugas bahwa kepatuhan pada SOP dan K3 mereduksi risiko hingga 40% dan mengoptimalkan efisiensi produksi.\n- **Analisis Pengecoh:** Opsi B, C, D, dan E bertentangan dengan fakta tertulis dalam wacana stimulus.`;
        }
      } else {
        pertanyaan = `Pada pelaksanaan studi kasus di dunia industri terkait mata pelajaran **${mapel}**, peserta didik menganalisis elemen **${elemen}** dengan fokus bahasan **${subElemen}**.
Diberikan skenario kasus: *"Dalam penerapannya di lapangan dengan memperhatikan batasan: '${batasan}', tim teknis perlu mengambil keputusan strategis guna ${kompetensi.toLowerCase()}."*

Berdasarkan skenario dan batasan teknis di atas, tindakan atau solusi yang paling tepat dan terstandar adalah...`;

        opsiJawaban = [
          {
            id: "A",
            label: `Menerapkan prosedur terstandar pada ${subElemen} secara komprehensif untuk mencapai indikator "${kompetensi}", dengan tetap mematuhi batasan "${batasan}".`,
          },
          {
            id: "B",
            label: `Mengabaikan batasan "${batasan}" untuk mempercepat proses penyelesaian kasus pada ${subElemen}.`,
          },
          {
            id: "C",
            label: `Mengalihkan fokus analisis ke luar materi ${elemen} tanpa melakukan validasi kondisi awal sistem.`,
          },
          {
            id: "D",
            label: `Melakukan modifikasi parameter secara acak pada ${subElemen} tanpa mengukur kompetensi yang dipersyaratkan.`,
          },
          {
            id: "E",
            label: `Menyimpulkan bahwa ${subElemen} tidak dapat diterapkan apabila terdapat batasan "${batasan}".`,
          },
        ];
        kunciJawaban = "A";
        pembahasan = `**Analisis Konseptual & Penerapan (${mapel}):**
- **Elemen:** ${elemen}
- **Sub-Elemen:** ${subElemen}
- **Pengukuran Kompetensi:** Butir soal ini menguji kemampuan "${kompetensi}".
- **Evaluasi Batasan:** Opsi A adalah solusi yang tepat karena secara langsung menyelesaikan persoalan pada ${subElemen} tanpa melanggar batasan "${batasan}".
- **Analisis Pengecoh:** Opsi B salah karena melanggar batasan teknis. Opsi C, D, dan E merefleksikan miskonsepsi prosedur dan tidak memenuhi kompetensi yang diuji.`;
      }

      results.push({
        pertanyaan,
        tipeSoal: "PILIHAN_GANDA",
        opsiJawaban,
        kunciJawaban,
        pembahasan,
      });
    } else if (tipeSoal === "MCMA") {
      const pertanyaan = `Perhatikan studi kasus evaluasi materi **${elemen}** (Sub-Elemen: **${subElemen}**) pada mata pelajaran **${mapel}**.
Guru menyajikan data pengujian dengan batasan ruang lingkup: *"${batasan}"*.
Siswa diminta untuk membuktikan kompetensi: *"${kompetensi}"*.

Manakah dari pernyataan-pernyataan berikut yang bernilai **BENAR** terkait prinsip kerja dan analisis data tersebut? *(Pilihlah lebih dari satu jawaban yang benar)*`;

      const opsiJawaban = [
        {
          id: "A",
          label: `Analisis pada ${subElemen} harus selalu selaras dengan batasan "${batasan}" agar hasil pengujian valid.`,
        },
        {
          id: "B",
          label: `Penerapan konsep ${elemen} memungkinkan identifikasi parameter kunci guna ${kompetensi.toLowerCase()}.`,
        },
        {
          id: "C",
          label: `Karakteristik ${subElemen} dapat dioptimasi secara berkelanjutan sesuai kaidah mutu asesmen kejuruan.`,
        },
        {
          id: "D",
          label: `Batasan "${batasan}" tidak berpengaruh terhadap akurasi pencapaian kompetensi siswa.`,
        },
        {
          id: "E",
          label: `Semua variabel dalam ${elemen} bersifat independen dan tidak berhubungan dengan ${subElemen}.`,
        },
      ];
      const kunciJawaban = ["A", "B", "C"];
      const pembahasan = `**Analisis Jawaban Kompleks (MCMA):**
- **Pernyataan A BENAR:** Setiap pengujian ${subElemen} wajib berpedoman pada batasan "${batasan}".
- **Pernyataan B BENAR:** Prinsip ${elemen} menjadi dasar teoritis untuk ${kompetensi.toLowerCase()}.
- **Pernyataan C BENAR:** Optimasi ${subElemen} merupakan bagian inti dari penguasaan kejuruan.
- **Pernyataan D SALAH:** Batasan ruang lingkup secara langsung menentukan validitas indikator.
- **Pernyataan E SALAH:** Sub-elemen adalah turunan langsung dari elemen utama yang saling terikat.`;

      results.push({
        pertanyaan,
        tipeSoal: "MCMA",
        opsiJawaban,
        kunciJawaban,
        pembahasan,
      });
    } else {
      // PGK_KATEGORI
      const pertanyaan = `Diberikan serangkaian premis hasil observasi dan analisis teknis pada elemen **${elemen}**, topik bahasan **${subElemen}** (${mapel}).
Ruang lingkup asesmen dibatasi pada: *"${batasan}"*.
Tujuan asesmen mengukur kemampuan: *"${kompetensi}"*.

Tentukan kategori (*Benar* atau *Salah*) untuk setiap pernyataan berikut berdasarkan prinsip di atas:`;

      const opsiJawaban = {
        categories: ["Benar", "Salah"],
        statements: [
          {
            id: 1,
            text: `Penerapan ${subElemen} secara langsung merefleksikan pencapaian kompetensi "${kompetensi}".`,
          },
          {
            id: 2,
            text: `Ruang lingkup pengujian wajib berpegang teguh pada batasan "${batasan}".`,
          },
          {
            id: 3,
            text: `Elemen ${elemen} dapat dievaluasi tanpa perlu mempertimbangkan karakteristik spesifik ${subElemen}.`,
          },
          {
            id: 4,
            text: `Data hasil observasi pada ${subElemen} dapat digunakan untuk perbaikan berkelanjutan sistem terkait.`,
          },
        ],
      };

      const kunciJawaban = [
        { id: 1, answer: "Benar" },
        { id: 2, answer: "Benar" },
        { id: 3, answer: "Salah" },
        { id: 4, answer: "Benar" },
      ];

      const pembahasan = `**Pembahasan Matriks Kategori (PGK):**
1. **Pernyataan 1 (Benar):** Penguasaan materi ${subElemen} secara valid membuktikan pencapaian kompetensi "${kompetensi}".
2. **Pernyataan 2 (Benar):** Menjaga batasan "${batasan}" memastikan reliabilitas asesmen.
3. **Pernyataan 3 (Salah):** Elemen ${elemen} tidak dapat dipisahkan dari sub-elemen pembentuknya.
4. **Pernyataan 4 (Benar):** Observasi teknis pada ${subElemen} memberikan bukti otentik untuk perbaikan sistem.`;

      results.push({
        pertanyaan,
        tipeSoal: "PGK_KATEGORI",
        opsiJawaban,
        kunciJawaban,
        pembahasan,
      });
    }
  }

  return results;
}