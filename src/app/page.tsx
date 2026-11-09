"use client";

import SmartScienceLabViewer from "@/components/lab/SmartScienceLabViewer";

export default function Home() {
  return (
    <div className="min-h-screen brutal-grid text-slate-900 flex flex-col font-sans selection:bg-[#facc15] selection:text-black antialiased relative overflow-x-hidden">
      {/* Top Banner Bar */}
      <header className="w-full bg-[#facc15] border-b-2 border-black px-4 py-2 text-xs font-mono font-bold flex items-center justify-between text-black">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse border border-black" />
          <span>CAPCIPCUP SMARTEDU // 3D VIRTUAL SCIENCE LABORATORY</span>
        </div>
        <div className="hidden sm:flex items-center gap-3 text-[11px] font-black uppercase">
          <span>CURRICULUM: SD • SMP • SMA</span>
          <span>//</span>
          <span>ENGINE: THREE.JS + MEDIAPIPE</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 lg:p-6 space-y-6 relative z-10">
        <SmartScienceLabViewer />
      </main>

      {/* Footer */}
      <footer className="w-full bg-white border-t-2 border-black p-4 text-center text-xs font-mono text-zinc-600">
        <p className="font-bold">
          © 2026 Capcipcup SmartEdu — Virtual Science & Chemistry Laboratory 3D
        </p>
      </footer>
    </div>
  );
}
