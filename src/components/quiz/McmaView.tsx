"use client";

import React from "react";
import MathRenderer from "@/components/math/MathRenderer";
import { CheckSquare, Square, CheckCircle2, XCircle } from "lucide-react";

interface OptionItem {
  id: string;
  label: string;
}

interface McmaViewProps {
  soalId: string;
  options: OptionItem[];
  selectedOptions: string[];
  onToggle: (optionId: string) => void;
  isSubmitted: boolean;
  correctOptions?: string[];
  disabled?: boolean;
}

export default function McmaView({
  soalId,
  options,
  selectedOptions,
  onToggle,
  isSubmitted,
  correctOptions = [],
  disabled = false,
}: McmaViewProps) {
  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-semibold text-amber-800">
        <span className="bg-amber-200 px-2 py-0.5 rounded text-amber-950 font-bold uppercase tracking-wider">
          Tipe MCMA
        </span>
        <span>Pilihlah satu atau lebih jawaban yang menurut Anda benar.</span>
      </div>

      {options.map((opt) => {
        const isSelected = selectedOptions.includes(opt.id);
        const isExpected = correctOptions.includes(opt.id);
        const isWronglyPicked = isSubmitted && isSelected && !isExpected;
        const isMissed = isSubmitted && !isSelected && isExpected;

        let containerClass =
          "border-slate-200 bg-white hover:border-blue-400 hover:bg-blue-50/30 text-slate-800";

        if (isSelected && !isSubmitted) {
          containerClass = "border-blue-600 bg-blue-50 text-blue-900 ring-1 ring-blue-500";
        } else if (isSubmitted) {
          if (isSelected && isExpected) {
            containerClass = "border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500";
          } else if (isWronglyPicked) {
            containerClass = "border-rose-500 bg-rose-50 text-rose-950 ring-1 ring-rose-500";
          } else if (isMissed) {
            containerClass = "border-amber-400 bg-amber-50/70 text-amber-950 border-dashed";
          } else {
            containerClass = "border-slate-200 bg-slate-50/50 opacity-60 text-slate-600";
          }
        }

        return (
          <button
            key={opt.id}
            type="button"
            disabled={disabled || isSubmitted}
            onClick={() => onToggle(opt.id)}
            className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3.5 group cursor-pointer disabled:cursor-default ${containerClass}`}
          >
            <div className="pt-0.5 shrink-0 text-slate-500 group-hover:text-blue-600">
              {isSelected ? (
                <CheckSquare className="w-6 h-6 text-blue-600 fill-blue-50" />
              ) : (
                <Square className="w-6 h-6" />
              )}
            </div>

            <div className="w-7 h-7 rounded-md bg-slate-100 flex items-center justify-center font-bold text-xs text-slate-700 shrink-0">
              {opt.id}
            </div>

            <div className="flex-1 pt-0.5">
              <MathRenderer content={opt.label} />
            </div>

            {isSubmitted && isSelected && isExpected && (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            )}
            {isSubmitted && isWronglyPicked && (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            {isSubmitted && isMissed && (
              <span className="text-xs font-semibold px-2 py-1 bg-amber-200 text-amber-900 rounded shrink-0">
                Jawaban Benar Terlewat
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}