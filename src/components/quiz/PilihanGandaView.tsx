"use client";

import React from "react";
import MathRenderer from "@/components/math/MathRenderer";
import { CheckCircle2, XCircle } from "lucide-react";

interface OptionItem {
  id: string;
  label: string;
}

interface PilihanGandaViewProps {
  soalId: string;
  options: OptionItem[];
  selectedOption: string | null;
  onSelect: (optionId: string) => void;
  isSubmitted: boolean;
  correctOption?: string;
  disabled?: boolean;
}

export default function PilihanGandaView({
  soalId,
  options,
  selectedOption,
  onSelect,
  isSubmitted,
  correctOption,
  disabled = false,
}: PilihanGandaViewProps) {
  return (
    <div className="space-y-3 mt-4">
      {options.map((opt) => {
        const isSelected = selectedOption === opt.id;
        const isCorrect = correctOption === opt.id;
        const isWrong = isSubmitted && isSelected && !isCorrect;

        let containerClass =
          "border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/30 text-slate-800";

        if (isSelected && !isSubmitted) {
          containerClass = "border-blue-600 bg-blue-50 text-blue-900 shadow-sm ring-1 ring-blue-500";
        } else if (isSubmitted) {
          if (isCorrect) {
            containerClass = "border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500";
          } else if (isWrong) {
            containerClass = "border-rose-500 bg-rose-50 text-rose-950 ring-1 ring-rose-500";
          } else {
            containerClass = "border-slate-200 bg-slate-50/50 opacity-60 text-slate-600";
          }
        }

        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled || isSubmitted}
            onClick={() => onSelect(opt.id)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3.5 group cursor-pointer disabled:cursor-default ${containerClass}`}
          >
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 transition-colors ${
                isSelected && !isSubmitted
                  ? "bg-blue-600 text-white"
                  : isSubmitted && isCorrect
                  ? "bg-emerald-600 text-white"
                  : isSubmitted && isWrong
                  ? "bg-rose-600 text-white"
                  : "bg-slate-100 text-slate-700 group-hover:bg-blue-100 group-hover:text-blue-700"
              }`}
            >
              {opt.id}
            </div>

            <div className="flex-1 pt-0.5">
              <MathRenderer content={opt.label} />
            </div>

            {isSubmitted && isCorrect && (
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
            )}
            {isSubmitted && isWrong && (
              <XCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            )}
          </button>
        );
      })}
    </div>
  );
}