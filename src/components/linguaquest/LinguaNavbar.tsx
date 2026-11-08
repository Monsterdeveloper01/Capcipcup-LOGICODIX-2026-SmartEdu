"use client";

import { Sparkles, Gamepad2, GraduationCap, MonitorPlay, Columns, Flame, Award } from "lucide-react";

export type ActiveView = "student" | "teacher" | "boss_raid" | "split_screen";

interface LinguaNavbarProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
  userXp: number;
  streak: number;
}

export default function LinguaNavbar({
  activeView,
  onViewChange,
  userXp,
  streak,
}: LinguaNavbarProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-800 bg-zinc-950/85 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Brand & Concept Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-indigo-600 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
                LinguaQuest
              </span>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                English Live RPG
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Scan Dunia Nyata • Dobrak Passive Fluency Trap Bahasa Inggris
            </p>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <nav className="flex items-center gap-1 bg-zinc-900/90 p-1 rounded-2xl border border-zinc-800 text-xs font-semibold">
          <button
            onClick={() => onViewChange("student")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeView === "student"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Mode Siswa</span>
          </button>

          <button
            onClick={() => onViewChange("teacher")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeView === "teacher"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Dashboard Guru</span>
          </button>

          <button
            onClick={() => onViewChange("boss_raid")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeView === "boss_raid"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30 font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <MonitorPlay className="w-3.5 h-3.5 text-rose-300" />
            <span className="hidden md:inline">Boss Raid (Proyektor)</span>
          </button>

          <button
            onClick={() => onViewChange("split_screen")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeView === "split_screen"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            <Columns className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden md:inline">Split Screen Demo</span>
          </button>
        </nav>

        {/* User Gamification Stats */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs font-semibold text-amber-400">
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 animate-pulse" />
            <span>{streak} Hari Streak</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-950/80 border border-indigo-700/60 text-xs font-bold text-indigo-300 shadow-sm">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>{userXp} XP</span>
          </div>
        </div>
      </div>
    </header>
  );
}
