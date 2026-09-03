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
  const [searchTerm, setSearchTerm] = useState("");
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (userRole === "GURU" && userMapel) {
      setSelectedMapel(userMapel);
    }
  }, [userRole, userMapel]);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const mapelParam = userRole === "GURU" ? userMapel : selectedMapel;
      const res = await fetch(`/api/admin/progres?mapel=${mapelParam}`);
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

  useEffect(() => {
    loadProgress();
  }, [selectedMapel, userRole, userMapel]);

  const students = data?.students || [];
  const filteredStudents = students.filter((s: any) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      s.nama.toLowerCase().includes(term) ||
      s.nis.toLowerCase().includes(term) ||
      s.industri.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-full text-xs font-bold mb-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Monitoring Kesiapan TKA</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">
            Monitoring Progres & Capaian Latihan Siswa
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {userRole === "GURU"
              ? `Mata Pelajaran: ${userMapel}. Pantau capaian latihan, skor rata-rata, dan ketuntasan materi siswa untuk mapel Anda.`
              : "Pantau intensitas latihan mandiri dan ketuntasan capaian asesmen siswa secara berkala."}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Siswa Aktif Berlatih</span>
          <div className="text-2xl font-black text-slate-900">
            {data?.summary?.uniqueStudents || 0} Siswa
          </div>
          <p className="text-[11px] text-slate-500">Telah menyinkronkan hasil latihan</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Total Soal Dikerjakan</span>
          <div className="text-2xl font-black text-blue-900">
            {data?.summary?.totalSubmissions || 0} Kali
          </div>
          <p className="text-[11px] text-slate-500">Akumulasi seluruh sesi offline</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Rata-Rata Akurasi Benar</span>
          <div className="text-2xl font-black text-emerald-900">
            {data?.summary?.overallAccuracy || 0}%
          </div>
          <p className="text-[11px] text-slate-500">Persentase jawaban tepat</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <span className="text-[11px] font-bold text-slate-400 uppercase">Siswa Tuntas (≥ 75)</span>
          <div className="text-2xl font-black text-purple-900">
            {data?.summary?.scoreHigh || 0} Siswa
          </div>
          <p className="text-[11px] text-slate-500">Mencapai ambang kelulusan standar</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
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

        <div className="lg:col-span-7 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3">
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

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari siswa atau industri PKL..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {userRole === "GURU" ? (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-800 rounded-xl text-xs font-bold">
              <GraduationCap className="w-4 h-4 text-blue-600" />
              <span>Mapel Anda: {userMapel}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedMapel}
                onChange={(e) => setSelectedMapel(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
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

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200 text-[10px]">
              <tr>
                <th className="px-4 py-3.5">NIS & Nama Siswa</th>
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
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Memuat data progres...
                  </td>
                </tr>
              ) : filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                    Belum ada rekaman latihan siswa yang sesuai.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st: any) => (
                  <tr key={st.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{st.nama}</div>
                      <div className="text-[11px] text-slate-400 font-mono">NIS: {st.nis}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate max-w-[180px]">{st.industri}</span>
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
      </div>
    </div>
  );
}
