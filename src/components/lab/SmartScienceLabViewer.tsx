"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import CameraFeed from "@/components/camera/CameraFeed";
import HandGestureTracker, { HandTransform } from "@/components/camera/HandGestureTracker";
import {
  ChemicalVessel,
  ReactionDetail,
  INITIAL_VESSELS,
  BUILTIN_REACTIONS,
} from "./ChemistryLabScene";
import {
  FlaskConical,
  Camera,
  RotateCcw,
  Plus,
  Sparkles,
  Flame,
  CheckCircle2,
  Info,
  Layers,
  Hand,
  SwitchCamera,
  BookOpen,
} from "lucide-react";

// Dynamic import with SSR disabled for Three.js Canvas
const ChemistryLabScene = dynamic(() => import("./ChemistryLabScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-cyan-400 bg-slate-950/90 font-mono">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold tracking-widest uppercase">[ MEMUAT 3D SCIENCE ENGINE... ]</span>
      </div>
    </div>
  ),
});

// Extra Chemical Reagents available to spawn
const SPAWNABLE_CHEMICALS: Omit<ChemicalVessel, "id" | "position">[] = [
  { name: "Asam Klorida", formula: "HCl", type: "beaker", color: "#ef4444", initialColor: "#ef4444", level: "SMP", liquidLevel: 0.65, temperatureC: 25 },
  { name: "Natrium Hidroksida", formula: "NaOH", type: "beaker", color: "#3b82f6", initialColor: "#3b82f6", level: "SMP", liquidLevel: 0.65, temperatureC: 25 },
  { name: "Tembaga(II) Sulfat", formula: "CuSO4", type: "flask", color: "#06b6d4", initialColor: "#06b6d4", level: "SMP", liquidLevel: 0.7, temperatureC: 25 },
  { name: "Cuka Dapur", formula: "CH3COOH", type: "flask", color: "#f59e0b", initialColor: "#f59e0b", level: "SD", liquidLevel: 0.75, temperatureC: 25 },
  { name: "Baking Soda", formula: "NaHCO3", type: "test_tube", color: "#e2e8f0", initialColor: "#e2e8f0", level: "SD", liquidLevel: 0.6, temperatureC: 25 },
  { name: "Minyak Goreng", formula: "LIPID", type: "beaker", color: "#eab308", initialColor: "#eab308", level: "SD", liquidLevel: 0.7, temperatureC: 25 },
  { name: "Air Murni", formula: "H2O", type: "beaker", color: "#60a5fa", initialColor: "#60a5fa", level: "SD", liquidLevel: 0.8, temperatureC: 25 },
  { name: "Kalium Iodida", formula: "KI", type: "test_tube", color: "#a855f7", initialColor: "#a855f7", level: "SMA", liquidLevel: 0.6, temperatureC: 25 },
  { name: "Timbal(II) Nitrat", formula: "Pb(NO3)2", type: "test_tube", color: "#e0e7ff", initialColor: "#e0e7ff", level: "SMA", liquidLevel: 0.6, temperatureC: 25 },
  { name: "Kalium Permanganat", formula: "KMnO4", type: "flask", color: "#7e22ce", initialColor: "#7e22ce", level: "SMA", liquidLevel: 0.65, temperatureC: 25 },
  { name: "Gliserin", formula: "GLYCERIN", type: "beaker", color: "#f1f5f9", initialColor: "#f1f5f9", level: "SMA", liquidLevel: 0.5, temperatureC: 25 },
];

export default function SmartScienceLabViewer() {
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [vessels, setVessels] = useState<ChemicalVessel[]>(INITIAL_VESSELS);
  const [activeReaction, setActiveReaction] = useState<ReactionDetail | null>(null);
  const [gradeFilter, setGradeFilter] = useState<"ALL" | "SD" | "SMP" | "SMA">("ALL");
  const [reactionHistory, setReactionHistory] = useState<ReactionDetail[]>([]);

  // Hand tracking state from MediaPipe
  const [handTransform, setHandTransform] = useState<HandTransform>({
    rotationX: 0,
    rotationY: 0,
    scale: 1,
    isPinching: false,
    isGrabbing: false,
    handDetected: false,
    activeMode: "rotate",
  });

  const handleGestureUpdate = useCallback((transform: HandTransform) => {
    setHandTransform(transform);
  }, []);

  const handleReactionDetected = (reaction: ReactionDetail, vesselA: ChemicalVessel, vesselB: ChemicalVessel) => {
    setActiveReaction(reaction);
    setReactionHistory((prev) => [reaction, ...prev.filter((r) => r.id !== reaction.id)]);

    // Clear reaction modal after 7 seconds
    setTimeout(() => {
      setActiveReaction((curr) => (curr?.id === reaction.id ? null : curr));
    }, 7000);
  };

  const handleSpawnChemical = (item: (typeof SPAWNABLE_CHEMICALS)[0]) => {
    const randomX = (Math.random() - 0.5) * 3.5;
    const randomZ = (Math.random() - 0.5) * 2;

    const newVessel: ChemicalVessel = {
      ...item,
      id: `v_${item.formula.toLowerCase()}_${Date.now()}`,
      position: [randomX, 0.6, randomZ],
    };

    setVessels((prev) => [...prev, newVessel]);
  };

  const handleResetWorkbench = () => {
    setVessels(INITIAL_VESSELS);
    setActiveReaction(null);
  };

  const filteredSpawnables = SPAWNABLE_CHEMICALS.filter(
    (c) => gradeFilter === "ALL" || c.level === gradeFilter
  );

  return (
    <div className="w-full flex flex-col gap-4 font-mono">
      {/* 1. Main Cyber-Lab Top Bar */}
      <div className="p-4 bg-white border-2 border-black shadow-[4px_4px_0px_#000000] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#facc15] border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_#000000]">
            <FlaskConical className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black uppercase text-black flex items-center gap-2">
              <span>CAPCIPCUP // 3D VIRTUAL SCIENCE & CHEMISTRY LAB</span>
              <span className="text-[10px] bg-emerald-300 text-black px-2 py-0.5 border border-black font-black uppercase">
                WEB-AR + HAND TRACKING
              </span>
            </h1>
            <p className="text-xs text-zinc-600 font-bold">
              Ambil & campur zat kimia virtual menggunakan gerakan tangan webcam atau mouse
            </p>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIsCameraActive((prev) => !prev)}
            className={`px-3 py-1.5 text-xs font-black uppercase flex items-center gap-1.5 border-2 border-black shadow-[2px_2px_0px_#000000] transition-transform active:translate-x-0.5 active:translate-y-0.5 ${
              isCameraActive ? "bg-red-400 text-black" : "bg-[#facc15] text-black"
            }`}
          >
            <Camera className="w-4 h-4" />
            <span>{isCameraActive ? "[ MATIKAN KAMERA AR ]" : "[ NYALAKAN KAMERA AR ]"}</span>
          </button>

          <button
            type="button"
            onClick={handleResetWorkbench}
            className="px-3 py-1.5 text-xs font-black uppercase bg-white hover:bg-zinc-100 text-black border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center gap-1.5"
            title="Kembalikan posisi tabung kimia ke awal"
          >
            <RotateCcw className="w-4 h-4" />
            <span>[ RESET LAB ]</span>
          </button>
        </div>
      </div>

      {/* 2. Main 3D Lab Simulation Viewport */}
      <div className="border-2 border-black bg-zinc-950 shadow-[6px_6px_0px_#000000] relative overflow-hidden h-[540px] sm:h-[620px]">
        {/* Layer 0: Camera Feed (Webcam background for AR immersion) */}
        {isCameraActive && (
          <div className="absolute inset-0 z-0 opacity-45 pointer-events-none">
            <CameraFeed
              isActive={isCameraActive}
              onVideoReady={setVideoElement}
              showControls={false}
              className="w-full h-full rounded-none"
            />
          </div>
        )}

        {/* Layer 1: Hand Gesture Skeleton Tracker */}
        {isCameraActive && (
          <HandGestureTracker
            videoElement={videoElement}
            isActive={isCameraActive}
            onGestureUpdate={handleGestureUpdate}
          />
        )}

        {/* Layer 2: 3D WebGL Canvas */}
        <div className="absolute inset-0 z-10 pointer-events-auto">
          <ChemistryLabScene
            handTransform={isCameraActive ? handTransform : undefined}
            onReactionDetected={handleReactionDetected}
            vessels={vessels}
            setVessels={setVessels}
            activeReaction={activeReaction}
          />
        </div>

        {/* Layer 3: HUD Overlay Top-Right (Sensor Status) */}
        <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2 pointer-events-none font-mono">
          <div className="bg-black/85 backdrop-blur-md border-2 border-[#facc15] p-2.5 text-xs text-white shadow-[3px_3px_0px_#facc15] space-y-1">
            <div className="flex items-center gap-2 font-black text-[#facc15]">
              <span className={`w-2.5 h-2.5 rounded-full ${handTransform.handDetected ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`} />
              <span>SENSOR TANGAN: {handTransform.handDetected ? "TERDETEKSI" : "MENCARI..."}</span>
            </div>
            <div className="text-[11px] text-zinc-300">
              STATUS GESTUR:{" "}
              <span className="font-bold text-white">
                {handTransform.isGrabbing
                  ? "✊ MEMEGANG (GRABBED)"
                  : handTransform.handDetected
                  ? "✋ TERBUKA (HOVERING)"
                  : "ARAHKAN TANGAN KE KAMERA"}
              </span>
            </div>
          </div>
        </div>

        {/* Layer 4: HUD Overlay Top-Left (Controls Guide) */}
        <div className="absolute top-3 left-3 z-20 pointer-events-none font-mono hidden sm:block">
          <div className="bg-black/85 backdrop-blur-md border-2 border-white p-2.5 text-xs text-white shadow-[3px_3px_0px_#ffffff] max-w-xs space-y-1">
            <div className="text-[#facc15] font-black uppercase flex items-center gap-1.5">
              <Hand className="w-4 h-4" />
              <span>PANDUAN INTERAKSI 3D:</span>
            </div>
            <ul className="text-[11px] text-zinc-300 space-y-0.5 list-disc list-inside">
              <li><span className="text-white font-bold">Telapak Terbuka:</span> Gerakkan kursor ke botol</li>
              <li><span className="text-[#facc15] font-bold">Kepalkan / Pinch:</span> Angkat botol kimia</li>
              <li><span className="text-emerald-400 font-bold">Dekatkan 2 Botol:</span> Tuang & campur zat!</li>
              <li className="text-cyan-300 font-bold">Bisa klik & drag mouse juga!</li>
            </ul>
          </div>
        </div>

        {/* Layer 5: Active Reaction Toast Card (Center Top Alert) */}
        {activeReaction && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-lg w-[90%] pointer-events-auto animate-bounce-short">
            <div className="bg-[#facc15] border-4 border-black p-4 text-black shadow-[6px_6px_0px_#000000] font-mono space-y-2">
              <div className="flex items-center justify-between border-b-2 border-black pb-2">
                <div className="flex items-center gap-2 font-black text-sm">
                  <Sparkles className="w-5 h-5" />
                  <span>⚡ REAKSI TERJADI: [{activeReaction.title}]</span>
                </div>
                <span className="text-xs font-black bg-black text-white px-2 py-0.5 uppercase">
                  {activeReaction.level}
                </span>
              </div>

              <div className="p-2 bg-white border-2 border-black text-xs font-bold font-mono">
                <code>{activeReaction.equation}</code>
              </div>

              <p className="text-xs font-medium text-zinc-900 leading-relaxed">
                {activeReaction.explanation}
              </p>

              <div className="flex items-center justify-between text-[11px] font-black border-t-2 border-black pt-1.5">
                <span>
                  SUHU: {activeReaction.temperatureChange > 0 ? `+${activeReaction.temperatureChange}°C (Eksoterm)` : activeReaction.temperatureChange < 0 ? `${activeReaction.temperatureChange}°C (Endoterm)` : "Tetap"}
                </span>
                <span className="text-emerald-900 font-extrabold uppercase">
                  ✓ TERCATAT DI JURNAL LAB
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 3. Chemical Reagent Rack & Spawner (Bottom Controls) */}
      <div className="p-4 bg-white border-2 border-black shadow-[4px_4px_0px_#000000] space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-black" />
            <h3 className="text-xs sm:text-sm font-black uppercase text-black">
              [ RAK REAGEN & ZAT KIMIA (SD / SMP / SMA) ]
            </h3>
          </div>

          {/* Grade Level Filter Buttons */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-black uppercase mr-1 hidden sm:inline">JENJANG:</span>
            {(["ALL", "SD", "SMP", "SMA"] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setGradeFilter(lvl)}
                className={`px-2.5 py-1 text-xs font-mono font-black border-2 border-black shadow-[1px_1px_0px_#000000] ${
                  gradeFilter === lvl ? "bg-[#facc15] text-black" : "bg-white text-zinc-700 hover:bg-zinc-100"
                }`}
              >
                {lvl === "ALL" ? "SEMUA" : lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Chemical Buttons Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
          {filteredSpawnables.map((item) => (
            <button
              key={item.formula}
              type="button"
              onClick={() => handleSpawnChemical(item)}
              className="p-2 border-2 border-black bg-zinc-50 hover:bg-[#facc15] transition-colors text-left flex flex-col justify-between shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 group"
            >
              <div className="flex items-center justify-between gap-1 w-full">
                <span className="text-xs font-black text-black group-hover:underline">
                  {item.formula}
                </span>
                <span
                  className="w-3 h-3 rounded-full border border-black flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                  title={`Warna: ${item.color}`}
                />
              </div>
              <span className="text-[11px] font-bold text-zinc-600 truncate mt-1">
                {item.name}
              </span>
              <div className="flex items-center justify-between text-[10px] font-black text-zinc-400 mt-2 border-t border-zinc-200 pt-1">
                <span>{item.level}</span>
                <span className="text-black font-black flex items-center gap-0.5">
                  <Plus className="w-2.5 h-2.5" /> AMBIL
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* 4. Reaction Journal History (Daftar Reaksi yang Berhasil Ditemukan) */}
      {reactionHistory.length > 0 && (
        <div className="p-4 bg-emerald-50 border-2 border-black shadow-[4px_4px_0px_#000000] space-y-2">
          <div className="flex items-center gap-2 font-black text-xs text-black uppercase">
            <BookOpen className="w-4 h-4 text-emerald-700" />
            <span>[ JURNAL PENEMUAN REAKSI SAINS ({reactionHistory.length} REAKSI TERUNGKAP) ]</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {reactionHistory.map((rx) => (
              <div key={rx.id} className="p-2.5 bg-white border-2 border-black shadow-[2px_2px_0px_#000000] text-xs space-y-1">
                <div className="flex items-center justify-between font-black">
                  <span className="text-cyan-900 truncate">{rx.title}</span>
                  <span className="bg-[#facc15] text-black px-1.5 py-0.2 border border-black text-[10px]">
                    {rx.level}
                  </span>
                </div>
                <div className="text-[11px] font-bold text-zinc-800">
                  <code>{rx.equation}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
