"use client";

import { useRouter } from "next/navigation";
import LoginView from "@/components/linguaquest/auth/LoginView";
import { AuthUser } from "@/lib/auth/types";
import LinguaNavbar from "@/components/linguaquest/LinguaNavbar";

export default function LoginPage() {
  const router = useRouter();

  const handleLoginSuccess = (user: AuthUser) => {
    // Save session in localStorage for LinguaQuest
    if (typeof window !== "undefined") {
      localStorage.setItem("lq_auth_user", JSON.stringify(user));
    }
    router.push("/");
  };

  return (
    <div className="min-h-screen brutal-grid text-slate-900 flex flex-col font-sans selection:bg-[#facc15] selection:text-black antialiased relative overflow-x-hidden">
      <LinguaNavbar
        activeView="student"
        onViewChange={() => router.push("/")}
        userXp={0}
        streak={1}
        currentUser={null}
        onLogout={() => {}}
        onOpenLogin={() => {}}
      />
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-8 relative z-10">
        <LoginView
          onLoginSuccess={handleLoginSuccess}
          onCancel={() => router.push("/")}
        />
      </main>
    </div>
  );
}
