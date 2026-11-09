"use client";

import SmartScienceLabViewer from "@/components/lab/SmartScienceLabViewer";

export default function Home() {
  return (
    <div className="h-screen w-screen overflow-hidden bg-[#1e1f22] text-[#dbdee1] flex flex-col font-sans antialiased selection:bg-[#5865F2] selection:text-white">
      <SmartScienceLabViewer />
    </div>
  );
}
