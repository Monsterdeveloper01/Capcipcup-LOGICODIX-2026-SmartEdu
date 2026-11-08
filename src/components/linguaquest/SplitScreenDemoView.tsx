"use client";

import StudentGameView from "./student/StudentGameView";
import TeacherDashboardView from "./teacher/TeacherDashboardView";
import { Columns, Sparkles, Smartphone, Monitor } from "lucide-react";

export default function SplitScreenDemoView() {
  return (
    <div className="w-full space-y-5 animate-fadeIn">
      {/* Demo Split Screen Header */}
      <div className="p-4 rounded-3xl glass-panel flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-400 font-black">
          <Columns className="w-4 h-4" />
          <span>Mode Presentasi Juri (Split Screen 2-Layar Real-time)</span>
        </div>
        <p className="text-zinc-400 text-[11px] font-medium">
          Layar Kiri: HP Siswa (Camera Scan & Live Roleplay) • Layar Kanan: Laptop Guru (Heatmap & Speaking Grader Otomatis)
        </p>
      </div>

      {/* Dual Column Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Left: Student Screen Frame */}
        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-indigo-950/70 border border-indigo-700/60 flex items-center gap-2 text-xs font-black text-indigo-300 shadow-md">
            <Smartphone className="w-4 h-4 text-indigo-400" />
            <span>Tampilan Layar HP Siswa (LinguaQuest RPG)</span>
          </div>
          <div className="p-4 rounded-3xl glass-panel shadow-2xl">
            <StudentGameView />
          </div>
        </div>

        {/* Right: Teacher Dashboard Frame */}
        <div className="space-y-3">
          <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-700/60 flex items-center gap-2 text-xs font-black text-emerald-300 shadow-md">
            <Monitor className="w-4 h-4 text-emerald-400" />
            <span>Tampilan Dashboard Laptop Guru (Co-Pilot)</span>
          </div>
          <div className="p-4 rounded-3xl glass-panel shadow-2xl">
            <TeacherDashboardView />
          </div>
        </div>
      </div>
    </div>
  );
}
