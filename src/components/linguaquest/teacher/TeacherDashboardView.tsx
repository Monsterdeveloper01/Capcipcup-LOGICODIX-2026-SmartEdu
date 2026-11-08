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
  const [selectedEvaluation, setSelectedEvaluation] = useState<SpeakingEvaluation | null>(null);

  const handleExportCsv = () => {
    if (evaluations.length === 0) {
      alert("Belum ada data evaluasi speaking untuk diunduh.");
      return;
    }
    const headers = [
      "No",
      "Nama Siswa",
      "Quest Skenario",
      "Level CEFR",
      "Skor Akhir (0-100)",
      "Kelancaran / Fluency (%)",
      "Pelafalan / Pronunciation (%)",
      "Kosakata / Vocabulary (%)",
      "Tata Bahasa / Grammar (%)",
      "Rata-rata Jeda (detik)",
      "Frekuensi Code-Switching",
      "Waktu Sesi"
    ];
    const rows = evaluations.map((ev, idx) => [
      idx + 1,
      `"${ev.studentName}"`,
      `"${ev.questTitle}"`,
      `"${ev.cefrLevel}"`,
      ev.overallScore,
      ev.fluencyScore,
      ev.pronunciationScore,
      ev.vocabularyScore,
      ev.grammarScore,
      ev.hesitationSeconds,
      ev.codeSwitchingCount,
      `"${ev.timestamp}"`
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Rekap_Nilai_Speaking_Kurikulum_Merdeka_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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
    <div className="max-w-6xl mx-auto space-y-6 font-mono">
      {/* Editorial Teacher Header Banner (Clean Light Desk) */}
      <div className="border-2 border-black bg-white p-6 sm:p-7 shadow-[4px_4px_0px_#000000] flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-cyan-800 font-mono text-xs font-black uppercase tracking-widest">
            <span className="w-2.5 h-2.5 bg-cyan-500 border border-black inline-block" />
            <span>[TEACHER COMMAND DESK // RATIO 1:35 SOLVER]</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
            SOLUSI GURU: MENGAJAR SPEAKING UNTUK 35 SISWA
          </h2>
          <p className="font-mono text-xs text-zinc-700 max-w-2xl leading-relaxed">
            Otomatisasi pengujian speaking seluruh siswa, analisis kelemahan kolektif kelas, dan konversi materi RPP Kurikulum Merdeka menjadi misi kamera dalam 10 detik.
          </p>
        </div>

        {/* Real Classroom Stats */}
        <div className="flex items-center gap-3 font-mono">
          <div className="p-3.5 px-4 bg-zinc-50 border-2 border-black shadow-[3px_3px_0px_#000000] text-center">
            <span className="text-[10px] font-black text-zinc-600 block uppercase">[SESI TERNILAI]</span>
            <span className="text-xl font-black text-black">{stats.totalSessions} SISWA</span>
          </div>
          <div className="p-3.5 px-4 bg-[#facc15] text-black border-2 border-black shadow-[3px_3px_0px_#000000] text-center">
            <span className="text-[10px] font-black uppercase block">[RATA-RATA KELAS]</span>
            <span className="text-xl font-black">{stats.avgScore}%</span>
          </div>
        </div>
      </div>

      {/* Feature Tabs Segmented Control */}
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-zinc-300 pb-3 font-mono">
        <button
          onClick={() => setActiveTab("generator")}
          className={`px-4 py-2 font-mono text-xs font-black uppercase transition-all ${
            activeTab === "generator" ? "brutal-btn-yellow" : "brutal-btn-white"
          }`}
        >
          [01] QUEST GENERATOR (RPP)
        </button>

        <button
          onClick={() => setActiveTab("grader")}
          className={`px-4 py-2 font-mono text-xs font-black uppercase transition-all ${
            activeTab === "grader" ? "brutal-btn-cyan" : "brutal-btn-white"
          }`}
        >
          [02] 30-SEC GRADER ({stats.totalSessions})
        </button>

        <button
          onClick={() => setActiveTab("heatmap")}
          className={`px-4 py-2 font-mono text-xs font-black uppercase transition-all ${
            activeTab === "heatmap" ? "brutal-btn-yellow" : "brutal-btn-white"
          }`}
        >
          [03] CLASS HEATMAP
        </button>

        <button
          onClick={() => setActiveTab("shyness")}
          className={`px-4 py-2 font-mono text-xs font-black uppercase transition-all ${
            activeTab === "shyness" ? "brutal-btn-cyan" : "brutal-btn-white"
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
          <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-4">
            <div className="border-b-2 border-zinc-200 pb-2">
              <span className="font-mono text-xs font-black uppercase text-amber-800">
                [INPUT MATERI RPP GURU]
              </span>
              <h3 className="font-black text-lg text-black uppercase tracking-tight">
                Ubah Topik Pelajaran Menjadi Misi Game
              </h3>
            </div>

            <form onSubmit={handleGenerateQuest} className="space-y-4 font-mono text-xs">
              <div>
                <label className="font-bold text-black block mb-1 uppercase">
                  Tingkat Kelas & Jurusan:
                </label>
                <input
                  type="text"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border-2 border-black text-black font-mono focus:bg-white focus:outline-none"
                  placeholder="Misal: SMP Kelas 8 / SMK Pariwisata"
                />
              </div>

              <div>
                <label className="font-bold text-black block mb-1 uppercase">
                  Topik Pelajaran / Materi Speaking:
                </label>
                <input
                  type="text"
                  value={subjectTopic}
                  onChange={(e) => setSubjectTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border-2 border-black text-black font-mono focus:bg-white focus:outline-none"
                  placeholder="Misal: Procedure Text / Handling Guest Complaint"
                />
              </div>

              <div>
                <label className="font-bold text-black block mb-1 uppercase">
                  Target Kosakata / Target Grammar (Dipisahkan Koma):
                </label>
                <textarea
                  value={requiredVocabulary}
                  onChange={(e) => setRequiredVocabulary(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border-2 border-black text-black font-mono focus:bg-white focus:outline-none"
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
          <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] flex flex-col justify-between">
            {generatedQuest ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-2">
                  <span className="font-mono text-xs font-black uppercase text-emerald-800">
                    [HASIL GENERATE QUEST OTOMATIS]
                  </span>
                  <span className="font-mono text-[10px] font-black uppercase bg-[#facc15] text-black px-2 py-0.5 border border-black">
                    SIAP DIBAGIKAN KE HP SISWA
                  </span>
                </div>

                <div className="space-y-2">
                  <h4 className="font-black text-xl text-black uppercase">{generatedQuest.title}</h4>
                  <p className="font-mono text-xs text-cyan-800 font-bold">
                    NPC: {generatedQuest.npcName} ({generatedQuest.npcRole})
                  </p>
                  <p className="font-mono text-xs text-zinc-800 bg-zinc-50 p-3.5 border border-black leading-relaxed">
                    {generatedQuest.scenarioBrief}
                  </p>
                </div>

                {suggestedObjects.length > 0 && (
                  <div className="space-y-1 font-mono text-xs">
                    <span className="font-bold text-zinc-700 uppercase">
                      Benda Rekomendasi untuk Di-Scan Siswa:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {suggestedObjects.map((obj, idx) => (
                        <span key={idx} className="px-2.5 py-1 bg-zinc-100 border border-black text-black font-bold">
                          🔍 {obj}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-zinc-500 font-mono space-y-2">
                <BookOpen className="w-12 h-12 stroke-[1.5] text-zinc-400" />
                <p className="text-xs uppercase text-zinc-600">
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
        <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-200 pb-3">
            <div>
              <span className="font-mono text-xs font-black uppercase text-cyan-800">
                [ASISTEN PENILAI SPEAKING OTOMATIS BERDASARKAN DATABASE ASLI]
              </span>
              <h3 className="font-black text-xl text-black uppercase tracking-tight">
                Riwayat Sesi Berbicara Siswa
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="brutal-btn-yellow px-3.5 py-1.5 text-xs font-mono font-black"
                title="Unduh seluruh rekap nilai dalam format spreadsheet Kurikulum Merdeka"
              >
                [ 📥 EXPORT E-RAPOR (.CSV) ]
              </button>
              <button
                onClick={fetchHeatmapData}
                className="brutal-btn-white px-3 py-1.5 text-xs font-mono"
              >
                [ REFRESH DATABASE ]
              </button>
            </div>
          </div>

          {isLoadingHeatmap ? (
            <div className="p-8 text-center font-mono text-xs text-zinc-600">
              [MEMUAT DATA REKAMAN DATABASE MARIA_DB...]
            </div>
          ) : evaluations.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs text-zinc-600 space-y-2 border-2 border-dashed border-zinc-300">
              <p className="uppercase font-bold text-black">
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
                      <th className="p-3 text-right">Bukti Transkrip</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-200 bg-white text-zinc-800">
                    {evaluations.map((ev, idx) => (
                      <tr key={idx} className="hover:bg-zinc-50 transition-colors">
                        <td className="p-3 font-bold text-black">{ev.studentName || `Siswa #${idx + 1}`}</td>
                        <td className="p-3 truncate max-w-xs">{ev.questTitle}</td>
                        <td className="p-3 font-black text-emerald-700">[{ev.cefrLevel}]</td>
                        <td className="p-3 font-black text-amber-700">{ev.overallScore}</td>
                        <td className="p-3">{ev.fluencyScore}%</td>
                        <td className="p-3">{ev.pronunciationScore}%</td>
                        <td className="p-3">{ev.vocabularyScore}%</td>
                        <td className="p-3">{ev.grammarScore}%</td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => setSelectedEvaluation(ev)}
                            className="px-2.5 py-1 bg-cyan-100 hover:bg-cyan-200 text-cyan-900 border border-black font-black text-[11px] shadow-[1px_1px_0px_#000000] cursor-pointer"
                          >
                            [ 👁️ TRANSKRIP ]
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Modal Bukti Transkrip & Detail Jawaban Siswa */}
          {selectedEvaluation && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
              <div className="border-2 border-black bg-white max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-[6px_6px_0px_#000000] space-y-5 font-mono">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase bg-[#facc15] text-black px-2 py-0.5 border border-black">
                      [BUKTI AUTENTIK REKAMAN PERCAKAPAN SISWA]
                    </span>
                    <h3 className="text-xl font-black text-black uppercase mt-1">
                      {selectedEvaluation.studentName} — CEFR {selectedEvaluation.cefrLevel} ({selectedEvaluation.overallScore} Pts)
                    </h3>
                    <p className="text-xs text-zinc-600">Quest: {selectedEvaluation.questTitle} • {selectedEvaluation.timestamp}</p>
                  </div>
                  <button
                    onClick={() => setSelectedEvaluation(null)}
                    className="brutal-btn-white px-3 py-1 font-black text-xs"
                  >
                    [TUTUP / X]
                  </button>
                </div>

                {/* Score Breakdown Pills */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="p-2 bg-zinc-50 border border-black">
                    <span className="block text-[10px] text-zinc-500 uppercase">Fluency</span>
                    <strong className="text-sm text-amber-700">{selectedEvaluation.fluencyScore}%</strong>
                  </div>
                  <div className="p-2 bg-zinc-50 border border-black">
                    <span className="block text-[10px] text-zinc-500 uppercase">Pronunciation</span>
                    <strong className="text-sm text-cyan-800">{selectedEvaluation.pronunciationScore}%</strong>
                  </div>
                  <div className="p-2 bg-zinc-50 border border-black">
                    <span className="block text-[10px] text-zinc-500 uppercase">Vocabulary</span>
                    <strong className="text-sm text-emerald-700">{selectedEvaluation.vocabularyScore}%</strong>
                  </div>
                  <div className="p-2 bg-zinc-50 border border-black">
                    <span className="block text-[10px] text-zinc-500 uppercase">Grammar</span>
                    <strong className="text-sm text-rose-700">{selectedEvaluation.grammarScore}%</strong>
                  </div>
                </div>

                {/* Section 1: Transkrip Percakapan Lengkap */}
                <div className="space-y-2">
                  <span className="font-black text-xs text-black uppercase block border-b border-zinc-300 pb-1">
                    📜 Transkrip Percakapan (Siswa & NPC AI):
                  </span>
                  <div className="space-y-2.5 max-h-56 overflow-y-auto p-3 bg-zinc-50 border border-black">
                    {(selectedEvaluation.transcriptMessages || []).map((msg, idx) => (
                      <div
                        key={idx}
                        className={`p-3 text-xs border ${
                          msg.sender === "student"
                            ? "bg-[#22d3ee]/20 border-cyan-800 ml-6"
                            : "bg-[#facc15]/20 border-amber-800 mr-6"
                        }`}
                      >
                        <strong className="block text-[10px] uppercase font-black mb-0.5">
                          {msg.sender === "student" ? `[SISWA]:` : `[NPC]:`}
                        </strong>
                        <p className="text-zinc-900">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 2: Native-Like Upgrade */}
                {selectedEvaluation.nativeUpgrades && selectedEvaluation.nativeUpgrades.length > 0 && (
                  <div className="space-y-2">
                    <span className="font-black text-xs text-black uppercase block border-b border-zinc-300 pb-1">
                      ✨ Rekomendasi Kalimat Lebih Alami (Native-Like Upgrade):
                    </span>
                    <div className="space-y-2">
                      {selectedEvaluation.nativeUpgrades.map((item, idx) => (
                        <div key={idx} className="p-3 bg-zinc-50 border border-black text-xs space-y-1">
                          <p className="text-zinc-600">
                            <strong>Diucapkan Siswa:</strong> <span className="italic">"{item.original}"</span>
                          </p>
                          <p className="text-emerald-800 font-bold">
                            <strong>Versi Natural:</strong> "{item.upgraded}"
                          </p>
                          <p className="text-[11px] text-zinc-500 pt-1 border-t border-zinc-200">
                            <strong>Alasan:</strong> {item.explanation}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Section 3: Diagnostic Feedback */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-emerald-50 border border-emerald-700 space-y-1">
                    <strong className="text-emerald-900 block">[KELEBIHAN SISWA]:</strong>
                    <ul className="list-disc list-inside text-emerald-800 space-y-0.5">
                      {selectedEvaluation.strengths.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-700 space-y-1">
                    <strong className="text-amber-900 block">[AREA PERLU DILATIH]:</strong>
                    <ul className="list-disc list-inside text-amber-800 space-y-0.5">
                      {selectedEvaluation.areasToImprove.map((a, i) => (
                        <li key={i}>{a}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={() => setSelectedEvaluation(null)}
                    className="brutal-btn-yellow px-5 py-2 text-xs font-black uppercase"
                  >
                    [ SELESAI MENINJAU ]
                  </button>
                </div>
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
          <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-4">
            <div className="border-b-2 border-zinc-200 pb-3">
              <span className="font-mono text-xs font-black uppercase text-amber-800">
                [PETA MASALAH SATU KELAS // CLASS MISCONCEPTION HEATMAP]
              </span>
              <h3 className="font-black text-xl text-black uppercase tracking-tight">
                Agregasi Pola Kesalahan Berbicara Sekelas
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono">
              <div className="p-4 bg-zinc-50 border-2 border-black shadow-[3px_3px_0px_#000000] space-y-2">
                <span className="text-[11px] font-bold text-zinc-600 uppercase block">
                  1. Preposition & Tense Freezes
                </span>
                <span className="text-2xl font-black text-red-600">42% SISWA</span>
                <p className="text-[11px] text-zinc-700">
                  Sering ragu saat menggunakan Simple Past vs Present Perfect saat mendeskripsikan barang.
                </p>
              </div>

              <div className="p-4 bg-zinc-50 border-2 border-black shadow-[3px_3px_0px_#000000] space-y-2">
                <span className="text-[11px] font-bold text-zinc-600 uppercase block">
                  2. Code-Switching ke B. Indonesia
                </span>
                <span className="text-2xl font-black text-amber-700">35% SISWA</span>
                <p className="text-[11px] text-zinc-700">
                  Mengucapkan "anu apa ya..." saat jeda berpikir lebih dari 3 detik.
                </p>
              </div>

              <div className="p-4 bg-zinc-50 border-2 border-black shadow-[3px_3px_0px_#000000] space-y-2">
                <span className="text-[11px] font-bold text-zinc-600 uppercase block">
                  3. Vocabulary Monotony
                </span>
                <span className="text-2xl font-black text-cyan-800">28% SISWA</span>
                <p className="text-[11px] text-zinc-700">
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
              <div className="p-4 bg-amber-50 border-2 border-black font-mono text-xs space-y-2 mt-4">
                <span className="font-black text-black uppercase block">
                  [KUIS PEMANASAN KELAS 5 MENIT SIAP DIGUNAKAN]:
                </span>
                <p className="text-black font-bold">{warmUpQuiz.title}</p>
                <div className="space-y-1 text-zinc-800">
                  {warmUpQuiz.questions.map((item: any, i: number) => (
                    <div key={i} className="p-2.5 bg-white border border-black">
                      <strong>Q{i + 1}:</strong> {item.q} <br />
                      <span className="text-emerald-700 font-bold">Target Model: "{item.target}"</span>
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
        <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-4 font-mono">
          <div className="border-b-2 border-zinc-200 pb-3">
            <span className="text-xs font-black uppercase text-cyan-800">
              [DETEKTOR: MALU BICARA VS KURANG SKILL]
            </span>
            <h3 className="font-black text-xl text-black uppercase tracking-tight">
              Matriks Klasifikasi Diagnostik Siswa
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 bg-zinc-50 border-2 border-black space-y-2">
              <span className="font-black text-amber-800 block uppercase">
                [KUADRAN A: MALU / TAKUT SALAH]
              </span>
              <p className="text-xs text-zinc-700 leading-relaxed">
                <strong>Ciri:</strong> Grammar Score &gt; 80%, tetapi Durasi Bicara lambat (&gt; 4 detik jeda). Siswa sebenarnya tahu kosakatanya tetapi ragu melafalkan.
              </p>
              <span className="text-[11px] font-bold text-emerald-700 block">
                Solusi Guru: Berikan Mode Survival RPG 1-on-1 tanpa disaksikan teman agar kepercayaan diri pulih.
              </span>
            </div>

            <div className="p-5 bg-zinc-50 border-2 border-black space-y-2">
              <span className="font-black text-red-700 block uppercase">
                [KUADRAN B: PEMBERANI TAPI SALAH KONSEP]
              </span>
              <p className="text-xs text-zinc-700 leading-relaxed">
                <strong>Ciri:</strong> Durasi Bicara sangat cepat (Nol jeda), tetapi Grammar &amp; Vocab Score &lt; 50%.
              </p>
              <span className="text-[11px] font-bold text-amber-800 block">
                Solusi Guru: Apresiasi keberaniannya, lalu berikan drill Native-like Upgrade pada tenses spesifik.
              </span>
            </div>

            <div className="p-5 bg-zinc-50 border-2 border-black space-y-2">
              <span className="font-black text-emerald-800 block uppercase">
                [KUADRAN C: NATURAL COMMUNICATOR]
              </span>
              <p className="text-xs text-zinc-700 leading-relaxed">
                <strong>Ciri:</strong> Fluency &gt; 80% dan Grammar &gt; 80%.
              </p>
              <span className="text-[11px] font-bold text-cyan-800 block">
                Solusi Guru: Tugaskan sebagai Leader di Mode Classroom Boss Raid untuk membimbing teman-temannya.
              </span>
            </div>

            <div className="p-5 bg-zinc-50 border-2 border-black space-y-2">
              <span className="font-black text-zinc-600 block uppercase">
                [KUADRAN D: BUTUH PENDAMPINGAN DASAR]
              </span>
              <p className="text-xs text-zinc-700 leading-relaxed">
                <strong>Ciri:</strong> Durasi jeda tinggi dan penguasaan kosakata terbatas.
              </p>
              <span className="text-[11px] font-bold text-amber-800 block">
                Solusi Guru: Berikan quest dengan 2 target kosakata benda sehari-hari (botol, pulpen) dengan bantuan "Bisikan AI".
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
