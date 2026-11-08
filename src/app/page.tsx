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

export default function Home() {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [activeView, setActiveView] = useState<ActiveView>("student");
  const [showLoginScreen, setShowLoginScreen] = useState<boolean>(false);
  const [userXp, setUserXp] = useState<number>(680);
  const [streak, setStreak] = useState<number>(5);

  // Check existing session on load
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
        // Default to demo student if not logged in yet, or allow direct login
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

    // Redirect to matching role dashboard
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
    <div className="min-h-screen brutal-grid text-white flex flex-col font-sans selection:bg-[#facc15] selection:text-black antialiased relative overflow-x-hidden">
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
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 relative z-10">
        {/* If user explicitly opens login or logged out and no user */}
        {showLoginScreen ? (
          <LoginView onLoginSuccess={handleLoginSuccess} />
        ) : (
          <>
            {activeView === "student" && <StudentGameView onXpEarned={handleXpEarned} />}
            {activeView === "teacher" && <TeacherDashboardView />}
            {activeView === "superadmin" && <SuperadminDashboardView />}
            {activeView === "boss_raid" && <ClassroomBossRaidView />}
            {activeView === "split_screen" && <SplitScreenDemoView />}
          </>
        )}
      </main>

      {/* Brutalist Architectural Footer */}
      <footer className="border-t-4 border-black dark:border-white py-6 bg-[#0c0d10] text-zinc-400 font-mono text-xs relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#facc15] border border-black inline-block" />
            <span className="font-black text-white uppercase tracking-tight">
              LINGUAQUEST • CAPCIPCUP SMARTEDU • MULTI-ROLE RBAC READY
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-bold text-zinc-400 uppercase">
            <span>[SUPERADMIN: ACTIVE]</span>
            <span>[TEACHER: ACTIVE]</span>
            <span>[STUDENT: ACTIVE]</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
