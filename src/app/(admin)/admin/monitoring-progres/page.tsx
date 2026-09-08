"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  TrendingUp,
  Award,
  Users,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  PieChart as PieChartIcon,
  BarChart3,
  Building2,
  Clock,
  GraduationCap,
  School,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  ArrowLeft,
  Eye,
  X,
  BookOpen,
  Check,
  Flame,
  Minus,
  Calendar,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
} from "recharts";
import {
  getSubjectDisplayName,
  MAPEL_WAJIB,
  MAPEL_PILIHAN_GROUPS,
} from "@/lib/constants/subjects";

export default function MonitoringProgresPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const userMapel = (session?.user as any)?.mapel;

  const [loading, setLoading] = useState(true);
  const [selectedMapel, setSelectedMapel] = useState("ALL");
  const [data, setData] = useState<any>(null);

  // Level 2 Drill-Down State: Selected Class for student progress detail
  const [selectedClassDetail, setSelectedClassDetail] = useState<any | null>(null);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [classStudentsLoading, setClassStudentsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Level 3 Modal: Selected Student for individual subject progress breakdown
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  // Pagination (10 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (userRole === "GURU" && userMapel) {
      setSelectedMapel(userMapel);
    }
  }, [userRole, userMapel]);

  // Load Macro Progress & Class Comparison (Level 1)
  const loadGlobalProgress = async () => {
    setLoading(true);
    try {
      const mapelParam = userRole === "GURU" ? userMapel : selectedMapel;
      let url = `/api/admin/progres?kelas=ALL`;
      if (mapelParam && mapelParam !== "ALL") url += `&mapel=${mapelParam}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setData(json);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load Student Progress for Specific Class (Level 2)
  const loadClassStudentProgress = async (className: string) => {
    setClassStudentsLoading(true);
    try {
      const mapelParam = userRole === "GURU" ? userMapel : selectedMapel;
      let url = `/api/admin/progres?kelas=${encodeURIComponent(className)}`;
      if (mapelParam && mapelParam !== "ALL") url += `&mapel=${mapelParam}`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setClassStudents(json.students || []);
        setCurrentPage(1);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setClassStudentsLoading(false);
    }
  };

  useEffect(() => {
    loadGlobalProgress();
  }, [selectedMapel, userRole, userMapel]);

  useEffect(() => {
    if (selectedClassDetail) {
      loadClassStudentProgress(selectedClassDetail.namaKelas);
    }
  }, [selectedClassDetail, selectedMapel]);

  const handleSelectClass = (cls: any) => {
    setSelectedClassDetail(cls);
    setSearchTerm("");
    setCurrentPage(1);
  };

  const handleBackToClasses = () => {
    setSelectedClassDetail(null);
    setClassStudents([]);
    loadGlobalProgress();
  };

  // Filter students in Level 2
  const filteredStudents = classStudents.filter((s: any) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.nama.toLowerCase().includes(term) ||
      s.nis.toLowerCase().includes(term) ||
      (s.industri && s.industri.toLowerCase().includes(term))
    );
  });

  // Pagination Calculations
  const totalFiltered = filteredStudents.length;
  const totalPages = Math.ceil(totalFiltered / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalFiltered);
  const paginatedStudents = filteredStudents.slice(startIndex, endIndex);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Monitoring Kesiapan & Progres TKA</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Monitoring Progres & Capaian Latihan Berbasis Kelas
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {userRole === "GURU"
              ? `Mata Pelajaran: ${getSubjectDisplayName(userMapel)}. Menampilkan daftar rombel kelas yang memiliki siswa yang memilih mata pelajaran ini pada Onboarding TKA.`
              : selectedMapel !== "ALL"
              ? `Mata Pelajaran: ${getSubjectDisplayName(selectedMapel)}. Menampilkan rombel kelas yang siswanya mengambil mata pelajaran ini.`
              : "Pantau intensitas latihan mandiri per rombel kelas terlebih dahulu, lalu buka detail capaian siswa per rombel."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {userRole === "ADMIN" && (
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-slate-200 shadow-2xs">
              <span className="text-xs font-bold text-slate-500 whitespace-nowrap">Filter Mapel:</span>
              <select
                value={selectedMapel}
                onChange={(e) => {
                  setSelectedMapel(e.target.value);
                  setSelectedClassDetail(null);
                }}
                className="bg-transparent text-xs font-bold text-slate-800 focus:outline-hidden cursor-pointer"
              >
                <option value="ALL">Semua Mata Pelajaran (Komparasi Global)</option>
                <optgroup label="Mata Pelajaran Wajib TKA (Semua Kelas)">
                  {MAPEL_WAJIB.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
                {MAPEL_PILIHAN_GROUPS.map((g) => (
                  <optgroup key={g.groupName} label={g.groupName}>
                    {g.subjects.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
          )}

          {userRole === "GURU" && userMapel && (
            <div className="inline-flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 text-blue-800 rounded-2xl text-xs font-bold shadow-2xs">
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Mapel: <strong>{getSubjectDisplayName(userMapel)}</strong></span>
            </div>
          )}

          <button
            onClick={() => {
              if (selectedClassDetail) {
                loadClassStudentProgress(selectedClassDetail.namaKelas);
              } else {
                loadGlobalProgress();
              }
            }}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading || classStudentsLoading ? "animate-spin" : ""}`}
            />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* LEVEL 1: KOMPARASI KELAS & CHARTS (Default View) */}
      {/* ========================================================================= */}
      {!selectedClassDetail ? (
        <div className="space-y-6">
          {/* KPI Counters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">
                Siswa Aktif Berlatih
              </span>
              <div className="text-2xl font-black text-slate-900">
                {data?.summary?.uniqueStudents || 0} Siswa
              </div>
              <p className="text-[11px] text-slate-500">Telah menyinkronkan hasil latihan</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">
                Total Soal Dikerjakan
              </span>
              <div className="text-2xl font-black text-blue-900">
                {data?.summary?.totalSubmissions || 0} Kali
              </div>
              <p className="text-[11px] text-slate-500">Akumulasi seluruh sesi offline/online</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-slate-400 uppercase">
                Rata-Rata Akurasi Benar
              </span>
              <div className="text-2xl font-black text-emerald-900">
                {data?.summary?.overallAccuracy || 0}%
              </div>
              <p className="text-[11px] text-slate-500">Persentase jawaban tepat</p>
            </div>

            <div className="bg-emerald-50/70 p-5 rounded-3xl border border-emerald-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold text-emerald-800 uppercase">
                Progres Bagus (76-100%)
              </span>
              <div className="text-2xl font-black text-emerald-900">
                {data?.summary?.scoreBagus ?? data?.summary?.scoreHigh ?? 0} Siswa
              </div>
              <p className="text-[11px] text-emerald-700">Mencapai ambang capaian optimal</p>
            </div>
          </div>

          {/* Komparasi Progres & Deteksi Progres Lambat per Kelas Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <School className="w-4 h-4 text-blue-600" />
                  <span>Komparasi Capaian & Deteksi Progres Latihan per Rombel</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Status Progres: <strong>0-50% Progres Lambat</strong> •{" "}
                  <strong>51-75% Progres Cukup</strong> •{" "}
                  <strong>76-100% Progres Bagus</strong>. Klik baris kelas untuk membuka capaian
                  siswa yang mengambil mata pelajaran ini.
                </p>
              </div>
              <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
                {data?.classProgressSummary?.length || 0} Rombel Terdeteksi {userRole === "GURU" || selectedMapel !== "ALL" ? `(${getSubjectDisplayName(userRole === "GURU" ? userMapel : selectedMapel)})` : ""}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="py-3 px-4">Nama Kelas</th>
                    <th className="py-3 px-4 text-center">Siswa Mengambil Mapel</th>
                    <th className="py-3 px-4 text-center">Total Pengerjaan</th>
                    <th className="py-3 px-4 text-center">Rata-Rata Skor</th>
                    <th className="py-3 px-4 text-center">Status Progres</th>
                    <th className="py-3 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {!data?.classProgressSummary || data.classProgressSummary.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-400">
                        {userRole === "GURU" || selectedMapel !== "ALL"
                          ? `Tidak ditemukan rombel kelas yang memiliki siswa yang mengambil mata pelajaran ${getSubjectDisplayName(userRole === "GURU" ? userMapel : selectedMapel)} pada Onboarding TKA.`
                          : "Belum ada rekaman latihan untuk komparasi kelas."}
                      </td>
                    </tr>
                  ) : (
                    data.classProgressSummary.map((cls: any) => {
                      const score = Number(cls.avgScore) || 0;
                      const isBagus = score > 75;
                      const isCukup = score > 50 && score <= 75;
                      const isLambat = score <= 50;

                      return (
                        <tr
                          key={cls.namaKelas}
                          onClick={() => handleSelectClass(cls)}
                          className="hover:bg-blue-50/50 transition-colors cursor-pointer group"
                        >
                          <td className="py-3 px-4 font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {cls.namaKelas}
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-slate-800">
                            <div className="font-extrabold text-slate-900">
                              {cls.totalSiswa ?? cls.totalSiswaAktif} Siswa
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium">
                              {cls.totalSiswaAktif > 0
                                ? `${cls.totalSiswaAktif} aktif berlatih`
                                : "Belum ada pengerjaan"}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-blue-600">
                            {cls.totalPengerjaan} Butir
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-extrabold text-sm text-slate-900">{score}</span>
                            <span className="text-[10px] text-slate-400">/100</span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isBagus ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Progres Bagus</span>
                              </span>
                            ) : isCukup ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <Minus className="w-3 h-3" />
                                <span>Progres Cukup</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Progres Lambat</span>
                              </span>
                            )}
                          </td>
                          <td
                            className="py-3 px-4 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <button
                              onClick={() => handleSelectClass(cls)}
                              className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] flex items-center gap-1 mx-auto transition-all shadow-xs cursor-pointer"
                            >
                              <span>Buka Capaian Siswa</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Visual Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-blue-600" />
                  <span>Distribusi Capaian Skor Siswa</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-semibold">Skala Penilaian</span>
              </div>

              <div className="h-64 w-full">
                {data?.scoreDistributionChart && (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data.scoreDistributionChart}
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={85}
                        paddingAngle={4}
                        dataKey="value"
                      >
                        {data.scoreDistributionChart.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                        }}
                      />
                      <Legend
                        iconType="circle"
                        wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-600" />
                  <span>Rata-Rata Skor per Mata Pelajaran</span>
                </h3>
                <span className="text-[11px] text-slate-400 font-semibold">Akurasi %</span>
              </div>

              <div className="h-64 w-full">
                {data?.topicChartData?.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.topicChartData}
                      margin={{ top: 10, right: 20, left: -20, bottom: 25 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis
                        dataKey="topik"
                        tick={{ fontSize: 10 }}
                        interval={0}
                        angle={-15}
                        textAnchor="end"
                      />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(val, name, item: any) => [
                          `${val}%`,
                          item.payload.fullTopik || "Mapel",
                        ]}
                        contentStyle={{
                          borderRadius: "12px",
                          border: "1px solid #e2e8f0",
                          fontSize: "12px",
                        }}
                      />
                      <Bar
                        dataKey="avgScore"
                        name="Rata-rata Akurasi"
                        fill="#004ac6"
                        radius={[6, 6, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">
                    Belum ada data pengerjaan topik.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* LEVEL 2: RINCIAN CAPAIAN SISWA KELAS TERPILIH (Setelah Kelas Diklik) */
        /* ========================================================================= */
        <div className="space-y-5 animate-in fade-in duration-200">
          {/* Class Banner & Back Button */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <button
                onClick={handleBackToClasses}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors cursor-pointer mb-1"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Komparasi Rombel Kelas</span>
              </button>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-black text-slate-900">
                  Capaian Latihan Siswa: {selectedClassDetail.namaKelas}
                </h2>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 text-xs font-bold border border-blue-200">
                  Mapel: {getSubjectDisplayName(userRole === "GURU" ? userMapel : selectedMapel)}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-xs font-bold">
                  Rata-Rata Skor: {selectedClassDetail.avgScore}/100
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    selectedClassDetail.avgScore > 75
                      ? "bg-emerald-100 text-emerald-800"
                      : selectedClassDetail.avgScore > 50
                      ? "bg-amber-100 text-amber-800"
                      : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {selectedClassDetail.avgScore > 75
                    ? "Progres Bagus"
                    : selectedClassDetail.avgScore > 50
                    ? "Progres Cukup"
                    : "Progres Lambat"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-2 rounded-xl">
                {selectedClassDetail.totalSiswa ?? selectedClassDetail.totalSiswaAktif} Siswa Mengambil •{" "}
                {selectedClassDetail.totalPengerjaan} Butir Selesai
              </span>
            </div>
          </div>

          {/* Student Search Bar in Level 2 */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari nama, NIS, atau industri siswa..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="text-xs text-slate-500">
              Menampilkan <strong>{totalFiltered}</strong> siswa yang mengambil mata pelajaran{" "}
              <strong>{getSubjectDisplayName(userRole === "GURU" ? userMapel : selectedMapel)}</strong>{" "}
              di kelas {selectedClassDetail.namaKelas}
            </div>
          </div>

          {/* Student Progress Detail Table */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4 w-12 text-center">No</th>
                    <th className="py-3.5 px-4">Nama Siswa</th>
                    <th className="py-3.5 px-4">Industri PKL</th>
                    <th className="py-3.5 px-4 text-center">Mapel Pilihan TKA</th>
                    <th className="py-3.5 px-4 text-center">Soal Dikerjakan</th>
                    <th className="py-3.5 px-4">Rata-Rata Skor</th>
                    <th className="py-3.5 px-4 text-center">Status Kesiapan</th>
                    <th className="py-3.5 px-4 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                  {classStudentsLoading ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Memuat data capaian siswa kelas {selectedClassDetail.namaKelas}...
                      </td>
                    </tr>
                  ) : paginatedStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        Tidak ada siswa di kelas {selectedClassDetail.namaKelas} yang mengambil mata pelajaran {getSubjectDisplayName(userRole === "GURU" ? userMapel : selectedMapel)}.
                      </td>
                    </tr>
                  ) : (
                    paginatedStudents.map((s: any, idx: number) => {
                      const score = Number(s.avgScore) || 0;
                      const isBagus = score > 75;
                      const isCukup = score > 50 && score <= 75;
                      const isLambat = score <= 50;

                      return (
                        <tr key={s.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-4 text-center text-slate-400 font-mono">
                            {startIndex + idx + 1}
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-extrabold text-slate-900">{s.nama}</div>
                            <div className="text-[11px] text-slate-400 font-mono">NIS: {s.nis}</div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1.5 text-slate-600">
                              <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[170px]">
                                {s.industri || "Belum Ditentukan"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              {s.mapelPilihan1 ? (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold text-[10px] rounded-md border border-blue-100">
                                  {s.mapelPilihan1}
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">
                                  Belum Pilih
                                </span>
                              )}
                              {s.mapelPilihan2 && (
                                <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded-md border border-indigo-100">
                                  {s.mapelPilihan2}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className="font-bold text-slate-700">{s.totalPengerjaan}</span>
                            <span className="text-[10px] text-slate-400 block font-normal">
                              ({s.totalBenar} benar)
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    isBagus
                                      ? "bg-emerald-500"
                                      : isCukup
                                      ? "bg-amber-500"
                                      : "bg-rose-500"
                                  }`}
                                  style={{ width: `${score}%` }}
                                />
                              </div>
                              <span className="font-extrabold text-xs text-slate-800">{score}%</span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            {isBagus ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>Progres Bagus</span>
                              </span>
                            ) : isCukup ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                <Minus className="w-3 h-3" />
                                <span>Progres Cukup</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 border border-rose-200 animate-pulse">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Progres Lambat</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => setSelectedStudent(s)}
                              className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-[11px] flex items-center gap-1.5 mx-auto transition-all shadow-2xs cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-blue-600" />
                              <span>Lihat Progres</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Standard Pagination (10 data per page) */}
            <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
              <div>
                Menampilkan{" "}
                <span className="font-bold text-slate-800">
                  {totalFiltered > 0 ? startIndex + 1 : 0}
                </span>{" "}
                s.d. <span className="font-bold text-slate-800">{endIndex}</span> dari{" "}
                <span className="font-bold text-slate-800">{totalFiltered}</span> siswa di kelas{" "}
                {selectedClassDetail.namaKelas}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 font-semibold"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  <span>Sebelumnya</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
                    if (
                      pg === 1 ||
                      pg === totalPages ||
                      (pg >= currentPage - 1 && pg <= currentPage + 1)
                    ) {
                      return (
                        <button
                          key={pg}
                          onClick={() => setCurrentPage(pg)}
                          className={`w-7 h-7 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                            currentPage === pg
                              ? "bg-blue-600 text-white shadow-xs"
                              : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          {pg}
                        </button>
                      );
                    } else if (pg === currentPage - 2 || pg === currentPage + 2) {
                      return (
                        <span key={pg} className="px-1 text-slate-400">
                          ...
                        </span>
                      );
                    }
                    return null;
                  })}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 font-semibold"
                >
                  <span>Selanjutnya</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 3: MODAL DETAIL PROGRES LATIHAN PER SISWA */}
      {/* (Menampilkan Daftar Mata Pelajaran TKA Wajib & Pilihan serta Capaiannya) */}
      {/* ========================================================================= */}
      {selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/50">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black text-lg shadow-2xs">
                  <GraduationCap className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-black text-slate-900">{selectedStudent.nama}</h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        selectedStudent.avgScore > 75
                          ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                          : selectedStudent.avgScore > 50
                          ? "bg-amber-100 text-amber-800 border-amber-200"
                          : "bg-rose-100 text-rose-800 border-rose-200"
                      }`}
                    >
                      {selectedStudent.avgScore > 75
                        ? "🟢 Progres Bagus"
                        : selectedStudent.avgScore > 50
                        ? "🟡 Progres Cukup"
                        : "🔴 Progres Lambat"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    NIS: <strong>{selectedStudent.nis}</strong> • Kelas:{" "}
                    <strong>{selectedStudent.namaKelas}</strong> • PKL:{" "}
                    <strong>{selectedStudent.industri || "Belum Ditentukan"}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedStudent(null)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {/* Overall Performance Card */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Rata-Rata Skor</span>
                  <div className="text-xl font-black text-slate-900">{selectedStudent.avgScore}%</div>
                  <span className="text-[10px] text-slate-500">Skala 0-100</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Total Dikerjakan</span>
                  <div className="text-xl font-black text-blue-900">
                    {selectedStudent.totalPengerjaan}
                  </div>
                  <span className="text-[10px] text-slate-500">Butir Soal</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Jawaban Tepat</span>
                  <div className="text-xl font-black text-emerald-900">
                    {selectedStudent.totalBenar}
                  </div>
                  <span className="text-[10px] text-emerald-600 font-semibold">Benar</span>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Perlu Perbaikan</span>
                  <div className="text-xl font-black text-rose-900">
                    {selectedStudent.totalPengerjaan - selectedStudent.totalBenar}
                  </div>
                  <span className="text-[10px] text-rose-600 font-semibold">Salah / Meleset</span>
                </div>
              </div>

              {/* SECTION A: Mata Pelajaran TKA Wajib */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-blue-600" />
                    <span>Mata Pelajaran Wajib TKA (Otomatis Diujikan)</span>
                  </h4>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-100">
                    3 Mapel Nasional
                  </span>
                </div>

                <div className="space-y-2.5">
                  {(selectedStudent.subjectBreakdown || [])
                    .filter((sub: any) => sub.category === "WAJIB")
                    .map((sub: any) => (
                      <div
                        key={sub.id}
                        className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2.5 hover:border-slate-300 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-blue-600" />
                            <span className="font-extrabold text-slate-900 text-xs">{sub.name}</span>
                          </div>

                          <span
                            className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                              sub.status === "BAGUS"
                                ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                : sub.status === "CUKUP"
                                ? "bg-amber-100 text-amber-800 border-amber-200"
                                : sub.status === "LAMBAT"
                                ? "bg-rose-100 text-rose-800 border-rose-200"
                                : "bg-slate-100 text-slate-600 border-slate-200"
                            }`}
                          >
                            {sub.statusLabel}
                          </span>
                        </div>

                        {/* Progress Bar & Details */}
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                            <span>Akurasi: {sub.score}%</span>
                            <span>
                              {sub.totalPengerjaan} Butir ({sub.totalBenar} Benar, {sub.totalSalah}{" "}
                              Salah)
                            </span>
                          </div>
                          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                            <div
                              style={{ width: `${sub.score}%` }}
                              className={`h-full rounded-full transition-all duration-300 ${
                                sub.status === "BAGUS"
                                  ? "bg-emerald-500"
                                  : sub.status === "CUKUP"
                                  ? "bg-amber-500"
                                  : sub.totalPengerjaan === 0
                                  ? "bg-slate-300"
                                  : "bg-rose-500"
                              }`}
                            />
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-[10px] text-slate-400">
                          <span>Kategori: Wajib Nasional</span>
                          <span>
                            Terakhir Latihan:{" "}
                            {sub.lastSync
                              ? new Date(sub.lastSync).toLocaleDateString("id-ID")
                              : "Belum Dikerjakan"}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* SECTION B: Mata Pelajaran TKA Pilihan Siswa */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <Award className="w-4 h-4 text-purple-600" />
                    <span>Mata Pelajaran Pilihan TKA Siswa</span>
                  </h4>
                  <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                    Pilihan Akademik / Kejuruan
                  </span>
                </div>

                {(!selectedStudent.subjectBreakdown ||
                  selectedStudent.subjectBreakdown.filter((s: any) =>
                    s.category.startsWith("PILIHAN")
                  ).length === 0) ? (
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center text-xs text-slate-500">
                    Siswa ini belum memilih mata pelajaran pilihan TKA pada akunnya.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {selectedStudent.subjectBreakdown
                      .filter((sub: any) => sub.category.startsWith("PILIHAN"))
                      .map((sub: any) => (
                        <div
                          key={sub.id}
                          className="bg-white rounded-2xl border border-purple-200/80 p-4 shadow-2xs space-y-2.5 hover:border-purple-300 transition-colors"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-black text-[10px] rounded-md">
                                {sub.categoryLabel}
                              </span>
                              <span className="font-extrabold text-slate-900 text-xs">
                                {sub.name}
                              </span>
                            </div>

                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                                sub.status === "BAGUS"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-200"
                                  : sub.status === "CUKUP"
                                  ? "bg-amber-100 text-amber-800 border-amber-200"
                                  : sub.status === "LAMBAT"
                                  ? "bg-rose-100 text-rose-800 border-rose-200"
                                  : "bg-slate-100 text-slate-600 border-slate-200"
                              }`}
                            >
                              {sub.statusLabel}
                            </span>
                          </div>

                          {/* Progress Bar & Details */}
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-[11px] font-bold text-slate-600">
                              <span>Akurasi: {sub.score}%</span>
                              <span>
                                {sub.totalPengerjaan} Butir ({sub.totalBenar} Benar, {sub.totalSalah}{" "}
                                Salah)
                              </span>
                            </div>
                            <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden flex">
                              <div
                                style={{ width: `${sub.score}%` }}
                                className={`h-full rounded-full transition-all duration-300 ${
                                  sub.status === "BAGUS"
                                    ? "bg-emerald-500"
                                    : sub.status === "CUKUP"
                                    ? "bg-amber-500"
                                    : sub.totalPengerjaan === 0
                                    ? "bg-slate-300"
                                    : "bg-rose-500"
                                }`}
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-[10px] text-slate-400">
                            <span>Status: Terdaftar pada Profil Siswa</span>
                            <span>
                              Terakhir Latihan:{" "}
                              {sub.lastSync
                                ? new Date(sub.lastSync).toLocaleDateString("id-ID")
                                : "Belum Dikerjakan"}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="text-xs text-slate-500">
                Data sinkronisasi latihan mandiri TKA siswa
              </div>
              <button
                onClick={() => setSelectedStudent(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs"
              >
                Tutup Rincian
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
