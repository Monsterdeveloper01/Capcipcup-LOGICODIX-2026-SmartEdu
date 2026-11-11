"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import { ZoomIn, RotateCcw, Activity, Move, Sparkles } from "lucide-react";

export type HandDistancePreset = "close" | "normal" | "wide";
export type HandProximityHint = "optimal" | "too_close" | "none";

export interface TrackedHandSlot {
  id: "Left" | "Right";
  handScreenPos: { x: number; y: number };
  handPosition3D: { x: number; y: number; z: number };
  isGrabbing: boolean;
  isPinching: boolean;
  wristAngle: number;
  depthPush: number;
}

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
  hands?: TrackedHandSlot[];
}

interface HandGestureTrackerProps {
  videoElement: HTMLVideoElement | null;
  onGestureUpdate: (transform: HandTransform) => void;
  isActive: boolean;
  mode?: "lab" | "sandbox";
  showBuiltInHud?: boolean;
  distancePreset?: HandDistancePreset;
  onProximityHintChange?: (hint: HandProximityHint) => void;
}

const DISTANCE_ZONE_CONFIG: Record<
  HandDistancePreset,
  { minX: number; maxX: number; minY: number; maxY: number }
> = {
  // Posisi dekat (~25-55 cm): cukup gerakkan tangan di area tengah kamera (54% frame) untuk menjangkau seluruh meja lab
  close: { minX: 0.23, maxX: 0.77, minY: 0.22, maxY: 0.76 },
  // Posisi standar (~50-80 cm)
  normal: { minX: 0.14, maxX: 0.86, minY: 0.16, maxY: 0.82 },
  // Posisi jauh / penuh
  wide: { minX: 0.05, maxX: 0.95, minY: 0.08, maxY: 0.92 },
};

export default function HandGestureTracker({
  videoElement,
  onGestureUpdate,
  isActive,
  mode = "sandbox",
  showBuiltInHud = true,
  distancePreset,
  onProximityHintChange,
}: HandGestureTrackerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handLandmarkerRef = useRef<HandLandmarker | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const resolvedPreset: HandDistancePreset = distancePreset ?? (mode === "lab" ? "close" : "wide");
  const distancePresetRef = useRef<HandDistancePreset>(resolvedPreset);
  distancePresetRef.current = resolvedPreset;

  const modeRef = useRef<"lab" | "sandbox">(mode);
  modeRef.current = mode;

  const proximityHintRef = useRef<HandProximityHint>("none");
  const onProximityHintRef = useRef(onProximityHintChange);
  onProximityHintRef.current = onProximityHintChange;

  const [isModelLoading, setIsModelLoading] = useState(true);
  const [rightHandStatus, setRightHandStatus] = useState<string>("Tangan Kanan: Tidak terdeteksi");
  const [leftHandStatus, setLeftHandStatus] = useState<string>("Tangan Kiri: Tidak terdeteksi");
  const [currentScale, setCurrentScale] = useState<number>(1);

  // References for smooth state updates (60 FPS without React re-render bottleneck)
  const prevRightHandPosRef = useRef<{ x: number; y: number } | null>(null);
  const smoothedScreenPosRef = useRef<{ x: number; y: number } | null>(null);
  const smoothedPalmIsoRef = useRef<number | null>(null);
  const handSlotsRef = useRef<
    Record<
      "Left" | "Right",
      {
        lastRawPos: { x: number; y: number } | null;
        smoothedScreenPos: { x: number; y: number } | null;
        smoothedPalmIso: number | null;
        smoothedWristAngle: number;
        grabFrameCounter: number;
        lostCounter: number;
        active: boolean;
      }
    >
  >({
    Left: {
      lastRawPos: null,
      smoothedScreenPos: null,
      smoothedPalmIso: null,
      smoothedWristAngle: 0,
      grabFrameCounter: 0,
      lostCounter: 99,
      active: false,
    },
    Right: {
      lastRawPos: null,
      smoothedScreenPos: null,
      smoothedPalmIso: null,
      smoothedWristAngle: 0,
      grabFrameCounter: 0,
      lostCounter: 99,
      active: false,
    },
  });
  const currentRotationRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const currentScaleRef = useRef<number>(1);
  const currentWristAngleRef = useRef<number>(0);
  const lostRightCounterRef = useRef<number>(0);
  const lostLeftCounterRef = useRef<number>(0);
  const grabFrameCounterRef = useRef<number>(0);
  const lastVideoTimeRef = useRef<number>(-1);

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

        const maxHands = 2; // Selalu deteksi kedua tangan (Kiri & Kanan)
        const detectionConf = mode === "lab" ? 0.42 : 0.55;

        let landmarker: HandLandmarker;
        try {
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: modelPath,
              delegate: "GPU",
            },
            runningMode: "VIDEO",
            numHands: maxHands,
            minHandDetectionConfidence: detectionConf,
            minTrackingConfidence: detectionConf,
            minHandPresenceConfidence: detectionConf,
          });
        } catch {
          landmarker = await HandLandmarker.createFromOptions(vision, {
            baseOptions: {
              modelAssetPath: cdnModelPath,
              delegate: "CPU",
            },
            runningMode: "VIDEO",
            numHands: maxHands,
            minHandDetectionConfidence: detectionConf,
            minTrackingConfidence: detectionConf,
            minHandPresenceConfidence: detectionConf,
          });
        }

        if (isCancelled) return;

        handLandmarkerRef.current = landmarker;
        setIsModelLoading(false);
      } catch (err: any) {
        console.error("Gagal inisialisasi MediaPipe Hands:", err);
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
  }, [isActive, mode]);

  // 2. Main Detection Loop: Dual Hands Tracking
  const detectHands = useCallback(() => {
    if (
      !isActive ||
      !videoElement ||
      !canvasRef.current ||
      !handLandmarkerRef.current ||
      videoElement.readyState < 2 ||
      videoElement.videoWidth === 0 ||
      videoElement.videoHeight === 0
    ) {
      animationFrameRef.current = requestAnimationFrame(detectHands);
      return;
    }

    // Hindari inferensi berulang pada frame video yang sama (sinkronisasi dengan framerate webcam nyata)
    if (videoElement.currentTime === lastVideoTimeRef.current) {
      animationFrameRef.current = requestAnimationFrame(detectHands);
      return;
    }
    lastVideoTimeRef.current = videoElement.currentTime;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const targetW =
      modeRef.current === "lab"
        ? Math.max(canvas.clientWidth || videoElement.videoWidth, 1)
        : videoElement.videoWidth;
    const targetH =
      modeRef.current === "lab"
        ? Math.max(canvas.clientHeight || videoElement.videoHeight, 1)
        : videoElement.videoHeight;

    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
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

    // =========================================================================
    // MODE LAB 3D: PELACAKAN 2 TANGAN SIMULTAN + SARUNG TANGAN LAB NITRILE
    // Baik tangan kiri maupun tangan kanan dapat membidik, menggenggam, & menuang objek!
    // =========================================================================
    if (modeRef.current === "lab") {
      const vidAspect = videoElement.videoWidth / Math.max(videoElement.videoHeight, 1);
      const zone = DISTANCE_ZONE_CONFIG[distancePresetRef.current];
      const neutralProximity =
        distancePresetRef.current === "close"
          ? 0.23
          : distancePresetRef.current === "normal"
          ? 0.18
          : 0.14;

      interface LabHandCandidate {
        landmarks: Array<{ x: number; y: number; z?: number }>;
        rawX: number;
        rawY: number;
        h3D: { x: number; y: number; z: number };
        isGrabbing: boolean;
        isPinching: boolean;
        rawTiltAngle: number;
        rawProximity: number;
      }

      const candidates: LabHandCandidate[] = [];

      if (results.landmarks && results.landmarks.length > 0) {
        for (let i = 0; i < results.landmarks.length; i++) {
          const landmarks = results.landmarks[i];
          const wrist = landmarks[0];
          const indexMcp = landmarks[5];
          const middleMcp = landmarks[9];
          const pinkyMcp = landmarks[17];
          const palmLength = Math.max(dist3D(wrist, middleMcp), 0.08);

          const palmCenter = {
            x: (wrist.x + middleMcp.x + indexMcp.x + pinkyMcp.x) / 4,
            y: (wrist.y + middleMcp.y + indexMcp.y + pinkyMcp.y) / 4,
            z: ((wrist.z || 0) + (middleMcp.z || 0) + (indexMcp.z || 0) + (pinkyMcp.z || 0)) / 4,
          };

          const indexCurled = isFingerTrulyCurled(landmarks[8], landmarks[6], landmarks[5], wrist, palmCenter, palmLength);
          const middleCurled = isFingerTrulyCurled(landmarks[12], landmarks[10], landmarks[9], wrist, palmCenter, palmLength);
          const ringCurled = isFingerTrulyCurled(landmarks[16], landmarks[14], landmarks[13], wrist, palmCenter, palmLength);
          const pinkyCurled = isFingerTrulyCurled(landmarks[20], landmarks[18], landmarks[17], wrist, palmCenter, palmLength);

          let curledCount = 0;
          if (indexCurled) curledCount++;
          if (middleCurled) curledCount++;
          if (ringCurled) curledCount++;
          if (pinkyCurled) curledCount++;

          const avgTipToPalm =
            (dist3D(landmarks[8], palmCenter) +
              dist3D(landmarks[12], palmCenter) +
              dist3D(landmarks[16], palmCenter) +
              dist3D(landmarks[20], palmCenter)) /
            4;

          const isIndexOpen = dist3D(landmarks[8], wrist) > dist3D(landmarks[6], wrist) * 1.05;
          const isMiddleOpen = dist3D(landmarks[12], wrist) > dist3D(landmarks[10], wrist) * 1.05;
          const isHandClearlyOpen = (isIndexOpen && isMiddleOpen) || avgTipToPalm > palmLength * 0.7;
          const isGraspingFist = !isHandClearlyOpen && curledCount >= 3 && avgTipToPalm < palmLength * 0.6;

          const pinchDistance = dist3D(landmarks[4], landmarks[8]);
          const pinching = pinchDistance < palmLength * 0.22 && (middleCurled || ringCurled);

          const palmLenIso = Math.hypot((middleMcp.x - wrist.x) * vidAspect, middleMcp.y - wrist.y);
          const palmWidthIso = Math.hypot((pinkyMcp.x - indexMcp.x) * vidAspect, pinkyMcp.y - indexMcp.y);
          const rawProximity = Math.max(palmLenIso, palmWidthIso * 1.45);

          const rawDx = -(middleMcp.x - wrist.x);
          const rawDy = -(middleMcp.y - wrist.y);

          candidates.push({
            landmarks,
            rawX: 1 - palmCenter.x,
            rawY: palmCenter.y,
            h3D: {
              x: (0.5 - middleMcp.x) * 8.5,
              y: Math.max((1 - middleMcp.y) * 4.2 + 0.2, 0.3),
              z: (middleMcp.z || 0) * 5,
            },
            isGrabbing: isGraspingFist,
            isPinching: pinching,
            rawTiltAngle: Math.atan2(rawDx, rawDy),
            rawProximity,
          });
        }
      }

      // Pemetaan slot Kiri & Kanan secara stabil berbasis posisi sebelumnya (mencegah swap saat menyilang)
      const assigned: Partial<Record<"Left" | "Right", LabHandCandidate>> = {};
      const slots = handSlotsRef.current;
      const leftWasActive = slots.Left.lostCounter < 10 && slots.Left.lastRawPos !== null;
      const rightWasActive = slots.Right.lostCounter < 10 && slots.Right.lastRawPos !== null;

      if (candidates.length === 1) {
        const c = candidates[0];
        if (leftWasActive && rightWasActive && slots.Left.lastRawPos && slots.Right.lastRawPos) {
          const dLeft = Math.hypot(c.rawX - slots.Left.lastRawPos.x, c.rawY - slots.Left.lastRawPos.y);
          const dRight = Math.hypot(c.rawX - slots.Right.lastRawPos.x, c.rawY - slots.Right.lastRawPos.y);
          assigned[dLeft <= dRight ? "Left" : "Right"] = c;
        } else if (leftWasActive && !rightWasActive) {
          assigned.Left = c;
        } else if (rightWasActive && !leftWasActive) {
          assigned.Right = c;
        } else {
          assigned[c.rawX < 0.5 ? "Left" : "Right"] = c;
        }
      } else if (candidates.length >= 2) {
        const c0 = candidates[0];
        const c1 = candidates[1];
        if (leftWasActive && rightWasActive && slots.Left.lastRawPos && slots.Right.lastRawPos) {
          const costNormal =
            Math.hypot(c0.rawX - slots.Left.lastRawPos.x, c0.rawY - slots.Left.lastRawPos.y) +
            Math.hypot(c1.rawX - slots.Right.lastRawPos.x, c1.rawY - slots.Right.lastRawPos.y);
          const costSwapped =
            Math.hypot(c1.rawX - slots.Left.lastRawPos.x, c1.rawY - slots.Left.lastRawPos.y) +
            Math.hypot(c0.rawX - slots.Right.lastRawPos.x, c0.rawY - slots.Right.lastRawPos.y);
          if (costNormal <= costSwapped) {
            assigned.Left = c0;
            assigned.Right = c1;
          } else {
            assigned.Left = c1;
            assigned.Right = c0;
          }
        } else if (c0.rawX <= c1.rawX) {
          assigned.Left = c0;
          assigned.Right = c1;
        } else {
          assigned.Left = c1;
          assigned.Right = c0;
        }
      }

      const activeLabHands: TrackedHandSlot[] = [];
      let anyTooClose = false;

      (["Left", "Right"] as const).forEach((slotId) => {
        const cand = assigned[slotId];
        const slot = slots[slotId];

        if (!cand) {
          slot.lostCounter += 1;
          if (slot.lostCounter > 16) {
            slot.active = false;
            slot.lastRawPos = null;
            slot.smoothedScreenPos = null;
            slot.smoothedPalmIso = null;
            slot.grabFrameCounter = 0;
          }
          return;
        }

        slot.active = true;
        slot.lostCounter = 0;
        slot.lastRawPos = { x: cand.rawX, y: cand.rawY };

        slot.smoothedPalmIso =
          slot.smoothedPalmIso === null
            ? cand.rawProximity
            : slot.smoothedPalmIso + (cand.rawProximity - slot.smoothedPalmIso) * 0.25;

        if (slot.smoothedPalmIso > 0.4) anyTooClose = true;

        const depthPush = Math.min(
          Math.max((slot.smoothedPalmIso - neutralProximity) / 0.12, -0.8),
          1.0
        );

        const mappedX = Math.min(Math.max((cand.rawX - zone.minX) / (zone.maxX - zone.minX), 0.03), 0.97);
        const baseMappedY = (cand.rawY - zone.minY) / (zone.maxY - zone.minY);
        const mappedY = Math.min(Math.max(baseMappedY - depthPush * 0.18, 0.08), 0.92);

        if (!slot.smoothedScreenPos) {
          slot.smoothedScreenPos = { x: mappedX, y: mappedY };
        } else {
          slot.smoothedScreenPos = {
            x: slot.smoothedScreenPos.x + (mappedX - slot.smoothedScreenPos.x) * 0.48,
            y: slot.smoothedScreenPos.y + (mappedY - slot.smoothedScreenPos.y) * 0.48,
          };
        }

        slot.smoothedWristAngle =
          slot.smoothedWristAngle + (cand.rawTiltAngle - slot.smoothedWristAngle) * 0.55;

        if (cand.isGrabbing) {
          slot.grabFrameCounter = Math.min(slot.grabFrameCounter + 1, 4);
        } else {
          slot.grabFrameCounter = 0;
        }
        const confirmedSlotGrab = slot.grabFrameCounter >= 1;

        const handSlotObj: TrackedHandSlot = {
          id: slotId,
          handScreenPos: slot.smoothedScreenPos,
          handPosition3D: cand.h3D,
          isGrabbing: confirmedSlotGrab,
          isPinching: cand.isPinching,
          wristAngle: slot.smoothedWristAngle,
          depthPush,
        };
        activeLabHands.push(handSlotObj);

        drawLabGlove(
          ctx,
          cand.landmarks,
          canvas.width,
          canvas.height,
          vidAspect,
          slot.smoothedScreenPos,
          depthPush,
          slotId,
          confirmedSlotGrab
        );
      });

      const nextHint: HandProximityHint =
        activeLabHands.length === 0 ? "none" : anyTooClose ? "too_close" : "optimal";
      if (proximityHintRef.current !== nextHint) {
        proximityHintRef.current = nextHint;
        onProximityHintRef.current?.(nextHint);
      }

      const primarySlot =
        activeLabHands.find((h) => h.id === "Right") || activeLabHands[0] || undefined;

      onGestureUpdate({
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        isPinching: activeLabHands.some((h) => h.isPinching),
        isGrabbing: activeLabHands.some((h) => h.isGrabbing),
        handDetected: activeLabHands.length > 0,
        activeMode: activeLabHands.length > 1 ? "dual" : "rotate",
        handPosition3D: primarySlot?.handPosition3D,
        handScreenPos: primarySlot?.handScreenPos,
        wristAngle: primarySlot?.wristAngle ?? 0,
        hands: activeLabHands,
      });

      animationFrameRef.current = requestAnimationFrame(detectHands);
      return;
    }

    // =========================================================================
    // MODE SANDBOX 3D: PELACAKAN BAWAAN (UNTUK SmartEduViewer)
    // =========================================================================
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

        // DETEKSI FISIK TANGAN MENUTUP (GENGGAMAN / FIST)
        const palmCenter = {
          x: (wrist.x + middleMcp.x + indexMcp.x + pinkyMcp.x) / 4,
          y: (wrist.y + middleMcp.y + indexMcp.y + pinkyMcp.y) / 4,
          z: ((wrist.z || 0) + (middleMcp.z || 0) + (indexMcp.z || 0) + (pinkyMcp.z || 0)) / 4,
        };

        const indexCurled = isFingerTrulyCurled(landmarks[8], landmarks[6], landmarks[5], wrist, palmCenter, palmLength);
        const middleCurled = isFingerTrulyCurled(landmarks[12], landmarks[10], landmarks[9], wrist, palmCenter, palmLength);
        const ringCurled = isFingerTrulyCurled(landmarks[16], landmarks[14], landmarks[13], wrist, palmCenter, palmLength);
        const pinkyCurled = isFingerTrulyCurled(landmarks[20], landmarks[18], landmarks[17], wrist, palmCenter, palmLength);

        let curledCount = 0;
        if (indexCurled) curledCount++;
        if (middleCurled) curledCount++;
        if (ringCurled) curledCount++;
        if (pinkyCurled) curledCount++;

        const avgTipToPalm = (
          dist3D(landmarks[8], palmCenter) +
          dist3D(landmarks[12], palmCenter) +
          dist3D(landmarks[16], palmCenter) +
          dist3D(landmarks[20], palmCenter)
        ) / 4;

        const isIndexOpen = dist3D(landmarks[8], wrist) > dist3D(landmarks[6], wrist) * 1.05;
        const isMiddleOpen = dist3D(landmarks[12], wrist) > dist3D(landmarks[10], wrist) * 1.05;
        const isHandClearlyOpen = (isIndexOpen && isMiddleOpen) || avgTipToPalm > palmLength * 0.70;
        const isGraspingFist = !isHandClearlyOpen && curledCount >= 3 && avgTipToPalm < palmLength * 0.60;

        const pinchDistance = dist3D(landmarks[4], landmarks[8]);
        const pinching = pinchDistance < palmLength * 0.22 && (middleCurled || ringCurled);
        const isHandGrabbing = isGraspingFist;

        if (isHandGrabbing) isAnyGrabbingCandidate = true;
        if (pinching) isAnyPinchingCandidate = true;

        if (handCount === 1 || isRightHand || !primaryHand3D) {
          primaryHand3D = h3D;
          const palmCenterX = (wrist.x + middleMcp.x + indexMcp.x + pinkyMcp.x) / 4;
          const palmCenterY = (wrist.y + middleMcp.y + indexMcp.y + pinkyMcp.y) / 4;

          primaryScreenPos = {
            x: 1 - palmCenterX,
            y: palmCenterY,
          };

          const rawDx = -(middleMcp.x - wrist.x);
          const rawDy = -(middleMcp.y - wrist.y);
          const rawTiltAngle = Math.atan2(rawDx, rawDy);
          currentWristAngleRef.current += (rawTiltAngle - currentWristAngleRef.current) * 0.55;
        }

        if (handCount === 1 || isRightHand) {
          rightHandDetected = true;
          lostRightCounterRef.current = 0;

          const label = isHandGrabbing ? "Menggenggam" : "Tangan Terbuka";
          const lineColor = isHandGrabbing ? "#f59e0b" : "#06b6d4";
          const jointColor = isHandGrabbing ? "#fbbf24" : "#22d3ee";
          drawHandSkeleton(ctx, landmarks, canvas.width, canvas.height, lineColor, jointColor, label, isHandGrabbing);

          const newRightStatus = isHandGrabbing
            ? "Menggenggam • Putar tangan untuk menuang"
            : "Tangan Terbuka • Genggam/tutup tangan untuk ambil";
          setRightHandStatus((prev) => (prev !== newRightStatus ? newRightStatus : prev));
        } else {
          leftHandDetected = true;
          lostLeftCounterRef.current = 0;

          drawHandSkeleton(ctx, landmarks, canvas.width, canvas.height, "#ec4899", "#f43f5e", "Kiri: Zoom Meja", false);

          const thumbTip = landmarks[4];
          const indexTip = landmarks[8];
          const pDist = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);
          const normalizedY = 1 - Math.min(Math.max((wrist.y - 0.15) / 0.65, 0), 1);
          const targetScale = 0.5 + normalizedY * 1.8 + Math.min(pDist * 2, 0.5);

          currentScaleRef.current += (targetScale - currentScaleRef.current) * 0.35;
          if (Math.abs(currentScaleRef.current - currentScale) > 0.04) {
            setCurrentScale(currentScaleRef.current);
            setLeftHandStatus(`Tangan Kiri: Zoom (${currentScaleRef.current.toFixed(2)}x)`);
          }
        }
      }
    }

    if (isAnyGrabbingCandidate) {
      grabFrameCounterRef.current = Math.min(grabFrameCounterRef.current + 1, 4);
    } else {
      grabFrameCounterRef.current = 0;
    }
    const confirmedGrab = grabFrameCounterRef.current >= 1;

    if (!rightHandDetected) {
      lostRightCounterRef.current += 1;
      if (lostRightCounterRef.current > 12) {
        prevRightHandPosRef.current = null;
        setRightHandStatus("Tangan: Arahkan tangan ke depan kamera");
      }
    }

    if (!leftHandDetected) {
      lostLeftCounterRef.current += 1;
      if (lostLeftCounterRef.current > 12) {
        setLeftHandStatus("Tangan Kiri: Tidak aktif");
      }
    }

    const anyHand = rightHandDetected || leftHandDetected;
    const sandboxMode = rightHandDetected && leftHandDetected ? "dual" : rightHandDetected ? "rotate" : "zoom";

    onGestureUpdate({
      rotationX: currentRotationRef.current.x,
      rotationY: currentRotationRef.current.y,
      scale: currentScaleRef.current,
      isPinching: isAnyPinchingCandidate,
      isGrabbing: confirmedGrab,
      handDetected: anyHand,
      activeMode: sandboxMode,
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
      <canvas
        ref={canvasRef}
        className={
          mode === "lab"
            ? "w-full h-full block"
            : "w-full h-full object-cover -scale-x-100"
        }
      />

      {showBuiltInHud && (
        <>
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
        </>
      )}
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

  ctx.save();

  // 1. Contrast drop-shadow / dark outline (Ensures 100% visibility against bright white lab tables)
  ctx.strokeStyle = "rgba(15, 23, 42, 0.75)";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowBlur = 0;

  for (const [startIdx, endIdx] of connections) {
    const p1 = landmarks[startIdx];
    const p2 = landmarks[endIdx];
    ctx.beginPath();
    ctx.moveTo(p1.x * width, p1.y * height);
    ctx.lineTo(p2.x * width, p2.y * height);
    ctx.stroke();
  }

  // 2. High-visibility luminous skeleton bone lines
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 3.5;
  ctx.shadowBlur = 12;
  ctx.shadowColor = lineColor;

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

  // Outer ring with contrast dark shadow backing
  ctx.beginPath();
  ctx.arc(pcx, pcy, selectorRadius, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(15, 23, 42, 0.75)";
  ctx.lineWidth = 4.5;
  ctx.shadowBlur = 0;
  ctx.stroke();

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

// Helper: Menggambar kapsul meruncing halus (dipakai untuk jari dan pergelangan sarung tangan lab)
function fillTaperedCapsule(
  ctx: CanvasRenderingContext2D,
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  r1: number,
  r2: number
) {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const len = Math.hypot(dx, dy);

  ctx.beginPath();
  ctx.arc(p1.x, p1.y, r1, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(p2.x, p2.y, r2, 0, Math.PI * 2);
  ctx.fill();

  if (len > 0.5) {
    const nx = -dy / len;
    const ny = dx / len;
    ctx.beginPath();
    ctx.moveTo(p1.x + nx * r1, p1.y + ny * r1);
    ctx.lineTo(p2.x + nx * r2, p2.y + ny * r2);
    ctx.lineTo(p2.x - nx * r2, p2.y - ny * r2);
    ctx.lineTo(p1.x - nx * r1, p1.y - ny * r1);
    ctx.closePath();
    ctx.fill();
  }
}

// Helper: Menggambar Sarung Tangan Lab Nitrile 2D Anatomis (Menggantikan tampilan kerangka skeleton)
// Menggunakan 2-pass contour agar jari, telapak, dan manset pergelangan menyatu mulus seperti sarung tangan karet asli.
function drawLabGlove(
  ctx: CanvasRenderingContext2D,
  landmarks: Array<{ x: number; y: number }>,
  width: number,
  height: number,
  videoAspect: number,
  screenPos: { x: number; y: number },
  depthPush: number,
  slotId: "Left" | "Right",
  isGrabbing: boolean
) {
  const palmCenterX = (landmarks[0].x + landmarks[5].x + landmarks[9].x + landmarks[17].x) / 4;
  const palmCenterY = (landmarks[0].y + landmarks[5].y + landmarks[9].y + landmarks[17].y) / 4;

  const palmIso = Math.max(
    Math.hypot((landmarks[9].x - landmarks[0].x) * videoAspect, landmarks[9].y - landmarks[0].y),
    0.05
  );

  // Ukuran telapak proporsional & perspektif kedalaman terbalik (mendekat ke kamera = masuk ke ruang lab)
  const u = Math.min(Math.max(68 - depthPush * 16, 46), 78);
  const scalePx = u / palmIso;

  const pcx = screenPos.x * width;
  const pcy = screenPos.y * height;

  const pts = landmarks.map((lm) => ({
    x: pcx - (lm.x - palmCenterX) * videoAspect * scalePx,
    y: pcy + (lm.y - palmCenterY) * scalePx,
  }));

  // Arah pergelangan & manset sarung tangan
  const w = pts[0];
  const m = pts[9];
  const axisDx = w.x - m.x;
  const axisDy = w.y - m.y;
  const axisLen = Math.max(Math.hypot(axisDx, axisDy), 1);
  const dirX = axisDx / axisLen;
  const dirY = axisDy / axisLen;
  const perpX = -dirY;
  const perpY = dirX;

  const cuffStart = { x: w.x + dirX * (u * 0.06), y: w.y + dirY * (u * 0.06) };
  const cuffEnd = { x: w.x + dirX * (u * 0.44), y: w.y + dirY * (u * 0.44) };
  const cuffHalfTop = u * 0.36;
  const cuffHalfBot = u * 0.42;

  // Poligon telapak sarung tangan diperluas sedikit di bagian sisi agar tampak berisi
  const palmIndices = [0, 1, 2, 5, 9, 13, 17];
  const palmPoly = palmIndices.map((idx) => {
    const p = pts[idx];
    const ox = p.x - pcx;
    const oy = p.y - pcy;
    const ol = Math.max(Math.hypot(ox, oy), 1);
    const expand = idx === 0 ? u * 0.14 : u * 0.15;
    return { x: p.x + (ox / ol) * expand, y: p.y + (oy / ol) * expand };
  });

  // Definisi rantai jari + ketebalan jari sarung tangan (berurutan agar tumpukan jari realistis)
  const fingers: Array<{ indices: number[]; radii: number[] }> = [
    { indices: [17, 18, 19, 20], radii: [u * 0.14, u * 0.125, u * 0.115, u * 0.1] }, // Kelingking
    { indices: [13, 14, 15, 16], radii: [u * 0.15, u * 0.135, u * 0.125, u * 0.105] }, // Manis
    { indices: [9, 10, 11, 12], radii: [u * 0.16, u * 0.145, u * 0.135, u * 0.11] }, // Tengah
    { indices: [5, 6, 7, 8], radii: [u * 0.16, u * 0.145, u * 0.13, u * 0.11] }, // Telunjuk
    { indices: [1, 2, 3, 4], radii: [u * 0.21, u * 0.18, u * 0.155, u * 0.135] }, // Jempol
  ];

  // Palet warna Nitrile Lab Glove (Biru Nitrile Laboratorium + indikator cengkeraman hangat saat menggenggam)
  const gloveLight = isGrabbing ? "#BAE6FD" : "#E0F2FE";
  const gloveMid = isGrabbing ? "#38BDF8" : "#60A5FA";
  const gloveDark = isGrabbing ? "#0284C7" : "#2563EB";
  const inkColor = "#0F172A";
  const outlinePad = Math.max(u * 0.042, 2.4);

  ctx.save();
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // =========================================================================
  // PASS 1: BAYANGAN HALUS + KONTUR LUAR TERPADU (OUTLINE TANPA GARIS PUTUS)
  // =========================================================================
  ctx.shadowColor = "rgba(15, 23, 42, 0.28)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;
  ctx.fillStyle = inkColor;

  // 1a. Kontur manset pergelangan
  ctx.beginPath();
  ctx.moveTo(cuffStart.x + perpX * (cuffHalfTop + outlinePad), cuffStart.y + perpY * (cuffHalfTop + outlinePad));
  ctx.lineTo(cuffEnd.x + perpX * (cuffHalfBot + outlinePad), cuffEnd.y + perpY * (cuffHalfBot + outlinePad));
  ctx.lineTo(cuffEnd.x - perpX * (cuffHalfBot + outlinePad), cuffEnd.y - perpY * (cuffHalfBot + outlinePad));
  ctx.lineTo(cuffStart.x - perpX * (cuffHalfTop + outlinePad), cuffStart.y - perpY * (cuffHalfTop + outlinePad));
  ctx.closePath();
  ctx.fill();

  // Matikan shadow untuk bagian selanjutnya agar tidak menumpuk
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // 1b. Kontur telapak
  ctx.beginPath();
  palmPoly.forEach((p, idx) => {
    const ox = p.x - pcx;
    const oy = p.y - pcy;
    const ol = Math.max(Math.hypot(ox, oy), 1);
    const px = p.x + (ox / ol) * outlinePad;
    const py = p.y + (oy / ol) * outlinePad;
    if (idx === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.closePath();
  ctx.fill();

  // 1c. Kontur semua jari sarung tangan
  for (const finger of fingers) {
    for (let s = 0; s < finger.indices.length - 1; s++) {
      const p1 = pts[finger.indices[s]];
      const p2 = pts[finger.indices[s + 1]];
      fillTaperedCapsule(
        ctx,
        p1,
        p2,
        finger.radii[s] + outlinePad,
        finger.radii[s + 1] + outlinePad
      );
    }
  }

  // =========================================================================
  // PASS 2: ISI BAHAN KARET NITRILE SARUNG TANGAN (MANSET + TELAPAK + JARI)
  // =========================================================================
  const palmGrad = ctx.createLinearGradient(m.x, m.y, cuffEnd.x, cuffEnd.y);
  palmGrad.addColorStop(0, gloveMid);
  palmGrad.addColorStop(1, gloveDark);

  // 2a. Isi manset pergelangan
  ctx.fillStyle = palmGrad;
  ctx.beginPath();
  ctx.moveTo(cuffStart.x + perpX * cuffHalfTop, cuffStart.y + perpY * cuffHalfTop);
  ctx.lineTo(cuffEnd.x + perpX * cuffHalfBot, cuffEnd.y + perpY * cuffHalfBot);
  ctx.lineTo(cuffEnd.x - perpX * cuffHalfBot, cuffEnd.y - perpY * cuffHalfBot);
  ctx.lineTo(cuffStart.x - perpX * cuffHalfTop, cuffStart.y - perpY * cuffHalfTop);
  ctx.closePath();
  ctx.fill();

  // 2b. Isi telapak tangan
  ctx.fillStyle = palmGrad;
  ctx.beginPath();
  palmPoly.forEach((p, idx) => {
    if (idx === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.closePath();
  ctx.fill();

  // Garis lipatan telapak nitrile halus
  ctx.strokeStyle = "rgba(12, 74, 110, 0.28)";
  ctx.lineWidth = Math.max(u * 0.025, 1.4);
  ctx.beginPath();
  ctx.moveTo(pts[5].x * 0.7 + pcx * 0.3, pts[5].y * 0.7 + pcy * 0.3);
  ctx.quadraticCurveTo(pcx, pcy + u * 0.08, pts[17].x * 0.75 + pcx * 0.25, pts[17].y * 0.75 + pcy * 0.25);
  ctx.stroke();

  // 2c. Isi setiap jari dengan sedikit bayangan batas antar-jari agar saat mengepal jari tetap terlihat jelas
  for (const finger of fingers) {
    // Batas bayangan tipis jari di atas telapak
    ctx.fillStyle = "rgba(12, 74, 110, 0.36)";
    for (let s = 0; s < finger.indices.length - 1; s++) {
      const p1 = pts[finger.indices[s]];
      const p2 = pts[finger.indices[s + 1]];
      fillTaperedCapsule(ctx, p1, p2, finger.radii[s] + 1.2, finger.radii[s + 1] + 1.2);
    }

    // Bahan nitrile jari yang lebih terang
    const basePt = pts[finger.indices[0]];
    const tipPt = pts[finger.indices[finger.indices.length - 1]];
    const fingerGrad = ctx.createLinearGradient(tipPt.x, tipPt.y, basePt.x, basePt.y);
    fingerGrad.addColorStop(0, gloveLight);
    fingerGrad.addColorStop(0.55, gloveMid);
    fingerGrad.addColorStop(1, gloveDark);
    ctx.fillStyle = fingerGrad;

    for (let s = 0; s < finger.indices.length - 1; s++) {
      const p1 = pts[finger.indices[s]];
      const p2 = pts[finger.indices[s + 1]];
      fillTaperedCapsule(ctx, p1, p2, finger.radii[s], finger.radii[s + 1]);
    }

    // Kilau karet nitrile pada ujung & punggung jari
    ctx.strokeStyle = "rgba(255, 255, 255, 0.45)";
    ctx.lineWidth = Math.max(u * 0.03, 1.5);
    const pipPt = pts[finger.indices[1]];
    const dipPt = pts[finger.indices[2]];
    ctx.beginPath();
    ctx.moveTo(pipPt.x, pipPt.y);
    ctx.lineTo(dipPt.x, dipPt.y);
    ctx.stroke();

    // Garis lipatan buku jari (PIP)
    ctx.strokeStyle = "rgba(12, 74, 110, 0.25)";
    ctx.lineWidth = Math.max(u * 0.02, 1.1);
    const segDx = dipPt.x - pipPt.x;
    const segDy = dipPt.y - pipPt.y;
    const segLen = Math.max(Math.hypot(segDx, segDy), 1);
    const fnx = -segDy / segLen;
    const fny = segDx / segLen;
    const creaseHalf = finger.radii[1] * 0.55;
    ctx.beginPath();
    ctx.moveTo(pipPt.x - fnx * creaseHalf, pipPt.y - fny * creaseHalf);
    ctx.lineTo(pipPt.x + fnx * creaseHalf, pipPt.y + fny * creaseHalf);
    ctx.stroke();
  }

  // =========================================================================
  // PASS 3: MANSET GULUNGAN SARUNG TANGAN + INDIKATOR BIDIK TELAPAK
  // =========================================================================
  // Manset gulung (rolled glove cuff) di ujung bawah pergelangan
  const cuffRimWidth = Math.max(u * 0.11, 6);
  const rimA = { x: cuffEnd.x + perpX * cuffHalfBot, y: cuffEnd.y + perpY * cuffHalfBot };
  const rimB = { x: cuffEnd.x - perpX * cuffHalfBot, y: cuffEnd.y - perpY * cuffHalfBot };

  ctx.strokeStyle = inkColor;
  ctx.lineWidth = cuffRimWidth + outlinePad * 1.6;
  ctx.beginPath();
  ctx.moveTo(rimA.x, rimA.y);
  ctx.lineTo(rimB.x, rimB.y);
  ctx.stroke();

  ctx.strokeStyle = "#E0F2FE";
  ctx.lineWidth = cuffRimWidth;
  ctx.beginPath();
  ctx.moveTo(rimA.x, rimA.y);
  ctx.lineTo(rimB.x, rimB.y);
  ctx.stroke();

  // Label huruf kecil "L" / "R" di pergelangan sarung tangan
  const tagPos = {
    x: (cuffStart.x + cuffEnd.x) * 0.5,
    y: (cuffStart.y + cuffEnd.y) * 0.5,
  };
  ctx.font = `900 ${Math.max(Math.round(u * 0.16), 9)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#FFFFFF";
  ctx.fillText(slotId === "Left" ? "L" : "R", tagPos.x, tagPos.y);

  // Titik bidik presisi di tengah telapak (kuning/amber saat menggenggam, putih/sian saat terbuka)
  const reticleR = isGrabbing ? Math.max(u * 0.13, 6) : Math.max(u * 0.11, 5);
  ctx.beginPath();
  ctx.arc(pcx, pcy, reticleR, 0, Math.PI * 2);
  ctx.fillStyle = isGrabbing ? "#F59E0B" : "#FFFFFF";
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = inkColor;
  ctx.stroke();

  ctx.restore();
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
