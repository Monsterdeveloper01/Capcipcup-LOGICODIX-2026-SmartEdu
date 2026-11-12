"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AuthUser } from "@/lib/auth/types";
import { LabSubmission, LabTask } from "@/lib/lab/types";
import { DUMMY_TUTORIAL_TASK } from "@/lib/lab/tutorialConstants";
import InteractiveQuizArena from "@/components/quiz/InteractiveQuizArena";
import { AlertCircle, ArrowLeft } from "lucide-react";

function QuizArenaContent() {
  const searchParams = useSearchParams();
  const taskId = searchParams.get("taskId");

  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const [task, setTask] = useState<LabTask | null>(null);
  const [isLoadingTask, setIsLoadingTask] = useState(true);
  const [taskError, setTaskError] = useState<string | null>(null);

  const [submission, setSubmission] = useState<LabSubmission | null>(null);

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

    if (taskId === DUMMY_TUTORIAL_TASK.id) {
      setTask(DUMMY_TUTORIAL_TASK);
      setTaskError(null);
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
          setSubmission(data.submissions[0]);
        }
      })
      .catch(() => {});
  }, [taskId, currentUser?.name]);

  if (isLoadingTask || isAuthLoading) {
    return (
      <div className="min-h-screen pop-dots flex flex-col items-center justify-center p-6">
        <div className="pop-card rounded-3xl p-8 max-w-sm w-full text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-[#FACC15] border-2 border-slate-900 mx-auto flex items-center justify-center shadow-[3px_3px_0px_#0f172a]">
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
        <div className="pop-card rounded-3xl p-8 max-w-md w-full text-center space-y-4 bg-white border-3 border-slate-900 shadow-[6px_6px_0px_#0f172a]">
          <div className="w-12 h-12 rounded-2xl bg-[#FB7185] border-2 border-slate-900 text-white mx-auto flex items-center justify-center shadow-[2px_2px_0px_#0f172a]">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-display font-black text-slate-900">Kuis Tidak Tersedia</h2>
          <p className="text-xs text-slate-600 leading-relaxed">
            {taskError || "Data kuis untuk tugas ini belum tersedia."}
          </p>
          <div className="pt-2">
            <Link
              href="/"
              className="pop-btn bg-[#38BDF8] text-slate-900 px-5 py-2.5 rounded-xl text-xs font-black gap-2 shadow-[3px_3px_0px_#0f172a]"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <InteractiveQuizArena
      task={task}
      currentUser={currentUser}
      initialSubmission={submission}
      isModal={false}
    />
  );
}

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen pop-dots flex items-center justify-center p-6">
          <div className="pop-card rounded-3xl p-8 text-center bg-white border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a]">
            <p className="text-sm font-bold text-slate-900">Memuat Halaman Kuis...</p>
          </div>
        </div>
      }
    >
      <QuizArenaContent />
    </Suspense>
  );
}
