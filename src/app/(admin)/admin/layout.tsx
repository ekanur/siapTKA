"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  BarChart3,
  Sparkles,
  CheckSquare,
  BookMarked,
  Users,
  FileSpreadsheet,
  LogOut,
  Menu,
  X,
  GraduationCap,
  ShieldCheck,
  Layers,
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const navItems = [
    {
      name: "Dashboard Utama",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
    },
    {
      name: "Analisis Butir Soal (% Benar/Salah)",
      href: "/admin/analisis-soal",
      icon: BarChart3,
      badge: "Diagnostik",
    },
    {
      name: "Generator Soal AI (Gemini)",
      href: "/admin/generator-soal",
      icon: Sparkles,
      badge: "AI 5-Pilar",
    },
    {
      name: "Validasi Bank Soal",
      href: "/admin/validasi-soal",
      icon: CheckSquare,
    },
    {
      name: "5 Pilar Kisi-Kisi TKA",
      href: "/admin/kisi-kisi",
      icon: BookMarked,
    },
    {
      name: "Daftar Siswa & Industri PKL",
      href: "/admin/siswa",
      icon: Users,
    },
    {
      name: "Rekap Konfirmasi TKA",
      href: "/admin/rekap-tka",
      icon: FileSpreadsheet,
      badge: "Ekspor",
    },
  ];

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
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center font-extrabold text-white text-lg shadow-lg shadow-blue-500/25">
                T
              </div>
              <div>
                <h1 className="font-extrabold text-lg text-white leading-tight">siapTKA</h1>
                <p className="text-[11px] text-cyan-400 font-bold uppercase tracking-wider">
                  Panel Guru & Sekolah
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-180px)]">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/60"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        isActive ? "bg-white/20 text-white" : "bg-slate-800 text-cyan-400 border border-cyan-500/20"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* User Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5 overflow-hidden">
              <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-cyan-400 font-bold text-xs shrink-0">
                G
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-white truncate">
                  {session?.user?.name || "Guru Pembimbing"}
                </p>
                <p className="text-[10px] text-slate-400 truncate">
                  {session?.user?.email || "guru@sekolah.sch.id"}
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
            <span className="font-extrabold text-slate-900 text-base">siapTKA Admin</span>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}