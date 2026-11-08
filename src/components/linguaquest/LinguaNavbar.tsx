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
    <header className="sticky top-0 z-50 w-full bg-[#0c0d10] border-b-4 border-black dark:border-white/90 shadow-[0_4px_0_0_#000000]">
      {/* Top Warning/Status Bar */}
      <div className="bg-[#facc15] text-black px-4 py-1 text-[11px] font-mono font-black uppercase tracking-wider flex items-center justify-between border-b-2 border-black">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-red-600 border border-black animate-ping" />
          <span>[SYS_STATUS: MULTI_ROLE ACCESS ENGAGED]</span>
          {currentUser && (
            <span className="hidden md:inline">
              • [LOGGED_AS: {currentUser.name.toUpperCase()} // ROLE: {currentUser.role.toUpperCase()}]
            </span>
          )}
        </div>
        <div className="hidden sm:flex items-center gap-4 text-[10px]">
          <span>[MARIADB: CONNECTED]</span>
          <span>[CEFR_STANDARD: ACTIVE]</span>
          <span>[LATENCY: 85MS]</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[68px] flex items-center justify-between gap-4">
        {/* Brand & Concept Identity (Neo-Brutalist Block) */}
        <div className="flex items-center gap-3">
          <div className="bg-[#facc15] text-black px-3 py-2 border-2 border-black shadow-[3px_3px_0px_#000000] font-black text-lg tracking-tight flex items-center gap-2">
            <Terminal className="w-5 h-5 text-black stroke-[3]" />
            <span className="font-mono">LQ-RPG</span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-xl tracking-tighter text-white uppercase">
                LinguaQuest
              </span>
              <span className="text-[10px] font-mono font-black uppercase px-2 py-0.5 bg-black text-[#facc15] border-2 border-[#facc15] shadow-[2px_2px_0px_#000000]">
                V2.5 BRUTAL
              </span>
            </div>
            <p className="text-[11px] font-mono text-zinc-400 hidden sm:block uppercase tracking-tight">
              Real-World English RPG • Role-Based Dashboards
            </p>
          </div>
        </div>

        {/* View Switcher Segmented Control */}
        <nav className="flex items-center gap-1.5 p-1 bg-black border-2 border-white/80 shadow-[3px_3px_0px_#000000]">
          {/* Siswa Tab (Always available to students, superadmins, or preview) */}
          <button
            onClick={() => onViewChange("student")}
            className={`px-3 py-1.5 font-mono text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              activeView === "student"
                ? "bg-[#facc15] text-black border-2 border-black shadow-[2px_2px_0px_#000000] translate-x-[-1px] translate-y-[-1px]"
                : "text-zinc-300 hover:text-white hover:bg-neutral-800"
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden md:inline">Siswa</span>
          </button>

          {/* Guru Tab (Available to teachers & superadmins) */}
          {(isTeacher || isSuperadmin || !currentUser) && (
            <button
              onClick={() => onViewChange("teacher")}
              className={`px-3 py-1.5 font-mono text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                activeView === "teacher"
                  ? "bg-[#22d3ee] text-black border-2 border-black shadow-[2px_2px_0px_#000000] translate-x-[-1px] translate-y-[-1px]"
                  : "text-zinc-300 hover:text-white hover:bg-neutral-800"
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden md:inline">Guru</span>
            </button>
          )}

          {/* Superadmin Tab (Available to superadmins or preview) */}
          {(isSuperadmin || !currentUser) && (
            <button
              onClick={() => onViewChange("superadmin")}
              className={`px-3 py-1.5 font-mono text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
                activeView === "superadmin"
                  ? "bg-[#ef4444] text-white border-2 border-black shadow-[2px_2px_0px_#000000] translate-x-[-1px] translate-y-[-1px]"
                  : "text-zinc-300 hover:text-white hover:bg-neutral-800"
              }`}
            >
              <Shield className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden md:inline">Superadmin</span>
            </button>
          )}

          {/* Boss Raid Tab */}
          <button
            onClick={() => onViewChange("boss_raid")}
            className={`px-3 py-1.5 font-mono text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              activeView === "boss_raid"
                ? "bg-[#f97316] text-white border-2 border-black shadow-[2px_2px_0px_#000000] translate-x-[-1px] translate-y-[-1px]"
                : "text-zinc-300 hover:text-white hover:bg-neutral-800"
            }`}
          >
            <MonitorPlay className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden md:inline">Boss Raid</span>
          </button>

          {/* Split Screen Demo Tab */}
          <button
            onClick={() => onViewChange("split_screen")}
            className={`px-3 py-1.5 font-mono text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
              activeView === "split_screen"
                ? "bg-[#4ade80] text-black border-2 border-black shadow-[2px_2px_0px_#000000] translate-x-[-1px] translate-y-[-1px]"
                : "text-zinc-300 hover:text-white hover:bg-neutral-800"
            }`}
          >
            <Columns className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden md:inline">Split Demo</span>
          </button>
        </nav>

        {/* User Profile & Logout / Login Actions */}
        <div className="flex items-center gap-2 font-mono">
          {currentUser ? (
            <div className="flex items-center gap-2">
              {/* Profile Pill */}
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-black border-2 border-white shadow-[2px_2px_0px_#000000]">
                <span>{currentUser.avatarUrl || "👤"}</span>
                <div className="text-left">
                  <span className="font-black text-xs text-white block leading-tight truncate max-w-[120px]">
                    {currentUser.name}
                  </span>
                  <span className="text-[10px] font-black uppercase text-[#facc15] block leading-tight">
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
              className="brutal-btn-yellow px-4 py-1.5 text-xs font-black flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>[ LOGIN ]</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
