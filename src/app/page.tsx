"use client";

import { useState, useEffect } from "react";
import LinguaNavbar, { ActiveView } from "@/components/linguaquest/LinguaNavbar";
import StudentGameView from "@/components/linguaquest/student/StudentGameView";
import TeacherDashboardView from "@/components/linguaquest/teacher/TeacherDashboardView";
import SuperadminDashboardView from "@/components/linguaquest/admin/SuperadminDashboardView";
import ClassroomBossRaidView from "@/components/linguaquest/ClassroomBossRaidView";
import SplitScreenDemoView from "@/components/linguaquest/SplitScreenDemoView";
import LoginView from "@/components/linguaquest/auth/LoginView";
import { AuthUser } from "@/lib/auth/types";
import {
  Users,
  GraduationCap,
  Sparkles,
  Gamepad2,
  ArrowRight,
  Shield,
  Key,
  Flame,
  Terminal,
  Camera,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<ActiveView>("student");
  const [showLoginScreen, setShowLoginScreen] = useState<boolean>(false);
  const [userXp, setUserXp] = useState<number>(680);
  const [streak, setStreak] = useState<number>(5);

  useEffect(() => {
    fetchSession();
  }, []);

  const fetchSession = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (res.ok && data.authenticated && data.user) {
        setCurrentUser(data.user);
        setUserXp(data.user.xp || 680);
        setStreak(data.user.streakDays || 5);
        if (data.user.role === "teacher") {
          setActiveView("teacher");
        } else if (data.user.role === "superadmin") {
          setActiveView("superadmin");
        } else {
          setActiveView("student");
        }
      } else {
        setCurrentUser(null);
      }
    } catch (err) {
      console.warn("Session check error:", err);
    } finally {
      setIsAuthChecking(false);
    }
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    setUserXp(user.xp || 680);
    setStreak(user.streakDays || 5);
    setShowLoginScreen(false);

    if (user.role === "superadmin") {
      setActiveView("superadmin");
    } else if (user.role === "teacher") {
      setActiveView("teacher");
    } else {
      setActiveView("student");
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      setCurrentUser(null);
      setShowLoginScreen(true);
    }
  };

  const handleXpEarned = (amount: number) => {
    setUserXp((prev) => prev + amount);
  };

  return (
    <div className="min-h-screen brutal-grid text-white flex flex-col font-sans selection:bg-[#facc15] selection:text-black antialiased relative overflow-x-hidden font-mono">
      {/* Universal LinguaQuest Brutalist Navbar */}
      <LinguaNavbar
        activeView={activeView}
        onViewChange={(v) => {
          setShowLoginScreen(false);
          setActiveView(v);
        }}
        userXp={userXp}
        streak={streak}
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenLogin={() => setShowLoginScreen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 relative z-10">
        {/* If user explicitly opens login screen */}
        {showLoginScreen ? (
          <LoginView onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
            {/* Mode 1 & Mode 2 Quick Action Banners (According to AGENT.md Spec) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Mode 1: Classroom Room Mode */}
              <div className="border-4 border-black dark:border-white bg-[#111317] p-6 shadow-[5px_5px_0px_#000000] dark:shadow-[5px_5px_0px_#22d3ee] flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-[#22d3ee] uppercase">
                      [MODE 1 // CLASSROOM ROOM MODE]
                    </span>
                    <span className="text-[10px] bg-black text-[#22d3ee] px-2 py-0.5 border border-[#22d3ee] font-black uppercase">
                      GURU & MURID
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">
                    ROOM KELAS DENGAN PIN 6-DIGIT
                  </h2>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Guru membuat room studi kasus & kuis terstruktur, lalu 35 murid gabung menggunakan PIN untuk memindai benda nyata dan berbicara. Hasil nilai langsung muncul real-time di layar guru.
                  </p>
                </div>

                <div className="pt-2 flex flex-col sm:flex-row gap-2.5">
                  <Link
                    href="/teacher/create"
                    className="flex-1 brutal-btn-cyan py-2.5 text-xs font-black uppercase flex items-center justify-center gap-1.5"
                  >
                    <GraduationCap className="w-4 h-4" />
                    <span>[ BUAT ROOM GURU ]</span>
                  </Link>
                  <Link
                    href="/room/join"
                    className="flex-1 brutal-btn-yellow py-2.5 text-xs font-black uppercase flex items-center justify-center gap-1.5"
                  >
                    <Key className="w-4 h-4" />
                    <span>[ GABUNG PIN KELAS ]</span>
                  </Link>
                </div>
              </div>

              {/* Mode 2: Solo Explorer Mode */}
              <div className="border-4 border-black dark:border-white bg-[#111317] p-6 shadow-[5px_5px_0px_#000000] dark:shadow-[5px_5px_0px_#facc15] flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs text-[#facc15] uppercase">
                      [MODE 2 // SOLO EXPLORER MODE]
                    </span>
                    <span className="text-[10px] bg-black text-[#facc15] px-2 py-0.5 border border-[#facc15] font-black uppercase">
                      MANDIRI / PERSEORANGAN
                    </span>
                  </div>
                  <h2 className="text-xl font-black text-white uppercase tracking-tight">
                    SCAN BENDA & BUAT SOAL SENDIRI
                  </h2>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    Pemain mandiri membuat kuis & misi studi kasus instan: cukup arahkan kamera ke benda di mejamu (YOLO 0-Token) atau ketik topik latihan untuk menantang NPC AI dan dapatkan evaluasi CEFR.
                  </p>
                </div>

                <div className="pt-2">
                  <Link
                    href="/solo/create"
                    className="w-full brutal-btn-yellow py-2.5 text-xs font-black uppercase flex items-center justify-center gap-1.5"
                  >
                    <Camera className="w-4 h-4" />
                    <span>[ MULAI SOLO EXPLORER INSTAN ]</span>
                    <ArrowRight className="w-4 h-4 stroke-[3]" />
                  </Link>
                </div>
              </div>
            </div>

            {/* Active Role Dashboard View */}
            <div className="space-y-4">
              {activeView === "student" && <StudentGameView onXpEarned={handleXpEarned} />}
              {activeView === "teacher" && <TeacherDashboardView />}
              {activeView === "superadmin" && <SuperadminDashboardView />}
              {activeView === "boss_raid" && <ClassroomBossRaidView />}
              {activeView === "split_screen" && <SplitScreenDemoView />}
            </div>
          </>
        )}
      </main>

      {/* Brutalist Architectural Footer */}
      <footer className="border-t-4 border-black dark:border-white py-6 bg-[#0c0d10] text-zinc-400 font-mono text-xs relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#facc15] border border-black inline-block" />
            <span className="font-black text-white uppercase tracking-tight">
              LINGUAQUEST (DUNIAKATA) • HYBRID AI (PYTHON + NEXT.JS + GEMINI)
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-bold text-zinc-400 uppercase">
            <span>[MODE 1: ROOM PIN]</span>
            <span>[MODE 2: SOLO EXPLORER]</span>
            <span>[YOLO 0-TOKEN FASTAPI]</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
