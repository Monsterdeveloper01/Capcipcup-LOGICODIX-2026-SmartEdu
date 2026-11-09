"use client";

import { useState } from "react";
import { LabTaskQuestion } from "@/lib/lab/types";
import { CheckCircle2, AlertCircle, Award, RotateCcw, ArrowRight, BookOpen } from "lucide-react";

interface PostLabQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  questions: LabTaskQuestion[];
  onSubmitQuiz: (score: number, answers: any[]) => void;
}

export default function PostLabQuizModal({
  isOpen,
  onClose,
  taskTitle,
  questions,
  onSubmitQuiz,
}: PostLabQuizModalProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qIndex: number]: number }>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  if (!isOpen) return null;

  const handleSelectOption = (questionIndex: number, optionIndex: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [questionIndex]: optionIndex,
    }));
  };

  const handleFinishQuiz = () => {
    let correctCount = 0;
    const answerRecords = questions.map((q, idx) => {
      const chosen = selectedAnswers[idx];
      const isCorrect = chosen === q.correctIndex;
      if (isCorrect) correctCount++;
      return {
        questionId: q.id || `q_${idx}`,
        selectedIndex: chosen,
        isCorrect,
      };
    });

    const calculatedScore = Math.round((correctCount / questions.length) * 100);
    setScore(calculatedScore);
    setIsSubmitted(true);
    onSubmitQuiz(calculatedScore, answerRecords);
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 font-mono overflow-y-auto">
      <div className="bg-white border-4 border-black w-full max-w-2xl shadow-[8px_8px_0px_#facc15] my-8 p-6 space-y-5">
        {/* Header */}
        <div className="border-b-4 border-black pb-3 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase bg-[#facc15] text-black px-2 py-0.5 border border-black">
              [ EVALUASI KONSEPTUAL PASCA-PRAKTIKUM ]
            </span>
            <h3 className="text-base sm:text-lg font-black uppercase text-black mt-1">
              KUIS OBSERVASI SAINS: {taskTitle}
            </h3>
          </div>
          {isSubmitted && (
            <div className="text-right">
              <span className="text-[10px] font-bold text-zinc-500">NILAI KUIS:</span>
              <div className="text-2xl font-black text-emerald-600">{score}/100</div>
            </div>
          )}
        </div>

        {/* Questions List */}
        <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2">
          {questions.map((q, qIdx) => {
            const selectedOpt = selectedAnswers[qIdx];
            const isAnswered = selectedOpt !== undefined;

            return (
              <div key={q.id || qIdx} className="p-3.5 bg-zinc-50 border-2 border-black space-y-2">
                <div className="font-black text-xs text-black">
                  {qIdx + 1}. {q.question}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, optIdx) => {
                    const isChosen = selectedOpt === optIdx;
                    const isCorrect = q.correctIndex === optIdx;

                    let btnStyle = "bg-white text-zinc-800 hover:bg-zinc-100 border-black";
                    if (isSubmitted) {
                      if (isCorrect) {
                        btnStyle = "bg-emerald-200 text-emerald-950 font-black border-emerald-700";
                      } else if (isChosen && !isCorrect) {
                        btnStyle = "bg-red-200 text-red-950 font-black border-red-700";
                      }
                    } else if (isChosen) {
                      btnStyle = "bg-[#facc15] text-black font-black border-black shadow-[2px_2px_0px_#000000]";
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(qIdx, optIdx)}
                        className={`p-2 border-2 text-xs text-left transition-all ${btnStyle}`}
                      >
                        <span className="font-black mr-1">{String.fromCharCode(65 + optIdx)}.</span>{" "}
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation on submit */}
                {isSubmitted && (
                  <div className="p-2 bg-white border border-black text-[11px] text-zinc-800 space-y-0.5">
                    <span className="font-black text-cyan-900 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" /> Pembahasan Konsep Sains:
                    </span>
                    <p>{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="border-t-4 border-black pt-3 flex items-center justify-between">
          {!isSubmitted ? (
            <>
              <span className="text-xs text-zinc-500 font-bold">
                Terjawab: {Object.keys(selectedAnswers).length} dari {questions.length} soal
              </span>
              <button
                type="button"
                onClick={handleFinishQuiz}
                disabled={Object.keys(selectedAnswers).length < questions.length}
                className="brutal-btn-yellow px-5 py-2.5 text-xs font-black uppercase flex items-center gap-2 disabled:opacity-50"
              >
                <span>SELESAIKAN & KIRIM JAWABAN</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs font-black text-emerald-700">
                <CheckCircle2 className="w-5 h-5" />
                <span>NILAI TELAH TERCATAT KE DATABASE GURU!</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="brutal-btn-yellow px-6 py-2.5 text-xs font-black uppercase"
              >
                KEMBALI KE MEJA LAB
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
