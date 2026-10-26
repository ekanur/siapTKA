"use client";

import React, { useMemo } from "react";
import katex from "katex";

interface MathRendererProps {
  content: string;
  className?: string;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export default function MathRenderer({ content, className = "" }: MathRendererProps) {
  const renderedHtml = useMemo(() => {
    if (!content) return "";

    try {
      const codeBlocks: { lang: string; code: string }[] = [];
      const inlineCodes: string[] = [];

      // 1. Ekstrak Fenced Code Blocks ```[lang]\n...\n``` sebelum parser lain menyentuhnya
      let parsed = content.replace(/```([a-zA-Z0-9_\-\+\#]*)\r?\n([\s\S]*?)```/g, (_, rawLang, code) => {
        const idx = codeBlocks.length;
        const lang = (rawLang || "").trim().toUpperCase() || "CODE";
        codeBlocks.push({ lang, code: escapeHtml(code.trimEnd()) });
        return `@@@SIAPTKA_CODE_BLOCK_${idx}@@@`;
      });

      // 2. Ekstrak Inline Code `...`
      parsed = parsed.replace(/`([^`\r\n]+)`/g, (_, code) => {
        const idx = inlineCodes.length;
        inlineCodes.push(escapeHtml(code));
        return `@@@SIAPTKA_INLINE_CODE_${idx}@@@`;
      });

      // 3. Process block math $$ ... $$
      parsed = parsed.replace(/\$\$([\s\S]+?)\$\$/g, (_, equation) => {
        try {
          return katex.renderToString(equation.trim(), {
            displayMode: true,
            throwOnError: false,
          });
        } catch {
          return `<div class="katex-error">$$\n${equation}\n$$</div>`;
        }
      });

      // 4. Process inline math $ ... $
      parsed = parsed.replace(/\$([^\$\n]+?)\$/g, (_, equation) => {
        try {
          return katex.renderToString(equation.trim(), {
            displayMode: false,
            throwOnError: false,
          });
        } catch {
          return `<span class="katex-error">$${equation}$</span>`;
        }
      });

      // 5. Process markdown images ![alt](url)
      parsed = parsed.replace(
        /!\[(.*?)\]\((.*?)\)/g,
        '<img src="$2" alt="$1" class="max-w-full rounded-2xl my-2.5 max-h-96 object-contain border border-slate-200/80 shadow-xs inline-block" loading="lazy" />'
      );

      // 6. Process basic markdown emphasis (bold & italic)
      parsed = parsed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

      // 7. Process newlines to <br /> (hanya berlaku pada teks biasa di luar blok kode)
      parsed = parsed.replace(/\n/g, "<br />");

      // 8. Kembalikan Inline Code
      parsed = parsed.replace(/@@@SIAPTKA_INLINE_CODE_(\d+)@@@/g, (_, idx) => {
        const code = inlineCodes[Number(idx)] || "";
        return `<code class="px-1.5 py-0.5 rounded-md bg-slate-900 text-amber-300 font-mono text-[11px] font-semibold border border-slate-800">${code}</code>`;
      });

      // 9. Kembalikan Fenced Code Blocks dengan Desain Dark IDE
      parsed = parsed.replace(/@@@SIAPTKA_CODE_BLOCK_(\d+)@@@/g, (_, idx) => {
        const item = codeBlocks[Number(idx)];
        if (!item) return "";
        return `<div class="my-3 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100 shadow-md text-left select-text"><div class="flex items-center justify-between px-4 py-2 bg-slate-900/90 border-b border-slate-800 text-[10px] font-mono font-bold tracking-wider text-slate-300"><span class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-emerald-400 inline-block shadow-xs"></span><span>${item.lang}</span></span><span class="text-[9px] text-slate-400 font-sans font-medium uppercase tracking-normal">Kode Program</span></div><pre class="p-4 text-xs font-mono leading-relaxed overflow-x-auto text-emerald-300 bg-slate-950 m-0 border-0 rounded-none whitespace-pre select-text"><code>${item.code}</code></pre></div>`;
      });

      return parsed;
    } catch {
      return content;
    }
  }, [content]);

  return (
    <div
      className={`prose prose-slate max-w-none text-slate-800 leading-relaxed ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}