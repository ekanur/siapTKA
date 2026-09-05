"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  ArrowLeft,
  ArrowRight,
  Search,
  Zap,
  CheckCheck,
} from "lucide-react";
import MathRenderer from "@/components/math/MathRenderer";
import RichQuestionEditor from "@/components/editor/RichQuestionEditor";
import KatexCheatSheetModal from "@/components/editor/KatexCheatSheetModal";
import { normalizeOpsiJawaban, normalizeKunciJawaban } from "@/lib/quiz/normalize";
import {
  MAPEL_WAJIB,
  MAPEL_PILIHAN_GROUPS,
  getSubjectDisplayName,
  SUBJECT_ALIASES,
} from "@/lib/constants/subjects";

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
  const { data: session, status: authStatus } = useSession();
  const userRole = (session?.user as any)?.role;
  const userMapel = (session?.user as any)?.mapel;

  // Selected subject for drill-down.
  // For GURU: automatically locked to userMapel.
  // For ADMIN: null initially (showing subject grid overview first).
  const [selectedMapel, setSelectedMapel] = useState<string | null>(null);

  // Soal list state (when inside a subject drill-down or teacher view)
  const [soalList, setSoalList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"MENUNGGU_VALIDASI" | "AKTIF" | "DITOLAK">("MENUNGGU_VALIDASI");
  const [statusMsg, setStatusMsg] = useState("");

  // Summary state for Admin Subject Overview
  const [summaryData, setSummaryData] = useState<{
    [mapel: string]: { MENUNGGU_VALIDASI: number; AKTIF: number; DITOLAK: number; total: number };
  }>({});
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [searchSubject, setSearchSubject] = useState("");
  const [subjectCategoryFilter, setSubjectCategoryFilter] = useState("ALL");

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

  // General LaTeX guide modal state
  const [isGeneralLatexGuideOpen, setIsGeneralLatexGuideOpen] = useState(false);

  // Build flattened list of all 72 subjects for overview
  const allSubjectCards = useMemo(() => {
    const list: { id: string; name: string; category: string; groupKey: string }[] = [];
    MAPEL_WAJIB.forEach((m) => {
      list.push({ id: m.id, name: m.name, category: "Mata Pelajaran Wajib", groupKey: "WAJIB" });
    });
    MAPEL_PILIHAN_GROUPS.forEach((g) => {
      const isAkademik = g.groupName.includes("Akademik");
      g.subjects.forEach((s) => {
        list.push({
          id: s.id,
          name: s.name,
          category: g.groupName,
          groupKey: isAkademik ? "AKADEMIK" : "SMK",
        });
      });
    });
    return list;
  }, []);

  // Sync role to selected mapel
  useEffect(() => {
    if (userRole === "GURU" && userMapel) {
      setSelectedMapel(userMapel);
      setManualMapel(userMapel);
    }
  }, [userRole, userMapel]);

  // Load summary for Admin overview
  const loadSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch("/api/admin/soal?summary=true");
      const data = await res.json();
      if (data.success && data.summary) {
        const stats: any = {};
        for (const row of data.summary) {
          const m = row.mapel;
          if (!stats[m]) {
            stats[m] = { MENUNGGU_VALIDASI: 0, AKTIF: 0, DITOLAK: 0, total: 0 };
          }
          stats[m][row.status] = (stats[m][row.status] || 0) + row._count.id;
          stats[m].total += row._count.id;
        }
        setSummaryData(stats);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (userRole === "ADMIN") {
      loadSummary();
    }
  }, [userRole]);

  // Calculate stats for a given subject (incorporating aliases if any)
  const getSubjectStats = (subId: string) => {
    const norm = subId.toUpperCase();
    const selfStats = summaryData[norm] || { MENUNGGU_VALIDASI: 0, AKTIF: 0, DITOLAK: 0, total: 0 };
    let totalMenunggu = selfStats.MENUNGGU_VALIDASI || 0;
    let totalAktif = selfStats.AKTIF || 0;
    let totalDitolak = selfStats.DITOLAK || 0;
    let grandTotal = selfStats.total || 0;

    Object.entries(SUBJECT_ALIASES).forEach(([alias, target]) => {
      if (target === norm && summaryData[alias]) {
        totalMenunggu += summaryData[alias].MENUNGGU_VALIDASI || 0;
        totalAktif += summaryData[alias].AKTIF || 0;
        totalDitolak += summaryData[alias].DITOLAK || 0;
        grandTotal += summaryData[alias].total || 0;
      }
    });

    return {
      menunggu: totalMenunggu,
      aktif: totalAktif,
      ditolak: totalDitolak,
      total: grandTotal,
    };
  };

  // Active subject cards: only include subjects where total questions > 0
  // Excludes subjects with 0 questions to reduce resource load and focus on validation
  const activeSubjectCards = useMemo(() => {
    const matched = new Set<string>();
    const list: {
      id: string;
      name: string;
      category: string;
      groupKey: string;
      stats: { menunggu: number; aktif: number; ditolak: number; total: number };
    }[] = [];

    allSubjectCards.forEach((s) => {
      const stats = getSubjectStats(s.id);
      if (stats.total > 0) {
        matched.add(s.id.toUpperCase());
        Object.entries(SUBJECT_ALIASES).forEach(([alias, target]) => {
          if (target === s.id.toUpperCase()) matched.add(alias);
        });
        list.push({ ...s, stats });
      }
    });

    // Also include any subjects from summaryData not directly covered in allSubjectCards
    Object.keys(summaryData).forEach((rawMapel) => {
      const upper = rawMapel.toUpperCase();
      if (!matched.has(upper)) {
        const stats = getSubjectStats(rawMapel);
        if (stats.total > 0) {
          matched.add(upper);
          list.push({
            id: rawMapel,
            name: getSubjectDisplayName(rawMapel),
            category: "Mata Pelajaran Kejuruan / Pilihan",
            groupKey: "SMK",
            stats,
          });
        }
      }
    });

    // Sort: subjects with pending validation first (highest menunggu count first), then alphabetical
    list.sort((a, b) => {
      if (b.stats.menunggu !== a.stats.menunggu) {
        return b.stats.menunggu - a.stats.menunggu;
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [allSubjectCards, summaryData]);

  // Grand totals across only active subjects for top stats bar
  const grandStats = useMemo(() => {
    let menunggu = 0;
    let aktif = 0;
    let ditolak = 0;
    let total = 0;
    let subjectsWithPending = 0;

    activeSubjectCards.forEach((s) => {
      menunggu += s.stats.menunggu;
      aktif += s.stats.aktif;
      ditolak += s.stats.ditolak;
      total += s.stats.total;
      if (s.stats.menunggu > 0) subjectsWithPending++;
    });

    return {
      totalSubjects: activeSubjectCards.length,
      menunggu,
      aktif,
      ditolak,
      total,
      subjectsWithPending,
    };
  }, [activeSubjectCards]);

  // Effective mapel: For GURU it is directly userMapel, for ADMIN it is selectedMapel
  const currentMapel = userRole === "GURU" ? userMapel : selectedMapel;
  const currentMapelStats = currentMapel ? getSubjectStats(currentMapel) : null;

  // Load questions when drill-down is active or for Guru
  const loadSoal = async (targetMapel?: string) => {
    const mapelToFetch = targetMapel || currentMapel;
    if (!mapelToFetch) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/soal?status=${activeTab}&mapel=${mapelToFetch}`);
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
    if (currentMapel) {
      loadSoal(currentMapel);
    }
  }, [currentMapel, activeTab]);

  // Single question status update
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
        if (userRole === "ADMIN") loadSummary();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Bulk Approve / Full Verifikasi for a specific subject
  const handleBulkApprove = async (mapelCode: string) => {
    const displayName = getSubjectDisplayName(mapelCode);
    const stats = getSubjectStats(mapelCode);
    if (stats.menunggu === 0) {
      alert(`Tidak ada butir soal yang menunggu validasi untuk ${displayName}.`);
      return;
    }

    if (
      !confirm(
        `FULL VERIFIKASI: Apakah Anda yakin ingin menyetujui sekaligus seluruh ${stats.menunggu} butir soal menunggu validasi pada mata pelajaran "${displayName}" menjadi Bank Soal AKTIF?`
      )
    ) {
      return;
    }

    try {
      const res = await fetch("/api/admin/soal", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bulkApproveMapel: mapelCode }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg(data.message);
        if (userRole === "ADMIN") loadSummary();
        if (currentMapel) loadSoal();
      } else {
        alert(data.error || "Gagal melakukan verifikasi penuh.");
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan jaringan.");
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
        if (userRole === "ADMIN") loadSummary();
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
      if (Array.isArray(parsedOpsi)) {
        opsiList = parsedOpsi.map((op: any, i: number) => ({
          id: String(op.id || String.fromCharCode(65 + i)).toUpperCase(),
          label: String(op.label || op.teks || op.text || ""),
        }));
      }
      kunciPg = typeof parsedKunci === "string" && parsedKunci ? parsedKunci.toUpperCase() : "A";
    }

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
        if (userRole === "ADMIN") loadSummary();
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
        if (currentMapel) loadSoal();
        if (userRole === "ADMIN") loadSummary();
      } else {
        alert(data.error || "Gagal menambah soal.");
      }
    } catch (err: any) {
      alert(err.message || "Terjadi kesalahan jaringan.");
    } finally {
      setIsSavingManual(false);
    }
  };

  const toggleManualMcmaKey = (letter: string) => {
    if (manualKunciMcma.includes(letter)) {
      if (manualKunciMcma.length > 1) {
        setManualKunciMcma(manualKunciMcma.filter((k) => k !== letter));
      }
    } else {
      setManualKunciMcma([...manualKunciMcma, letter].sort());
    }
  };

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

  // Filtered Subject Cards for Admin Overview (Only subjects with total > 0)
  const filteredSubjectCards = useMemo(() => {
    return activeSubjectCards.filter((s) => {
      if (subjectCategoryFilter === "PENDING" && s.stats.menunggu === 0) return false;
      if (subjectCategoryFilter === "DONE" && s.stats.menunggu > 0) return false;
      if (subjectCategoryFilter === "WAJIB" && s.groupKey !== "WAJIB") return false;
      if (subjectCategoryFilter === "AKADEMIK" && s.groupKey !== "AKADEMIK") return false;
      if (subjectCategoryFilter === "SMK" && s.groupKey !== "SMK") return false;

      if (searchSubject.trim()) {
        const query = searchSubject.toLowerCase();
        return (
          s.id.toLowerCase().includes(query) ||
          s.name.toLowerCase().includes(query) ||
          s.category.toLowerCase().includes(query)
        );
      }
      return true;
    });
  }, [activeSubjectCards, subjectCategoryFilter, searchSubject]);

  // =========================================================================
  // VIEW 1: ADMIN SUBJECT OVERVIEW (Shown only to Admin when no mapel is selected)
  // For Guru, showAdminSubjectOverview is ALWAYS false.
  // =========================================================================
  const showAdminSubjectOverview = userRole === "ADMIN" && !selectedMapel;

  if (authStatus === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 font-medium">Memuat data sesi pengguna...</p>
      </div>
    );
  }

  if (userRole === "GURU" && !userMapel) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-amber-200 space-y-3 my-8">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="font-bold text-slate-800 text-sm">Mata Pelajaran Belum Ditugaskan</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Akun Guru Anda belum dikaitkan dengan mata pelajaran tertentu. Silakan hubungi Administrator untuk mengatur penugasan mata pelajaran di menu Manajemen Pengguna.
        </p>
      </div>
    );
  }

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
              ? `Login sebagai Guru Mapel ${getSubjectDisplayName(userMapel)}. Anda dapat langsung memvalidasi dan menambahkan butir soal untuk mapel Anda.`
              : showAdminSubjectOverview
              ? "Tinjauan kesiapan butir soal per mata pelajaran dengan fitur Full Verifikasi instan. Hanya mapel yang memiliki butir soal (> 0) yang ditampilkan."
              : `Mata Pelajaran: ${getSubjectDisplayName(currentMapel || "")}. Kelola dan verifikasi butir soal secara spesifik.`}
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
            onClick={() => {
              if (currentMapel) {
                setManualMapel(currentMapel);
              }
              setIsManualModalOpen(true);
            }}
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

      {/* ===================================================================== */}
      {/* ADMIN OVERVIEW: GRID MATA PELAJARAN DENGAN STATS & FULL VERIFIKASI    */}
      {/* ===================================================================== */}
      {showAdminSubjectOverview ? (
        <div className="space-y-6">
          {/* Top Aggregated Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Mapel dengan Soal</span>
              <div className="text-2xl font-black text-slate-900">{grandStats.totalSubjects} Mapel</div>
              <span className="text-[10px] text-slate-400">Hanya mapel dengan &gt; 0 butir soal</span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>Menunggu Validasi</span>
              </span>
              <div className="text-2xl font-black text-amber-900">{grandStats.menunggu} Butir</div>
              <span className="text-[10px] text-amber-700 font-semibold">
                {grandStats.subjectsWithPending} mapel perlu verifikasi
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Bank Soal Aktif</span>
              </span>
              <div className="text-2xl font-black text-emerald-900">{grandStats.aktif} Butir</div>
              <span className="text-[10px] text-emerald-700 font-semibold">Siap diujikan ke siswa</span>
            </div>

            <div className="p-4 rounded-2xl bg-rose-50/60 border border-rose-200 shadow-2xs space-y-1">
              <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                <XCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Soal Ditolak</span>
              </span>
              <div className="text-2xl font-black text-rose-900">{grandStats.ditolak} Butir</div>
              <span className="text-[10px] text-rose-700">Direvisi atau ditolak guru</span>
            </div>
          </div>

          {/* Search and Category Filter Toolbar */}
          <div className="bg-white p-3.5 rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchSubject}
                onChange={(e) => setSearchSubject(e.target.value)}
                placeholder="Cari nama mapel aktif (mis: Matematika, PPLG, Mesin)..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:border-blue-500 font-medium"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs no-scrollbar">
              {[
                { id: "ALL", label: `Semua Mapel Aktif (${grandStats.totalSubjects})` },
                { id: "PENDING", label: `⏳ Perlu Validasi (${grandStats.subjectsWithPending})` },
                { id: "DONE", label: `✓ Selesai Validasi (${grandStats.totalSubjects - grandStats.subjectsWithPending})` },
                { id: "WAJIB", label: "Mapel Wajib" },
                { id: "AKADEMIK", label: "Pilihan Akademik" },
                { id: "SMK", label: "Kejuruan SMK" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setSubjectCategoryFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                    subjectCategoryFilter === tab.id
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Subjects Grid */}
          {loadingSummary ? (
            <div className="text-center py-16 text-slate-400 text-xs">Memuat ringkasan mata pelajaran...</div>
          ) : activeSubjectCards.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                <BookOpen className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-800 text-sm">Tidak Ada Mata Pelajaran yang Membutuhkan Validasi</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                Saat ini belum ada butir soal yang diinputkan atau semua soal sudah berstatus aktif. Gunakan tombol "Input Soal Manual" atau "Generator Soal" untuk memasukkan soal baru.
              </p>
            </div>
          ) : filteredSubjectCards.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 rounded-3xl border border-dashed border-slate-200 text-slate-400 text-xs">
              Tidak ditemukan mata pelajaran aktif yang cocok dengan filter atau kata kunci "{searchSubject}".
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredSubjectCards.map((sub) => {
                const stats = sub.stats;
                const hasPending = stats.menunggu > 0;

                return (
                  <div
                    key={sub.id}
                    className={`bg-white rounded-3xl border p-5 space-y-4 transition-all hover:shadow-md flex flex-col justify-between ${
                      hasPending
                        ? "border-amber-200 hover:border-amber-400 ring-1 ring-amber-100"
                        : "border-slate-200 hover:border-blue-400"
                    }`}
                  >
                    {/* Top: Badges & Title */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-black px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                          {sub.id}
                        </span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-[150px]">
                          {sub.category}
                        </span>
                      </div>

                      <h3 className="font-black text-slate-900 text-sm leading-snug line-clamp-2">
                        {sub.name}
                      </h3>
                    </div>

                    {/* Middle: Stats breakdown */}
                    <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Menunggu</span>
                        <span
                          className={`text-sm font-black ${
                            stats.menunggu > 0 ? "text-amber-600 font-black" : "text-slate-400"
                          }`}
                        >
                          {stats.menunggu}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Aktif</span>
                        <span
                          className={`text-sm font-black ${
                            stats.aktif > 0 ? "text-emerald-700" : "text-slate-400"
                          }`}
                        >
                          {stats.aktif}
                        </span>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">Ditolak</span>
                        <span className="text-sm font-bold text-slate-500">{stats.ditolak}</span>
                      </div>
                    </div>

                    {/* Bottom: Action Buttons */}
                    <div className="space-y-2 pt-1">
                      {/* Full Verifikasi Button if pending */}
                      {hasPending && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleBulkApprove(sub.id);
                          }}
                          className="w-full py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                          title="Setujui sekaligus semua soal yang menunggu validasi di mapel ini"
                        >
                          <Zap className="w-3.5 h-3.5 fill-white" />
                          <span>Full Verifikasi ({stats.menunggu} Butir)</span>
                        </button>
                      )}

                      {/* Drill-down button */}
                      <button
                        type="button"
                        onClick={() => setSelectedMapel(sub.id)}
                        className="w-full py-2.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer group"
                      >
                        <span>Lihat & Kelola Soal</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* ===================================================================== */
        /* VIEW 2: SUBJECT DRILL-DOWN (All questions for the selected mapel)    */
        /* ===================================================================== */
        <div className="space-y-6">
          {/* Admin Back Navigation Bar */}
          {userRole === "ADMIN" && (
            <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
              <button
                type="button"
                onClick={() => setSelectedMapel(null)}
                className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Ringkasan Mapel</span>
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-500">Ganti Mapel:</span>
                <select
                  value={selectedMapel || ""}
                  onChange={(e) => setSelectedMapel(e.target.value)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 bg-white"
                >
                  {activeSubjectCards.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.stats.menunggu > 0 ? `⏳ ${sub.stats.menunggu} pending / ` : ""}{sub.stats.total} butir)
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Current Subject Badge Card */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-blue-200 uppercase tracking-wider">
                {userRole === "GURU" ? "Mata Pelajaran Anda (Guru)" : "Mata Pelajaran Aktif"}
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                {getSubjectDisplayName(currentMapel || "")}
              </h2>
              <p className="text-xs text-blue-100">
                Kode: <code className="bg-white/20 px-1.5 py-0.5 rounded font-mono font-bold">{currentMapel}</code>
              </p>
            </div>

            {/* Quick Full Verifikasi Button inside drilldown */}
            {activeTab === "MENUNGGU_VALIDASI" && soalList.length > 0 && (
              <button
                type="button"
                onClick={() => currentMapel && handleBulkApprove(currentMapel)}
                className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-amber-950 font-black rounded-xl text-xs transition-all flex items-center gap-2 shadow-sm cursor-pointer shrink-0"
              >
                <Zap className="w-4 h-4 fill-amber-950" />
                <span>Full Verifikasi ({soalList.length} Butir)</span>
              </button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setActiveTab("MENUNGGU_VALIDASI")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "MENUNGGU_VALIDASI"
                  ? "bg-amber-100 text-amber-900 shadow-xs"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Menunggu Validasi</span>
              {currentMapelStats && currentMapelStats.menunggu > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-500 text-white text-[10px] font-black">
                  {currentMapelStats.menunggu}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("AKTIF")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "AKTIF"
                  ? "bg-emerald-100 text-emerald-900 shadow-xs"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Bank Soal Aktif</span>
              {currentMapelStats && currentMapelStats.aktif > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[10px] font-black">
                  {currentMapelStats.aktif}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab("DITOLAK")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === "DITOLAK"
                  ? "bg-rose-100 text-rose-900 shadow-xs"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              <XCircle className="w-3.5 h-3.5" />
              <span>Ditolak</span>
              {currentMapelStats && currentMapelStats.ditolak > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[10px] font-black">
                  {currentMapelStats.ditolak}
                </span>
              )}
            </button>
          </div>

          {/* Question Cards List */}
          {loading ? (
            <div className="text-center py-12 text-slate-400 text-xs">Memuat daftar butir soal...</div>
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
                            <span>
                              Kunci Jawaban Benar (Multi-Pilihan):{" "}
                              {Array.isArray(parsedKunci) ? parsedKunci.join(", ") : parsedKunci}
                            </span>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: INPUT MANUAL SOAL BARU (PG, MCMA, PGK Kategori)                  */}
      {/* ========================================================================= */}
      {isManualModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-7 space-y-5 shadow-2xl border border-slate-100 my-8 max-h-[90vh] flex flex-col">
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

            <form onSubmit={handleCreateManualSoal} className="space-y-4 text-xs overflow-y-auto flex-1 pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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