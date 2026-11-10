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
    <div className="bg-white border border-slate-200 p-5 sm:p-6 rounded-2xl shadow-sm font-sans text-slate-800 space-y-6 max-w-4xl mx-auto">
      {/* Top Header of Teacher Portal */}
      <div className="border-b border-slate-200 pb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase bg-amber-100 text-amber-800 border border-amber-200 px-2 py-0.5 rounded shadow-2xs">
              PORTAL GURU
            </span>
            <span className="text-xs text-slate-500 font-medium">
              Guru Pengampu: <strong className="text-slate-900">{teacherName}</strong>
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            Dashboard Perancangan Praktikum & Kuis AI
          </h2>
          <p className="text-xs text-slate-500">
            Rancang tugas praktikum meja 3D dengan AI Auto-Pilot RPP atau racik sendiri secara mandiri.
          </p>
        </div>

        <div className="text-right flex items-center gap-2">
          <div className="bg-slate-50 px-3.5 py-1.5 rounded-xl border border-slate-200 text-right">
            <span className="text-[9px] font-bold text-slate-400 uppercase block">ROOM KELAS</span>
            <span className="text-xs font-black text-emerald-700 tracking-wider">PIN {roomCode}</span>
          </div>
        </div>
      </div>

      {/* Main Tabs: Rancang Tugas | Tugas Diterbitkan | Rekap Nilai */}
      <div className="flex items-center gap-2 p-1 bg-slate-50 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => switchSection("create")}
          className={`flex-1 py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors ${
            activeSection === "create"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
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
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Rekap Nilai Siswa</span>
        </button>
      </div>

      {/* Notification Banner */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 rounded-xl flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successBanner && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 rounded-xl flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
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
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Pilih Metode Perancangan Tugas Praktikum:
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Option A: Mode Analisis RPP Otomatis AI */}
              <button
                type="button"
                onClick={() => setCreationMode("rpp")}
                className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between space-y-2 ${
                  creationMode === "rpp"
                    ? "bg-sky-50 border-sky-500 ring-1 ring-sky-500"
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold shadow-xs">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <span>Mode Analisis RPP Otomatis</span>
                      </h4>
                      <span className="text-[10px] text-sky-700 font-extrabold uppercase">
                        Rekomendasi • Praktis & Cepat
                      </span>
                    </div>
                  </div>
                  {creationMode === "rpp" && (
                    <div className="w-5 h-5 rounded-full bg-sky-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  Guru cukup memasukkan teks RPP / silabus materi. AI otomatis menganalisis materi, memilihkan reagen kimia di meja 3D, menyusun panduan, dan membuat kuis evaluasi.
                </p>
              </button>

              {/* Option B: Mode Custom Mandiri */}
              <button
                type="button"
                onClick={() => setCreationMode("manual")}
                className={`p-4 rounded-xl border text-left transition-all relative flex flex-col justify-between space-y-2 ${
                  creationMode === "manual"
                    ? "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500"
                    : "bg-slate-50 hover:bg-slate-100 border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold shadow-xs">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                        <span>Mode Kustom Mandiri</span>
                      </h4>
                      <span className="text-[10px] text-emerald-700 font-extrabold uppercase">
                        Fleksibel • Kontrol Penuh
                      </span>
                    </div>
                  </div>
                  {creationMode === "manual" && (
                    <div className="w-5 h-5 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Check className="w-3 h-3" />
                    </div>
                  )}
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
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
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-2">
                    <FileText className="w-4 h-4 text-sky-600" />
                    <span>Tempelkan Dokumen RPP / Silabus / Modul Ajar:</span>
                  </label>
                  <span className="text-[10px] text-slate-400">
                    AI akan membaca tujuan & konsep kimia
                  </span>
                </div>

                <textarea
                  rows={4}
                  value={rppText}
                  onChange={(e) => setRppText(e.target.value)}
                  placeholder="Contoh: RPP Kimia Kelas 11 SMA - Materi Reaksi Eksotermik dan Endotermik. Siswa mampu membuktikan pelepasan kalor eksotermik pada reaksi netralisasi atau reaksi redoks spontan, mengamati perubahan suhu bejana, serta menyimpulkan entalpi reaksi..."
                  className="w-full p-3 bg-white border border-slate-200 focus:border-sky-600 text-xs font-medium text-slate-800 rounded-xl outline-none transition-colors leading-relaxed"
                />

                {/* Quick RPP Inspiration Pills */}
                <div className="space-y-1.5 pt-1">
                  <span className="text-[10px] text-slate-500 font-semibold block">
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
                        className="px-2.5 py-1 bg-white hover:bg-sky-50 hover:text-sky-700 text-slate-700 text-xs font-medium rounded-lg border border-slate-200 transition-colors shadow-2xs"
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Target Grade Preference & Analyze Button */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-slate-700">Jenjang Target:</span>
                    <select
                      value={gradeLevel}
                      onChange={(e) => setGradeLevel(e.target.value as any)}
                      className="p-1.5 bg-white border border-slate-200 text-xs font-bold text-slate-800 rounded-lg outline-none"
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
                    className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-sm transition-transform hover:scale-[1.01] disabled:opacity-50 cursor-pointer"
                  >
                    <Sparkles className={`w-4 h-4 ${isAnalyzingRpp ? "animate-spin text-amber-300" : "text-amber-300"}`} />
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
                <div className="p-5 bg-white border-2 border-sky-500 rounded-2xl space-y-4 shadow-sm animate-in fade-in">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <h4 className="font-bold text-sm text-slate-900">
                        Hasil Analisis RPP & Rekomendasi Meja Praktikum 3D
                      </h4>
                    </div>
                    <span className="text-[10px] bg-sky-600 text-white px-2 py-0.5 rounded font-black shadow-2xs">
                      AI GENERATED
                    </span>
                  </div>

                  {aiAnalysisSummary && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1">
                      <span className="text-[10px] font-bold text-amber-700 uppercase block">
                        Korelasi Kurikulum & Pedagogis RPP:
                      </span>
                      <p className="text-slate-700 leading-relaxed text-[11px]">
                        {aiAnalysisSummary}
                      </p>
                    </div>
                  )}

                  {/* Editable Title & Grade Level */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Judul Praktikum (Bisa diedit):
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-lg outline-none focus:border-sky-600"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-bold text-slate-500 uppercase">
                        Jenjang Kurikulum:
                      </label>
                      <select
                        value={gradeLevel}
                        onChange={(e) => setGradeLevel(e.target.value as any)}
                        className="w-full p-2 bg-slate-50 border border-slate-200 text-xs font-bold text-slate-800 rounded-lg outline-none"
                      >
                        <option value="SD">SD</option>
                        <option value="SMP">SMP</option>
                        <option value="SMA">SMA</option>
                      </select>
                    </div>
                  </div>

                  {/* Reagents selected by AI */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase block">
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
                            className="p-2 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                          >
                            <div className="flex items-center gap-2 truncate">
                              <span
                                className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                                style={{ backgroundColor: chem.color }}
                              />
                              <div className="truncate">
                                <span className="font-mono font-bold text-slate-900 block">
                                  {chem.formula}
                                </span>
                                <span className="text-[10px] text-slate-500 truncate">
                                  {chem.name}
                                </span>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => toggleChemical(id)}
                              className="text-rose-600 hover:text-rose-700 p-1 rounded hover:bg-rose-50 text-[10px]"
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
                    <label className="text-[11px] font-bold text-slate-500 uppercase">
                      Instruksi Praktikum di Meja Siswa:
                    </label>
                    <textarea
                      rows={3}
                      value={instructions}
                      onChange={(e) => setInstructions(e.target.value)}
                      className="w-full p-2 bg-slate-50 border border-slate-200 text-xs text-slate-800 rounded-lg outline-none focus:border-sky-600 leading-relaxed"
                    />
                  </div>

                  {/* Questions generated */}
                  <div className="space-y-2 pt-2 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold text-amber-700 uppercase flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5" />
                        <span>Kuis Evaluasi AI ({questions.length} Soal Pilihan Ganda):</span>
                      </label>
                    </div>

                    <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                      {questions.map((q, idx) => (
                        <div
                          key={q.id || idx}
                          className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs space-y-1.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-bold text-slate-900">
                              {idx + 1}. {q.question}
                            </span>
                            <button
                              type="button"
                              onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== idx))}
                              className="text-rose-600 text-[10px] hover:underline"
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
                                    ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-bold"
                                    : "bg-white border-slate-200 text-slate-700"
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
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => {
                        setTitle("");
                        setSelectedChemicalIds([]);
                        setQuestions([]);
                      }}
                      className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200"
                    >
                      Batal / Reset
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveTask}
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 shadow-sm transition-transform hover:scale-[1.01] disabled:opacity-50 cursor-pointer"
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
                  <label className="text-xs font-bold text-slate-800 uppercase">
                    Judul Tugas Praktikum:
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Eksperimen Netralisasi Asam Klorida dan Soda Api"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-sky-600 text-xs font-medium text-slate-900 rounded-xl outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-800 uppercase">
                    Jenjang Kurikulum:
                  </label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-sky-600 text-xs font-semibold text-slate-800 rounded-xl outline-none"
                  >
                    <option value="SD">SD (Sains Dasar & Lingkungan)</option>
                    <option value="SMP">SMP (Zat & Asam-Basa Dasar)</option>
                    <option value="SMA">SMA (Reaksi Redoks & Stoikiometri)</option>
                  </select>
                </div>
              </div>

              {/* Instruksi Langkah untuk Siswa */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800 uppercase">
                  Instruksi Misi Praktikum (Panduan langkah di Meja 3D siswa):
                </label>
                <textarea
                  rows={3}
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  placeholder="Tuliskan petunjuk jelas bagi siswa (contoh: 'Ambil bejana NaOH, tuangkan perlahan ke dalam bejana HCl. Amati perubahan suhu dan warna, lalu jawab kuis pemahaman!')..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 focus:border-sky-600 text-xs font-medium text-slate-800 rounded-xl outline-none transition-colors"
                />
              </div>

              {/* Pemilihan Zat Kimia untuk Meja 3D */}
              <div className="space-y-2.5 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
                  <div>
                    <label className="text-xs font-bold text-slate-800 uppercase flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-sky-600" />
                      <span>PILIH ZAT KIMIA UNTUK MEJA SISWA ({selectedChemicalIds.length} Terpilih):</span>
                    </label>
                    <span className="text-[11px] text-slate-500">
                      Klik kartu zat untuk mencentang/menaruh di meja 3D siswa
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={chemicalSearchQuery}
                        onChange={(e) => setChemicalSearchQuery(e.target.value)}
                        placeholder="Cari zat / rumus..."
                        className="pl-8 pr-2.5 py-1 bg-white border border-slate-200 text-xs text-slate-800 rounded-lg outline-none w-36 sm:w-44 focus:border-sky-600"
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
                          ? "bg-sky-600 text-white shadow-xs"
                          : "bg-white text-slate-600 hover:text-slate-900 border border-slate-200"
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
                            ? "bg-sky-50 border-sky-500 ring-1 ring-sky-500 shadow-xs"
                            : "bg-white hover:bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold text-slate-900 font-mono">{chem.formula}</span>
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/10 shadow-xs"
                            style={{ backgroundColor: chem.color }}
                          />
                        </div>
                        <div className="text-[11px] text-slate-600 truncate mt-1">
                          {chem.name}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 mt-2 border-t border-slate-100 pt-1">
                          <span>{chem.level}</span>
                          <span className={`font-bold ${isSelected ? "text-emerald-700" : "text-slate-500"}`}>
                            {isSelected ? "✓ Di Meja" : "+ Tambah"}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Generator Kuis AI & Soal Evaluasi */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <span>Kuis Evaluasi Praktikum ({questions.length} Soal)</span>
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Kuis ini wajib dijawab siswa setelah berhasil mengamati reaksi kimia di meja 3D.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddManualQuestion}
                      className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 transition-colors shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Soal Manual</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGenerateAiQuiz}
                      disabled={isGeneratingAiQuiz}
                      className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white px-3.5 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{isGeneratingAiQuiz ? "Menyusun Soal..." : "Generate Kuis AI"}</span>
                    </button>
                  </div>
                </div>

                {questions.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl bg-white p-4">
                    Belum ada butir kuis. Klik <strong>&quot;Generate Kuis AI&quot;</strong> dari zat kimia yang dipilih atau klik <strong>&quot;+ Soal Manual&quot;</strong>.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {questions.map((q, idx) => (
                      <div key={q.id || idx} className="p-3 bg-white border border-slate-200 rounded-xl text-xs space-y-2 shadow-2xs">
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-bold text-slate-900">
                            {idx + 1}. {q.question}
                          </span>
                          <button
                            type="button"
                            onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-rose-600 hover:underline text-[11px] font-semibold"
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
                                  ? "bg-emerald-50 border-emerald-300 text-emerald-800 font-semibold"
                                  : "bg-slate-50 border-slate-200 text-slate-700"
                              }`}
                            >
                              <span className="font-bold mr-1">{String.fromCharCode(65 + optIdx)}.</span> {opt}{" "}
                              {optIdx === q.correctIndex && "✓ (Kunci)"}
                            </div>
                          ))}
                        </div>

                        <div className="text-[10px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                          <strong className="text-sky-600">Pembahasan:</strong> {q.explanation}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Submit Buttons */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-4 py-2 text-xs font-semibold rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleSaveTask}
                  disabled={isSaving}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 ml-auto shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
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
            <span className="text-xs text-slate-500">
              Menampilkan {tasks.length} tugas praktikum aktif untuk Room <strong>{roomCode}</strong>.
            </span>
            <button
              type="button"
              onClick={() => setActiveSection("create")}
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Tugas Baru</span>
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50 p-6 space-y-3">
              <p>Belum ada tugas praktikum yang diterbitkan di Room PIN {roomCode}.</p>
              <button
                type="button"
                onClick={() => setActiveSection("create")}
                className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 text-xs font-bold rounded-xl shadow-xs transition-colors"
              >
                + Rancang Tugas Praktikum Sekarang
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-2xl p-5 space-y-3 transition-colors flex flex-col justify-between shadow-2xs"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black bg-sky-100 text-sky-800 border border-sky-200 px-2 py-0.5 rounded uppercase">
                        {task.gradeLevel}
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono">Room PIN: {task.roomCode}</span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900">{task.title}</h4>
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                      {task.instructions}
                    </p>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200">
                      <span className="text-emerald-700 font-semibold">
                        🔬 {task.chemicalIds?.length || 0} Reagen 3D
                      </span>
                      <span className="text-amber-700 font-semibold">
                        📝 {task.questions?.length || 0} Butir Kuis
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2">
                    {onPreviewTask && (
                      <button
                        type="button"
                        onClick={() => onPreviewTask(task)}
                        className="flex-1 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Play className="w-3.5 h-3.5" />
                        <span>Uji Coba 3D (Sandbox Guru)</span>
                      </button>
                    )}

                    {onDeleteTask && (
                      <button
                        type="button"
                        onClick={() => onDeleteTask(task.id)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors border border-rose-200"
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
              <h3 className="text-sm font-bold text-slate-900">
                Laporan & Rekap Nilai Kuis Praktikum Siswa
              </h3>
              <p className="text-xs text-slate-500">
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
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoadingSubmissions ? "animate-spin" : ""}`} />
              <span>Segarkan</span>
            </button>
          </div>

          {isLoadingSubmissions ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Memuat rekap nilai siswa...
            </div>
          ) : submissions.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50 p-6 space-y-2">
              <Users className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Belum ada siswa yang mengumpulkan tugas atau menyelesaikan kuis.</p>
              <p className="text-[11px] text-slate-400">
                Hasil pengumpulan kuis siswa akan muncul di tabel ini secara otomatis.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 text-[10px] uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Nama Siswa</th>
                      <th className="px-4 py-3">Reaksi 3D</th>
                      <th className="px-4 py-3">Skor Kuis</th>
                      <th className="px-4 py-3">Analisis Lab</th>
                      <th className="px-4 py-3">Waktu Selesai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {submissions.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-sky-100 text-sky-800 border border-sky-200 flex items-center justify-center font-bold text-[10px]">
                            {sub.studentName?.charAt(0) || "S"}
                          </div>
                          <span>{sub.studentName}</span>
                        </td>
                        <td className="px-4 py-3">
                          {sub.isReactionAchieved ? (
                            <span className="text-emerald-700 font-semibold flex items-center gap-1">
                              ✓ Sukses
                            </span>
                          ) : (
                            <span className="text-amber-700 font-semibold">
                              Proses
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`font-black px-2 py-0.5 rounded text-[11px] ${
                              sub.score >= 80
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : sub.score >= 60
                                ? "bg-amber-50 text-amber-800 border border-amber-200"
                                : "bg-rose-50 text-rose-800 border border-rose-200"
                            }`}
                          >
                            {sub.score}/100
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-xs truncate">
                          {sub.aiAnalysis || "Laporan lengkap"}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-[11px]">
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
