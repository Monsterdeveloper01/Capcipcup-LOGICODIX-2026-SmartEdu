"use client";

import { Suspense } from "react";
import SmartScienceLabViewer from "@/components/lab/SmartScienceLabViewer";

export default function LabPage() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#1e1f22] text-[#dbdee1] flex flex-col font-sans antialiased selection:bg-[#5865F2] selection:text-white">
      <Suspense
        fallback={
          <div className="h-screen w-screen flex flex-col items-center justify-center bg-[#1e1f22] text-white space-y-3">
            <div className="w-10 h-10 border-4 border-[#5865F2] border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-semibold tracking-wide">
              Menyiapkan Laboratorium Sains 3D & Web-AR...
            </p>
          </div>
        }
      >
        <SmartScienceLabViewer />
      </Suspense>
    </div>
  );
}

