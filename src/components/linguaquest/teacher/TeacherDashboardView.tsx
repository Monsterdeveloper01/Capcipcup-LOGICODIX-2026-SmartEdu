"use client";

import { useState, useEffect } from "react";
import { QuestScenario, SpeakingEvaluation, ClassMisconceptionItem, TeacherCurriculumQuestInput } from "@/lib/linguaquest/types";
import {
  GraduationCap,
  Sparkles,
  Flame,
  CheckCircle2,
  AlertCircle,
  Play,
  RotateCcw,
  Zap,
  BarChart3,
  Users,
  Clock,
  BookOpen,
  Send,
  HelpCircle,
} from "lucide-react";

export default function TeacherDashboardView() {
  const [activeTab, setActiveTab] = useState<"generator" | "grader" | "heatmap" | "shyness">("generator");

  // Generator State
  const [gradeLevel, setGradeLevel] = useState("SMK Kelas 11 (Perhotelan)");
  const [subjectTopic, setSubjectTopic] = useState("Handling Guest Complaints & Service Recovery");
  const [requiredVocabulary, setRequiredVocabulary] = useState("apologize, inconvenience, suite keycard, complimentary, receipt");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedQuest, setGeneratedQuest] = useState<QuestScenario | null>(null);
  const [suggestedObjects, setSuggestedObjects] = useState<string[]>([]);

  // Heatmap & Sessions State (From Database)
  const [stats, setStats] = useState<any>({
    totalSessions: 0,
    avgScore: 0,
    avgFluency: 0,
    avgPronunciation: 0,
    avgVocabulary: 0,
    avgGrammar: 0,
    avgHesitationSeconds: "0",
  });
  const [evaluations, setEvaluations] = useState<SpeakingEvaluation[]>([]);
  const [misconceptions, setMisconceptions] = useState<ClassMisconceptionItem[]>([]);
  const [warmUpQuiz, setWarmUpQuiz] = useState<any>(null);
  const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(true);
  const [activeDrillIndex, setActiveDrillIndex] = useState<number | null>(null);

  // Fetch real database records on load
  useEffect(() => {
    fetchHeatmapData();
  }, []);

  const fetchHeatmapData = async () => {
    setIsLoadingHeatmap(true);
    try {
      const res = await fetch("/api/linguaquest/teacher/heatmap");
      const data = await res.json();
      if (res.ok) {
        setStats(data.stats);
        setEvaluations(data.evaluations || []);
        setMisconceptions(data.misconceptions || []);
        setWarmUpQuiz(data.warmUpQuiz || null);
      }
    } catch (err) {
      console.warn("Gagal fetch data heatmap guru:", err);
    } finally {
      setIsLoadingHeatmap(false);
    }
  };

  const handleGenerateQuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectTopic.trim()) return;

    setIsGenerating(true);
    try {
      const res = await fetch("/api/linguaquest/teacher/quest-gen", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          gradeLevel,
          subjectTopic,
          requiredVocabulary,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal generate quest.");

      setGeneratedQuest(data.quest);
      setSuggestedObjects(data.suggestedObjectsToScan || []);
    } catch (err: any) {
      alert(err.message || "Gagal membuat quest.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fadeIn">
      {/* Teacher Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-indigo-950 via-zinc-900 to-zinc-950 border border-indigo-800/50 shadow-2xl flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-extrabold uppercase tracking-wider">
            <GraduationCap className="w-4 h-4" />
            <span>AI Classroom Game Master & Co-Pilot Guru</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Solusi Mengatasi Rasio Mengajar 1:35 di Kelas Bahasa Inggris
          </h2>
          <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
            Otomatisasi pengujian speaking 35+ siswa, analisis miskonsepsi kolektif kelas, dan ubah RPP Kurikulum Merdeka menjadi misi camera-RPG dalam 10 detik.
          </p>
        </div>

        {/* Quick Classroom Stats */}
        <div className="flex items-center gap-3">
          <div className="p-3 px-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-center">
            <span className="text-[10px] font-bold text-zinc-400 block uppercase">Sesi Ternilai</span>
            <span className="text-xl font-black text-white">{stats.totalSessions} Siswa</span>
          </div>
          <div className="p-3 px-4 rounded-2xl bg-indigo-950/80 border border-indigo-700/60 text-center">
            <span className="text-[10px] font-bold text-indigo-300 block uppercase">Rata-rata Skor</span>
            <span className="text-xl font-black text-emerald-400">{stats.avgScore}%</span>
          </div>
        </div>
      </div>

      {/* Feature Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-zinc-800 pb-3">
        <button
          onClick={() => setActiveTab("generator")}
          className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === "generator"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
              : "bg-zinc-900 text-zinc-400 hover:text-white"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>1. Curriculum-to-Quest Generator</span>
        </button>

        <button
          onClick={() => setActiveTab("grader")}
          className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === "grader"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
              : "bg-zinc-900 text-zinc-400 hover:text-white"
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>2. 30-Seconds Speaking Grader</span>
        </button>

        <button
          onClick={() => setActiveTab("heatmap")}
          className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === "heatmap"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
              : "bg-zinc-900 text-zinc-400 hover:text-white"
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>3. Class Misconception Heatmap</span>
        </button>

        <button
          onClick={() => setActiveTab("shyness")}
          className={`px-4 py-2 rounded-2xl text-xs font-extrabold transition-all flex items-center gap-2 ${
            activeTab === "shyness"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
              : "bg-zinc-900 text-zinc-400 hover:text-white"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>4. Shyness vs. Skill Detector</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: CURRICULUM-TO-QUEST GENERATOR */}
      {/* ========================================================================= */}
      {activeTab === "generator" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fadeIn">
          {/* Input Form */}
          <form
            onSubmit={handleGenerateQuest}
            className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-4 shadow-xl"
          >
            <div className="space-y-1">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                Ubah RPP / Topik Pembelajaran Jadi Misi Game
              </h3>
              <p className="text-xs text-zinc-400">
                AI akan menyintesis skenario darurat dan menentukan barang nyata yang harus dicari siswa untuk di-scan.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Tingkat Kelas & Jurusan:</label>
              <input
                type="text"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                placeholder="Misal: SMP Kelas 8 / SMK Perhotelan / SMA Kelas 10"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">Topik / Materi Kurikulum Merdeka (CP):</label>
              <input
                type="text"
                value={subjectTopic}
                onChange={(e) => setSubjectTopic(e.target.value)}
                placeholder="Misal: Procedure Text / Handling Complaints / Giving Opinions"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-zinc-300">
                Kunci Kosakata Wajib (Target Vocabulary Lock):
              </label>
              <input
                type="text"
                value={requiredVocabulary}
                onChange={(e) => setRequiredVocabulary(e.target.value)}
                placeholder="Kosakata yang wajib diucapkan siswa untuk lulus misi"
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Mensintesis Misi Game Kurikulum dengan AI...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-amber-300" />
                  <span>Generate Misi & Broadcast ke HP Siswa</span>
                </>
              )}
            </button>
          </form>

          {/* Generated Quest Output Card */}
          <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between shadow-xl">
            {generatedQuest ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                    🟢 Misi Aktif & Siap Diterima Siswa
                  </span>
                  <span className="text-2xl">{generatedQuest.npcAvatar}</span>
                </div>

                <div>
                  <h4 className="font-black text-lg text-white mb-0.5">{generatedQuest.title}</h4>
                  <p className="text-xs text-indigo-400 font-semibold">
                    Karakter: {generatedQuest.npcName} ({generatedQuest.npcRole})
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-850 text-xs text-zinc-300 leading-relaxed">
                  <span className="font-bold text-white block mb-1">Briefing Cerita:</span>
                  <p>{generatedQuest.scenarioBrief}</p>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-zinc-300 block">
                    Benda yang Harus Dicari Siswa di Sekitar Mereka:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {suggestedObjects.map((obj, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-amber-300 font-medium">
                        🔍 {obj}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <span className="text-xs font-bold text-zinc-300 block">Kosakata Terkunci:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {generatedQuest.targetVocab.map((v, i) => (
                      <span key={i} className="px-2.5 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-700 text-indigo-200 text-xs font-mono font-semibold">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-zinc-500 p-8 space-y-2">
                <Sparkles className="w-10 h-10 text-zinc-700" />
                <h4 className="text-sm font-bold text-zinc-400">Belum Ada Misi yang Digenerate</h4>
                <p className="text-xs max-w-xs">
                  Isi formulir di sebelah kiri lalu klik tombol "Generate Misi" untuk melihat pratinjau quest siswa.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: 30-SECONDS SPEAKING GRADER */}
      {/* ========================================================================= */}
      {activeTab === "grader" && (
        <div className="space-y-4 animate-fadeIn">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-base text-white">
              Hasil Evaluasi Berbicara Real-time Siswa di Kelas (Standar CEFR)
            </h3>
            <button
              onClick={fetchHeatmapData}
              className="text-xs font-bold text-indigo-400 hover:text-white flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Muat Ulang Data</span>
            </button>
          </div>

          {evaluations.length === 0 ? (
            <div className="p-8 rounded-3xl bg-zinc-950 border border-zinc-800 text-center text-zinc-400 text-xs">
              Belum ada data rekaman sesi siswa di database. Buka tab <strong>Mode Siswa</strong> untuk mencoba menyelesaikan 1 misi!
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {evaluations.map((ev) => (
                <div
                  key={ev.id}
                  className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-3 shadow-xl hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-white">{ev.studentName}</h4>
                      <p className="text-[11px] text-zinc-400">{ev.questTitle}</p>
                    </div>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-950 border border-emerald-700 text-emerald-300">
                      CEFR: {ev.cefrLevel}
                    </span>
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center text-[11px]">
                    <div className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-850">
                      <span className="text-zinc-500 block">Fluency</span>
                      <span className="font-bold text-white">{ev.fluencyScore}%</span>
                    </div>
                    <div className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-850">
                      <span className="text-zinc-500 block">Pronunc.</span>
                      <span className="font-bold text-white">{ev.pronunciationScore}%</span>
                    </div>
                    <div className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-850">
                      <span className="text-zinc-500 block">Vocab</span>
                      <span className="font-bold text-white">{ev.vocabularyScore}%</span>
                    </div>
                    <div className="p-1.5 rounded-xl bg-zinc-900 border border-zinc-850">
                      <span className="text-zinc-500 block">Grammar</span>
                      <span className="font-bold text-white">{ev.grammarScore}%</span>
                    </div>
                  </div>

                  {ev.nativeUpgrades.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-[11px] space-y-1">
                      <span className="font-bold text-indigo-400 block">Highlight Native Upgrade:</span>
                      <p className="text-zinc-400 line-through italic">"{ev.nativeUpgrades[0].original}"</p>
                      <p className="text-emerald-300 font-semibold">"{ev.nativeUpgrades[0].upgraded}"</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[11px] text-zinc-500 pt-2 border-t border-zinc-850">
                    <span>{ev.timestamp}</span>
                    <span className="text-amber-400 font-semibold">+{ev.xpEarned} XP</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CLASS MISCONCEPTION HEATMAP */}
      {/* ========================================================================= */}
      {activeTab === "heatmap" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-extrabold text-base text-white">
                Peta Miskonsepsi Kolektif Kelas (Data-Driven Insight)
              </h3>
              <p className="text-xs text-zinc-400">
                Pola kelemahan umum siswa berdasarkan rekaman percakapan yang dianalisis oleh AI.
              </p>
            </div>
            <button
              onClick={fetchHeatmapData}
              className="text-xs font-bold text-indigo-400 hover:text-white flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Analisis Ulang AI</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {misconceptions.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-3 shadow-xl relative overflow-hidden"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-950/60 px-2.5 py-0.5 rounded-full border border-rose-800/60">
                    {item.category} • {item.affectedPercentage}% Siswa
                  </span>
                </div>

                <h4 className="font-bold text-sm text-white leading-snug">{item.errorDescription}</h4>

                <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-850 text-xs space-y-1">
                  <div>
                    <span className="text-zinc-500 text-[10px] block">Contoh Kalimat Keliru:</span>
                    <p className="text-rose-300 font-mono italic">{item.exampleMistake}</p>
                  </div>
                  <div>
                    <span className="text-emerald-400 text-[10px] block font-bold">Bentuk yang Benar:</span>
                    <p className="text-white font-mono font-semibold">{item.correctForm}</p>
                  </div>
                </div>

                <div className="text-xs text-amber-300 bg-amber-950/40 p-2.5 rounded-xl border border-amber-800/40">
                  <span className="font-bold block text-[11px] mb-0.5">💡 Rekomendasi Pemanasan Guru di Kelas:</span>
                  <p>{item.recommendedWarmup}</p>
                </div>
              </div>
            ))}
          </div>

          {/* 1-Click 5-Minute Warm-Up Drill Modal / Box */}
          {warmUpQuiz && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-indigo-950 via-zinc-900 to-zinc-950 border border-indigo-600/50 space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h4 className="font-black text-base text-white">{warmUpQuiz.title}</h4>
                </div>
                <span className="text-xs font-bold text-indigo-300 bg-indigo-900/60 px-3 py-1 rounded-full border border-indigo-500/40">
                  {warmUpQuiz.drillType}
                </span>
              </div>

              <div className="space-y-2">
                {warmUpQuiz.questions?.map((q: any, idx: number) => (
                  <div key={idx} className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between text-xs">
                    <span className="text-zinc-200 font-medium">{q.prompt}</span>
                    <span className="font-mono font-bold text-emerald-400">{q.targetAnswer}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: SHYNESS VS. SKILL DETECTOR */}
      {/* ========================================================================= */}
      {activeTab === "shyness" && (
        <div className="p-6 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-6 shadow-2xl animate-fadeIn">
          <div className="space-y-1">
            <h3 className="font-extrabold text-base text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-indigo-400" />
              Detektor Psikologis: Keberanian Bicara (Shyness vs. Skill)
            </h3>
            <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed">
              Membedakan siswa yang pasif di kelas karena takut salah/malu dengan siswa yang memang belum menguasai kosakata.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase block">Rata-rata Waktu Jeda (Hesitation)</span>
              <span className="text-2xl font-black text-amber-400">{stats.avgHesitationSeconds} Detik</span>
              <p className="text-[11px] text-zinc-500">Waktu diam sebelum siswa mulai merespons pertanyaan bahasa Inggris.</p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase block">Frekuensi Code-Switching</span>
              <span className="text-2xl font-black text-indigo-400">Rendah (0.8x / sesi)</span>
              <p className="text-[11px] text-zinc-500">Siswa jarang mencampur bahasa Indonesia karena terbantu fitur Bisikan AI.</p>
            </div>

            <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2">
              <span className="text-[11px] font-bold text-zinc-400 uppercase block">Index Kepercayaan Diri</span>
              <span className="text-2xl font-black text-emerald-400">+38% Meningkat</span>
              <p className="text-[11px] text-zinc-500">Peningkatan durasi bicara siswa saat bermain mandiri tanpa tekanan teman kelas.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

