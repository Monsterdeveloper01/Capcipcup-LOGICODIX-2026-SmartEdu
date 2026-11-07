"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import CameraFeed from "@/components/camera/CameraFeed";
import HandGestureTracker, { HandTransform } from "@/components/camera/HandGestureTracker";
import {
  Atom,
  Globe2,
  Box,
  RotateCw,
  Eye,
  Camera,
  Layers,
  Sparkles,
  Info,
  Hand,
  Sparkle,
} from "lucide-react";
import { ModelType } from "./Educational3DScene";

const Educational3DScene = dynamic(() => import("./Educational3DScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-indigo-400 bg-zinc-950/80 rounded-2xl">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold">Memuat 3D Engine...</span>
      </div>
    </div>
  ),
});

const MODEL_INFO: Record<
  ModelType,
  { title: string; category: string; description: string; hint: string }
> = {
  atom: {
    title: "Model Atom Rutherford-Bohr",
    category: "Fisika & Kimia",
    description:
      "Visualisasi inti atom (proton & neutron) yang dikelilingi oleh orbit elektron berkecepatan tinggi dalam berbagai bidang dimensi.",
    hint: "Gerakkan telapak tangan di depan kamera untuk memutar atom, atau cubit jari untuk zoom in/out.",
  },
  planet: {
    title: "Planet Bercincin & Atmosfer",
    category: "Astronomi & Geografi",
    description:
      "Simulasi benda langit dengan cincin partikel es/debu serta lapisan atmosfer tipis yang membiaskan cahaya bintang.",
    hint: "Gunakan tangan Anda untuk mengubah sudut inklinasi cincin planet dan mengamati lapisan atmosfer.",
  },
  geometry: {
    title: "Ikosahedron & Struktur Dimensi",
    category: "Matematika & Geometri",
    description:
      "Poliedron beraturan dengan 20 sisi segitiga sama sisi dan 12 titik sudut (salah satu bangun ruang Platonik).",
    hint: "Aktifkan mode Kerangka (Wireframe) lalu gunakan gestur tangan untuk melihat simetri ruang bangun.",
  },
};

export default function SmartEduViewer() {
  const [modelType, setModelType] = useState<ModelType>("atom");
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [wireframe, setWireframe] = useState(false);

  // Hand tracking state
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [handTransform, setHandTransform] = useState<HandTransform>({
    rotationX: 0,
    rotationY: 0,
    scale: 1,
    isPinching: false,
    isGrabbing: false,
    handDetected: false,
  });

  const currentInfo = MODEL_INFO[modelType];

  return (
    <div className="w-full max-w-5xl mx-auto rounded-3xl bg-zinc-950 text-white border border-zinc-800 shadow-2xl overflow-hidden">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4 bg-zinc-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-extrabold text-base tracking-tight text-white flex items-center gap-2">
              SmartEdu 3D & AI Hand Tracking
              <span className="text-[10px] font-semibold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 border border-emerald-700/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                <Sparkle className="w-2.5 h-2.5" /> Gesture Control
              </span>
            </h3>
            <p className="text-xs text-zinc-400">{currentInfo.category}</p>
          </div>
        </div>

        {/* Model Switcher Tabs */}
        <div className="flex items-center gap-1.5 bg-zinc-900/90 p-1.5 rounded-2xl border border-zinc-800 text-xs">
          <button
            onClick={() => setModelType("atom")}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
              modelType === "atom"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Atom className="w-3.5 h-3.5" /> Atom
          </button>
          <button
            onClick={() => setModelType("planet")}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
              modelType === "planet"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Globe2 className="w-3.5 h-3.5" /> Planet
          </button>
          <button
            onClick={() => setModelType("geometry")}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all flex items-center gap-1.5 ${
              modelType === "geometry"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Box className="w-3.5 h-3.5" /> Geometri
          </button>
        </div>
      </div>

      {/* Main 3D & Camera Viewport */}
      <div className="relative h-[500px] sm:h-[560px] w-full bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center overflow-hidden">
        {/* Layer 1: Background Camera Feed (for WebAR mode) */}
        {isCameraActive && (
          <div className="absolute inset-0 z-0">
            <CameraFeed
              isActive={isCameraActive}
              onToggleActive={setIsCameraActive}
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
            onGestureUpdate={setHandTransform}
          />
        )}

        {/* Layer 3: 3D WebGL Canvas */}
        <div className="absolute inset-0 z-10 pointer-events-auto">
          <Educational3DScene
            modelType={modelType}
            autoRotate={autoRotate}
            wireframe={wireframe}
            handTransform={isCameraActive ? handTransform : undefined}
          />
        </div>

        {/* Overlay Floating Controls (Bottom Left & Right) */}
        <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Quick Actions */}
          <div className="flex items-center gap-2 pointer-events-auto">
            <button
              onClick={() => setAutoRotate(!autoRotate)}
              title="Toggle Auto Rotate"
              className={`p-2.5 px-3 rounded-xl backdrop-blur-md border text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg ${
                autoRotate
                  ? "bg-indigo-600/80 border-indigo-400/50 text-white"
                  : "bg-zinc-900/80 border-zinc-700 text-zinc-300 hover:text-white"
              }`}
            >
              <RotateCw className={`w-3.5 h-3.5 ${autoRotate ? "animate-spin" : ""}`} />
              <span className="hidden sm:inline">Rotasi</span>
            </button>

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
              onClick={() => setIsCameraActive(!isCameraActive)}
              className={`p-2.5 px-3.5 rounded-xl backdrop-blur-md border text-xs font-bold flex items-center gap-2 transition-all shadow-lg ${
                isCameraActive
                  ? "bg-rose-600/90 hover:bg-rose-700 border-rose-400 text-white"
                  : "bg-emerald-600/90 hover:bg-emerald-700 border-emerald-400/40 text-white"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>{isCameraActive ? "Matikan Kamera AI" : "Aktifkan Kamera & Gestur Tangan"}</span>
            </button>
          </div>

          {/* Interactive Hint Pill */}
          <div className="pointer-events-auto hidden md:flex items-center gap-2 bg-black/70 backdrop-blur-md border border-white/10 px-3.5 py-1.5 rounded-full text-[11px] text-zinc-200 shadow-md">
            {isCameraActive ? (
              <>
                <Hand className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  <strong>Gestur Tangan Aktif:</strong> Gerakkan telapak untuk putar, cubit (pinch) untuk zoom!
                </span>
              </>
            ) : (
              <>
                <Eye className="w-3.5 h-3.5 text-indigo-400" />
                <span>Klik & drag mouse untuk putar | Scroll untuk zoom | Aktifkan kamera untuk kontrol tangan</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Guide Banner for Hand Interaction */}
      {isCameraActive && (
        <div className="bg-emerald-950/60 border-t border-emerald-800/40 px-6 py-2.5 flex flex-wrap items-center justify-between text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>
              <strong>Panduan Kontrol Tangan:</strong> ✋ Buka telapak tangan & gerakkan ke kiri/kanan/atas/bawah untuk memutar | 🤏 Cubit/renggangkan jari jempol-telunjuk untuk zoom in/out.
            </span>
          </div>
        </div>
      )}

      {/* Concept Explanation Card Below Viewer */}
      <div className="p-6 bg-zinc-900/90 border-t border-zinc-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h4 className="font-bold text-base text-white flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-400 flex-shrink-0" />
            {currentInfo.title}
          </h4>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            {currentInfo.description}
          </p>
        </div>
        <div className="bg-zinc-800/80 border border-zinc-700 px-4 py-2 rounded-xl text-xs text-zinc-300 flex-shrink-0">
          💡 {currentInfo.hint}
        </div>
      </div>
    </div>
  );
}
