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
  handPosition3D?: { x: number; y: number; z: number };
  handScreenPos?: { x: number; y: number };
  wristAngle?: number;
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
  const currentWristAngleRef = useRef<number>(0);
  const lostRightCounterRef = useRef<number>(0);
  const lostLeftCounterRef = useRef<number>(0);
  const grabFrameCounterRef = useRef<number>(0);

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
    let primaryHand3D: { x: number; y: number; z: number } | undefined = undefined;
    let primaryScreenPos: { x: number; y: number } | undefined = undefined;
    let isAnyGrabbingCandidate = false;
    let isAnyPinchingCandidate = false;

    const handCount = results.landmarks?.length || 0;

    if (results.landmarks && results.landmarks.length > 0) {
      for (let i = 0; i < results.landmarks.length; i++) {
        const landmarks = results.landmarks[i];
        const handednessInfo = results.handedness[i]?.[0];

        // Karena video dicerminkan (mirror):
        const isRightHand = handednessInfo ? handednessInfo.categoryName === "Right" : landmarks[0].x > 0.5;

        // Calculate 3D position of the hand
        const palm = landmarks[9];
        const h3D = {
          x: (0.5 - palm.x) * 8.5,
          y: Math.max((1 - palm.y) * 4.2 + 0.2, 0.3),
          z: (palm.z || 0) * 5,
        };

        const wrist = landmarks[0];
        const middleMcp = landmarks[9];
        const indexMcp = landmarks[5];
        const pinkyMcp = landmarks[17];
        const palmLength = Math.max(dist3D(wrist, middleMcp), 0.08);

        // ==========================================
        // DETEKSI FISIK TANGAN MENUTUP (GENGGAMAN / FIST)
        // ==========================================
        const palmCenter = {
          x: (wrist.x + middleMcp.x + indexMcp.x + pinkyMcp.x) / 4,
          y: (wrist.y + middleMcp.y + indexMcp.y + pinkyMcp.y) / 4,
          z: ((wrist.z || 0) + (middleMcp.z || 0) + (indexMcp.z || 0) + (pinkyMcp.z || 0)) / 4,
        };

        // Cek lekukan fisik 4 jari (Telunjuk: 8-6-5, Tengah: 12-10-9, Manis: 16-14-13, Kelingking: 20-18-17)
        const indexCurled = isFingerTrulyCurled(landmarks[8], landmarks[6], landmarks[5], wrist, palmCenter, palmLength);
        const middleCurled = isFingerTrulyCurled(landmarks[12], landmarks[10], landmarks[9], wrist, palmCenter, palmLength);
        const ringCurled = isFingerTrulyCurled(landmarks[16], landmarks[14], landmarks[13], wrist, palmCenter, palmLength);
        const pinkyCurled = isFingerTrulyCurled(landmarks[20], landmarks[18], landmarks[17], wrist, palmCenter, palmLength);

        let curledCount = 0;
        if (indexCurled) curledCount++;
        if (middleCurled) curledCount++;
        if (ringCurled) curledCount++;
        if (pinkyCurled) curledCount++;

        // Rata-rata jarak 4 ujung jari ke pusat telapak
        const avgTipToPalm = (
          dist3D(landmarks[8], palmCenter) +
          dist3D(landmarks[12], palmCenter) +
          dist3D(landmarks[16], palmCenter) +
          dist3D(landmarks[20], palmCenter)
        ) / 4;

        // Cek apakah tangan sedang terbuka lurus (jari telunjuk & tengah membentang keluar)
        const isIndexOpen = dist3D(landmarks[8], wrist) > dist3D(landmarks[6], wrist) * 1.05;
        const isMiddleOpen = dist3D(landmarks[12], wrist) > dist3D(landmarks[10], wrist) * 1.05;
        const isHandClearlyOpen = (isIndexOpen && isMiddleOpen) || avgTipToPalm > palmLength * 0.70;

        // Tangan MENUTUP BENAR-BENAR MENGGENGGAM:
        // Minimal 3 jari melipat ke telapak, ujung jari merapat ke pusat telapak, dan jari utama tidak terbuka
        const isGraspingFist = !isHandClearlyOpen && curledCount >= 3 && avgTipToPalm < palmLength * 0.60;

        // Cubitan presisi: hanya jika jempol & telunjuk sangat dekat DAN jari tengah ikut menekuk
        const pinchDistance = dist3D(landmarks[4], landmarks[8]);
        const pinching = pinchDistance < palmLength * 0.22 && (middleCurled || ringCurled);

        // Interaksi memegang bejana HANYA AKTIF jika tangan benar-benar menutup seperti menggenggam!
        const isHandGrabbing = isGraspingFist;

        if (isHandGrabbing) isAnyGrabbingCandidate = true;
        if (pinching) isAnyPinchingCandidate = true;

        // Tentukan tangan utama untuk interaksi 3D (Jika 1 tangan: gunakan tangan tersebut)
        if (handCount === 1 || isRightHand || !primaryHand3D) {
          primaryHand3D = h3D;

          // Pusat fisik telapak tangan (palm center)
          const palmCenterX = (wrist.x + middleMcp.x + indexMcp.x + pinkyMcp.x) / 4;
          const palmCenterY = (wrist.y + middleMcp.y + indexMcp.y + pinkyMcp.y) / 4;

          // Koordinat visual layar (0..1) dengan pencerminan horizontal -scale-x-100
          primaryScreenPos = {
            x: 1 - palmCenterX,
            y: palmCenterY,
          };

          // Hitung sudut rotasi pergelangan tangan (wrist roll / tilt)
          // Memiringkan tangan ke kanan (seperti menuang ke kanan) atau ke kiri
          const rawDx = -(middleMcp.x - wrist.x);
          const rawDy = -(middleMcp.y - wrist.y);
          const rawTiltAngle = Math.atan2(rawDx, rawDy);

          currentWristAngleRef.current += (rawTiltAngle - currentWristAngleRef.current) * 0.28;
        }

        if (handCount === 1 || isRightHand) {
          // ==========================================
          // ✋ TANGAN UTAMA: INTERAKSI & MEMEGANG BALOK
          // ==========================================
          rightHandDetected = true;
          lostRightCounterRef.current = 0;

          const label = isHandGrabbing ? "✊ Tangan Menggenggam (Memegang)" : "✋ Tangan Terbuka (Membidik)";
          const lineColor = isHandGrabbing ? "#f59e0b" : "#06b6d4";
          const jointColor = isHandGrabbing ? "#fbbf24" : "#22d3ee";

          drawHandSkeleton(ctx, landmarks, canvas.width, canvas.height, lineColor, jointColor, label, isHandGrabbing);

          setRightHandStatus(
            isHandGrabbing
              ? "✊ Menggenggam Bejana • Putar tangan untuk menuang"
              : "✋ Tangan Terbuka • Genggam/tutup tangan untuk ambil"
          );
        } else {
          // ==========================================
          // 🔍 TANGAN KEDUA: ZOOM IN / ZOOM OUT (SKALA)
          // ==========================================
          leftHandDetected = true;
          lostLeftCounterRef.current = 0;

          drawHandSkeleton(ctx, landmarks, canvas.width, canvas.height, "#ec4899", "#f43f5e", "🔍 Kiri: Zoom Meja", false);

          const thumbTip = landmarks[4];
          const indexTip = landmarks[8];
          const pDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
          const normalizedY = 1 - Math.min(Math.max((wrist.y - 0.15) / 0.65, 0), 1);
          const targetScale = 0.5 + normalizedY * 1.8 + Math.min(pDist * 2, 0.5);

          currentScaleRef.current += (targetScale - currentScaleRef.current) * 0.18;
          setCurrentScale(currentScaleRef.current);

          setLeftHandStatus(`🔍 Tangan Kiri: Zoom (${currentScaleRef.current.toFixed(2)}x)`);
        }
      }
    }

    // Konfirmasi grab dengan debounce: butuh 3 frame tangan benar-benar menggenggam untuk aktif, rilis instan saat membuka
    if (isAnyGrabbingCandidate) {
      grabFrameCounterRef.current = Math.min(grabFrameCounterRef.current + 1, 6);
    } else {
      grabFrameCounterRef.current = 0; // Tangan membuka: rilis seketika tanpa delay
    }
    const confirmedGrab = grabFrameCounterRef.current >= 3;

    // Grace period tangan kanan
    if (!rightHandDetected) {
      lostRightCounterRef.current += 1;
      if (lostRightCounterRef.current > 12) {
        prevRightHandPosRef.current = null;
        setRightHandStatus("Tangan: Arahkan tangan ke depan kamera");
      }
    }

    // Grace period tangan kiri
    if (!leftHandDetected) {
      lostLeftCounterRef.current += 1;
      if (lostLeftCounterRef.current > 12) {
        setLeftHandStatus("Tangan Kiri: Tidak aktif");
      }
    }

    const anyHand = rightHandDetected || leftHandDetected;
    const mode = rightHandDetected && leftHandDetected ? "dual" : rightHandDetected ? "rotate" : "zoom";

    onGestureUpdate({
      rotationX: currentRotationRef.current.x,
      rotationY: currentRotationRef.current.y,
      scale: currentScaleRef.current,
      isPinching: isAnyPinchingCandidate,
      isGrabbing: confirmedGrab,
      handDetected: anyHand,
      activeMode: mode,
      handPosition3D: anyHand ? primaryHand3D : undefined,
      handScreenPos: anyHand ? primaryScreenPos : undefined,
      wristAngle: anyHand ? currentWristAngleRef.current : 0,
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
  label: string,
  isGrabbing: boolean = false
) {
  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4], // Jempol
    [0, 5], [5, 6], [6, 7], [7, 8], // Telunjuk
    [5, 9], [9, 10], [10, 11], [11, 12], // Jari Tengah
    [9, 13], [13, 14], [14, 15], [15, 16], // Jari Manis
    [13, 17], [17, 18], [18, 19], [19, 20], // Kelingking
    [0, 17], // Telapak bawah
  ];

  // Neon glow effect on black background
  ctx.save();
  ctx.shadowBlur = 12;
  ctx.shadowColor = lineColor;

  // Draw lines
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  for (const [startIdx, endIdx] of connections) {
    const p1 = landmarks[startIdx];
    const p2 = landmarks[endIdx];
    ctx.beginPath();
    ctx.moveTo(p1.x * width, p1.y * height);
    ctx.lineTo(p2.x * width, p2.y * height);
    ctx.stroke();
  }

  // Draw joint points with luminous core
  for (let i = 0; i < landmarks.length; i++) {
    const p = landmarks[i];
    const isTip = i === 4 || i === 8 || i === 12 || i === 16 || i === 20;
    
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, isTip ? 6.5 : 4.5, 0, 2 * Math.PI);
    ctx.fillStyle = jointColor;
    ctx.shadowBlur = 15;
    ctx.shadowColor = jointColor;
    ctx.fill();

    // Inner bright white spark
    ctx.beginPath();
    ctx.arc(p.x * width, p.y * height, isTip ? 2.5 : 1.8, 0, 2 * Math.PI);
    ctx.fillStyle = "#ffffff";
    ctx.shadowBlur = 0;
    ctx.fill();
  }

  // =========================================================================
  // BULET-BULET SELECTOR RETICLE PERSIS DI TENGAH TELAPAK TANGAN
  // =========================================================================
  const palmCenterX = (landmarks[0].x + landmarks[5].x + landmarks[9].x + landmarks[17].x) / 4;
  const palmCenterY = (landmarks[0].y + landmarks[5].y + landmarks[9].y + landmarks[17].y) / 4;
  const pcx = palmCenterX * width;
  const pcy = palmCenterY * height;

  const selectorRadius = isGrabbing ? 14 : 19;
  const selectorColor = isGrabbing ? "#f59e0b" : "#00f5ff";

  // Outer glowing pulsing ring
  ctx.beginPath();
  ctx.arc(pcx, pcy, selectorRadius, 0, 2 * Math.PI);
  ctx.strokeStyle = selectorColor;
  ctx.lineWidth = 2.5;
  ctx.shadowBlur = 18;
  ctx.shadowColor = selectorColor;
  ctx.stroke();

  // Crosshair notches around the selector circle
  const tickLen = 5;
  for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 2) {
    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);
    ctx.beginPath();
    ctx.moveTo(pcx + cosA * (selectorRadius - 1), pcy + sinA * (selectorRadius - 1));
    ctx.lineTo(pcx + cosA * (selectorRadius + tickLen), pcy + sinA * (selectorRadius + tickLen));
    ctx.stroke();
  }

  // Inner solid core sphere
  ctx.beginPath();
  ctx.arc(pcx, pcy, isGrabbing ? 9 : 7, 0, 2 * Math.PI);
  ctx.fillStyle = selectorColor;
  ctx.fill();

  // Center white luminous core
  ctx.beginPath();
  ctx.arc(pcx, pcy, 3, 0, 2 * Math.PI);
  ctx.fillStyle = "#ffffff";
  ctx.shadowBlur = 0;
  ctx.fill();

  ctx.restore();

  // Draw floating label badge above wrist
  const wrist = landmarks[0];
  const px = Math.min(Math.max(wrist.x * width - 60, 10), Math.max(width - 200, 10));
  const py = Math.max(wrist.y * height - 20, 25);
  ctx.fillStyle = "rgba(10, 10, 12, 0.85)";
  ctx.beginPath();
  ctx.roundRect(px - 6, py - 14, 210, 20, 6);
  ctx.fill();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.font = "bold 11px sans-serif";
  ctx.fillStyle = lineColor;
  ctx.fillText(label, px, py);
}

// Helper menghitung jarak 3D Euclidean antara dua titik landmark
function dist3D(
  a: { x: number; y: number; z?: number },
  b: { x: number; y: number; z?: number }
): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = (a.z || 0) - (b.z || 0);
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Helper memeriksa apakah jari benar-benar melipat ke dalam telapak (genggaman/mengepal)
function isFingerTrulyCurled(
  tip: { x: number; y: number; z?: number },
  pip: { x: number; y: number; z?: number },
  mcp: { x: number; y: number; z?: number },
  wrist: { x: number; y: number; z?: number },
  palmCenter: { x: number; y: number; z?: number },
  palmLength: number
): boolean {
  const dTipWrist = dist3D(tip, wrist);
  const dPipWrist = dist3D(pip, wrist);
  const dTipPalm = dist3D(tip, palmCenter);
  const dTipMcp = dist3D(tip, mcp);

  // Jika ujung jari jelas lebih jauh daripada sendi PIP terhadap pergelangan tangan,
  // dan jarak ke telapak masih besar, maka jari PASTI TERBUKA LURUS
  if (dTipWrist > dPipWrist * 1.02 && dTipPalm > palmLength * 0.65) {
    return false;
  }

  // Jari dianggap menutup / menggenggam jika ujungnya melipat ke dalam telapak:
  const isTipCurledInward = dTipWrist <= dPipWrist * 1.0;
  const isTuckedCloseToPalm = dTipPalm < palmLength * 0.58;
  const isFoldedToKnuckle = dTipMcp < palmLength * 0.5;

  return (isTipCurledInward || isFoldedToKnuckle) && isTuckedCloseToPalm;
}
