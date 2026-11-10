"use client";

import { Suspense } from "react";
import SmartScienceLabViewer from "@/components/lab/SmartScienceLabViewer";

export default function LabPage() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-50 text-slate-800 flex flex-col font-sans antialiased selection:bg-sky-500 selection:text-white">
      <Suspense
        fallback={
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-white text-slate-800 space-y-4">
            <div className="relative">
              <div className="w-12 h-12 border-4 border-slate-200 border-t-sky-600 rounded-full animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="w-2 h-2 rounded-full bg-sky-600 animate-ping" />
              </div>
            </div>
            <div className="text-center">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">CupLabs 3D</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Menginisialisasi Meja Laboratorium Virtual & Web-AR...
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

