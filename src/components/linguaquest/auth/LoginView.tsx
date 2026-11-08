"use client";

import { useState } from "react";
import { AuthUser } from "@/lib/auth/types";
import { Terminal, Shield, GraduationCap, Gamepad2, ArrowRight, AlertCircle, Key, UserCheck, CheckCircle } from "lucide-react";

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
  onCancel?: () => void;
}

export default function LoginView({ onLoginSuccess, onCancel }: LoginViewProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
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
        throw new Error(data.error || "Login gagal.");
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message || "Gagal masuk ke sistem.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    performLogin(username, password);
  };

  const handleQuickLogin = (role: "superadmin" | "guru" | "siswa") => {
    if (role === "superadmin") {
      setUsername("superadmin");
      setPassword("admin123");
      performLogin("superadmin", "admin123");
    } else if (role === "guru") {
      setUsername("guru");
      setPassword("guru123");
      performLogin("guru", "guru123");
    } else {
      setUsername("siswa");
      setPassword("siswa123");
      performLogin("siswa", "siswa123");
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-mono py-6">
      {/* Header Portal Login */}
      <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-black text-xs font-black uppercase">
            <span className="w-2.5 h-2.5 bg-[#facc15] border border-black inline-block" />
            <span>[PORTAL LOGIN RESMI // CAPCIPCUP SMARTEDU]</span>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-xs font-bold text-zinc-500 hover:text-black underline uppercase"
            >
              [Tutup / Kembali]
            </button>
          )}
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
          Masuk ke Akun Anda
        </h1>
        <p className="text-xs text-zinc-600 leading-relaxed">
          Pilih role atau masukkan username dan password untuk mengakses dashboard khusus Siswa, Guru, atau Superadmin.
        </p>
      </div>

      {/* Quick 1-Click Role Login Bar */}
      <div className="border-2 border-black bg-amber-50/60 p-5 shadow-[4px_4px_0px_#000000] space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-black text-xs text-black uppercase">
            ⚡ PILIH PERAN // LOGIN CEPAT 1-KLIK:
          </span>
          <span className="text-[10px] font-bold bg-[#facc15] text-black px-2 py-0.5 border border-black">
            AKUN TERVERIFIKASI
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Siswa */}
          <button
            type="button"
            onClick={() => handleQuickLogin("siswa")}
            className="p-3 text-xs bg-white text-black border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-[#facc15] transition-all flex flex-col items-center text-center gap-1.5 cursor-pointer"
          >
            <Gamepad2 className="w-5 h-5 text-black stroke-[2.5]" />
            <span className="font-black uppercase">[ SISWA ]</span>
            <span className="text-[10px] text-zinc-600 font-bold">siswa / siswa123</span>
          </button>

          {/* Guru */}
          <button
            type="button"
            onClick={() => handleQuickLogin("guru")}
            className="p-3 text-xs bg-white text-black border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-[#22d3ee] transition-all flex flex-col items-center text-center gap-1.5 cursor-pointer"
          >
            <GraduationCap className="w-5 h-5 text-black stroke-[2.5]" />
            <span className="font-black uppercase">[ GURU ]</span>
            <span className="text-[10px] text-zinc-600 font-bold">guru / guru123</span>
          </button>

          {/* Superadmin */}
          <button
            type="button"
            onClick={() => handleQuickLogin("superadmin")}
            className="p-3 text-xs bg-white text-black border-2 border-black shadow-[3px_3px_0px_#000000] hover:bg-[#ef4444] hover:text-white transition-all flex flex-col items-center text-center gap-1.5 cursor-pointer"
          >
            <Shield className="w-5 h-5 stroke-[2.5]" />
            <span className="font-black uppercase">[ SUPERADMIN ]</span>
            <span className="text-[10px] text-zinc-600 font-bold">superadmin / admin123</span>
          </button>
        </div>
      </div>

      {/* Manual Input Form */}
      <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-4">
        <span className="font-black text-xs text-black uppercase block border-b-2 border-zinc-200 pb-2">
          [ FORM LOGIN MANUAL ]
        </span>

        {error && (
          <div className="p-3 bg-red-50 border-2 border-red-600 text-red-900 text-xs font-black flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-black text-black block mb-1 uppercase">
              Username atau Email:
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-50 border-2 border-black text-black font-mono focus:bg-white focus:outline-none"
              placeholder="Contoh: siswa / guru / superadmin"
            />
          </div>

          <div>
            <label className="font-black text-black block mb-1 uppercase">
              Password:
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-zinc-50 border-2 border-black text-black font-mono focus:bg-white focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full brutal-btn-yellow py-3.5 text-xs sm:text-sm font-black flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <span>[ MEMVERIFIKASI AKUN DI MARIADB... ]</span>
            ) : (
              <>
                <span>[ MASUK KE SISTEM SEKARANG ]</span>
                <ArrowRight className="w-4 h-4 stroke-[3]" />
              </>
            )}
          </button>
        </form>
      </div>

      {/* Credentials Reference Card */}
      <div className="border-2 border-dashed border-zinc-400 bg-zinc-50 p-4 text-[11px] text-zinc-700 space-y-2">
        <span className="font-black uppercase text-black block">
          [ DAFTAR KREDENSIAL YANG DAPAT DIGUNAKAN ]:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 font-mono text-[10px]">
          <div className="p-2 bg-white border border-black">
            <strong className="block text-black">SISWA:</strong>
            <code>siswa</code> atau <code>siswa1</code>
            <br />
            Password: <code>siswa123</code>
          </div>
          <div className="p-2 bg-white border border-black">
            <strong className="block text-black">GURU:</strong>
            <code>guru</code> atau <code>guru1</code>
            <br />
            Password: <code>guru123</code>
          </div>
          <div className="p-2 bg-white border border-black">
            <strong className="block text-black">SUPERADMIN:</strong>
            <code>superadmin</code> atau <code>admin</code>
            <br />
            Password: <code>admin123</code>
          </div>
        </div>
      </div>
    </div>
  );
}
