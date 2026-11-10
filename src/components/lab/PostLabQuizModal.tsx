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
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl my-8 overflow-hidden text-slate-800 flex flex-col">
        {/* Header */}
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded">
                EVALUASI PASCA-PRAKTIKUM
              </span>
              <span className="text-xs text-slate-500">CupLabs Science Evaluator</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
              Kuis Observasi Sains: {taskTitle}
            </h3>
          </div>
          {isSubmitted ? (
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase">SKOR AKHIR</span>
              <div className="text-2xl font-black text-emerald-600">{score}/100</div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Questions List */}
        <div className="p-5 space-y-4 max-h-[460px] overflow-y-auto bg-slate-50">
          {questions.map((q, qIdx) => {
            const selectedOpt = selectedAnswers[qIdx];
            const isAnswered = selectedOpt !== undefined;

            return (
              <div key={q.id || qIdx} className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-xs">
                <div className="font-semibold text-xs sm:text-sm text-slate-900">
                  <span className="text-sky-600 font-bold mr-1.5">{qIdx + 1}.</span> {q.question}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, optIdx) => {
                    const isChosen = selectedOpt === optIdx;
                    const isCorrect = q.correctIndex === optIdx;

                    let btnStyle = "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200";
                    if (isSubmitted) {
                      if (isCorrect) {
                        btnStyle = "bg-emerald-600 text-white font-bold border-emerald-600 shadow-xs";
                      } else if (isChosen && !isCorrect) {
                        btnStyle = "bg-rose-600 text-white font-bold border-rose-600";
                      }
                    } else if (isChosen) {
                      btnStyle = "bg-sky-600 text-white font-semibold border-sky-600 shadow-xs";
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(qIdx, optIdx)}
                        className={`p-3 border rounded-xl text-xs text-left transition-all ${btnStyle}`}
                      >
                        <span className="font-bold opacity-80 mr-1.5">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>{" "}
                        {opt}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation on submit */}
                {isSubmitted && (
                  <div className="p-3 bg-sky-50 border-l-4 border-sky-600 rounded-lg text-xs text-slate-800 space-y-1">
                    <span className="font-bold text-sky-700 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Pembahasan Konsep Sains:
                    </span>
                    <p className="leading-relaxed text-slate-600">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="bg-slate-50 px-5 py-3.5 border-t border-slate-200 flex items-center justify-between">
          {!isSubmitted ? (
            <>
              <span className="text-xs text-slate-500 font-medium">
                Terjawab: {Object.keys(selectedAnswers).length} dari {questions.length} soal
              </span>
              <button
                type="button"
                onClick={handleFinishQuiz}
                disabled={Object.keys(selectedAnswers).length < questions.length}
                className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors shadow-sm"
              >
                <span>Selesaikan & Kirim Jawaban</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>Nilai kuis tersimpan otomatis di database guru!</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2.5 rounded-xl text-xs font-semibold transition-colors shadow-sm"
              >
                Kembali ke Meja Lab
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
