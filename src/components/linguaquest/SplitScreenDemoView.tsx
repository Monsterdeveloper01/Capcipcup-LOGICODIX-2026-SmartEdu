"use client";

import StudentGameView from "./student/StudentGameView";
import TeacherDashboardView from "./teacher/TeacherDashboardView";
import { Columns, Sparkles, Smartphone, Monitor, Terminal } from "lucide-react";

export default function SplitScreenDemoView() {
  return (
    <div className="w-full space-y-6 font-mono">
      {/* Demo Split Screen Header */}
      <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_#000000] flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-700 font-black uppercase">
          <Terminal className="w-4 h-4 stroke-[2.5]" />
          <span>[MODE PRESENTASI JURI: DUAL-SCREEN LIVE SYNC]</span>
        </div>
        <p className="text-zinc-700 text-[11px] font-bold uppercase">
          LAYAR KIRI: HP SISWA (SCAN KAMERA & LIVE ROLEPLAY) • LAYAR KANAN: LAPTOP GURU (SPEAKING GRADER & HEATMAP)
        </p>
      </div>

      {/* Dual Column Layout with Clean Light Frames */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {/* Left: Student Screen Frame */}
        <div className="space-y-3">
          <div className="p-3 bg-amber-50 border-2 border-black flex items-center justify-between text-xs font-mono font-black text-black shadow-[3px_3px_0px_#000000]">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 stroke-[2.5]" />
              <span>[VIEWPORT A: LAYAR HP SISWA]</span>
            </div>
            <span className="text-[10px] bg-[#facc15] text-black px-2 py-0.5 border border-black font-bold">
              LIVE WEBCAM
            </span>
          </div>

          <div className="p-4 bg-white border-2 border-black shadow-[4px_4px_0px_#000000]">
            <StudentGameView />
          </div>
        </div>

        {/* Right: Teacher Dashboard Frame */}
        <div className="space-y-3">
          <div className="p-3 bg-cyan-50 border-2 border-black flex items-center justify-between text-xs font-mono font-black text-black shadow-[3px_3px_0px_#000000]">
            <div className="flex items-center gap-2">
              <Monitor className="w-4 h-4 stroke-[2.5]" />
              <span>[VIEWPORT B: DASHBOARD LAPTOP GURU]</span>
            </div>
            <span className="text-[10px] bg-[#22d3ee] text-black px-2 py-0.5 border border-black font-bold">
              LIVE DATABASE
            </span>
          </div>

          <div className="p-4 bg-white border-2 border-black shadow-[4px_4px_0px_#000000]">
            <TeacherDashboardView />
          </div>
        </div>
      </div>
    </div>
  );
}
