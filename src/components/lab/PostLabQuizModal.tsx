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
      <div className="bg-[#313338] border border-[#202225] w-full max-w-2xl rounded-xl shadow-2xl my-8 overflow-hidden text-[#dbdee1] flex flex-col">
        {/* Header */}
        <div className="bg-[#2b2d31] px-5 py-4 border-b border-[#202225] flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase bg-[#5865F2] text-white px-2 py-0.5 rounded">
                EVALUASI PASCA-PRAKTIKUM
              </span>
              <span className="text-xs text-[#949ba4]">Discord Quest Mode</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-[#f2f3f5] mt-1">
              Kuis Observasi Sains: {taskTitle}
            </h3>
          </div>
          {isSubmitted ? (
            <div className="text-right">
              <span className="text-[10px] font-bold text-[#949ba4] uppercase">SKOR AKHIR</span>
              <div className="text-2xl font-black text-[#57F287]">{score}/100</div>
            </div>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#949ba4] hover:text-white hover:bg-[#35373c] rounded-full transition-colors"
            >
              ✕
            </button>
          )}
        </div>

        {/* Questions List */}
        <div className="p-5 space-y-4 max-h-[460px] overflow-y-auto bg-[#313338]">
          {questions.map((q, qIdx) => {
            const selectedOpt = selectedAnswers[qIdx];
            const isAnswered = selectedOpt !== undefined;

            return (
              <div key={q.id || qIdx} className="p-4 bg-[#2b2d31] border border-[#3b3e45] rounded-lg space-y-3">
                <div className="font-semibold text-xs sm:text-sm text-[#f2f3f5]">
                  <span className="text-[#5865F2] font-bold mr-1.5">{qIdx + 1}.</span> {q.question}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {q.options.map((opt, optIdx) => {
                    const isChosen = selectedOpt === optIdx;
                    const isCorrect = q.correctIndex === optIdx;

                    let btnStyle = "bg-[#1e1f22] text-[#dbdee1] hover:bg-[#35373c] border-[#3b3e45]";
                    if (isSubmitted) {
                      if (isCorrect) {
                        btnStyle = "bg-[#23a55a] text-white font-bold border-transparent shadow";
                      } else if (isChosen && !isCorrect) {
                        btnStyle = "bg-[#ed4245] text-white font-bold border-transparent";
                      }
                    } else if (isChosen) {
                      btnStyle = "bg-[#5865F2] text-white font-semibold border-transparent shadow";
                    }

                    return (
                      <button
                        key={optIdx}
                        type="button"
                        onClick={() => handleSelectOption(qIdx, optIdx)}
                        className={`p-3 border rounded-lg text-xs text-left transition-all ${btnStyle}`}
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
                  <div className="p-3 bg-[#1e1f22] border-l-4 border-[#5865F2] rounded text-xs text-[#dbdee1] space-y-1">
                    <span className="font-bold text-[#5865F2] flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" /> Pembahasan Konsep Sains:
                    </span>
                    <p className="leading-relaxed text-[#949ba4]">{q.explanation}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottom Actions */}
        <div className="bg-[#2b2d31] px-5 py-3.5 border-t border-[#202225] flex items-center justify-between">
          {!isSubmitted ? (
            <>
              <span className="text-xs text-[#949ba4] font-medium">
                Terjawab: {Object.keys(selectedAnswers).length} dari {questions.length} soal
              </span>
              <button
                type="button"
                onClick={handleFinishQuiz}
                disabled={Object.keys(selectedAnswers).length < questions.length}
                className="bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2 transition-colors shadow"
              >
                <span>Selesaikan & Kirim Jawaban</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 text-xs font-bold text-[#57F287]">
                <CheckCircle2 className="w-5 h-5" />
                <span>Nilai kuis tersimpan otomatis di database guru!</span>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="bg-[#5865F2] hover:bg-[#4752c4] text-white px-6 py-2.5 rounded-lg text-xs font-semibold transition-colors shadow"
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
