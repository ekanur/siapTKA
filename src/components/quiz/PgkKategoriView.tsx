"use client";

import React from "react";
import MathRenderer from "@/components/math/MathRenderer";
import { CheckCircle2, XCircle } from "lucide-react";

interface StatementItem {
  id: number;
  text: string;
}

interface PgkPayload {
  categories: string[]; // e.g. ["Benar", "Salah"] or ["Sesuai", "Tidak Sesuai"]
  statements: StatementItem[];
}

interface UserChoiceItem {
  id: number;
  answer: string;
}

interface ExpectedItem {
  id: number;
  answer: string;
}

interface PgkKategoriViewProps {
  soalId: string;
  payload: PgkPayload;
  userChoices: UserChoiceItem[];
  onSelectCategory: (statementId: number, category: string) => void;
  isSubmitted: boolean;
  expectedAnswers?: ExpectedItem[];
  disabled?: boolean;
}

export default function PgkKategoriView({
  soalId,
  payload,
  userChoices,
  onSelectCategory,
  isSubmitted,
  expectedAnswers = [],
  disabled = false,
}: PgkKategoriViewProps) {
  const categories = payload.categories || ["Benar", "Salah"];
  const statements = payload.statements || [];

  return (
    <div className="space-y-4 mt-4">
      <div className="flex items-center gap-2 p-2.5 bg-indigo-50 border border-indigo-200 rounded-lg text-xs font-semibold text-indigo-900">
        <span className="bg-indigo-200 px-2 py-0.5 rounded text-indigo-950 font-bold uppercase tracking-wider">
          Tipe PGK Kategori
        </span>
        <span>Tentukan kategori ({categories.join(" / ")}) untuk setiap pernyataan di bawah ini.</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="divide-y divide-slate-100">
          {statements.map((stmt, idx) => {
            const currentChoice = userChoices.find((c) => c.id === stmt.id)?.answer;
            const expected = expectedAnswers.find((e) => e.id === stmt.id)?.answer;
            const isCorrect = isSubmitted && currentChoice?.toLowerCase() === expected?.toLowerCase();
            const isWrong = isSubmitted && currentChoice && currentChoice.toLowerCase() !== expected?.toLowerCase();

            return (
              <div
                key={stmt.id}
                className={`p-4 transition-colors ${
                  isSubmitted
                    ? isCorrect
                      ? "bg-emerald-50/40"
                      : isWrong
                      ? "bg-rose-50/40"
                      : "bg-slate-50/30"
                    : "hover:bg-slate-50/70"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <div className="text-slate-800 text-sm font-medium leading-relaxed">
                      <MathRenderer content={stmt.text} />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {categories.map((cat) => {
                      const isCatSelected = currentChoice === cat;
                      const isExpectedCat = isSubmitted && expected === cat;

                      let btnStyle = "border-slate-200 bg-white text-slate-700 hover:border-blue-400";
                      if (isCatSelected && !isSubmitted) {
                        btnStyle = "border-blue-600 bg-blue-600 text-white shadow-sm";
                      } else if (isSubmitted) {
                        if (isCatSelected && isExpectedCat) {
                          btnStyle = "border-emerald-600 bg-emerald-600 text-white";
                        } else if (isCatSelected && !isExpectedCat) {
                          btnStyle = "border-rose-600 bg-rose-600 text-white";
                        } else if (!isCatSelected && isExpectedCat) {
                          btnStyle = "border-emerald-500 bg-emerald-100 text-emerald-900 border-dashed";
                        } else {
                          btnStyle = "border-slate-200 bg-slate-100 text-slate-400 opacity-60";
                        }
                      }

                      return (
                        <button
                          key={cat}
                          type="button"
                          disabled={disabled || isSubmitted}
                          onClick={() => onSelectCategory(stmt.id, cat)}
                          className={`px-3.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer disabled:cursor-default ${btnStyle}`}
                        >
                          {cat}
                        </button>
                      );
                    })}

                    {isSubmitted && (
                      <div className="ml-1">
                        {isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-rose-600" />
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}