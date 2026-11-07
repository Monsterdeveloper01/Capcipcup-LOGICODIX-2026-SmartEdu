"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import {
  Sparkles,
  BookOpen,
  Brain,
  Gamepad2,
  CheckCircle2,
  Database,
  ArrowRight,
  Send,
  Flame,
  Award,
  Zap,
} from "lucide-react";

interface DbStatus {
  success: boolean;
  message: string;
  details?: {
    host: string;
    port: number;
    database: string;
    user: string;
    latencyMs?: number;
    version?: string;
  };
}

export default function Home() {
  const [dbStatus, setDbStatus] = useState<DbStatus | null>(null);
  const [loadingDb, setLoadingDb] = useState(true);

  // Mini AI Tutor State
  const [tutorInput, setTutorInput] = useState("");
  const [tutorChat, setTutorChat] = useState<Array<{ sender: "user" | "ai"; text: string }>>([
    {
      sender: "ai",
      text: "Halo! Aku CapcipBot 🤖, tutor pribadi kamu. Ada materi pelajaran yang ingin kamu tanyakan hari ini?",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);

  // Mini Quiz Gamification State
  const [quizAnswered, setQuizAnswered] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState(0);
  const [streak, setStreak] = useState(3);

  useEffect(() => {
    fetch("/api/db-test")
      .then((res) => res.json())
      .then((data) => {
        setDbStatus(data);
        setLoadingDb(false);
      })
      .catch(() => {
        setDbStatus({
          success: false,
          message: "Gagal terhubung ke endpoint database.",
        });
        setLoadingDb(false);
      });
  }, []);

  const handleAskTutor = (preset?: string) => {
    const question = preset || tutorInput.trim();
    if (!question) return;

    setTutorChat((prev) => [...prev, { sender: "user", text: question }]);
    setTutorInput("");
    setIsTyping(true);

    setTimeout(() => {
      setTutorChat((prev) => [
        ...prev,
        {
          sender: "ai",
          text: `Pertanyaan yang bagus tentang "${question}"! Ini adalah contoh interaksi awal. Endpoint dan integrasi AI lengkap akan disesuaikan dengan arsitektur tim.`,
        },
      ]);
      setIsTyping(false);
    }, 700);
  };

  const handleAnswerQuiz = (index: number) => {
    if (quizAnswered !== null) return;
    setQuizAnswered(index);

    if (index === 1) {
      // Correct answer
      setQuizScore((prev) => prev + 100);
      setStreak((prev) => prev + 1);
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50/50 via-white to-amber-50/30 text-zinc-900 font-sans">
      {/* Top Notification / Database Status Bar */}
      <header className="border-b border-indigo-100/80 bg-white/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-600 to-violet-700 bg-clip-text text-transparent">
                Capcipcup
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 bg-amber-100/70 px-1.5 py-0.5 rounded ml-2">
                SmartEdu 2026
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {loadingDb ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-zinc-100 text-zinc-600 animate-pulse">
                <Database className="w-3.5 h-3.5" />
                <span>Checking Database...</span>
              </div>
            ) : dbStatus?.success ? (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <Database className="w-3.5 h-3.5" />
                <span>DB Connected ({dbStatus.details?.latencyMs}ms)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <Database className="w-3.5 h-3.5" />
                <span>DB Offline</span>
              </div>
            )}

            <div className="hidden sm:flex items-center gap-1.5 bg-amber-50 text-amber-700 border border-amber-200 px-3 py-1 rounded-full text-xs font-semibold">
              <Flame className="w-4 h-4 text-amber-500" />
              <span>{streak} Hari Streak!</span>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-6xl mx-auto px-4 pt-16 pb-12 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-sm font-semibold mb-6 shadow-sm">
          <Zap className="w-4 h-4 text-indigo-500" />
          <span>Solusi Digital LOGICODIX 2026: Smart & Fun Education</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-[1.15] max-w-4xl mx-auto text-zinc-900">
          Belajar Lebih{" "}
          <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-pink-500 bg-clip-text text-transparent">
            Interaktif, Aksesibel
          </span>
          , & Menyenangkan.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-zinc-600 max-w-2xl mx-auto leading-relaxed">
          Platform edukasi masa depan yang menggabungkan kecerdasan <strong>AI Tutor Pribadi</strong> dengan{" "}
          <strong>visualisasi materi interaktif</strong> dan <strong>gamifikasi seru</strong> bagi pelajar serta pengajar.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <a
            href="#ai-tutor"
            className="px-6 py-3.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-200 hover:shadow-indigo-300 transition-all flex items-center gap-2"
          >
            Coba AI Tutor Sekarang <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#quiz-arena"
            className="px-6 py-3.5 rounded-xl bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 font-bold text-sm shadow-sm transition-all flex items-center gap-2"
          >
            <Gamepad2 className="w-4 h-4 text-amber-500" /> Mainkan Kuis Interaktif
          </a>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-zinc-900 mb-2">Tutor Pribadi Berbasis AI</h3>
            <p className="text-zinc-600 text-sm leading-relaxed">
              Membimbing siswa 24/7 dengan penjelasan sederhana, gaya bahasa adaptif, dan bimbingan step-by-step sesuai kecepatan belajar.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-violet-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center mb-4">
              <BookOpen className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-zinc-900 mb-2">Visualisasi Materi Interaktif</h3>
            <p className="text-zinc-600 text-sm leading-relaxed">
              Mengubah rumus abstrak, sains, dan matematika menjadi grafis dinamis yang bisa disentuh, dimanipulasi, dan disimulasikan.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-amber-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg text-zinc-900 mb-2">Gamifikasi & Misi Harian</h3>
            <p className="text-zinc-600 text-sm leading-relaxed">
              Sistem XP, badge penghargaan, streak belajar harian, dan kuis kompetitif yang membuat proses belajar terasa seperti petualangan.
            </p>
          </div>
        </div>
      </section>

      {/* Interactive AI Tutor Playground */}
      <section id="ai-tutor" className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-base">CapcipBot AI Tutor</h2>
                <p className="text-xs text-indigo-100">Siap menjawab & menjelaskan materi apa pun</p>
              </div>
            </div>
            <span className="text-xs bg-white/20 px-2.5 py-1 rounded-full font-medium">Demo Aktif</span>
          </div>

          {/* Chat Messages */}
          <div className="p-6 h-80 overflow-y-auto space-y-4 bg-zinc-50/50">
            {tutorChat.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.sender === "ai" && (
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex-shrink-0 flex items-center justify-center text-xs font-bold">
                    AI
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    msg.sender === "user"
                      ? "bg-indigo-600 text-white rounded-br-none"
                      : "bg-white text-zinc-800 border border-zinc-200/80 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex gap-2 items-center text-xs text-zinc-400 italic">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce" />
                CapcipBot sedang merangkai penjelasan...
              </div>
            )}
          </div>

          {/* Quick Preset Buttons */}
          <div className="px-6 py-2.5 bg-zinc-100/70 border-t border-zinc-200/80 flex flex-wrap gap-2 items-center text-xs text-zinc-500">
            <span>Coba cepat:</span>
            <button
              onClick={() => handleAskTutor("Jelaskan Fotosintesis dengan mudah")}
              className="px-2.5 py-1 rounded-lg bg-white border border-zinc-200 hover:border-indigo-400 text-zinc-700 font-medium transition-colors"
            >
              🌿 Fotosintesis
            </button>
            <button
              onClick={() => handleAskTutor("Bagaimana rumus Teorema Pythagoras?")}
              className="px-2.5 py-1 rounded-lg bg-white border border-zinc-200 hover:border-indigo-400 text-zinc-700 font-medium transition-colors"
            >
              📐 Pythagoras
            </button>
          </div>

          {/* Input Box */}
          <div className="p-4 bg-white border-t border-zinc-200/80 flex gap-2">
            <input
              type="text"
              value={tutorInput}
              onChange={(e) => setTutorInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAskTutor()}
              placeholder="Tanyakan materi pelajaran (misal: gravitasi, pecahan, sejarah)..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            />
            <button
              onClick={() => handleAskTutor()}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Send className="w-4 h-4" /> Kirim
            </button>
          </div>
        </div>
      </section>

      {/* Gamified Quiz Arena Section */}
      <section id="quiz-arena" className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-1 text-white shadow-xl">
          <div className="bg-white rounded-[22px] p-6 sm:p-8 text-zinc-900">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-wider">
                  Kuis Harian Cepat
                </span>
                <span className="text-xs text-zinc-400 font-medium">+100 XP</span>
              </div>
              <div className="flex items-center gap-1.5 text-amber-600 font-bold text-sm">
                <Award className="w-4 h-4" /> Skor: {quizScore} XP
              </div>
            </div>

            <h3 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-6">
              Manakah gas yang paling banyak dihasilkan oleh tumbuhan saat proses fotosintesis berlangsung?
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              {[
                { label: "A", text: "Karbon Dioksida (CO₂)" },
                { label: "B", text: "Oksigen (O₂)" },
                { label: "C", text: "Nitrogen (N₂)" },
                { label: "D", text: "Gas Metana (CH₄)" },
              ].map((opt, i) => {
                const isSelected = quizAnswered === i;
                const isCorrect = i === 1;

                let btnStyle = "bg-zinc-50 border-zinc-200 hover:border-indigo-400 text-zinc-800";
                if (quizAnswered !== null) {
                  if (isCorrect) {
                    btnStyle = "bg-emerald-50 border-emerald-400 text-emerald-800 font-bold ring-2 ring-emerald-300";
                  } else if (isSelected && !isCorrect) {
                    btnStyle = "bg-rose-50 border-rose-300 text-rose-800 line-through";
                  } else {
                    btnStyle = "bg-zinc-50 border-zinc-200 text-zinc-400 opacity-60";
                  }
                }

                return (
                  <button
                    key={i}
                    onClick={() => handleAnswerQuiz(i)}
                    disabled={quizAnswered !== null}
                    className={`p-4 rounded-xl border text-left flex items-center gap-3 transition-all ${btnStyle}`}
                  >
                    <span className="w-7 h-7 rounded-lg bg-zinc-200/80 text-zinc-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {opt.label}
                    </span>
                    <span className="text-sm">{opt.text}</span>
                  </button>
                );
              })}
            </div>

            {quizAnswered !== null && (
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                <span>
                  <strong>Luar biasa!</strong> Tumbuhan menghasilkan Oksigen (O₂) melalui reaksi terang fotosintesis. Kamu mendapatkan <strong>+100 XP</strong>!
                </span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-200 py-8 text-center text-xs text-zinc-500">
        <p>Capcipcup SmartEdu &copy; 2026. Dikembangkan untuk kompetisi LOGICODIX 2026 - Smart & Fun Education.</p>
      </footer>
    </div>
  );
}
