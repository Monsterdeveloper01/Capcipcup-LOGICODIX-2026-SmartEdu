"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import CameraFeed from "@/components/camera/CameraFeed";
import HandGestureTracker, { HandTransform } from "@/components/camera/HandGestureTracker";
import { BlockShape } from "./Educational3DScene";
import {
  Box,
  Layers,
  Sparkles,
  Camera,
  RotateCcw,
  Plus,
  Hand,
  CheckCircle2,
  Sparkle,
  Move,
  Building2,
} from "lucide-react";

const Educational3DScene = dynamic(() => import("./Educational3DScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-indigo-400 bg-zinc-950/80 rounded-2xl">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold">Memuat Sandbox 3D Engine...</span>
      </div>
    </div>
  ),
});

export default function SmartEduViewer() {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [blockCount, setBlockCount] = useState(6);

  // Command to communicate with the 3D Sandbox
  const [sandboxCommand, setSandboxCommand] = useState<{
    type: "add" | "reset" | "stack";
    shape?: BlockShape;
    timestamp: number;
  } | null>(null);

  // Hand tracking state
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [handTransform, setHandTransform] = useState<HandTransform>({
    rotationX: 0,
    rotationY: 0,
    scale: 1,
    isPinching: false,
    isGrabbing: false,
    handDetected: false,
    activeMode: "rotate",
  });

  const handleToggleCamera = () => {
    setIsCameraActive((prev) => !prev);
  };

  const handleGestureUpdate = (transform: HandTransform) => {
    setHandTransform(transform);
  };

  const triggerCommand = (type: "add" | "reset" | "stack", shape?: BlockShape) => {
    setSandboxCommand({ type, shape, timestamp: Date.now() });
  };

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl bg-zinc-950 text-white border border-zinc-800 shadow-2xl overflow-hidden">
      {/* Top Header & Spawner Controls */}
      <div className="px-6 py-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4 bg-zinc-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
              SmartEdu 3D Sandbox Lab
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkle className="w-2.5 h-2.5" /> Hand Physics
              </span>
            </h3>
            <p className="text-xs text-zinc-400">Pegang, pindahkan, dan tumpuk balok edukasi secara bebas</p>
          </div>
        </div>

        {/* Sandbox Spawner Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5 bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800 text-xs">
          <button
            onClick={() => triggerCommand("add", "cube")}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-red-400" /> Kubus
          </button>
          <button
            onClick={() => triggerCommand("add", "rectangle")}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" /> Balok
          </button>
          <button
            onClick={() => triggerCommand("add", "cylinder")}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" /> Silinder
          </button>
          <button
            onClick={() => triggerCommand("add", "pyramid")}
            className="px-2.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5 text-pink-400" /> Piramida
          </button>
          <button
            onClick={() => triggerCommand("stack")}
            title="Susun semua balok menjadi menara bertingkat"
            className="px-2.5 py-1.5 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 text-white font-medium transition-all flex items-center gap-1.5 shadow-sm"
          >
            <Building2 className="w-3.5 h-3.5" /> Susun Menara
          </button>
          <button
            onClick={() => triggerCommand("reset")}
            title="Kembalikan posisi balok semula"
            className="p-1.5 px-2 rounded-xl bg-zinc-800 hover:bg-rose-900/60 text-zinc-300 hover:text-white transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main 3D & Camera Viewport */}
      <div className="relative h-[520px] sm:h-[580px] w-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center overflow-hidden">
        {/* Layer 1: Background Camera Feed (for WebAR mode) */}
        {isCameraActive && (
          <div className="absolute inset-0 z-0">
            <CameraFeed
              isActive={isCameraActive}
              onToggleActive={handleToggleCamera}
              onVideoReady={setVideoElement}
              showControls={false}
              className="w-full h-full rounded-none"
            />
          </div>
        )}

        {/* Layer 2: Hand Gesture Skeleton Tracker */}
        {isCameraActive && (
          <HandGestureTracker
            videoElement={videoElement}
            isActive={isCameraActive}
            onGestureUpdate={handleGestureUpdate}
          />
        )}

        {/* Layer 3: 3D WebGL Canvas Sandbox */}
        <div className="absolute inset-0 z-10 pointer-events-auto">
          <Educational3DScene
            handTransform={isCameraActive ? handTransform : undefined}
            wireframe={wireframe}
            onBlockCountChange={setBlockCount}
            sandboxCommand={sandboxCommand}
          />
        </div>

        {/* Overlay Floating Controls (Bottom Left & Right) */}
        <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Quick Actions */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setWireframe(!wireframe)}
              title="Toggle Wireframe Skeleton"
              className={`p-2.5 px-3 rounded-xl backdrop-blur-md border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg ${
                wireframe
                  ? "bg-indigo-600/80 border-indigo-400/50 text-white"
                  : "bg-zinc-900/80 border-zinc-700 text-zinc-300 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kerangka</span>
            </button>

            <button
              onClick={handleToggleCamera}
              className={`p-2.5 px-3.5 rounded-xl backdrop-blur-md border text-xs font-bold flex items-center gap-2 transition-all shadow-lg ${
                isCameraActive
                  ? "bg-rose-600/90 hover:bg-rose-700 border-rose-400 text-white"
                  : "bg-emerald-600/90 hover:bg-emerald-700 border-emerald-400/40 text-white"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>{isCameraActive ? "Matikan Kamera AR" : "Aktifkan Kamera & Gestur Tangan"}</span>
            </button>
          </div>

          {/* Realtime Hand Grab Status Badge */}
          <div className="pointer-events-auto flex items-center gap-2 bg-black/75 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full text-xs text-zinc-200 shadow-md">
            {isCameraActive ? (
              handTransform.isGrabbing ? (
                <>
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                  <span className="text-amber-300 font-bold">Tangan Menutup: Memegang Balok (Buka tangan untuk menumpuk)</span>
                </>
              ) : (
                <>
                  <Hand className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Tangan Terbuka: Arahkan ke balok lalu <strong>tutup tangan (kepal)</strong> untuk mengambil</span>
                </>
              )
            ) : (
              <>
                <Move className="w-3.5 h-3.5 text-indigo-400" />
                <span>Klik & drag balok dengan mouse | Atau aktifkan kamera untuk kontrol tangan</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Concept Explanation / Sandbox Info Card */}
      <div className="p-6 bg-zinc-900/90 border-t border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-bold text-base text-white flex items-center gap-2">
            <Box className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            Sandbox Edukasi Fisika & Bangun Ruang ({blockCount} Balok di Meja)
          </h4>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Eksplorasi gravitasi, keseimbangan struktur, dan pengenalan geometri spasial. Balok yang dijatuhkan di atas balok lain akan otomatis bertumpuk membentuk menara atau bangunan!
          </p>
        </div>
        <div className="bg-zinc-800/80 border border-zinc-700 px-4 py-2 rounded-xl text-xs text-zinc-300 flex-shrink-0 flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Fisika Stacking & Gravitasi Aktif</span>
        </div>
      </div>
    </div>
  );
}
