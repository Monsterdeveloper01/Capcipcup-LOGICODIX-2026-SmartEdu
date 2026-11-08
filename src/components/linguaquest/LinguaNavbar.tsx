"use client";

import { AuthUser } from "@/lib/auth/types";
import {
  Gamepad2,
  GraduationCap,
  Shield,
  MonitorPlay,
  Columns,
  Flame,
  Terminal,
  LogOut,
  LogIn,
  User,
  Zap,
} from "lucide-react";

export type ActiveView = "student" | "teacher" | "superadmin" | "boss_raid" | "split_screen";

interface LinguaNavbarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  userXp: number;
  streak: number;
  currentUser: AuthUser | null;
  onLogout: () => void;
  onOpenLogin: () => void;
}

export default function LinguaNavbar({
  activeView,
  onViewChange,
  userXp,
  streak,
  currentUser,
  onLogout,
  onOpenLogin,
}: LinguaNavbarProps) {
  const isSuperadmin = currentUser?.role === "superadmin";
  const isTeacher = currentUser?.role === "teacher";
  const isStudent = currentUser?.role === "student";

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b-2 border-black shadow-[0_3px_0_0_#000000]">
      {/* Top Professional System Status Bar */}
      <div className="bg-[#facc15] text-black px-4 py-1 text-[11px] font-mono font-black uppercase tracking-wider flex items-center justify-between border-b border-black">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-600 rounded-full border border-black inline-block animate-pulse" />
          <span>LINGUAQUEST // DUNIAKATA LIVE RPG</span>
          {currentUser ? (
            <span className="hidden sm:inline font-bold">
              • TERAUTENTIKASI: <span className="bg-black text-white px-1.5 py-0.2">{currentUser.name}</span> [{currentUser.role.toUpperCase()}]
            </span>
          ) : (
            <span className="hidden sm:inline text-zinc-800">
              • [MODE PUBLIK: SILAKAN LOGIN UNTUK HAK AKSES GURU / ADMIN]
            </span>
          )}
        </div>
        <div className="hidden md:flex items-center gap-4 text-[10px] font-bold">
          <span>AI: GEMINI 3.1 FLASH-LITE</span>
          <span>DB: MARIADB CONNECTED</span>
          <span>CEFR: CURRICULUM MERDEKA</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[64px] flex items-center justify-between gap-4">
        {/* Brand Identity (Clean Light Neo-Brutalist) */}
        <div className="flex items-center gap-3">
          <div className="bg-[#facc15] text-black px-3 py-1.5 border-2 border-black shadow-[3px_3px_0px_#000000] font-black text-base tracking-tight flex items-center gap-2">
            <Terminal className="w-4 h-4 text-black stroke-[3]" />
            <span className="font-mono">LQ-RPG</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tighter text-black uppercase">
                LinguaQuest
              </span>
              <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 bg-black text-[#facc15] border border-black shadow-[2px_2px_0px_#000000]">
                V2.5
              </span>
            </div>
            <p className="text-[11px] font-mono text-zinc-600 hidden sm:block uppercase tracking-tight">
              Live Environment English RPG • Role-Based Education
            </p>
          </div>
        </div>

        {/* Role-Protected View Navigation Bar */}
        {currentUser ? (
          <nav className="flex items-center gap-1.5 p-1 bg-zinc-100 border-2 border-black shadow-[3px_3px_0px_#000000]">
            {/* Siswa Tab: Visible to students or superadmin */}
            {(isStudent || isSuperadmin) && (
              <button
                onClick={() => onViewChange("student")}
                className={`px-3 py-1 font-mono text-xs font-black uppercase transition-all flex items-center gap-1.5 border-2 ${
                  activeView === "student"
                    ? "bg-[#facc15] text-black border-black shadow-[2px_2px_0px_#000000] translate-x-[-1px] translate-y-[-1px]"
                    : "bg-transparent text-zinc-700 border-transparent hover:border-black hover:bg-white"
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden md:inline">Siswa</span>
              </button>
            )}

            {/* Guru Tab: ONLY visible to logged-in teachers or superadmin */}
            {(isTeacher || isSuperadmin) && (
              <button
                onClick={() => onViewChange("teacher")}
                className={`px-3 py-1 font-mono text-xs font-black uppercase transition-all flex items-center gap-1.5 border-2 ${
                  activeView === "teacher"
                    ? "bg-[#22d3ee] text-black border-black shadow-[2px_2px_0px_#000000] translate-x-[-1px] translate-y-[-1px]"
                    : "bg-transparent text-zinc-700 border-transparent hover:border-black hover:bg-white"
                }`}
              >
                <GraduationCap className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden md:inline">Guru</span>
              </button>
            )}

            {/* Superadmin Tab: ONLY visible to logged-in superadmin */}
            {isSuperadmin && (
              <button
                onClick={() => onViewChange("superadmin")}
                className={`px-3 py-1 font-mono text-xs font-black uppercase transition-all flex items-center gap-1.5 border-2 ${
                  activeView === "superadmin"
                    ? "bg-[#ef4444] text-white border-black shadow-[2px_2px_0px_#000000] translate-x-[-1px] translate-y-[-1px]"
                    : "bg-transparent text-zinc-700 border-transparent hover:border-black hover:bg-white"
                }`}
              >
                <Shield className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden md:inline">Superadmin</span>
              </button>
            )}

            {/* Boss Raid Tab: Khusus Siswa & Superadmin (Guru TIDAK bisa akses) */}
            {(isStudent || isSuperadmin) && (
              <button
                onClick={() => onViewChange("boss_raid")}
                className={`px-3 py-1 font-mono text-xs font-black uppercase transition-all flex items-center gap-1.5 border-2 ${
                  activeView === "boss_raid"
                    ? "bg-[#f97316] text-white border-black shadow-[2px_2px_0px_#000000] translate-x-[-1px] translate-y-[-1px]"
                    : "bg-transparent text-zinc-700 border-transparent hover:border-black hover:bg-white"
                }`}
              >
                <MonitorPlay className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden md:inline">Boss Raid</span>
              </button>
            )}

            {/* Split Screen Demo Tab (For Presentation/Hackathon Demo) */}
            {(isTeacher || isSuperadmin) && (
              <button
                onClick={() => onViewChange("split_screen")}
                className={`px-3 py-1 font-mono text-xs font-black uppercase transition-all flex items-center gap-1.5 border-2 ${
                  activeView === "split_screen"
                    ? "bg-[#10b981] text-white border-black shadow-[2px_2px_0px_#000000] translate-x-[-1px] translate-y-[-1px]"
                    : "bg-transparent text-zinc-700 border-transparent hover:border-black hover:bg-white"
                }`}
              >
                <Columns className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden md:inline">Split Demo</span>
              </button>
            )}
          </nav>
        ) : (
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 border-2 border-black text-xs font-mono font-bold text-amber-950 shadow-[2px_2px_0px_#000000]">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
            <span>[ SILAKAN LOGIN UNTUK MEMILIH PERAN & MEMULAI SESI ]</span>
          </div>
        )}

        {/* User Profile & Authentication Buttons */}
        <div className="flex items-center gap-2.5 font-mono">
          {currentUser ? (
            <div className="flex items-center gap-2">
              {/* Student Gamification Badge (Only for students) */}
              {isStudent && (
                <div className="hidden lg:flex items-center gap-3 px-3 py-1 bg-amber-50 border-2 border-black shadow-[2px_2px_0px_#000000] text-xs">
                  <div className="flex items-center gap-1 font-black text-amber-700">
                    <Zap className="w-3.5 h-3.5 fill-amber-500 text-amber-600" />
                    <span>{userXp} XP</span>
                  </div>
                  <div className="flex items-center gap-1 font-black text-orange-600">
                    <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-600" />
                    <span>{streak} Hari</span>
                  </div>
                </div>
              )}

              {/* Profile Chip */}
              <div className="flex items-center gap-2 px-3 py-1 bg-white border-2 border-black shadow-[2px_2px_0px_#000000]">
                <span className="text-base">{currentUser.avatarUrl || "👤"}</span>
                <div className="text-left">
                  <span className="font-black text-xs text-black block leading-tight truncate max-w-[130px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] font-black uppercase text-zinc-600 block leading-tight">
                    [{currentUser.role}]
                  </span>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={onLogout}
                className="brutal-btn-red px-3 py-1.5 text-xs font-black flex items-center gap-1"
                title="Keluar dari akun (Logout)"
              >
                <LogOut className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden sm:inline">[LOGOUT]</span>
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="brutal-btn-yellow px-4 py-2 text-xs font-black flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>[ MASUK / LOGIN ]</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
