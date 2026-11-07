"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { ZoomIn, RotateCcw, Activity, Move, Sparkles } from "lucide-react";

export interface HandTransform {
  rotationX: number;
  rotationY: number;
  scale: number;
  isPinching: boolean;
  isGrabbing: boolean;
  handDetected: boolean;
  activeMode: "rotate" | "zoom" | "dual";
}

interface HandGestureTrackerProps {
  videoElement: HTMLVideoElement | null;
  onGestureUpdate: (transform: HandTransform) => void;
  isActive: boolean;
}

export default function HandGestureTracker({
  videoElement,
  onGestureUpdate,
  isActive,
}: HandGestureTrackerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const [isModelLoading, setIsModelLoading] = useState(true);
  const [rightHandStatus, setRightHandStatus] = useState<string>("Tangan Kanan: Tidak terdeteksi");
  const [leftHandStatus, setLeftHandStatus] = useState<string>("Tangan Kiri: Tidak terdeteksi");
  const [currentScale, setCurrentScale] = useState<number>(1);

  // References for smooth state updates (60 FPS without React re-render bottleneck)
  const prevRightHandPosRef = useRef<{ x: number; y: number } | null>(null);
  const currentRotationRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentScaleRef = useRef<number>(1);
  const lostRightCounterRef = useRef<number>(0);
  const lostLeftCounterRef = useRef<number>(0);

  // 1. Initialize MediaPipe HandLandmarker with 2 Hands Detection
  useEffect(() => {
    let isCancelled = false;

    async function initHandLandmarker() {
      try {
        setIsModelLoading(true);

        // Load WASM: local first, CDN fallback
        let vision;
        try {
          vision = await FilesetResolver.forVisionTasks("/wasm");
        } catch {
          vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
          );
        }

        if (isCancelled) return;

        // Model path: local first, CDN fallback
        const modelPath = "/models/hand_landmarker.task";
        const cdnModelPath =
          "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task";

        let landmarker: HandLandmarker;
        try {
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: modelPath,
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numHands: 2, // DETEKSI DUA TANGAN (KANAN & KIRI)
            minHandDetectionConfidence: 0.35,
            minTrackingConfidence: 0.35,
            minHandPresenceConfidence: 0.35,
          });
        } catch {
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: cdnModelPath,
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numHands: 2,
            minHandDetectionConfidence: 0.35,
            minTrackingConfidence: 0.35,
            minHandPresenceConfidence: 0.35,
          });
        }

        if (isCancelled) return;

        handLandmarkerRef.current = landmarker;
        setIsModelLoading(false);
      } catch (err: any) {
        console.error("Gagal inisialisasi MediaPipe 2-Hands:", err);
        if (!isCancelled) {
          setIsModelLoading(false);
        }
      }
    }

    if (isActive) {
      initHandLandmarker();
    }

    return () => {
      isCancelled = true;
      if (handLandmarkerRef.current) {
        handLandmarkerRef.current.close();
        handLandmarkerRef.current = null;
      }
    };
  }, [isActive]);

  // 2. Main Detection Loop: Dual Hands Tracking
  const detectHands = useCallback(() => {
    if (
      !isActive ||
      !videoElement ||
      !canvasRef.current ||
      !handLandmarkerRef.current ||
      videoElement.readyState < 2
    ) {
      animationFrameRef.current = requestAnimationFrame(detectHands);
      return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (canvas.width !== videoElement.videoWidth || canvas.height !== videoElement.videoHeight) {
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;
    }

    const startTimeMs = performance.now();
    let results;
    try {
      results = handLandmarkerRef.current.detectForVideo(videoElement, startTimeMs);
    } catch {
      animationFrameRef.current = requestAnimationFrame(detectHands);
      return;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let rightHandDetected = false;
    let leftHandDetected = false;

    if (results.landmarks && results.landmarks.length > 0) {
      for (let i = 0; i < results.landmarks.length; i++) {
        const landmarks = results.landmarks[i];
        const handednessInfo = results.handedness[i]?.[0];

        // Karena video dicerminkan (mirror):
        // Handedness MediaPipe "Right" adalah tangan kanan fisik pengguna (tampil di sisi kanan layar cermin)
        // Handedness MediaPipe "Left" adalah tangan kiri fisik pengguna (tampil di sisi kiri layar cermin)
        const isRightHand = handednessInfo ? handednessInfo.categoryName === "Right" : landmarks[0].x > 0.5;

        if (isRightHand) {
          // ==========================================
          // ✋ TANGAN KANAN: MEMUTAR OBJEK 3D (ROTASI)
          // ==========================================
          rightHandDetected = true;
          lostRightCounterRef.current = 0;

          // Gambar tulang tangan kanan (Warna Neon Hijau/Cyan)
          drawHandSkeleton(ctx, landmarks, canvas.width, canvas.height, "#10b981", "#34d399", "✋ Kanan: Rotasi");

          const palmCenter = landmarks[9]; // Pangkal jari tengah

          if (prevRightHandPosRef.current) {
            const deltaX = (palmCenter.x - prevRightHandPosRef.current.x) * 10;
            const deltaY = (palmCenter.y - prevRightHandPosRef.current.y) * 10;

            // Deadzone: abaikan getaran mikro < 0.003
            if (Math.abs(deltaX) > 0.006) {
              currentRotationRef.current.y -= deltaX;
            }
            if (Math.abs(deltaY) > 0.006) {
              currentRotationRef.current.x += deltaY;
            }
          }
          prevRightHandPosRef.current = { x: palmCenter.x, y: palmCenter.y };
          setRightHandStatus("✋ Tangan Kanan Aktif: Memutar Objek");
        } else {
          // ==========================================
          // 🔍 TANGAN KIRI: ZOOM IN / ZOOM OUT (SKALA)
          // ==========================================
          leftHandDetected = true;
          lostLeftCounterRef.current = 0;

          // Gambar tulang tangan kiri (Warna Neon Pink/Ungu)
          drawHandSkeleton(ctx, landmarks, canvas.width, canvas.height, "#ec4899", "#f43f5e", "🔍 Kiri: Zoom");

          // Zoom diatur secara intuitif oleh Ketinggian Tangan Kiri (Posisi Y) & Jarak Jari
          // Ketinggian Y di video: 0.1 (atas) hingga 0.9 (bawah)
          const wrist = landmarks[0];
          const thumbTip = landmarks[4];
          const indexTip = landmarks[8];

          // Jarak bukaan jempol & telunjuk tangan kiri
          const dx = thumbTip.x - indexTip.x;
          const dy = thumbTip.y - indexTip.y;
          const pinchDist = Math.sqrt(dx * dx + dy * dy);

          // Kombinasi: Naikkan tangan kiri (Y lebih kecil) = Zoom In; Turunkan tangan kiri = Zoom Out
          // Normalisasi rentang Y (0.2 atas -> skala 2.2x, 0.8 bawah -> skala 0.5x)
          const normalizedY = 1 - Math.min(Math.max((wrist.y - 0.15) / 0.65, 0), 1);
          const targetScale = 0.5 + normalizedY * 1.8 + Math.min(pinchDist * 2, 0.5);

          // Smooth interpolation
          currentScaleRef.current += (targetScale - currentScaleRef.current) * 0.18;
          setCurrentScale(currentScaleRef.current);

          setLeftHandStatus(`🔍 Tangan Kiri Aktif: Zoom (${currentScaleRef.current.toFixed(2)}x)`);
        }
      }
    }

    // Grace period tangan kanan
    if (!rightHandDetected) {
      lostRightCounterRef.current += 1;
      if (lostRightCounterRef.current > 12) {
        prevRightHandPosRef.current = null;
        setRightHandStatus("Tangan Kanan: Tidak terdeteksi");
      }
    }

    // Grace period tangan kiri
    if (!leftHandDetected) {
      lostLeftCounterRef.current += 1;
      if (lostLeftCounterRef.current > 12) {
        setLeftHandStatus("Tangan Kiri: Tidak terdeteksi");
      }
    }

    const anyHand = rightHandDetected || leftHandDetected;
    const mode = rightHandDetected && leftHandDetected ? "dual" : rightHandDetected ? "rotate" : "zoom";

    onGestureUpdate({
      rotationX: currentRotationRef.current.x,
      rotationY: currentRotationRef.current.y,
      scale: currentScaleRef.current,
      isPinching: false,
      isGrabbing: rightHandDetected,
      handDetected: anyHand,
      activeMode: mode,
    });

    animationFrameRef.current = requestAnimationFrame(detectHands);
  }, [isActive, videoElement, onGestureUpdate]);

  useEffect(() => {
    if (isActive && !isModelLoading) {
      animationFrameRef.current = requestAnimationFrame(detectHands);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, isModelLoading, detectHands]);

  const resetTransform = () => {
    currentRotationRef.current = { x: 0, y: 0 };
    currentScaleRef.current = 1;
    setCurrentScale(1);
    prevRightHandPosRef.current = null;
    onGestureUpdate({
      rotationX: 0,
      rotationY: 0,
      scale: 1,
      isPinching: false,
      isGrabbing: false,
      handDetected: false,
      activeMode: "rotate",
    });
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Skeleton Tracking Canvas Overlay */}
      <canvas ref={canvasRef} className="w-full h-full object-cover -scale-x-100" />

      {/* Top Floating Status Indicators (Left & Right Hands) */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
        {/* Right Hand Indicator */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-emerald-500/30 text-xs font-semibold text-white shadow-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>{rightHandStatus}</span>
        </div>

        {/* Left Hand Indicator */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-pink-500/30 text-xs font-semibold text-white shadow-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-pink-400 animate-pulse" />
          <span>{leftHandStatus}</span>
        </div>
      </div>

      {/* Vertical Zoom Bar Visualizer on Left Side */}
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 flex flex-col items-center gap-2 pointer-events-none">
        <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">Zoom In</span>
        <div className="w-3 h-36 rounded-full bg-black/60 border border-white/20 p-0.5 flex flex-col justify-end overflow-hidden">
          <div
            className="w-full rounded-full bg-gradient-to-t from-pink-500 to-indigo-500 transition-all duration-75"
            style={{
              height: `${Math.min(Math.max(((currentScale - 0.4) / 2.4) * 100, 10), 100)}%`,
            }}
          />
        </div>
        <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">Zoom Out</span>
        <span className="text-[11px] font-mono text-white/90 bg-black/60 px-2 py-0.5 rounded-lg border border-white/10">
          {currentScale.toFixed(2)}x
        </span>
      </div>

      {/* Top Right Controls (Reset Button) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
        <button
          onClick={resetTransform}
          title="Reset Sudut & Skala Objek"
          className="p-2 px-3 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset</span>
        </button>
      </div>
    </div>
  );
}

// Helper: Menggambar kerangka tangan neon dengan warna spesifik per tangan
function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Array<{ x: number; y: number }>,
  width: number,
  height: number,
  lineColor: string,
  jointColor: string,
  label: string
) {
  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4], // Jempol
    [0, 5], [5, 6], [6, 7], [7, 8], // Telunjuk
    [5, 9], [9, 10], [10, 11], [11, 12], // Jari Tengah
    [9, 13], [13, 14], [14, 15], [15, 16], // Jari Manis
    [13, 17], [17, 18], [18, 19], [19, 20], // Kelingking
    [0, 17], // Telapak bawah
  ];

  // Draw lines
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 3.5;
  ctx.lineCap = "round";

  for (const [startIdx, endIdx] of connections) {
    const p1 = landmarks[startIdx];
    const p2 = landmarks[endIdx];
    ctx.beginPath();
    ctx.moveTo(p1.x * width, p1.y * height);
    ctx.lineTo(p2.x * width, p2.y * height);
    ctx.stroke();
  }

  // Draw joint points
  for (let i = 0; i < landmarks.length; i++) {
    const p = landmarks[i];
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, i === 4 || i === 8 ? 6 : 4, 0, 2 * Math.PI);
    ctx.fillStyle = jointColor;
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Draw floating label above wrist
  const wrist = landmarks[0];
  ctx.font = "bold 12px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(label, wrist.x * width - 40, wrist.y * height - 15);
}
