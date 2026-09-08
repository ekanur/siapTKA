"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import confetti from "canvas-confetti";
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Award,
  RotateCcw,
  Sparkles,
  WifiOff,
  BookOpen,
  FileCheck,
  Send,
  Layers,
  ShieldAlert,
  AlertCircle,
} from "lucide-react";
import { clientDb, CachedSoal, OfflineSubmission } from "@/lib/db/client-db";
import { downloadActiveBankSoal, syncPendingSubmissions } from "@/lib/sync/sync-manager";
import { verifySingleChoice, verifyMcma, verifyPgkKategori } from "@/lib/security/crypto";
import MathRenderer from "@/components/math/MathRenderer";
import PilihanGandaView from "@/components/quiz/PilihanGandaView";
import McmaView from "@/components/quiz/McmaView";
import PgkKategoriView from "@/components/quiz/PgkKategoriView";
import { normalizeOpsiJawaban } from "@/lib/quiz/normalize";
import { isSubjectAllowedForStudent, getSubjectDisplayName } from "@/lib/constants/subjects";

export default function QuizRunnerPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session } = useSession();
  const statusTka = (session?.user as any)?.statusTka;

  const mapelParam = (params?.mapel as string) || "matematika";
  const normalizedParam = mapelParam.replace(/-/g, "_").toUpperCase();
  const mapelUpper =
    normalizedParam === "AIJ" || normalizedParam === "ADMINISTRASI_INFRASTRUKTUR_JARINGAN"
      ? "ADMINISTRASI_INFRASTRUKTUR_JARINGAN"
      : normalizedParam;

  const [questions, setQuestions] = useState<CachedSoal[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [unauthorizedReason, setUnauthorizedReason] = useState<string>("");

  useEffect(() => {
    async function verifyAccess() {
      try {
        const res = await fetch("/api/student/konfirmasi");
        const data = await res.json();
        if (data.success && data.student) {
          const auth = isSubjectAllowedForStudent(mapelUpper, data.student);
          if (!auth.allowed) {
            setIsAuthorized(false);
            setUnauthorizedReason(auth.reason || "BUKAN_PILIHAN");
            setLoading(false);
            return;
          }
        }
        setIsAuthorized(true);
      } catch {
        setIsAuthorized(true);
      }
    }
    verifyAccess();
  }, [mapelUpper]);

  // Student answers mapping: { [soalId]: answerValue }
  const [answers, setAnswers] = useState<{ [key: string]: any }>({});
  // Submitted evaluation states: { [soalId]: { isSubmitted: boolean; isBenar: boolean; skor: number } }
  const [evaluations, setEvaluations] = useState<{
    [key: string]: { isSubmitted: boolean; isBenar: boolean; skor: number };
  }>({});

  // Timer
  const [secondsSpent, setSecondsSpent] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Finish modal
  const [isFinished, setIsFinished] = useState(false);
  const [syncStatusMsg, setSyncStatusMsg] = useState("");

  // Load questions from Dexie IndexedDB
  const loadLocalQuestions = async () => {
    setLoading(true);
    let list = await clientDb.soal
      .filter((s) => {
        const m = s.mapel.toUpperCase();
        if (mapelUpper === "ADMINISTRASI_INFRASTRUKTUR_JARINGAN") {
          return m === "ADMINISTRASI_INFRASTRUKTUR_JARINGAN" || m === "AIJ";
        }
        return m === mapelUpper;
      })
      .toArray();

    // If local IndexedDB is empty and we are online, try downloading active bank
    if (list.length === 0 && navigator.onLine) {
      await downloadActiveBankSoal(mapelUpper);
      list = await clientDb.soal
        .filter((s) => {
          const m = s.mapel.toUpperCase();
          if (mapelUpper === "ADMINISTRASI_INFRASTRUKTUR_JARINGAN") {
            return m === "ADMINISTRASI_INFRASTRUKTUR_JARINGAN" || m === "AIJ";
          }
          return m === mapelUpper;
        })
        .toArray();
    }

    setQuestions(list);

    // If search param specifies a question index or question ID
    const qIndexParam = searchParams.get("q");
    const qIdParam = searchParams.get("soalId");
    if (qIndexParam !== null) {
      const idx = parseInt(qIndexParam, 10);
      if (!isNaN(idx) && idx >= 0 && idx < list.length) {
        setCurrentIndex(idx);
      }
    } else if (qIdParam) {
      const idx = list.findIndex((q) => q.id === qIdParam);
      if (idx !== -1) {
        setCurrentIndex(idx);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (isAuthorized === false) {
      if (timerRef.current) clearInterval(timerRef.current);
      setLoading(false);
      return;
    }

    if (isAuthorized === true) {
      loadLocalQuestions();

      timerRef.current = setInterval(() => {
        setSecondsSpent((prev) => prev + 1);
      }, 1000);

      return () => {
        if (timerRef.current) clearInterval(timerRef.current);
      };
    }
  }, [mapelParam, isAuthorized]);

  const currentQ = questions[currentIndex];

  // Helper parser
  const parsedOptions = React.useMemo(() => {
    if (!currentQ) return null;
    return normalizeOpsiJawaban(currentQ.opsiJawaban);
  }, [currentQ]);

  // Answer handler for PG Single
  const handleSelectPg = (optionId: string) => {
    if (!currentQ) return;
    setAnswers((prev) => ({ ...prev, [currentQ.id]: optionId }));
  };

  // Answer handler for MCMA
  const handleToggleMcma = (optionId: string) => {
    if (!currentQ) return;
    const currentList: string[] = answers[currentQ.id] || [];
    const updated = currentList.includes(optionId)
      ? currentList.filter((item) => item !== optionId)
      : [...currentList, optionId];
    setAnswers((prev) => ({ ...prev, [currentQ.id]: updated }));
  };

  // Answer handler for PGK Kategori
  const handleSelectPgkCategory = (stmtId: number, category: string) => {
    if (!currentQ) return;
    const currentList: { id: number; answer: string }[] = answers[currentQ.id] || [];
    const filtered = currentList.filter((item) => item.id !== stmtId);
    const updated = [...filtered, { id: stmtId, answer: category }];
    setAnswers((prev) => ({ ...prev, [currentQ.id]: updated }));
  };

  // Check answer offline
  const handleCheckAnswer = () => {
    if (!currentQ) return;
    const userAns = answers[currentQ.id];
    if (userAns === undefined || userAns === null) return;

    let isBenar = false;
    let skor = 0;

    if (currentQ.tipeSoal === "PILIHAN_GANDA") {
      isBenar = verifySingleChoice(currentQ.id, userAns, currentQ.kunciJawaban);
      skor = isBenar ? 100 : 0;
    } else if (currentQ.tipeSoal === "MCMA") {
      isBenar = verifyMcma(currentQ.id, userAns || [], currentQ.kunciJawaban);
      skor = isBenar ? 100 : 0;
    } else if (currentQ.tipeSoal === "PGK_KATEGORI") {
      const res = verifyPgkKategori(currentQ.id, userAns || [], currentQ.kunciJawaban);
      isBenar = res.isAllCorrect;
      skor = res.score;
    }

    setEvaluations((prev) => ({
      ...prev,
      [currentQ.id]: { isSubmitted: true, isBenar, skor },
    }));
  };

  // Finish quiz & queue offline submissions
  const handleFinishQuiz = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    // Evaluate any un-evaluated answers
    const finalEvals = { ...evaluations };
    const submissionRecords: OfflineSubmission[] = [];
    const studentId = (session?.user as any)?.id || "siswa-demo-id";

    for (const q of questions) {
      const userAns = answers[q.id];
      if (userAns !== undefined) {
        let isBenar = false;
        let skor = 0;

        if (q.tipeSoal === "PILIHAN_GANDA") {
          isBenar = verifySingleChoice(q.id, userAns, q.kunciJawaban);
          skor = isBenar ? 100 : 0;
        } else if (q.tipeSoal === "MCMA") {
          isBenar = verifyMcma(q.id, userAns || [], q.kunciJawaban);
          skor = isBenar ? 100 : 0;
        } else if (q.tipeSoal === "PGK_KATEGORI") {
          const res = verifyPgkKategori(q.id, userAns || [], q.kunciJawaban);
          isBenar = res.isAllCorrect;
          skor = res.score;
        }

        finalEvals[q.id] = { isSubmitted: true, isBenar, skor };

        submissionRecords.push({
          id: `sub-${studentId}-${q.id}-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          siswaId: studentId,
          soalId: q.id,
          mapel: q.mapel,
          tipeSoal: q.tipeSoal,
          jawabanSiswa: typeof userAns === "string" ? userAns : JSON.stringify(userAns),
          isBenar,
          skor,
          waktuPengerjaan: Math.round(secondsSpent / Math.max(1, questions.length)),
          submittedAt: Date.now(),
          syncStatus: "PENDING",
        });
      }
    }

    setEvaluations(finalEvals);

    // Save to Dexie offline queue
    if (submissionRecords.length > 0) {
      await clientDb.offlineSubmissions.bulkPut(submissionRecords);
    }

    // Trigger celebratory confetti
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
    });

    setIsFinished(true);

    // If online, auto sync in background
    if (navigator.onLine) {
      setSyncStatusMsg("Menyinkronkan progres ke server sekolah...");
      const syncRes = await syncPendingSubmissions();
      if (syncRes.success) {
        setSyncStatusMsg("Progres latihan berhasil tersinkron ke dashboard guru!");
      } else {
        setSyncStatusMsg("Jawaban tersimpan offline di perangkat. Akan dikirim saat sinyal stabil.");
      }
    } else {
      setSyncStatusMsg("Perangkat offline: Jawaban aman tersimpan di perangkat dan akan terkirim saat online.");
    }
  };

  // Format time
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const currentEval = currentQ ? evaluations[currentQ.id] : null;
  const isCurrentSubmitted = currentEval?.isSubmitted || false;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Quiz Runner Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <Link
              href={`/latihan/${mapelParam}`}
              className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-all"
              title="Kembali ke Detail Mapel"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <Link href="/latihan" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                T
              </div>
              <span className="font-extrabold text-slate-900 leading-tight text-base hidden sm:inline">siapTKA</span>
            </Link>

            {/* Menu Navigasi di Samping Logo */}
            <nav className="flex items-center gap-1 sm:gap-1.5">
              <Link
                href="/latihan"
                className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-bold bg-blue-50 text-blue-600 border border-blue-100 transition-all flex items-center gap-1.5 shadow-xs"
              >
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
                <span>Latihan</span>
              </Link>
              <Link
                href="/onboarding-tka"
                className="px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-all flex items-center gap-1.5"
              >
                <FileCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500" />
                <span>Konfirmasi</span>
              </Link>
            </nav>

            {/* Mapel & Topic Info */}
            <div className="hidden md:block border-l border-slate-200 pl-3">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                {currentQ?.mapel || mapelUpper}
              </span>
              <p className="font-bold text-slate-800 text-xs truncate max-w-[160px] lg:max-w-[220px]">
                {currentQ?.topik || "Latihan Mandiri TKA"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-xl text-xs font-mono font-bold">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span>{formatTime(secondsSpent)}</span>
            </div>

            <button
              onClick={handleFinishQuiz}
              disabled={questions.length === 0}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <Award className="w-4 h-4" />
              <span className="hidden sm:inline">Selesai Latihan</span>
            </button>
          </div>
        </div>
      </header>

      {isAuthorized === false && unauthorizedReason === "BUKAN_PILIHAN" ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-6 shadow-sm max-w-md w-full my-8">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200 uppercase tracking-wider">
                Mata Pelajaran Tidak Aktif
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Bukan Pilihan TKA Anda
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mata pelajaran <strong>{getSubjectDisplayName(mapelUpper, true)}</strong> tidak termasuk dalam mata pelajaran wajib maupun pilihan yang Anda ambil saat konfirmasi TKA. Anda tidak dapat mengerjakan latihan untuk mata pelajaran ini.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/latihan"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all text-center"
              >
                Kembali ke Beranda Latihan
              </Link>
              <Link
                href="/onboarding-tka"
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all text-center"
              >
                Ubah Pilihan TKA
              </Link>
            </div>
          </div>
        </div>
      ) : statusTka === "TIDAK_IKUT" || unauthorizedReason === "TIDAK_IKUT" ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center space-y-6 shadow-sm max-w-md w-full my-8">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto shadow-sm">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full border border-rose-200 uppercase tracking-wider">
                Akses Dinonaktifkan
              </span>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Tidak Mengikuti Sesi TKA
              </h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Status konfirmasi Anda tercatat <strong>Tidak Mengikuti TKA 2026</strong>. Anda tidak dapat mengerjakan latihan soal TKA.
              </p>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/onboarding-tka"
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all text-center"
              >
                Ubah Konfirmasi Keikutsertaan
              </Link>
              <Link
                href="/latihan"
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all text-center"
              >
                Kembali ke Beranda Latihan
              </Link>
            </div>
          </div>
        </div>
      ) : loading ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="text-center space-y-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-slate-600 text-sm font-semibold">Memuat bank soal offline...</p>
          </div>
        </div>
      ) : questions.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 text-center space-y-4 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
              <AlertCircle className="w-7 h-7" />
            </div>
            <div className="space-y-1.5">
              <span className="px-3 py-1 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
                Bank Soal Belum Tersedia
              </span>
              <h2 className="text-xl font-bold text-slate-900">Belum Ada Soal Latihan</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Mata pelajaran <strong>{getSubjectDisplayName(mapelUpper, true)}</strong> belum memiliki butir soal latihan aktif di sistem.{" "}
                <strong className="text-slate-800">Belum ada soal, silakan hubungi tim Persiapan TKA Sekolah.</strong>
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <Link
                href="/latihan"
                className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all text-center"
              >
                Kembali ke Beranda Latihan
              </Link>
              <Link
                href={`/latihan/${mapelParam}`}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all text-center"
              >
                Kembali ke Detail Mata Pelajaran
              </Link>
            </div>
          </div>
        </div>
      ) : (
        /* Main Quiz Area */
        <main className="max-w-5xl mx-auto px-4 py-6 flex-1 w-full grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left / Center: Question & Options (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            {/* Question Meta Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-blue-600 text-white font-extrabold text-sm flex items-center justify-center">
                  {currentIndex + 1}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  dari {questions.length} Soal
                </span>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg">
                {currentQ?.tipeSoal === "PILIHAN_GANDA"
                  ? "Pilihan Ganda"
                  : currentQ?.tipeSoal === "MCMA"
                  ? "MCMA (Multi Pilihan)"
                  : "PGK Kategori"}
              </span>
            </div>

            {/* Question Text with KaTeX */}
            <div className="text-slate-900 text-base font-medium leading-relaxed">
              <MathRenderer content={currentQ?.pertanyaan || ""} />
            </div>

            {/* Question Options by Type */}
            {currentQ?.tipeSoal === "PILIHAN_GANDA" && parsedOptions && (
              <PilihanGandaView
                soalId={currentQ.id}
                options={parsedOptions}
                selectedOption={answers[currentQ.id] || null}
                onSelect={handleSelectPg}
                isSubmitted={isCurrentSubmitted}
                correctOption={isCurrentSubmitted ? currentQ.kunciJawaban : undefined}
              />
            )}

            {currentQ?.tipeSoal === "MCMA" && parsedOptions && (
              <McmaView
                soalId={currentQ.id}
                options={parsedOptions}
                selectedOptions={answers[currentQ.id] || []}
                onToggle={handleToggleMcma}
                isSubmitted={isCurrentSubmitted}
                correctOptions={
                  isCurrentSubmitted
                    ? typeof currentQ.kunciJawaban === "string"
                      ? JSON.parse(currentQ.kunciJawaban)
                      : currentQ.kunciJawaban
                    : []
                }
              />
            )}

            {currentQ?.tipeSoal === "PGK_KATEGORI" && parsedOptions && (
              <PgkKategoriView
                soalId={currentQ.id}
                payload={parsedOptions}
                userChoices={answers[currentQ.id] || []}
                onSelectCategory={handleSelectPgkCategory}
                isSubmitted={isCurrentSubmitted}
                expectedAnswers={
                  isCurrentSubmitted
                    ? typeof currentQ.kunciJawaban === "string"
                      ? JSON.parse(currentQ.kunciJawaban)
                      : currentQ.kunciJawaban
                    : []
                }
              />
            )}

            {/* Action Bar (Check Answer / Next) */}
            <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                disabled={answers[currentQ?.id] === undefined || isCurrentSubmitted}
                onClick={handleCheckAnswer}
                className="py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-xl transition-all flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                <HelpCircle className="w-4 h-4 text-indigo-600" />
                <span>Periksa Jawaban & Pembahasan</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold text-xs disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  disabled={currentIndex === questions.length - 1}
                  onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                  className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Berikutnya</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Full Explanation Card (Shown when checked) */}
            {isCurrentSubmitted && currentQ?.pembahasan && (
              <div className="mt-6 p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Kunci & Pembahasan Langkah Demi Langkah</span>
                </div>
                <div className="text-xs text-slate-800 leading-relaxed font-normal">
                  <MathRenderer content={currentQ.pembahasan} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Sidebar: Number Palette (4 cols) */}
        <div className="lg:col-span-4 space-y-5">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Navigasi Nomor Soal</h3>

            <div className="grid grid-cols-5 gap-2">
              {questions.map((q, idx) => {
                const isAnswered = answers[q.id] !== undefined;
                const ev = evaluations[q.id];
                const isCurrent = currentIndex === idx;

                let btnClass = "border-slate-200 bg-white text-slate-700 hover:border-blue-300";

                if (isCurrent) {
                  btnClass = "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20";
                } else if (ev?.isSubmitted) {
                  btnClass = ev.isBenar
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-rose-400 bg-rose-50 text-rose-700";
                } else if (isAnswered) {
                  btnClass = "border-indigo-400 bg-indigo-50 text-indigo-800 font-bold";
                }

                return (
                  <button
                    key={q.id}
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-xl border font-bold text-xs transition-all flex items-center justify-center cursor-pointer ${btnClass}`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div className="pt-4 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-600" />
                <span>Soal Aktif</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-indigo-100 border border-indigo-300" />
                <span>Sudah Dijawab</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-400" />
                <span>Jawaban Benar</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-rose-100 border border-rose-400" />
                <span>Jawaban Salah</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      )}

      {/* Result Dialog Modal */}
      {isFinished && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 text-center space-y-6 shadow-2xl border border-slate-100 animate-in fade-in zoom-in duration-200">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-200 text-amber-950 flex items-center justify-center mx-auto shadow-lg shadow-amber-400/30">
              <Award className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-extrabold text-slate-900">Latihan Selesai!</h2>
              <p className="text-xs text-slate-500">
                Kerja bagus! Anda telah menyelesaikan latihan {mapelUpper}.
              </p>
            </div>

            {/* Score Box */}
            {(() => {
              const total = questions.length;
              const answeredCount = Object.keys(answers).length;
              const correctCount = Object.values(evaluations).filter((e) => e.isBenar).length;
              const calculatedAccuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;

              return (
                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-slate-800">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Akurasi</span>
                    <span className="text-xl font-extrabold text-blue-600">{calculatedAccuracy}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Benar</span>
                    <span className="text-xl font-extrabold text-emerald-600">
                      {correctCount}/{total}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Waktu</span>
                    <span className="text-xl font-extrabold text-slate-700">{formatTime(secondsSpent)}</span>
                  </div>
                </div>
              );
            })()}

            {/* Sync Notification */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-center gap-2 font-medium">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{syncStatusMsg}</span>
            </div>

            <div className="flex flex-col gap-2">
              <Link
                href={`/latihan/${mapelParam}`}
                className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all text-center"
              >
                Kembali ke Detail Mata Pelajaran
              </Link>
              <Link
                href="/latihan"
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all text-center"
              >
                Kembali ke Menu Latihan
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

