"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, notFound } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  BarChart3,
  Sparkles,
  CheckSquare,
  Users,
  FileSpreadsheet,
  LogOut,
  Menu,
  X,
  Clock,
  TrendingUp,
  ShieldCheck,
  GraduationCap,
} from "lucide-react";
import { getSubjectDisplayName } from "@/lib/constants/subjects";

const ADMIN_ONLY_ROUTES = [
  "/admin/pengguna",
  "/admin/siswa",
  "/admin/lini-masa",
  "/admin/rekap-tka",
  "/admin/generator-soal",
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session, status: authStatus } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const userRole = (session?.user as any)?.role;
  const userMapel = (session?.user as any)?.mapel || null;

  const isAdminOnlyRoute = ADMIN_ONLY_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(route + "/")
  );

  if (authStatus === "loading") {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xs font-semibold text-slate-400">Memverifikasi hak akses...</p>
        </div>
      </div>
    );
  }

  // If user is a GURU attempting to access an Admin-Only route, display 404 Not Found
  if (userRole === "GURU" && isAdminOnlyRoute) {
    notFound();
  }

  // If user is unauthenticated or has SISWA role, display 404 Not Found
  if (authStatus === "unauthenticated" || userRole === "SISWA") {
    notFound();
  }

  const adminNavItems = [
    {
      name: "Dashboard Utama",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Lini Masa Konfirmasi",
      href: "/admin/lini-masa",
      icon: Clock,
    },
    {
      name: "Monitoring Konfirmasi",
      href: "/admin/rekap-tka",
      icon: FileSpreadsheet,
    },
    {
      name: "Generator Soal AI",
      href: "/admin/generator-soal",
      icon: Sparkles,
    },
    {
      name: "Validasi & Input Soal",
      href: "/admin/validasi-soal",
      icon: CheckSquare,
    },
    {
      name: "Analisis Butir Soal",
      href: "/admin/analisis-soal",
      icon: BarChart3,
    },
    {
      name: "Monitoring Progres",
      href: "/admin/monitoring-progres",
      icon: TrendingUp,
    },
    {
      name: "Master Data Siswa",
      href: "/admin/siswa",
      icon: Users,
    },
    {
      name: "Master Staf & Guru",
      href: "/admin/pengguna",
      icon: ShieldCheck,
    },
  ];

  const guruNavItems = [
    {
      name: "Dashboard Guru",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Validasi & Input Soal",
      href: "/admin/validasi-soal",
      icon: CheckSquare,
    },
    {
      name: "Analisis Butir Soal",
      href: "/admin/analisis-soal",
      icon: BarChart3,
    },
    {
      name: "Monitoring Progres Siswa",
      href: "/admin/monitoring-progres",
      icon: TrendingUp,
    },
  ];

  const navItems = userRole === "GURU" ? guruNavItems : adminNavItems;

  return (
    <div className="min-h-screen bg-slate-100 flex">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 h-screen w-72 bg-slate-900 text-white flex flex-col justify-between transition-transform duration-200 ease-in-out border-r border-slate-800 ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div>
          {/* Logo */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="relative w-9 h-9 shrink-0 flex items-center justify-center">
                <Image
                  src="/logo/icon-only.png"
                  alt="Logo Simbol SiapTKA"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <div className="min-w-0">
                <div className="bg-white/95 rounded-lg px-2 py-0.5 inline-block shadow-sm">
                  <Image
                    src="/logo/horizontal.png"
                    alt="siapTKA"
                    width={110}
                    height={28}
                    className="h-5 w-auto object-contain"
                    priority
                  />
                </div>
                <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mt-1 truncate">
                  {userRole === "GURU" ? `Guru: ${getSubjectDisplayName(userMapel, true)}` : "Portal Administrator"}
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white shrink-0 p-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Teacher Badge if applicable */}
          {userRole === "GURU" && (
            <div className="mx-4 mt-3 px-3 py-2 rounded-xl bg-blue-950/60 border border-blue-800/60 flex items-center gap-2 text-xs text-blue-300">
              <GraduationCap className="w-4 h-4 text-cyan-400 shrink-0" />
              <span className="font-medium truncate">Mata Pelajaran: <strong>{getSubjectDisplayName(userMapel)}</strong></span>
            </div>
          )}

          {/* Navigation Links */}
          <nav className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-210px)]">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 font-bold text-xs shrink-0">
                {userRole === "ADMIN" ? "A" : "G"}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">
                  {session?.user?.name || "Pengguna"}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {session?.user?.email || "admin@sekolah.sch.id"}
                </p>
              </div>
            </div>

            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar on Mobile */}
        <header className="lg:hidden bg-white border-b border-slate-200 p-4 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 rounded-xl border border-slate-200 text-slate-700"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <Image
                src="/logo/icon-only.png"
                alt="Logo Simbol SiapTKA"
                width={26}
                height={26}
                className="w-6 h-6 object-contain"
              />
              <Image
                src="/logo/horizontal.png"
                alt="siapTKA"
                width={95}
                height={24}
                className="h-5 w-auto object-contain"
              />
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}