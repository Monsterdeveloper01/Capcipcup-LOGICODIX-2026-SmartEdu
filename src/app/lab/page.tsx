"use client";

import { Suspense } from "react";
import SmartScienceLabViewer from "@/components/lab/SmartScienceLabViewer";

export default function LabPage() {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-[#FFFDF7] text-slate-900 flex flex-col font-sans antialiased selection:bg-[#FACC15] selection:text-slate-900">
      <Suspense
        fallback={
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#FFFDF7] pop-dots text-slate-900 space-y-4">
            <div className="relative w-14 h-14 rounded-2xl bg-[#FACC15] border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] flex items-center justify-center">
              <div className="w-7 h-7 border-4 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
            </div>
            <div className="text-center space-y-1">
              <h2 className="text-lg font-display font-bold text-slate-900 tracking-tight">
                CupLabs 3D Studio
              </h2>
              <p className="text-xs text-slate-600 font-semibold">
                Menyiapkan Meja Laboratorium Virtual &amp; Sensor Tangan...
              </p>
            </div>
          </div>
        }
      >
        <SmartScienceLabViewer />
      </Suspense>
    </div>
  );
}
