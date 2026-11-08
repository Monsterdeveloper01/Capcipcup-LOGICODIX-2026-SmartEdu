"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { Headphones, Volume2, ArrowLeft, ArrowRight, CheckCircle2, RotateCcw, Award } from "lucide-react";
import { ActiveClassroom } from "../types";
import { QuizQuestionItem } from "../../teacher/types";

interface Props {
  activeClassroom: ActiveClassroom | null;
  task: any;
  studentName: string;
  onReturnToCatalog: () => void;
  onCompleteQuiz: (score: number, xp: number) => void;
}

export default function StudentQuizPlayerStep({
  activeClassroom,
  task,
  studentName,
  onReturnToCatalog,
  onCompleteQuiz,
}: Props) {
  // Parse quiz questions from task
  let questions: QuizQuestionItem[] = [];
  try {
    const raw = task.quiz_questions || task.quizQuestions;
    questions = typeof raw === "string" ? JSON.parse(raw) : raw || [];
  } catch {
    questions = [];
  }

  // Fallback if no questions
  if (questions.length === 0) {
    questions = [
      {
        type: "multiple_choice",
        question: "Berdasarkan materi pelajaran ini, manakah strategi komunikasi yang paling tepat?",
        options: [
          "Menyampaikan ide dengan bahasa yang lugas dan sopan",
          "Menolak berbicara dalam bahasa Inggris",
          "Menghindari kontak mata dengan lawan bicara",
          "Menggunakan istilah yang tidak relevan",
        ],
        correctIndex: 0,
        explanation: "Komunikasi profesional mengutamakan kelugasan dan kesopanan.",
      },
    ];
  }

  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    correctCount: number;
    total: number;
    xpEarned: number;
  } | null>(null);

  const currentQ = questions[currentIndex];

  const playListeningAudio = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.88;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleSelectOption = (optIdx: number) => {
    if (quizResult) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIndex]: optIdx,
    }));
  };

  const handleSubmitQuiz = async () => {
    setIsSubmitting(true);
    let correct = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctIndex) {
        correct++;
      }
    });

    const score = Math.round((correct / questions.length) * 100);
    const xp = Math.round((score / 100) * 150) + 50;

    try {
      await fetch("/api/student/quiz-submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questId: task.id,
          studentName,
          roomCode: activeClassroom?.roomCode,
          quizAnswers: selectedAnswers,
          quizScore: score,
          totalQuestions: questions.length,
          correctCount: correct,
          cefrLevel: task.difficultyLevel || task.difficulty_level || "B1",
        }),
      });

      setQuizResult({
        score,
        correctCount: correct,
        total: questions.length,
        xpEarned: xp,
      });

      onCompleteQuiz(score, xp);

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch (err) {
      console.warn("Submit quiz error:", err);
      // Fallback local display
      setQuizResult({
        score,
        correctCount: correct,
        total: questions.length,
        xpEarned: xp,
      });
      onCompleteQuiz(score, xp);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 font-mono text-black">
      {/* Header Info */}
      <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_#000000] flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-[10px] font-black uppercase text-cyan-800 block">
            [ SESI PENGERJAAN KUIS MANDIRI // KELAS: {activeClassroom?.roomCode} ]
          </span>
          <h2 className="text-lg sm:text-xl font-black text-black uppercase">
            {task.title}
          </h2>
        </div>

        <button
          type="button"
          onClick={onReturnToCatalog}
          className="brutal-btn-white px-3.5 py-2 text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>[ KEMBALI KE KATALOG ]</span>
        </button>
      </div>

      {/* QUIZ RESULT BANNER (IF SUBMITTED) */}
      {quizResult ? (
        <div className="border-4 border-black bg-white p-6 sm:p-8 shadow-[8px_8px_0px_#000000] space-y-6 animate-slideUp">
          <div className="text-center space-y-3 border-b-2 border-zinc-200 pb-6">
            <span className="p-3 bg-[#facc15] border-2 border-black inline-block shadow-[3px_3px_0px_#000000]">
              <Award className="w-10 h-10 text-black stroke-[2.5]" />
            </span>
            <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tight text-black">
              KUIS BERHASIL DISELESAIKAN!
            </h3>
            <p className="text-xs text-zinc-600">
              Hasil pengerjaan kuis kamu telah tersimpan dan terkirim otomatis ke buku nilai gurumu.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-zinc-50 border-2 border-black shadow-[3px_3px_0px_#000000]">
              <span className="text-[10px] font-black text-zinc-600 uppercase block">SKOR AKHIR</span>
              <span className="text-3xl font-black text-emerald-700">{quizResult.score}/100</span>
            </div>
            <div className="p-4 bg-zinc-50 border-2 border-black shadow-[3px_3px_0px_#000000]">
              <span className="text-[10px] font-black text-zinc-600 uppercase block">JAWABAN BENAR</span>
              <span className="text-3xl font-black text-black">
                {quizResult.correctCount} / {quizResult.total}
              </span>
            </div>
            <div className="p-4 bg-[#facc15] border-2 border-black shadow-[3px_3px_0px_#000000]">
              <span className="text-[10px] font-black uppercase block">REWARD XP</span>
              <span className="text-3xl font-black text-black">+{quizResult.xpEarned} XP</span>
            </div>
          </div>

          {/* Review Answers */}
          <div className="space-y-4 pt-2">
            <h4 className="text-xs font-black uppercase text-black border-b border-black pb-1">
              [ REVIEW JAWABAN & PEMBAHASAN ]:
            </h4>
            {questions.map((q, idx) => {
              const isCorrect = selectedAnswers[idx] === q.correctIndex;
              return (
                <div
                  key={idx}
                  className={`p-4 border-2 border-black space-y-2 text-xs ${
                    isCorrect ? "bg-emerald-50" : "bg-red-50"
                  }`}
                >
                  <div className="flex items-center justify-between font-black">
                    <span className="uppercase">
                      Soal #{idx + 1}: {q.question}
                    </span>
                    <span className={isCorrect ? "text-emerald-800" : "text-red-700"}>
                      {isCorrect ? "✅ BENAR" : "❌ SALAH"}
                    </span>
                  </div>
                  {q.type === "listening" && q.audioScript && (
                    <div className="p-2 bg-white border border-black italic text-[11px] text-zinc-700">
                      🎧 Naskah Audio: "{q.audioScript}"
                    </div>
                  )}
                  <p className="text-[11px] text-zinc-700">
                    Kunci Benar: <strong>{["A", "B", "C", "D"][q.correctIndex]}. {q.options[q.correctIndex]}</strong>
                  </p>
                  <p className="text-[11px] text-zinc-600 pt-1 border-t border-zinc-300">
                    💡 Penjelasan: {q.explanation}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end pt-4">
            <button
              type="button"
              onClick={onReturnToCatalog}
              className="brutal-btn-yellow px-8 py-3.5 text-xs font-black uppercase shadow-[3px_3px_0px_#000000]"
            >
              [ 📋 KEMBALI KE DAFTAR TUGAS KELAS ]
            </button>
          </div>
        </div>
      ) : (
        /* ACTIVE QUESTION CARD */
        <div className="border-4 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_#000000] space-y-6">
          {/* Question Progress Bar */}
          <div className="flex items-center justify-between text-xs font-black uppercase border-b-2 border-zinc-200 pb-3">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 bg-black text-[#facc15] border border-black">
                SOAL #{currentIndex + 1} DARI {questions.length}
              </span>
              {currentQ.type === "listening" ? (
                <span className="px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-700 flex items-center gap-1">
                  <Headphones className="w-3 h-3" />
                  <span>LISTENING AUDIO</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-zinc-100 text-zinc-700 border border-zinc-400">
                  PILIHAN GANDA
                </span>
              )}
            </div>

            <span className="text-zinc-600 font-bold">
              {Object.keys(selectedAnswers).length} / {questions.length} Terjawab
            </span>
          </div>

          {/* LISTENING AUDIO PLAYER BANNER (IF TYPE IS LISTENING) */}
          {currentQ.type === "listening" && currentQ.audioScript && (
            <div className="p-4 bg-amber-50 border-2 border-black shadow-[3px_3px_0px_#000000] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-1.5 bg-[#facc15] border border-black">
                    <Headphones className="w-5 h-5 text-black stroke-[2.5]" />
                  </span>
                  <div>
                    <span className="text-[10px] font-black uppercase text-amber-900 block">
                      [ AUDIO LISTENING PERCAKAPAN ]
                    </span>
                    <span className="text-xs font-black text-black">
                      Klik tombol untuk mendengarkan audio pengucapan bahasa Inggris:
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => playListeningAudio(currentQ.audioScript || "")}
                  className={`px-4 py-2 text-xs font-black uppercase flex items-center gap-2 shadow-[2px_2px_0px_#000000] ${
                    isPlayingAudio ? "brutal-btn-cyan animate-pulse" : "brutal-btn-yellow"
                  }`}
                >
                  <Volume2 className="w-4 h-4 stroke-[2.5]" />
                  <span>{isPlayingAudio ? "[ SEDANG MEMUTAR... ]" : "[ 🔊 PUTAR AUDIO SUARA ]"}</span>
                </button>
              </div>

              <p className="text-[11px] text-zinc-600 italic">
                💡 Tip: Dengarkan teks dialog di atas dengan saksama, lalu pilih jawaban yang paling tepat di bawah.
              </p>
            </div>
          )}

          {/* Question Text */}
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-black uppercase leading-snug">
              {currentQ.question}
            </h3>
          </div>

          {/* Options Grid */}
          <div className="space-y-3 pt-2">
            {currentQ.options.map((opt, optIdx) => {
              const isSelected = selectedAnswers[currentIndex] === optIdx;
              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelectOption(optIdx)}
                  className={`w-full p-4 text-left font-mono text-xs sm:text-sm font-bold border-2 transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-[#facc15] text-black border-black shadow-[4px_4px_0px_#000000] translate-x-1"
                      : "bg-white text-zinc-800 border-black hover:bg-zinc-50 shadow-[2px_2px_0px_#000000]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 bg-black text-white flex items-center justify-center font-black text-xs flex-shrink-0">
                      {["A", "B", "C", "D"][optIdx]}
                    </span>
                    <span className="leading-snug">{opt}</span>
                  </div>
                  {isSelected && (
                    <CheckCircle2 className="w-5 h-5 text-black stroke-[3] flex-shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Bottom Navigation */}
          <div className="flex items-center justify-between border-t-2 border-zinc-200 pt-5">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
              className="brutal-btn-white px-4 py-2.5 text-xs font-black uppercase flex items-center gap-1.5 disabled:opacity-40"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>[ SEBELUMNYA ]</span>
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((prev) => Math.min(questions.length - 1, prev + 1))}
                className="brutal-btn-yellow px-5 py-2.5 text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
              >
                <span>[ SELANJUTNYA ]</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={isSubmitting || selectedAnswers[currentIndex] === undefined}
                onClick={handleSubmitQuiz}
                className="brutal-btn-yellow px-6 py-2.5 text-xs font-black uppercase flex items-center gap-2 shadow-[3px_3px_0px_#000000]"
              >
                <span>{isSubmitting ? "[ MENGUMPULKAN... ]" : "[ 🚀 KUMPULKAN JAWABAN KUIS ]"}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
