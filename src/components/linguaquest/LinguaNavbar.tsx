"use client";

import { Sparkles, Gamepad2, GraduationCap, MonitorPlay, Columns, Flame, Award, Globe2 } from "lucide-react";

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
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.08] bg-[#090a0f]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-[68px] flex items-center justify-between gap-4">
        {/* Brand & Concept Identity */}
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 ring-1 ring-white/20">
            <Sparkles className="w-5 h-5 text-amber-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-lg tracking-tight text-white">
                LinguaQuest
              </span>
              <span className="text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/25">
                English RPG
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block tracking-normal">
              Live Environment Roleplay • Anti-Passive Fluency
            </p>
          </div>
        </div>

        {/* View Switcher Segmented Control */}
        <nav className="flex items-center gap-1 bg-[#12141c]/90 p-1.5 rounded-2xl border border-white/[0.08] text-xs font-semibold shadow-inner">
          <button
            onClick={() => onViewChange("student")}
            className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
              activeView === "student"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Mode Siswa</span>
          </button>

          <button
            onClick={() => onViewChange("teacher")}
            className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
              activeView === "teacher"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Dashboard Guru</span>
          </button>

          <button
            onClick={() => onViewChange("boss_raid")}
            className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
              activeView === "boss_raid"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30 font-bold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            <MonitorPlay className="w-3.5 h-3.5 text-rose-300" />
            <span className="hidden md:inline">Boss Raid (Proyektor)</span>
          </button>

          <button
            onClick={() => onViewChange("split_screen")}
            className={`px-3.5 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5 ${
              activeView === "split_screen"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30 font-bold"
                : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
            }`}
          >
            <Columns className="w-3.5 h-3.5 text-emerald-300" />
            <span className="hidden md:inline">Split Screen Demo</span>
          </button>
        </nav>

        {/* Gamification Badges */}
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12141c] border border-white/[0.08] text-xs font-semibold text-amber-400">
            <Flame className="w-3.5 h-3.5 text-orange-500 fill-orange-500 animate-pulse" />
            <span>{streak} Hari Streak</span>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-950/80 border border-indigo-700/60 text-xs font-bold text-indigo-300 shadow-sm">
            <Award className="w-3.5 h-3.5 text-amber-400" />
            <span>{userXp} XP</span>
          </div>
        </div>
      </div>
    </header>
  );
}
