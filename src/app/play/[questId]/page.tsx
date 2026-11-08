"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import QuizStage from "@/components/game/QuizStage";
import CameraScanner from "@/components/game/CameraScanner";
import RoleplayArena from "@/components/game/RoleplayArena";
import { YoloDetection, PythonSpeechMetrics } from "@/lib/python-api";
import { ArrowLeft, Terminal, Sparkles, CheckCircle2 } from "lucide-react";
import Link from "next/link";

type GameStage = "quiz" | "scanner" | "arena" | "submitting";

export default function PlayQuestPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();

  const questId = params.questId as string;
  const subIdFromUrl = searchParams.get("subId");
  const studentNameFromUrl = searchParams.get("name") || "Siswa Petualang";

  const [quest, setQuest] = useState<any>(null);
  const [stage, setStage] = useState<GameStage>("quiz");
  const [isLoading, setIsLoading] = useState(true);

  // Stage results
  const [quizScore, setQuizScore] = useState<number>(100);
  const [scannedObject, setScannedObject] = useState<YoloDetection | null>(null);

  useEffect(() => {
    fetchQuest();
  }, [questId]);

  const fetchQuest = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/quests/${questId}`);
      const data = await res.json();
      if (res.ok && data.quest) {
        setQuest(data.quest);
      } else {
        // Fallback demo quest
        setQuest({
          id: questId,
          title: "Misi Negosiasi Produk Ramah Lingkungan",
          case_study_story: "Kamu adalah kreator produk lokal. Seorang investor asing melihat botol minum dan buku di mejamu, lalu menantangmu mempresentasikan ide paket produk pelajar ramah lingkungan.",
          npc_name: "Ms. Clara",
          npc_persona: "Green Investor antusias, kritis soal daya tahan produk, suka bertanya detail.",
          required_object_hint: "Gunakan botol minum (bottle) atau buku (book) di sekitarmu sebagai contoh produk fisik!",
          mission_objectives: [
            "Jelaskan keunggulan utama benda yang kamu scan menggunakan minimal 2 kata sifat bahasa Inggris",
            "Jawab pertanyaan Ms. Clara mengenai manfaat produk tersebut bagi pelajar di Indonesia",
            "Tutup presentasi dengan ajakan kerja sama yang sopan",
          ],
          target_vocabularies: ["eco-friendly", "durable", "sustainable", "student", "reusable"],
          quiz_questions: [
            {
              question: "Kata sifat manakah yang paling tepat untuk mendeskripsikan botol minum yang tidak mudah pecah dan tahan lama?",
              options: ["Fragile", "Durable", "Temporary", "Hazardous"],
              correctIndex: 1,
              explanation: "'Durable' berarti tahan lama dan kuat, sangat cocok untuk mendeskripsikan kualitas fisik produk.",
            },
            {
              question: "What is the best way to open a professional elevator pitch?",
              options: [
                "I would like to present our forty-page market analysis regarding youth consumer habits.",
                "We cut cafe delivery costs by 40%.",
                "I have always dreamed of working at your prestigious company since my childhood.",
                "You should listen to my detailed technical specifications regarding our software product."
              ],
              correctIndex: 1,
              explanation: "'We cut cafe delivery costs by 40%' is concise, punchy, and delivers immediate value.",
            },
          ],
        });
      }
    } catch (err) {
      console.warn("Fetch quest error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuizCompleted = (score: number, userAnswers: number[]) => {
    setQuizScore(score);
    setStage("scanner");
  };

  const handleObjectConfirmed = (detection: YoloDetection) => {
    setScannedObject(detection);
    setStage("arena");
  };

  const handleFinishArena = async (chatHistory: any[], pythonMetrics: PythonSpeechMetrics) => {
    setStage("submitting");

    const finalSubId = subIdFromUrl || `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quest,
          submissionId: finalSubId,
          studentName: studentNameFromUrl,
          quizScore,
          chatHistory,
          pythonMetrics,
          durationSeconds: 90,
        }),
      });

      const data = await res.json();
      router.push(`/result/${finalSubId}`);
    } catch (err) {
      console.error("Evaluation submit error:", err);
      router.push(`/result/${finalSubId}`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen brutal-grid flex items-center justify-center p-4 font-mono text-white">
        <div className="border-4 border-black dark:border-white bg-[#111317] p-8 text-center space-y-3 shadow-[8px_8px_0px_#000000]">
          <div className="w-10 h-10 border-4 border-[#facc15] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs uppercase font-black text-[#facc15]">[MEMUAT UNIFIED GAME ENGINE...]</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen brutal-grid text-white font-mono p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Top Breadcrumb & Progress Tracker */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-800 pb-3">
          <Link
            href="/"
            className="brutal-btn-dark px-3 py-1.5 text-xs font-black flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>[ KELUAR KE HOME ]</span>
          </Link>

          <div className="flex items-center gap-2 text-xs font-black uppercase">
            <span
              className={`px-2.5 py-1 border ${
                stage === "quiz"
                  ? "bg-[#facc15] text-black border-black shadow-[2px_2px_0px_#000000]"
                  : "bg-black text-zinc-500 border-zinc-700"
              }`}
            >
              1. PRE-QUIZ
            </span>
            <span className="text-zinc-600">→</span>
            <span
              className={`px-2.5 py-1 border ${
                stage === "scanner"
                  ? "bg-[#facc15] text-black border-black shadow-[2px_2px_0px_#000000]"
                  : "bg-black text-zinc-500 border-zinc-700"
              }`}
            >
              2. YOLO SCAN
            </span>
            <span className="text-zinc-600">→</span>
            <span
              className={`px-2.5 py-1 border ${
                stage === "arena"
                  ? "bg-[#facc15] text-black border-black shadow-[2px_2px_0px_#000000]"
                  : "bg-black text-zinc-500 border-zinc-700"
              }`}
            >
              3. NPC ARENA
            </span>
          </div>
        </div>

        {/* Quest Scenario Briefing Banner */}
        <div className="border-4 border-black dark:border-white bg-[#111317] p-6 shadow-[6px_6px_0px_#000000] dark:shadow-[6px_6px_0px_#22d3ee] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-[#22d3ee]">
              [MISI STUDI KASUS AKTIF // PESERTA: {studentNameFromUrl.toUpperCase()}]
            </span>
            <span className="text-[10px] bg-black text-[#facc15] px-2 py-0.5 border border-[#facc15] font-black uppercase">
              CEFR {quest?.difficulty_level || "B1"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            {quest?.title}
          </h1>
          <p className="text-xs text-zinc-300 leading-relaxed bg-black p-3 border border-zinc-800">
            {quest?.case_study_story}
          </p>
        </div>

        {/* Stage 1: Pre-Quiz */}
        {stage === "quiz" && (
          <QuizStage
            questions={quest?.quiz_questions || []}
            onQuizCompleted={handleQuizCompleted}
          />
        )}

        {/* Stage 2: YOLO Camera Scanner */}
        {stage === "scanner" && (
          <CameraScanner
            requiredHint={quest?.required_object_hint}
            onObjectConfirmed={handleObjectConfirmed}
          />
        )}

        {/* Stage 3: NPC Roleplay Arena */}
        {stage === "arena" && (
          <RoleplayArena
            quest={quest}
            scannedObject={scannedObject}
            onFinishArena={handleFinishArena}
          />
        )}

        {/* Submitting Evaluation State */}
        {stage === "submitting" && (
          <div className="border-4 border-black dark:border-white bg-[#111317] p-12 text-center shadow-[8px_8px_0px_#000000] space-y-3">
            <div className="w-12 h-12 border-4 border-[#facc15] border-t-transparent animate-spin mx-auto" />
            <h3 className="text-base font-black text-white uppercase">
              [GEMINI AI & PYTHON MENGANALISIS SKOR AKHIR DAN CEFR RAPOR...]
            </h3>
            <p className="text-xs text-zinc-400">
              Menghitung gabungan skor kuis, kecepatan bicara WPM, filler words, dan perbaikan kalimat...
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

