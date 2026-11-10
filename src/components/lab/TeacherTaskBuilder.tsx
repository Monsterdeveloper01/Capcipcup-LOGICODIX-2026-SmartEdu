"use client";

import { useState, useEffect } from "react";
import { CHEMICAL_CATALOG, REACTION_CATALOG } from "@/lib/lab/chemicals-db";
import { LabTask, LabTaskQuestion } from "@/lib/lab/types";
import {
  FlaskConical,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  BookOpen,
  ClipboardList,
  Award,
  Play,
  RotateCcw,
  Users,
  SlidersHorizontal,
  FileText,
  Search,
  Check,
  Zap,
} from "lucide-react";

interface TeacherTaskBuilderProps {
  roomCode?: string;
  teacherName?: string;
  tasks?: LabTask[];
  onTaskCreated?: (task: any) => void;
  onDeleteTask?: (taskId: string) => void;
  onPreviewTask?: (task: LabTask) => void;
  onCancel?: () => void;
  initialSection?: "create" | "list" | "submissions";
  onSectionChange?: (section: "create" | "list" | "submissions") => void;
}

const RPP_INSPIRATIONS = [
  {
    label: "🧪 Asam Basa & Netralisasi (SMP)",
    grade: "SMP" as const,
    text: "RPP Kurikulum Merdeka SMP Kelas 8 - Bab Asam, Basa, dan Garam.\nTujuan Pembelajaran: Siswa mampu mengamati reaksi netralisasi antara asam klorida dan natrium hidroksida, mengukur pelepasan kalor eksotermik saat pembentukan larutan garam NaCl, serta menyimpulkan karakteristik larutan netral.",
  },
  {
    label: "💥 Redoks Piroteknik KMnO4 (SMA)",
    grade: "SMA" as const,
    text: "RPP Kimia SMA Kelas 11 - Materi Reaksi Redoks Spontan dan Termokimia.\nTujuan Pembelajaran: Siswa dapat menganalisis reaksi oksidasi kuat serbuk Kalium Permanganat (KMnO4 padat) dengan gliserin anhidrat, membuktikan pelepasan kalor eksotermik hebat dan kepulan asap, serta memahami perbedaan fasa padat vs larutan cair.",
  },
  {
    label: "🌟 Presipitasi Hujan Emas (SMA)",
    grade: "SMA" as const,
    text: "RPP Kimia SMA Kelas 11 - Materi Kesetimbangan Kelarutan dan Reaksi Pengendapan (Ksp).\nTujuan Pembelajaran: Siswa mampu mereaksikan larutan timbal(II) nitrat jernih dengan kalium iodida untuk membuktikan terbentuknya endapan kristal kuning keemasan PbI2 (Golden Rain).",
  },
  {
    label: "🫧 Gas CO2 & Busa (SD)",
    grade: "SD" as const,
    text: "RPP Sains IPA SD Kelas 5 - Wujud Benda dan Perubahan Wujud Kimia.\nTujuan Pembelajaran: Siswa mampu mencampurkan asam cuka dapur dengan baking soda untuk mengamati pembentukan gas karbon dioksida (CO2) berupa busa meluap, serta merasakan penurunan suhu bejana (reaksi endoterm).",
  },
];

export default function TeacherTaskBuilder({
  roomCode = "LAB889",
  teacherName = "Budi Santoso, S.Pd",
  tasks = [],
  onTaskCreated,
  onDeleteTask,
  onPreviewTask,
  onCancel,
  initialSection = "create",
  onSectionChange,
}: TeacherTaskBuilderProps) {
  // Navigation within Teacher Dashboard: "create" | "list" | "submissions"
  const [activeSection, setActiveSection] = useState<"create" | "list" | "submissions">(initialSection);

  // 2 Creation Modes:
  // "rpp": Guru input RPP/silabus -> AI analisis materi, racik bahan kimia, panduan 3D, dan kuis otomatis
  // "manual": Guru custom mandiri (tentukan sendiri materi, pilih zat dari katalog, buat kuis)
  const [creationMode, setCreationMode] = useState<"rpp" | "manual">("rpp");

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  const switchSection = (s: "create" | "list" | "submissions") => {
    setActiveSection(s);
    onSectionChange?.(s);
  };

  // --- RPP AI Mode State ---
  const [rppText, setRppText] = useState("");
  const [isAnalyzingRpp, setIsAnalyzingRpp] = useState(false);
  const [aiAnalysisSummary, setAiAnalysisSummary] = useState<string | null>(null);

  // --- Common Task Form State ---
  const [title, setTitle] = useState("");
  const [gradeLevel, setGradeLevel] = useState<"SD" | "SMP" | "SMA">("SMP");
  const [instructions, setInstructions] = useState("");
  const [selectedChemicalIds, setSelectedChemicalIds] = useState<string[]>([]);
  const [expectedReactionId, setExpectedReactionId] = useState<string>("");

  // Quiz questions (Manual or AI Generated)
  const [questions, setQuestions] = useState<LabTaskQuestion[]>([]);
  const [isGeneratingAiQuiz, setIsGeneratingAiQuiz] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Manual Chemical Catalog Browser Filter
  const [chemicalCategoryFilter, setChemicalCategoryFilter] = useState<string>("ALL");
  const [chemicalSearchQuery, setChemicalSearchQuery] = useState<string>("");

  // Submissions State
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState<boolean>(false);

  useEffect(() => {
    if (activeSection === "submissions") {
      setIsLoadingSubmissions(true);
      fetch("/api/lab/submissions")
        .then((res) => res.json())
        .then((data) => {
          if (data && data.submissions) {
            setSubmissions(data.submissions);
          }
        })
        .catch((e) => console.warn("Failed fetching submissions:", e))
        .finally(() => setIsLoadingSubmissions(false));
    }
  }, [activeSection]);

  const toggleChemical = (id: string) => {
    setSelectedChemicalIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Handle AI RPP Analysis
  const handleAnalyzeRpp = async () => {
    if (!rppText.trim()) {
      setErrorMsg("Ketik atau tempel dokumen RPP / silabus materi praktikum terlebih dahulu.");
      return;
    }

    setIsAnalyzingRpp(true);
    setErrorMsg(null);
    setSuccessBanner(null);

    try {
      const res = await fetch("/api/lab/analyze-rpp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rppText,
          gradeLevel,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menganalisis RPP dengan AI.");

      setTitle(data.title || "Praktikum Laboratorium Kimia");
      setGradeLevel(data.gradeLevel || "SMP");
      setInstructions(data.instructions || "");
      setSelectedChemicalIds(data.chemicalIds || []);
      setExpectedReactionId(data.expectedReactionId || "");
      setQuestions(data.questions || []);
      setAiAnalysisSummary(data.analysisSummary || null);

      setSuccessBanner(
        "✨ RPP berhasil dianalisis oleh Gemini AI! Komposisi zat kimia di meja 3D, panduan observasi, dan butir kuis evaluasi telah otomatis diracik."
      );
    } catch (err: any) {
      console.error("Analyze RPP error:", err);
      setErrorMsg(err.message || "Gagal memproses dokumen RPP.");
    } finally {
      setIsAnalyzingRpp(false);
    }
  };

  // Manual Mode: Generate AI Quiz from chosen chemicals
  const handleGenerateAiQuiz = async () => {
    if (selectedChemicalIds.length === 0) {
      setErrorMsg("Pilih minimal 1 zat kimia terlebih dahulu sebelum meminta AI menyusun kuis.");
      return;
    }

    setIsGeneratingAiQuiz(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/lab/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Praktikum Sains & Reaksi Kimia",
          gradeLevel,
          chemicalIds: selectedChemicalIds,
          instructions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses kuis AI.");

      setQuestions(data.questions || []);
    } catch (err: any) {
      console.error("AI Quiz error:", err);
      setErrorMsg(err.message || "Gagal membuat kuis otomatis.");
    } finally {
      setIsGeneratingAiQuiz(false);
    }
  };

  // Add Manual Question
  const handleAddManualQuestion = () => {
    const newQ: LabTaskQuestion = {
      id: `q_man_${Date.now()}`,
      question: "Tuliskan pertanyaan observasi praktikum di sini...",
      options: [
        "Pilihan A (Jawaban benar)",
        "Pilihan B",
        "Pilihan C",
        "Pilihan D",
      ],
      correctIndex: 0,
      explanation: "Penjelasan ilmiah mengapa jawaban A benar.",
    };
    setQuestions((prev) => [...prev, newQ]);
  };

  // Save & Publish Task to Classroom
  const handleSaveTask = async () => {
    if (!title.trim()) {
      setErrorMsg("Judul tugas praktikum wajib diisi.");
      return;
    }
    if (selectedChemicalIds.length === 0) {
      setErrorMsg("Pilih minimal 1 zat kimia untuk ditaruh di meja 3D siswa.");
      return;
    }
    if (questions.length === 0) {
      setErrorMsg("Tugas memerlukan minimal 1 butir kuis pemahaman (klik 'Generate Kuis AI' atau analisis RPP).");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);
    setSuccessBanner(null);

    try {
      const res = await fetch("/api/lab/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode,
          teacherName,
          title,
          gradeLevel,
          instructions,
          chemicalIds: selectedChemicalIds,
          expectedReactionId: expectedReactionId || null,
          questions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan tugas praktikum.");

      setSuccessBanner(`Tugas "${title}" berhasil diterbitkan ke Room PIN ${roomCode}!`);
      setTitle("");
      setInstructions("");
      setSelectedChemicalIds([]);
      setQuestions([]);
      setRppText("");
      setAiAnalysisSummary(null);

      onTaskCreated?.(data);

      setTimeout(() => {
        switchSection("list");
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan tugas.");
    } finally {
      setIsSaving(false);
    }
  };

  // Filtered chemicals for manual mode
  const filteredChemicals = CHEMICAL_CATALOG.filter((c) => {
    const matchCat = chemicalCategoryFilter === "ALL" || c.category?.toLowerCase() === chemicalCategoryFilter.toLowerCase();
    const matchSearch =
      chemicalSearchQuery.trim() === "" ||
      c.name.toLowerCase().includes(chemicalSearchQuery.toLowerCase()) ||
      c.formula.toLowerCase().includes(chemicalSearchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="bg-[#313338] border border-[#202225] p-5 sm:p-6 rounded-2xl shadow-2xl font-sans text-[#dbdee1] space-y-6 max-w-4xl mx-auto">
      {/* Top Header of Teacher Portal */}
      <div className="border-b border-[#202225] pb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase bg-[#FEE75C] text-black px-2 py-0.5 rounded shadow">
              PORTAL GURU
            </span>
            <span className="text-xs text-[#949ba4] font-medium">
              Guru Pengampu: <strong className="text-white">{teacherName}</strong>
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#f2f3f5] mt-1">
            Dashboard Perancangan Praktikum & Kuis AI
          </h2>
          <p className="text-xs text-[#949ba4]">
            Rancang tugas praktikum meja 3D dengan AI Auto-Pilot RPP atau racik sendiri secara mandiri.
          </p>
        </div>

        <div className="text-right flex items-center gap-2">
          <div className="bg-[#1e1f22] px-3.5 py-1.5 rounded-xl border border-[#3b3e45] text-right">
            <span className="text-[9px] font-bold text-[#949ba4] uppercase block">ROOM KELAS</span>
            <span className="text-xs font-black text-[#57F287] tracking-wider">PIN {roomCode}</span>
          </div>
        </div>
      </div>

      {/* Main Tabs: Rancang Tugas | Tugas Diterbitkan | Rekap Nilai */}
      <div className="flex items-center gap-2 p-1 bg-[#1e1f22] rounded-xl border border-[#3b3e45]">
        <button
          type="button"
          onClick={() => switchSection("create")}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors ${
            activeSection === "create"
              ? "bg-[#5865F2] text-white shadow"
              : "text-[#949ba4] hover:text-white hover:bg-[#2b2d31]"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Rancang Tugas Baru</span>
        </button>

        <button
          type="button"
          onClick={() => switchSection("list")}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors ${
            activeSection === "list"
              ? "bg-[#5865F2] text-white shadow"
              : "text-[#949ba4] hover:text-white hover:bg-[#2b2d31]"
          }`}
        >
          <ClipboardList className="w-3.5 h-3.5" />
          <span>Tugas Diterbitkan ({tasks.length})</span>
        </button>

        <button
          type="button"
          onClick={() => switchSection("submissions")}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors ${
            activeSection === "submissions"
              ? "bg-[#5865F2] text-white shadow"
              : "text-[#949ba4] hover:text-white hover:bg-[#2b2d31]"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Rekap Nilai Siswa</span>
        </button>
      </div>

      {/* Notification Banner */}
      {errorMsg && (
        <div className="p-3 bg-[#ed4245]/20 border border-[#ed4245] text-xs font-semibold text-[#f2f3f5] rounded-xl flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-[#ed4245] shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successBanner && (
        <div className="p-3 bg-[#57F287]/20 border border-[#57F287] text-xs font-semibold text-[#57F287] rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-[#57F287] shrink-0" />
          <span>{successBanner}</span>
        </div>
      )}

      {/* =========================================================================
          SECTION 1: RANCANG TUGAS BARU (2 PILIHAN MODE)
          ========================================================================= */}
      {activeSection === "create" && (
        <div className="space-y-6">
          {/* Mode Switcher: Mode RPP AI vs Mode Custom Mandiri */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-[#949ba4] uppercase tracking-wider block">
              Pilih Metode Perancangan Tugas Praktikum:
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Option A: Mode Analisis RPP Otomatis AI */}
              <button
                type="button"
                onClick={() => setCreationMode("rpp")}
                className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between space-y-2 ${
                  creationMode === "rpp"
                    ? "bg-[#5865F2]/15 border-[#5865F2] ring-1 ring-[#5865F2]"
                    : "bg-[#2b2d31] hover:bg-[#35373c] border-[#3b3e45]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#5865F2] text-white flex items-center justify-center font-bold shadow">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                        <span>Mode Analisis RPP Otomatis</span>
                      </h4>
                      <span className="text-[10px] text-[#5865F2] font-extrabold uppercase">
                        Rekomendasi • Praktis & Cepat
                      </span>
                    </div>
                  </div>
                  {creationMode === "rpp" && (
                    <div className="w-5 h-5 rounded-full bg-[#5865F2] text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-[#dbdee1] leading-relaxed">
                  Guru cukup memasukkan teks RPP / silabus materi. AI otomatis menganalisis materi, memilihkan reagen kimia di meja 3D, menyusun panduan, dan membuat kuis evaluasi.
                </p>
              </button>

              {/* Option B: Mode Custom Mandiri */}
              <button
                type="button"
                onClick={() => setCreationMode("manual")}
                className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between space-y-2 ${
                  creationMode === "manual"
                    ? "bg-[#23a55a]/15 border-[#23a55a] ring-1 ring-[#23a55a]"
                    : "bg-[#2b2d31] hover:bg-[#35373c] border-[#3b3e45]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#23a55a] text-white flex items-center justify-center font-bold shadow">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                        <span>Mode Kustom Mandiri</span>
                      </h4>
                      <span className="text-[10px] text-[#57F287] font-extrabold uppercase">
                        Fleksibel • Kontrol Penuh
                      </span>
                    </div>
                  </div>
                  {creationMode === "manual" && (
                    <div className="w-5 h-5 rounded-full bg-[#23a55a] text-white flex items-center justify-center">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-[#dbdee1] leading-relaxed">
                  Guru bebas menentukan sendiri judul tugas, langkah instruksi, memilih bahan kimia dari katalog per kategori, dan menyusun kuis pemahaman untuk muridnya.
                </p>
              </button>
            </div>
          </div>

          {/* ===================================================================
              SUB-VIEW 1: MODE RPP OTOMATIS (AI RPP GENERATOR)
              =================================================================== */}
          {creationMode === "rpp" && (
            <div className="space-y-5">
              {/* RPP Input Box */}
              <div className="p-4 bg-[#2b2d31] border border-[#3b3e45] rounded-2xl space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white uppercase flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[#5865F2]" />
                    <span>Tempelkan Dokumen RPP / Silabus / Modul Ajar:</span>
                  </label>
                  <span className="text-[10px] text-[#949ba4]">
                    AI akan membaca tujuan & konsep kimia
                  </span>
                </div>

                <textarea
                  rows={4}
                  value={rppText}
                  onChange={(e) => setRppText(e.target.value)}
                  placeholder="Contoh: RPP Kimia Kelas 11 SMA - Materi Reaksi Eksotermik dan Endotermik. Siswa mampu membuktikan pelepasan kalor eksotermik pada reaksi netralisasi atau reaksi redoks spontan, mengamati perubahan suhu bejana, serta menyimpulkan entalpi reaksi..."
                  className="w-full p-3 bg-[#1e1f22] border border-[#3b3e45] focus:border-[#5865F2] text-xs font-medium text-white rounded-xl outline-none transition-colors leading-relaxed"
                />

                {/* Quick RPP Inspiration Pills */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-[#949ba4] font-semibold block">
                    Atau klik contoh topik RPP siap pakai untuk uji coba instan:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {RPP_INSPIRATIONS.map((item, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          setRppText(item.text);
                          setGradeLevel(item.grade);
                        }}
                        className="px-2.5 py-1 bg-[#1e1f22] hover:bg-[#5865F2] hover:text-white text-[#dbdee1] text-xs font-medium rounded-lg border border-[#3b3e45] transition-colors"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Grade Preference & Analyze Button */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#3b3e45]">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-[#dbdee1]">Jenjang Target:</span>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value as any)}
                      className="p-1.5 bg-[#1e1f22] border border-[#3b3e45] text-xs font-bold text-white rounded-lg outline-none"
                    >
                      <option value="SD">SD (Sains Dasar)</option>
                      <option value="SMP">SMP (Zat & Asam Basa)</option>
                      <option value="SMA">SMA (Redoks & Termokimia)</option>
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={handleAnalyzeRpp}
                    disabled={isAnalyzingRpp}
                    className="px-5 py-2.5 bg-gradient-to-r from-[#5865F2] to-[#4752c4] hover:from-[#4752c4] hover:to-[#3b43a3] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className={`w-4 h-4 ${isAnalyzingRpp ? "animate-spin text-[#FEE75C]" : "text-[#FEE75C]"}`} />
                    <span>
                      {isAnalyzingRpp
                        ? "AI Sedang Menganalisis RPP & Meracik Praktikum..."
                        : "Analisis RPP & Racik Praktikum Otomatis (Gemini AI)"}
                    </span>
                  </button>
                </div>
              </div>

              {/* AI Analysis Result & Review Section */}
              {title && selectedChemicalIds.length > 0 && (
                <div className="p-5 bg-[#2b2d31] border-2 border-[#5865F2] rounded-2xl space-y-4 shadow-xl animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-[#3b3e45] pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#57F287] animate-pulse" />
                      <h4 className="font-bold text-sm text-white">
                        Hasil Analisis RPP & Rekomendasi Meja Praktikum 3D
                      </h4>
                    </div>
                    <span className="text-[10px] bg-[#5865F2] text-white px-2 py-0.5 rounded font-black">
                      AI GENERATED
                    </span>
                  </div>

                  {aiAnalysisSummary && (
                    <div className="p-3 bg-[#1e1f22] border border-[#3b3e45] rounded-xl text-xs space-y-1">
                      <span className="text-[10px] font-bold text-[#FEE75C] uppercase block">
                        Korelasi Kurikulum & Pedagogis RPP:
                      </span>
                      <p className="text-[#dbdee1] leading-relaxed text-[11px]">
                        {aiAnalysisSummary}
                      </p>
                    </div>
                  )}

                  {/* Editable Title & Grade Level */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-bold text-[#949ba4] uppercase">
                        Judul Praktikum (Bisa diedit):
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 bg-[#1e1f22] border border-[#3b3e45] text-xs font-bold text-white rounded-lg outline-none focus:border-[#5865F2]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-[#949ba4] uppercase">
                        Jenjang Kurikulum:
                      </label>
                      <select
                        value={gradeLevel}
                        onChange={(e) => setGradeLevel(e.target.value as any)}
                        className="w-full p-2 bg-[#1e1f22] border border-[#3b3e45] text-xs font-bold text-white rounded-lg outline-none"
                      >
                        <option value="SD">SD</option>
                        <option value="SMP">SMP</option>
                        <option value="SMA">SMA</option>
                      </select>
                    </div>
                  </div>

                  {/* Reagents selected by AI */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-[#949ba4] uppercase block">
                      Zat Kimia yang Otomatis Disiapkan di Meja 3D Siswa:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {selectedChemicalIds.map((id) => {
                        const chem = CHEMICAL_CATALOG.find((c) => c.id === id) || {
                          id,
                          name: "Bahan Kimia",
                          formula: id,
                          color: "#38bdf8",
                          level: gradeLevel,
                        };
                        return (
                          <div
                            key={id}
                            className="p-2 bg-[#1e1f22] border border-[#3b3e45] rounded-xl flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className="w-3 h-3 rounded-full border border-black shrink-0"
                                style={{ backgroundColor: chem.color }}
                              />
                              <div className="truncate">
                                <span className="font-mono font-bold text-white block">
                                  {chem.formula}
                                </span>
                                <span className="text-[10px] text-[#949ba4] truncate">
                                  {chem.name}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleChemical(id)}
                              className="text-[#ed4245] hover:text-white p-1 rounded hover:bg-[#ed4245]/20 text-[10px]"
                              title="Hapus zat ini"
                            >
                              ✕
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Instructions for students */}
                  <div className="space-y-1">
                    <label className="text-[11px] font-bold text-[#949ba4] uppercase">
                      Instruksi Praktikum di Meja Siswa:
                    </label>
                    <textarea
                      rows={3}
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className="w-full p-2 bg-[#1e1f22] border border-[#3b3e45] text-xs text-[#dbdee1] rounded-lg outline-none focus:border-[#5865F2] leading-relaxed"
                    />
                  </div>

                  {/* Questions generated */}
                  <div className="space-y-2 pt-2 border-t border-[#3b3e45]">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-[#FEE75C] uppercase flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5" />
                        <span>Kuis Evaluasi AI ({questions.length} Soal Pilihan Ganda):</span>
                      </label>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {questions.map((q, idx) => (
                        <div
                          key={q.id || idx}
                          className="p-2.5 bg-[#1e1f22] border border-[#3b3e45] rounded-xl text-xs space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-white">
                              {idx + 1}. {q.question}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== idx))}
                              className="text-[#ed4245] text-[10px] hover:underline"
                            >
                              Hapus
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px]">
                            {q.options.map((opt, oIdx) => (
                              <div
                                key={oIdx}
                                className={`px-2 py-1 rounded border ${
                                  oIdx === q.correctIndex
                                    ? "bg-[#23a55a]/20 border-[#23a55a] text-[#57F287] font-bold"
                                    : "bg-[#2b2d31] border-[#3b3e45] text-[#dbdee1]"
                                }`}
                              >
                                {String.fromCharCode(65 + oIdx)}. {opt}{" "}
                                {oIdx === q.correctIndex && "✓ (Kunci)"}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Publish Button */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#3b3e45]">
                    <button
                      type="button"
                      onClick={() => {
                        setTitle("");
                        setSelectedChemicalIds([]);
                        setQuestions([]);
                      }}
                      className="px-4 py-2 bg-[#35373c] hover:bg-[#404249] text-white text-xs font-semibold rounded-xl"
                    >
                      Batal / Reset
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveTask}
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-[#23a55a] hover:bg-[#1f9250] text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 shadow-lg transition-transform hover:scale-[1.02] disabled:opacity-50 cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isSaving ? "Menerbitkan..." : `Terbitkan Tugas Praktikum ke Room [${roomCode}]`}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================
              SUB-VIEW 2: MODE KUSTOM MANDIRI (MANUAL BUILDER)
              =================================================================== */}
          {creationMode === "manual" && (
            <div className="space-y-6">
              {/* Form Fields: Judul & Jenjang */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-[#f2f3f5] uppercase">
                    Judul Tugas Praktikum:
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Eksperimen Netralisasi Asam Klorida dan Soda Api"
                    className="w-full p-2.5 bg-[#1e1f22] border border-[#3b3e45] focus:border-[#5865F2] text-xs font-medium text-white rounded-xl outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#f2f3f5] uppercase">
                    Jenjang Kurikulum:
                  </label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value as any)}
                    className="w-full p-2.5 bg-[#1e1f22] border border-[#3b3e45] focus:border-[#5865F2] text-xs font-semibold text-white rounded-xl outline-none"
                  >
                    <option value="SD">SD (Sains Dasar & Lingkungan)</option>
                    <option value="SMP">SMP (Zat & Asam-Basa Dasar)</option>
                    <option value="SMA">SMA (Reaksi Redoks & Stoikiometri)</option>
                  </select>
                </div>
              </div>

              {/* Instruksi Langkah untuk Siswa */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#f2f3f5] uppercase">
                  Instruksi Misi Praktikum (Panduan langkah di Meja 3D siswa):
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Tuliskan petunjuk jelas bagi siswa (contoh: 'Ambil bejana NaOH, tuangkan perlahan ke dalam bejana HCl. Amati perubahan suhu dan warna, lalu jawab kuis pemahaman!')..."
                  className="w-full p-2.5 bg-[#1e1f22] border border-[#3b3e45] focus:border-[#5865F2] text-xs font-medium text-white rounded-xl outline-none transition-colors"
                />
              </div>

              {/* Pemilihan Zat Kimia untuk Meja 3D */}
              <div className="space-y-2.5 p-4 bg-[#2b2d31] border border-[#3b3e45] rounded-2xl">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3b3e45] pb-2.5">
                  <div>
                    <label className="text-xs font-bold text-[#f2f3f5] uppercase flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-[#5865F2]" />
                      <span>PILIH ZAT KIMIA UNTUK MEJA SISWA ({selectedChemicalIds.length} Terpilih):</span>
                    </label>
                    <span className="text-[11px] text-[#949ba4]">
                      Klik kartu zat untuk mencentang/menaruh di meja 3D siswa
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#949ba4]" />
                      <input
                        type="text"
                        value={chemicalSearchQuery}
                        onChange={(e) => setChemicalSearchQuery(e.target.value)}
                        placeholder="Cari zat / rumus..."
                        className="pl-8 pr-2.5 py-1 bg-[#1e1f22] border border-[#3b3e45] text-xs text-white rounded-lg outline-none w-36 sm:w-44"
                      />
                    </div>
                  </div>
                </div>

                {/* Category Filter Tabs */}
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["ALL", "asam", "basa", "garam", "oksidator", "organik", "pelarut", "indikator"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setChemicalCategoryFilter(cat)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase transition-colors ${
                        chemicalCategoryFilter === cat
                          ? "bg-[#5865F2] text-white"
                          : "bg-[#1e1f22] text-[#949ba4] hover:text-white"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2 max-h-64 overflow-y-auto pr-1">
                  {filteredChemicals.map((chem) => {
                    const isSelected = selectedChemicalIds.includes(chem.id);
                    return (
                      <button
                        key={chem.id}
                        type="button"
                        onClick={() => toggleChemical(chem.id)}
                        className={`p-2.5 rounded-xl border text-left flex flex-col justify-between transition-all ${
                          isSelected
                            ? "bg-[#404249] border-[#5865F2] ring-1 ring-[#5865F2]"
                            : "bg-[#1e1f22] hover:bg-[#35373c] border-[#3b3e45]"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold text-white font-mono">{chem.formula}</span>
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black shadow-sm"
                            style={{ backgroundColor: chem.color }}
                          />
                        </div>
                        <div className="text-[11px] text-[#dbdee1] truncate mt-1">
                          {chem.name}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-[#949ba4] mt-2 border-t border-[#3b3e45] pt-1">
                          <span>{chem.level}</span>
                          <span className={`font-bold ${isSelected ? "text-[#57F287]" : "text-[#949ba4]"}`}>
                            {isSelected ? "✓ Di Meja" : "+ Tambah"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Generator Kuis AI & Soal Evaluasi */}
              <div className="p-4 bg-[#2b2d31] border border-[#3b3e45] rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3b3e45] pb-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-[#f2f3f5] flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-[#FEE75C]" />
                      <span>Kuis Evaluasi Praktikum ({questions.length} Soal)</span>
                    </h4>
                    <p className="text-[11px] text-[#949ba4]">
                      Kuis ini wajib dijawab siswa setelah berhasil mengamati reaksi kimia di meja 3D.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddManualQuestion}
                      className="bg-[#1e1f22] hover:bg-[#35373c] text-white border border-[#3b3e45] px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Soal Manual</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGenerateAiQuiz}
                      disabled={isGeneratingAiQuiz}
                      className="bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-50 text-white px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-[#FEE75C]" />
                      <span>{isGeneratingAiQuiz ? "Menyusun Soal..." : "Generate Kuis AI"}</span>
                    </button>
                  </div>
                </div>

                {questions.length === 0 ? (
                  <div className="text-center py-6 text-[#949ba4] text-xs border border-dashed border-[#3b3e45] rounded-xl bg-[#1e1f22] p-4">
                    Belum ada butir kuis. Klik <strong>&quot;Generate Kuis AI&quot;</strong> dari zat kimia yang dipilih atau klik <strong>&quot;+ Soal Manual&quot;</strong>.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {questions.map((q, idx) => (
                      <div key={q.id || idx} className="p-3 bg-[#1e1f22] border border-[#3b3e45] rounded-xl text-xs space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-white">
                            {idx + 1}. {q.question}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-[#ed4245] hover:underline text-[11px] font-semibold"
                          >
                            Hapus
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2">
                          {q.options.map((opt, optIdx) => (
                            <div
                              key={optIdx}
                              className={`p-2 rounded-lg border text-[11px] ${
                                optIdx === q.correctIndex
                                  ? "bg-[#23a55a]/20 border-[#23a55a] text-[#57F287] font-semibold"
                                  : "bg-[#2b2d31] border-[#3b3e45] text-[#dbdee1]"
                              }`}
                            >
                              <span className="font-bold mr-1">{String.fromCharCode(65 + optIdx)}.</span> {opt}{" "}
                              {optIdx === q.correctIndex && "✓ (Kunci)"}
                            </div>
                          ))}
                        </div>

                        <div className="text-[10px] text-[#949ba4] bg-[#2b2d31] p-2 rounded-lg border border-[#3b3e45]">
                          <strong className="text-[#5865F2]">Pembahasan:</strong> {q.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Submit Buttons */}
              <div className="flex items-center justify-between border-t border-[#202225] pt-4">
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="bg-[#4e5058] hover:bg-[#6d6f78] text-white px-4 py-2 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveTask}
                  disabled={isSaving}
                  className="bg-[#23a55a] hover:bg-[#1f9250] text-white px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 ml-auto shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>{isSaving ? "Menerbitkan Tugas..." : `Terbitkan Tugas ke Siswa (PIN ${roomCode})`}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION 2: DAFTAR TUGAS DITERBITKAN
          ========================================================================= */}
      {activeSection === "list" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#949ba4]">
              Menampilkan {tasks.length} tugas praktikum aktif untuk Room <strong>{roomCode}</strong>.
            </span>
            <button
              type="button"
              onClick={() => setActiveSection("create")}
              className="px-3 py-1.5 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-lg shadow flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Tugas Baru</span>
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12 text-[#949ba4] text-xs border border-dashed border-[#3b3e45] rounded-2xl bg-[#2b2d31] p-6 space-y-3">
              <p>Belum ada tugas praktikum yang diterbitkan di Room PIN {roomCode}.</p>
              <button
                type="button"
                onClick={() => setActiveSection("create")}
                className="bg-[#5865F2] hover:bg-[#4752c4] text-white px-4 py-2 text-xs font-bold rounded-xl shadow"
              >
                + Rancang Tugas Praktikum Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-[#2b2d31] hover:bg-[#35373c] border border-[#3b3e45] rounded-2xl p-5 space-y-3 transition-colors flex flex-col justify-between shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black bg-[#5865F2] text-white px-2 py-0.5 rounded uppercase">
                        {task.gradeLevel}
                      </span>
                      <span className="text-[11px] text-[#949ba4]">Room PIN: {task.roomCode}</span>
                    </div>

                    <h4 className="font-bold text-sm text-white">{task.title}</h4>
                    <p className="text-xs text-[#dbdee1] leading-relaxed line-clamp-3">
                      {task.instructions}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-[#3b3e45]">
                      <span className="text-[#57F287] font-semibold">
                        🔬 {task.chemicalIds?.length || 0} Reagen 3D
                      </span>
                      <span className="text-[#FEE75C] font-semibold">
                        📝 {task.questions?.length || 0} Butir Kuis
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    {onPreviewTask && (
                      <button
                        type="button"
                        onClick={() => onPreviewTask(task)}
                        className="flex-1 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-xl transition-colors shadow flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Uji Coba 3D (Sandbox Guru)</span>
                      </button>
                    )}

                    {onDeleteTask && (
                      <button
                        type="button"
                        onClick={() => onDeleteTask(task.id)}
                        className="p-2 bg-[#ed4245]/20 hover:bg-[#ed4245] text-[#ed4245] hover:text-white rounded-xl transition-colors"
                        title="Hapus Tugas"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION 3: REKAP NILAI SISWA
          ========================================================================= */}
      {activeSection === "submissions" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">
                Laporan & Rekap Nilai Kuis Praktikum Siswa
              </h3>
              <p className="text-xs text-[#949ba4]">
                Data penilaian yang otomatis terkumpul dari siswa saat menyelesaikan kuis di meja lab 3D.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setIsLoadingSubmissions(true);
                fetch("/api/lab/submissions")
                  .then((res) => res.json())
                  .then((data) => {
                    if (data && data.submissions) setSubmissions(data.submissions);
                  })
                  .finally(() => setIsLoadingSubmissions(false));
              }}
              className="px-3 py-1.5 bg-[#1e1f22] hover:bg-[#35373c] text-xs font-medium text-white border border-[#3b3e45] rounded-xl flex items-center gap-1.5"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoadingSubmissions ? "animate-spin" : ""}`} />
              <span>Segarkan</span>
            </button>
          </div>

          {isLoadingSubmissions ? (
            <div className="text-center py-12 text-[#949ba4] text-xs">
              <div className="w-6 h-6 border-2 border-[#5865F2] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Memuat rekap nilai siswa...
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 text-[#949ba4] text-xs border border-dashed border-[#3b3e45] rounded-2xl bg-[#2b2d31] p-6 space-y-2">
              <Users className="w-8 h-8 text-[#949ba4] mx-auto opacity-50" />
              <p>Belum ada siswa yang mengumpulkan tugas atau menyelesaikan kuis.</p>
              <p className="text-[11px] text-[#949ba4]">
                Hasil pengumpulan kuis siswa akan muncul di tabel ini secara otomatis.
              </p>
            </div>
          ) : (
            <div className="bg-[#1e1f22] border border-[#3b3e45] rounded-2xl overflow-hidden shadow-md">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#2b2d31] text-[#949ba4] text-[10px] uppercase font-bold border-b border-[#3b3e45]">
                    <tr>
                      <th className="px-4 py-3">Nama Siswa</th>
                      <th className="px-4 py-3">Reaksi 3D</th>
                      <th className="px-4 py-3">Skor Kuis</th>
                      <th className="px-4 py-3">Analisis Lab</th>
                      <th className="px-4 py-3">Waktu Selesai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#2b2d31]">
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-[#2b2d31]/50 transition-colors">
                        <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#5865F2] text-white flex items-center justify-center font-bold text-[10px]">
                            {sub.studentName?.charAt(0) || "S"}
                          </div>
                          <span>{sub.studentName}</span>
                        </td>
                        <td className="px-4 py-3">
                          {sub.isReactionAchieved ? (
                            <span className="text-[#57F287] font-semibold flex items-center gap-1">
                              ✓ Sukses
                            </span>
                          ) : (
                            <span className="text-[#FEE75C] font-semibold">
                              Proses
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-black px-2 py-0.5 rounded text-[11px] ${
                              sub.score >= 80
                                ? "bg-[#57F287]/20 text-[#57F287]"
                                : sub.score >= 60
                                ? "bg-[#FEE75C]/20 text-[#FEE75C]"
                                : "bg-[#ed4245]/20 text-[#ed4245]"
                            }`}
                          >
                            {sub.score}/100
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#dbdee1] max-w-xs truncate">
                          {sub.aiAnalysis || "Laporan lengkap"}
                        </td>
                        <td className="px-4 py-3 text-[#949ba4] text-[11px]">
                          {sub.completedAt ? new Date(sub.completedAt).toLocaleTimeString("id-ID") : "-"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
