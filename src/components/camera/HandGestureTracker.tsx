"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { Hand, ZoomIn, RotateCcw, Activity } from "lucide-react";

export interface HandTransform {
  rotationX: number;
  rotationY: number;
  scale: number;
  isPinching: boolean;
  isGrabbing: boolean;
  handDetected: boolean;
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
  const [pinchDistanceDisplay, setPinchDistanceDisplay] = useState<number>(0);

  // Smooth gesture state variables
  const prevHandPosRef = useRef<{ x: number; y: number } | null>(null);
  const currentRotationRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentScaleRef = useRef<number>(1);

  // Initialize MediaPipe HandLandmarker
  useEffect(() => {
    let isCancelled = false;

    async function initHandLandmarker() {
      try {
        setIsModelLoading(true);
        setGestureStatus("Memuat model deteksi tangan...");

        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm"
        );

        if (isCancelled) return;

        const handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
            delegate: "GPU",
          },
          runningMode: "VIDEO",
          numHands: 1,
        });

        if (isCancelled) return;

        handLandmarkerRef.current = handLandmarker;
        setIsModelLoading(false);
        setGestureStatus("Siap mendeteksi tangan");
      } catch (err: any) {
        console.error("Gagal inisialisasi MediaPipe HandLandmarker:", err);
        if (!isCancelled) {
          setIsModelLoading(false);
          setGestureStatus("Gagal memuat AI Vision. Menggunakan fallback.");
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

  // Main Detection Loop
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
    const results = handLandmarkerRef.current.detectForVideo(videoElement, startTimeMs);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (results.landmarks && results.landmarks.length > 0) {
      const landmarks = results.landmarks[0];

      // Draw skeleton & joints
      drawHandSkeleton(ctx, landmarks, canvas.width, canvas.height);

      // Key landmark points:
      // 0: Wrist, 4: Thumb Tip, 8: Index Tip, 12: Middle Tip, 9: Middle MCP
      const thumbTip = landmarks[4];
      const indexTip = landmarks[8];
      const palmCenter = landmarks[9];

      // 1. Calculate Pinch Distance (Thumb Tip to Index Tip) for Zoom
      const dx = thumbTip.x - indexTip.x;
      const dy = thumbTip.y - indexTip.y;
      const dz = (thumbTip.z || 0) - (indexTip.z || 0);
      const pinchDist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      setPinchDistanceDisplay(Math.round(pinchDist * 100));

      const isPinching = pinchDist < 0.08;

      // 2. Calculate Scale from Hand Spread (Distance between Thumb Tip and Pinky Tip)
      // When pinch is open, zoom is mapped dynamically between 0.6x and 2.4x
      const targetScale = Math.min(Math.max(pinchDist * 8, 0.5), 2.5);
      currentScaleRef.current += (targetScale - currentScaleRef.current) * 0.15;

      // 3. Calculate Rotation from Palm Movement
      if (prevHandPosRef.current) {
        // Mirrored coordinate handling (video is flipped)
        const deltaX = (palmCenter.x - prevHandPosRef.current.x) * 12;
        const deltaY = (palmCenter.y - prevHandPosRef.current.y) * 12;

        currentRotationRef.current.y -= deltaX;
        currentRotationRef.current.x += deltaY;
      }
      prevHandPosRef.current = { x: palmCenter.x, y: palmCenter.y };

      // Update status banner
      if (isPinching) {
        setGestureStatus("🤏 Mencubit (Pinch to Zoom)");
      } else {
        setGestureStatus("✋ Menggerakkan Objek (Rotasi Bebas)");
      }

      onGestureUpdate({
        rotationX: currentRotationRef.current.x,
        rotationY: currentRotationRef.current.y,
        scale: currentScaleRef.current,
        isPinching,
        isGrabbing: isPinching,
        handDetected: true,
      });
    } else {
      prevHandPosRef.current = null;
      setGestureStatus("Arahkan tangan ke depan kamera");
      onGestureUpdate({
        rotationX: currentRotationRef.current.x,
        rotationY: currentRotationRef.current.y,
        scale: currentScaleRef.current,
        isPinching: false,
        isGrabbing: false,
        handDetected: false,
      });
    }

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
    onGestureUpdate({
      rotationX: 0,
      rotationY: 0,
      scale: 1,
      isPinching: false,
      isGrabbing: false,
      handDetected: false,
    });
  };

  return (
    <div className="absolute inset-0 pointer-events-none z-10">
      {/* Skeleton Tracking Canvas Overlay */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover -scale-x-100"
      />

      {/* Floating Gesture Status Card */}
      <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 pointer-events-auto">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-xs font-semibold text-white shadow-lg">
          <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
          <span>{gestureStatus}</span>
        </div>

        {pinchDistanceDisplay > 0 && (
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/80 backdrop-blur-md border border-indigo-500/40 text-[11px] font-medium text-indigo-200">
            <ZoomIn className="w-3 h-3 text-indigo-400" />
            <span>Skala Zoom: {currentScaleRef.current.toFixed(2)}x</span>
          </div>
        )}
      </div>

      {/* Reset Gesture Position Button */}
      <div className="absolute top-4 right-20 z-20 pointer-events-auto">
        <button
          onClick={resetTransform}
          title="Reset Sudut & Skala Objek"
          className="p-2 px-3 rounded-xl bg-black/60 hover:bg-black/80 backdrop-blur-md text-white border border-white/20 text-xs font-semibold flex items-center gap-1.5 shadow-lg transition-all"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Reset Posisi</span>
        </button>
      </div>
    </div>
  );
}

// Helper: Menggambar kerangka neon tangan 21 titik
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
    ctx.fillStyle = i === 4 || i === 8 ? "#f43f5e" : "#a855f7"; // Neon Rose for fingertips, Purple for joints
    ctx.fill();
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }
}
