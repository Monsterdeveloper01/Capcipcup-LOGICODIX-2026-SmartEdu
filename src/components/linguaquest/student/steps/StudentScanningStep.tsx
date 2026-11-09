"use client";

import { RefObject } from "react";
import { Camera, Upload, BookOpen, AlertCircle, RefreshCw, SwitchCamera } from "lucide-react";
import { ActiveClassroom } from "../types";

interface StudentScanningStepProps {
  activeClassroom: ActiveClassroom | null;
  pokedexCount: number;
  videoRef: RefObject<HTMLVideoElement | null>;
  streamRef?: RefObject<MediaStream | null>;
  isCameraActive: boolean;
  isCameraStarting?: boolean;
  cameraFacing?: "user" | "environment";
  onToggleCameraFacing?: () => void;
  capturedImage: string | null;
  isAnalyzing: boolean;
  scanError: string | null;
  onReturnToCatalog: () => void;
  onOpenPokedex: () => void;
  onStartCamera: () => void;
  onSnapFromVideo: () => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRetake: () => void;
}

export default function StudentScanningStep({
  activeClassroom,
  pokedexCount,
  videoRef,
  streamRef,
  isCameraActive,
  isCameraStarting = false,
  cameraFacing = "environment",
  onToggleCameraFacing,
  capturedImage,
  isAnalyzing,
  scanError,
  onReturnToCatalog,
  onOpenPokedex,
  onStartCamera,
  onSnapFromVideo,
  onFileUpload,
  onRetake,
}: StudentScanningStepProps) {
  return (
    <div className="max-w-3xl mx-auto space-y-4 font-mono">
      {/* Active Class Indicator */}
      {activeClassroom && (
        <div className="p-2.5 bg-emerald-50 border-2 border-black flex flex-wrap items-center justify-between gap-2 text-xs font-mono font-bold text-black shadow-[2px_2px_0px_#000000]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse border border-black" />
            <span>[KELAS AKTIF: PIN {activeClassroom.roomCode} • GURU: {activeClassroom.creatorName}]</span>
          </div>
          <span className="text-cyan-900 font-black truncate">{activeClassroom.questTitle || activeClassroom.name}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <button
          onClick={onReturnToCatalog}
          className="brutal-btn-white px-3.5 py-1.5 text-xs font-mono font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
        >
          <span>[ 📋 KEMBALI KE DAFTAR TUGAS ]</span>
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPokedex}
            className="brutal-btn-yellow px-3 py-1 text-xs font-mono font-black flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>🎒 POKEDEX ({pokedexCount})</span>
          </button>
          <span className="font-mono text-xs font-black uppercase bg-[#facc15] text-black px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000000]">
            [LANGKAH 01: OBJECT_TO_INVENTORY]
          </span>
        </div>
      </div>

      {/* Industrial Viewfinder Frame */}
      <div className="border-2 border-black bg-white shadow-[4px_4px_0px_#000000] relative">
        {/* Viewfinder Header Bar */}
        <div className="p-3 bg-zinc-100 border-b-2 border-black flex items-center justify-between text-xs font-mono font-black text-black">
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full border border-black ${
                isCameraActive && !capturedImage ? "bg-red-600 animate-pulse" : "bg-zinc-400"
              }`}
            />
            <span>
              [CAM_FEED: {isCameraStarting ? "MEMULAI WEBCAM..." : isCameraActive ? "LIVE SENSOR AKTIF" : "STANDBY"} // {cameraFacing === "environment" ? "KAMERA BELAKANG" : "KAMERA DEPAN / WEBCAM"}]
            </span>
          </div>
          <div className="flex items-center gap-2">
            {isCameraActive && !capturedImage && onToggleCameraFacing && (
              <button
                type="button"
                onClick={onToggleCameraFacing}
                className="brutal-btn-white px-2 py-0.5 text-[11px] font-mono flex items-center gap-1 shadow-[1px_1px_0px_#000000]"
                title="Ganti kamera depan / belakang"
              >
                <SwitchCamera className="w-3 h-3" />
                <span className="hidden sm:inline">GANTI KAMERA</span>
              </button>
            )}
            <span className="text-black hidden sm:inline bg-[#facc15] px-2 py-0.5 border border-black">
              [TARGET: 2-3 BENDA DI MEJA]
            </span>
          </div>
        </div>

        {/* Camera Viewport with Corner Crosshairs */}
        <div className="relative h-[380px] sm:h-[460px] bg-zinc-950 flex items-center justify-center overflow-hidden">
          {capturedImage ? (
            <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
          ) : isCameraStarting ? (
            <div className="flex flex-col items-center gap-3 text-zinc-300 p-6 text-center">
              <div className="w-10 h-10 border-4 border-black border-t-[#facc15] animate-spin" />
              <span className="font-mono text-xs font-black uppercase text-black bg-[#facc15] px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000000]">
                [MENGHUBUNGKAN KE WEBCAM...]
              </span>
              <p className="font-mono text-[11px] text-zinc-400 max-w-xs">
                Mohon klik &quot;Allow&quot; / &quot;Izinkan&quot; jika muncul jendela izin kamera di browser Anda.
              </p>
            </div>
          ) : isCameraActive ? (
            <video
              ref={(el) => {
                if (typeof videoRef === "function") {
                  (videoRef as any)(el);
                } else if (videoRef) {
                  (videoRef as any).current = el;
                }
                if (el && streamRef?.current && el.srcObject !== streamRef.current) {
                  el.srcObject = streamRef.current;
                  el.play().catch(() => {});
                }
              }}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-zinc-300 p-6 text-center">
              <div className="w-14 h-14 bg-zinc-900 border-2 border-zinc-700 flex items-center justify-center">
                <Camera className="w-8 h-8 text-[#facc15]" />
              </div>
              <p className="font-mono text-xs max-w-sm text-zinc-300">
                Kamera webcam saat ini belum aktif. Klik tombol di bawah untuk menyalakan kamera langsung atau unggah foto benda dari perangkatmu.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={onStartCamera}
                  className="brutal-btn-yellow px-5 py-2.5 text-xs font-mono font-black flex items-center gap-2 shadow-[3px_3px_0px_#000000]"
                >
                  <Camera className="w-4 h-4 stroke-[2.5]" />
                  <span>NYALAKAN KAMERA WEBCAM</span>
                </button>
              </div>
            </div>
          )}

          {/* Corner Crosshairs */}
          <div className="absolute top-4 left-4 font-mono text-xl font-black text-[#facc15] select-none pointer-events-none">
            + [0,0]
          </div>
          <div className="absolute top-4 right-4 font-mono text-xl font-black text-[#facc15] select-none pointer-events-none">
            [W,0] +
          </div>
          <div className="absolute bottom-4 left-4 font-mono text-xl font-black text-[#facc15] select-none pointer-events-none">
            + [0,H]
          </div>
          <div className="absolute bottom-4 right-4 font-mono text-xl font-black text-[#facc15] select-none pointer-events-none">
            [W,H] +
          </div>

          {/* Targeting Reticle */}
          {isCameraActive && !capturedImage && !isCameraStarting && (
            <div className="absolute inset-10 border-2 border-[#facc15] border-dashed pointer-events-none flex items-center justify-center">
              <div className="font-mono text-xs font-black uppercase text-black bg-[#facc15] px-3 py-1 border-2 border-black shadow-[3px_3px_0px_#000000]">
                [POSISIKAN OBJEK DI AREA BIDIK INI]
              </div>
            </div>
          )}

          {/* Analyzing Overlay */}
          {isAnalyzing && (
            <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center gap-3 z-30 p-6 text-center">
              <div className="w-10 h-10 border-4 border-black border-t-[#facc15] animate-spin" />
              <span className="font-mono text-sm font-black uppercase text-black bg-[#facc15] px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000000]">
                [GEMINI 3.1 FLASH-LITE // VISION SCANNING...]
              </span>
              <p className="font-mono text-xs text-zinc-700 max-w-xs">
                Mengekstrak kosakata bahasa Inggris, simbol fonetik IPA, idiom, dan menyintesis skenario darurat RPG...
              </p>
            </div>
          )}
        </div>

        {/* Scan Error Bar */}
        {scanError && (
          <div className="p-3 bg-red-100 border-t-2 border-black text-black text-xs font-mono font-bold flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{scanError}</span>
            </div>
            <button
              type="button"
              onClick={onStartCamera}
              className="brutal-btn-yellow px-3 py-1 text-[11px] font-mono font-black flex items-center gap-1 shadow-[2px_2px_0px_#000000]"
            >
              <RefreshCw className="w-3 h-3" />
              <span>[ 🔄 COBA LAGI ]</span>
            </button>
          </div>
        )}

        {/* Bottom Shutter Controls */}
        <div className="p-4 bg-white border-t-2 border-black flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <label className="brutal-btn-white px-3.5 py-2 text-xs font-mono cursor-pointer flex items-center gap-2">
              <Upload className="w-3.5 h-3.5" />
              <span>[ UNGGAH FOTO ]</span>
              <input type="file" accept="image/*" onChange={onFileUpload} className="hidden" />
            </label>

            {capturedImage && (
              <button
                type="button"
                onClick={onRetake}
                className="brutal-btn-white px-3 py-2 text-xs font-mono"
              >
                [ FOTO ULANG ]
              </button>
            )}
          </div>

          {isCameraActive && !capturedImage && (
            <button
              type="button"
              onClick={onSnapFromVideo}
              disabled={isAnalyzing || isCameraStarting}
              className="brutal-btn-yellow px-6 py-2.5 text-xs sm:text-sm font-mono flex items-center gap-2 disabled:opacity-50"
            >
              <Camera className="w-4 h-4 stroke-[2.5]" />
              <span>📸 JEPRET & ANALISIS OBJEK (AI VISION)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
