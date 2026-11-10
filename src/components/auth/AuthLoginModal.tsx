"use client";

import { useState } from "react";
import { AuthUser } from "@/lib/auth/types";
import {
  GraduationCap,
  UserCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  Sparkles,
  FlaskConical,
  CheckCircle2,
  ShieldCheck,
} from "lucide-react";

interface AuthLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  currentUser?: AuthUser | null;
}

export default function AuthLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
}: AuthLoginModalProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async (customUser?: string, customPass?: string) => {
    const userToSubmit = (customUser || username).trim();
    const passToSubmit = (customPass || password).trim();

    if (!userToSubmit || !passToSubmit) {
      setErrorMsg("Username dan password tidak boleh kosong.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: userToSubmit, password: passToSubmit }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal masuk. Periksa kembali username dan password Anda.");
      }

      setSuccessMsg(data.message || `Selamat datang, ${data.user.name}!`);

      setTimeout(() => {
        onLoginSuccess(data.user);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat menghubungi server autentikasi.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-[#2b2d31] border border-[#3b3e45] rounded-2xl max-w-lg w-full p-6 shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#949ba4] hover:text-white rounded-lg hover:bg-[#35373c] transition-colors"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5 mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5865F2] to-[#7983f5] text-white shadow-lg mb-1">
            <FlaskConical className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white tracking-tight">
            Masuk ke Laboratorium SmartEdu
          </h2>
          <p className="text-xs text-[#949ba4]">
            Pilih mode akun Guru atau Siswa untuk mengelola tugas atau praktikum 3D
          </p>
        </div>

        {/* Notification Alerts */}
        {errorMsg && (
          <div className="mb-4 p-3 bg-[#ed4245]/20 border border-[#ed4245] text-xs font-semibold text-[#f2f3f5] rounded-xl flex items-center gap-2 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-[#ed4245] shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-[#57F287]/20 border border-[#57F287] text-xs font-semibold text-[#57F287] rounded-xl flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-[#57F287] shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Section 1: 1-Click Demo Login Shortcuts */}
        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#949ba4]">
              Pintasan Akun Cepat (1-Klik Masuk)
            </span>
            <div className="h-px bg-[#3b3e45] flex-1" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* Guru Card */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleLogin("guru", "guru123")}
              className="p-3 bg-[#1e1f22] hover:bg-[#35373c] border border-[#3b3e45] hover:border-[#FEE75C] rounded-xl text-left transition-all group flex flex-col justify-between space-y-2 focus:ring-2 focus:ring-[#FEE75C]/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#FEE75C]/20 text-[#FEE75C] flex items-center justify-center font-bold">
                    <GraduationCap className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#FEE75C] text-black">
                    GURU
                  </span>
                </div>
                <span className="text-[10px] text-[#949ba4] font-mono">guru</span>
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-[#FEE75C] transition-colors">
                  Budi Santoso, S.Pd
                </div>
                <div className="text-[10px] text-[#949ba4] leading-tight mt-0.5">
                  Portal Guru, rancang tugas lab & terbitkan kuis AI
                </div>
              </div>
            </button>

            {/* Siswa Card */}
            <button
              type="button"
              disabled={isLoading}
              onClick={() => handleLogin("siswa", "siswa123")}
              className="p-3 bg-[#1e1f22] hover:bg-[#35373c] border border-[#3b3e45] hover:border-[#5865F2] rounded-xl text-left transition-all group flex flex-col justify-between space-y-2 focus:ring-2 focus:ring-[#5865F2]/50"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#5865F2]/20 text-[#5865F2] flex items-center justify-center font-bold">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-[#5865F2] text-white">
                    SISWA
                  </span>
                </div>
                <span className="text-[10px] text-[#949ba4] font-mono">siswa</span>
              </div>
              <div>
                <div className="text-xs font-bold text-white group-hover:text-[#5865F2] transition-colors">
                  Ahmad Faiz
                </div>
                <div className="text-[10px] text-[#949ba4] leading-tight mt-0.5">
                  Praktikum 3D meja lab, kuis observasi & sandbox
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Section 2: Manual Form Login */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleLogin();
          }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#949ba4]">
              Atau Masuk dengan Akun Manual
            </span>
            <div className="h-px bg-[#3b3e45] flex-1" />
          </div>

          <div className="space-y-3">
            {/* Username / Email */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#dbdee1] uppercase">
                Username atau Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#949ba4]">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username (misal: guru atau siswa)..."
                  className="w-full pl-9 pr-3 py-2 bg-[#1e1f22] border border-[#3b3e45] rounded-xl text-xs text-white placeholder-[#949ba4] outline-none focus:border-[#5865F2] transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-[#dbdee1] uppercase">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#949ba4]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password..."
                  className="w-full pl-9 pr-10 py-2 bg-[#1e1f22] border border-[#3b3e45] rounded-xl text-xs text-white placeholder-[#949ba4] outline-none focus:border-[#5865F2] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#949ba4] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Memverifikasi Akun...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                <span>Masuk Sekarang</span>
              </>
            )}
          </button>
        </form>

        {/* Current logged in status if any */}
        {currentUser && (
          <div className="mt-4 pt-3 border-t border-[#3b3e45] flex items-center justify-between text-xs text-[#949ba4]">
            <span>Sedang aktif sebagai: <strong>{currentUser.name}</strong> ({currentUser.role})</span>
          </div>
        )}
      </div>
    </div>
  );
}

