"use client";

import { useState } from "react";
import LinguaNavbar, { ActiveView } from "@/components/linguaquest/LinguaNavbar";
import StudentGameView from "@/components/linguaquest/student/StudentGameView";
import TeacherDashboardView from "@/components/linguaquest/teacher/TeacherDashboardView";
import ClassroomBossRaidView from "@/components/linguaquest/ClassroomBossRaidView";
import SplitScreenDemoView from "@/components/linguaquest/SplitScreenDemoView";

export default function Home() {
  const [activeView, setActiveView] = useState<ActiveView>("student");
  const [userXp, setUserXp] = useState<number>(450);
  const [streak, setStreak] = useState<number>(3);

  const handleXpEarned = (amount: number) => {
    setUserXp((prev) => prev + amount);
  };

  return (
    <div className="min-h-screen brutal-grid text-white flex flex-col font-sans selection:bg-[#facc15] selection:text-black antialiased relative overflow-x-hidden">
      {/* Universal LinguaQuest Brutalist Navbar */}
      <LinguaNavbar
        activeView={activeView}
        onViewChange={setActiveView}
        userXp={userXp}
        streak={streak}
      />

      {/* Main App Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        {activeView === "student" && <StudentGameView onXpEarned={handleXpEarned} />}
        {activeView === "teacher" && <TeacherDashboardView />}
        {activeView === "boss_raid" && <ClassroomBossRaidView />}
        {activeView === "split_screen" && <SplitScreenDemoView />}
      </main>

      {/* Brutalist Architectural Footer */}
      <footer className="border-t-4 border-black dark:border-white py-6 bg-[#0c0d10] text-zinc-400 font-mono text-xs relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#facc15] border border-black inline-block" />
            <span className="font-black text-white uppercase tracking-tight">
              LINGUAQUEST (DUNIAKATA) • CAPCIPCUP SMARTEDU • LOGICODIX 2026
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-bold text-zinc-400 uppercase">
            <span>[TASTE-SKILL 2.5: NEO-BRUTALISM]</span>
            <span>[ZERO AI SLOP]</span>
            <span>[NO MOCKUP DATA]</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
