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
    <div className="min-h-screen bg-black text-white flex flex-col selection:bg-indigo-600 selection:text-white font-sans antialiased">
      {/* Universal LinguaQuest Navbar */}
      <LinguaNavbar
        activeView={activeView}
        onViewChange={setActiveView}
        userXp={userXp}
        streak={streak}
      />

      {/* Main App Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {activeView === "student" && <StudentGameView onXpEarned={handleXpEarned} />}
        {activeView === "teacher" && <TeacherDashboardView />}
        {activeView === "boss_raid" && <ClassroomBossRaidView />}
        {activeView === "split_screen" && <SplitScreenDemoView />}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-500 bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>LinguaQuest (DuniaKata) • Capcipcup SmartEdu • LOGICODIX 2026</span>
          <span className="text-[11px] text-zinc-600">
            Fokus: Mengatasi Passive Fluency Trap Bahasa Inggris Siswa Indonesia
          </span>
        </div>
      </footer>
    </div>
  );
}
