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

export default function MonitoringProgresPage() {
  const { data: session } = useSession();
  const userRole = (session?.user as any)?.role;
  const userMapel = (session?.user as any)?.mapel;

  const [loading, setLoading] = useState(true);
  const [selectedMapel, setSelectedMapel] = useState("ALL");
  const [selectedKelas, setSelectedKelas] = useState("ALL");
  const [classes, setClasses] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<any>(null);

  // Pagination (10 items per page)
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (userRole === "GURU" && userMapel) {
      setSelectedMapel(userMapel);
    }
  }, [userRole, userMapel]);

  const loadClasses = async () => {
    try {
      const res = await fetch("/api/admin/kelas");
      const json = await res.json();
      if (json.success) {
        setClasses(json.classes);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadProgress = async () => {
    setLoading(true);
    try {
      const mapelParam = userRole === "GURU" ? userMapel : selectedMapel;
      const queryParts = [];
      if (mapelParam && mapelParam !== "ALL") queryParts.push(`mapel=${mapelParam}`);
      if (selectedKelas !== "ALL") queryParts.push(`kelas=${encodeURIComponent(selectedKelas)}`);
      const url = queryParts.length > 0 ? `/api/admin/progres?${queryParts.join("&")}` : `/api/admin/progres`;

      const res = await fetch(url);
      const json = await res.json();
      if (json.success) {
        setData(json);
        setCurrentPage(1); // Reset page on filter
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClasses();
  }, []);

  useEffect(() => {
    loadProgress();
  }, [selectedMapel, selectedKelas, userRole, userMapel]);

  const students = data?.students || [];
  const filteredStudents = students.filter((s: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.nama.toLowerCase().includes(term) ||
      s.nis.toLowerCase().includes(term) ||
      (s.namaKelas && s.namaKelas.toLowerCase().includes(term)) ||
      s.industri.toLowerCase().includes(term)
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
              ? `Mata Pelajaran: ${userMapel}. Pantau capaian latihan, skor rata-rata, dan deteksi rombel dengan progres lambat untuk percepatan bimbingan.`
              : "Pantau intensitas latihan mandiri dan komparasi ketuntasan materi siswa antar rombel kelas."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadProgress}
            className="p-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan</span>
          </button>
        </div>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Siswa Aktif Berlatih</span>
          <div className="text-2xl font-black text-slate-900">
            {data?.summary?.uniqueStudents || 0} Siswa
          </div>
          <p className="text-[11px] text-slate-500">Telah menyinkronkan hasil latihan</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Soal Dikerjakan</span>
          <div className="text-2xl font-black text-blue-900">
            {data?.summary?.totalSubmissions || 0} Kali
          </div>
          <p className="text-[11px] text-slate-500">Akumulasi seluruh sesi offline/online</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Rata-Rata Akurasi Benar</span>
          <div className="text-2xl font-black text-emerald-900">
            {data?.summary?.overallAccuracy || 0}%
          </div>
          <p className="text-[11px] text-slate-500">Persentase jawaban tepat</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Siswa Tuntas (≥ 75)</span>
          <div className="text-2xl font-black text-purple-900">
            {data?.summary?.scoreHigh || 0} Siswa
          </div>
          <p className="text-[11px] text-slate-500">Mencapai ambang kelulusan standar</p>
        </div>
      </div>

      {/* Komparasi Progres & Deteksi Progres Lambat per Kelas (PENTING untuk Sekolah) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <School className="w-4 h-4 text-blue-600" />
              <span>Komparasi Capaian & Deteksi Progres Latihan per Rombel</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Rombel dengan rata-rata skor rendah (&lt; 55) ditandai sebagai progres lambat agar segera mendapat bimbingan intensif dari guru.
            </p>
          </div>
          <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full self-start sm:self-auto">
            {data?.classProgressSummary?.length || 0} Rombel Terdeteksi
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="py-3 px-4">Nama Kelas</th>
                <th className="py-3 px-4 text-center">Siswa Aktif</th>
                <th className="py-3 px-4 text-center">Total Pengerjaan</th>
                <th className="py-3 px-4 text-center">Rata-Rata Skor</th>
                <th className="py-3 px-4 text-center">Status Progres</th>
                <th className="py-3 px-4 text-center">Aksi Filter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {(!data?.classProgressSummary || data.classProgressSummary.length === 0) ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Belum ada rekaman latihan untuk komparasi kelas.
                  </td>
                </tr>
              ) : (
                data.classProgressSummary.map((cls: any) => (
                  <tr key={cls.namaKelas} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {cls.namaKelas}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-slate-800">
                      {cls.totalSiswaAktif} Siswa
                    </td>
                    <td className="py-3 px-4 text-center font-bold text-blue-600">
                      {cls.totalPengerjaan} Butir
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="font-extrabold text-sm text-slate-900">{cls.avgScore}</span>
                      <span className="text-[10px] text-slate-400">/100</span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {cls.status === "BAIK" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Progres Baik</span>
                        </span>
                      ) : cls.status === "CUKUP" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                          <span>Cukup</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 text-rose-800 animate-pulse">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Progres Lambat (Bimbingan)</span>
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          setSelectedKelas(cls.namaKelas);
                          const el = document.getElementById("tabel-progres-siswa");
                          if (el) el.scrollIntoView({ behavior: "smooth" });
                        }}
                        className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center gap-1 mx-auto transition-all cursor-pointer"
                      >
                        <span>Filter Rombel Ini</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))
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
            <span className="text-[11px] text-slate-400 font-semibold">Berdasarkan Rata-Rata</span>
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
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>Rata-Rata Skor per Materi Pokok</span>
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold">Skala 0 - 100</span>
          </div>

          <div className="h-64 w-full">
            {data?.topicChartData?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.topicChartData} margin={{ top: 10, right: 20, left: -20, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="topik" tick={{ fontSize: 10 }} interval={0} angle={-15} textAnchor="end" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(val, name, item: any) => [`${val} Poin`, item.payload.fullTopik]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontSize: "12px" }}
                  />
                  <Bar dataKey="avgScore" name="Rata-rata Skor" fill="#004ac6" radius={[6, 6, 0, 0]} />
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

      {/* Student Progress Detail Table with Pagination */}
      <div id="tabel-progres-siswa" className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari siswa, kelas, atau industri..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
            {/* Filter Kelas */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <School className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedKelas}
                onChange={(e) => setSelectedKelas(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white cursor-pointer"
              >
                <option value="ALL">Semua Kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.nama}>
                    {c.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Mapel */}
            {userRole === "GURU" ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-800 rounded-xl text-xs font-bold">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                <span>Mapel: {userMapel}</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedMapel}
                  onChange={(e) => setSelectedMapel(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white cursor-pointer"
                >
                  <option value="ALL">Semua Mapel</option>
                  <option value="MATEMATIKA">Matematika</option>
                  <option value="BAHASA_INDONESIA">Bahasa Indonesia</option>
                  <option value="BAHASA_INGGRIS">Bahasa Inggris</option>
                  <option value="PPLG">Kejuruan PPLG</option>
                  <option value="AIJ">Kejuruan AIJ</option>
                </select>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-extrabold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="px-4 py-3.5 w-12 text-center">No</th>
                <th className="px-4 py-3.5">NIS & Nama Siswa</th>
                <th className="px-4 py-3.5">Kelas</th>
                <th className="px-4 py-3.5">Industri PKL</th>
                <th className="px-4 py-3.5 text-center">Soal Dikerjakan</th>
                <th className="px-4 py-3.5 text-center">Rata-Rata Skor</th>
                <th className="px-4 py-3.5">Status Capaian</th>
                <th className="px-4 py-3.5 text-right">Sinkronisasi Terakhir</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Memuat data progres...
                  </td>
                </tr>
              ) : paginatedStudents.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-slate-400">
                    Belum ada rekaman latihan siswa yang sesuai.
                  </td>
                </tr>
              ) : (
                paginatedStudents.map((st: any, idx: number) => (
                  <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3 text-center text-slate-400 font-mono">
                      {startIndex + idx + 1}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{st.nama}</div>
                      <div className="text-[11px] text-slate-400 font-mono">NIS: {st.nis}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-blue-50 text-blue-800 border border-blue-200">
                        {st.namaKelas || "Tanpa Kelas"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[170px]">{st.industri}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-slate-800">
                      {st.totalPengerjaan} butir
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-black text-sm text-slate-900">{st.avgScore}</span>
                      <span className="text-[10px] text-slate-400">/100</span>
                    </td>
                    <td className="px-4 py-3">
                      {st.status === "Tuntas" && (
                        <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-bold text-[11px] rounded-full border border-emerald-200">
                          TUNTAS
                        </span>
                      )}
                      {st.status === "Cukup" && (
                        <span className="px-2.5 py-1 bg-amber-50 text-amber-700 font-bold text-[11px] rounded-full border border-amber-200">
                          CUKUP
                        </span>
                      )}
                      {st.status === "Perlu Bimbingan" && (
                        <span className="px-2.5 py-1 bg-rose-50 text-rose-700 font-bold text-[11px] rounded-full border border-rose-200">
                          PERLU BIMBINGAN
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-500 font-mono text-[11px]">
                      {new Date(st.lastSync).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Standard Pagination (10 data per page) */}
        <div className="p-4 bg-slate-50/70 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Menampilkan <span className="font-bold text-slate-800">{totalFiltered > 0 ? startIndex + 1 : 0}</span> s.d.{" "}
            <span className="font-bold text-slate-800">{endIndex}</span> dari{" "}
            <span className="font-bold text-slate-800">{totalFiltered}</span> siswa
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
                if (pg === 1 || pg === totalPages || (pg >= currentPage - 1 && pg <= currentPage + 1)) {
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
  );
}
