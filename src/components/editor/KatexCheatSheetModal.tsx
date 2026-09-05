"use client";

import React, { useState } from "react";
import { X, Search, Copy, Check, Sparkles, BookOpen, Lightbulb } from "lucide-react";
import MathRenderer from "@/components/math/MathRenderer";

interface KatexCheatSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsert?: (latexCode: string) => void;
}

interface FormulaSample {
  category: "Dasar" | "Aljabar" | "Geometri & Trigonometri" | "Kalkulus & Matriks" | "Fisika & Kimia" | "Simbol & Yunani";
  name: string;
  code: string;
  description: string;
}

const FORMULA_DATABASE: FormulaSample[] = [
  // Dasar & Aritmatika
  { category: "Dasar", name: "Pecahan Biasa", code: "\\frac{a}{b}", description: "Format pecahan pembilang dan penyebut" },
  { category: "Dasar", name: "Pangkat / Eksponen", code: "x^{2} + y^{n}", description: "Pangkat bilangan atau variabel" },
  { category: "Dasar", name: "Indeks / Subskrip", code: "x_{1}, x_{2}, a_{n}", description: "Indeks urutan variabel" },
  { category: "Dasar", name: "Perkalian Titik & Silang", code: "a \\times b = a \\cdot b", description: "Simbol perkalian kali dan titik" },
  { category: "Dasar", name: "Pembagian", code: "a \\div b", description: "Simbol tanda bagi" },
  { category: "Dasar", name: "Plus Minus", code: "x = \\pm 5", description: "Toleransi atau solusi plus-minus" },
  { category: "Dasar", name: "Pertidaksamaan", code: "a \\le b \\quad \\text{dan} \\quad x \\ge y", description: "Kurang dari sama dengan / Lebih dari sama dengan" },
  { category: "Dasar", name: "Tidak Sama Dengan", code: "a \\neq b", description: "Pernyataan ketidaksamaan nilai" },
  { category: "Dasar", name: "Mendekati / Kira-kira", code: "\\pi \\approx 3{,}14", description: "Nilai pendekatan / aproksimasi" },

  // Aljabar & Akar
  { category: "Aljabar", name: "Akar Kuadrat", code: "\\sqrt{x}", description: "Akar pangkat dua" },
  { category: "Aljabar", name: "Akar Pangkat n", code: "\\sqrt[3]{8} = 2", description: "Akar dengan indeks derajat n" },
  { category: "Aljabar", name: "Rumus Kuadrat (ABC)", code: "x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}", description: "Rumus akar persamaan kuadrat" },
  { category: "Aljabar", name: "Pecahan Bertingkat", code: "\\frac{1}{1 + \\frac{1}{x}}", description: "Pecahan di dalam pecahan" },
  { category: "Aljabar", name: "Sistem Persamaan Kurung", code: "\\begin{cases} 2x + y = 5 \\\\ x - 3y = 2 \\end{cases}", description: "SPLDV / SPLTV dengan kurung kurawal" },
  { category: "Aljabar", name: "Logaritma", code: "^{2}\\log 8 = 3 \\quad \\text{atau} \\quad \\log_{10}(100) = 2", description: "Notasi logaritma basis atas maupun bawah" },
  { category: "Aljabar", name: "Nilai Mutlak", code: "|x - 3| < 5", description: "Kurung nilai mutlak" },

  // Geometri & Trigonometri
  { category: "Geometri & Trigonometri", name: "Fungsi Sinus, Cosinus, Tan", code: "\\sin^2\\theta + \\cos^2\\theta = 1", description: "Identitas trigonometri dasar" },
  { category: "Geometri & Trigonometri", name: "Tangen & Sudut", code: "\\tan(45^{\\circ}) = 1", description: "Fungsi tangen dengan notasi derajat" },
  { category: "Geometri & Trigonometri", name: "Simbol Sudut & Segitiga", code: "\\angle ABC = 90^{\\circ}, \\quad \\triangle ABC", description: "Lambang sudut dan bangun segitiga" },
  { category: "Geometri & Trigonometri", name: "Tegak Lurus & Sejajar", code: "L_1 \\perp L_2 \\quad \\text{dan} \\quad g_1 \\parallel g_2", description: "Relasi garis tegak lurus dan sejajar" },

  // Kalkulus & Matriks
  { category: "Kalkulus & Matriks", name: "Limit Fungsi", code: "\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1", description: "Notasi limit fungsi" },
  { category: "Kalkulus & Matriks", name: "Turunan / Diferensial", code: "\\frac{df}{dx} = \\lim_{\\Delta x \\to 0} \\frac{\\Delta y}{\\Delta x}", description: "Notasi turunan pertama Leibniz" },
  { category: "Kalkulus & Matriks", name: "Integral Tak Tentu", code: "\\int (3x^2 + 2x) \\, dx", description: "Integral tanpa batas integrasi" },
  { category: "Kalkulus & Matriks", name: "Integral Tentu", code: "\\int_{0}^{2} x^3 \\, dx = \\left[ \\frac{1}{4}x^4 \\right]_{0}^{2}", description: "Integral dengan batas bawah dan batas atas" },
  { category: "Kalkulus & Matriks", name: "Notasi Sigma (Penjumlahan)", code: "\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}", description: "Deret dan penjumlahan sigma" },
  { category: "Kalkulus & Matriks", name: "Matriks Kurung Biasa (2x2)", code: "\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}", description: "Matriks ordo 2x2 kurung bundar" },
  { category: "Kalkulus & Matriks", name: "Matriks Kurung Siku (3x3)", code: "\\begin{bmatrix} 1 & 0 & 0 \\\\ 0 & 1 & 0 \\\\ 0 & 0 & 1 \\end{bmatrix}", description: "Matriks identitas kurung siku" },
  { category: "Kalkulus & Matriks", name: "Determinan Matriks", code: "\\det(A) = \\begin{vmatrix} a & b \\\\ c & d \\end{vmatrix} = ad - bc", description: "Garis lurus tanda determinan" },

  // Fisika & Kimia
  { category: "Fisika & Kimia", name: "Kecepatan & GLBB", code: "v_t = v_0 + a \\cdot t, \\quad s = v_0 t + \\frac{1}{2}at^2", description: "Rumus gerak lurus berubah beraturan" },
  { category: "Fisika & Kimia", name: "Hukum Ohm & Daya Listrik", code: "V = I \\cdot R, \\quad P = V \\cdot I = I^2 R", description: "Kelistrikan arus searah" },
  { category: "Fisika & Kimia", name: "Rumus Molekul Senyawa Kimia", code: "\\text{H}_2\\text{SO}_4 + 2\\text{NaOH} \\rightarrow \\text{Na}_2\\text{SO}_4 + 2\\text{H}_2\\text{O}", description: "Reaksi asam-basa stoikiometri" },
  { category: "Fisika & Kimia", name: "Konsentrasi Molaritas", code: "M = \\frac{n}{V} = \\frac{g}{\\text{Mr}} \\times \\frac{1000}{V_{\\text{mL}}}", description: "Perhitungan kimia analitik" },
  { category: "Fisika & Kimia", name: "Satuan Fisika", code: "\\Omega, \\quad \\mu\\text{F}, \\quad \\text{m/s}^2, \\quad \\text{N/m}^2", description: "Ohm, mikrofarad, percepatan, pascal" },

  // Simbol & Yunani
  { category: "Simbol & Yunani", name: "Huruf Yunani Populer", code: "\\alpha, \\; \\beta, \\; \\gamma, \\; \\theta, \\; \\lambda, \\; \\pi, \\; \\mu, \\; \\sigma, \\; \\Delta, \\; \\Omega", description: "Simbol parameter fisika, sudut, dan rekayasa" },
  { category: "Simbol & Yunani", name: "Notasi Vektor Panah", code: "\\vec{F} = m \\cdot \\vec{a}", description: "Besaran vektor dengan tanda panah atas" },
  { category: "Simbol & Yunani", name: "Logika Implikasi & Biimplikasi", code: "p \\Rightarrow q \\quad \\text{dan} \\quad p \\Leftrightarrow q", description: "Jika-maka dan jika-dan-hanya-jika" },
  { category: "Simbol & Yunani", name: "Himpunan Bagian & Anggota", code: "x \\in A \\quad \\text{dan} \\quad A \\subset B", description: "Simbol teori himpunan" },
];

export default function KatexCheatSheetModal({ isOpen, onClose, onInsert }: KatexCheatSheetModalProps) {
  const [activeCategory, setActiveCategory] = useState<string>("Semua");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const categories = ["Semua", "Dasar", "Aljabar", "Geometri & Trigonometri", "Kalkulus & Matriks", "Fisika & Kimia", "Simbol & Yunani"];

  const filteredFormulas = FORMULA_DATABASE.filter((item) => {
    const matchesCat = activeCategory === "Semua" || item.category === activeCategory;
    const matchesSearch =
      searchQuery === "" ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const handleCopyOrInsert = (code: string) => {
    if (onInsert) {
      // Sisipkan dengan dollar format inline: $code$
      onInsert(`$${code}$`);
    } else {
      navigator.clipboard.writeText(`$${code}$`);
    }
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 1800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <span>Panduan Penulisan Rumus KaTeX / LaTeX</span>
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold rounded-full">
                  1-Klik Sisip
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Pilih rumus yang diinginkan untuk langsung menyalin atau memasukkannya ke editor soal.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Rules Banner */}
        <div className="p-3.5 bg-gradient-to-r from-blue-50/80 to-indigo-50/60 border border-blue-100 rounded-2xl text-xs space-y-1.5 shrink-0">
          <div className="flex items-center gap-1.5 text-blue-900 font-bold">
            <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
            <span>Aturan Dasar Format Math KaTeX:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 text-[11px] leading-relaxed">
            <div className="bg-white/80 p-2 rounded-xl border border-blue-100">
              <span className="font-bold text-blue-700">1. Rumus Sebaris (Inline):</span>
              <p>Apit dengan tanda dollar tunggal: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-pink-600">$f(x) = x^2$</code></p>
            </div>
            <div className="bg-white/80 p-2 rounded-xl border border-blue-100">
              <span className="font-bold text-indigo-700">2. Rumus Blok Tengah (Display):</span>
              <p>Apit dengan dollar ganda: <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-pink-600">$$ \int_{0}^{1} x \, dx $$</code></p>
            </div>
          </div>
        </div>

        {/* Search & Categories Filter */}
        <div className="space-y-2.5 shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari rumus (mis: pecahan, akar, integral, molekul, matriks)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-blue-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer text-xs ${
                  activeCategory === cat
                    ? "bg-blue-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Formula Cards Grid */}
        <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 min-h-[220px]">
          {filteredFormulas.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              Tidak ditemukan rumus dengan kata kunci "{searchQuery}".
            </div>
          ) : (
            filteredFormulas.map((item, idx) => (
              <div
                key={idx}
                className="bg-white border border-slate-200 hover:border-blue-400 p-3.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all hover:shadow-xs group"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{item.name}</span>
                    <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md font-semibold">
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">{item.description}</p>
                  
                  {/* LaTeX Syntax display */}
                  <div className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 font-mono text-[11px] text-pink-700 select-all overflow-x-auto">
                    ${item.code}$
                  </div>
                </div>

                {/* Rendered KaTeX preview & Insert Action */}
                <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                  <div className="px-3 py-1.5 bg-blue-50/50 border border-blue-100 rounded-xl min-w-[80px] text-center">
                    <MathRenderer content={`$${item.code}$`} className="text-sm font-semibold" />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCopyOrInsert(item.code)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      copiedCode === item.code
                        ? "bg-emerald-600 text-white"
                        : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs shadow-blue-500/20"
                    }`}
                  >
                    {copiedCode === item.code ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Tersisip!</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{onInsert ? "Sisipkan" : "Salin"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 shrink-0">
          <span>Menampilkan {filteredFormulas.length} rumus KaTeX standar TKA</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}

