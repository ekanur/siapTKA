"use client";

import React, { useState, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  Image as ImageIcon,
  Upload,
  Link as LinkIcon,
  HelpCircle,
  Eye,
  Edit3,
  Code,
  List,
  ListOrdered,
  Sparkles,
  X,
  Plus,
} from "lucide-react";
import MathRenderer from "@/components/math/MathRenderer";
import KatexCheatSheetModal from "./KatexCheatSheetModal";

interface RichQuestionEditorProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  minRows?: number;
  label?: string;
  required?: boolean;
  isCompact?: boolean;
  className?: string;
}

// Compress and convert image to optimized Base64 Data URI
async function processImageFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1024;
        const MAX_HEIGHT = 1024;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Save as WebP or JPEG for optimal compression
        const dataUrl = canvas.toDataURL("image/webp", 0.85);
        resolve(dataUrl);
      };
      img.onerror = () => resolve(e.target?.result as string);
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function RichQuestionEditor({
  value,
  onChange,
  placeholder = "Ketikkan teks di sini...",
  minRows = 3,
  label,
  required = false,
  isCompact = false,
  className = "",
}: RichQuestionEditorProps) {
  const [activeTab, setActiveTab] = useState<"edit" | "preview">("edit");
  const [isKatexGuideOpen, setIsKatexGuideOpen] = useState(false);
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageAltInput, setImageAltInput] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Insert text at current cursor position
  const insertTextAtCursor = (prefix: string, suffix = "", defaultText = "") => {
    const textarea = textareaRef.current;
    if (!textarea) {
      onChange(value + prefix + defaultText + suffix);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.substring(start, end) || defaultText;
    const replacement = prefix + selected + suffix;

    const newValue = value.substring(0, start) + replacement + value.substring(end);
    onChange(newValue);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + prefix.length + selected.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

  // Handle local image file upload
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const dataUri = await processImageFile(file);
      const altText = file.name.replace(/\.[^/.]+$/, "").substring(0, 30) || "Gambar Soal";
      insertTextAtCursor(`\n![${altText}](`, `${dataUri})\n`, "");
    } catch (err) {
      console.error("Gagal memproses gambar:", err);
      alert("Gagal memproses file gambar.");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Handle Drag & Drop
  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith("image/")) {
      try {
        setIsUploading(true);
        const dataUri = await processImageFile(file);
        insertTextAtCursor(`\n![Gambar](`, `${dataUri})\n`, "");
      } catch (err) {
        console.error(err);
      } finally {
        setIsUploading(false);
      }
    }
  };

  // Handle Clipboard Paste (Ctrl + V with image)
  const handlePaste = async (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        e.preventDefault();
        const file = item.getAsFile();
        if (file) {
          try {
            setIsUploading(true);
            const dataUri = await processImageFile(file);
            insertTextAtCursor(`\n![Screenshot](`, `${dataUri})\n`, "");
          } catch (err) {
            console.error(err);
          } finally {
            setIsUploading(false);
          }
          break;
        }
      }
    }
  };

  // Handle Image URL insertion
  const handleInsertUrl = () => {
    if (!imageUrlInput.trim()) return;
    const alt = imageAltInput.trim() || "Gambar";
    insertTextAtCursor(`\n![${alt}](`, `${imageUrlInput.trim()})\n`, "");
    setImageUrlInput("");
    setImageAltInput("");
    setIsUrlModalOpen(false);
  };

  // Extract detected image urls in text for thumbnail previews
  const detectedImages: { fullMatch: string; alt: string; url: string }[] = [];
  const imgRegex = /!\[(.*?)\]\((.*?)\)/g;
  let match;
  while ((match = imgRegex.exec(value)) !== null) {
    detectedImages.push({
      fullMatch: match[0],
      alt: match[1] || "Gambar",
      url: match[2],
    });
  }

  const removeImage = (fullMatch: string) => {
    onChange(value.replace(fullMatch, "").trim());
  };

  // Render COMPACT mode (ideal for short option fields A-E)
  if (isCompact) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        {label && <label className="block text-xs font-bold text-slate-700">{label}</label>}

        <div className="flex items-center gap-1.5">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onPaste={handlePaste}
            placeholder={placeholder}
            required={required}
            className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:border-blue-500 font-medium text-slate-800"
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-600 transition-colors shadow-2xs cursor-pointer shrink-0"
            title="Sisipkan Gambar Opsi"
          >
            <ImageIcon className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => setIsKatexGuideOpen(true)}
            className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition-colors shadow-2xs cursor-pointer shrink-0"
            title="Panduan Rumus KaTeX"
          >
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Detected Images Thumbnails */}
        {detectedImages.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {detectedImages.map((img, i) => (
              <div
                key={i}
                className="relative group rounded-lg overflow-hidden border border-slate-200 bg-slate-100 max-w-[120px]"
              >
                <img src={img.url} alt={img.alt} className="h-12 w-full object-contain" />
                <button
                  type="button"
                  onClick={() => removeImage(img.fullMatch)}
                  className="absolute top-1 right-1 p-0.5 bg-rose-600 text-white rounded-full opacity-80 group-hover:opacity-100 cursor-pointer shadow-xs"
                  title="Hapus Gambar"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            ))}
          </div>
        )}

        <KatexCheatSheetModal
          isOpen={isKatexGuideOpen}
          onClose={() => setIsKatexGuideOpen(false)}
          onInsert={(code) => onChange(value ? `${value} ${code}` : code)}
        />
      </div>
    );
  }

  // Render STANDARD mode (for Question Statement & Explanations)
  return (
    <div className={`space-y-1.5 ${className}`}>
      {/* Label and Mode Switcher */}
      <div className="flex items-center justify-between">
        {label ? (
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
            <span>{label}</span>
            {required && <span className="text-rose-500">*</span>}
          </label>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab("edit")}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
              activeTab === "edit"
                ? "bg-white text-blue-700 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Edit3 className="w-3 h-3" />
            <span>Tulis</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer ${
              activeTab === "preview"
                ? "bg-white text-emerald-700 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>Pratinjau Siswa</span>
          </button>
        </div>
      </div>

      {/* Editor Container */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`rounded-2xl border transition-all overflow-hidden ${
          isDragging
            ? "border-blue-500 bg-blue-50/20 ring-2 ring-blue-400"
            : "border-slate-300 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 bg-white"
        }`}
      >
        {/* WYSIWYG Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-1 p-1.5 bg-slate-50 border-b border-slate-200 text-slate-600">
          {/* Format Group */}
          <div className="flex items-center gap-0.5 flex-wrap">
            <button
              type="button"
              onClick={() => insertTextAtCursor("**", "**", "teks tebal")}
              className="p-1.5 hover:bg-slate-200/70 rounded-lg hover:text-slate-900 transition-colors"
              title="Tebal (Bold)"
            >
              <Bold className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor("*", "*", "teks miring")}
              className="p-1.5 hover:bg-slate-200/70 rounded-lg hover:text-slate-900 transition-colors"
              title="Miring (Italic)"
            >
              <Italic className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor("<u>", "</u>", "teks garis bawah")}
              className="p-1.5 hover:bg-slate-200/70 rounded-lg hover:text-slate-900 transition-colors"
              title="Garis Bawah (Underline)"
            >
              <Underline className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor("`", "`", "kode")}
              className="p-1.5 hover:bg-slate-200/70 rounded-lg hover:text-slate-900 transition-colors"
              title="Format Kode"
            >
              <Code className="w-3.5 h-3.5" />
            </button>

            <span className="w-px h-4 bg-slate-300 mx-1" />

            {/* List Group */}
            <button
              type="button"
              onClick={() => insertTextAtCursor("\n- ", "", "Daftar poin")}
              className="p-1.5 hover:bg-slate-200/70 rounded-lg hover:text-slate-900 transition-colors"
              title="Daftar Poin (Bullet List)"
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor("\n1. ", "", "Daftar bernomor")}
              className="p-1.5 hover:bg-slate-200/70 rounded-lg hover:text-slate-900 transition-colors"
              title="Daftar Nomor (Numbered List)"
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </button>

            <span className="w-px h-4 bg-slate-300 mx-1" />

            {/* Image Insertion Group */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="px-2 py-1 bg-white border border-slate-200 hover:bg-blue-50 hover:text-blue-700 rounded-lg text-xs font-bold transition-all flex items-center gap-1 shadow-2xs cursor-pointer"
              title="Upload Gambar dari Komputer"
            >
              <Upload className="w-3.5 h-3.5 text-blue-600" />
              <span>{isUploading ? "Memproses..." : "Upload Gambar"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsUrlModalOpen(true)}
              className="p-1.5 hover:bg-slate-200/70 rounded-lg hover:text-slate-900 transition-colors"
              title="Sisipkan Gambar dari Tautan URL"
            >
              <LinkIcon className="w-3.5 h-3.5" />
            </button>

            <span className="w-px h-4 bg-slate-300 mx-1" />

            {/* Math Formula Shortcuts */}
            <button
              type="button"
              onClick={() => insertTextAtCursor("$", "$", "x^2")}
              className="px-1.5 py-0.5 hover:bg-blue-100 text-blue-800 font-mono text-[11px] font-bold rounded-md"
              title="Rumus Sebaris (Inline $...$)"
            >
              $x$
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor("$$ ", " $$", "\\frac{a}{b}")}
              className="px-1.5 py-0.5 hover:bg-blue-100 text-blue-800 font-mono text-[11px] font-bold rounded-md"
              title="Rumus Blok Tengah ($$...$$)"
            >
              $$...$$
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor("$\\frac{", "}{b}$", "a")}
              className="px-1.5 py-0.5 hover:bg-blue-100 text-blue-800 font-mono text-[11px] font-bold rounded-md"
              title="Pecahan (\frac{a}{b})"
            >
              a/b
            </button>
            <button
              type="button"
              onClick={() => insertTextAtCursor("$\\sqrt{", "}$", "x")}
              className="px-1.5 py-0.5 hover:bg-blue-100 text-blue-800 font-mono text-[11px] font-bold rounded-md"
              title="Akar (\sqrt{x})"
            >
              √x
            </button>
          </div>

          {/* LaTeX Guide Button */}
          <button
            type="button"
            onClick={() => setIsKatexGuideOpen(true)}
            className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer shrink-0"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Panduan Rumus LaTeX</span>
          </button>
        </div>

        {/* Tab 1: Edit Mode Textarea */}
        {activeTab === "edit" ? (
          <div className="relative">
            <textarea
              ref={textareaRef}
              rows={minRows}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              onPaste={handlePaste}
              placeholder={placeholder}
              required={required}
              className="w-full p-3.5 text-xs text-slate-800 placeholder:text-slate-400 focus:outline-hidden leading-relaxed font-mono resize-y min-h-[90px]"
            />

            {/* Drag and Drop notice overlay */}
            {isDragging && (
              <div className="absolute inset-0 bg-blue-50/90 backdrop-blur-2xs flex flex-col items-center justify-center text-blue-700 font-bold text-xs gap-1 border-2 border-dashed border-blue-400 rounded-xl">
                <ImageIcon className="w-8 h-8 animate-bounce" />
                <span>Lepaskan file gambar di sini untuk menyisipkan ke soal</span>
              </div>
            )}
          </div>
        ) : (
          /* Tab 2: Live Preview Mode */
          <div className="p-4 bg-slate-50/50 min-h-[90px]">
            <div className="text-[11px] font-bold text-slate-400 mb-1 flex items-center gap-1 uppercase tracking-wider">
              <Eye className="w-3 h-3 text-emerald-600" />
              <span>Tampilan Asli Siswa:</span>
            </div>
            {value.trim() ? (
              <MathRenderer content={value} className="text-xs text-slate-900 bg-white p-3.5 rounded-xl border border-slate-200" />
            ) : (
              <div className="text-xs text-slate-400 italic py-4 text-center">
                Belum ada konten untuk dipratinjau.
              </div>
            )}
          </div>
        )}

        {/* Thumbnail Preview of Detected Images */}
        {detectedImages.length > 0 && (
          <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center gap-3">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Gambar Tersemat ({detectedImages.length}):</span>
            {detectedImages.map((img, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-1.5 bg-white rounded-xl border border-slate-200 shadow-2xs group"
              >
                <img src={img.url} alt={img.alt} className="w-8 h-8 rounded object-cover border border-slate-100" />
                <span className="text-[11px] font-medium text-slate-700 max-w-[100px] truncate">{img.alt}</span>
                <button
                  type="button"
                  onClick={() => removeImage(img.fullMatch)}
                  className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                  title="Hapus gambar ini dari soal"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* URL Image Modal */}
      {isUrlModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-blue-600" />
                <span>Sisipkan Gambar dari Tautan Web</span>
              </h4>
              <button onClick={() => setIsUrlModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Alamat URL Gambar</label>
                <input
                  type="url"
                  placeholder="https://contoh.com/gambar-grafik.png"
                  value={imageUrlInput}
                  onChange={(e) => setImageUrlInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Keterangan / Alt Text (Opsional)</label>
                <input
                  type="text"
                  placeholder="mis: Diagram Rangkaian Listrik"
                  value={imageAltInput}
                  onChange={(e) => setImageAltInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsUrlModalOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 text-xs"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleInsertUrl}
                disabled={!imageUrlInput.trim()}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs disabled:opacity-50 cursor-pointer"
              >
                Sisipkan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LaTeX CheatSheet Modal */}
      <KatexCheatSheetModal
        isOpen={isKatexGuideOpen}
        onClose={() => setIsKatexGuideOpen(false)}
        onInsert={(code) => insertTextAtCursor(code, "", "")}
      />
    </div>
  );
}

