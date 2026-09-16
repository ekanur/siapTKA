import { isLanguageSubject } from "@/lib/constants/subjects";

export interface GeneratePromptParams {
  mapel: string;
  tipeSoal: "PILIHAN_GANDA" | "MCMA" | "PGK_KATEGORI";
  jumlahSoal?: number;
  elemen?: string;
  subElemen?: string;
  kompetensi?: string;
  subKompetensi?: string;
  batasan?: string;
  // Parameter Khusus Asesmen Rumpun Bahasa & Literasi:
  jenisTeks?: string;
  topikTeks?: string;
  stimulusTeks?: string;
  fokusKebahasaan?: string;
}

/**
 * Normalizer cerdas untuk opsi jawaban soal (PILIHAN_GANDA & MCMA):
 * Memastikan output selalu berupa array [{ id: "A", label: "..." }, ...]
 * Mampu mengatasi format bervariasi dari LLM seperti { kunci: "A", teks: "..." },
 * format object dictionary { A: "...", B: "..." }, ataupun array string ["A. ..."].
 */
export function normalizeOpsiJawaban(rawOpsi: any): any {
  if (!rawOpsi) return [];

  let data = rawOpsi;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      // bukan JSON valid
    }
  }

  // Jika PGK_KATEGORI matrix pernyataan (statements & categories)
  if (data && typeof data === "object" && !Array.isArray(data)) {
    if (data.statements || data.categories) {
      return data;
    }
    // Jika formatnya object dictionary: { "A": "teks...", "B": "teks..." }
    const keys = Object.keys(data);
    if (keys.length > 0 && keys.every((k) => /^[A-Ea-e]$/.test(k))) {
      return keys.sort().map((k) => ({
        id: k.toUpperCase(),
        label: String(data[k] || "").trim(),
      }));
    }
    // Jika format dibungkus properti options / opsi
    if (Array.isArray(data.options)) return normalizeOpsiJawaban(data.options);
    if (Array.isArray(data.opsi)) return normalizeOpsiJawaban(data.opsi);
    if (Array.isArray(data.opsiJawaban)) return normalizeOpsiJawaban(data.opsiJawaban);
  }

  // Jika berupa Array
  if (Array.isArray(data)) {
    return data.map((item: any, idx: number) => {
      const defaultId = String.fromCharCode(65 + idx); // A, B, C, D, E...

      // Kasus array string: ["A. Teks...", "B. Teks..."]
      if (typeof item === "string") {
        const prefixMatch = item.match(/^\(?([A-Ea-e])[\.\)\:\-]\s*(.*)$/);
        if (prefixMatch) {
          return {
            id: prefixMatch[1].toUpperCase(),
            label: prefixMatch[2].trim(),
          };
        }
        return {
          id: defaultId,
          label: item.trim(),
        };
      }

      // Kasus array object: { id/kunci/key/option: "A", label/teks/text/value/deskripsi: "..." }
      if (item && typeof item === "object") {
        const rawId = item.id || item.kunci || item.key || item.option || item.kode || defaultId;
        const rawLabel =
          item.label !== undefined
            ? item.label
            : item.teks !== undefined
            ? item.teks
            : item.text !== undefined
            ? item.text
            : item.value !== undefined
            ? item.value
            : item.deskripsi !== undefined
            ? item.deskripsi
            : item.isi !== undefined
            ? item.isi
            : item.pernyataan !== undefined
            ? item.pernyataan
            : "";

        return {
          id: String(rawId).toUpperCase(),
          label: String(rawLabel).trim(),
        };
      }

      return {
        id: defaultId,
        label: String(item).trim(),
      };
    });
  }

  return [];
}

/**
 * Normalizer cerdas untuk kunci jawaban:
 * Memastikan MCMA berupa array huruf uppercase string ["A", "B", ...]
 * dan PILIHAN_GANDA berupa single string "A"
 */
export function normalizeKunciJawaban(rawKunci: any, tipeSoal: string): any {
  if (rawKunci === undefined || rawKunci === null) {
    return tipeSoal === "MCMA" ? [] : "";
  }

  let kunci = rawKunci;
  if (typeof kunci === "string") {
    const trimmed = kunci.trim();
    if (
      (trimmed.startsWith("[") && trimmed.endsWith("]")) ||
      (trimmed.startsWith("{") && trimmed.endsWith("}"))
    ) {
      try {
        kunci = JSON.parse(trimmed);
      } catch {
        // Abaikan jika bukan valid JSON
      }
    }
  }

  if (tipeSoal === "MCMA") {
    if (Array.isArray(kunci)) {
      return kunci
        .map((k: any) => {
          if (typeof k === "object" && k !== null) {
            return String(k.id || k.kunci || k.key || "").toUpperCase();
          }
          return String(k).toUpperCase().replace(/[^A-E]/g, "");
        })
        .filter(Boolean);
    }
    if (typeof kunci === "string") {
      const matches = kunci.toUpperCase().match(/[A-E]/g);
      return matches ? Array.from(new Set(matches)) : [kunci.toUpperCase()];
    }
    return [];
  }

  if (tipeSoal === "PILIHAN_GANDA") {
    if (typeof kunci === "string") {
      const match = kunci.toUpperCase().match(/[A-E]/);
      return match ? match[0] : kunci.toUpperCase();
    }
    if (Array.isArray(kunci) && kunci.length > 0) {
      return String(kunci[0]).toUpperCase();
    }
  }

  return kunci;
}

/**
 * Membangun prompt Gemini AI yang secara ketat (strictly grounded)
 * mengacu pada 7 parameter input form matriks asesmen TKA Pusmendik.
 */
export function buildGeminiPrompt(params: GeneratePromptParams): string {
  const count = params.jumlahSoal || 3;
  const hasElemen = Boolean(params.elemen?.trim());
  const hasSubElemen = Boolean(params.subElemen?.trim());
  const hasBatasan = Boolean(params.batasan?.trim());

  const mapel = params.mapel || "MATEMATIKA";
  const tipeSoal = params.tipeSoal || "PILIHAN_GANDA";

  const elemen = hasElemen ? params.elemen!.trim() : `Materi Pokok ${mapel}`;
  const subElemen = hasSubElemen ? params.subElemen!.trim() : "Fokus Sub-Topik Terkait";
  const kompetensi = params.kompetensi?.trim() || "Kompetensi penalaran akademik tingkat tinggi (HOTS)";
  const batasan = hasBatasan ? params.batasan!.trim() : "Tidak ada batasan khusus (sesuai standar kurikulum resmi SMA/SMK)";

  const tipeSoalLabel =
    tipeSoal === "PILIHAN_GANDA"
      ? "Pilihan Ganda Tunggal (1 Kunci Jawaban Benar dari 5 Opsi A-E)"
      : tipeSoal === "MCMA"
      ? "Pilihan Ganda Kompleks Multi-Jawaban / MCMA (Pilih lebih dari satu opsi benar)"
      : "Pilihan Ganda Kompleks Kategori (Matriks Pernyataan: Benar/Salah atau Sesuai/Tidak Sesuai)";

  const isLanguage =
    isLanguageSubject(mapel) ||
    Boolean(params.jenisTeks || params.stimulusTeks || params.fokusKebahasaan);

  const finalSubKompetensi = params.subKompetensi?.trim() || (hasSubElemen ? subElemen : "Menganalisis dan menyimpulkan wacana secara komprehensif");

  return `Anda adalah Pakar Asesmen Akademik & Kejuruan serta Pembuat Soal Ujian Nasional / Tes Kemampuan Akademik (TKA) Standar Resmi Pusmendik Kemendikdasmen RI.

TUGAS UTAMA ANDA:
Hasilkan tepat ${count} butir soal latihan baru berkualitas tinggi dengan tingkat kognitif HOTS (Higher Order Thinking Skills: C3/C4/C5 - Aplikasi, Analisis, Evaluasi, dan Pemecahan Masalah Nyata) yang WAJIB SECARA KETAT MENGACU PADA MATRIKS ASESMEN BERIKUT:

============================================================
MATRIKS ASESMEN & PARAMETER ACUAN FORM:
${
  isLanguage
    ? `MATRIKS ASESMEN RUMPUN BAHASA (LITERASI & KEBAHASAAN):
============================================================
1. MATA PELAJARAN: ${mapel}
2. BENTUK SOAL: ${tipeSoalLabel} (${tipeSoal})
3. JUMLAH BUTIR SOAL: ${count} butir
4. KOMPETENSI UTAMA (WAJIB): ${kompetensi}
5. SUB-KOMPETENSI: ${finalSubKompetensi}
6. GENRE / JENIS TEKS: ${params.jenisTeks || "Teks Wacana Kontekstual"}
7. TEMA / TOPIK BACAAN: ${params.topikTeks || "Dunia Kerja, Industri Vokasi, dan Inovasi Modern"}
8. FOKUS ASPEK KEBAHASAAN: Mengacu langsung pada target pencapaian Kompetensi ("${kompetensi}") dan Sub-Kompetensi ("${finalSubKompetensi}")`
    : `MATRIKS ASESMEN AKADEMIK & KEJURUAN:
============================================================
1. MATA PELAJARAN: ${mapel}
2. BENTUK SOAL: ${tipeSoalLabel} (${tipeSoal})
3. JUMLAH BUTIR SOAL: ${count} butir
4. KOMPETENSI / INDIKATOR ASESMEN (UTAMA & WAJIB): ${kompetensi}
5. ELEMEN / MATERI POKOK: ${hasElemen ? elemen : `Sesuai ruang lingkup mata pelajaran ${mapel} (Tidak ada pembatasan elemen spesifik)`}
6. SUB-ELEMEN / SUB-MATERI: ${hasSubElemen ? subElemen : "Sesuai topik bahasan terkait indikator kompetensi"}
7. BATASAN RUANG LINGKUP & KONTEKS: ${hasBatasan ? batasan : "Tidak ada batasan khusus (sesuai standar kurikulum nasional dan konteks wajar jenjang SMA/SMK)"}`
}
============================================================
${
  isLanguage
    ? params.stimulusTeks?.trim()
      ? `
============================================================
TEKS WACANA / STIMULUS BACAAN (DISEDIAKAN OLEH GURU):
"""
${params.stimulusTeks.trim()}
"""
============================================================
ATURAN WAJIB TEKS WACANA DARI GURU:
1. Anda WAJIB MENJADIKAN TEKS BACAAN DI ATAS sebagai stimulus utama seluruh butir soal.
2. Setiap pertanyaan ("pertanyaan") harus diawali atau merujuk secara eksplisit pada wacana di atas (misal: "Berdasarkan teks di atas,...").
3. DILARANG mengarang teks wacana lain yang menyimpang dari teks bacaan yang telah disediakan guru di atas.
4. Ujilah pemahaman siswa secara terfokus terhadap Kompetensi: "${kompetensi}" dan Sub-Kompetensi: "${finalSubKompetensi}".`
      : `
============================================================
INSTRUKSI PENYUSUNAN TEKS WACANA OLEH AI:
1. Anda WAJIB MENULISKAN TEKS WACANA / DIALOG BACAAN UTUH yang orisinal, menarik, dan berbobot akademis sesuai Genre "${params.jenisTeks || "Wacana Kontekstual"}" bertema "${params.topikTeks || "Dunia Kerja & Vokasi"}".
2. Panjang teks wacana berkisar 120-250 kata (atau 6-10 giliran bicara jika berbentuk dialog percakapan).
3. Tampilkan teks wacana tersebut secara utuh pada awal properti "pertanyaan", diikuti pertanyaan asesmen yang menguji pemahaman teks tersebut.
4. Ujilah pemahaman siswa secara terfokus terhadap Kompetensi: "${kompetensi}" dan Sub-Kompetensi: "${finalSubKompetensi}".`
    : ""
}

INSTRUKSI KONTEN & RELEVANSI KETAT (CRITICAL REQUIREMENTS):
${
  isLanguage
    ? `1. RELEVANSI 100% TERHADAP KOMPETENSI: Seluruh stimulus narasi/kasus, pertanyaan, opsi jawaban, dan pembahasan WAJIB berakar secara spesifik pada Kompetensi "${kompetensi}" dan Sub-Kompetensi "${finalSubKompetensi}". DILARANG membuat soal di luar kompetensi ini.
2. PENGUJIAN ASPEK KEBAHASAAN: Setiap butir soal harus secara langsung mengukur ketercapaian target Kompetensi ("${kompetensi}") dan Sub-Kompetensi ("${finalSubKompetensi}"). Dilarang menyimpang ke aspek kebahasaan di luar kompetensi tersebut.
3. STIMULUS TEKS WACANA: Setiap butir soal harus terikat dengan wacana bacaan kontekstual yang relevan dan mencerminkan literasi membaca tingkat tinggi.`
    : `1. PENGUJIAN KOMPETENSI (KRITERIA UTAMA & WAJIB): Setiap butir soal WAJIB secara langsung dan spesifik mengukur kemampuan siswa dalam: "${kompetensi}".
2. KESELARASAN MATERI: ${hasElemen ? `Seluruh stimulus kasus, pertanyaan, opsi, dan pembahasan harus berakar pada Elemen "${elemen}" ${hasSubElemen ? `dan Sub-Elemen "${subElemen}"` : ""}.` : `Seluruh butir soal harus relevan dan selaras dengan cakupan kurikulum mata pelajaran ${mapel}.`}
3. KEPATUHAN BATASAN RUANG LINGKUP: ${hasBatasan ? `Patuhi secara ketat batasan konteks: "${batasan}". Segala batasan variabel, asumsi, jenis alat, kedalaman rumus, ataupun skenario tidak boleh melampaui batasan ini.` : `Gunakan batasan ruang lingkup wajar sesuai standar kurikulum resmi SMA/SMK tanpa membatasi kreativitas soal kontekstual.`}
4. STIMULUS REALISTIS & KONTEKSTUAL: Setiap butir soal harus diawali dengan stimulus situasi nyata, permasalahan industri/kehidupan sehari-hari, data teknis/eksperimen, tabel, atau kasus konkret yang relevan bagi siswa.`
}
5. NOTASI SAINS & MATEMATIKA: Gunakan notasi LaTeX standar untuk rumus atau persamaan matematika/fisika/kimia ($...$ untuk inline, $$...$$ untuk display blok).
${
  mapel.toUpperCase().includes("INGGRIS")
    ? `6. BAHASA PENGANTAR (TARGET LANGUAGE): Teks stimulus wacana bacaan, pertanyaan, serta opsi jawaban (A-E) WAJIB DISUSUN DALAM BAHASA INGGRIS BAKU (Standard English). Pembahasan dapat disajikan dalam Bahasa Indonesia atau bilingual agar memudahkan guru dan siswa.`
    : isLanguage
    ? `6. BAHASA PENGANTAR: Teks stimulus, pertanyaan, opsi jawaban, dan pembahasan disajikan dengan kaidah ejaan dan tata bahasa yang baku sesuai target bahasa.`
    : ""
}

KETENTUAN STRUKTUR JSON SESUAI BENTUK SOAL:
${
  tipeSoal === "PILIHAN_GANDA"
    ? `- "tipeSoal": "PILIHAN_GANDA"
- "opsiJawaban": Array of 5 objek:
  [
    {"id": "A", "label": "Deskripsi opsi A..."},
    {"id": "B", "label": "Deskripsi opsi B..."},
    {"id": "C", "label": "Deskripsi opsi C..."},
    {"id": "D", "label": "Deskripsi opsi D..."},
    {"id": "E", "label": "Deskripsi opsi E..."}
  ]
- "kunciJawaban": Tepat satu string huruf kapital ("A", "B", "C", "D", atau "E").
- Pengecoh (distractor) harus logis, mencerminkan miskonsepsi umum siswa.`
    : tipeSoal === "MCMA"
    ? `- "tipeSoal": "MCMA"
- "opsiJawaban": Array of 5 objek (A, B, C, D, E) dengan struktur WAJIB memiliki properti "id" dan "label":
  [
    {"id": "A", "label": "Deskripsi langkah/pernyataan opsi A..."},
    {"id": "B", "label": "Deskripsi langkah/pernyataan opsi B..."},
    {"id": "C", "label": "Deskripsi langkah/pernyataan opsi C..."},
    {"id": "D", "label": "Deskripsi langkah/pernyataan opsi D..."},
    {"id": "E", "label": "Deskripsi langkah/pernyataan opsi E..."}
  ]
  (PERINGATAN KRUSIAL: Gunakan nama field "id" untuk huruf opsi dan "label" untuk kalimat teksnya. JANGAN gunakan field "kunci" atau "teks" pada opsiJawaban).
- "kunciJawaban": Array berisi 2 hingga 4 huruf string opsi yang bernilai BENAR, contoh: ["A", "C"] atau ["B", "D", "E"].
- Pertanyaan harus secara eksplisit menyertakan instruksi: "(Pilihlah lebih dari satu jawaban yang benar)".`
    : `- "tipeSoal": "PGK_KATEGORI"
- "opsiJawaban": Objek matriks pernyataan:
  {
    "categories": ["Benar", "Salah"],
    "statements": [
      {"id": 1, "text": "Pernyataan 1..."},
      {"id": 2, "text": "Pernyataan 2..."},
      {"id": 3, "text": "Pernyataan 3..."},
      {"id": 4, "text": "Pernyataan 4..."}
    ]
  }
- "kunciJawaban": Array evaluasi setiap pernyataan:
  [
    {"id": 1, "answer": "Benar"},
    {"id": 2, "answer": "Salah"},
    {"id": 3, "answer": "Benar"},
    {"id": 4, "answer": "Salah"}
  ]`
}

6. PEMBAHASAN: Wajib menyertakan "pembahasan" yang komprehensif, menguraikan langkah rasional atau matematis langkah demi langkah, mengaitkan dengan Elemen "${elemen}", menjelaskan pembuktian jawaban benar, serta alasan mengapa opsi lain tidak tepat.

FORMAT OUTPUT:
Keluarkan HANYA array JSON valid (tanpa pembungkus markdown seperti \`\`\`json, tanpa komentar di luar JSON).
[
  {
    "pertanyaan": "Teks stimulus dan pertanyaan lengkap...",
    "tipeSoal": "${tipeSoal}",
    "opsiJawaban": ...,
    "kunciJawaban": ...,
    "pembahasan": "Pembahasan rinci..."
  }
]`;
}

