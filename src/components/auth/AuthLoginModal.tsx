"use client";

import { useState, useEffect } from "react";
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
  FlaskConical,
  CheckCircle2,
  ShieldCheck,
  Mail,
  Sparkles,
} from "lucide-react";

interface AuthLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: AuthUser) => void;
  currentUser?: AuthUser | null;
  initialMode?: "login" | "register";
}

export default function AuthLoginModal({
  isOpen,
  onClose,
  onLoginSuccess,
  currentUser,
  initialMode = "login",
}: AuthLoginModalProps) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Register form state
  const [regName, setRegName] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regRole, setRegRole] = useState<"student" | "teacher">("student");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode, isOpen]);

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
      }, 650);
    } catch (err: any) {
      setErrorMsg(err.message || "Terjadi kesalahan saat menghubungi server autentikasi.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regUsername.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMsg("Semua kolom pendaftaran wajib diisi.");
      return;
    }

    if (regPassword.trim().length < 6) {
      setErrorMsg("Kata sandi minimal harus 6 karakter.");
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: regName.trim(),
          username: regUsername.trim(),
          email: regEmail.trim(),
          password: regPassword.trim(),
          role: regRole,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Pendaftaran gagal.");
      }

      setSuccessMsg(data.message || `Akun berhasil dibuat! Selamat datang, ${data.user.name}.`);

      setTimeout(() => {
        onLoginSuccess(data.user);
        onClose();
      }, 700);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal membuat akun.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="pop-card rounded-3xl max-w-lg w-full p-6 bg-[#FFFDF7] overflow-hidden relative animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center text-slate-900 hover:bg-rose-100 cursor-pointer z-10"
          title="Tutup Modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-1.5 mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#FACC15] border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] text-slate-900 mb-1">
            <FlaskConical className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-display font-bold text-slate-900 tracking-tight">
            {mode === "login" ? "Masuk ke CupLabs Studio" : "Daftar Akun Baru CupLabs"}
          </h2>
          <p className="text-xs text-slate-600 font-medium">
            {mode === "login"
              ? "Gunakan akun yang sudah terdaftar atau pilih pintasan cepat"
              : "Buat akun sebagai Siswa atau Guru untuk mengakses seluruh fitur lab"}
          </p>

          {/* Mode Tabs */}
          <div className="pt-2 flex justify-center">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
              <button
                type="button"
                onClick={() => {
                  setMode("login");
                  setErrorMsg(null);
                }}
                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  mode === "login"
                    ? "bg-[#FACC15] text-slate-900 border border-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Masuk (Login)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode("register");
                  setErrorMsg(null);
                }}
                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all cursor-pointer ${
                  mode === "register"
                    ? "bg-[#38BDF8] text-slate-900 border border-slate-900 shadow-2xs"
                    : "text-slate-600 hover:text-slate-900"
                }`}
              >
                Daftar (Sign Up)
              </button>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-[#FFE4E6] border-2 border-slate-900 text-xs font-bold text-slate-900 rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-[#A7F3D0] border-2 border-slate-900 text-xs font-bold text-slate-900 rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {mode === "login" ? (
          <>
            {/* Section 1: 1-Click Demo Login Shortcuts */}
            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                  Pintasan Akun Cepat (1-Klik)
                </span>
                <div className="h-0.5 bg-slate-900/15 flex-1" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleLogin("guru", "guru123")}
                  className="pop-card pop-card-interactive p-3.5 bg-[#FEF9C3] rounded-2xl text-left flex flex-col justify-between space-y-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#FACC15] border border-slate-900 text-slate-900 flex items-center justify-center">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-white text-slate-900 border border-slate-900">
                        GURU
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-600 font-mono font-bold">guru</span>
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">Budi Santoso, S.Pd</div>
                    <div className="text-[10px] text-slate-700 leading-tight mt-0.5">
                      Kelola kelas, buat tugas &amp; rekap nilai siswa
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  disabled={isLoading}
                  onClick={() => handleLogin("siswa", "siswa123")}
                  className="pop-card pop-card-interactive p-3.5 bg-[#BAE6FD] rounded-2xl text-left flex flex-col justify-between space-y-2 cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#38BDF8] border border-slate-900 text-slate-900 flex items-center justify-center">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-white text-slate-900 border border-slate-900">
                        SISWA
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-600 font-mono font-bold">siswa</span>
                  </div>
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">Ahmad Faiz</div>
                    <div className="text-[10px] text-slate-700 leading-tight mt-0.5">
                      Buka kelas, praktikum 3D &amp; kerjakan kuis
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
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                  Masuk dengan Akun Manual
                </span>
                <div className="h-0.5 bg-slate-900/15 flex-1" />
              </div>

              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-800 uppercase">
                    Username atau Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="Contoh: guru.rina atau murid01"
                      className="w-full pl-9 pr-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-black text-slate-800 uppercase">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Masukkan kata sandi..."
                      className="w-full pl-9 pr-10 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-900 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="pop-btn w-full py-2.5 bg-[#34D399] hover:bg-[#10B981] text-slate-900 text-xs rounded-xl gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Masuk Sekarang</span>
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          /* Register Form Mode */
          <form onSubmit={handleRegister} className="space-y-3.5">
            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-800 uppercase">Nama Lengkap</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  placeholder="Contoh: Rian Pratama"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase">Username</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    placeholder="Contoh: rian_kimia"
                    required
                    className="w-full pl-9 pr-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-black text-slate-800 uppercase">Peran / Role</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as "student" | "teacher")}
                  className="w-full px-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900 outline-none"
                >
                  <option value="student">Siswa Praktikan</option>
                  <option value="teacher">Guru Pengampu</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-800 uppercase">Alamat Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  placeholder="Contoh: rian@sekolah.id"
                  required
                  className="w-full pl-9 pr-3 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-black text-slate-800 uppercase">Kata Sandi (Min 6 Karakter)</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  placeholder="Ketik kata sandi aman..."
                  required
                  className="w-full pl-9 pr-10 py-2 bg-white border-2 border-slate-900 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-900 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="pop-btn w-full py-2.5 bg-[#38BDF8] hover:bg-[#0ea5e9] text-slate-900 text-xs rounded-xl gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                  <span>Mendaftarkan akun...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Daftar &amp; Langsung Masuk Lab</span>
                </>
              )}
            </button>
          </form>
        )}

        {currentUser && (
          <div className="mt-4 pt-3 border-t-2 border-slate-900/15 flex items-center justify-between text-xs text-slate-600">
            <span>
              Aktif sebagai: <strong className="text-slate-900">{currentUser.name}</strong> ({currentUser.role})
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

