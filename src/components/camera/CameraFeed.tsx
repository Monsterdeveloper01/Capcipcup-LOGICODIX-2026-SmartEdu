"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, RefreshCw, AlertCircle } from "lucide-react";

interface CameraFeedProps {
  isActive: boolean;
  onToggleActive?: (active: boolean) => void;
  onVideoReady?: (video: HTMLVideoElement | null) => void;
  className?: string;
  showControls?: boolean;
}

export default function CameraFeed({
  isActive,
  onToggleActive,
  onVideoReady,
  className = "",
  showControls = true,
}: CameraFeedProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");

  const stopAllTracks = () => {
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
    setStream(null);
  };

  useEffect(() => {
    if (!isActive) {
      stopAllTracks();
      return;
    }

    let isMounted = true;

    async function startCamera() {
      try {
        setError(null);
        stopAllTracks();

        const mediaStream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (!isMounted) {
          mediaStream.getTracks().forEach((track) => {
            try { track.stop(); } catch (e) {}
          });
          return;
        }

        streamRef.current = mediaStream;
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          videoRef.current.onloadedmetadata = () => {
            onVideoReady?.(videoRef.current);
          };
        }
      } catch (err: any) {
        if (isMounted) {
          setError(
            err.name === "NotAllowedError"
              ? "Izin akses kamera ditolak. Silakan izinkan kamera di browser Anda."
              : `Gagal mengakses kamera: ${err.message}`
          );
        }
      }
    }

    startCamera();

    return () => {
      isMounted = false;
      stopAllTracks();
    };
  }, [isActive, facingMode]);

  const toggleFacingMode = () => {
    setFacingMode((prev) => (prev === "user" ? "environment" : "user"));
  };

  return (
    <div className={`relative overflow-hidden bg-black rounded-2xl ${className}`}>
      {/* Video Element */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isActive && !error ? "opacity-100" : "opacity-0"
        } ${facingMode === "user" ? "-scale-x-100" : ""}`}
      />

      {/* Fallback / Error State */}
      {(!isActive || error) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center text-zinc-400 bg-zinc-900/90 backdrop-blur-sm">
          {error ? (
            <>
              <AlertCircle className="w-8 h-8 text-rose-500 mb-2" />
              <p className="text-sm text-rose-300 max-w-xs">{error}</p>
            </>
          ) : (
            <>
              <CameraOff className="w-8 h-8 text-zinc-500 mb-2" />
              <p className="text-sm font-medium">Kamera dalam keadaan nonaktif</p>
              <p className="text-xs text-zinc-500 mt-1">
                Aktifkan kamera untuk mode WebAR (Augmented Reality)
              </p>
            </>
          )}
        </div>
      )}

      {/* Camera Controls Bar */}
      {showControls && (
        <div className="absolute top-3 right-3 flex items-center gap-2 z-20">
          {isActive && (
            <button
              onClick={toggleFacingMode}
              title="Ganti Kamera Depan/Belakang"
              className="p-2 rounded-xl bg-black/50 hover:bg-black/70 backdrop-blur-md text-white border border-white/20 transition-all text-xs flex items-center gap-1.5 shadow-lg"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Flip</span>
            </button>
          )}

          {onToggleActive && (
            <button
              onClick={() => onToggleActive(!isActive)}
              className={`p-2 px-3 rounded-xl backdrop-blur-md font-semibold text-xs border transition-all flex items-center gap-1.5 shadow-lg ${
                isActive
                  ? "bg-rose-500/80 hover:bg-rose-600 border-rose-300/40 text-white"
                  : "bg-indigo-600/90 hover:bg-indigo-700 border-indigo-400/40 text-white"
              }`}
            >
              {isActive ? (
                <>
                  <CameraOff className="w-3.5 h-3.5" /> Matikan AR
                </>
              ) : (
                <>
                  <Camera className="w-3.5 h-3.5" /> Buka Kamera AR
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

