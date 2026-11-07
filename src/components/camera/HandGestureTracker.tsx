"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { Hand, ZoomIn, RotateCcw, Activity, Move, CheckCircle2 } from "lucide-react";

export interface HandTransform {
  rotationX: number;
  rotationY: number;
  scale: number;
  isPinching: boolean;
  isGrabbing: boolean;
  handDetected: boolean;
  activeMode: "rotate" | "zoom";
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
  const [gestureStatus, setGestureStatus] = useState<string>("Inisialisasi AI Vision...");
  const [currentAction, setCurrentAction] = useState<"idle" | "rotate" | "zoom">("idle");
  const [currentScale, setCurrentScale] = useState<number>(1);

  // Mode interaksi: 'auto' (deteksi otomatis via pinch), 'rotate-only', 'zoom-only'
  const [interactionMode, setInteractionMode] = useState<"auto" | "rotate" | "zoom">("auto");

  // References for smooth calculations without React re-render lag
  const prevHandPosRef = useRef<{ x: number; y: number } | null>(null);
  const currentRotationRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentScaleRef = useRef<number>(1);
  const pinchStartDistRef = useRef<number | null>(null);
  const scaleAtPinchStartRef = useRef<number>(1);
  const lostTrackingCounterRef = useRef<number>(0);

  // 1. Initialize MediaPipe with Local Files + CDN Fallback
  useEffect(() => {
    let isCancelled = false;

    async function initHandLandmarker() {
      try {
        setIsModelLoading(true);
        setGestureStatus("Menyiapkan AI Vision lokal...");

        // Try local WASM first (instant), fallback to CDN if not available
        let vision;
        try {
          vision = await FilesetResolver.forVisionTasks("/wasm");
        } catch {
          vision = await FilesetResolver.forVisionTasks(
            "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm"
          );
        }

        if (isCancelled) return;

        // Try GPU delegate first, fallback to CPU
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
            numHands: 1,
            minHandDetectionConfidence: 0.35, // Dibuat lebih sensitif agar tangan miring tetap terbaca
            minTrackingConfidence: 0.35,
            minHandPresenceConfidence: 0.35,
          });
        } catch {
          // Fallback to CPU + CDN
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: cdnModelPath,
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numHands: 1,
            minHandDetectionConfidence: 0.35,
            minTrackingConfidence: 0.35,
            minHandPresenceConfidence: 0.35,
          });
        }

        if (isCancelled) return;

        handLandmarkerRef.current = landmarker;
        setIsModelLoading(false);
        setGestureStatus("Siap mendeteksi gestur tangan");
      } catch (err: any) {
        console.error("Inisialisasi MediaPipe gagal:", err);
        if (!isCancelled) {
          setIsModelLoading(false);
          setGestureStatus("Deteksi tangan aktif dalam mode fallback.");
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

  // 2. Detection Loop & Intent-based Gestures
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

    if (results.landmarks && results.landmarks.length > 0) {
      lostTrackingCounterRef.current = 0;
      const landmarks = results.landmarks[0];

      // Draw skeleton with color feedback
      drawHandSkeleton(ctx, landmarks, canvas.width, canvas.height);

      // Key Landmarks
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      const palmCenter = landmarks[9]; // Middle MCP

      // Calculate Euclidean distance between Thumb Tip & Index Tip
      const dx = thumbTip.x - indexTip.x;
      const dy = thumbTip.y - indexTip.y;
      const dz = (thumbTip.z || 0) - (indexTip.z || 0);
      const pinchDist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      // Jari dianggap "MENCUBIT" jika jarak < 0.065
      const isPinchActive = pinchDist < 0.065;

      // Draw pinch visualizer indicator between thumb & index
      if (isPinchActive) {
        ctx.beginPath();
        ctx.arc(thumbTip.x * canvas.width, thumbTip.y * canvas.height, 12, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(236, 72, 153, 0.6)"; // Pink glow
        ctx.fill();
      }

      // Tentukan aksi berdasarkan mode yang dipilih
      const isZoomMode =
        interactionMode === "zoom" || (interactionMode === "auto" && isPinchActive);

      if (isZoomMode) {
        // --- MODE ZOOM (HANYA AKTIF SAAT JARI MENCUBIT ATAU MODE ZOOM DIPILIH) ---
        setCurrentAction("zoom");
        setGestureStatus("🤏 Mencubit: Mengatur Skala Zoom");

        if (pinchStartDistRef.current === null) {
          pinchStartDistRef.current = pinchDist;
          scaleAtPinchStartRef.current = currentScaleRef.current;
        } else {
          // Perubahan skala proporsional relatif terhadap saat pertama kali dicubit
          const distDiff = (pinchDist - pinchStartDistRef.current) * 4;
          const newScale = Math.min(Math.max(scaleAtPinchStartRef.current + distDiff, 0.4), 2.8);
          currentScaleRef.current = newScale;
          setCurrentScale(newScale);
        }

        // Kunci rotasi saat sedang zoom agar tidak goyang
        prevHandPosRef.current = { x: palmCenter.x, y: palmCenter.y };
      } else {
        // --- MODE ROTASI (TANGAN BERGERAK BEBAS TANPA MENGUBAH SKALA ZOOM) ---
        setCurrentAction("rotate");
        setGestureStatus("✋ Telapak Tangan: Memutar Objek 360°");
        pinchStartDistRef.current = null; // Reset anchor pinch

        if (prevHandPosRef.current) {
          const deltaX = (palmCenter.x - prevHandPosRef.current.x) * 10;
          const deltaY = (palmCenter.y - prevHandPosRef.current.y) * 10;

          // Deadzone filter: abaikan getaran mikro tangan < 0.002
          if (Math.abs(deltaX) > 0.008) {
            currentRotationRef.current.y -= deltaX;
          }
          if (Math.abs(deltaY) > 0.008) {
            currentRotationRef.current.x += deltaY;
          }
        }
        prevHandPosRef.current = { x: palmCenter.x, y: palmCenter.y };
      }

      onGestureUpdate({
        rotationX: currentRotationRef.current.x,
        rotationY: currentRotationRef.current.y,
        scale: currentScaleRef.current,
        isPinching: isPinchActive,
        isGrabbing: isPinchActive,
        handDetected: true,
        activeMode: isZoomMode ? "zoom" : "rotate",
      });
    } else {
      // Grace period: jika tangan hilang 1-10 frame (misal berputar miring), tahan posisi terakhir
      lostTrackingCounterRef.current += 1;
      pinchStartDistRef.current = null;

      if (lostTrackingCounterRef.current > 15) {
        prevHandPosRef.current = null;
        setCurrentAction("idle");
        setGestureStatus("Arahkan tangan ke depan kamera");
        onGestureUpdate({
          rotationX: currentRotationRef.current.x,
          rotationY: currentRotationRef.current.y,
          scale: currentScaleRef.current,
          isPinching: false,
          isGrabbing: false,
          handDetected: false,
          activeMode: "rotate",
        });
      }
    }

    animationFrameRef.current = requestAnimationFrame(detectHands);
  }, [isActive, videoElement, onGestureUpdate, interactionMode]);

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
    pinchStartDistRef.current = null;
    prevHandPosRef.current = null;
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

      {/* Top Floating Controls & Feedback */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/75 backdrop-blur-md border border-white/20 text-xs font-semibold text-white shadow-xl">
          <Activity
            className={`w-3.5 h-3.5 ${
              currentAction === "zoom"
                ? "text-pink-400"
                : currentAction === "rotate"
                ? "text-emerald-400"
                : "text-zinc-400"
            } animate-pulse`}
          />
          <span>{gestureStatus}</span>
        </div>

        {/* Mode Selector Pill Buttons */}
        <div className="inline-flex items-center gap-1 p-1 rounded-2xl bg-black/70 backdrop-blur-md border border-white/15 text-[11px] shadow-lg">
          <button
            onClick={() => setInteractionMode("auto")}
            className={`px-2.5 py-1 rounded-xl font-medium transition-all ${
              interactionMode === "auto"
                ? "bg-indigo-600 text-white font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Auto (Pinch=Zoom)
          </button>
          <button
            onClick={() => setInteractionMode("rotate")}
            className={`px-2.5 py-1 rounded-xl font-medium transition-all flex items-center gap-1 ${
              interactionMode === "rotate"
                ? "bg-emerald-600 text-white font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <Move className="w-3 h-3" /> Hanya Rotasi
          </button>
          <button
            onClick={() => setInteractionMode("zoom")}
            className={`px-2.5 py-1 rounded-xl font-medium transition-all flex items-center gap-1 ${
              interactionMode === "zoom"
                ? "bg-pink-600 text-white font-bold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            <ZoomIn className="w-3 h-3" /> Hanya Zoom
          </button>
        </div>
      </div>

      {/* Top Right Controls (Zoom Value & Reset) */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
        <div className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-xs font-semibold text-indigo-300">
          Skala: {currentScale.toFixed(2)}x
        </div>
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

// Helper: Menggambar kerangka neon tangan 21 titik yang tahan kemiringan sudut
function drawHandSkeleton(
  ctx: CanvasRenderingContext2D,
  landmarks: Array<{ x: number; y: number }>,
  width: number,
  height: number
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
  ctx.strokeStyle = "#38bdf8"; // Neon Cyan
  ctx.lineWidth = 3;
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
    ctx.fillStyle = i === 4 || i === 8 ? "#ec4899" : "#a855f7"; // Neon Pink for tips, Purple for joints
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}
