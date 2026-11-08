"use client";

import { useState } from "react";
import { AuthUser } from "@/lib/auth/types";
import {
  GraduationCap,
  ShieldCheck,
  User,
  ArrowRight,
  AlertCircle,
  Key,
  Mail,
  Eye,
  EyeOff,
  CheckCircle2,
  Users,
  Mic,
  BookOpen,
  Sparkles,
} from "lucide-react";

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
  onCancel?: () => void;
}

export default function LoginView({ onLoginSuccess, onCancel }: LoginViewProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeRoleClicked, setActiveRoleClicked] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const performLogin = async (userToSubmit: string, passToSubmit: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: userToSubmit,
          password: passToSubmit,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Username atau kata sandi tidak cocok.");
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || "Gagal masuk ke sistem. Silakan periksa kembali data login Anda.");
    } finally {
      setIsLoading(false);
      setActiveRoleClicked(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    performLogin(username.trim(), password);
  };

  const handleQuickLogin = (role: "guru" | "siswa" | "superadmin") => {
    setActiveRoleClicked(role);
    if (role === "guru") {
      setUsername("guru");
      setPassword("guru123");
      performLogin("guru", "guru123");
    } else if (role === "siswa") {
      setUsername("siswa");
      setPassword("siswa123");
      performLogin("siswa", "siswa123");
    } else {
      setUsername("superadmin");
      setPassword("admin123");
      performLogin("superadmin", "admin123");
    }
  };

  return (
    <div className="w-full font-mono py-4 sm:py-6">
      {/* Top Application Header Bar */}
      <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_#000000] flex flex-wrap items-center justify-between gap-3 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#facc15] border-2 border-black flex items-center justify-center font-black text-black text-sm shadow-[2px_2px_0px_#000000]">
            LQ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black uppercase tracking-tight text-black">
                Capcipcup SmartEdu • LinguaQuest
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-700 uppercase">
                Versi 2.5
              </span>
            </div>
            <p className="text-[11px] text-zinc-600 font-bold">
              Platform Asesmen Speaking & Pembelajaran Bahasa Inggris Terintegrasi AI
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-zinc-700 bg-zinc-100 px-2.5 py-1 border border-zinc-300">
            Standar CEFR A1–C1 • Kurikulum Merdeka
          </span>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-xs font-black text-zinc-600 hover:text-black uppercase px-2 py-1 border border-black bg-white cursor-pointer"
            >
              [ Batal ]
            </button>
          )}
        </div>
      </div>

      {/* 2-Column Responsive Layout: Left Feature Showcase, Right Login Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: PROFESSIONAL PRODUCT VALUE & WORKFLOW OVERVIEW               */}
        {/* ========================================================================= */}
        <div className="lg:col-span-7 space-y-6">
          {/* Main Value Proposition Card */}
          <div className="border-2 border-black bg-white p-6 sm:p-7 shadow-[4px_4px_0px_#000000] space-y-4">
            <span className="text-[10px] font-black uppercase px-2.5 py-1 bg-black text-[#facc15] border border-black inline-block">
              SOLUSI PEMBELAJARAN & ASESMEN GURU
            </span>

            <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight leading-tight">
              Otomatisasi Asesmen Speaking untuk 35 Siswa Sekaligus
            </h1>

            <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed font-sans font-normal">
              Mengatasi kendala keterbatasan waktu guru dalam menguji kemampuan berbicara siswa satu per satu.
              Siswa berlatih percakapan mandiri dengan karakter penguji AI berstandar CEFR, sementara guru
              memperoleh rekap nilai, analisis kelemahan kelas, dan otomatisasi pembuatan soal dalam hitungan detik.
            </p>

            {/* Core Capability Highlights */}
            <div className="pt-3 border-t-2 border-zinc-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-zinc-50 border-2 border-black space-y-1">
                <div className="flex items-center gap-1.5 font-black text-black uppercase text-[11px]">
                  <Users className="w-3.5 h-3.5 text-black" />
                  <span>Rasio 1:35 Teratasi</span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-normal">
                  Siswa diuji serentak dalam satu jam pelajaran tanpa antre giliran lisan.
                </p>
              </div>

              <div className="p-3 bg-zinc-50 border-2 border-black space-y-1">
                <div className="flex items-center gap-1.5 font-black text-black uppercase text-[11px]">
                  <Mic className="w-3.5 h-3.5 text-black" />
                  <span>Diagnostik CEFR</span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-normal">
                  Laporan otomatis kelancaran, tata bahasa, dan saran kalimat lebih natural.
                </p>
              </div>

              <div className="p-3 bg-zinc-50 border-2 border-black space-y-1">
                <div className="flex items-center gap-1.5 font-black text-black uppercase text-[11px]">
                  <BookOpen className="w-3.5 h-3.5 text-black" />
                  <span>RPP Jadi Misi</span>
                </div>
                <p className="text-[11px] text-zinc-600 leading-normal">
                  Cukup ketik capaian belajar, materi studi kasus & audio siap dalam 10 detik.
                </p>
              </div>
            </div>
          </div>

          {/* Authentic Product Preview Card (Teacher Classroom Monitor Snapshot) */}
          <div className="border-2 border-black bg-white p-5 sm:p-6 shadow-[4px_4px_0px_#000000] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full border border-black" />
                <span className="text-xs font-black uppercase text-black">
                  Contoh Antarmuka: Pemantauan Kelas Guru
                </span>
              </div>
              <span className="text-[10px] font-bold bg-[#facc15] text-black px-2 py-0.5 border border-black">
                PIN KELAS: EDU889
              </span>
            </div>

            {/* Realistic Class Status Card */}
            <div className="p-4 bg-zinc-50 border-2 border-black space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h4 className="font-black text-sm text-black uppercase">
                    Kelas 11 Perhotelan 2 • Pelayanan Tamu & Reservasi
                  </h4>
                  <span className="text-[11px] text-zinc-600">
                    Guru Pengampu: Budi Santoso, S.Pd
                  </span>
                </div>
                <span className="text-[10px] font-black uppercase px-2 py-1 bg-white border border-black">
                  Target CEFR: [B1]
                </span>
              </div>

              {/* Progress and Evaluation Metrics */}
              <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
                <div className="p-2.5 bg-white border border-black">
                  <div className="text-base font-black text-black">34 / 35</div>
                  <div className="text-[10px] text-zinc-600 font-bold uppercase">Siswa Teruji</div>
                </div>
                <div className="p-2.5 bg-white border border-black">
                  <div className="text-base font-black text-emerald-800">81.4%</div>
                  <div className="text-[10px] text-zinc-600 font-bold uppercase">Rata-rata Kelas</div>
                </div>
                <div className="p-2.5 bg-white border border-black">
                  <div className="text-base font-black text-cyan-800">4 Format</div>
                  <div className="text-[10px] text-zinc-600 font-bold uppercase">Speaking + Kuis</div>
                </div>
              </div>

              <div className="p-2.5 bg-white border border-zinc-300 text-[11px] text-zinc-700 flex items-center justify-between">
                <span>Status AI Generator: <strong>Aktif (Gemini Flash-Lite & Web Speech TTS)</strong></span>
                <span className="text-emerald-800 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Siap Digunakan
                </span>
              </div>
            </div>

            {/* Pedagogical Badges */}
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-600 pt-1">
              <span>Mendukung Sekolah Menengah Kejuruan (SMK) & SMA se-Indonesia</span>
              <span className="font-bold text-black uppercase">Kurikulum Merdeka 2024/2025</span>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: PROFESSIONAL LOGIN CARD                                     */}
        {/* ========================================================================= */}
        <div className="lg:col-span-5 space-y-5">
          <div className="border-2 border-black bg-white p-6 sm:p-7 shadow-[6px_6px_0px_#000000] space-y-5">
            {/* Login Card Header */}
            <div className="border-b-2 border-zinc-200 pb-4 space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-800 block">
                [ PORTAL AUTENTIKASI ]
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight">
                Masuk ke Akun
              </h2>
              <p className="text-xs text-zinc-600 font-sans leading-relaxed">
                Pilih peran Anda untuk langsung masuk atau masukkan kredensial yang terdaftar.
              </p>
            </div>

            {/* Quick 1-Click Role Login Selector */}
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-black block">
                Pilih Peran untuk Akses Cepat:
              </label>

              <div className="space-y-2">
                {/* Guru */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickLogin("guru")}
                  className={`w-full p-3 text-left border-2 border-black bg-white hover:bg-zinc-50 shadow-[2px_2px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-between cursor-pointer disabled:opacity-50 ${
                    activeRoleClicked === "guru" ? "ring-2 ring-black bg-amber-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#facc15] border border-black">
                      <GraduationCap className="w-4 h-4 text-black stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="font-black text-xs text-black uppercase">
                        Guru / Tenaga Pengajar
                      </div>
                      <div className="text-[10px] text-zinc-500 font-sans">
                        Kelola rombel kelas, RPP generator, & bank soal
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 border border-zinc-300">
                    guru123
                  </span>
                </button>

                {/* Siswa */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickLogin("siswa")}
                  className={`w-full p-3 text-left border-2 border-black bg-white hover:bg-zinc-50 shadow-[2px_2px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-between cursor-pointer disabled:opacity-50 ${
                    activeRoleClicked === "siswa" ? "ring-2 ring-black bg-amber-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#22d3ee] border border-black">
                      <User className="w-4 h-4 text-black stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="font-black text-xs text-black uppercase">
                        Siswa / Peserta Didik
                      </div>
                      <div className="text-[10px] text-zinc-500 font-sans">
                        Kerjakan misi speaking, kuis, & latihan listening
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 border border-zinc-300">
                    siswa123
                  </span>
                </button>

                {/* Superadmin */}
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleQuickLogin("superadmin")}
                  className={`w-full p-3 text-left border-2 border-black bg-white hover:bg-zinc-50 shadow-[2px_2px_0px_#000000] hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center justify-between cursor-pointer disabled:opacity-50 ${
                    activeRoleClicked === "superadmin" ? "ring-2 ring-black bg-amber-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-zinc-200 border border-black">
                      <ShieldCheck className="w-4 h-4 text-black stroke-[2.5]" />
                    </div>
                    <div>
                      <div className="font-black text-xs text-black uppercase">
                        Administrator Sekolah
                      </div>
                      <div className="text-[10px] text-zinc-500 font-sans">
                        Manajemen pengguna, data master, & database
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 border border-zinc-300">
                    admin123
                  </span>
                </button>
              </div>
            </div>

            {/* Error Message Notice */}
            {error && (
              <div className="p-3 bg-red-50 border-2 border-red-700 text-red-900 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-700" />
                <span>{error}</span>
              </div>
            )}

            {/* Manual Form */}
            <form onSubmit={handleSubmit} className="space-y-4 text-xs pt-1">
              <div className="flex items-center gap-2 text-zinc-400 font-bold text-[10px] uppercase">
                <span className="flex-1 border-t border-zinc-200" />
                <span>Atau Masuk dengan Kredensial Manual</span>
                <span className="flex-1 border-t border-zinc-200" />
              </div>

              <div>
                <label className="font-black text-black block mb-1 uppercase">
                  Username atau Email:
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border-2 border-black text-black font-mono focus:bg-white focus:outline-none font-bold"
                    placeholder="Contoh: guru / siswa / admin"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-black text-black uppercase">
                    Kata Sandi:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-[10px] text-zinc-600 hover:text-black uppercase font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    <span>{showPassword ? "Sembunyikan" : "Tampilkan"}</span>
                  </button>
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border-2 border-black text-black font-mono focus:bg-white focus:outline-none font-bold"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full brutal-btn-yellow py-3.5 text-xs sm:text-sm font-black uppercase flex items-center justify-center gap-2 shadow-[3px_3px_0px_#000000] cursor-pointer"
              >
                {isLoading ? (
                  <span>[ MEMVERIFIKASI AKUN... ]</span>
                ) : (
                  <>
                    <span>[ MASUK KE DASHBOARD ]</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </>
                )}
              </button>
            </form>

            {/* Security and Credentials Note */}
            <div className="p-3 bg-zinc-50 border border-zinc-300 text-[11px] text-zinc-600 space-y-1">
              <span className="font-bold text-black uppercase block text-[10px]">
                Informasi Akun Bawaan Sekolah:
              </span>
              <p className="font-sans leading-relaxed text-[11px]">
                Untuk pengujian sistem: akun <strong>guru</strong> (pass: <code>guru123</code>), <strong>siswa</strong> (pass: <code>siswa123</code>), atau <strong>superadmin</strong> (pass: <code>admin123</code>).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
