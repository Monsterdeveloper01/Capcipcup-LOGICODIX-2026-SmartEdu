"use client";

import StudentGameView from "./student/StudentGameView";
import TeacherDashboardView from "./teacher/TeacherDashboardView";
import { Columns, Sparkles, Smartphone, Monitor, Terminal } from "lucide-react";

export default function SplitScreenDemoView() {
  return (
    <div className="w-full space-y-6">
      {/* Demo Split Screen Header (Brutalist Banner) */}
      <div className="border-3 border-black dark:border-white bg-[#111317] p-4 shadow-[4px_4px_0px_#000000] flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2 text-[#4ade80] font-black uppercase">
          <Terminal className="w-4 h-4 stroke-[2.5]" />
          <span>[MODE PRESENTASI JURI: DUAL-SCREEN LIVE SYNC]</span>
        </div>
        <p className="text-zinc-300 text-[11px] font-bold uppercase">
          LAYAR KIRI: HP SISWA (SCAN KAMERA & LIVE ROLEPLAY) • LAYAR KANAN: LAPTOP GURU (SPEAKING GRADER & HEATMAP)
        </p>
      </div>

      {/* Dual Column Layout with Brutalist Borders */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Left: Student Screen Frame */}
        <div className="space-y-3">
          <div className="p-3 bg-black border-2 border-[#facc15] flex items-center justify-between text-xs font-mono font-black text-[#facc15] shadow-[3px_3px_0px_#000000]">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 stroke-[2.5]" />
              <span>[VIEWPORT A: LAYAR HP SISWA]</span>
            </div>
            <span className="text-[10px] bg-[#facc15] text-black px-2 py-0.5 border border-black">
              LIVE WEBCAM
            </span>
          </div>

          <div className="p-4 bg-[#0a0b0e] border-3 border-black dark:border-white shadow-[6px_6px_0px_#000000]">
            <StudentGameView />
          </div>
        </div>

        {/* Right: Teacher Dashboard Frame */}
        <div className="space-y-3">
          <div className="p-3 bg-black border-2 border-[#22d3ee] flex items-center justify-between text-xs font-mono font-black text-[#22d3ee] shadow-[3px_3px_0px_#000000]">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 stroke-[2.5]" />
              <span>[VIEWPORT B: DASHBOARD LAPTOP GURU]</span>
            </div>
            <span className="text-[10px] bg-[#22d3ee] text-black px-2 py-0.5 border border-black">
              LIVE DATABASE
            </span>
          </div>

          <div className="p-4 bg-[#0a0b0e] border-3 border-black dark:border-white shadow-[6px_6px_0px_#000000]">
            <TeacherDashboardView />
          </div>
        </div>
      </div>
    </div>
  );
}
