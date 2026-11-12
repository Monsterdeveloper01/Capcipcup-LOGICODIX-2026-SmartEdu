"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  ArrowRight,
  X,
  Bot,
  Pointer,
  FlaskConical,
  Eye,
  Award,
  Video,
  Thermometer,
  RotateCcw,
} from "lucide-react";

export type LabTutorialStepKey =
  | "welcome_lab"
  | "vessels_shelf"
  | "interactive_tools"
  | "camera_sensor"
  | "quiz_and_report"
  | "completed";

interface LabTutorialGuideProps {
  isActive: boolean;
  onClose: () => void;
  onActivateCamera?: () => void;
  onOpenTools?: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function LabTutorialGuide({
  isActive,
  onClose,
  onActivateCamera,
  onOpenTools,
}: LabTutorialGuideProps) {
  const [currentStep, setCurrentStep] = useState<LabTutorialStepKey>("welcome_lab");
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  // Update target rect based on step
  const updateTargetPosition = useCallback(() => {
    if (!isActive) return;

    let targetElementId = "";
    if (currentStep === "vessels_shelf") {
      targetElementId = "tutorial-lab-dock";
    } else if (currentStep === "interactive_tools") {
      targetElementId = "tutorial-lab-tools-bar";
    } else if (currentStep === "camera_sensor") {
      targetElementId = "tutorial-lab-camera-btn";
    } else if (currentStep === "quiz_and_report") {
      targetElementId = "tutorial-lab-quiz-btn";
    }

    if (!targetElementId) {
      setTargetRect(null);
      return;
    }

    const el = document.getElementById(targetElementId);
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      });

      if (
        rect.top < 60 ||
        rect.bottom > window.innerHeight - 60 ||
        rect.left < 0 ||
        rect.right > window.innerWidth
      ) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      setTargetRect(null);
    }
  }, [currentStep, isActive]);

  useEffect(() => {
    updateTargetPosition();
    const handleScroll = () => updateTargetPosition();
    const handleResize = () => updateTargetPosition();

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleResize, { passive: true });
    const timer = setInterval(updateTargetPosition, 400);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      clearInterval(timer);
    };
  }, [updateTargetPosition]);

  const handleBlockedClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsShaking(true);
    setWarningMessage(
      "Yuk fokus ke panduan dulu! Klik tombol atau area yang ditunjuk kursor bayangan yaa! 😉"
    );

    setTimeout(() => {
      setIsShaking(false);
    }, 500);
  };

  const handleNextStep = () => {
    setWarningMessage(null);
    switch (currentStep) {
      case "welcome_lab":
        setCurrentStep("vessels_shelf");
        break;
      case "vessels_shelf":
        setCurrentStep("interactive_tools");
        if (onOpenTools) onOpenTools();
        break;
      case "interactive_tools":
        setCurrentStep("camera_sensor");
        break;
      case "camera_sensor":
        setCurrentStep("quiz_and_report");
        break;
      case "quiz_and_report":
        setCurrentStep("completed");
        break;
      case "completed":
        onClose();
        break;
      default:
        break;
    }
  };

  if (!isActive) return null;

  const getStepContent = () => {
    switch (currentStep) {
      case "welcome_lab":
        return {
          stepNum: "1 / 5",
          title: "Selamat Datang di Laboratorium 3D! 🔬",
          dialog:
            "Halo lagi, Kapten! Sekarang kamu sudah berada di dalam Meja Praktikum 3D interaktif. Di sini kamu bisa memutar sudut meja dengan drag mouse/touchpad dan memperbesar objek.",
          buttonText: "Jelajahi Meja Lab ➔",
          showNextBtn: true,
        };
      case "vessels_shelf":
        return {
          stepNum: "2 / 5",
          title: "Bejana & Reagen Kimia 🧪",
          dialog:
            "Ini adalah tabung reaksi dan gelas bejana yang ada di mejamu! Kamu bisa mengamati warna larutan, efek meniskus optik, dan interaksi partikel kimia secara langsung.",
          buttonText: "Lanjut ke Alat Ukur ➔",
          showNextBtn: true,
        };
      case "interactive_tools":
        return {
          stepNum: "3 / 5",
          title: "Alat Pengukur Reaksi Interaktif 🌡️",
          dialog:
            "Gunakan alat-alat di bawah meja ini: celupkan Termometer untuk mendeteksi reaksi eksoterm/endoterm, atau gunakan Kertas Lakmus dan Indikator pH untuk menguji sifat asam & basa larutan!",
          buttonText: "Paham, Lihat Fitur Sensor ➔",
          showNextBtn: true,
        };
      case "camera_sensor":
        return {
          stepNum: "4 / 5",
          title: "Sensor Sarung Tangan AI (Webcam) 🖐️",
          dialog:
            "Mau coba sensasi nyata tanpa mouse? Klik tombol Sensor Kamera ini untuk mengaktifkan AI MediaPipe! Angkat tanganmu ke depan kamera untuk menggenggam dan menuangkan tabung reaksi secara virtual!",
          buttonText: "Lanjut ke Kuis & Nilai ➔",
          showNextBtn: true,
        };
      case "quiz_and_report":
        return {
          stepNum: "5 / 5",
          title: "Pengamatan Reaksi & Kuis Evaluasi 📝",
          dialog:
            "Setelah reaksi kimia selesai teramati, klik tombol Kuis Evaluasi untuk menguji pemahamanmu. Nilai kuis dan ringkasan reaksimu akan otomatis tersimpan dan dilaporkan ke gurumu!",
          buttonText: "Selesaikan Tur Lab ➔",
          showNextBtn: true,
        };
      case "completed":
      default:
        return {
          stepNum: "Selesai",
          title: "Horeee! Kamu Siap Bereksperimen! 🎉",
          dialog:
            "Luar biasa! Sekarang kamu sudah paham seluruh fitur meja laboratorium 3D Capcipcup. Selamat meracik zat, amati reaksinya, dan raih nilai 100 ya, Kapten Peneliti!",
          buttonText: "Mulai Praktikum Sekarang ✨",
          showNextBtn: true,
        };
    }
  };

  const content = getStepContent();

  return (
    <div className="fixed inset-0 z-[75] pointer-events-auto select-none">
      {/* =========================================================================
          BACKGROUND BLOCKER OVERLAY (4-Panel Cutout agar Tombol Target TIDAK HITAM/GELAP)
          ========================================================================= */}
      {targetRect ? (
        <>
          {/* Panel Atas */}
          <div
            onClick={handleBlockedClick}
            className="fixed inset-x-0 top-0 bg-slate-900/45 backdrop-blur-[1.5px] cursor-not-allowed z-[75]"
            style={{ height: Math.max(0, targetRect.top - 6) }}
          />
          {/* Panel Bawah */}
          <div
            onClick={handleBlockedClick}
            className="fixed inset-x-0 bottom-0 bg-slate-900/45 backdrop-blur-[1.5px] cursor-not-allowed z-[75]"
            style={{ top: targetRect.top + targetRect.height + 6 }}
          />
          {/* Panel Kiri */}
          <div
            onClick={handleBlockedClick}
            className="fixed left-0 bg-slate-900/45 backdrop-blur-[1.5px] cursor-not-allowed z-[75]"
            style={{
              top: Math.max(0, targetRect.top - 6),
              height: targetRect.height + 12,
              width: Math.max(0, targetRect.left - 6),
            }}
          />
          {/* Panel Kanan */}
          <div
            onClick={handleBlockedClick}
            className="fixed right-0 bg-slate-900/45 backdrop-blur-[1.5px] cursor-not-allowed z-[75]"
            style={{
              top: Math.max(0, targetRect.top - 6),
              height: targetRect.height + 12,
              left: targetRect.left + targetRect.width + 6,
            }}
          />
        </>
      ) : (
        /* Full screen overlay jika tidak ada target spesifik */
        <div
          onClick={handleBlockedClick}
          className="fixed inset-0 bg-slate-900/45 backdrop-blur-[1.5px] transition-opacity duration-300 cursor-not-allowed z-[75]"
        />
      )}

      {/* =========================================================================
          TARGET ELEMENT SPOTLIGHT & GHOST CURSOR
          ========================================================================= */}
      {targetRect && (
        <div
          className="fixed transition-all duration-300 pointer-events-none z-[85]"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        >
          {/* Glowing Animated Spotlight Frame */}
          <div className="w-full h-full rounded-2xl border-4 border-[#FACC15] shadow-[0_0_24px_rgba(250,204,21,0.85)] animate-pulse" />

          {/* Kursor Bayangan / Ghost Hand Pointer */}
          <div className="absolute -top-14 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col items-center ghost-pointer-anim">
            {/* Tag */}
            <div className="bg-[#FACC15] border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-lg px-2 py-0.5 text-[10px] font-black text-slate-900 uppercase tracking-wider whitespace-nowrap mb-1">
              FOKUS DI SINI! 👇
            </div>

            {/* Hand Neo-Brutalist Pointer */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-12 h-12 rounded-full border-2 border-[#38BDF8] bg-[#38BDF8]/20 ripple-pulse-anim" />
              <div className="relative z-10 w-12 h-12 p-1.5 rounded-2xl bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rotate-[155deg] flex items-center justify-center">
                <Pointer className="w-6 h-6 text-[#2563EB] fill-[#38BDF8]" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MASCOT & SPEECH BUBBLE (KANAN BAWAH LAYAR)
          ========================================================================= */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[95] flex flex-col items-end max-w-sm sm:max-w-md w-full px-2 pointer-events-auto">
        {/* Speech Bubble Pop-Card */}
        <div
          className={`pop-card bg-[#FFFDF7] border-2 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-3xl p-4 sm:p-5 space-y-3 relative mb-2 transition-all duration-200 ${
            isShaking ? "shake-gentle-anim border-rose-500 shadow-[6px_6px_0px_#f43f5e]" : ""
          }`}
        >
          {/* Top Header Pill with Step Indicator */}
          <div className="flex items-center justify-between gap-2 border-b-2 border-slate-900/10 pb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-6 h-6 rounded-lg bg-[#FACC15] border border-slate-900 flex items-center justify-center text-slate-900 shadow-[1px_1px_0px_#0f172a]">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-black text-slate-900">
                Prof. Cupcup <span className="text-slate-500 font-bold">&bull; Tur Lab 3D</span>
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="bg-[#38BDF8] text-slate-900 font-mono font-black text-[10px] px-2 py-0.5 rounded-md border border-slate-900">
                {content.stepNum}
              </span>
              <button
                type="button"
                onClick={onClose}
                title="Lewati Tutorial"
                className="w-5 h-5 rounded-md border border-slate-900 bg-white hover:bg-rose-100 flex items-center justify-center text-slate-700 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Mascot Dialog Text */}
          <div className="space-y-1.5">
            <h4 className="font-display font-black text-sm sm:text-base text-slate-900 flex items-center gap-1.5">
              <span>{content.title}</span>
            </h4>
            <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
              &ldquo;{content.dialog}&rdquo;
            </p>
          </div>

          {/* Warning Banner if clicked wrong element */}
          {warningMessage && (
            <div className="p-2 bg-[#FFE4E6] border-2 border-slate-900 rounded-xl text-[11px] font-black text-rose-900 animate-in fade-in flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping shrink-0" />
              <span>{warningMessage}</span>
            </div>
          )}

          {/* Action Footer Buttons */}
          <div className="pt-1 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="text-[11px] font-bold text-slate-500 hover:text-slate-800 underline cursor-pointer"
            >
              Lewati Tur
            </button>

            {content.showNextBtn && (
              <button
                type="button"
                onClick={handleNextStep}
                className="pop-btn bg-[#FACC15] hover:bg-[#FDE047] text-slate-900 px-4 py-2 text-xs font-black rounded-xl gap-1.5 shadow-[3px_3px_0px_#0f172a] transition-transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
              >
                <span>{content.buttonText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Speech Bubble Tail pointing down to Mascot */}
          <div className="absolute -bottom-2.5 right-12 w-5 h-5 bg-[#FFFDF7] border-b-2 border-r-2 border-slate-900 rotate-45" />
        </div>

        {/* Mascot Avatar in Bottom Right */}
        <div className="relative flex flex-col items-center mr-6 select-none pointer-events-none">
          {/* Glowing Halo */}
          <div className="absolute inset-0 bg-[#FEF08A]/50 rounded-full blur-xl scale-125" />

          {/* Floating Mascot */}
          <div className="relative z-10 mascot-floating">
            <img
              src="/models/img/Gemini_Generated_Image_pnk3ggpnk3ggpnk3-removebg-preview.png"
              alt="Prof. Cupcup Mascot"
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-[0_8px_16px_rgba(15,23,42,0.25)]"
            />
          </div>

          {/* Breathing Shadow */}
          <div className="w-16 h-2.5 bg-slate-900/30 rounded-full blur-2xs mascot-shadow-anim mt-0.5" />
        </div>
      </div>
    </div>
  );
}

