"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AuthLoginModal from "@/components/auth/AuthLoginModal";
import { AuthUser } from "@/lib/auth/types";
import { CHEMICAL_CATALOG, REACTION_CATALOG } from "@/lib/lab/chemicals-db";
import { resolveReactionForTask } from "@/lib/lab/reactionResolver";
import { ExperimentDetailLog, LabSubmission, LabTask } from "@/lib/lab/types";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  FlaskConical,
  HelpCircle,
  Lock,
  LogIn,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  XCircle,
} from "lucide-react";

function QuizArenaContent() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId");
  const classCode = searchParams.get("classCode");

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const [task, setTask] = useState<LabTask | null>(null);
  const [isLoadingTask, setIsLoadingTask] = useState(true);
  const [taskError, setTaskError] = useState<string | null>(null);

  const [submission, setSubmission] = useState<LabSubmission | null>(null);
  const [selectedAnswers, setSelectedAnswers] = useState<{ [qIdx: number]: number }>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [score, setScore] = useState(0);
  const [saveNotice, setSaveNotice] = useState<string | null>(null);

  // 1. Check user session
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch(() => setCurrentUser(null))
      .finally(() => setIsAuthLoading(false));
  }, []);

  // 2. Fetch task by ID
  useEffect(() => {
    if (!taskId) {
      setTaskError("ID tugas tidak ditemukan pada URL.");
      setIsLoadingTask(false);
      return;
    }

    setIsLoadingTask(true);
    fetch(`/api/lab/tasks?taskId=${encodeURIComponent(taskId)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.tasks && data.tasks.length > 0) {
          setTask(data.tasks[0]);
          setTaskError(null);
        } else {
          setTaskError("Tugas praktikum tidak ditemukan.");
        }
      })
      .catch(() => setTaskError("Gagal memuat data tugas dari server."))
      .finally(() => setIsLoadingTask(false));
  }, [taskId]);

  // 3. Fetch student's existing submission for this task
  useEffect(() => {
    if (!taskId || !currentUser?.name) return;

    fetch(
      `/api/lab/submissions?taskId=${encodeURIComponent(taskId)}&studentName=${encodeURIComponent(
        currentUser.name
      )}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.submissions && data.submissions.length > 0) {
          const existing = data.submissions[0];
          setSubmission(existing);
          setIsSubmitted(true);
          setScore(existing.score);
          if (Array.isArray(existing.answers)) {
            const ansMap: { [idx: number]: number } = {};
            existing.answers.forEach((a: any, idx: number) => {
              if (a.selectedIndex !== undefined && a.selectedIndex !== null) {
                ansMap[idx] = a.selectedIndex;
              }
            });
            setSelectedAnswers(ansMap);
          }
        }
      })
      .catch(() => {});
  }, [taskId, currentUser?.name]);

  const handleSelectOption = (qIndex: number, optIndex: number) => {
    if (isSubmitted || isSubmitting) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [qIndex]: optIndex,
    }));
  };

  const handleRetake = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setScore(0);
    setSaveNotice(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitQuiz = async () => {
    if (!task) return;
    const questions = task.questions || [];
    if (questions.length === 0) return;

    setIsSubmitting(true);
    setSaveNotice(null);

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

    const calculatedScore = Math.round((correctCount / questions.length) * 100);
    const kkm = task.kkmScore ?? 75;
    const isPassed = calculatedScore >= kkm;
    const studentUser = (currentUser?.name || "Siswa Praktikan").trim();

    // Retrieve captured 3D experiment context from /lab if available
    let pendingExp: { isReactionAchieved?: boolean; experimentDetails?: ExperimentDetailLog } | null = null;
    try {
      const raw = localStorage.getItem(`cuplabs_pending_exp_${task.id}`);
      if (raw) {
        pendingExp = JSON.parse(raw);
      }
    } catch {
      pendingExp = null;
    }

    const fallbackResolved = resolveReactionForTask(task, submission?.experimentDetails);
    const isReactionAchieved =
      pendingExp?.isReactionAchieved ??
      submission?.isReactionAchieved ??
      true;

    const matchedRx = REACTION_CATALOG.find(
      (r) =>
        (task.expectedReactionId && r.id === task.expectedReactionId) ||
        (task.title && task.title.toLowerCase().includes(r.title.toLowerCase()))
    );

    const experimentDetails: ExperimentDetailLog =
      pendingExp?.experimentDetails ||
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
    const correctAnswers = answerRecords.filter((a) => a.isCorrect);

    let diagnosticSummary = `Praktikum "${task.title}" telah diselesaikan oleh ${studentUser}. Skor Kuis: ${calculatedScore}/100 (Batas KKM: ${kkm}) — Status: ${
      isPassed ? "Tuntas Lulus KKM" : "Belum Tuntas (Di Bawah KKM)"
    }. Target Reaksi 3D: ${
      isReactionAchieved ? "Berhasil Diamati Sempurna" : "Selesai Dieksplorasi"
    }. `;

    if (wrongAnswers.length === 0) {
      diagnosticSummary +=
        "Siswa menunjukkan penguasaan konseptual sempurna (100% akurasi) terhadap seluruh butir soal mekanisme reaksi, stoikiometri seimbang, dan perubahan energi termal.";
    } else {
      diagnosticSummary += `Siswa menguasai ${correctAnswers.length} dari ${
        answerRecords.length
      } konsep kuis. Perlu penguatan pada area miskonsepsi berikut: ${wrongAnswers
        .map((w, i) => `[Soal ${i + 1}: ${w.question || "Konsep Reaksi"}]`)
        .join(", ")}.`;
    }

    try {
      const res = await fetch("/api/lab/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: task.id,
          studentName: studentUser,
          isReactionAchieved,
          score: calculatedScore,
          answers: answerRecords,
          aiAnalysis: diagnosticSummary,
          experimentDetails,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setScore(calculatedScore);
        setIsSubmitted(true);
        setSubmission({
          id: data.submissionId || `sub_${Date.now()}`,
          taskId: task.id,
          studentName: studentUser,
          isReactionAchieved,
          score: calculatedScore,
          answers: answerRecords,
          aiAnalysis: diagnosticSummary,
          experimentDetails,
          completedAt: new Date().toISOString(),
        });
        setSaveNotice("Nilai dan jawaban berhasil tersimpan otomatis ke akun guru.");

        // Signal the /lab tab that submission has been updated
        try {
          localStorage.setItem(
            "cuplabs_submission_updated",
            JSON.stringify({ taskId: task.id, score: calculatedScore, timestamp: Date.now() })
          );
        } catch {}

        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setSaveNotice(data.error || "Gagal menyimpan skor kuis.");
      }
    } catch {
      setSaveNotice("Terjadi gangguan koneksi saat menyimpan nilai kuis.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingTask || isAuthLoading) {
    return (
      <div className="min-h-screen pop-dots flex flex-col items-center justify-center p-6">
        <div className="pop-card rounded-3xl p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FACC15] border-2 border-slate-900 mx-auto flex items-center justify-center">
            <div className="w-6 h-6 border-4 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
          </div>
          <p className="text-sm font-bold text-slate-900">Menyiapkan Arena Kuis Praktikum...</p>
        </div>
      </div>
    );
  }

  if (taskError || !task) {
    return (
      <div className="min-h-screen pop-dots flex flex-col items-center justify-center p-6">
        <div className="pop-card rounded-3xl p-8 max-w-md w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FB7185] border-2 border-slate-900 text-slate-900 mx-auto flex items-center justify-center">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-display font-bold text-slate-900">Kuis Tidak Tersedia</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {taskError || "Data kuis untuk tugas ini belum tersedia."}
          </p>
          <Link
            href="/"
            className="pop-btn bg-[#38BDF8] text-slate-900 px-5 py-2.5 rounded-xl text-xs gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const questions = task.questions || [];
  const kkmScore = task.kkmScore ?? 75;
  const allowRetake = task.allowRetakeBelowKkm !== false;
  const showReviewDetails = task.showQuizReviewDetails !== false;
  const answeredCount = Object.keys(selectedAnswers).length;
  const isAllAnswered = questions.length > 0 && answeredCount === questions.length;
  const isPassed = score >= kkmScore;

  return (
    <div className="min-h-screen pop-dots text-slate-900 pb-16">
      {/* Compact Top Bar */}
      <div className="sticky top-0 z-30 bg-[#FFFDF7]/95 backdrop-blur-sm border-b-2 border-slate-900 px-4 sm:px-8 py-3">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FACC15] border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] flex items-center justify-center text-slate-900">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase bg-[#38BDF8] text-slate-900 border border-slate-900 px-2 py-0.5 rounded-md">
                  ARENA KUIS SAINS
                </span>
                <span className="text-xs font-bold text-slate-600">
                  {task.gradeLevel} • PIN {task.roomCode}
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-display font-bold text-slate-900 line-clamp-1">
                {task.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {currentUser ? (
              <span className="px-3 py-1.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold text-slate-900">
                {currentUser.name}
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="pop-btn bg-[#FACC15] text-slate-900 px-3.5 py-1.5 rounded-xl text-xs gap-1.5"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk Akun Siswa</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                if (window.opener) {
                  window.close();
                } else {
                  window.location.href = `/lab?classCode=${classCode || task.roomCode}&taskId=${task.id}&mode=task`;
                }
              }}
              className="pop-btn bg-white hover:bg-slate-100 text-slate-900 px-3.5 py-1.5 rounded-xl text-xs gap-1.5"
            >
              <FlaskConical className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Kembali ke Lab</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-6 space-y-6">
        {/* Login warning for guests */}
        {!currentUser && (
          <div className="pop-card rounded-2xl p-4 bg-[#FEF08A] flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-900">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span>
                Kamu belum masuk akun siswa. Masuk terlebih dahulu agar nilai kuis tercatat ke daftar nilai guru.
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="pop-btn bg-white text-slate-900 px-4 py-1.5 rounded-xl text-xs gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk Sekarang</span>
            </button>
          </div>
        )}

        {/* Result Banner (Shown after quiz submission) */}
        {isSubmitted && (
          <div
            className={`pop-card rounded-3xl p-6 space-y-4 ${
              isPassed ? "bg-[#D1FAE5]" : "bg-[#FFE4E6]"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-lg border-2 border-slate-900 ${
                      isPassed ? "bg-[#34D399] text-slate-900" : "bg-[#FB7185] text-white"
                    }`}
                  >
                    {isPassed ? "LULUS KKM" : "DI BAWAH KKM"}
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    Batas KKM Tugas: {kkmScore} / 100
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
                  {isPassed
                    ? "Keren! Kamu Berhasil Menguasai Materi Praktikum Ini"
                    : "Tetap Semangat! Periksa Kembali Pengamatanmu"}
                </h2>
                <p className="text-xs sm:text-sm text-slate-700 font-medium">
                  {saveNotice ||
                    (isPassed
                      ? "Skormu sudah melampaui batas ketuntasan minimal dan tersimpan di rapor guru."
                      : allowRetake
                      ? "Gurumu mengizinkan remedial. Kamu bisa mengulang kuis atau kembali mengecek reaksi di Meja Lab 3D."
                      : "Tugas ini bersifat sekali selesai tanpa pengulangan kuis.")}
                </p>
              </div>

              <div className="bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-2xl px-6 py-4 text-center shrink-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                  SKOR AKHIR
                </span>
                <span
                  className={`text-3xl font-mono font-black ${
                    isPassed ? "text-[#059669]" : "text-[#E11D48]"
                  }`}
                >
                  {score}
                  <span className="text-base text-slate-400 font-bold">/100</span>
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t-2 border-slate-900/15">
              {!isPassed && allowRetake && (
                <button
                  type="button"
                  onClick={handleRetake}
                  className="pop-btn bg-[#FACC15] text-slate-900 px-4 py-2 rounded-xl text-xs gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Ulangi Kuis (Remedial)</span>
                </button>
              )}

              <Link
                href={`/lab?classCode=${classCode || task.roomCode}&taskId=${task.id}&mode=task`}
                className="pop-btn bg-[#38BDF8] text-slate-900 px-4 py-2 rounded-xl text-xs gap-1.5"
              >
                <FlaskConical className="w-4 h-4" />
                <span>Buka Meja Lab 3D</span>
              </Link>

              <Link
                href="/"
                className="pop-btn bg-white text-slate-900 px-4 py-2 rounded-xl text-xs gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Kembali ke Dashboard</span>
              </Link>
            </div>
          </div>
        )}

        {/* Review Mode Notice when showQuizReviewDetails is OFF */}
        {isSubmitted && !showReviewDetails && (
          <div className="pop-card rounded-2xl p-4 bg-[#E0F2FE] flex items-center gap-3 text-xs text-slate-800">
            <Lock className="w-5 h-5 text-[#2563EB] shrink-0" />
            <div>
              <strong className="block text-slate-900">Mode Review Ringkas Diaktifkan Guru</strong>
              <span>
                Kamu dapat melihat status benar atau salah pada pilihanmu, sementara kunci jawaban dan pembahasan ilmiah dirahasiakan.
              </span>
            </div>
          </div>
        )}

        {/* Quiz Progress Card (before submit) */}
        {!isSubmitted && questions.length > 0 && (
          <div className="pop-card rounded-2xl p-4 bg-white flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#34D399] border-2 border-slate-900 flex items-center justify-center text-slate-900">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-extrabold text-slate-900 block">
                  Progres Pengerjaan: {answeredCount} dari {questions.length} Soal
                </span>
                <span className="text-[11px] text-slate-600 font-medium">
                  KKM Minimal: {kkmScore} • {allowRetake ? "Remedial Diizinkan" : "Sekali Kesempatan"}
                </span>
              </div>
            </div>

            <div className="w-full sm:w-56 h-3.5 bg-slate-100 border-2 border-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#34D399] transition-all duration-300"
                style={{ width: `${Math.round((answeredCount / questions.length) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {/* Questions List */}
        {questions.length === 0 ? (
          <div className="pop-card rounded-3xl p-8 text-center space-y-3 bg-white">
            <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Tidak Ada Soal Kuis</h3>
            <p className="text-xs text-slate-600">
              Tugas praktikum ini tidak memiliki butir kuis evaluasi tertulis.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {questions.map((q, qIdx) => {
              const userChoice = selectedAnswers[qIdx];
              const isUserRight = userChoice === q.correctIndex;

              return (
                <div
                  key={q.id || qIdx}
                  className="pop-card rounded-3xl p-5 sm:p-6 bg-white space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span className="w-8 h-8 rounded-xl bg-[#FACC15] border-2 border-slate-900 font-mono font-black text-xs flex items-center justify-center shrink-0">
                        {qIdx + 1}
                      </span>
                      <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug pt-0.5">
                        {q.question}
                      </h3>
                    </div>

                    {isSubmitted && (
                      <span
                        className={`px-2.5 py-1 rounded-lg border-2 border-slate-900 text-[10px] font-black uppercase shrink-0 flex items-center gap-1 ${
                          isUserRight
                            ? "bg-[#34D399] text-slate-900"
                            : "bg-[#FB7185] text-white"
                        }`}
                      >
                        {isUserRight ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Benar</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Kurang Tepat</span>
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 gap-2.5 pl-0 sm:pl-11">
                    {q.options.map((opt, optIdx) => {
                      const isChosen = userChoice === optIdx;
                      const isCorrectOption = q.correctIndex === optIdx;
                      const letter = String.fromCharCode(65 + optIdx);

                      let cardStyle =
                        "bg-slate-50 hover:bg-[#FEF9C3] border-slate-900 text-slate-800";

                      if (!isSubmitted && isChosen) {
                        cardStyle =
                          "bg-[#38BDF8] border-slate-900 text-slate-900 shadow-[3px_3px_0px_#0f172a] -translate-x-[1px] -translate-y-[1px]";
                      } else if (isSubmitted) {
                        if (showReviewDetails) {
                          if (isCorrectOption) {
                            cardStyle = "bg-[#D1FAE5] border-slate-900 text-slate-900";
                          } else if (isChosen && !isCorrectOption) {
                            cardStyle = "bg-[#FFE4E6] border-slate-900 text-slate-900";
                          } else {
                            cardStyle = "bg-slate-50 border-slate-300 text-slate-500 opacity-75";
                          }
                        } else {
                          if (isChosen && isUserRight) {
                            cardStyle = "bg-[#D1FAE5] border-slate-900 text-slate-900";
                          } else if (isChosen && !isUserRight) {
                            cardStyle = "bg-[#FFE4E6] border-slate-900 text-slate-900";
                          } else {
                            cardStyle = "bg-slate-50 border-slate-300 text-slate-500 opacity-75";
                          }
                        }
                      }

                      return (
                        <button
                          key={optIdx}
                          type="button"
                          disabled={isSubmitted}
                          onClick={() => handleSelectOption(qIdx, optIdx)}
                          className={`w-full text-left p-3.5 rounded-2xl border-2 text-xs sm:text-sm font-semibold transition-all flex items-center justify-between gap-3 cursor-pointer disabled:cursor-default ${cardStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span
                              className={`w-7 h-7 rounded-lg border-2 border-slate-900 font-mono font-black text-xs flex items-center justify-center shrink-0 ${
                                isChosen ? "bg-white text-slate-900" : "bg-white text-slate-700"
                              }`}
                            >
                              {letter}
                            </span>
                            <span>{opt}</span>
                          </div>

                          {isSubmitted && showReviewDetails && isCorrectOption && (
                            <span className="text-[10px] font-black uppercase bg-[#34D399] border border-slate-900 text-slate-900 px-2 py-0.5 rounded shrink-0">
                              Kunci Benar
                            </span>
                          )}
                          {isSubmitted && isChosen && (
                            <span className="text-[10px] font-black uppercase bg-white border border-slate-900 text-slate-900 px-2 py-0.5 rounded shrink-0">
                              Pilihanmu
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Scientific Explanation (Only when submitted AND showReviewDetails is true) */}
                  {isSubmitted && showReviewDetails && q.explanation && (
                    <div className="ml-0 sm:ml-11 p-3.5 bg-[#FEF9C3] border-2 border-slate-900 rounded-2xl text-xs text-slate-800 space-y-1">
                      <div className="flex items-center gap-1.5 font-extrabold text-slate-900 uppercase tracking-wide text-[11px]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Pembahasan Ilmiah</span>
                      </div>
                      <p className="leading-relaxed">{q.explanation}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Bottom Submit Action */}
        {!isSubmitted && questions.length > 0 && (
          <div className="pop-card rounded-3xl p-5 bg-white flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-0.5">
              <span className="text-xs font-extrabold text-slate-900 block">
                {isAllAnswered
                  ? "Semua soal sudah dijawab! Siap dikumpulkan?"
                  : `Masih ada ${questions.length - answeredCount} soal yang belum dipilih`}
              </span>
              <span className="text-[11px] text-slate-500">
                Pastikan jawabanmu sesuai hasil pengamatan di Meja Lab 3D.
              </span>
            </div>

            <button
              type="button"
              disabled={!isAllAnswered || isSubmitting}
              onClick={handleSubmitQuiz}
              className="pop-btn bg-[#34D399] hover:bg-[#10B981] text-slate-900 px-6 py-3 rounded-2xl text-xs sm:text-sm gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{isSubmitting ? "Menyimpan Jawaban..." : "Kumpulkan Jawaban Kuis"}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      <AuthLoginModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
        }}
        currentUser={currentUser}
      />
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pop-dots flex items-center justify-center p-6">
          <div className="pop-card rounded-3xl p-8 text-center">
            <p className="text-sm font-bold text-slate-900">Memuat Halaman Kuis...</p>
          </div>
        </div>
      }
    >
      <QuizArenaContent />
    </Suspense>
  );
}

