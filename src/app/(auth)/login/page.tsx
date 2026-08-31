"use client";

import React, { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  WifiOff,
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");

  const [activeTab, setActiveTab] = useState<"SISWA" | "GURU">("SISWA");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(
    errorParam === "EmailBelumTerdaftar"
      ? "Email Google Workspace Anda belum terdaftar dalam basis data 72 siswa SIJA sekolah. Silakan hubungi guru pembimbing."
      : ""
  );

  const handleGoogleLogin = () => {
    setIsLoading(true);
    signIn("google", { callbackUrl: "/onboarding-tka" });
  };

  const handleGuruLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage("");

    try {
      const res = await signIn("credentials", {
        redirect: false,
        emailOrUsername: username,
        password: password,
        isDemoStudent: "false",
      });

      if (res?.error) {
        setErrorMessage("Username atau password guru/admin salah.");
      } else {
        router.push("/admin/dashboard");
      }
    } catch {
      setErrorMessage("Terjadi gangguan koneksi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickDemoLogin = async (demoType: "SISWA_KALIMANTAN" | "GURU_MTK" | "GURU_PPLG" | "ADMIN") => {
    setIsLoading(true);
    setErrorMessage("");

    if (demoType === "SISWA_KALIMANTAN") {
      const res = await signIn("credentials", {
        redirect: false,
        emailOrUsername: "22231001",
        isDemoStudent: "true",
      });
      if (res?.ok) router.push("/latihan");
    } else if (demoType === "GURU_MTK") {
      const res = await signIn("credentials", {
        redirect: false,
        emailOrUsername: "guru_matematika",
        password: "gurumatematika2026",
      });
      if (res?.ok) router.push("/admin/dashboard");
    } else if (demoType === "GURU_PPLG") {
      const res = await signIn("credentials", {
        redirect: false,
        emailOrUsername: "guru_pplg",
        password: "gurupplg2026",
      });
      if (res?.ok) router.push("/admin/dashboard");
    } else if (demoType === "ADMIN") {
      const res = await signIn("credentials", {
        redirect: false,
        emailOrUsername: "admin",
        password: "adminpassword2026",
      });
      if (res?.ok) router.push("/admin/dashboard");
    }
    setIsLoading(false);
  };

  return (
    <div className="w-full max-w-md">
      {/* App Logo & Badge */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-3">
          <WifiOff className="w-3.5 h-3.5 text-cyan-400" />
          <span>PWA Offline-First • Pilot 72 Siswa PKL SIJA</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
          <span className="bg-gradient-to-r from-blue-400 via-cyan-300 to-teal-300 bg-clip-text text-transparent">
            siapTKA
          </span>
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Platform Latihan TKA Offline & Diagnostik Butir Soal AI
        </p>
      </div>

      {/* Main Card */}
      <div className="bg-white rounded-3xl shadow-2xl p-6 sm:p-8 border border-slate-100">
        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => {
              setActiveTab("SISWA");
              setErrorMessage("");
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "SISWA"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Portal Siswa PKL
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("GURU");
              setErrorMessage("");
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              activeTab === "GURU"
                ? "bg-white text-blue-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Guru & Sekolah
          </button>
        </div>

        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {activeTab === "SISWA" ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 text-xs text-blue-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-blue-950">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Aktivasi Tanpa Password (Google SSO)</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Siswa cukup masuk menggunakan akun Google Workspace sekolah. Sistem otomatis mencocokkan email dengan daftar 72 siswa SIJA.
              </p>
            </div>

            {/* Google SSO Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-2xl border-2 border-slate-200 shadow-sm transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Masuk dengan Google Workspace</span>
            </button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 font-semibold">
                  Akses Cepat Pengujian / Juri
                </span>
              </div>
            </div>

            {/* Demo Instant Button */}
            <button
              type="button"
              onClick={() => handleQuickDemoLogin("SISWA_KALIMANTAN")}
              disabled={isLoading}
              className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-all flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                <span>Login Siswa Demo (PKL Kalimantan)</span>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleGuruLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Username Guru / Admin
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="mis: guru_matematika atau admin"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <span>{isLoading ? "Memverifikasi..." : "Masuk ke Dashboard Guru"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-400 font-semibold">
                  1-Click Demo Akun Guru
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("GURU_MTK")}
                className="p-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium text-[11px] rounded-lg border border-slate-200 transition-all text-left"
              >
                👩‍🏫 Guru Matematika
              </button>
              <button
                type="button"
                onClick={() => handleQuickDemoLogin("GURU_PPLG")}
                className="p-2 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 font-medium text-[11px] rounded-lg border border-slate-200 transition-all text-left"
              >
                💻 Guru PPLG
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Footer info */}
      <div className="text-center mt-6 text-slate-500 text-xs">
        © 2026 siapTKA • SMKN SIJA PKL Offline Assessment Engine
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <Suspense fallback={<div className="text-white text-xs font-semibold">Memuat halaman login...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}