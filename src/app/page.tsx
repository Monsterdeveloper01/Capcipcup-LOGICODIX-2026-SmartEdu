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
    <div className="min-h-screen bg-[#090a0f] text-white flex flex-col selection:bg-indigo-600 selection:text-white font-sans antialiased relative overflow-x-hidden">
      {/* Taste-Skill Ambient Atmospheric Glows */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[400px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="fixed bottom-0 right-1/4 w-[500px] h-[350px] bg-amber-500/5 rounded-full blur-[140px] pointer-events-none -z-10" />

      {/* Universal LinguaQuest Navbar */}
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

      {/* Footer */}
      <footer className="border-t border-white/[0.06] py-6 text-center text-xs text-zinc-500 bg-[#090a0f]/80 backdrop-blur-md relative z-10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="font-medium text-zinc-400">LinguaQuest (DuniaKata) • Capcipcup SmartEdu • LOGICODIX 2026</span>
          <span className="text-[11px] text-zinc-500 font-mono">
            Designed with Taste-Skill: Anti-Slop High Craft Interface
          </span>
        </div>
      </footer>
    </div>
  );
}
