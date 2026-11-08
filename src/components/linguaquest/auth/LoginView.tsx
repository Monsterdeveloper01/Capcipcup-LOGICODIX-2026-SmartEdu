"use client";

import { useState } from "react";
import { AuthUser } from "@/lib/auth/types";
import { Terminal, Shield, GraduationCap, Gamepad2, ArrowRight, AlertCircle, Key, UserCheck } from "lucide-react";

interface LoginViewProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export default function LoginView({ onLoginSuccess }: LoginViewProps) {
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
    <div className="max-w-2xl mx-auto space-y-6 font-mono py-8">
      {/* Neo-Brutalist Login Header */}
      <div className="border-4 border-black dark:border-white bg-[#111317] p-6 shadow-[6px_6px_0px_#000000] dark:shadow-[6px_6px_0px_#facc15] space-y-2">
        <div className="flex items-center gap-2 text-[#facc15] text-xs font-black uppercase">
          <Terminal className="w-4 h-4 stroke-[3]" />
          <span>[SECURITY GATEWAY // ROLE-BASED ACCESS CONTROL]</span>
        </div>
        <h1 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight leading-none">
          LOGIN CAPCIPCUP SMARTEDU
        </h1>
        <p className="text-xs text-zinc-300 leading-relaxed">
          Pilih atau masukkan kredensial untuk mengakses Dashboard khusus Siswa, Guru, atau Superadmin.
        </p>
      </div>

      {/* Quick 1-Click Role Login Bar (Hackathon Frictionless Speed) */}
      <div className="border-3 border-black dark:border-white bg-[#0f1115] p-5 shadow-[5px_5px_0px_#000000] space-y-3">
        <span className="font-black text-xs text-[#facc15] uppercase block">
          [ ⚡ CONTOH LOGIN 1-KLIK LANGSUNG ]:
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleQuickLogin("superadmin")}
            className="brutal-btn-dark p-3 text-xs flex flex-col items-center text-center gap-1 border-2 hover:border-[#ef4444]"
          >
            <Shield className="w-5 h-5 text-[#ef4444] stroke-[2.5]" />
            <span className="font-black text-white">[ SUPERADMIN ]</span>
            <span className="text-[10px] text-zinc-400">superadmin / admin123</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin("guru")}
            className="brutal-btn-dark p-3 text-xs flex flex-col items-center text-center gap-1 border-2 hover:border-[#22d3ee]"
          >
            <GraduationCap className="w-5 h-5 text-[#22d3ee] stroke-[2.5]" />
            <span className="font-black text-white">[ GURU ]</span>
            <span className="text-[10px] text-zinc-400">guru / guru123</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin("siswa")}
            className="brutal-btn-dark p-3 text-xs flex flex-col items-center text-center gap-1 border-2 hover:border-[#facc15]"
          >
            <Gamepad2 className="w-5 h-5 text-[#facc15] stroke-[2.5]" />
            <span className="font-black text-white">[ SISWA ]</span>
            <span className="text-[10px] text-zinc-400">siswa / siswa123</span>
          </button>
        </div>
      </div>

      {/* Standard Form Login */}
      <div className="border-3 border-black dark:border-white bg-[#111317] p-6 shadow-[5px_5px_0px_#000000] space-y-4">
        <span className="font-black text-xs text-[#22d3ee] uppercase block border-b-2 border-zinc-800 pb-2">
          [ATAU MASUKKAN USERNAME & PASSWORD MANUAL]
        </span>

        {error && (
          <div className="p-3 bg-red-950 border-2 border-red-700 text-red-200 text-xs font-black flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-black text-zinc-300 block mb-1 uppercase">
              Username atau Email:
            </label>
            <input
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 bg-black border-2 border-white text-white font-mono focus:border-[#facc15] focus:outline-none"
              placeholder="Contoh: superadmin / guru / siswa"
            />
          </div>

          <div>
            <label className="font-black text-zinc-300 block mb-1 uppercase">
              Password:
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-black border-2 border-white text-white font-mono focus:border-[#facc15] focus:outline-none"
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

      {/* Credentials Reference Cheat Sheet for Evaluators */}
      <div className="border-2 border-dashed border-zinc-700 bg-black/60 p-4 text-[11px] text-zinc-400 space-y-2">
        <span className="font-black uppercase text-[#facc15] block">
          [PANDUAN KREDENSIAL DEMO UNTUK JURI]:
        </span>
        <div className="space-y-1 font-mono">
          <p>• <strong>Superadmin:</strong> username <code>superadmin</code> / password <code>admin123</code> (Manajemen pengguna & telemetri)</p>
          <p>• <strong>Guru:</strong> username <code>guru</code> / password <code>guru123</code> (RPP Quest Gen, 30-Sec Grader, Misconception Heatmap)</p>
          <p>• <strong>Siswa:</strong> username <code>siswa</code> / password <code>siswa123</code> (Kamera RPG, Live Speech HUD, CEFR Autopsy)</p>
        </div>
      </div>
    </div>
  );
}

