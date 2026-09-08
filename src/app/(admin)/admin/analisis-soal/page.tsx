"use client";

import React, { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Filter,
  RefreshCw,
  TrendingDown,
  Layers,
  Search,
  BookOpen,
  GraduationCap,
  Clock,
  ExternalLink,
  ChevronDown,
  HelpCircle,
  SlidersHorizontal,
} from "lucide-react";
import MathRenderer from "@/components/math/MathRenderer";
import {
  MAPEL_WAJIB,
  MAPEL_PILIHAN_GROUPS,
  getSubjectDisplayName,
  SUBJECT_ALIASES,
} from "@/lib/constants/subjects";

interface AnalyzedQuestion {
  id: string;
  mapel: string;
  topik: string;
  tipeSoal: string;
  pertanyaan: string;
  kunciJawaban: string;
  pembahasan: string;
  totalAttempts: number;
  correctAttempts: number;
  wrongAttempts: number;
  accuracyPercent: number;
  errorPercent: number;
  difficulty: "MUDAH" | "SEDANG" | "SULIT" | "BELUM_DIKERJAKAN";
  distractorMap: { [key: string]: number };
  avgDurationSec: number;
  createdAt?: string;
}

interface MapelSummaryItem {
  total: number;
  sulit: number;
  sedang: number;
  mudah: number;
  belumDikerjakan: number;
  totalAttempts: number;
  totalCorrect: number;
}

export default function AnalisisSoalPage() {
  const { data: session, status: authStatus } = useSession();
  const userRole = (session?.user as any)?.role;
  const userMapel = (session?.user as any)?.mapel;

  // Selected subject for drill-down.
  // For GURU: automatically locked to userMapel.
  // For ADMIN: null initially (showing subject grid overview first).
  const [selectedMapel, setSelectedMapel] = useState<string | null>(null);

  // Detailed items state (for drill-down or teacher view)
  const [items, setItems] = useState<AnalyzedQuestion[]>([]);
  const [subjectSummary, setSubjectSummary] = useState<any>(null);
  const [loadingItems, setLoadingItems] = useState(false);

  // Filters for drill-down view
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [searchQuestionQuery, setSearchQuestionQuery] = useState<string>("");
  const [sortBy, setSortBy] = useState<
    "DIFFICULTY_DESC" | "DIFFICULTY_ASC" | "ACCURACY_ASC" | "ATTEMPTS_DESC" | "NEWEST"
  >("DIFFICULTY_DESC");
  const [expandedDistractorId, setExpandedDistractorId] = useState<string | null>(null);

  // Summary state for Admin Subject Overview
  const [summaryByMapel, setSummaryByMapel] = useState<{ [mapel: string]: MapelSummaryItem }>({});
  const [grandSummary, setGrandSummary] = useState<any>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [searchSubject, setSearchSubject] = useState("");
  const [subjectCategoryFilter, setSubjectCategoryFilter] = useState<
    "ALL" | "SULIT_ONLY" | "WAJIB" | "AKADEMIK" | "SMK"
  >("ALL");

  // Build flattened list of all 72 subjects for canonical cataloging
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
    }
  }, [userRole, userMapel]);

  // Load summary for Admin overview
  const loadAdminSummary = async () => {
    setLoadingSummary(true);
    try {
      const res = await fetch("/api/admin/analisis?summary=true");
      const data = await res.json();
      if (data.success) {
        setSummaryByMapel(data.summaryByMapel || {});
        setGrandSummary(data.grandSummary || null);
      }
    } catch (err) {
      console.error("Error loading admin summary:", err);
    } finally {
      setLoadingSummary(false);
    }
  };

  useEffect(() => {
    if (userRole === "ADMIN" && !selectedMapel) {
      loadAdminSummary();
    }
  }, [userRole, selectedMapel]);

  // Calculate stats for a given subject (incorporating aliases)
  const getSubjectStats = (subId: string) => {
    const norm = subId.toUpperCase();
    const selfStats = summaryByMapel[norm] || {
      total: 0,
      sulit: 0,
      sedang: 0,
      mudah: 0,
      belumDikerjakan: 0,
      totalAttempts: 0,
      totalCorrect: 0,
    };

    let total = selfStats.total || 0;
    let sulit = selfStats.sulit || 0;
    let sedang = selfStats.sedang || 0;
    let mudah = selfStats.mudah || 0;
    let belumDikerjakan = selfStats.belumDikerjakan || 0;
    let totalAttempts = selfStats.totalAttempts || 0;

    Object.entries(SUBJECT_ALIASES).forEach(([alias, target]) => {
      if (target === norm && summaryByMapel[alias]) {
        total += summaryByMapel[alias].total || 0;
        sulit += summaryByMapel[alias].sulit || 0;
        sedang += summaryByMapel[alias].sedang || 0;
        mudah += summaryByMapel[alias].mudah || 0;
        belumDikerjakan += summaryByMapel[alias].belumDikerjakan || 0;
        totalAttempts += summaryByMapel[alias].totalAttempts || 0;
      }
    });

    return {
      total,
      sulit,
      sedang,
      mudah,
      belumDikerjakan,
      totalAttempts,
    };
  };

  // Active subject cards: only include subjects where total active questions > 0
  // SORTED STRICTLY BY COUNT OF QUESTIONS IN "SULIT" CATEGORY DESCENDING (Requirement 2)
  const activeSubjectCards = useMemo(() => {
    const matched = new Set<string>();
    const list: {
      id: string;
      name: string;
      category: string;
      groupKey: string;
      stats: {
        total: number;
        sulit: number;
        sedang: number;
        mudah: number;
        belumDikerjakan: number;
        totalAttempts: number;
      };
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

    // Also include any subjects from summaryByMapel not directly covered in allSubjectCards
    Object.keys(summaryByMapel).forEach((rawMapel) => {
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

    // Sort: Mapel with most SULIT questions first! (Requirement 2)
    list.sort((a, b) => {
      if (b.stats.sulit !== a.stats.sulit) {
        return b.stats.sulit - a.stats.sulit; // Most difficult questions at top!
      }
      if (b.stats.sedang !== a.stats.sedang) {
        return b.stats.sedang - a.stats.sedang;
      }
      if (b.stats.total !== a.stats.total) {
        return b.stats.total - a.stats.total;
      }
      return a.name.localeCompare(b.name);
    });

    return list;
  }, [allSubjectCards, summaryByMapel]);

  // Filtered Subject Cards for Admin Overview
  const filteredSubjectCards = useMemo(() => {
    return activeSubjectCards.filter((s) => {
      if (subjectCategoryFilter === "SULIT_ONLY" && s.stats.sulit === 0) return false;
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

  // Fetch detailed questions for the active/selected subject
  const currentMapel = userRole === "GURU" ? userMapel : selectedMapel;

  const fetchSubjectQuestions = async (mapelToFetch: string) => {
    setLoadingItems(true);
    try {
      const res = await fetch(`/api/admin/analisis?mapel=${encodeURIComponent(mapelToFetch)}`);
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
        setSubjectSummary(data.summary || null);
      }
    } catch (err) {
      console.error("Error fetching subject analysis:", err);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (currentMapel) {
      fetchSubjectQuestions(currentMapel);
    }
  }, [currentMapel]);

  // Filter & Sort Questions for the Drill-Down / Teacher View
  // Sorted by default: Tingkat Kesulitan Tertinggi (Sulit -> Sedang -> Mudah -> Belum Dikerjakan)
  const filteredAndSortedItems = useMemo(() => {
    const list = items.filter((item) => {
      if (selectedDifficulty !== "ALL" && item.difficulty !== selectedDifficulty) {
        return false;
      }
      if (searchQuestionQuery.trim()) {
        const q = searchQuestionQuery.toLowerCase();
        return (
          item.pertanyaan.toLowerCase().includes(q) ||
          item.topik.toLowerCase().includes(q) ||
          item.mapel.toLowerCase().includes(q)
        );
      }
      return true;
    });

    const diffWeight: Record<string, number> = {
      SULIT: 4,
      SEDANG: 3,
      MUDAH: 2,
      BELUM_DIKERJAKAN: 1,
    };

    list.sort((a, b) => {
      if (sortBy === "DIFFICULTY_DESC") {
        const wA = diffWeight[a.difficulty] || 0;
        const wB = diffWeight[b.difficulty] || 0;
        if (wB !== wA) return wB - wA; // SULIT first
        if (a.difficulty !== "BELUM_DIKERJAKAN") {
          if (a.accuracyPercent !== b.accuracyPercent) {
            return a.accuracyPercent - b.accuracyPercent; // lower accuracy first (harder)
          }
          return b.wrongAttempts - a.wrongAttempts;
        }
        return 0;
      }

      if (sortBy === "DIFFICULTY_ASC") {
        const wA = diffWeight[a.difficulty] || 0;
        const wB = diffWeight[b.difficulty] || 0;
        if (wA !== wB) return wA - wB; // MUDAH first
        if (a.difficulty !== "BELUM_DIKERJAKAN") {
          return b.accuracyPercent - a.accuracyPercent; // higher accuracy first (easier)
        }
        return 0;
      }

      if (sortBy === "ACCURACY_ASC") {
        return a.accuracyPercent - b.accuracyPercent;
      }

      if (sortBy === "ATTEMPTS_DESC") {
        return b.totalAttempts - a.totalAttempts;
      }

      if (sortBy === "NEWEST") {
        return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
      }

      return 0;
    });

    return list;
  }, [items, selectedDifficulty, searchQuestionQuery, sortBy]);

  // Mode check
  const showAdminSubjectOverview = userRole === "ADMIN" && !selectedMapel;

  if (authStatus === "loading") {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-500 font-medium">Memuat Analisis Butir Soal...</span>
      </div>
    );
  }

  // =========================================================================
  // VIEW 1: ADMIN SUBJECT OVERVIEW GRID
  // (Shows subjects sorted by count of difficult questions descending)
  // =========================================================================
  if (showAdminSubjectOverview) {
    const totalDifficultOverall =
      grandSummary?.totalDifficult ??
      activeSubjectCards.reduce((acc, c) => acc + c.stats.sulit, 0);
    const totalModerateOverall =
      grandSummary?.totalModerate ??
      activeSubjectCards.reduce((acc, c) => acc + c.stats.sedang, 0);
    const totalEasyOverall =
      grandSummary?.totalEasy ?? activeSubjectCards.reduce((acc, c) => acc + c.stats.mudah, 0);
    const totalAttemptsOverall =
      grandSummary?.totalAttempts ??
      activeSubjectCards.reduce((acc, c) => acc + c.stats.totalAttempts, 0);

    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold mb-1">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Analisis Butir Soal • Pusmendik Kemendikdasmen</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Analisis Tingkat Kesukaran per Mata Pelajaran
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Daftar mata pelajaran diurutkan berdasarkan jumlah soal yang masuk kategori{" "}
              <strong className="text-rose-600 font-bold">Sulit</strong> untuk memprioritaskan
              intervensi pembelajaran dan pembuatan soal remedial.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadAdminSummary}
              disabled={loadingSummary}
              className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loadingSummary ? "animate-spin" : ""}`} />
              <span>Segarkan Data</span>
            </button>
          </div>
        </div>

        {/* Grand KPI Summary Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase">Mapel Aktif</span>
              <BookOpen className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-900">{activeSubjectCards.length}</div>
            <div className="text-[11px] text-slate-500">Memiliki butir soal aktif</div>
          </div>

          <div className="bg-rose-50/80 rounded-2xl p-4 border border-rose-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-800 uppercase">Kategori SULIT</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-900">{totalDifficultOverall} Butir</div>
            <div className="text-[11px] text-rose-700 font-medium">Akurasi &lt; 40% (Remedial)</div>
          </div>

          <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 uppercase">Kategori SEDANG</span>
              <BarChart3 className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-900">{totalModerateOverall} Butir</div>
            <div className="text-[11px] text-amber-700 font-medium">Akurasi 40% – 70%</div>
          </div>

          <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase">Kategori MUDAH</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-900">{totalEasyOverall} Butir</div>
            <div className="text-[11px] text-emerald-700 font-medium">Akurasi &gt; 70%</div>
          </div>

          <div className="bg-blue-50/80 rounded-2xl p-4 border border-blue-200 shadow-xs space-y-1 col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-blue-800 uppercase">Total Pengerjaan</span>
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-black text-blue-900">{totalAttemptsOverall}</div>
            <div className="text-[11px] text-blue-700 font-medium">Kali dikerjakan siswa</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchSubject}
                onChange={(e) => setSearchSubject(e.target.value)}
                placeholder="Cari mata pelajaran berdasarkan nama atau kode mapel..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: "ALL", label: "Semua Mapel Aktif" },
                { id: "SULIT_ONLY", label: "🔴 Memiliki Soal Sulit" },
                { id: "WAJIB", label: "Wajib (TKA)" },
                { id: "AKADEMIK", label: "Akademik" },
                { id: "SMK", label: "Kejuruan SMK" },
              ].map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSubjectCategoryFilter(cat.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    subjectCategoryFilter === cat.id
                      ? "bg-slate-900 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Subject Cards Grid */}
        {loadingSummary ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Memuat ringkasan mapel...</span>
          </div>
        ) : filteredSubjectCards.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-8 space-y-3">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Mata Pelajaran Tidak Ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tidak ada mata pelajaran yang sesuai dengan kata kunci pencarian atau filter yang
              dipilih.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredSubjectCards.map((sub, idx) => {
              const hasSulit = sub.stats.sulit > 0;
              const percentSulit =
                sub.stats.total > 0 ? Math.round((sub.stats.sulit / sub.stats.total) * 100) : 0;
              const percentSedang =
                sub.stats.total > 0 ? Math.round((sub.stats.sedang / sub.stats.total) * 100) : 0;
              const percentMudah =
                sub.stats.total > 0 ? Math.round((sub.stats.mudah / sub.stats.total) * 100) : 0;
              const percentBelum =
                sub.stats.total > 0
                  ? Math.round((sub.stats.belumDikerjakan / sub.stats.total) * 100)
                  : 0;

              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedMapel(sub.id)}
                  className={`bg-white rounded-3xl border transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between overflow-hidden group ${
                    hasSulit
                      ? "border-rose-200 hover:border-rose-400 ring-1 ring-rose-100"
                      : "border-slate-200 hover:border-blue-300"
                  }`}
                >
                  <div className="p-5 space-y-3.5">
                    {/* Header: Mapel Code, Rank, and Difficulty Flag */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-700 font-black text-[11px] flex items-center justify-center">
                          #{idx + 1}
                        </span>
                        <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-extrabold rounded-md border border-blue-100 uppercase tracking-wide">
                          {sub.id}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-500">
                          {sub.category}
                        </span>
                      </div>

                      {hasSulit ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-100 text-rose-800 text-[11px] font-extrabold rounded-full border border-rose-200 shadow-2xs animate-pulse">
                          <TrendingDown className="w-3 h-3" />
                          <span>{sub.stats.sulit} Butir Sulit</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>0 Sulit</span>
                        </span>
                      )}
                    </div>

                    {/* Subject Display Name */}
                    <div>
                      <h3 className="font-extrabold text-slate-900 text-sm leading-snug group-hover:text-blue-600 transition-colors line-clamp-2">
                        {sub.name}
                      </h3>
                      <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
                        <span>Total Soal: <strong>{sub.stats.total}</strong> Butir</span>
                        <span>•</span>
                        <span>Pengerjaan: <strong>{sub.stats.totalAttempts}</strong> kali</span>
                      </div>
                    </div>

                    {/* Visual Difficulty Distribution Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                        <span>Sebaran Tingkat Kesukaran:</span>
                        <span>{sub.stats.total} Soal</span>
                      </div>
                      <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden flex">
                        {percentSulit > 0 && (
                          <div
                            style={{ width: `${percentSulit}%` }}
                            className="bg-rose-500 h-full"
                            title={`Sulit: ${sub.stats.sulit} butir (${percentSulit}%)`}
                          />
                        )}
                        {percentSedang > 0 && (
                          <div
                            style={{ width: `${percentSedang}%` }}
                            className="bg-amber-400 h-full"
                            title={`Sedang: ${sub.stats.sedang} butir (${percentSedang}%)`}
                          />
                        )}
                        {percentMudah > 0 && (
                          <div
                            style={{ width: `${percentMudah}%` }}
                            className="bg-emerald-500 h-full"
                            title={`Mudah: ${sub.stats.mudah} butir (${percentMudah}%)`}
                          />
                        )}
                        {percentBelum > 0 && (
                          <div
                            style={{ width: `${percentBelum}%` }}
                            className="bg-slate-300 h-full"
                            title={`Belum Dikerjakan: ${sub.stats.belumDikerjakan} butir (${percentBelum}%)`}
                          />
                        )}
                      </div>
                    </div>

                    {/* Breakdown Badges */}
                    <div className="grid grid-cols-4 gap-1.5 pt-1">
                      <div className="bg-rose-50 border border-rose-200/80 rounded-xl p-2 text-center">
                        <div className="text-[10px] font-bold text-rose-700 uppercase">Sulit</div>
                        <div className="text-sm font-black text-rose-900">{sub.stats.sulit}</div>
                      </div>
                      <div className="bg-amber-50 border border-amber-200/80 rounded-xl p-2 text-center">
                        <div className="text-[10px] font-bold text-amber-700 uppercase">Sedang</div>
                        <div className="text-sm font-black text-amber-900">{sub.stats.sedang}</div>
                      </div>
                      <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2 text-center">
                        <div className="text-[10px] font-bold text-emerald-700 uppercase">Mudah</div>
                        <div className="text-sm font-black text-emerald-900">{sub.stats.mudah}</div>
                      </div>
                      <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 text-center">
                        <div className="text-[10px] font-bold text-slate-500 uppercase">Belum</div>
                        <div className="text-sm font-black text-slate-700">
                          {sub.stats.belumDikerjakan}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Card Action Footer */}
                  <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between group-hover:bg-blue-50/60 transition-colors">
                    <span className="text-xs font-extrabold text-blue-700 flex items-center gap-1">
                      Buka Rincian Butir Soal
                    </span>
                    <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: DRILL-DOWN QUESTION LIST FOR SELECTED SUBJECT OR TEACHER VIEW
  // (Questions sorted by highest difficulty first by default)
  // =========================================================================
  const subjectDisplayName = getSubjectDisplayName(currentMapel || "");

  return (
    <div className="space-y-6">
      {/* Top Navigation & Breadcrumb for Admin */}
      {userRole === "ADMIN" && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setSelectedMapel(null)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Mata Pelajaran</span>
          </button>

          <span className="text-xs text-slate-500 font-semibold">
            Tingkat Kesukaran:{" "}
            <strong className="text-slate-800">
              {subjectSummary?.difficultQuestionsCount || 0} Sulit
            </strong>{" "}
            dari {subjectSummary?.totalQuestionsAnalyzed || 0} Soal
          </span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold flex items-center gap-1.5">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>{currentMapel}</span>
            </span>

            {userRole === "GURU" && (
              <span className="px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-full text-xs font-bold">
                Mode Guru Mata Pelajaran
              </span>
            )}
          </div>

          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            {subjectDisplayName}
          </h1>

          <p className="text-xs text-slate-500">
            {userRole === "GURU"
              ? "Daftar butir soal diurutkan otomatis berdasarkan tingkat kesulitan tertinggi (akurasi pengerjaan siswa terendah) untuk memprioritaskan pembahasan materi di kelas."
              : "Analisis akurasi jawaban, efektivitas distraktor, dan sebaran pengerjaan siswa untuk butir soal pada mata pelajaran ini."}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => currentMapel && fetchSubjectQuestions(currentMapel)}
            disabled={loadingItems}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loadingItems ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </button>

          <Link
            href={`/admin/validasi-soal`}
            className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
          >
            <span>Validasi & Edit Soal</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Subject KPI Summary Cards */}
      {subjectSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase">Total Soal Aktif</span>
            <div className="text-2xl font-black text-slate-900">
              {subjectSummary.totalQuestionsAnalyzed}
            </div>
            <div className="text-[11px] text-slate-500">
              Total pengerjaan: <strong>{subjectSummary.totalAllAttempts}</strong>
            </div>
          </div>

          <div className="bg-rose-50/80 rounded-2xl p-4 border border-rose-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-rose-800 uppercase">Kategori SULIT</span>
              <AlertTriangle className="w-4 h-4 text-rose-600" />
            </div>
            <div className="text-2xl font-black text-rose-900">
              {subjectSummary.difficultQuestionsCount} Butir
            </div>
            <div className="text-[11px] text-rose-700 font-medium">Akurasi &lt; 40% (Remedial)</div>
          </div>

          <div className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-amber-800 uppercase">Kategori SEDANG</span>
              <BarChart3 className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-black text-amber-900">
              {subjectSummary.moderateQuestionsCount} Butir
            </div>
            <div className="text-[11px] text-amber-700 font-medium">Akurasi 40% – 70%</div>
          </div>

          <div className="bg-emerald-50/80 rounded-2xl p-4 border border-emerald-200 shadow-xs space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-emerald-800 uppercase">Kategori MUDAH</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl font-black text-emerald-900">
              {subjectSummary.easyQuestionsCount} Butir
            </div>
            <div className="text-[11px] text-emerald-700 font-medium">Akurasi &gt; 70%</div>
          </div>

          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 shadow-xs space-y-1 col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-600 uppercase">Belum Dikerjakan</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-black text-slate-800">
              {subjectSummary.unattemptedCount || 0} Butir
            </div>
            <div className="text-[11px] text-slate-500 font-medium">Menunggu pengerjaan siswa</div>
          </div>
        </div>
      )}

      {/* Filter & Sort Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Query */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuestionQuery}
              onChange={(e) => setSearchQuestionQuery(e.target.value)}
              placeholder="Cari teks pertanyaan butir soal..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Difficulty Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
              <Filter className="w-3.5 h-3.5" /> Kesukaran:
            </span>
            {[
              { id: "ALL", label: "Semua" },
              { id: "SULIT", label: "🔴 Sulit" },
              { id: "SEDANG", label: "🟡 Sedang" },
              { id: "MUDAH", label: "🟢 Mudah" },
              { id: "BELUM_DIKERJAKAN", label: "⚪ Belum Dikerjakan" },
            ].map((d) => (
              <button
                key={d.id}
                onClick={() => setSelectedDifficulty(d.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedDifficulty === d.id
                    ? "bg-slate-900 text-white shadow-2xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>

          {/* Sort Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Urutan:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            >
              <option value="DIFFICULTY_DESC">🔥 Tingkat Kesulitan Tertinggi (Default)</option>
              <option value="DIFFICULTY_ASC">🌱 Tingkat Kesulitan Terendah (Mudah ke Sulit)</option>
              <option value="ACCURACY_ASC">📉 Akurasi Terendah (% Benar Terkecil)</option>
              <option value="ATTEMPTS_DESC">👥 Pengerjaan Terbanyak</option>
              <option value="NEWEST">🕒 Paling Baru Dibuat</option>
            </select>
          </div>
        </div>
      </div>

      {/* Item Analysis List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <h2 className="font-black text-slate-900 text-sm">
              Daftar Butir Soal ({filteredAndSortedItems.length} Butir)
            </h2>
            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[11px] font-bold rounded-md">
              {sortBy === "DIFFICULTY_DESC"
                ? "Diurutkan dari Kesulitan Tertinggi"
                : "Sesuai Urutan Pilihan"}
            </span>
          </div>

          <span className="text-xs text-slate-500">
            Akurasi dihitung dari hasil pengerjaan mandiri siswa
          </span>
        </div>

        {loadingItems ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-slate-500 font-medium">Memuat butir soal...</span>
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="text-center py-16 p-8 space-y-3">
            <HelpCircle className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-sm font-bold text-slate-800">Tidak Ada Butir Soal</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Tidak ada butir soal yang cocok dengan filter atau kriteria pencarian saat ini.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAndSortedItems.map((item, idx) => {
              const isExpanded = expandedDistractorId === item.id;

              return (
                <div key={item.id} className="p-6 hover:bg-slate-50/50 transition-colors space-y-4">
                  {/* Meta & Tags */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-800 font-black text-xs flex items-center justify-center">
                        #{idx + 1}
                      </span>
                      <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-md">
                        {item.mapel}
                      </span>
                      <span className="text-xs font-semibold text-slate-600">
                        Topik: {item.topik}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-mono">
                        {item.tipeSoal}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.difficulty === "SULIT" && (
                        <span className="px-3 py-1 bg-rose-100 text-rose-800 font-black text-xs rounded-full flex items-center gap-1.5 border border-rose-200">
                          <TrendingDown className="w-3.5 h-3.5" />
                          <span>Sulit (Butuh Remedial)</span>
                        </span>
                      )}
                      {item.difficulty === "SEDANG" && (
                        <span className="px-3 py-1 bg-amber-100 text-amber-800 font-bold text-xs rounded-full border border-amber-200">
                          Sedang
                        </span>
                      )}
                      {item.difficulty === "MUDAH" && (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full border border-emerald-200">
                          Mudah
                        </span>
                      )}
                      {item.difficulty === "BELUM_DIKERJAKAN" && (
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 font-medium text-xs rounded-full">
                          Belum Dikerjakan Siswa
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question snippet */}
                  <div className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 text-slate-900 text-sm">
                    <MathRenderer content={item.pertanyaan} />
                  </div>

                  {/* Accuracy / Error Progress Bar */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    <div className="md:col-span-8 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Benar: {item.accuracyPercent}% (
                          {item.correctAttempts} siswa)
                        </span>
                        <span className="text-rose-700 flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" /> Salah: {item.errorPercent}% (
                          {item.wrongAttempts} siswa)
                        </span>
                      </div>

                      {/* Visual bar */}
                      <div className="h-3 w-full bg-rose-200 rounded-full overflow-hidden flex">
                        <div
                          style={{ width: `${item.accuracyPercent}%` }}
                          className="h-full bg-emerald-500 transition-all duration-500"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-4 flex items-center justify-end gap-2">
                      <button
                        onClick={() => setExpandedDistractorId(isExpanded ? null : item.id)}
                        className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
                      >
                        {isExpanded ? "Tutup Pengecoh" : "Cek Pilihan Pengecoh"}
                      </button>

                      {item.difficulty === "SULIT" && (
                        <Link
                          href={`/admin/generator-soal?topic=${encodeURIComponent(
                            item.topik
                          )}&mapel=${item.mapel}`}
                          className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                          <span>AI Remedial</span>
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Distractor Breakdown Section (Accordion) */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-100/80 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in duration-200">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Distribusi Pilihan Siswa (Distractor Analysis)</span>
                        <span>Rata-Rata Waktu: {item.avgDurationSec} detik</span>
                      </div>

                      {Object.keys(item.distractorMap).length === 0 ? (
                        <p className="text-xs text-slate-500 italic">
                          Belum ada data distribusi jawaban siswa untuk soal ini.
                        </p>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {Object.entries(item.distractorMap).map(([choice, count]) => {
                            const isCorrectKey = choice === item.kunciJawaban;

                            return (
                              <div
                                key={choice}
                                className={`p-3 rounded-xl border text-xs ${
                                  isCorrectKey
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-950 font-bold"
                                    : "bg-white border-slate-200 text-slate-800"
                                }`}
                              >
                                <div className="text-[10px] text-slate-400 uppercase font-mono truncate">
                                  {isCorrectKey ? "Kunci Jawaban Benar" : "Pilihan Siswa"}
                                </div>
                                <div className="text-sm font-black truncate">{choice}</div>
                                <div className="text-[11px] text-slate-500 mt-1">
                                  Dipilih oleh <strong>{count}</strong> siswa
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}