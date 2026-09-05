"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Edit3,
  Trash2,
  AlertCircle,
  Filter,
  Check,
  X,
  PlusCircle,
  GraduationCap,
  Sparkles,
  BookOpen,
  CheckSquare,
  Square,
  Plus,
  Layers,
  HelpCircle,
} from "lucide-react";
import MathRenderer from "@/components/math/MathRenderer";
import RichQuestionEditor from "@/components/editor/RichQuestionEditor";
import KatexCheatSheetModal from "@/components/editor/KatexCheatSheetModal";
import { normalizeOpsiJawaban, normalizeKunciJawaban } from "@/lib/quiz/normalize";
import { MAPEL_WAJIB, MAPEL_PILIHAN_GROUPS, getSubjectDisplayName } from "@/lib/constants/subjects";

interface EditFormState {
  id: string;
  mapel: string;
  tipeSoal: "PILIHAN_GANDA" | "MCMA" | "PGK_KATEGORI";
  pertanyaan: string;
  pembahasan: string;
  opsiList: { id: string; label: string }[];
  kunciPg: string;
  kunciMcma: string[];
  pgkCategories: string[];
  pgkStatements: { id: number; text: string; answer: string }[];
}

export default function ValidasiSoalPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const userMapel = (session?.user as any)?.mapel;

  const [soalList, setSoalList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"MENUNGGU_VALIDASI" | "AKTIF" | "DITOLAK">("MENUNGGU_VALIDASI");
  const [selectedMapel, setSelectedMapel] = useState(userMapel || "ALL");
  const [statusMsg, setStatusMsg] = useState("");

  // Edit modal state
  const [editingForm, setEditingForm] = useState<EditFormState | null>(null);
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Manual input form state
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualMapel, setManualMapel] = useState(userMapel || "MATEMATIKA");
  const [manualTipe, setManualTipe] = useState<"PILIHAN_GANDA" | "MCMA" | "PGK_KATEGORI">("PILIHAN_GANDA");
  const [manualPertanyaan, setManualPertanyaan] = useState("");
  const [manualPembahasan, setManualPembahasan] = useState("");
  const [manualOpsi, setManualOpsi] = useState<{ [key: string]: string }>({
    A: "",
    B: "",
    C: "",
    D: "",
    E: "",
  });
  const [manualKunciPg, setManualKunciPg] = useState<string>("A");
  const [manualKunciMcma, setManualKunciMcma] = useState<string[]>(["A"]);
  const [manualPgkCategories, setManualPgkCategories] = useState<string[]>(["Benar", "Salah"]);
  const [manualPgkStatements, setManualPgkStatements] = useState<
    { id: number; text: string; answer: string }[]
  >([
    { id: 1, text: "", answer: "Benar" },
    { id: 2, text: "", answer: "Salah" },
    { id: 3, text: "", answer: "Benar" },
  ]);
  const [isSavingManual, setIsSavingManual] = useState(false);

  // LaTeX guide modal state for general access
  const [isGeneralLatexGuideOpen, setIsGeneralLatexGuideOpen] = useState(false);

  useEffect(() => {
    if (userRole === "GURU" && userMapel) {
      setSelectedMapel(userMapel);
      setManualMapel(userMapel);
    }
  }, [userRole, userMapel]);

  const loadSoal = async () => {
    setLoading(true);
    try {
      const mapelParam = userRole === "GURU" ? userMapel : selectedMapel;
      const res = await fetch(`/api/admin/soal?status=${activeTab}&mapel=${mapelParam}`);
      const data = await res.json();
      if (data.success) {
        setSoalList(data.soal);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSoal();
  }, [activeTab, selectedMapel]);

  const handleUpdateStatus = async (id: string, newStatus: "AKTIF" | "DITOLAK") => {
    try {
      const res = await fetch("/api/admin/soal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(data.message);
        loadSoal();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus butir soal ini?")) return;
    try {
      const res = await fetch(`/api/admin/soal?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setStatusMsg("Soal berhasil dihapus.");
        loadSoal();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open Edit Modal and parse existing options & answer keys
  const handleOpenEdit = (item: any) => {
    const rawTipe = item.tipeSoal || "PILIHAN_GANDA";
    const tipeSoal: "PILIHAN_GANDA" | "MCMA" | "PGK_KATEGORI" =
      rawTipe === "MCMA" ? "MCMA" : rawTipe === "PGK_KATEGORI" ? "PGK_KATEGORI" : "PILIHAN_GANDA";

    const parsedOpsi = normalizeOpsiJawaban(item.opsiJawaban);
    const parsedKunci = normalizeKunciJawaban(item.kunciJawaban, tipeSoal);

    let opsiList: { id: string; label: string }[] = [];
    let pgkCategories = ["Benar", "Salah"];
    let pgkStatements: { id: number; text: string; answer: string }[] = [];
    let kunciPg = "A";
    let kunciMcma: string[] = ["A"];

    if (tipeSoal === "PGK_KATEGORI") {
      if (parsedOpsi && typeof parsedOpsi === "object" && parsedOpsi.statements) {
        pgkCategories = parsedOpsi.categories || ["Benar", "Salah"];
        const expectedMap: { [key: number]: string } = {};
        if (Array.isArray(parsedKunci)) {
          parsedKunci.forEach((k: any) => {
            if (k && k.id !== undefined) expectedMap[k.id] = k.answer;
          });
        } else if (parsedKunci && typeof parsedKunci === "object") {
          Object.assign(expectedMap, parsedKunci);
        }

        pgkStatements = parsedOpsi.statements.map((s: any, idx: number) => ({
          id: s.id !== undefined ? s.id : idx + 1,
          text: s.text || s.pernyataan || "",
          answer: expectedMap[s.id] || pgkCategories[0] || "Benar",
        }));
      }

      if (pgkStatements.length === 0) {
        pgkStatements = [
          { id: 1, text: "", answer: "Benar" },
          { id: 2, text: "", answer: "Salah" },
        ];
      }
    } else if (tipeSoal === "MCMA") {
      if (Array.isArray(parsedOpsi)) {
        opsiList = parsedOpsi.map((op: any, i: number) => ({
          id: String(op.id || String.fromCharCode(65 + i)).toUpperCase(),
          label: String(op.label || op.teks || op.text || ""),
        }));
      }
      if (Array.isArray(parsedKunci)) {
        kunciMcma = parsedKunci.map((k: any) => String(k).toUpperCase());
      } else if (typeof parsedKunci === "string") {
        kunciMcma = parsedKunci.toUpperCase().split(/[^A-E]/).filter(Boolean);
      }
      if (kunciMcma.length === 0) kunciMcma = ["A"];
    } else {
      // PILIHAN_GANDA
      if (Array.isArray(parsedOpsi)) {
        opsiList = parsedOpsi.map((op: any, i: number) => ({
          id: String(op.id || String.fromCharCode(65 + i)).toUpperCase(),
          label: String(op.label || op.teks || op.text || ""),
        }));
      }
      kunciPg = typeof parsedKunci === "string" && parsedKunci ? parsedKunci.toUpperCase() : "A";
    }

    // Default 5 options A-E for PG / MCMA if missing
    if (tipeSoal !== "PGK_KATEGORI" && opsiList.length === 0) {
      opsiList = ["A", "B", "C", "D", "E"].map((letter) => ({ id: letter, label: "" }));
    }

    setEditingForm({
      id: item.id,
      mapel: item.mapel,
      tipeSoal,
      pertanyaan: item.pertanyaan || "",
      pembahasan: item.pembahasan || "",
      opsiList,
      kunciPg,
      kunciMcma,
      pgkCategories,
      pgkStatements,
    });
  };

  // Save changes from Edit Modal
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingForm) return;
    setIsSavingEdit(true);

    let finalOpsi: any;
    let finalKunci: any;

    if (editingForm.tipeSoal === "PGK_KATEGORI") {
      finalOpsi = {
        categories: editingForm.pgkCategories,
        statements: editingForm.pgkStatements.map((s) => ({
          id: s.id,
          text: s.text,
        })),
      };
      finalKunci = editingForm.pgkStatements.map((s) => ({
        id: s.id,
        answer: s.answer,
      }));
    } else if (editingForm.tipeSoal === "MCMA") {
      finalOpsi = editingForm.opsiList;
      finalKunci = editingForm.kunciMcma;
    } else {
      finalOpsi = editingForm.opsiList;
      finalKunci = editingForm.kunciPg;
    }

    try {
      const res = await fetch("/api/admin/soal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingForm.id,
          pertanyaan: editingForm.pertanyaan,
          pembahasan: editingForm.pembahasan,
          opsiJawaban: finalOpsi,
          kunciJawaban: finalKunci,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg("Revisi butir soal dan opsi jawaban berhasil disimpan.");
        setEditingForm(null);
        loadSoal();
      } else {
        alert(data.error || "Gagal menyimpan revisi.");
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan jaringan.");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // Submit new manual question
  const handleCreateManualSoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingManual(true);

    let formattedOpsi: any;
    let formattedKunci: any;

    if (manualTipe === "PGK_KATEGORI") {
      const validStatements = manualPgkStatements.filter((s) => s.text.trim());
      if (validStatements.length === 0) {
        alert("Harap tambahkan minimal 1 pernyataan untuk soal PGK Kategori.");
        setIsSavingManual(false);
        return;
      }
      formattedOpsi = {
        categories: manualPgkCategories,
        statements: validStatements.map((s) => ({
          id: s.id,
          text: s.text.trim(),
        })),
      };
      formattedKunci = validStatements.map((s) => ({
        id: s.id,
        answer: s.answer,
      }));
    } else if (manualTipe === "MCMA") {
      if (manualKunciMcma.length === 0) {
        alert("Pilih minimal satu kunci jawaban benar untuk soal MCMA.");
        setIsSavingManual(false);
        return;
      }
      formattedOpsi = (["A", "B", "C", "D", "E"] as const).map((letter) => ({
        id: letter,
        label: manualOpsi[letter] || "",
      }));
      formattedKunci = manualKunciMcma;
    } else {
      formattedOpsi = (["A", "B", "C", "D", "E"] as const).map((letter) => ({
        id: letter,
        label: manualOpsi[letter] || "",
      }));
      formattedKunci = manualKunciPg;
    }

    try {
      const res = await fetch("/api/admin/soal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mapel: manualMapel,
          tipeSoal: manualTipe,
          pertanyaan: manualPertanyaan,
          opsiJawaban: formattedOpsi,
          kunciJawaban: formattedKunci,
          pembahasan: manualPembahasan,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setStatusMsg(data.message);
        setIsManualModalOpen(false);
        // Reset manual form
        setManualPertanyaan("");
        setManualOpsi({ A: "", B: "", C: "", D: "", E: "" });
        setManualKunciPg("A");
        setManualKunciMcma(["A"]);
        setManualPembahasan("");
        setManualPgkStatements([
          { id: 1, text: "", answer: "Benar" },
          { id: 2, text: "", answer: "Salah" },
          { id: 3, text: "", answer: "Benar" },
        ]);
        setActiveTab("AKTIF");
        loadSoal();
      } else {
        alert(data.error || "Gagal menambah soal.");
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan jaringan.");
    } finally {
      setIsSavingManual(false);
    }
  };

  // Toggle MCMA key selection in manual modal
  const toggleManualMcmaKey = (letter: string) => {
    if (manualKunciMcma.includes(letter)) {
      if (manualKunciMcma.length > 1) {
        setManualKunciMcma(manualKunciMcma.filter((k) => k !== letter));
      }
    } else {
      setManualKunciMcma([...manualKunciMcma, letter].sort());
    }
  };

  // Toggle MCMA key selection in edit modal
  const toggleEditMcmaKey = (letter: string) => {
    if (!editingForm) return;
    const current = editingForm.kunciMcma;
    let next: string[];
    if (current.includes(letter)) {
      if (current.length > 1) {
        next = current.filter((k) => k !== letter);
      } else {
        next = current;
      }
    } else {
      next = [...current, letter].sort();
    }
    setEditingForm({ ...editingForm, kunciMcma: next });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold mb-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Kurasi & Bank Soal</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Validasi & Input Manual Soal TKA
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {userRole === "GURU"
              ? `Login sebagai Guru Mapel ${getSubjectDisplayName(userMapel)}. Anda berwenang memvalidasi soal hasil generate AI dan menambahkan soal manual untuk mapel Anda.`
              : "Validasi butir soal hasil generate AI dan input soal manual oleh guru mata pelajaran."}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsGeneralLatexGuideOpen(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            title="Buka panduan penulisan rumus matematika LaTeX"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Panduan LaTeX</span>
          </button>

          <button
            onClick={() => setIsManualModalOpen(true)}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center gap-2 cursor-pointer w-fit"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Input Soal Manual</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 text-xs rounded-xl font-bold flex items-center justify-between">
          <span>{statusMsg}</span>
          <button onClick={() => setStatusMsg("")} className="text-blue-500 hover:text-blue-700 cursor-pointer">
            Tutup
          </button>
        </div>
      )}

      {/* Tabs & Mapel Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab("MENUNGGU_VALIDASI")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "MENUNGGU_VALIDASI"
                ? "bg-amber-100 text-amber-900 shadow-xs"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Menunggu Validasi
          </button>
          <button
            onClick={() => setActiveTab("AKTIF")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "AKTIF"
                ? "bg-emerald-100 text-emerald-900 shadow-xs"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Bank Soal Aktif
          </button>
          <button
            onClick={() => setActiveTab("DITOLAK")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === "DITOLAK"
                ? "bg-rose-100 text-rose-900 shadow-xs"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            Ditolak
          </button>
        </div>

        {/* Mapel Filter (if Admin) or Badge (if Guru) */}
        {userRole === "GURU" ? (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <span>Mapel: {getSubjectDisplayName(userMapel)}</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedMapel}
              onChange={(e) => setSelectedMapel(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
            >
              <option value="ALL">Semua Mapel</option>
              <optgroup label="Mata Pelajaran Wajib (TKA)">
                {MAPEL_WAJIB.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </optgroup>
              {MAPEL_PILIHAN_GROUPS.map((group) => (
                <optgroup key={group.groupName} label={group.groupName}>
                  {group.subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Soal List Content */}
      {loading ? (
        <div className="text-center py-12 text-slate-400 text-xs">Memuat data butir soal...</div>
      ) : soalList.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 space-y-2">
          <BookOpen className="w-8 h-8 mx-auto text-slate-300" />
          <div className="font-bold text-xs">Tidak ada butir soal pada status ini.</div>
          <p className="text-[11px] text-slate-400">
            Gunakan Generator Soal AI atau klik "Input Soal Manual" untuk menambahkan butir soal baru.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {soalList.map((item, idx) => {
            const parsedOpsi = normalizeOpsiJawaban(item.opsiJawaban);
            const parsedKunci = normalizeKunciJawaban(item.kunciJawaban, item.tipeSoal);

            const isMcma = item.tipeSoal === "MCMA";
            const isPgk = item.tipeSoal === "PGK_KATEGORI";

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4 hover:border-slate-300 transition-all"
              >
                {/* Meta Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-black text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg">
                      #{idx + 1} • {getSubjectDisplayName(item.mapel, true)}
                    </span>
                    <span
                      className={`text-[11px] font-bold px-2.5 py-1 rounded-lg ${
                        isPgk
                          ? "bg-indigo-50 text-indigo-800 border border-indigo-100"
                          : isMcma
                          ? "bg-amber-50 text-amber-800 border border-amber-100"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {isPgk ? "PGK Kategori" : isMcma ? "PGK (MCMA)" : "Pilihan Ganda"}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      Sumber: {item.source || "MANUAL"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {item.status === "MENUNGGU_VALIDASI" && (
                      <>
                        <button
                          onClick={() => handleUpdateStatus(item.id, "AKTIF")}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Setujui (Terbitkan)</span>
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(item.id, "DITOLAK")}
                          className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                          <span>Tolak</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleOpenEdit(item)}
                      className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer"
                      title="Edit Butir & Opsi Soal"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all cursor-pointer"
                      title="Hapus Soal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Question Content */}
                <div className="text-xs text-slate-900 leading-relaxed font-medium">
                  <MathRenderer content={item.pertanyaan} />
                </div>

                {/* Case 1: PGK Matrix Statements Display */}
                {isPgk && parsedOpsi && parsedOpsi.statements && (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50/40">
                    <div className="bg-slate-100/90 px-4 py-2 text-[11px] font-bold text-slate-700 flex items-center justify-between border-b border-slate-200">
                      <span>Matriks Pernyataan ({parsedOpsi.statements.length} Pernyataan)</span>
                      <span className="text-indigo-700 font-extrabold">Kunci Jawaban</span>
                    </div>
                    <div className="divide-y divide-slate-100">
                      {parsedOpsi.statements.map((stmt: any, sIdx: number) => {
                        let expectedAns = "-";
                        if (Array.isArray(parsedKunci)) {
                          const foundK = parsedKunci.find((k: any) => k.id === stmt.id);
                          if (foundK) expectedAns = foundK.answer;
                        } else if (parsedKunci && typeof parsedKunci === "object") {
                          expectedAns = parsedKunci[stmt.id] || "-";
                        }

                        return (
                          <div
                            key={stmt.id || sIdx}
                            className="p-3.5 flex items-start justify-between gap-3 text-xs bg-white hover:bg-slate-50/50"
                          >
                            <div className="flex items-start gap-2.5 flex-1">
                              <span className="w-5 h-5 rounded-md bg-slate-100 font-bold text-[11px] text-slate-600 flex items-center justify-center shrink-0 mt-0.5">
                                {sIdx + 1}
                              </span>
                              <div className="text-slate-800 leading-relaxed">
                                <MathRenderer content={stmt.text || stmt.pernyataan || ""} />
                              </div>
                            </div>
                            <span className="px-3 py-1 rounded-xl text-xs font-extrabold bg-indigo-50 border border-indigo-200 text-indigo-900 shrink-0">
                              {expectedAns}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Case 2: Pilihan Ganda / MCMA Options Grid Display */}
                {!isPgk && Array.isArray(parsedOpsi) && parsedOpsi.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {isMcma && (
                      <div className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg inline-flex items-center gap-1.5 mb-1">
                        <CheckSquare className="w-3.5 h-3.5 text-amber-600" />
                        <span>Kunci Jawaban Benar (Bisa Lebih Dari 1): {Array.isArray(parsedKunci) ? parsedKunci.join(", ") : parsedKunci}</span>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {parsedOpsi.map((op: any, oIdx: number) => {
                        const opId = String(op.id || op.kunci || op.key || String.fromCharCode(65 + oIdx)).toUpperCase();
                        const opLabel = String(op.label || op.teks || op.text || op.value || "");
                        const isCorrect = Array.isArray(parsedKunci)
                          ? parsedKunci.includes(opId)
                          : String(parsedKunci).toUpperCase().includes(opId);

                        return (
                          <div
                            key={oIdx}
                            className={`p-3 rounded-2xl border text-xs flex items-start gap-2.5 transition-all ${
                              isCorrect
                                ? "bg-emerald-50/70 border-emerald-300 text-emerald-950 font-semibold ring-1 ring-emerald-200"
                                : "bg-slate-50/60 border-slate-200 text-slate-700"
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                                isCorrect ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-700"
                              }`}
                            >
                              {opId}
                            </span>
                            <div className="leading-relaxed flex-1 pt-0.5">
                              <MathRenderer content={opLabel} />
                            </div>
                            {isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Explanation */}
                {item.pembahasan && (
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                    <span className="font-bold text-slate-800 block text-[11px] uppercase tracking-wider">
                      Pembahasan & Langkah Penyelesaian:
                    </span>
                    <div className="text-slate-600 leading-relaxed">
                      <MathRenderer content={item.pembahasan} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: INPUT MANUAL SOAL BARU (PG, MCMA, PGK Kategori)                  */}
      {/* ========================================================================= */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-100 my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">Input Butir Soal Manual</h3>
                <p className="text-xs text-slate-500">
                  Mendukung Pilihan Ganda, MCMA (Multi-Jawaban), dan PGK (Matriks Benar/Salah).
                </p>
              </div>
              <button
                onClick={() => setIsManualModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleCreateManualSoal} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Mata Pelajaran */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Mata Pelajaran</label>
                  {userRole === "GURU" ? (
                    <input
                      type="text"
                      disabled
                      value={getSubjectDisplayName(manualMapel)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-700"
                    />
                  ) : (
                    <select
                      value={manualMapel}
                      onChange={(e) => setManualMapel(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white"
                    >
                      <optgroup label="Mata Pelajaran Wajib (TKA)">
                        {MAPEL_WAJIB.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name}
                          </option>
                        ))}
                      </optgroup>
                      {MAPEL_PILIHAN_GROUPS.map((group) => (
                        <optgroup key={group.groupName} label={group.groupName}>
                          {group.subjects.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.name}
                            </option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  )}
                </div>

                {/* Bentuk / Tipe Soal */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Bentuk / Tipe Soal</label>
                  <select
                    value={manualTipe}
                    onChange={(e) => setManualTipe(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 font-bold text-slate-800 bg-white"
                  >
                    <option value="PILIHAN_GANDA">Pilihan Ganda Tunggal (1 Jawaban Benar)</option>
                    <option value="MCMA">Pilihan Ganda Kompleks - MCMA (Pilih Lebih Dari 1)</option>
                    <option value="PGK_KATEGORI">Pilihan Ganda Kompleks - PGK (Matriks Benar/Salah)</option>
                  </select>
                </div>
              </div>

              {/* WYSIWYG Pertanyaan */}
              <RichQuestionEditor
                label="Pertanyaan / Stimulus Soal"
                value={manualPertanyaan}
                onChange={setManualPertanyaan}
                placeholder="Ketikkan teks stimulus atau pertanyaan soal di sini (dukungan upload gambar & KaTeX)..."
                minRows={4}
                required
              />

              {/* TIPE 1 & 2: PILIHAN_GANDA & MCMA (Opsi A - E) */}
              {manualTipe !== "PGK_KATEGORI" && (
                <div className="space-y-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-800 block text-xs">
                        Pilihan Jawaban (A – E)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {manualTipe === "MCMA"
                          ? "Centang kotak pada opsi yang merupakan jawaban benar (bisa lebih dari 1)."
                          : "Pilih tombol radio pada huruf opsi yang merupakan kunci jawaban benar."}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {(["A", "B", "C", "D", "E"] as const).map((letter) => {
                      const isChecked =
                        manualTipe === "MCMA"
                          ? manualKunciMcma.includes(letter)
                          : manualKunciPg === letter;

                      return (
                        <div key={letter} className="flex items-start gap-2">
                          {/* Key Picker Badge / Button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (manualTipe === "MCMA") {
                                toggleManualMcmaKey(letter);
                              } else {
                                setManualKunciPg(letter);
                              }
                            }}
                            className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                              isChecked
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-white border border-slate-300 text-slate-600 hover:border-blue-400"
                            }`}
                            title={
                              manualTipe === "MCMA"
                                ? `Centang ${letter} sebagai salah satu kunci benar`
                                : `Pilih ${letter} sebagai kunci jawaban benar`
                            }
                          >
                            {letter}
                          </button>

                          {/* Compact Rich Editor for Option */}
                          <div className="flex-1">
                            <RichQuestionEditor
                              isCompact
                              value={manualOpsi[letter]}
                              onChange={(val) => setManualOpsi({ ...manualOpsi, [letter]: val })}
                              placeholder={`Pilihan jawaban ${letter}... (dukungan gambar & KaTeX)`}
                              required
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TIPE 3: PGK_KATEGORI (Matriks Pernyataan Benar/Salah) */}
              {manualTipe === "PGK_KATEGORI" && (
                <div className="space-y-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                    <div>
                      <span className="font-extrabold text-slate-800 block text-xs">
                        Matriks Pernyataan & Kunci Kategori
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Tentukan teks pernyataan dan pilih kategori jawaban yang tepat untuk tiap butir.
                      </span>
                    </div>

                    {/* Category Switcher */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 font-bold">Kategori:</span>
                      <button
                        type="button"
                        onClick={() => setManualPgkCategories(["Benar", "Salah"])}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          manualPgkCategories[0] === "Benar"
                            ? "bg-indigo-600 text-white"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Benar / Salah
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualPgkCategories(["Sesuai", "Tidak Sesuai"])}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          manualPgkCategories[0] === "Sesuai"
                            ? "bg-indigo-600 text-white"
                            : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        Sesuai / Tidak Sesuai
                      </button>
                    </div>
                  </div>

                  {/* Statements List */}
                  <div className="space-y-2.5">
                    {manualPgkStatements.map((stmt, sIdx) => (
                      <div key={stmt.id} className="flex items-start gap-2 bg-white p-3 rounded-2xl border border-slate-200">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 font-bold text-xs text-slate-700 flex items-center justify-center shrink-0 mt-1">
                          {sIdx + 1}
                        </span>

                        <div className="flex-1 space-y-2">
                          <RichQuestionEditor
                            isCompact
                            value={stmt.text}
                            onChange={(val) => {
                              const updated = manualPgkStatements.map((item) =>
                                item.id === stmt.id ? { ...item, text: val } : item
                              );
                              setManualPgkStatements(updated);
                            }}
                            placeholder={`Tuliskan pernyataan ${sIdx + 1}...`}
                            required
                          />

                          {/* Category Radio Pickers */}
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[11px] font-bold text-slate-500">Kunci Benar:</span>
                            {manualPgkCategories.map((cat) => (
                              <label
                                key={cat}
                                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                  stmt.answer === cat
                                    ? "bg-indigo-50 border-indigo-400 text-indigo-900 shadow-2xs"
                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`manual-stmt-${stmt.id}`}
                                  value={cat}
                                  checked={stmt.answer === cat}
                                  onChange={() => {
                                    const updated = manualPgkStatements.map((item) =>
                                      item.id === stmt.id ? { ...item, answer: cat } : item
                                    );
                                    setManualPgkStatements(updated);
                                  }}
                                  className="hidden"
                                />
                                <span>{cat}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {manualPgkStatements.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setManualPgkStatements(
                                manualPgkStatements.filter((item) => item.id !== stmt.id)
                              );
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0 mt-1"
                            title="Hapus baris pernyataan ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const newId =
                          manualPgkStatements.length > 0
                            ? Math.max(...manualPgkStatements.map((s) => s.id)) + 1
                            : 1;
                        setManualPgkStatements([
                          ...manualPgkStatements,
                          { id: newId, text: "", answer: manualPgkCategories[0] },
                        ]);
                      }}
                      className="w-full py-2 border-2 border-dashed border-slate-200 hover:border-indigo-400 text-slate-500 hover:text-indigo-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Baris Pernyataan</span>
                    </button>
                  </div>
                </div>
              )}

              {/* WYSIWYG Pembahasan */}
              <RichQuestionEditor
                label="Pembahasan Lengkap & Langkah Penyelesaian"
                value={manualPembahasan}
                onChange={setManualPembahasan}
                placeholder="Tuliskan pembahasan detail jawaban yang benar..."
                minRows={3}
              />

              {/* Modal Actions */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsManualModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingManual}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSavingManual ? "Menyimpan..." : "Simpan ke Bank Soal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REVISI BUTIR SOAL & EDIT OPSI JAWABAN (AI Generate / Manual)      */}
      {/* ========================================================================= */}
      {editingForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-100 my-8 max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                  <span>Revisi Butir Soal</span>
                  <span className="px-2 py-0.5 bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-extrabold rounded-md">
                    {editingForm.tipeSoal}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Perbaiki pertanyaan, opsi pilihan jawaban, atau kunci jawaban sebelum divalidasi.
                </p>
              </div>
              <button
                onClick={() => setEditingForm(null)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              {/* WYSIWYG Pertanyaan */}
              <RichQuestionEditor
                label="Pertanyaan Soal"
                value={editingForm.pertanyaan}
                onChange={(val) => setEditingForm({ ...editingForm, pertanyaan: val })}
                minRows={4}
                required
              />

              {/* EDIT OPSI UNTUK PILIHAN GANDA & MCMA */}
              {editingForm.tipeSoal !== "PGK_KATEGORI" && (
                <div className="space-y-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-extrabold text-slate-800 block text-xs">
                        Revisi Pilihan Jawaban (A – E)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {editingForm.tipeSoal === "MCMA"
                          ? "Centang kotak pada opsi yang merupakan jawaban benar (bisa lebih dari 1)."
                          : "Klik tombol huruf untuk menentukan kunci jawaban benar."}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {editingForm.opsiList.map((op, oIdx) => {
                      const isChecked =
                        editingForm.tipeSoal === "MCMA"
                          ? editingForm.kunciMcma.includes(op.id)
                          : editingForm.kunciPg === op.id;

                      return (
                        <div key={op.id || oIdx} className="flex items-start gap-2">
                          {/* Key selector button */}
                          <button
                            type="button"
                            onClick={() => {
                              if (editingForm.tipeSoal === "MCMA") {
                                toggleEditMcmaKey(op.id);
                              } else {
                                setEditingForm({ ...editingForm, kunciPg: op.id });
                              }
                            }}
                            className={`w-9 h-9 rounded-xl font-black text-xs flex items-center justify-center shrink-0 transition-all cursor-pointer ${
                              isChecked
                                ? "bg-emerald-600 text-white shadow-xs"
                                : "bg-white border border-slate-300 text-slate-600 hover:border-blue-400"
                            }`}
                            title={
                              editingForm.tipeSoal === "MCMA"
                                ? `Centang ${op.id} sebagai kunci benar`
                                : `Jadikan ${op.id} sebagai kunci jawaban benar`
                            }
                          >
                            {op.id}
                          </button>

                          {/* Compact Rich Editor for Option */}
                          <div className="flex-1">
                            <RichQuestionEditor
                              isCompact
                              value={op.label}
                              onChange={(val) => {
                                const updated = editingForm.opsiList.map((item, idx) =>
                                  idx === oIdx ? { ...item, label: val } : item
                                );
                                setEditingForm({ ...editingForm, opsiList: updated });
                              }}
                              placeholder={`Pilihan jawaban ${op.id}...`}
                              required
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* EDIT OPSI UNTUK PGK_KATEGORI */}
              {editingForm.tipeSoal === "PGK_KATEGORI" && (
                <div className="space-y-3 p-4 bg-slate-50/70 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div>
                      <span className="font-extrabold text-slate-800 block text-xs">
                        Revisi Matriks Pernyataan & Kategori
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Sesuaikan kalimat pernyataan dan status kategori kunci jawaban.
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] text-slate-500 font-bold">Kategori:</span>
                      {editingForm.pgkCategories.map((cat, i) => (
                        <span key={i} className="px-2 py-0.5 bg-indigo-100 text-indigo-900 font-bold rounded text-[11px]">
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    {editingForm.pgkStatements.map((stmt, sIdx) => (
                      <div key={stmt.id || sIdx} className="flex items-start gap-2 bg-white p-3 rounded-2xl border border-slate-200">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 font-bold text-xs text-slate-700 flex items-center justify-center shrink-0 mt-1">
                          {sIdx + 1}
                        </span>

                        <div className="flex-1 space-y-2">
                          <RichQuestionEditor
                            isCompact
                            value={stmt.text}
                            onChange={(val) => {
                              const updated = editingForm.pgkStatements.map((item) =>
                                item.id === stmt.id ? { ...item, text: val } : item
                              );
                              setEditingForm({ ...editingForm, pgkStatements: updated });
                            }}
                            placeholder={`Pernyataan ${sIdx + 1}...`}
                            required
                          />

                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[11px] font-bold text-slate-500">Kunci Benar:</span>
                            {editingForm.pgkCategories.map((cat) => (
                              <label
                                key={cat}
                                className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                                  stmt.answer === cat
                                    ? "bg-indigo-50 border-indigo-400 text-indigo-900 shadow-2xs"
                                    : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                                }`}
                              >
                                <input
                                  type="radio"
                                  name={`edit-stmt-${stmt.id}`}
                                  value={cat}
                                  checked={stmt.answer === cat}
                                  onChange={() => {
                                    const updated = editingForm.pgkStatements.map((item) =>
                                      item.id === stmt.id ? { ...item, answer: cat } : item
                                    );
                                    setEditingForm({ ...editingForm, pgkStatements: updated });
                                  }}
                                  className="hidden"
                                />
                                <span>{cat}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        {editingForm.pgkStatements.length > 1 && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditingForm({
                                ...editingForm,
                                pgkStatements: editingForm.pgkStatements.filter(
                                  (item) => item.id !== stmt.id
                                ),
                              });
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer shrink-0 mt-1"
                            title="Hapus baris pernyataan ini"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        const newId =
                          editingForm.pgkStatements.length > 0
                            ? Math.max(...editingForm.pgkStatements.map((s) => s.id)) + 1
                            : 1;
                        setEditingForm({
                          ...editingForm,
                          pgkStatements: [
                            ...editingForm.pgkStatements,
                            { id: newId, text: "", answer: editingForm.pgkCategories[0] },
                          ],
                        });
                      }}
                      className="w-full py-2 border-2 border-dashed border-slate-200 hover:border-indigo-400 text-slate-500 hover:text-indigo-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Baris Pernyataan</span>
                    </button>
                  </div>
                </div>
              )}

              {/* WYSIWYG Pembahasan */}
              <RichQuestionEditor
                label="Pembahasan & Langkah Penyelesaian"
                value={editingForm.pembahasan}
                onChange={(val) => setEditingForm({ ...editingForm, pembahasan: val })}
                minRows={3}
              />

              {/* Modal Actions */}
              <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 shrink-0">
                <button
                  type="button"
                  onClick={() => setEditingForm(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-600 font-bold hover:bg-slate-200 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-5 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-md shadow-blue-500/20 cursor-pointer disabled:opacity-50"
                >
                  {isSavingEdit ? "Menyimpan..." : "Simpan Revisi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* General KaTeX Guide Modal */}
      <KatexCheatSheetModal
        isOpen={isGeneralLatexGuideOpen}
        onClose={() => setIsGeneralLatexGuideOpen(false)}
      />
    </div>
  );
}