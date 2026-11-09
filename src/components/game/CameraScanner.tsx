"use client";

import { useState, useRef, useEffect } from "react";
import { Camera, Upload, AlertCircle, RefreshCw, Zap } from "lucide-react";
import { detectObjectWithYolo, YoloDetection } from "@/lib/python-api";
import VocabCardModal from "./VocabCardModal";

interface CameraScannerProps {
  requiredHint?: string;
  onObjectConfirmed: (detection: YoloDetection) => void;
}

export default function CameraScanner({
  requiredHint = "Arahkan kamera ke botol minum atau buku di mejamu!",
  onObjectConfirmed,
}: CameraScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [activeDetections, setActiveDetections] = useState<YoloDetection[]>([]);
  const [selectedDetection, setSelectedDetection] = useState<YoloDetection | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const stopMediaTracks = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try { track.stop(); } catch (e) {}
      });
      streamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const ms = videoRef.current.srcObject as MediaStream;
      if (ms && typeof ms.getTracks === "function") {
        ms.getTracks().forEach((track) => {
          try { track.stop(); } catch (e) {}
        });
      }
      videoRef.current.srcObject = null;
    }
  };

  const stopCameraStream = () => {
    stopMediaTracks();
    setIsCameraActive(false);
  };

  const getCameraStream = async (): Promise<MediaStream> => {
    if (typeof window === "undefined" || !navigator?.mediaDevices?.getUserMedia) {
      throw new Error("Perangkat atau browser tidak mendukung akses webcam (kamera membutuhkan HTTPS atau localhost).");
    }

    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
    } catch (e1) {
      console.warn("CameraScanner Tier 1 failed:", e1);
    }

    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "user" }, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
    } catch (e2) {
      console.warn("CameraScanner Tier 2 failed:", e2);
    }

    return await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
  };

  useEffect(() => {
    let isCancelled = false;

    if (isCameraActive) {
      setErrorMsg(null);
      getCameraStream()
        .then((s) => {
          if (isCancelled) {
            s.getTracks().forEach((t) => {
              try { t.stop(); } catch (e) {}
            });
            return;
          }
          stopMediaTracks();
          streamRef.current = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.onloadedmetadata = () => {
              videoRef.current?.play().catch(() => {});
            };
          }
        })
        .catch((err) => {
          if (isCancelled) return;
          console.warn("Camera stream error:", err);
          stopMediaTracks();
          setErrorMsg("Izin kamera ditolak atau kamera tidak ditemukan. Anda dapat mengunggah foto.");
        });
    } else {
      stopMediaTracks();
    }

    return () => {
      isCancelled = true;
      stopMediaTracks();
    };
  }, [isCameraActive]);

  const captureFrameAndDetect = async () => {
    if (!videoRef.current) return;
    setIsScanning(true);
    setErrorMsg(null);

    try {
      const video = videoRef.current;
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob((b) => resolve(b), "image/jpeg", 0.85)
      );

      if (!blob) throw new Error("Gagal mengambil frame kamera.");

      // Run Python YOLO Detection (0 Token API)
      const detections = await detectObjectWithYolo(blob);
      setActiveDetections(detections);

      if (detections.length > 0) {
        setSelectedDetection(detections[0]);
      }
    } catch (err: any) {
      console.error("YOLO detection error:", err);
      setErrorMsg(err.message || "Gagal mendeteksi objek kamera.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    setErrorMsg(null);

    try {
      const detections = await detectObjectWithYolo(file);
      setActiveDetections(detections);
      if (detections.length > 0) {
        setSelectedDetection(detections[0]);
      }
    } catch (err: any) {
      setErrorMsg("Gagal memproses gambar unggahan.");
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Top Banner Hint */}
      <div className="p-3 bg-black border-2 border-[#facc15] shadow-[3px_3px_0px_#000000] flex items-center justify-between text-xs">
        <span className="font-black text-[#facc15] uppercase">
          [TARGET OBJEK NYATA]: {requiredHint}
        </span>
        <span className="hidden sm:inline text-[10px] text-zinc-400 font-bold uppercase">
          FASTAPI YOLO NANO (0 TOKEN)
        </span>
      </div>

      {/* Industrial Aperture Viewfinder Container */}
      <div className="border-4 border-black dark:border-white bg-[#0f1115] shadow-[8px_8px_0px_#000000] relative overflow-hidden">
        {/* Header Telemetry */}
        <div className="p-2.5 bg-black border-b-3 border-black dark:border-white flex items-center justify-between text-[11px] font-black text-white">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#4ade80] border border-black animate-ping" />
            <span>[VISION_APERTURE // REALTIME_WEBCAM]</span>
          </div>
          <span className="text-[#facc15]">[YOLO_MODEL: READY]</span>
        </div>

        {/* Viewport View */}
        <div className="relative h-[360px] sm:h-[440px] bg-black flex items-center justify-center overflow-hidden">
          {isCameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center gap-3 text-zinc-400 p-6 text-center">
              <Camera className="w-12 h-12 stroke-[2] text-[#facc15]" />
              <p className="text-xs max-w-sm">
                Kamera belum diaktifkan. Klik tombol di bawah untuk menyalakan webcam atau unggah foto benda secara manual.
              </p>
              <button
                onClick={() => setIsCameraActive(true)}
                className="brutal-btn-yellow px-5 py-2.5 text-xs font-black uppercase"
              >
                [ NYALAKAN KAMERA SEKARANG ]
              </button>
            </div>
          )}

          {/* Corner Crosshairs */}
          <div className="absolute top-3 left-3 text-lg font-black text-[#facc15] pointer-events-none select-none">
            + [CAM_L1]
          </div>
          <div className="absolute top-3 right-3 text-lg font-black text-[#facc15] pointer-events-none select-none">
            [CAM_R1] +
          </div>
          <div className="absolute bottom-3 left-3 text-lg font-black text-[#facc15] pointer-events-none select-none">
            + [CAM_L2]
          </div>
          <div className="absolute bottom-3 right-3 text-lg font-black text-[#facc15] pointer-events-none select-none">
            [CAM_R2] +
          </div>

          {/* YOLO Bounding Box Overlay Visualization */}
          {activeDetections.map((det, idx) => (
            <div
              key={idx}
              className="absolute border-3 border-[#facc15] bg-[#facc15]/10 pointer-events-none"
              style={{
                left: `${Math.min(Math.max((det.bbox[0] / 1280) * 100, 10), 70)}%`,
                top: `${Math.min(Math.max((det.bbox[1] / 720) * 100, 10), 60)}%`,
                width: `${Math.min(Math.max(((det.bbox[2] - det.bbox[0]) / 1280) * 100, 20), 60)}%`,
                height: `${Math.min(Math.max(((det.bbox[3] - det.bbox[1]) / 720) * 100, 25), 60)}%`,
              }}
            >
              <div className="absolute -top-7 left-0 bg-[#facc15] text-black px-2 py-0.5 font-mono text-[10px] font-black uppercase border border-black shadow-[2px_2px_0px_#000000]">
                {det.label.toUpperCase()} ({Math.round(det.confidence * 100)}%)
              </div>
            </div>
          ))}

          {/* Scanning Progress Overlay */}
          {isScanning && (
            <div className="absolute inset-0 bg-black/90 flex flex-col items-center justify-center gap-3 z-30 p-6 text-center">
              <div className="w-10 h-10 border-4 border-[#facc15] border-t-transparent animate-spin" />
              <span className="text-sm font-black uppercase text-[#facc15]">
                [YOLO NANO DETECTING OBJECTS AT 0 TOKEN...]
              </span>
              <p className="text-xs text-zinc-300 max-w-xs">
                Mengekstrak bounding box, kamus kosakata instan, dan kata sifat terkait...
              </p>
            </div>
          )}
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-950 border-t-2 border-red-700 text-red-200 text-xs font-bold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Shutter Bar Controls */}
        <div className="p-3 bg-black border-t-3 border-black dark:border-white flex flex-wrap items-center justify-between gap-3">
          <label className="brutal-btn-dark px-3 py-2 text-xs font-black cursor-pointer flex items-center gap-2">
            <Upload className="w-3.5 h-3.5" />
            <span>[ UNGGAH FOTO ]</span>
            <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
          </label>

          {isCameraActive && (
            <button
              onClick={captureFrameAndDetect}
              disabled={isScanning}
              className="brutal-btn-yellow px-6 py-2.5 text-xs sm:text-sm font-black flex items-center gap-2"
            >
              <Camera className="w-4 h-4 stroke-[2.5]" />
              <span>[ 📸 SCAN BENDA DI KAMERA DENGAN YOLO ]</span>
            </button>
          )}
        </div>
      </div>

      {/* Vocab Modal Card Popup on Success */}
      {selectedDetection && (
        <VocabCardModal
          detection={selectedDetection}
          onProceed={() => {
            onObjectConfirmed(selectedDetection);
            setSelectedDetection(null);
          }}
          onScanAnother={() => {
            setSelectedDetection(null);
            setActiveDetections([]);
          }}
        />
      )}
    </div>
  );
}

