"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import {
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  RotateCcw,
  FlaskConical,
  Award,
  BookOpen,
  HelpCircle,
  Lock,
  X,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AuthUser } from "@/lib/auth/types";
import { ExperimentDetailLog, LabSubmission, LabTask, LabTaskQuestion } from "@/lib/lab/types";
import { DUMMY_TUTORIAL_TASK } from "@/lib/lab/tutorialConstants";
import { CHEMICAL_CATALOG, REACTION_CATALOG } from "@/lib/lab/chemicals-db";
import { resolveReactionForTask } from "@/lib/lab/reactionResolver";

// Mascot image paths specified by user
const MASCOT_CORRECT = "/models/img/Gemini_Generated_Image_jbhhb9jbhhb9jbhh-removebg-preview.png";
const MASCOT_WRONG = "/models/img/Gemini_Generated_Image_gkbkfpgkbkfpgkbk-removebg-preview.png";
const MASCOT_APPRECIATION = "/models/img/Gemini_Generated_Image_tguvsltguvsltguv-removebg-preview.png";

export type QuizStage = "answering" | "feedback" | "appreciation" | "evaluation";

interface InteractiveQuizArenaProps {
  task: LabTask;
  currentUser: AuthUser | null;
  classCode?: string;
  onClose?: () => void;
  onSubmissionSuccess?: (score: number, submission: any) => void;
  initialSubmission?: LabSubmission | null;
  pendingExperimentDetails?: ExperimentDetailLog | null;
  isReactionAchieved?: boolean;
  isModal?: boolean;
}

export default function InteractiveQuizArena({
  task,
  currentUser,
  classCode,
  onClose,
  onSubmissionSuccess,
  initialSubmission,
  pendingExperimentDetails,
  isReactionAchieved = true,
  isModal = false,
}: InteractiveQuizArenaProps) {
  const effectiveClassCode = classCode || task.roomCode || "LAB889";
  const questions: LabTaskQuestion[] = useMemo(() => task.questions || [], [task.questions]);
  const kkmScore = task.kkmScore ?? 75;
  const allowRetake = task.allowRetakeBelowKkm !== false;
  const showReviewDetails = task.showQuizReviewDetails ?? true;

  // Sound effects toggle
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);

  // Cinematic mascot entrance animation state ("rising" from bottom -> "center" at center of screen)
  const [feedbackEntrance, setFeedbackEntrance] = useState<"rising" | "center">("rising");

  // Quiz progression state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qIdx: number]: number }>(() => {
    if (initialSubmission && Array.isArray(initialSubmission.answers)) {
      const map: { [idx: number]: number } = {};
      initialSubmission.answers.forEach((ans: any, idx: number) => {
        if (ans.selectedIndex !== undefined && ans.selectedIndex !== null) {
          map[idx] = ans.selectedIndex;
        }
      });
      return map;
    }
    return {};
  });

  const [stage, setStage] = useState<QuizStage>(() => {
    if (initialSubmission) return "evaluation";
    return "answering";
  });

  const [score, setScore] = useState<number>(() => (initialSubmission ? initialSubmission.score : 0));
  const [submission, setSubmission] = useState<LabSubmission | null>(initialSubmission || null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // Web Audio Synthesizer for instant, zero-latency feedback sounds
  const playSfx = (type: "correct" | "wrong" | "celebrate") => {
    if (!isAudioEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      if (ctx.state === "suspended") ctx.resume();

      if (type === "correct") {
        // Melodic rising major triad (E5 -> G#5 -> B5)
        const now = ctx.currentTime;
        const freqs = [659.25, 830.61, 987.77];
        freqs.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, now + idx * 0.08);
          gain.gain.setValueAtTime(0.18, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.35);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.35);
        });
      } else if (type === "wrong") {
        // Gentle low descending note
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(140, now + 0.32);
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.32);
      } else if (type === "celebrate") {
        // Grand fanfare arpeggio (C5 -> E5 -> G5 -> C6)
        const now = ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(freq, now + idx * 0.1);
          gain.gain.setValueAtTime(0.22, now + idx * 0.1);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.55);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(now + idx * 0.1);
          osc.stop(now + idx * 0.1 + 0.55);
        });
      }
    } catch (_) {}
  };

  const currentQuestion = questions[currentQuestionIndex];
  const currentAnswer = selectedAnswers[currentQuestionIndex];
  const isCurrentCorrect = currentAnswer !== undefined && currentQuestion && currentAnswer === currentQuestion.correctIndex;

  // Handle student selecting an option
  const handleSelectOption = (optIndex: number) => {
    if (stage !== "answering") return;

    setSelectedAnswers((prev) => ({
      ...prev,
      [currentQuestionIndex]: optIndex,
    }));

    const isCorrect = optIndex === currentQuestion?.correctIndex;
    playSfx(isCorrect ? "correct" : "wrong");

    // Start with rising animation from bottom
    setFeedbackEntrance("rising");
    setStage("feedback");

    // Smoothly animate from bottom to center of screen
    setTimeout(() => {
      setFeedbackEntrance("center");
    }, 40);
  };

  // Move to next question or finalize to appreciation
  const handleNextQuestionOrAppreciation = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
      setFeedbackEntrance("rising");
      setStage("answering");
    } else {
      // All questions completed! Trigger save and display Appreciation Mascot at center
      playSfx("celebrate");
      executeSaveQuizSubmission();
      setFeedbackEntrance("rising");
      setStage("appreciation");
      setTimeout(() => {
        setFeedbackEntrance("center");
      }, 40);
    }
  };

  // Submit and save quiz record
  const executeSaveQuizSubmission = async () => {
    let correctCount = 0;
    const answerRecords = questions.map((q, idx) => {
      const chosen = selectedAnswers[idx];
      const isCorrect = chosen === q.correctIndex;
      if (isCorrect) correctCount++;
      return {
        questionId: q.id || `q_${idx}`,
        question: q.question,
        options: q.options,
        selectedIndex: chosen,
        selectedAnswer: chosen !== undefined ? q.options[chosen] : "-",
        correctIndex: q.correctIndex,
        correctAnswer: q.options[q.correctIndex],
        isCorrect,
        explanation: q.explanation || "",
      };
    });

    const calculatedScore = Math.round((correctCount / Math.max(1, questions.length)) * 100);
    setScore(calculatedScore);

    const isPassed = calculatedScore >= kkmScore;
    const studentUser = (currentUser?.name || "Siswa Praktikan").trim();

    // Experiment details fallback
    const fallbackResolved = resolveReactionForTask(task, submission?.experimentDetails);
    const matchedRx = REACTION_CATALOG.find(
      (r) =>
        (task.expectedReactionId && r.id === task.expectedReactionId) ||
        (task.title && task.title.toLowerCase().includes(r.title.toLowerCase()))
    );

    const finalExperimentDetails: ExperimentDetailLog =
      pendingExperimentDetails ||
      submission?.experimentDetails || {
        reactionTitle: fallbackResolved.reaction.title,
        reactionEquation: fallbackResolved.reaction.equation,
        temperatureChange: fallbackResolved.reaction.temperatureChange,
        observablePhenomena: fallbackResolved.reaction.observablePhenomena,
        explanation: fallbackResolved.reaction.explanation,
        reasonWhy: fallbackResolved.reaction.reasonWhy,
        mixedChemicals: (task.chemicalIds || []).map((cid: string) => {
          const found = CHEMICAL_CATALOG.find((c) => c.id === cid);
          return {
            name: found?.name || cid,
            formula: found?.formula || cid,
            color: found?.color || "#38bdf8",
          };
        }),
        resultVessel: {
          name: matchedRx?.productName || fallbackResolved.vessel.name,
          formula: matchedRx?.productFormula || fallbackResolved.vessel.formula,
          color: matchedRx?.productColor || fallbackResolved.vessel.color,
          temperatureC: fallbackResolved.vessel.temperatureC,
        },
        completedAt: new Date().toISOString(),
      };

    const wrongAnswers = answerRecords.filter((a) => !a.isCorrect);
    let diagnosticSummary = `Praktikum "${task.title}" diselesaikan oleh ${studentUser}. Skor: ${calculatedScore}/100 (KKM: ${kkmScore}) — Status: ${
      isPassed ? "Tuntas Lulus KKM" : "Belum Tuntas (Di Bawah KKM)"
    }. `;

    if (wrongAnswers.length === 0) {
      diagnosticSummary +=
        "Siswa menguasai 100% konsep reaksi stoikiometri seimbang dan fenomena termal dengan sempurna!";
    } else {
      diagnosticSummary += `Siswa menguasai ${correctCount} dari ${
        questions.length
      } konsep praktikum. Perlu penguatan pada konsep nomor: ${wrongAnswers.map((_, i) => i + 1).join(", ")}.`;
    }

    const createdSub: LabSubmission = {
      id: `sub_${Date.now()}`,
      taskId: task.id,
      studentName: studentUser,
      isReactionAchieved: Boolean(isReactionAchieved),
      score: calculatedScore,
      answers: answerRecords,
      aiAnalysis: diagnosticSummary,
      experimentDetails: finalExperimentDetails,
      completedAt: new Date().toISOString(),
    };

    setSubmission(createdSub);

    // If tutorial task, save locally without server requirement
    if (task.id === DUMMY_TUTORIAL_TASK.id) {
      setSaveNotice("Simulasi Kuis Tutorial Berhasil! Skor tercatat untuk latihan.");
      try {
        localStorage.setItem(
          "cuplabs_submission_updated",
          JSON.stringify({ taskId: task.id, score: calculatedScore, timestamp: Date.now() })
        );
      } catch {}
      if (onSubmissionSuccess) onSubmissionSuccess(calculatedScore, createdSub);
      return;
    }

    // Save to real database
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/lab/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          studentName: studentUser,
          isReactionAchieved: Boolean(isReactionAchieved),
          score: calculatedScore,
          answers: answerRecords,
          aiAnalysis: diagnosticSummary,
          experimentDetails: finalExperimentDetails,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSaveNotice("Nilai dan jawaban kuis berhasil disimpan otomatis ke akun guru!");
        try {
          localStorage.setItem(
            "cuplabs_submission_updated",
            JSON.stringify({ taskId: task.id, score: calculatedScore, timestamp: Date.now() })
          );
        } catch {}
        if (onSubmissionSuccess) onSubmissionSuccess(calculatedScore, createdSub);
      } else {
        setSaveNotice(data.error || "Gagal menyimpan ke server.");
      }
    } catch {
      setSaveNotice("Terjadi kendala jaringan saat menyimpan nilai kuis.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Retake quiz (Remedial)
  const handleRetake = () => {
    setSelectedAnswers({});
    setCurrentQuestionIndex(0);
    setScore(0);
    setSaveNotice(null);
    setStage("answering");
  };

  const isPassed = score >= kkmScore;

  // Calculate live score in current run
  const liveCorrectCount = useMemo(() => {
    let count = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) count++;
    });
    return count;
  }, [questions, selectedAnswers]);

  // Main Card Body Container
  const renderQuizContent = () => {
    // --------------------------------------------------------------------------
    // CASE 1: No Questions Available
    // --------------------------------------------------------------------------
    if (questions.length === 0) {
      return (
        <div className="pop-card rounded-3xl p-8 text-center space-y-4 bg-white">
          <BookOpen className="w-12 h-12 text-slate-400 mx-auto" />
          <h3 className="text-lg font-black text-slate-900">Tidak Ada Soal Kuis</h3>
          <p className="text-xs text-slate-600 max-w-md mx-auto">
            Tugas praktikum ini tidak memiliki butir soal evaluasi tertulis.
          </p>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="pop-btn bg-[#FACC15] text-slate-900 px-5 py-2.5 rounded-xl text-xs font-bold"
            >
              Kembali ke Meja Lab
            </button>
          )}
        </div>
      );
    }

    // --------------------------------------------------------------------------
    // CASE 2: APPRECIATION SCREEN (Mascot Appreciation Before Evaluation)
    // --------------------------------------------------------------------------
    if (stage === "appreciation") {
      return (
        <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center p-4 bg-slate-900/80 backdrop-blur-[4px] select-none animate-in fade-in duration-300">
          {/* Subtle Confetti Particles / Glow */}
          <div className="absolute top-6 left-10 text-2xl animate-bounce">✨</div>
          <div className="absolute top-10 right-14 text-3xl animate-pulse">🌟</div>
          <div className="absolute bottom-10 left-16 text-2xl animate-bounce delay-150">🎉</div>
          <div className="absolute bottom-12 right-20 text-2xl animate-pulse delay-200">✨</div>

          {/* Animated Mascot & Speech Container (Dari Bawah ke Tengah) */}
          <div
            className={`flex flex-col items-center max-w-lg w-full transition-all duration-700 ease-out ${
              feedbackEntrance === "rising"
                ? "translate-y-[70vh] opacity-0 scale-75"
                : "translate-y-0 opacity-100 scale-100"
            }`}
          >
            {/* Appreciation Mascot (tguvsltguvsltguv) with Glowing Golden Aura */}
            <div className="relative flex flex-col items-center select-none py-2">
              <div className="absolute inset-0 bg-[#FEF08A]/45 rounded-full blur-2xl scale-125" />

              <div className="relative z-10 mascot-floating">
                <img
                  src={MASCOT_APPRECIATION}
                  alt="Prof. Cupcup Apresiasi"
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.4)] mx-auto"
                />
              </div>
              <div className="w-40 h-4 bg-slate-950/45 rounded-full blur-xs mx-auto mt-2 mascot-shadow-anim" />
            </div>

            {/* Speech Card Pop-Card */}
            <div className="mt-4 sm:mt-5 w-full">
              <div className="pop-card bg-gradient-to-br from-[#FEF08A] via-[#FFFDF7] to-[#BAE6FD] border-3 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-3xl p-6 sm:p-7 text-center space-y-4 relative">
                {/* Speech Bubble Arrow pointing up to Mascot */}
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-[#FEF08A] border-t-2 border-l-2 border-slate-900 rotate-45" />

                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#34D399] border-2 border-slate-900 text-[11px] font-black text-slate-900 shadow-[2px_2px_0px_#0f172a] uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Misi Kuis Selesai!</span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl sm:text-2xl font-display font-black text-slate-900 tracking-tight">
                    Luar Biasa, Saintis Hebat! 🏆
                  </h2>
                  <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed">
                    &ldquo;Selamat! Kamu telah menyelesaikan seluruh butir soal praktikum dengan penuh ketelitian dan semangat ilmiah. Usaha belajarmu patut diacungi jempol!&rdquo;
                  </p>
                </div>

                {/* Quick Stats Pill */}
                <div className="inline-flex items-center gap-4 bg-white/95 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-2xl px-5 py-2 text-xs font-black text-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Total Soal</span>
                    <span>{questions.length} Butir</span>
                  </div>
                  <div className="w-px h-6 bg-slate-300" />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Jawaban Benar</span>
                    <span className="text-emerald-600">{liveCorrectCount} Soal</span>
                  </div>
                  <div className="w-px h-6 bg-slate-300" />
                  <div>
                    <span className="text-[10px] text-slate-500 uppercase block">Skor Kuis</span>
                    <span className="text-blue-600">{score}/100</span>
                  </div>
                </div>

                {/* Action Button to Transition to Final Evaluation */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setStage("evaluation")}
                    className="pop-btn bg-[#38BDF8] hover:bg-[#0ea5e9] text-slate-900 px-7 sm:px-9 py-3.5 rounded-2xl text-xs sm:text-sm font-black gap-2 shadow-[4px_4px_0px_#0f172a] transition-transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                  >
                    <span>Buka Rapor & Evaluasi Ilmiah</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // --------------------------------------------------------------------------
    // CASE 3: FINAL EVALUATION & SCORECARD REVIEW
    // --------------------------------------------------------------------------
    if (stage === "evaluation") {
      return (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Result Card Header */}
          <div
            className={`pop-card rounded-3xl p-6 sm:p-7 space-y-4 border-3 border-slate-900 shadow-[6px_6px_0px_#0f172a] ${
              isPassed ? "bg-[#D1FAE5]" : "bg-[#FFE4E6]"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1.5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-lg border-2 border-slate-900 ${
                      isPassed ? "bg-[#34D399] text-slate-900" : "bg-[#FB7185] text-white"
                    }`}
                  >
                    {isPassed ? "LULUS KKM" : "DI BAWAH KKM"}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    Batas KKM: {kkmScore} / 100
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-display font-black text-slate-900">
                  {isPassed
                    ? "Keren! Kamu Berhasil Menguasai Materi Praktikum Ini 🎉"
                    : "Tetap Semangat! Pelajari Kembali Pembahasan Di Bawah 💪"}
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed">
                  {saveNotice ||
                    (isPassed
                      ? "Skormu sudah melampaui batas ketuntasan minimal dan tersimpan otomatis ke akun guru."
                      : allowRetake
                      ? "Gurumu mengizinkan remedial. Kamu bisa mengulang kuis atau kembali mengecek reaksi di Meja Lab 3D."
                      : "Tugas ini bersifat sekali selesai tanpa pengulangan kuis.")}
                </p>
              </div>

              {/* Big Score Box */}
              <div className="bg-white border-3 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-2xl px-6 py-4 text-center shrink-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  SKOR AKHIR
                </span>
                <span
                  className={`text-4xl font-mono font-black ${
                    isPassed ? "text-[#059669]" : "text-[#E11D48]"
                  }`}
                >
                  {score}
                  <span className="text-sm text-slate-400 font-bold">/100</span>
                </span>
              </div>
            </div>

            {/* Evaluation Actions */}
            <div className="flex flex-wrap items-center gap-2.5 pt-3 border-t-2 border-slate-900/15">
              {!isPassed && allowRetake && (
                <button
                  type="button"
                  onClick={handleRetake}
                  className="pop-btn bg-[#FACC15] hover:bg-[#fde047] text-slate-900 px-4 py-2 rounded-xl text-xs font-black gap-1.5 shadow-[2px_2px_0px_#0f172a]"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Ulangi Kuis (Remedial)</span>
                </button>
              )}

              {onClose ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="pop-btn bg-[#38BDF8] hover:bg-[#7dd3fc] text-slate-900 px-4 py-2 rounded-xl text-xs font-black gap-1.5 shadow-[2px_2px_0px_#0f172a]"
                >
                  <FlaskConical className="w-4 h-4" />
                  <span>Tutup & Kembali ke Meja Lab</span>
                </button>
              ) : (
                <Link
                  href={`/lab?classCode=${encodeURIComponent(effectiveClassCode)}&taskId=${encodeURIComponent(
                    task.id
                  )}&mode=task`}
                  className="pop-btn bg-[#38BDF8] hover:bg-[#7dd3fc] text-slate-900 px-4 py-2 rounded-xl text-xs font-black gap-1.5 shadow-[2px_2px_0px_#0f172a]"
                >
                  <FlaskConical className="w-4 h-4" />
                  <span>Buka Meja Lab 3D</span>
                </Link>
              )}

              {!isModal && (
                <Link
                  href="/"
                  className="pop-btn bg-white hover:bg-slate-50 text-slate-900 px-4 py-2 rounded-xl text-xs font-black gap-1.5 shadow-[2px_2px_0px_#0f172a]"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Kembali ke Dashboard</span>
                </Link>
              )}
            </div>
          </div>

          {/* Detailed Question Review List */}
          <div className="space-y-4">
            <h3 className="font-display font-black text-sm text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <span>Rekapitulasi Butir Soal & Pembahasan</span>
            </h3>

            {questions.map((q, qIdx) => {
              const userChoice = selectedAnswers[qIdx];
              const isUserRight = userChoice === q.correctIndex;

              return (
                <div
                  key={q.id || qIdx}
                  className="pop-card rounded-2xl p-4 sm:p-5 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-[#FACC15] border-2 border-slate-900 font-mono font-black text-xs flex items-center justify-center shrink-0">
                        {qIdx + 1}
                      </span>
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug pt-0.5">
                        {q.question}
                      </h4>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-lg border-2 border-slate-900 text-[10px] font-black uppercase shrink-0 flex items-center gap-1 ${
                        isUserRight ? "bg-[#34D399] text-slate-900" : "bg-[#FB7185] text-white"
                      }`}
                    >
                      {isUserRight ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Benar</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>Salah</span>
                        </>
                      )}
                    </span>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-0 sm:pl-9">
                    {q.options.map((opt, optIdx) => {
                      const isChosen = userChoice === optIdx;
                      const isCorrectOpt = q.correctIndex === optIdx;
                      const letter = String.fromCharCode(65 + optIdx);

                      let style = "bg-slate-50 border-slate-200 text-slate-700 opacity-70";
                      if (showReviewDetails) {
                        if (isCorrectOpt) {
                          style = "bg-[#D1FAE5] border-slate-900 text-emerald-950 font-bold";
                        } else if (isChosen && !isCorrectOpt) {
                          style = "bg-[#FFE4E6] border-slate-900 text-rose-950 font-bold";
                        }
                      } else {
                        if (isChosen && isUserRight) {
                          style = "bg-[#D1FAE5] border-slate-900 text-emerald-950 font-bold";
                        } else if (isChosen && !isUserRight) {
                          style = "bg-[#FFE4E6] border-slate-900 text-rose-950 font-bold";
                        }
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-2.5 rounded-xl border-2 text-xs flex items-center justify-between gap-2 ${style}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-white border border-slate-900 font-mono font-bold text-[10px] flex items-center justify-center shrink-0">
                              {letter}
                            </span>
                            <span>{opt}</span>
                          </div>
                          {showReviewDetails && isCorrectOpt && (
                            <span className="text-[9px] font-black bg-[#34D399] border border-slate-900 px-1.5 py-0.5 rounded text-slate-900">
                              Kunci
                            </span>
                          )}
                          {isChosen && (
                            <span className="text-[9px] font-black bg-white border border-slate-900 px-1.5 py-0.5 rounded text-slate-900">
                              Pilihanmu
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Scientific Explanation */}
                  {showReviewDetails && q.explanation && (
                    <div className="sm:ml-9 p-3 bg-[#FEF9C3] border-2 border-slate-900 rounded-xl text-xs text-slate-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-black text-slate-900 text-[10px] uppercase tracking-wide">
                        <Sparkles className="w-3 h-3 text-amber-700" />
                        <span>Pembahasan Ilmiah:</span>
                      </div>
                      <p className="leading-relaxed text-[11px] sm:text-xs">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // --------------------------------------------------------------------------
    // CASE 4: ONE-BY-ONE QUIZ QUESTION STAGE ("answering" | "feedback")
    // --------------------------------------------------------------------------
    return (
      <div className="space-y-4">
        {/* Top Progress & Step Header */}
        <div className="pop-card bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="bg-[#FACC15] text-slate-900 font-mono font-black text-xs px-3 py-1 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a]">
              Soal {currentQuestionIndex + 1} dari {questions.length}
            </span>
            <span className="text-xs font-extrabold text-slate-700 hidden sm:inline">
              KKM: {kkmScore}/100
            </span>
          </div>

          {/* Sound Toggle & Progress Bar */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex-1 sm:w-44 h-3 bg-slate-100 border-2 border-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#34D399] transition-all duration-300"
                style={{
                  width: `${Math.round(((currentQuestionIndex + (stage === "feedback" ? 1 : 0.4)) / questions.length) * 100)}%`,
                }}
              />
            </div>

            <button
              type="button"
              onClick={() => setIsAudioEnabled(!isAudioEnabled)}
              title={isAudioEnabled ? "Matikan Efek Suara" : "Aktifkan Efek Suara"}
              className="p-1.5 rounded-lg border border-slate-900 bg-white hover:bg-slate-100 text-slate-700 cursor-pointer"
            >
              {isAudioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Current Question Neo-Brutalist Card */}
        <div className="pop-card bg-white border-3 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-3xl p-5 sm:p-7 space-y-5 animate-in fade-in duration-200">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-black text-blue-600 uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5" />
              <span>Pertanyaan Praktikum Sains</span>
            </div>
            <h3 className="text-base sm:text-lg font-display font-black text-slate-900 leading-snug">
              {currentQuestion?.question}
            </h3>
          </div>

          {/* Options Buttons (A, B, C, D) */}
          <div className="grid grid-cols-1 gap-2.5">
            {currentQuestion?.options.map((opt, optIdx) => {
              const letter = String.fromCharCode(65 + optIdx);
              const isChosen = currentAnswer === optIdx;
              const isCorrectOpt = currentQuestion.correctIndex === optIdx;

              let btnStyle =
                "bg-slate-50 hover:bg-[#FEF9C3] hover:border-slate-900 text-slate-800 border-slate-900 hover:shadow-[3px_3px_0px_#0f172a] hover:-translate-y-0.5 cursor-pointer";

              if (stage === "feedback") {
                if (isCorrectOpt) {
                  btnStyle =
                    "bg-[#D1FAE5] border-slate-900 text-emerald-950 font-bold shadow-[3px_3px_0px_#0f172a] ring-2 ring-emerald-500 cursor-default";
                } else if (isChosen && !isCorrectOpt) {
                  btnStyle =
                    "bg-[#FFE4E6] border-slate-900 text-rose-950 font-bold shadow-[3px_3px_0px_#0f172a] ring-2 ring-rose-500 cursor-default";
                } else {
                  btnStyle = "bg-slate-50 border-slate-300 text-slate-400 opacity-60 cursor-default";
                }
              }

              return (
                <button
                  key={optIdx}
                  type="button"
                  disabled={stage === "feedback"}
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border-2 text-xs sm:text-sm font-bold transition-all flex items-center justify-between gap-3 ${btnStyle}`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl border-2 border-slate-900 font-mono font-black text-xs flex items-center justify-center shrink-0 ${
                        stage === "feedback" && isCorrectOpt
                          ? "bg-emerald-400 text-slate-900"
                          : stage === "feedback" && isChosen && !isCorrectOpt
                          ? "bg-rose-400 text-white"
                          : "bg-white text-slate-800 shadow-[1px_1px_0px_#0f172a]"
                      }`}
                    >
                      {letter}
                    </span>
                    <span className="leading-snug">{opt}</span>
                  </div>

                  {stage === "feedback" && isCorrectOpt && (
                    <span className="text-[10px] font-black uppercase bg-[#34D399] border-2 border-slate-900 text-slate-900 px-2.5 py-0.5 rounded-lg shrink-0 flex items-center gap-1 shadow-[1px_1px_0px_#0f172a]">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Kunci Benar</span>
                    </span>
                  )}
                  {stage === "feedback" && isChosen && !isCorrectOpt && (
                    <span className="text-[10px] font-black uppercase bg-[#FB7185] border-2 border-slate-900 text-white px-2.5 py-0.5 rounded-lg shrink-0 flex items-center gap-1 shadow-[1px_1px_0px_#0f172a]">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Pilihanmu</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* =======================================================================
            CINEMATIC FEEDBACK OVERLAY (Layar menghitam, maskot naik dari bawah ke tengah)
            ======================================================================= */}
        {stage === "feedback" && (
          <div className="fixed inset-0 z-[120] flex flex-col items-center justify-center p-4 bg-slate-900/80 backdrop-blur-[3px] select-none animate-in fade-in duration-300">
            {/* Animated Mascot & Speech Container (Dari Bawah ke Tengah Layar) */}
            <div
              className={`flex flex-col items-center max-w-lg w-full transition-all duration-700 ease-out ${
                feedbackEntrance === "rising"
                  ? "translate-y-[70vh] opacity-0 scale-75"
                  : "translate-y-0 opacity-100 scale-100"
              }`}
            >
              {/* Mascot Center with Glowing Aura */}
              <div className="relative flex flex-col items-center">
                <div
                  className={`absolute inset-0 rounded-full blur-2xl scale-125 ${
                    isCurrentCorrect ? "bg-[#86EFAC]/50" : "bg-[#FDA4AF]/50"
                  }`}
                />

                <div className="relative z-10 mascot-floating">
                  <img
                    src={isCurrentCorrect ? MASCOT_CORRECT : MASCOT_WRONG}
                    alt={isCurrentCorrect ? "Prof. Cupcup Senang" : "Prof. Cupcup Menyemangati"}
                    className="w-48 h-48 sm:w-56 sm:h-56 object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.4)] pointer-events-none"
                  />
                </div>

                {/* Dynamic Breathing Shadow */}
                <div className="w-36 h-3.5 bg-slate-950/45 rounded-full blur-xs mx-auto mt-2 mascot-shadow-anim" />
              </div>

              {/* Speech Bubble Card */}
              <div className="mt-4 sm:mt-5 w-full">
                <div
                  className={`pop-card border-3 border-slate-900 shadow-[8px_8px_0px_#0f172a] rounded-3xl p-5 sm:p-6 space-y-3.5 text-center relative ${
                    isCurrentCorrect ? "bg-[#DCFCE7]" : "bg-[#FFE4E6]"
                  }`}
                >
                  {/* Pointer Arrow on top pointing up to Mascot */}
                  <div
                    className={`absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 border-t-2 border-l-2 border-slate-900 rotate-45 ${
                      isCurrentCorrect ? "bg-[#DCFCE7]" : "bg-[#FFE4E6]"
                    }`}
                  />

                  {/* Badge */}
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span
                      className={`text-xs font-black uppercase px-3 py-1 rounded-full border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] ${
                        isCurrentCorrect ? "bg-[#34D399] text-slate-900" : "bg-[#FB7185] text-white"
                      }`}
                    >
                      {isCurrentCorrect ? "🎉 YAYY, JAWABANMU BENAR!" : "💪 KURANG TEPAT, TETAP SEMANGAT!"}
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-display font-black text-slate-900">
                    {isCurrentCorrect
                      ? "Hebat Banget! Analisismu Sangat Tajam! 🌟"
                      : `Kunci yang Benar: Pilihan ${String.fromCharCode(65 + currentQuestion.correctIndex)}`}
                  </h3>

                  {/* Explanation Text */}
                  {currentQuestion.explanation ? (
                    <p className="text-xs sm:text-sm font-semibold text-slate-800 leading-relaxed bg-white/85 p-3.5 rounded-2xl border-2 border-slate-900/15 max-h-36 overflow-y-auto">
                      &ldquo;{currentQuestion.explanation}&rdquo;
                    </p>
                  ) : (
                    <p className="text-xs sm:text-sm font-semibold text-slate-700">
                      {isCurrentCorrect
                        ? "Pertahankan fokus dan ketelitianmu untuk pertanyaan berikutnya!"
                        : "Pelajari kembali konsep reaksi di atas untuk pertanyaan selanjutnya ya!"}
                    </p>
                  )}

                  {/* Next Button */}
                  <div className="pt-2 flex justify-center">
                    <button
                      type="button"
                      onClick={handleNextQuestionOrAppreciation}
                      className="pop-btn bg-[#FACC15] hover:bg-[#FDE047] text-slate-900 px-7 sm:px-9 py-3 text-xs sm:text-sm font-black rounded-2xl gap-2 shadow-[4px_4px_0px_#0f172a] transition-transform hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
                    >
                      <span>
                        {currentQuestionIndex < questions.length - 1
                          ? "Lanjut ke Soal Berikutnya"
                          : "Selesai & Lanjut ke Apresiasi 🏆"}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // If used as in-lab modal wrapper
  if (isModal) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-5 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
        <div className="relative w-full max-w-2xl my-auto">
          {/* Top Floating Close Button */}
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              title="Tutup Kuis"
              className="absolute -top-3 -right-3 z-10 w-9 h-9 rounded-full bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] hover:bg-rose-100 flex items-center justify-center text-slate-900 cursor-pointer transition-transform hover:scale-105"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {renderQuizContent()}
        </div>
      </div>
    );
  }

  // Standalone Page Layout (for /quiz)
  return (
    <div className="min-h-screen bg-[#FFFDF7] pop-dots text-slate-900 pb-12">
      {/* Top Header Bar */}
      <div className="border-b-2 border-slate-900 bg-white sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#FACC15] border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] flex items-center justify-center text-slate-900">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Arena Kuis Praktikum
              </span>
              <h1 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-1">
                {task.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/lab?classCode=${encodeURIComponent(effectiveClassCode)}&taskId=${encodeURIComponent(
                task.id
              )}&mode=task`}
              className="pop-btn bg-white hover:bg-slate-100 text-slate-900 px-3.5 py-1.5 rounded-xl text-xs gap-1.5"
            >
              <FlaskConical className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Kembali ke Lab</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        {renderQuizContent()}
      </div>
    </div>
  );
}
