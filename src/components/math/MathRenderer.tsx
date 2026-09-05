"use client";

import React, { useMemo } from "react";
import katex from "katex";

interface MathRendererProps {
  content: string;
  className?: string;
}

export default function MathRenderer({ content, className = "" }: MathRendererProps) {
  const renderedHtml = useMemo(() => {
    if (!content) return "";

    try {
      // 1. Process block math $$ ... $$
      let parsed = content.replace(/\$\$([\s\S]+?)\$\$/g, (_, equation) => {
        try {
          return katex.renderToString(equation.trim(), {
            displayMode: true,
            throwOnError: false,
          });
        } catch {
          return `<div class="katex-error">$$\n${equation}\n$$</div>`;
        }
      });

      // 2. Process inline math $ ... $
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

      // 3. Process markdown images ![alt](url)
      parsed = parsed.replace(
        /!\[(.*?)\]\((.*?)\)/g,
        '<img src="$2" alt="$1" class="max-w-full rounded-2xl my-2.5 max-h-96 object-contain border border-slate-200/80 shadow-xs inline-block" loading="lazy" />'
      );

      // 4. Process basic markdown emphasis (bold & italic)
      parsed = parsed.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");

      // 5. Process newlines to <br /> if standard text
      // But preserve math blocks nicely
      parsed = parsed.replace(/\n/g, "<br />");

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