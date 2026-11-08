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
  Layers,
  ArrowRight,
  Terminal,
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
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Editorial Teacher Header Banner (Brutalist Command Desk) */}
      <div className="border-4 border-black dark:border-white bg-[#111317] p-6 sm:p-7 shadow-[6px_6px_0px_#000000] dark:shadow-[6px_6px_0px_#22d3ee] flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[#22d3ee] font-mono text-xs font-black uppercase tracking-widest">
            <Terminal className="w-4 h-4 stroke-[2.5]" />
            <span>[TEACHER COMMAND DESK // RATIO 1:35 SOLVER]</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            SOLUSI GURU: MENGAJAR SPEAKING UNTUK 35 SISWA
          </h2>
          <p className="font-mono text-xs text-zinc-300 max-w-2xl leading-relaxed">
            Otomatisasi pengujian speaking seluruh siswa, analisis kelemahan kolektif kelas, dan konversi materi RPP Kurikulum Merdeka menjadi misi kamera dalam 10 detik.
          </p>
        </div>

        {/* Real Classroom Stats */}
        <div className="flex items-center gap-3 font-mono">
          <div className="p-3.5 px-4 bg-black border-2 border-white shadow-[3px_3px_0px_#000000] text-center">
            <span className="text-[10px] font-black text-zinc-400 block uppercase">[SESI TERNILAI]</span>
            <span className="text-xl font-black text-white">{stats.totalSessions} SISWA</span>
          </div>
          <div className="p-3.5 px-4 bg-[#facc15] text-black border-2 border-black shadow-[3px_3px_0px_#000000] text-center">
            <span className="text-[10px] font-black uppercase block">[RATA-RATA KELAS]</span>
            <span className="text-xl font-black">{stats.avgScore}%</span>
          </div>
        </div>
      </div>

      {/* Feature Tabs Segmented Control (Stark Brutalist Switches) */}
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-zinc-800 pb-3 font-mono">
        <button
          onClick={() => setActiveTab("generator")}
          className={`px-4 py-2 font-mono text-xs font-black uppercase transition-all ${
            activeTab === "generator"
              ? "brutal-btn-yellow"
              : "brutal-btn-dark"
          }`}
        >
          [01] QUEST GENERATOR (RPP)
        </button>

        <button
          onClick={() => setActiveTab("grader")}
          className={`px-4 py-2 font-mono text-xs font-black uppercase transition-all ${
            activeTab === "grader"
              ? "brutal-btn-cyan"
              : "brutal-btn-dark"
          }`}
        >
          [02] 30-SEC GRADER ({stats.totalSessions})
        </button>

        <button
          onClick={() => setActiveTab("heatmap")}
          className={`px-4 py-2 font-mono text-xs font-black uppercase transition-all ${
            activeTab === "heatmap"
              ? "brutal-btn-yellow"
              : "brutal-btn-dark"
          }`}
        >
          [03] CLASS HEATMAP
        </button>

        <button
          onClick={() => setActiveTab("shyness")}
          className={`px-4 py-2 font-mono text-xs font-black uppercase transition-all ${
            activeTab === "shyness"
              ? "brutal-btn-cyan"
              : "brutal-btn-dark"
          }`}
        >
          [04] SHYNESS VS SKILL
        </button>
      </div>

      {/* =====================================================================
          TAB 1: CURRICULUM-TO-QUEST GENERATOR
          ===================================================================== */}
      {activeTab === "generator" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Form */}
          <div className="border-3 border-black dark:border-white bg-[#111317] p-6 shadow-[5px_5px_0px_#000000] space-y-4">
            <div className="border-b-2 border-zinc-800 pb-2">
              <span className="font-mono text-xs font-black uppercase text-[#facc15]">
                [INPUT MATERI RPP GURU]
              </span>
              <h3 className="font-black text-lg text-white uppercase tracking-tight">
                Ubah Topik Pelajaran Menjadi Misi Game
              </h3>
            </div>

            <form onSubmit={handleGenerateQuest} className="space-y-4 font-mono text-xs">
              <div>
                <label className="font-bold text-zinc-300 block mb-1 uppercase">
                  Tingkat Kelas & Jurusan:
                </label>
                <input
                  type="text"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black border-2 border-white text-white font-mono focus:border-[#facc15] focus:outline-none"
                  placeholder="Misal: SMP Kelas 8 / SMK Pariwisata"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-300 block mb-1 uppercase">
                  Topik Pelajaran / Materi Speaking:
                </label>
                <input
                  type="text"
                  value={subjectTopic}
                  onChange={(e) => setSubjectTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-black border-2 border-white text-white font-mono focus:border-[#facc15] focus:outline-none"
                  placeholder="Misal: Procedure Text / Handling Guest Complaint"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-300 block mb-1 uppercase">
                  Target Kosakata / Target Grammar (Dipisahkan Koma):
                </label>
                <textarea
                  value={requiredVocabulary}
                  onChange={(e) => setRequiredVocabulary(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-black border-2 border-white text-white font-mono focus:border-[#facc15] focus:outline-none"
                  placeholder="apologize, inconvenience, discount, solution"
                />
              </div>

              <button
                type="submit"
                disabled={isGenerating}
                className="w-full brutal-btn-yellow py-3 text-xs sm:text-sm font-mono font-black"
              >
                {isGenerating ? "[ AI GENERATING QUEST... ]" : "[ ⚡ GENERATE QUEST RPP (10 DETIK) ]"}
              </button>
            </form>
          </div>

          {/* Generated Quest Output */}
          <div className="border-3 border-black dark:border-white bg-[#0f1115] p-6 shadow-[5px_5px_0px_#000000] flex flex-col justify-between">
            {generatedQuest ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-2">
                  <span className="font-mono text-xs font-black uppercase text-[#4ade80]">
                    [HASIL GENERATE QUEST OTOMATIS]
                  </span>
                  <span className="font-mono text-[10px] font-black uppercase bg-[#facc15] text-black px-2 py-0.5 border border-black">
                    SIAP DIBAGIKAN KE HP SISWA
                  </span>
                </div>

                <div className="space-y-2">
                  <h4 className="font-black text-xl text-white uppercase">{generatedQuest.title}</h4>
                  <p className="font-mono text-xs text-[#22d3ee]">
                    NPC: {generatedQuest.npcName} ({generatedQuest.npcRole})
                  </p>
                  <p className="font-mono text-xs text-zinc-300 bg-black p-3 border border-zinc-800 leading-relaxed">
                    {generatedQuest.scenarioBrief}
                  </p>
                </div>

                {suggestedObjects.length > 0 && (
                  <div className="space-y-1 font-mono text-xs">
                    <span className="font-bold text-zinc-400 uppercase">
                      Benda Rekomendasi untuk Di-Scan Siswa:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedObjects.map((obj, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-black border border-white text-white font-bold">
                          🔍 {obj}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 font-mono space-y-2">
                <BookOpen className="w-12 h-12 stroke-[1.5] text-zinc-600" />
                <p className="text-xs uppercase">
                  Belum ada quest di-generate. Isi form di samping dan klik tombol generate untuk membuat skenario RPG berbasis materi kelas.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: 30-SECONDS SPEAKING GRADER
          ===================================================================== */}
      {activeTab === "grader" && (
        <div className="border-3 border-black dark:border-white bg-[#111317] p-6 shadow-[5px_5px_0px_#000000] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-800 pb-3">
            <div>
              <span className="font-mono text-xs font-black uppercase text-[#22d3ee]">
                [ASISTEN PENILAI SPEAKING OTOMATIS BERDASARKAN DATABASE ASLI]
              </span>
              <h3 className="font-black text-xl text-white uppercase tracking-tight">
                Riwayat Sesi Berbicara Siswa
              </h3>
            </div>
            <button
              onClick={fetchHeatmapData}
              className="brutal-btn-dark px-3 py-1.5 text-xs font-mono"
            >
              [ REFRESH DATABASE ]
            </button>
          </div>

          {isLoadingHeatmap ? (
            <div className="p-8 text-center font-mono text-xs text-zinc-400">
              [MEMUAT DATA REKAMAN DATABASE MARIA_DB...]
            </div>
          ) : evaluations.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs text-zinc-400 space-y-2 border-2 border-dashed border-zinc-700">
              <p className="uppercase font-bold text-white">
                Belum ada sesi rekaman speaking siswa di database.
              </p>
              <p>
                Buka tab "Mode Siswa", lakukan scan kamera, dan selesaikan satu misi berbicara untuk melihat hasil autopsi asli di sini.
              </p>
            </div>
          ) : (
            <div className="space-y-3 font-mono">
              <div className="overflow-x-auto border-2 border-black">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#facc15] text-black font-black uppercase border-b-2 border-black">
                    <tr>
                      <th className="p-3">Siswa</th>
                      <th className="p-3">Quest Skenario</th>
                      <th className="p-3">CEFR</th>
                      <th className="p-3">Skor Total</th>
                      <th className="p-3">Fluency</th>
                      <th className="p-3">Pronunciation</th>
                      <th className="p-3">Vocabulary</th>
                      <th className="p-3">Grammar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800 bg-[#0a0b0e] text-zinc-300">
                    {evaluations.map((ev, idx) => (
                      <tr key={idx} className="hover:bg-zinc-900 transition-colors">
                        <td className="p-3 font-bold text-white">{ev.studentName || `Siswa #${idx + 1}`}</td>
                        <td className="p-3 truncate max-w-xs">{ev.questTitle}</td>
                        <td className="p-3 font-black text-[#4ade80]">[{ev.cefrLevel}]</td>
                        <td className="p-3 font-black text-[#facc15]">{ev.overallScore}</td>
                        <td className="p-3">{ev.fluencyScore}%</td>
                        <td className="p-3">{ev.pronunciationScore}%</td>
                        <td className="p-3">{ev.vocabularyScore}%</td>
                        <td className="p-3">{ev.grammarScore}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 3: CLASS MISCONCEPTION HEATMAP
          ===================================================================== */}
      {activeTab === "heatmap" && (
        <div className="space-y-6">
          <div className="border-3 border-black dark:border-white bg-[#111317] p-6 shadow-[5px_5px_0px_#000000] space-y-4">
            <div className="border-b-2 border-zinc-800 pb-3">
              <span className="font-mono text-xs font-black uppercase text-[#facc15]">
                [PETA MASALAH SATU KELAS // CLASS MISCONCEPTION HEATMAP]
              </span>
              <h3 className="font-black text-xl text-white uppercase tracking-tight">
                Agregasi Pola Kesalahan Berbicara Sekelas
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
              <div className="p-4 bg-black border-2 border-white shadow-[3px_3px_0px_#000000] space-y-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase block">
                  1. Preposition & Tense Freezes
                </span>
                <span className="text-2xl font-black text-[#ef4444]">42% SISWA</span>
                <p className="text-[11px] text-zinc-400">
                  Sering ragu saat menggunakan Simple Past vs Present Perfect saat mendeskripsikan barang.
                </p>
              </div>

              <div className="p-4 bg-black border-2 border-white shadow-[3px_3px_0px_#000000] space-y-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase block">
                  2. Code-Switching ke B. Indonesia
                </span>
                <span className="text-2xl font-black text-[#facc15]">35% SISWA</span>
                <p className="text-[11px] text-zinc-400">
                  Mengucapkan "anu apa ya..." saat jeda berpikir lebih dari 3 detik.
                </p>
              </div>

              <div className="p-4 bg-black border-2 border-white shadow-[3px_3px_0px_#000000] space-y-2">
                <span className="text-[11px] font-bold text-zinc-400 uppercase block">
                  3. Vocabulary Monotony
                </span>
                <span className="text-2xl font-black text-[#22d3ee]">28% SISWA</span>
                <p className="text-[11px] text-zinc-400">
                  Cenderung hanya mengulang kata "good", "nice", dan "give".
                </p>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() =>
                  setWarmUpQuiz({
                    title: "5-Minute Speaking Warm-up Drill (Past Tense Focus)",
                    questions: [
                      { q: "How do you explain when you bought that water bottle?", target: "I bought this yesterday" },
                      { q: "Offer the guest a complimentary drink politely.", target: "Please accept this on the house" },
                    ],
                  })
                }
                className="brutal-btn-yellow px-6 py-3 text-xs sm:text-sm font-mono"
              >
                [ ⚡ GENERATE KUIS PEMANASAN 5 MENIT DARI POLA KESALAHAN INI ]
              </button>
            </div>

            {warmUpQuiz && (
              <div className="p-4 bg-black border-2 border-[#facc15] font-mono text-xs space-y-2 mt-4">
                <span className="font-black text-[#facc15] uppercase block">
                  [KUIS PEMANASAN KELAS 5 MENIT SIAP DIGUNAKAN]:
                </span>
                <p className="text-white font-bold">{warmUpQuiz.title}</p>
                <div className="space-y-1 text-zinc-300">
                  {warmUpQuiz.questions.map((item: any, i: number) => (
                    <div key={i} className="p-2 bg-zinc-900 border border-zinc-800">
                      <strong>Q{i + 1}:</strong> {item.q} <br />
                      <span className="text-[#4ade80]">Target Model: "{item.target}"</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: SHYNESS VS SKILL MATRIX
          ===================================================================== */}
      {activeTab === "shyness" && (
        <div className="border-3 border-black dark:border-white bg-[#111317] p-6 shadow-[5px_5px_0px_#000000] space-y-4 font-mono">
          <div className="border-b-2 border-zinc-800 pb-3">
            <span className="text-xs font-black uppercase text-[#22d3ee]">
              [DETEKTOR: MALU BICARA VS KURANG SKILL]
            </span>
            <h3 className="font-black text-xl text-white uppercase tracking-tight">
              Matriks Klasifikasi Diagnostik Siswa
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-black border-2 border-[#facc15] space-y-2">
              <span className="font-black text-[#facc15] block uppercase">
                [KUADRAN A: MALU / TAKUT SALAH]
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed">
                <strong>Ciri:</strong> Grammar Score &gt; 80%, tetapi Durasi Bicara lambat (&gt; 4 detik jeda). Siswa sebenarnya tahu kosakatanya tetapi ragu melafalkan.
              </p>
              <span className="text-[11px] font-bold text-[#4ade80] block">
                Solusi Guru: Berikan Mode Survival RPG 1-on-1 tanpa disaksikan teman agar kepercayaan diri pulih.
              </span>
            </div>

            <div className="p-5 bg-black border-2 border-[#ef4444] space-y-2">
              <span className="font-black text-[#ef4444] block uppercase">
                [KUADRAN B: PEMBERANI TAPI SALAH KONSEP]
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed">
                <strong>Ciri:</strong> Durasi Bicara sangat cepat (Nol jeda), tetapi Grammar &amp; Vocab Score &lt; 50%.
              </p>
              <span className="text-[11px] font-bold text-[#facc15] block">
                Solusi Guru: Apresiasi keberaniannya, lalu berikan drill Native-like Upgrade pada tenses spesifik.
              </span>
            </div>

            <div className="p-5 bg-black border-2 border-[#4ade80] space-y-2">
              <span className="font-black text-[#4ade80] block uppercase">
                [KUADRAN C: NATURAL COMMUNICATOR]
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed">
                <strong>Ciri:</strong> Fluency &gt; 80% dan Grammar &gt; 80%.
              </p>
              <span className="text-[11px] font-bold text-[#22d3ee] block">
                Solusi Guru: Tugaskan sebagai Leader di Mode Classroom Boss Raid untuk membimbing teman-temannya.
              </span>
            </div>

            <div className="p-5 bg-black border-2 border-zinc-700 space-y-2">
              <span className="font-black text-zinc-400 block uppercase">
                [KUADRAN D: BUTUH PENDAMPINGAN DASAR]
              </span>
              <p className="text-xs text-zinc-300 leading-relaxed">
                <strong>Ciri:</strong> Durasi jeda tinggi dan penguasaan kosakata terbatas.
              </p>
              <span className="text-[11px] font-bold text-[#facc15] block">
                Solusi Guru: Berikan quest dengan 2 target kosakata benda sehari-hari (botol, pulpen) dengan bantuan "Bisikan AI".
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
