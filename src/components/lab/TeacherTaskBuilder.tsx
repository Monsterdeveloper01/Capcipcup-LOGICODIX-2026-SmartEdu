"use client";

import { useState, useEffect } from "react";
import { CHEMICAL_CATALOG, REACTION_CATALOG } from "@/lib/lab/chemicals-db";
import { LabTask, LabTaskQuestion, LabSubmission } from "@/lib/lab/types";
import StudentSubmissionDetailModal from "./StudentSubmissionDetailModal";
import { ChemicalFormula, FormattedAiMessage } from "./ChemicalFormula";
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
  Eye,
  Pencil,
  X,
  MessageSquare,
  Bot,
  Clock,
  ArrowLeft,
  ChevronRight,
  Filter,
} from "lucide-react";

interface TeacherTaskBuilderProps {
  roomCode?: string;
  teacherName?: string;
  tasks?: LabTask[];
  onTaskCreated?: (task: any) => void;
  onDeleteTask?: (taskId: string) => void;
  onPreviewTask?: (task: LabTask) => void;
  onCancel?: () => void;
  initialSection?: "create" | "list" | "submissions" | "ai_logs";
  onSectionChange?: (section: "create" | "list" | "submissions" | "ai_logs") => void;
  taskToEdit?: LabTask | null;
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
  taskToEdit,
}: TeacherTaskBuilderProps) {
  // Navigation within Teacher Dashboard: "create" | "list" | "submissions" | "ai_logs"
  const [activeSection, setActiveSection] = useState<"create" | "list" | "submissions" | "ai_logs">(initialSection);

  // 2 Creation Modes:
  // "rpp": Guru input RPP/silabus -> AI analisis materi, racik bahan kimia, panduan 3D, dan kuis otomatis
  // "manual": Guru custom mandiri (tentukan sendiri materi, pilih zat dari katalog, buat kuis)
  const [creationMode, setCreationMode] = useState<"rpp" | "manual">("rpp");

  // Editing state for updating existing tasks
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  const switchSection = (s: "create" | "list" | "submissions" | "ai_logs") => {
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
  const [kkmScore, setKkmScore] = useState<number>(75);
  const [allowRetakeBelowKkm, setAllowRetakeBelowKkm] = useState<boolean>(true);
  const [showQuizReviewDetails, setShowQuizReviewDetails] = useState<boolean>(true);
  const [isGeneratingAiQuiz, setIsGeneratingAiQuiz] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successBanner, setSuccessBanner] = useState<string | null>(null);

  // Handle start editing existing task
  const handleStartEdit = (task: LabTask) => {
    setEditingTaskId(task.id);
    setTitle(task.title || "");
    setGradeLevel(((task.gradeLevel || task.level || "SMP") as "SD" | "SMP" | "SMA"));
    setInstructions(task.instructions || "");

    const chemIds = Array.isArray(task.chemicalIds)
      ? task.chemicalIds
      : typeof task.chemicalIds === "string"
      ? JSON.parse(task.chemicalIds)
      : [];
    setSelectedChemicalIds(chemIds);
    setExpectedReactionId(task.expectedReactionId || "");

    const quizList = Array.isArray(task.questions)
      ? task.questions
      : typeof task.questions === "string"
      ? JSON.parse(task.questions)
      : [];
    setQuestions(quizList);
    setKkmScore(task.kkmScore !== undefined && task.kkmScore !== null ? Number(task.kkmScore) : 75);
    setAllowRetakeBelowKkm(task.allowRetakeBelowKkm !== false);
    setShowQuizReviewDetails(task.showQuizReviewDetails !== false);

    setCreationMode("manual");
    switchSection("create");
    setErrorMsg(null);
    setSuccessBanner(null);
  };

  // Handle cancel editing
  const handleCancelEdit = () => {
    setEditingTaskId(null);
    setTitle("");
    setInstructions("");
    setSelectedChemicalIds([]);
    setExpectedReactionId("");
    setQuestions([]);
    setKkmScore(75);
    setAllowRetakeBelowKkm(true);
    setShowQuizReviewDetails(true);
    setRppText("");
    setAiAnalysisSummary(null);
    setErrorMsg(null);
  };

  // Sync external taskToEdit prop
  useEffect(() => {
    if (taskToEdit) {
      handleStartEdit(taskToEdit);
    }
  }, [taskToEdit]);

  // Manual Chemical Catalog Browser Filter
  const [chemicalCategoryFilter, setChemicalCategoryFilter] = useState<string>("ALL");
  const [chemicalSearchQuery, setChemicalSearchQuery] = useState<string>("");

  // Submissions State
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState<boolean>(false);
  const [selectedSubmission, setSelectedSubmission] = useState<LabSubmission | null>(null);

  // Per-task grade recap selection states
  const [selectedSubmissionTaskId, setSelectedSubmissionTaskId] = useState<string | null>(null);
  const [submissionSearchQuery, setSubmissionSearchQuery] = useState<string>("");
  const [submissionFilterStatus, setSubmissionFilterStatus] = useState<"ALL" | "PASSED" | "FAILED" | "REACTION">("ALL");

  // Local synced tasks list
  const [internalTasks, setInternalTasks] = useState<LabTask[]>(tasks || []);
  useEffect(() => {
    if (tasks && tasks.length > 0) {
      setInternalTasks(tasks);
    } else {
      fetch(`/api/lab/tasks?roomCode=${encodeURIComponent(roomCode)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data && data.tasks && Array.isArray(data.tasks)) {
            setInternalTasks(data.tasks);
          }
        })
        .catch(() => {});
    }
  }, [tasks, roomCode]);

  // AI Diagnostic Logs State (Rekap Tanya Jawab Siswa ke Kak Lab-AI)
  const [aiLogs, setAiLogs] = useState<any[]>([]);
  const [aiSummary, setAiSummary] = useState<any | null>(null);
  const [isLoadingAiLogs, setIsLoadingAiLogs] = useState<boolean>(false);
  const [aiLogFilterStudent, setAiLogFilterStudent] = useState<string>("ALL");
  const [aiLogSearchQuery, setAiLogSearchQuery] = useState<string>("");

  const fetchAiLogs = (code = roomCode) => {
    setIsLoadingAiLogs(true);
    fetch(`/api/lab/assistant/logs?roomCode=${encodeURIComponent(code)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.logs) {
          setAiLogs(data.logs);
          setAiSummary(data.summary || null);
        }
      })
      .catch((e) => console.warn("Failed fetching AI logs:", e))
      .finally(() => setIsLoadingAiLogs(false));
  };

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
    } else if (activeSection === "ai_logs") {
      fetchAiLogs();
    }
  }, [activeSection, roomCode]);

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
        body: JSON.stringify({ rppText }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menganalisis dokumen RPP.");

      setTitle(data.title || "Praktikum Sains Baru");
      setGradeLevel(data.gradeLevel || "SMP");
      setInstructions(data.instructions || "");
      setSelectedChemicalIds(data.chemicalIds || data.recommendedChemicalIds || []);
      setExpectedReactionId(data.expectedReactionId || "");
      const incomingQuestions = (data.questions || data.generatedQuestions || []).slice(0, 3);
      setQuestions(incomingQuestions);
      setAiAnalysisSummary(data.analysisSummary || data.summary || "RPP berhasil dianalisis!");
      setSuccessBanner(
        `RPP berhasil dianalisis oleh AI! Praktikum "${data.title || "Sains"}" dan 3 butir soal kuis observasi otomatis dibuat. Silakan periksa, edit, atau tambah soal baru di bawah.`
      );
    } catch (err: any) {
      console.error("AI Analysis error:", err);
      setErrorMsg(err.message || "Gagal menganalisis RPP.");
    } finally {
      setIsAnalyzingRpp(false);
    }
  };

  // Generate AI Quiz for Manual Mode (Tepat 3 Butir Soal)
  const handleGenerateAiQuiz = async () => {
    if (!title.trim() || selectedChemicalIds.length === 0) {
      setErrorMsg("Isi judul tugas dan pilih minimal 1 zat kimia sebelum membuat kuis AI.");
      return;
    }

    setIsGeneratingAiQuiz(true);
    setErrorMsg(null);
    setSuccessBanner(null);

    try {
      const res = await fetch("/api/lab/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          gradeLevel,
          chemicalIds: selectedChemicalIds,
          expectedReactionId,
          instructions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses kuis AI.");

      const incomingQuestions = (data.questions || []).slice(0, 3);
      setQuestions(incomingQuestions);
      setSuccessBanner(
        "3 butir soal kuis observasi sains berhasil dibuat oleh AI! Anda dapat mengedit soal, opsi jawaban, atau menambah soal baru."
      );
    } catch (err: any) {
      console.error("AI Quiz error:", err);
      setErrorMsg(err.message || "Gagal membuat kuis otomatis.");
    } finally {
      setIsGeneratingAiQuiz(false);
    }
  };

  // Add Manual Question (Guru bisa menambahkan lebih dari 3 butir soal)
  const handleAddManualQuestion = () => {
    const nextNum = questions.length + 1;
    const newQ: LabTaskQuestion = {
      id: `q_man_${Date.now()}_${nextNum}`,
      question: `Pertanyaan evaluasi observasi praktikum #${nextNum}...`,
      options: [
        "Pilihan A (Klik radio jika benar)",
        "Pilihan B",
        "Pilihan C",
        "Pilihan D",
      ],
      correctIndex: 0,
      explanation: "Penjelasan ilmiah pendukung jawaban benar...",
    };
    setQuestions((prev) => [...prev, newQ]);
    setSuccessBanner(`Soal No. ${nextNum} berhasil ditambahkan. Silakan isi pertanyaan dan opsi jawabannya.`);
  };

  // Save & Publish Task to Classroom (Supports both CREATE and UPDATE)
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
      const isEditing = Boolean(editingTaskId);
      const url = "/api/lab/tasks";
      const method = isEditing ? "PUT" : "POST";
      const payload: any = {
        title: title.trim(),
        gradeLevel,
        instructions: instructions.trim() || "Lakukan pencampuran zat sesuai panduan praktikum.",
        chemicalIds: selectedChemicalIds,
        expectedReactionId: expectedReactionId || null,
        questions,
        kkmScore,
        allowRetakeBelowKkm,
        showQuizReviewDetails,
      };

      if (isEditing) {
        payload.id = editingTaskId;
      } else {
        payload.roomCode = roomCode;
        payload.teacherName = teacherName;
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan tugas praktikum.");

      if (isEditing) {
        setSuccessBanner(`Perubahan tugas "${title}" berhasil disimpan!`);
        setEditingTaskId(null);
      } else {
        setSuccessBanner(`Tugas "${title}" berhasil diterbitkan ke Room PIN ${roomCode}!`);
      }

      setTitle("");
      setInstructions("");
      setSelectedChemicalIds([]);
      setExpectedReactionId("");
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
          <h2 className="text-lg sm:text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-sky-600" />
            <span>Manajemen Praktikum &amp; Diagnostik Sains</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Rancang panduan praktikum 3D, kelola standar KKM, pantau rekap nilai, dan telusuri log tanya jawab AI siswa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 shadow-2xs">
            <span className="text-xs text-slate-500">Kelas Aktif:</span>
            <span className="text-xs font-black text-emerald-700 tracking-wider">PIN {roomCode}</span>
          </div>
        </div>
      </div>

      {/* Main Tabs: Rancang Tugas | Tugas Diterbitkan | Rekap Nilai | Log Tanya Jawab AI */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-50 rounded-xl border border-slate-200">
        <button
          type="button"
          onClick={() => switchSection("create")}
          className={`flex-1 min-w-[130px] py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors ${
            activeSection === "create"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Rancang Tugas</span>
        </button>

        <button
          type="button"
          onClick={() => switchSection("list")}
          className={`flex-1 min-w-[130px] py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors ${
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
          className={`flex-1 min-w-[130px] py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors ${
            activeSection === "submissions"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <Award className="w-3.5 h-3.5" />
          <span>Rekap Nilai Siswa</span>
        </button>

        <button
          type="button"
          onClick={() => switchSection("ai_logs")}
          className={`flex-1 min-w-[140px] py-2 px-3 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-colors ${
            activeSection === "ai_logs"
              ? "bg-sky-600 text-white shadow-sm"
              : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Log Tanya Jawab AI</span>
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
          {/* Banner Mode Edit Tugas */}
          {editingTaskId && (
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl flex items-center justify-between text-xs text-amber-900 shadow-sm animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <span className="font-black bg-amber-200 text-amber-900 px-2 py-0.5 rounded text-[10px] uppercase border border-amber-300">
                  Mode Edit Tugas
                </span>
                <span>
                  Sedang mengedit tugas praktikum: <strong className="text-amber-950 font-bold">{title || "Tugas"}</strong>
                </span>
              </div>
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-1 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Batal Edit</span>
              </button>
            </div>
          )}

          {/* Mode Switcher: Mode RPP AI vs Mode Custom Mandiri */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Pilih Metode Perancangan Tugas Praktikum:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCreationMode("rpp")}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                  creationMode === "rpp"
                    ? "bg-sky-50/70 border-sky-500 ring-2 ring-sky-500/20 shadow-sm"
                    : "bg-white hover:bg-slate-50 border-slate-200"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Mode Analisis RPP Otomatis (AI)
                    </h4>
                    <span className="text-[9px] font-black bg-sky-100 text-sky-800 border border-sky-300 px-1.5 py-0.2 rounded uppercase">
                      SMART
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Tempel teks RPP kurikulum merdeka Anda. AI otomatis meracik zat kimia, menyusun panduan lab 3D, dan membuat soal kuis observasi.
                  </p>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCreationMode("manual")}
                className={`p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                  creationMode === "manual"
                    ? "bg-sky-50/70 border-sky-500 ring-2 ring-sky-500/20 shadow-sm"
                    : "bg-white hover:bg-slate-50 border-slate-200"
                }`}
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                  <SlidersHorizontal className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Mode Kustom Mandiri (Guru Bebas)
                    </h4>
                    <span className="text-[9px] font-black bg-slate-100 text-slate-700 border border-slate-300 px-1.5 py-0.2 rounded uppercase">
                      MANUAL
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Tentukan sendiri judul, jenjang, pilih reagen bebas dari katalog bahan kimia, serta susun butir kuis sesuai kebutuhan Anda.
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* SUB-FORM A: MODE RPP AI */}
          {creationMode === "rpp" && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Input Dokumen RPP / Modul Ajar Sains
                  </span>
                </div>
                <span className="text-[11px] text-slate-500">
                  Didukung Gemini AI Lab Generator
                </span>
              </div>

              {/* RPP Quick Inspirations */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Contoh Cepat RPP Kurikulum Merdeka (Klik untuk Mengisi):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {RPP_INSPIRATIONS.map((insp, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setRppText(insp.text)}
                      className="px-2.5 py-1 bg-white hover:bg-sky-50 text-slate-700 hover:text-sky-700 border border-slate-200 hover:border-sky-300 text-xs rounded-lg transition-colors font-medium shadow-2xs"
                    >
                      {insp.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* RPP Textarea */}
              <div className="space-y-1.5">
                <textarea
                  value={rppText}
                  onChange={(e) => setRppText(e.target.value)}
                  rows={6}
                  placeholder="Ketik atau tempel tujuan pembelajaran, kompetensi dasar, atau deskripsi RPP praktikum Anda di sini..."
                  className="w-full p-3.5 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-900 placeholder-slate-400 focus:border-sky-500 outline-none leading-relaxed transition-colors shadow-2xs"
                />
              </div>

              {/* Action Analyze RPP Button */}
              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  AI akan otomatis memilih zat kimia yang relevan dari katalog sains.
                </span>

                <button
                  type="button"
                  onClick={handleAnalyzeRpp}
                  disabled={isAnalyzingRpp || !rppText.trim()}
                  className="px-5 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-sm transition-transform hover:scale-[1.02] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{isAnalyzingRpp ? "Menganalisis RPP & Menyusun Lab..." : "Analisis RPP dengan AI"}</span>
                </button>
              </div>

              {/* AI Analysis Summary Preview */}
              {aiAnalysisSummary && (
                <div className="p-3.5 bg-white border border-emerald-200 rounded-xl space-y-1.5 animate-in fade-in">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Hasil Analisis Pedagogis AI:</span>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {aiAnalysisSummary}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* SUB-FORM B: COMMON TASK CONFIGURATION */}
          {(creationMode === "manual" || aiAnalysisSummary) && (
            <div className="space-y-6 pt-2">
              {/* Basic Meta: Judul & Jenjang */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Judul Tugas Praktikum:
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Praktikum Reaksi Asam Basa &amp; Kalor"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 rounded-xl outline-none focus:border-sky-500 focus:bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase">
                    Jenjang Sekolah:
                  </label>
                  <select
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value as any)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 rounded-xl outline-none focus:border-sky-500 focus:bg-white"
                  >
                    <option value="SD">SD (Sekolah Dasar)</option>
                    <option value="SMP">SMP (Sekolah Menengah Pertama)</option>
                    <option value="SMA">SMA (Sekolah Menengah Atas)</option>
                  </select>
                </div>
              </div>

              {/* Instruksi Tugas Praktikum untuk Siswa */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase">
                  Panduan &amp; Instruksi Kerja Siswa di Meja 3D:
                </label>
                <textarea
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  rows={3}
                  placeholder="Instruksi penuangan zat, hal yang perlu diamati di meja 3D, dan cara menguji suhu/warna..."
                  className="w-full p-3 bg-slate-50 border border-slate-200 text-xs text-slate-900 rounded-xl outline-none focus:border-sky-500 focus:bg-white leading-relaxed"
                />
              </div>

              {/* Target Reaksi yang Diharapkan */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
                  <span>Target Reaksi Kimia (Stoikiometri):</span>
                  <span className="text-[10px] text-slate-500 font-normal">
                    Otomatis mencocokkan animasi 3D dan produk reaksi
                  </span>
                </label>
                <select
                  value={expectedReactionId}
                  onChange={(e) => setExpectedReactionId(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 rounded-xl outline-none focus:border-sky-500 focus:bg-white"
                >
                  <option value="">-- Reaksi Eksplorasi Bebas / Otomatis --</option>
                  {REACTION_CATALOG.map((rx) => (
                    <option key={rx.id} value={rx.id}>
                      [{rx.level}] {rx.title} — {rx.equation}
                    </option>
                  ))}
                </select>
              </div>

              {/* Pilihan Bahan Kimia di Meja 3D */}
              <div className="space-y-3 p-4 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Reagen Bahan Kimia di Meja 3D ({selectedChemicalIds.length} Zat Terpilih)
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Zat kimia ini akan otomatis diletakkan di meja lab 3D siswa saat mereka membuka tugas.
                    </span>
                  </div>

                  <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded font-black">
                    AKTIF DI MEJA 3D
                  </span>
                </div>

                {/* Selected Chemicals Pills */}
                {selectedChemicalIds.length === 0 ? (
                  <div className="p-3 bg-white border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-400">
                    Belum ada zat yang dipilih. Pilih bahan dari katalog di bawah.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedChemicalIds.map((id) => {
                      const chem = CHEMICAL_CATALOG.find((c) => c.id === id) || {
                        name: id,
                        formula: id,
                        color: "#38bdf8",
                        level: gradeLevel,
                      };
                      return (
                        <div
                          key={id}
                          className="p-2 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs shadow-2xs"
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span
                              className="w-3 h-3 rounded-full border border-black/10 shrink-0"
                              style={{ backgroundColor: chem.color }}
                            />
                            <div className="truncate">
                              <span className="font-mono font-bold text-slate-900 block">
                                <ChemicalFormula formula={chem.formula} />
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
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Chemical Catalog Browser */}
                <div className="pt-2 space-y-2 border-t border-slate-200">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                      Katalog Bahan Kimia Tersedia (Klik untuk Menambah/Mengurangi):
                    </span>

                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2.5" />
                        <input
                          type="text"
                          value={chemicalSearchQuery}
                          onChange={(e) => setChemicalSearchQuery(e.target.value)}
                          placeholder="Cari zat..."
                          className="pl-7 pr-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs outline-none focus:border-sky-500 w-32 sm:w-40"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-52 overflow-y-auto p-1">
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
                            <span className="text-xs font-bold text-slate-900 font-mono">
                              <ChemicalFormula formula={chem.formula} />
                            </span>
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
                            <span className="font-bold text-sky-700">
                              {isSelected ? "✓ Aktif" : "+ Tambah"}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Butir Soal Kuis Pemahaman Pasca-Praktikum (Hasil AI 3 Soal & Dapat Diedit/Ditambah) */}
              <div className="space-y-3.5 p-4 sm:p-5 bg-slate-50 border border-slate-200 rounded-2xl">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                        Butir Soal Kuis Pemahaman Sains ({questions.length} Soal)
                      </h4>
                      <span className="text-[10px] font-bold bg-sky-100 text-sky-800 border border-sky-300 px-2 py-0.5 rounded">
                        {questions.length === 3 ? "Standard AI (3 Soal)" : `${questions.length} Soal Tersedia`}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 block mt-0.5">
                      AI membuat tepat 3 butir soal dasar. Anda dapat mengedit teks soal, opsi jawaban, pembahasan, atau menambah soal lebih dari 3.
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleGenerateAiQuiz}
                      disabled={isGeneratingAiQuiz}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                      title="Generate ulang 3 soal kuis berbasis AI"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      <span>{isGeneratingAiQuiz ? "Membuat 3 Soal AI..." : "Generate 3 Soal (AI)"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleAddManualQuestion}
                      className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                      title="Tambah butir soal kuis baru"
                    >
                      <Plus className="w-3.5 h-3.5 text-sky-600" />
                      <span>Tambah Soal Baru</span>
                    </button>
                  </div>
                </div>

                {questions.length === 0 ? (
                  <div className="p-6 bg-white border border-dashed border-slate-300 rounded-xl text-center text-xs text-slate-400 space-y-2">
                    <BookOpen className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="font-bold text-slate-700">Belum ada butir soal kuis untuk tugas ini.</p>
                    <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                      Klik <strong>&quot;Generate 3 Soal (AI)&quot;</strong> untuk membuat 3 soal otomatis berbasis AI, atau klik <strong>&quot;Tambah Soal Baru&quot;</strong> untuk menulis soal sendiri.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {questions.map((q, idx) => (
                      <div
                        key={q.id || idx}
                        className="p-4 bg-white border border-slate-200 rounded-xl space-y-3 shadow-2xs transition-shadow hover:shadow-sm"
                      >
                        {/* Header Soal & Hapus */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-lg bg-sky-100 text-sky-800 border border-sky-300 flex items-center justify-center font-black text-xs">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                              Butir Soal #{idx + 1}
                            </span>
                            {idx < 3 && (
                              <span className="text-[9px] font-semibold bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                                AI Core
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== idx))}
                            className="text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                            title="Hapus butir soal ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Hapus</span>
                          </button>
                        </div>

                        {/* Pertanyaan */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Teks Pertanyaan Kuis:
                          </label>
                          <input
                            type="text"
                            value={q.question}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuestions((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, question: val } : item))
                              );
                            }}
                            placeholder="Tuliskan pertanyaan praktikum di sini..."
                            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 outline-none focus:border-sky-500 focus:bg-white transition-colors"
                          />
                        </div>

                        {/* Opsi Pilihan Jawaban (A, B, C, D) */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                            <span>Pilihan Jawaban (Pilih Radio untuk Menentukan Kunci Jawaban Benar):</span>
                            <span className="text-emerald-700 lowercase font-medium">● radio hijau = kunci jawaban</span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                            {q.options.map((opt, optIdx) => {
                              const isCorrect = q.correctIndex === optIdx;
                              const optLetter = ["A", "B", "C", "D"][optIdx] || String(optIdx + 1);

                              return (
                                <div
                                  key={optIdx}
                                  className={`p-2.5 rounded-xl border text-xs flex items-center gap-2.5 transition-colors ${
                                    isCorrect
                                      ? "bg-emerald-50/80 border-emerald-300 text-emerald-950 font-semibold ring-1 ring-emerald-400"
                                      : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100/60"
                                  }`}
                                >
                                  {/* Radio Kunci Jawaban */}
                                  <input
                                    type="radio"
                                    name={`correct_${idx}`}
                                    checked={isCorrect}
                                    onChange={() => {
                                      setQuestions((prev) =>
                                        prev.map((item, i) =>
                                          i === idx ? { ...item, correctIndex: optIdx } : item
                                        )
                                      );
                                    }}
                                    className="accent-emerald-600 cursor-pointer w-4 h-4 shrink-0"
                                    title={`Tandai opsi ${optLetter} sebagai jawaban benar`}
                                  />

                                  {/* Huruf Opsi A/B/C/D */}
                                  <span
                                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-black shrink-0 ${
                                      isCorrect
                                        ? "bg-emerald-600 text-white shadow-2xs"
                                        : "bg-slate-200 text-slate-700"
                                    }`}
                                  >
                                    {optLetter}
                                  </span>

                                  {/* Input Teks Pilihan Jawaban */}
                                  <input
                                    type="text"
                                    value={opt}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setQuestions((prev) =>
                                        prev.map((item, i) =>
                                          i === idx
                                            ? {
                                                ...item,
                                                options: item.options.map((o, oi) =>
                                                  oi === optIdx ? val : o
                                                ) as [string, string, string, string],
                                              }
                                            : item
                                        )
                                      );
                                    }}
                                    placeholder={`Pilihan ${optLetter}...`}
                                    className="w-full bg-transparent outline-none text-xs text-slate-900 font-medium"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Penjelasan Jawaban Ilmiah */}
                        <div className="space-y-1 pt-1.5 border-t border-slate-100">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Pembahasan &amp; Penjelasan Sains Ilmiah (Muncul saat Siswa Selesai Kuis):
                          </label>
                          <input
                            type="text"
                            value={q.explanation || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              setQuestions((prev) =>
                                prev.map((item, i) => (i === idx ? { ...item, explanation: val } : item))
                              );
                            }}
                            placeholder="Alasan ilmiah mengapa kunci jawaban di atas benar..."
                            className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 outline-none focus:border-sky-500 focus:bg-white transition-colors"
                          />
                        </div>
                      </div>
                    ))}

                    {/* Bottom Action: Tambah Butir Soal Lebih dari 3 */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-200/80 bg-white p-3 rounded-xl border border-slate-200 shadow-2xs">
                      <div className="text-xs text-slate-600">
                        Total: <strong>{questions.length} Butir Soal</strong>{" "}
                        <span className="text-[11px] text-slate-400">
                          (Guru bebas menambah lebih dari 3 soal sesuai silabus kelas)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={handleAddManualQuestion}
                        className="px-4 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-300 text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Tambah Butir Soal Baru (#{questions.length + 1})</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Pengaturan KKM & Kebijakan Pengulangan Praktikum */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="w-4 h-4 text-sky-600" />
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                      Pengaturan KKM &amp; Kebijakan Remedial / Pengulangan Siswa
                    </h4>
                  </div>
                  <span className="text-[10px] bg-sky-100 text-sky-800 border border-sky-200 px-2 py-0.5 rounded font-black">
                    STANDAR KELULUSAN
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start pt-1">
                  {/* Input KKM */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase flex items-center justify-between">
                      <span>Batas Nilai KKM:</span>
                      <span className="text-sky-600 font-mono font-black text-sm">{kkmScore} / 100</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min="50"
                        max="95"
                        step="5"
                        value={kkmScore}
                        onChange={(e) => setKkmScore(Number(e.target.value))}
                        className="w-full accent-sky-600 cursor-pointer"
                      />
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={kkmScore}
                        onChange={(e) => setKkmScore(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                        className="w-16 p-1.5 bg-white border border-slate-200 text-xs font-bold text-center text-slate-900 rounded-lg outline-none focus:border-sky-600"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Siswa yang memperoleh skor kuis ≥ <strong>{kkmScore}</strong> dinyatakan <strong>Tuntas (Lulus)</strong> dan eksperimennya otomatis selesai secara permanen.
                    </p>
                  </div>

                  {/* Toggle Retake Below KKM */}
                  <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={allowRetakeBelowKkm}
                        onChange={(e) => setAllowRetakeBelowKkm(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                      />
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-900 block">
                          Izinkan Siswa Mengulang jika Nilai &lt; KKM
                        </span>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {allowRetakeBelowKkm ? (
                            <span className="text-emerald-700 font-semibold block">
                              ✓ Diizinkan: Siswa yang nilainya di bawah {kkmScore} boleh mereset meja 3D dan mengulangi praktikum serta kuis sampai tuntas.
                            </span>
                          ) : (
                            <span className="text-rose-700 font-semibold block">
                              ✕ Dilarang: Semua tombol ulangi praktikum dan pengerjaan kuis ulang akan dihapus total dari layar siswa jika nilainya di bawah KKM.
                            </span>
                          )}
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* Toggle Mode Review Kuis (View Review Kunci & Pembahasan) */}
                  <div className="space-y-1.5 bg-white p-3 rounded-xl border border-slate-200">
                    <label className="flex items-start gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={showQuizReviewDetails}
                        onChange={(e) => setShowQuizReviewDetails(e.target.checked)}
                        className="mt-0.5 w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 cursor-pointer"
                      />
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">
                            Mode Review Kuis Siswa: Kunci Jawaban &amp; Pembahasan
                          </span>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.2 rounded border ${
                              showQuizReviewDetails
                                ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                : "bg-amber-100 text-amber-800 border-amber-300"
                            }`}
                          >
                            {showQuizReviewDetails ? "ON (Detail)" : "OFF (Ringkas)"}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-600 leading-relaxed">
                          {showQuizReviewDetails ? (
                            <span className="text-emerald-700 font-semibold block">
                              ✓ Mode Aktif (ON): Setelah mengumpulkan kuis, siswa dapat melihat butir soal mana yang benar/salah, kunci jawaban yang benar, serta penjelasan ilmiah lengkap.
                            </span>
                          ) : (
                            <span className="text-amber-700 font-semibold block">
                              🔒 Mode Nonaktif (OFF): Siswa hanya diberitahu jawaban yang mereka pilih benar atau salah, tanpa menampilkan kunci jawaban yang benar dan tanpa penjelasan ilmiah (mencegah sontekan evaluasi).
                            </span>
                          )}
                        </p>
                      </div>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Submit Buttons */}
              <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                {editingTaskId ? (
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-4 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Batal Edit
                  </button>
                ) : onCancel ? (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-4 py-2 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                  >
                    Batal
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  onClick={handleSaveTask}
                  disabled={isSaving}
                  className={`text-white px-6 py-2.5 text-xs sm:text-sm font-bold rounded-xl flex items-center gap-2 ml-auto shadow-sm transition-colors disabled:opacity-50 cursor-pointer ${
                    editingTaskId
                      ? "bg-sky-600 hover:bg-sky-700"
                      : "bg-emerald-600 hover:bg-emerald-700"
                  }`}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    {isSaving
                      ? (editingTaskId ? "Menyimpan Perubahan..." : "Menerbitkan Tugas...")
                      : (editingTaskId ? "Simpan Perubahan Tugas" : `Terbitkan Tugas ke Siswa (PIN ${roomCode})`)}
                  </span>
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
              className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Rancang Tugas Baru</span>
            </button>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50 p-6 space-y-2">
              <ClipboardList className="w-8 h-8 text-slate-300 mx-auto" />
              <p>Belum ada tugas praktikum yang diterbitkan di kelas ini.</p>
              <p className="text-[11px] text-slate-400">
                Gunakan tab <strong>&quot;Rancang Tugas&quot;</strong> di atas untuk membuat tugas lab baru.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-5 bg-white border border-slate-200 hover:border-sky-300 rounded-2xl space-y-3 transition-colors flex flex-col justify-between shadow-2xs"
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

                    <div className="flex items-center justify-between text-[11px] pt-1 flex-wrap gap-1">
                      <span className="font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                        KKM: {task.kkmScore ?? 75}
                      </span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded border text-[10px] ${
                          task.allowRetakeBelowKkm !== false
                            ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                            : "bg-rose-50 text-rose-800 border-rose-200"
                        }`}
                      >
                        {task.allowRetakeBelowKkm !== false ? "✓ Remedial Diizinkan" : "✕ Sekali Selesai"}
                      </span>
                      <span
                        className={`font-semibold px-2 py-0.5 rounded border text-[10px] ${
                          task.showQuizReviewDetails !== false
                            ? "bg-sky-50 text-sky-800 border-sky-200"
                            : "bg-amber-50 text-amber-800 border-amber-200"
                        }`}
                        title={
                          task.showQuizReviewDetails !== false
                            ? "Siswa melihat kunci jawaban & pembahasan"
                            : "Kunci jawaban & pembahasan disembunyikan dari siswa"
                        }
                      >
                        {task.showQuizReviewDetails !== false ? "👁️ Review: Detail" : "🔒 Review: Ringkas"}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 flex-wrap sm:flex-nowrap">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(task)}
                      className="px-3 py-2 bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-bold rounded-xl transition-colors border border-sky-200 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      title="Edit Tugas Praktikum"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>Edit Tugas</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSubmissionTaskId(task.id);
                        switchSection("submissions");
                      }}
                      className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-colors border border-emerald-200 flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      title="Buka Rekap Nilai Siswa untuk Tugas Ini"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Rekap Nilai</span>
                    </button>

                    {onPreviewTask && (
                      <button
                        type="button"
                        onClick={() => onPreviewTask(task)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition-colors border border-slate-200 flex items-center justify-center gap-1.5 cursor-pointer min-w-[140px]"
                      >
                        <Play className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Uji Coba 3D</span>
                      </button>
                    )}

                    {onDeleteTask && (
                      <button
                        type="button"
                        onClick={() => onDeleteTask(task.id)}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors border border-rose-200 cursor-pointer"
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
          SECTION 3: REKAP NILAI SISWA (PER TUGAS)
          ========================================================================= */}
      {activeSection === "submissions" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* VIEW A: JIKA BELUM MEMILIH TUGAS (PILIH TUGAS TERLEBIH DAHULU) */}
          {!selectedSubmissionTaskId ? (
            <div className="space-y-4">
              {/* Header Pilihan Tugas */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase bg-sky-100 text-sky-800 border border-sky-300 px-2 py-0.5 rounded">
                      REKAP NILAI PER TUGAS
                    </span>
                    <span className="text-xs text-slate-500 font-mono">Room PIN: {roomCode}</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
                    <Award className="w-4 h-4 text-sky-600" />
                    <span>Pilih Tugas Praktikum untuk Melihat Rekap Nilai Siswa</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Silakan pilih salah satu tugas praktikum di bawah ini untuk melihat daftar nilai siswa, analisis penguasaan materi, dan diagnostik evaluasi AI per tugas.
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
                  className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isLoadingSubmissions ? "animate-spin" : ""}`} />
                  <span>Segarkan Data</span>
                </button>
              </div>

              {/* Daftar Kartu Tugas Praktikum */}
              {internalTasks.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50 p-6 space-y-3">
                  <BookOpen className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="font-bold text-slate-700 text-sm">Belum Ada Tugas Praktikum Diterbitkan</p>
                  <p className="text-slate-500 max-w-md mx-auto">
                    Buat dan terbitkan tugas praktikum terlebih dahulu agar siswa dapat melakukan percobaan dan mengisi kuis evaluasi.
                  </p>
                  <button
                    type="button"
                    onClick={() => switchSection("create")}
                    className="mt-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-colors shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Rancang Tugas Baru Sekarang</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {internalTasks.map((t) => {
                    const taskSubs = submissions.filter(
                      (s) =>
                        String(s.taskId) === String(t.id) ||
                        (t.roomCode && String(s.roomCode) === String(t.roomCode))
                    );
                    const kkm = t.kkmScore ?? 75;
                    const avgScore =
                      taskSubs.length > 0
                        ? Math.round(
                            taskSubs.reduce((acc, s) => acc + (Number(s.score) || 0), 0) / taskSubs.length
                          )
                        : 0;
                    const passCount = taskSubs.filter((s) => (Number(s.score) || 0) >= kkm).length;
                    const passRate =
                      taskSubs.length > 0 ? Math.round((passCount / taskSubs.length) * 100) : 0;

                    return (
                      <div
                        key={t.id}
                        className="bg-white border border-slate-200 hover:border-sky-300 rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-2xs hover:shadow-md transition-all group"
                      >
                        <div className="space-y-3">
                          {/* Card Meta Badges */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                                  (t.gradeLevel || t.level) === "SD"
                                    ? "bg-sky-50 text-sky-800 border-sky-200"
                                    : (t.gradeLevel || t.level) === "SMP"
                                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                    : "bg-purple-50 text-purple-800 border-purple-200"
                                }`}
                              >
                                {t.gradeLevel || t.level || "SMP"}
                              </span>
                              <span className="text-[10px] font-mono font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                                PIN {t.roomCode}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                              KKM: {kkm}
                            </span>
                          </div>

                          {/* Task Title & Info */}
                          <div>
                            <h4 className="font-extrabold text-sm text-slate-900 group-hover:text-sky-700 transition-colors line-clamp-2">
                              {t.title}
                            </h4>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                              {t.instructions || "Praktikum interaktif meja lab sains 3D."}
                            </p>
                          </div>

                          {/* Quick Stats Grid */}
                          <div className="grid grid-cols-3 gap-2 py-2 bg-slate-50 border border-slate-100 rounded-xl px-2.5 text-center">
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                                Siswa
                              </span>
                              <span className="text-xs font-black text-slate-800">
                                {taskSubs.length}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                                Rata-Rata
                              </span>
                              <span
                                className={`text-xs font-black ${
                                  avgScore >= kkm
                                    ? "text-emerald-700"
                                    : avgScore > 0
                                    ? "text-amber-700"
                                    : "text-slate-400"
                                }`}
                              >
                                {taskSubs.length > 0 ? `${avgScore}` : "-"}
                              </span>
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                                Lulus KKM
                              </span>
                              <span
                                className={`text-xs font-black ${
                                  passRate >= 75
                                    ? "text-emerald-700"
                                    : passRate > 0
                                    ? "text-amber-700"
                                    : "text-slate-400"
                                }`}
                              >
                                {taskSubs.length > 0 ? `${passRate}%` : "-"}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* CTA Button to Open Task Grades */}
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSubmissionTaskId(t.id);
                            setSubmissionSearchQuery("");
                            setSubmissionFilterStatus("ALL");
                          }}
                          className="mt-4 w-full py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Award className="w-4 h-4 text-amber-300" />
                          <span>Buka Rekap Nilai Tugas Ini</span>
                          <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* VIEW B: DETAIL REKAP NILAI SISWA PER TUGAS YANG TELAH DIPILIH */
            (() => {
              const selectedTask =
                internalTasks.find((t) => String(t.id) === String(selectedSubmissionTaskId)) ||
                tasks?.find((t) => String(t.id) === String(selectedSubmissionTaskId));

              const currentTaskSubs = submissions.filter(
                (s) =>
                  String(s.taskId) === String(selectedSubmissionTaskId) ||
                  (selectedTask?.roomCode && String(s.roomCode) === String(selectedTask.roomCode))
              );

              const kkm = selectedTask?.kkmScore ?? 75;
              const totalSubs = currentTaskSubs.length;
              const avgScore =
                totalSubs > 0
                  ? Math.round(
                      currentTaskSubs.reduce((acc, s) => acc + (Number(s.score) || 0), 0) / totalSubs
                    )
                  : 0;
              const passSubs = currentTaskSubs.filter((s) => (Number(s.score) || 0) >= kkm);
              const failSubs = currentTaskSubs.filter((s) => (Number(s.score) || 0) < kkm);
              const passRate = totalSubs > 0 ? Math.round((passSubs.length / totalSubs) * 100) : 0;
              const reactionAchievedSubs = currentTaskSubs.filter((s) => s.isReactionAchieved);

              // Filtered list based on search and status
              const displayedSubmissions = currentTaskSubs.filter((s) => {
                if (submissionSearchQuery.trim()) {
                  const q = submissionSearchQuery.toLowerCase();
                  if (!s.studentName?.toLowerCase().includes(q)) return false;
                }
                if (submissionFilterStatus === "PASSED") return (Number(s.score) || 0) >= kkm;
                if (submissionFilterStatus === "FAILED") return (Number(s.score) || 0) < kkm;
                if (submissionFilterStatus === "REACTION") return Boolean(s.isReactionAchieved);
                return true;
              });

              return (
                <div className="space-y-4">
                  {/* Top Navigation & Task Switcher Bar */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedSubmissionTaskId(null);
                          setSubmissionSearchQuery("");
                          setSubmissionFilterStatus("ALL");
                        }}
                        className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" />
                        <span>Kembali ke Pilihan Tugas</span>
                      </button>

                      {/* Dropdown Quick Switcher */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-500 font-semibold hidden sm:inline">
                          Pilih Tugas Lain:
                        </span>
                        <select
                          value={selectedSubmissionTaskId}
                          onChange={(e) => {
                            setSelectedSubmissionTaskId(e.target.value);
                            setSubmissionSearchQuery("");
                            setSubmissionFilterStatus("ALL");
                          }}
                          className="text-xs font-bold bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-slate-800 outline-none focus:border-sky-500 shadow-2xs cursor-pointer max-w-xs truncate"
                        >
                          {internalTasks.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.title} (PIN {t.roomCode})
                            </option>
                          ))}
                        </select>

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
                          className="p-1.5 bg-white hover:bg-slate-100 text-slate-700 text-xs rounded-xl border border-slate-200 transition-colors shadow-2xs cursor-pointer"
                          title="Segarkan data pengumpulan"
                        >
                          <RotateCcw
                            className={`w-4 h-4 ${isLoadingSubmissions ? "animate-spin" : ""}`}
                          />
                        </button>
                      </div>
                    </div>

                    {/* Selected Task Overview Banner */}
                    <div className="pt-2 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase bg-sky-100 text-sky-800 border border-sky-300 px-2 py-0.5 rounded font-mono">
                            PIN {selectedTask?.roomCode || roomCode}
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                              (selectedTask?.gradeLevel || selectedTask?.level) === "SD"
                                ? "bg-sky-50 text-sky-800 border-sky-200"
                                : (selectedTask?.gradeLevel || selectedTask?.level) === "SMP"
                                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                : "bg-purple-50 text-purple-800 border-purple-200"
                            }`}
                          >
                            Jenjang {selectedTask?.gradeLevel || selectedTask?.level || "SMP"}
                          </span>
                          <span className="text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded">
                            Batas KKM: {kkm}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-extrabold text-slate-900 mt-1">
                          {selectedTask?.title || "Tugas Praktikum"}
                        </h3>
                        {selectedTask?.instructions && (
                          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
                            {selectedTask.instructions}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 4 KPI Summary Cards for Selected Task */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Card 1: Total Pengumpulan */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
                      <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 border border-sky-200 flex items-center justify-center font-bold shrink-0">
                        <Users className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Total Siswa
                        </span>
                        <span className="text-lg font-black text-slate-900">{totalSubs}</span>
                        <span className="text-[10px] text-slate-500 block">Mengumpulkan kuis</span>
                      </div>
                    </div>

                    {/* Card 2: Rata-Rata Nilai */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
                      <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold shrink-0">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Rata-Rata Nilai
                        </span>
                        <span
                          className={`text-lg font-black ${
                            avgScore >= kkm
                              ? "text-emerald-700"
                              : avgScore > 0
                              ? "text-amber-700"
                              : "text-slate-400"
                          }`}
                        >
                          {totalSubs > 0 ? `${avgScore}/100` : "-"}
                        </span>
                        <span className="text-[10px] text-slate-500 block">Skor kuis praktikum</span>
                      </div>
                    </div>

                    {/* Card 3: Kelulusan KKM */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
                      <div
                        className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold shrink-0 ${
                          passRate >= 75
                            ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                            : "bg-amber-100 text-amber-700 border-amber-200"
                        }`}
                      >
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Kelulusan KKM
                        </span>
                        <span className="text-lg font-black text-slate-900">
                          {totalSubs > 0 ? `${passRate}%` : "-"}
                        </span>
                        <span className="text-[10px] text-slate-500 block">
                          {passSubs.length} dari {totalSubs} Siswa
                        </span>
                      </div>
                    </div>

                    {/* Card 4: Target Reaksi 3D */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-3.5 flex items-center gap-3 shadow-2xs">
                      <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center font-bold shrink-0">
                        <FlaskConical className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Target Reaksi 3D
                        </span>
                        <span className="text-lg font-black text-slate-900">
                          {reactionAchievedSubs.length}
                        </span>
                        <span className="text-[10px] text-slate-500 block">Berhasil di meja lab</span>
                      </div>
                    </div>
                  </div>

                  {/* Filter & Search Controls */}
                  <div className="bg-white border border-slate-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                    <div className="relative flex-1 min-w-[200px] max-w-sm">
                      <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Cari nama siswa..."
                        value={submissionSearchQuery}
                        onChange={(e) => setSubmissionSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-sky-500 focus:bg-white"
                      />
                    </div>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        onClick={() => setSubmissionFilterStatus("ALL")}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          submissionFilterStatus === "ALL"
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                        }`}
                      >
                        Semua ({totalSubs})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubmissionFilterStatus("PASSED")}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          submissionFilterStatus === "PASSED"
                            ? "bg-emerald-600 text-white"
                            : "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200"
                        }`}
                      >
                        ✓ Tuntas KKM ({passSubs.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubmissionFilterStatus("FAILED")}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          submissionFilterStatus === "FAILED"
                            ? "bg-rose-600 text-white"
                            : "bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200"
                        }`}
                      >
                        ✕ Belum Tuntas ({failSubs.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => setSubmissionFilterStatus("REACTION")}
                        className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                          submissionFilterStatus === "REACTION"
                            ? "bg-sky-600 text-white"
                            : "bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200"
                        }`}
                      >
                        ⚗️ Reaksi Sukses ({reactionAchievedSubs.length})
                      </button>
                    </div>
                  </div>

                  {/* Submissions Table */}
                  {isLoadingSubmissions ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Memuat rekap nilai siswa tugas ini...
                    </div>
                  ) : totalSubs === 0 ? (
                    <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50 p-6 space-y-2">
                      <Users className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-bold text-slate-700">Belum Ada Siswa Mengumpulkan Tugas Ini</p>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Siswa belum menyelesaikan praktikum dan kuis untuk tugas ini. Bagikan PIN{" "}
                        <strong className="text-sky-700 font-mono">{selectedTask?.roomCode}</strong>{" "}
                        kepada siswa untuk mulai mengerjakan.
                      </p>
                    </div>
                  ) : displayedSubmissions.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50 p-4">
                      Tidak ditemukan siswa yang cocok dengan filter atau kata kunci pencarian.
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
                              <th className="px-4 py-3">Status KKM ({kkm})</th>
                              <th className="px-4 py-3">Analisis Lab AI</th>
                              <th className="px-4 py-3">Waktu Selesai</th>
                              <th className="px-4 py-3 text-right">Detail</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {displayedSubmissions.map((sub) => {
                              const isSubPassed = (Number(sub.score) || 0) >= kkm;
                              return (
                                <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                                  <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                                    <div className="w-7 h-7 rounded-full bg-sky-100 text-sky-800 border border-sky-200 flex items-center justify-center font-bold text-xs">
                                      {sub.studentName?.charAt(0) || "S"}
                                    </div>
                                    <span>{sub.studentName}</span>
                                  </td>
                                  <td className="px-4 py-3">
                                    {sub.isReactionAchieved ? (
                                      <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                        ✓ Sukses Target
                                      </span>
                                    ) : (
                                      <span className="text-amber-700 font-semibold">
                                        Proses Eksplorasi
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`font-black px-2.5 py-0.5 rounded text-[11px] border ${
                                        sub.score >= 80
                                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                          : sub.score >= 60
                                          ? "bg-amber-50 text-amber-800 border-amber-200"
                                          : "bg-rose-50 text-rose-800 border-rose-200"
                                      }`}
                                    >
                                      {sub.score}/100
                                    </span>
                                  </td>
                                  <td className="px-4 py-3">
                                    <span
                                      className={`text-[10px] font-bold px-2 py-0.5 rounded border inline-block ${
                                        isSubPassed
                                          ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                          : "bg-rose-50 text-rose-800 border-rose-200"
                                      }`}
                                    >
                                      {isSubPassed ? "✓ Tuntas KKM" : "✕ Belum Tuntas"}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 text-slate-600 max-w-xs truncate text-[11px]">
                                    {sub.aiAnalysis || "Laporan lengkap praktikum"}
                                  </td>
                                  <td className="px-4 py-3 text-slate-400 text-[11px]">
                                    {sub.completedAt
                                      ? new Date(sub.completedAt).toLocaleString("id-ID", {
                                          day: "numeric",
                                          month: "short",
                                          hour: "2-digit",
                                          minute: "2-digit",
                                        })
                                      : "-"}
                                  </td>
                                  <td className="px-4 py-3 text-right">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedSubmission(sub)}
                                      className="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                                      title="Buka rincian percobaan dan kuis murid"
                                    >
                                      <Eye className="w-3.5 h-3.5" />
                                      <span>Lihat Detail</span>
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })()
          )}
        </div>
      )}

      {/* =========================================================================
          SECTION 4: REKAP TANYA JAWAB SISWA KE KAK LAB-AI (TEACHER DIAGNOSTIC LOG)
          ========================================================================= */}
      {activeSection === "ai_logs" && (
        <div className="space-y-5 animate-in fade-in duration-150">
          {/* Header & Refresh */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase bg-sky-100 text-sky-800 border border-sky-300 px-2 py-0.5 rounded">
                  DIAGNOSTIK PEDAGOGIS KELAS
                </span>
                <span className="text-xs text-slate-500 font-mono">Room PIN: {roomCode}</span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 mt-1 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-600" />
                <span>Rekap Tanya Jawab Siswa ke Kak Lab-AI</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pantau pertanyaan dan kebingungan konsep sains yang diajukan murid ke asisten AI selama praktikum di Meja 3D.
              </p>
            </div>

            <button
              type="button"
              onClick={() => fetchAiLogs()}
              disabled={isLoadingAiLogs}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 border border-slate-200 rounded-xl flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
            >
              <RotateCcw className={`w-3.5 h-3.5 ${isLoadingAiLogs ? "animate-spin" : ""}`} />
              <span>Segarkan Log</span>
            </button>
          </div>

          {/* Diagnostic KPI Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Card 1: Total Pertanyaan */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 border border-sky-200 flex items-center justify-center font-bold shrink-0">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Total Konsultasi AI
                </span>
                <span className="text-lg font-black text-slate-900">
                  {aiSummary?.totalConsultations ?? aiLogs.length}
                </span>
                <span className="text-[10px] text-slate-500 block">Pertanyaan diajukan murid</span>
              </div>
            </div>

            {/* Card 2: Siswa yang Bertanya */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Siswa yang Bertanya
                </span>
                <span className="text-lg font-black text-slate-900">
                  {aiSummary?.uniqueStudentsCount ?? 0}
                </span>
                <span className="text-[10px] text-slate-500 block">Murid berkonsultasi</span>
              </div>
            </div>

            {/* Card 3: Topik Teratas */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-3 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center font-bold shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="truncate">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Topik Paling Banyak Ditanyakan
                </span>
                <div className="truncate text-xs font-extrabold text-slate-900 mt-0.5">
                  {aiSummary?.topicBreakdown && Object.entries(aiSummary.topicBreakdown).length > 0
                    ? Object.entries(aiSummary.topicBreakdown).sort((a: any, b: any) => b[1] - a[1])[0]?.[0] || "Konsep Kimia Umum"
                    : "Belum Ada Data"}
                </div>
                <span className="text-[10px] text-slate-500 block">Fokus materi sains kelas</span>
              </div>
            </div>
          </div>

          {/* Breakdown Topik Pertanyaan (Topic Badges) */}
          {aiSummary?.topicBreakdown && Object.keys(aiSummary.topicBreakdown).length > 0 && (
            <div className="p-3 bg-white border border-slate-200 rounded-xl space-y-1.5 shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Distribusi Topik Pertanyaan Siswa:
              </span>
              <div className="flex flex-wrap gap-2">
                {Object.entries(aiSummary.topicBreakdown).map(([topic, count]: any) => (
                  <span
                    key={topic}
                    className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 flex items-center gap-1.5"
                  >
                    <span>{topic}</span>
                    <span className="text-[10px] font-black bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded font-mono">
                      {count}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Filter & Search Controls */}
          <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
            {/* Filter by Student */}
            <div className="flex items-center gap-1.5 flex-1 min-w-[200px]">
              <span className="text-xs font-bold text-slate-600 shrink-0">Siswa:</span>
              <select
                value={aiLogFilterStudent}
                onChange={(e) => setAiLogFilterStudent(e.target.value)}
                className="w-full p-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 outline-none focus:border-sky-500"
              >
                <option value="ALL">Semua Siswa ({aiLogs.length} pertanyaan)</option>
                {aiSummary?.uniqueStudents?.map((name: string) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Query */}
            <div className="flex items-center gap-2 flex-1 min-w-[240px] bg-white border border-slate-200 rounded-lg px-2.5 py-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                value={aiLogSearchQuery}
                onChange={(e) => setAiLogSearchQuery(e.target.value)}
                placeholder="Cari pertanyaan siswa atau zat kimia..."
                className="w-full text-xs text-slate-800 placeholder-slate-400 outline-none bg-transparent"
              />
              {aiLogSearchQuery && (
                <button
                  type="button"
                  onClick={() => setAiLogSearchQuery("")}
                  className="text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Logs List */}
          {isLoadingAiLogs ? (
            <div className="text-center py-12 text-slate-500 text-xs space-y-2">
              <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p>Memuat rekap pertanyaan siswa ke Kak Lab-AI...</p>
            </div>
          ) : aiLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs border border-dashed border-slate-200 rounded-2xl bg-slate-50 p-8 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-center mx-auto text-sky-600">
                <Bot className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="font-bold text-sm text-slate-800">Belum Ada Riwayat Tanya Jawab AI</p>
                <p className="text-[11px] text-slate-500 max-w-md mx-auto">
                  Pertanyaan yang diajukan siswa ke Kak Lab-AI selama berpraktikum di Room PIN <strong>{roomCode}</strong> akan otomatis tercatat di halaman diagnostik ini.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {aiLogs
                .filter((log) => {
                  if (aiLogFilterStudent !== "ALL" && log.studentName !== aiLogFilterStudent) {
                    return false;
                  }
                  if (aiLogSearchQuery.trim()) {
                    const q = aiLogSearchQuery.toLowerCase();
                    const matchQ = log.question?.toLowerCase().includes(q);
                    const matchA = log.answer?.toLowerCase().includes(q);
                    const matchName = log.studentName?.toLowerCase().includes(q);
                    const matchTask = log.taskTitle?.toLowerCase().includes(q);
                    if (!matchQ && !matchA && !matchName && !matchTask) return false;
                  }
                  return true;
                })
                .map((log) => (
                  <div
                    key={log.id}
                    className="p-4 bg-white border border-slate-200 hover:border-sky-300 rounded-2xl space-y-3 shadow-xs transition-colors"
                  >
                    {/* Log Meta Header */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-sky-100 text-sky-800 border border-sky-200 flex items-center justify-center font-bold text-xs shrink-0">
                          {log.studentName?.charAt(0) || "S"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900">{log.studentName}</span>
                            <span className="text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.2 rounded font-mono">
                              PIN {log.roomCode || roomCode}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-medium">
                            Tugas: <strong>{log.taskTitle || "Praktikum Sains"}</strong>
                          </span>
                        </div>
                      </div>

                      <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleString("id-ID", {
                              day: "numeric",
                              month: "short",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </span>
                    </div>

                    {/* Reagen yang ada di Meja 3D saat bertanya */}
                    {log.activeChemicals && log.activeChemicals.length > 0 && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-500 flex-wrap">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 shrink-0">
                          Zat di Meja 3D:
                        </span>
                        {log.activeChemicals.map((chemStr: string, cIdx: number) => (
                          <span
                            key={cIdx}
                            className="px-2 py-0.5 bg-slate-50 border border-slate-200 rounded-md text-[10px] font-mono text-slate-800 font-semibold"
                          >
                            <ChemicalFormula formula={chemStr} />
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Pertanyaan Siswa */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        <span>👤 Pertanyaan Murid:</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900 leading-relaxed">
                        &quot;{log.question}&quot;
                      </p>
                    </div>

                    {/* Jawaban Kak Lab-AI */}
                    <div className="p-3 bg-sky-50/60 border border-sky-200/80 rounded-xl space-y-1.5">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-sky-800 border-b border-sky-100 pb-1">
                        <Bot className="w-3.5 h-3.5 text-sky-600" />
                        <span>Jawaban Kak Lab-AI:</span>
                      </div>
                      <div className="pt-0.5">
                        <FormattedAiMessage text={log.answer} />
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Detail Praktikum Siswa */}
      <StudentSubmissionDetailModal
        submission={selectedSubmission}
        task={
          tasks?.find((t) => String(t.id) === String(selectedSubmission?.taskId)) ||
          internalTasks.find((t) => String(t.id) === String(selectedSubmission?.taskId)) ||
          (selectedSubmissionTaskId
            ? internalTasks.find((t) => String(t.id) === String(selectedSubmissionTaskId))
            : null)
        }
        onClose={() => setSelectedSubmission(null)}
      />
    </div>
  );
}
