"use client";

import StudentGameView from "./student/StudentGameView";
import TeacherDashboardView from "./teacher/TeacherDashboardView";
import { Columns, Sparkles, Smartphone, Monitor } from "lucide-react";

export default function SplitScreenDemoView() {
  return (
    <div className="w-full space-y-4 animate-fadeIn">
      {/* Demo Split Screen Header */}
      <div className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-extrabold">
          <Columns className="w-4 h-4" />
          <span>Mode Presentasi Juri (Split Screen 2-Layar Real-time)</span>
        </div>
        <p className="text-zinc-400 text-[11px]">
          Layar Kiri: HP Siswa (Camera Scan & Live Roleplay) | Layar Kanan: Laptop Guru (Heatmap & Speaking Grader Otomatis)
        </p>
      </div>

      {/* Dual Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Left: Student Screen */}
        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-indigo-950/60 border border-indigo-800/60 flex items-center gap-2 text-xs font-bold text-indigo-300">
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <span>Tampilan HP Siswa (LinguaQuest RPG)</span>
          </div>
          <div className="p-4 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-2xl">
            <StudentGameView />
          </div>
        </div>

        {/* Right: Teacher Dashboard */}
        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-emerald-950/60 border border-emerald-800/60 flex items-center gap-2 text-xs font-bold text-emerald-300">
            <Monitor className="w-4 h-4 text-emerald-400" />
            <span>Tampilan Dashboard Laptop Guru (Co-Pilot)</span>
          </div>
          <div className="p-4 rounded-3xl bg-zinc-950/80 border border-zinc-800/80 shadow-2xl">
            <TeacherDashboardView />
          </div>
        </div>
      </div>
    </div>
  );
}
