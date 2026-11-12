"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Sparkles,
  ArrowRight,
  CheckCircle2,
  X,
  Volume2,
  Award,
  FlaskConical,
  RotateCcw,
  Bot,
  Pointer,
  HelpCircle,
} from "lucide-react";
import { LabTask } from "@/lib/lab/types";

export type TutorialStepKey =
  | "welcome"
  | "select_classroom"
  | "select_task"
  | "briefing_rules"
  | "proceed_to_lab"
  | "completed";

interface StudentTutorialGuideProps {
  isActive: boolean;
  onClose: () => void;
  activeClassroom: any | null;
  selectedTask: LabTask | null;
  hasClassrooms: boolean;
  onOpenFirstClassroom?: () => void;
  onOpenFirstTask?: () => void;
}

interface TargetRect {
  top: number;
  left: number;
  width: number;
  height: number;
}

export default function StudentTutorialGuide({
  isActive,
  onClose,
  activeClassroom,
  selectedTask,
  hasClassrooms,
  onOpenFirstClassroom,
  onOpenFirstTask,
}: StudentTutorialGuideProps) {
  const [currentStep, setCurrentStep] = useState<TutorialStepKey>("welcome");
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);

  // Auto-advance step when external state changes
  useEffect(() => {
    if (!isActive) return;

    if (currentStep === "select_classroom" && activeClassroom) {
      setCurrentStep("select_task");
      setWarningMessage(null);
    }
  }, [activeClassroom, currentStep, isActive]);

  useEffect(() => {
    if (!isActive) return;

    if (currentStep === "select_task" && selectedTask) {
      setCurrentStep("briefing_rules");
      setWarningMessage(null);
    }
  }, [selectedTask, currentStep, isActive]);

  // Update target rect based on current step
  const updateTargetPosition = useCallback(() => {
    if (!isActive) return;

    let targetElementId = "";
    if (currentStep === "select_classroom") {
      targetElementId = "tutorial-buka-kelas-btn";
    } else if (currentStep === "select_task") {
      targetElementId = "tutorial-task-detail-btn";
    } else if (currentStep === "briefing_rules") {
      targetElementId = "tutorial-briefing-rules";
    } else if (currentStep === "proceed_to_lab") {
      targetElementId = "tutorial-proceed-btn";
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

      // Gently scroll into view if target is outside viewport
      if (
        rect.top < 80 ||
        rect.bottom > window.innerHeight - 80 ||
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
    const timer = setInterval(updateTargetPosition, 500);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleResize);
      clearInterval(timer);
    };
  }, [updateTargetPosition]);

  // Handle user clicking outside allowed area
  const handleBlockedClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsShaking(true);
    setWarningMessage(
      "Eits, jangan mencet yang lain dulu dong! Klik tombol yang ditunjuk kursor bayangan yaa! 😉"
    );

    setTimeout(() => {
      setIsShaking(false);
    }, 500);
  };

  const handleNextStep = () => {
    setWarningMessage(null);
    if (currentStep === "welcome") {
      setCurrentStep("select_classroom");
    } else if (currentStep === "briefing_rules") {
      setCurrentStep("proceed_to_lab");
    } else if (currentStep === "proceed_to_lab") {
      setCurrentStep("completed");
    } else if (currentStep === "completed") {
      handleFinishTutorial();
    }
  };

  const handleFinishTutorial = () => {
    onClose();
  };

  if (!isActive) return null;

  // Step dialog contents
  const getStepContent = () => {
    switch (currentStep) {
      case "welcome":
        return {
          stepNum: "1 / 5",
          title: "Halo, Saintis Muda! 👋",
          dialog:
            "Kenalin, aku Prof. Cupcup, maskot sekaligus pemandu lab pribadimu! Baru pertama kali ke sini? Tenang, di lab 3D ini gak ada bahan kimia yang bakal meledak kok! Yuk ikuti tur kilat ini biar kamu paham cara menyelesaikan praktikum pertamamu!",
          buttonText: "Mulai Tur Lab! 🚀",
          showNextBtn: true,
        };
      case "select_classroom":
        return {
          stepNum: "2 / 5",
          title: "Langkah 1: Masuk Ruang Kelas 🏫",
          dialog: hasClassrooms
            ? "Ini daftar kelas sains yang kamu ikuti dari gurumu! Ayo coba klik tombol 'Buka Kelas' yang ditunjuk kursor bayangan untuk melihat daftar tugas praktikummu!"
            : "Di sini nanti ada daftar kelas dari gurumu. Kamu bisa memasukkan kode kelas PIN yang diberikan guru untuk bergabung!",
          buttonText: "Buka Kelas",
          showNextBtn: false,
        };
      case "select_task":
        return {
          stepNum: "3 / 5",
          title: "Langkah 2: Pilih Misi Praktikum 🧪",
          dialog:
            "Yash, berhasil masuk kelas! Sekarang pilih tugas praktikum pertama yang sudah disiapkan gurumu. Klik tombol 'Lihat Detail Tugas & Mulai' yang ditunjuk kursor bayangan!",
          buttonText: "Pilih Tugas",
          showNextBtn: false,
        };
      case "briefing_rules":
        return {
          stepNum: "4 / 5",
          title: "Langkah 3: Pahami Aturan KKM & Kuis 📋",
          dialog:
            "Perhatikan 3 aturan penting ini: Kuis Evaluasi, Batas Nilai KKM (minimal skor lulus), dan Kebijakan Remedial. Di bawahnya juga ada resep zat kimia yang akan kita racik di meja 3D!",
          buttonText: "Paham, Lanjut ke Meja Lab! ⚡",
          showNextBtn: true,
        };
      case "proceed_to_lab":
        return {
          stepNum: "5 / 5",
          title: "Langkah 4: Tombol Gerbang Lab 3D 🔬",
          dialog:
            "Tadaaa! Tombol hijau 'Proceed to Lab' ini adalah gerbang masuk ke Meja Praktikum 3D interaktif! Nanti di meja lab kamu bisa tuang larutan, amati perubahan warna, bahkan aktifkan kamera tangan AI tanpa sentuh keyboard!",
          buttonText: "Selesaikan Tur & Siap Praktek! 🏆",
          showNextBtn: true,
        };
      case "completed":
        return {
          stepNum: "Selesai",
          title: "Horeee! Kamu Resmi Lulus Tur! 🎉",
          dialog:
            "Selamat! Sekarang kamu sudah tahu alur lengkapnya: Buka Kelas ➔ Pilih Tugas ➔ Masuk Lab 3D ➔ Kerjakan Kuis ➔ Nilai otomatis keluar! Selamat bereksperimen dan raih nilai tertinggi ya, Kapten!",
          buttonText: "Siap Eksperimen Sendiri! ✨",
          showNextBtn: true,
        };
    }
  };

  const content = getStepContent();

  return (
    <div className="fixed inset-0 z-[70] pointer-events-auto select-none">
      {/* =========================================================================
          BACKGROUND BLOCKER OVERLAY (4-Panel Cutout agar Tombol Target TIDAK HITAM/GELAP)
          ========================================================================= */}
      {targetRect ? (
        <>
          {/* Panel Atas */}
          <div
            onClick={handleBlockedClick}
            className="fixed inset-x-0 top-0 bg-slate-900/45 backdrop-blur-[1.5px] cursor-not-allowed z-[70]"
            style={{ height: Math.max(0, targetRect.top - 6) }}
          />
          {/* Panel Bawah */}
          <div
            onClick={handleBlockedClick}
            className="fixed inset-x-0 bottom-0 bg-slate-900/45 backdrop-blur-[1.5px] cursor-not-allowed z-[70]"
            style={{ top: targetRect.top + targetRect.height + 6 }}
          />
          {/* Panel Kiri */}
          <div
            onClick={handleBlockedClick}
            className="fixed left-0 bg-slate-900/45 backdrop-blur-[1.5px] cursor-not-allowed z-[70]"
            style={{
              top: Math.max(0, targetRect.top - 6),
              height: targetRect.height + 12,
              width: Math.max(0, targetRect.left - 6),
            }}
          />
          {/* Panel Kanan */}
          <div
            onClick={handleBlockedClick}
            className="fixed right-0 bg-slate-900/45 backdrop-blur-[1.5px] cursor-not-allowed z-[70]"
            style={{
              top: Math.max(0, targetRect.top - 6),
              height: targetRect.height + 12,
              left: targetRect.left + targetRect.width + 6,
            }}
          />
        </>
      ) : (
        /* Full-screen blocker jika tidak ada target spesifik (e.g. Welcome & Completed) */
        <div
          onClick={handleBlockedClick}
          className="fixed inset-0 bg-slate-900/45 backdrop-blur-[1.5px] transition-opacity duration-300 cursor-not-allowed z-[70]"
        />
      )}

      {/* =========================================================================
          TARGET ELEMENT SPOTLIGHT & GHOST CURSOR
          ========================================================================= */}
      {targetRect && (
        <div
          className="fixed transition-all duration-300 pointer-events-none z-[80]"
          style={{
            top: targetRect.top - 6,
            left: targetRect.left - 6,
            width: targetRect.width + 12,
            height: targetRect.height + 12,
          }}
        >
          {/* Glowing Animated Spotlight Frame */}
          <div className="w-full h-full rounded-2xl border-4 border-[#FACC15] shadow-[0_0_24px_rgba(250,204,21,0.85)] animate-pulse" />

          {/* Direct Clickable Hole (User Can Click Through ONLY on Target) */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (currentStep === "select_classroom" && onOpenFirstClassroom) {
                onOpenFirstClassroom();
              } else if (currentStep === "select_task" && onOpenFirstTask) {
                onOpenFirstTask();
              } else if (currentStep === "proceed_to_lab") {
                const btn = document.getElementById("tutorial-proceed-btn");
                if (btn) btn.click();
              }
            }}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer pointer-events-auto"
            title="Klik tombol ini"
          />

          {/* KURSOR BAYANGAN / GHOST HAND POINTER (Animasi Tangan Menunjuk) */}
          <div className="absolute -bottom-14 -right-10 pointer-events-none flex flex-col items-center ghost-pointer-anim">
            {/* Ripple Pulse Rings */}
            <div className="relative flex items-center justify-center">
              <div className="absolute w-12 h-12 rounded-full border-2 border-[#38BDF8] bg-[#38BDF8]/20 ripple-pulse-anim" />
              <div className="absolute w-7 h-7 rounded-full bg-[#FACC15] opacity-60 animate-ping" />

              {/* Hand Pointer Neo-Brutalist SVG */}
              <div className="relative z-10 w-14 h-14 p-1.5 rounded-2xl bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rotate-[-25deg] flex items-center justify-center">
                <Pointer className="w-8 h-8 text-[#2563EB] fill-[#38BDF8]" />
              </div>
            </div>

            {/* Instruction Tag */}
            <div className="mt-1 bg-[#FACC15] border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-lg px-2 py-0.5 text-[10px] font-black text-slate-900 uppercase tracking-wider whitespace-nowrap animate-bounce">
              KLIK DI SINI! 👇
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          MASCOT & SPEECH BUBBLE (KANAN BAWAH LAYAR)
          ========================================================================= */}
      <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[90] flex flex-col items-end max-w-sm sm:max-w-md w-full px-2 pointer-events-auto">
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
                Prof. Cupcup <span className="text-slate-500 font-bold">&bull; Pemandu Lab</span>
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

