"use client";

import { useState } from "react";
import { CheckCircle2, XCircle, ArrowRight, HelpCircle, Sparkles } from "lucide-react";

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizStageProps {
  questions: QuizQuestion[];
  onQuizCompleted: (score: number, userAnswers: number[]) => void;
}

export default function QuizStage({ questions, onQuizCompleted }: QuizStageProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [userAnswers, setUserAnswers] = useState<number[]>([]);
  const [correctCount, setCorrectCount] = useState(0);

  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center font-mono border-3 border-black dark:border-white bg-[#111317]">
        <p className="text-zinc-400 text-xs mb-4">Tidak ada soal kuis awal untuk misi ini.</p>
        <button
          onClick={() => onQuizCompleted(100, [])}
          className="brutal-btn-yellow px-6 py-2.5 text-xs font-black uppercase"
        >
          [ LANJUT KE PEMINDAIAN KAMERA ]
        </button>
      </div>
    );
  }

  const currentQ = questions[currentIndex];
  const isCorrect = selectedOption === currentQ.correctIndex;

  const handleSelectOption = (idx: number) => {
    if (isAnswerSubmitted) return;
    setSelectedOption(idx);
  };

  const handleCheckAnswer = () => {
    if (selectedOption === null) return;
    setIsAnswerSubmitted(true);
    const newAnswers = [...userAnswers, selectedOption];
    setUserAnswers(newAnswers);

    if (selectedOption === currentQ.correctIndex) {
      setCorrectCount((prev) => prev + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex + 1 < questions.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedOption(null);
      setIsAnswerSubmitted(false);
    } else {
      const finalScore = Math.round(((correctCount + (isCorrect ? 0 : 0)) / questions.length) * 100);
      onQuizCompleted(finalScore, userAnswers);
    }
  };

  return (
    <div className="border-4 border-black dark:border-white bg-[#111317] p-6 sm:p-8 shadow-[8px_8px_0px_#000000] dark:shadow-[8px_8px_0px_#facc15] font-mono space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-3">
        <div className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#facc15] stroke-[2.5]" />
          <span className="font-black text-xs text-[#facc15] uppercase">
            [TAHAP 01: PRE-QUIZ KONTEKSTUAL // SOAL {currentIndex + 1} DARI {questions.length}]
          </span>
        </div>
        <span className="text-xs bg-black text-[#4ade80] px-2.5 py-0.5 border border-[#4ade80] font-black">
          BENAR: {correctCount} / {questions.length}
        </span>
      </div>

      {/* Question Text */}
      <div className="space-y-2">
        <h3 className="text-lg sm:text-xl font-black text-white uppercase leading-snug">
          {currentQ.question}
        </h3>
      </div>

      {/* Options */}
      <div className="space-y-2.5">
        {currentQ.options.map((opt, idx) => {
          let btnStyle = "bg-[#181a20] text-zinc-300 border-zinc-700 hover:border-white";
          if (selectedOption === idx) {
            btnStyle = "bg-[#facc15] text-black border-black font-black shadow-[3px_3px_0px_#000000]";
          }
          if (isAnswerSubmitted) {
            if (idx === currentQ.correctIndex) {
              btnStyle = "bg-[#4ade80] text-black border-black font-black shadow-[3px_3px_0px_#000000]";
            } else if (selectedOption === idx) {
              btnStyle = "bg-[#ef4444] text-white border-black font-black";
            }
          }

          return (
            <button
              key={idx}
              onClick={() => handleSelectOption(idx)}
              disabled={isAnswerSubmitted}
              className={`w-full p-4 text-left text-xs sm:text-sm font-mono border-2 transition-all flex items-center justify-between ${btnStyle}`}
            >
              <span>{String.fromCharCode(65 + idx)}. {opt}</span>
              {isAnswerSubmitted && idx === currentQ.correctIndex && (
                <CheckCircle2 className="w-4 h-4 text-black stroke-[3]" />
              )}
              {isAnswerSubmitted && selectedOption === idx && idx !== currentQ.correctIndex && (
                <XCircle className="w-4 h-4 text-white stroke-[3]" />
              )}
            </button>
          );
        })}
      </div>

      {/* Explanation Box */}
      {isAnswerSubmitted && (
        <div className={`p-4 border-2 font-mono text-xs space-y-1 ${
          isCorrect ? "bg-black border-[#4ade80] text-zinc-200" : "bg-black border-[#ef4444] text-zinc-200"
        }`}>
          <span className={`font-black uppercase block ${isCorrect ? "text-[#4ade80]" : "text-[#ef4444]"}`}>
            {isCorrect ? "[ ✓ JAWABAN TEPAT! ]" : "[ ✕ KURANG TEPAT ]"}
          </span>
          <p className="leading-relaxed">{currentQ.explanation}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="pt-2 flex justify-end">
        {!isAnswerSubmitted ? (
          <button
            onClick={handleCheckAnswer}
            disabled={selectedOption === null}
            className="brutal-btn-yellow px-8 py-3 text-xs sm:text-sm font-black uppercase disabled:opacity-50"
          >
            [ KUNCI JAWABAN ]
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            className="brutal-btn-yellow px-8 py-3 text-xs sm:text-sm font-black uppercase flex items-center gap-2"
          >
            <span>{currentIndex + 1 < questions.length ? "[ SOAL BERIKUTNYA ]" : "[ SELESAI & LANJUT KE SCAN KAMERA ]"}</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        )}
      </div>
    </div>
  );
}
