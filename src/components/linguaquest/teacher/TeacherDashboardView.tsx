"use client";

import { useState, useEffect } from "react";
import { QuestScenario, SpeakingEvaluation, ClassMisconceptionItem } from "@/lib/linguaquest/types";
import {
  GraduationCap,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  BookOpen,
  Copy,
  Monitor,
  Download,
  Plus,
  Trash2,
  Eye,
  Key,
  Users,
  Check,
  X,
  ArrowRight,
  ShieldAlert,
  Pencil,
} from "lucide-react";

interface TeacherRoomItem {
  id: string;
  roomCode: string;
  creatorName: string;
  title: string;
  difficultyLevel: string;
  caseStudyStory?: string;
  npcName?: string;
  npcPersona?: string;
  requiredObjectHint?: string;
  missionObjectives?: any;
  targetVocabularies?: any;
  quizQuestions?: any;
  submissionsCount?: number;
  speakingCount?: number;
  createdAt?: string;
}

interface QuizQuestionItem {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export default function TeacherDashboardView() {
  const [activeTab, setActiveTab] = useState<"rooms" | "grader" | "builder" | "diagnostics">("rooms");

  // Room Management State
  const [rooms, setRooms] = useState<TeacherRoomItem[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);
  const [projectorModalRoom, setProjectorModalRoom] = useState<TeacherRoomItem | null>(null);
  const [filterRoomCode, setFilterRoomCode] = useState<string>("ALL");

  // Gradebook & Heatmap State
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

  // In-Dashboard Room & Quiz Builder State
  const [newTopic, setNewTopic] = useState("Handling Customer Negotiation & Service Recovery");
  const [newGradeLevel, setNewGradeLevel] = useState("SMK Kelas 11 (Pemasaran & Bisnis)");
  const [newDifficulty, setNewDifficulty] = useState("B1");
  const [newPin, setNewPin] = useState(() => `EDU${Math.floor(100 + Math.random() * 900)}`);
  const [newCaseStory, setNewCaseStory] = useState(
    "Pelanggan asing merasa kecewa dengan keterlambatan pengiriman produk ramah lingkungan. Jelaskan kendala secara sopan dan tawarkan kompensasi solusi praktis menggunakan produk di mejamu."
  );
  const [newNpcName, setNewNpcName] = useState("Ms. Clara (Foreign Client)");
  const [newNpcPersona, setNewNpcPersona] = useState("Tegas, kritis terhadap ketepatan waktu, menghargai solusi transparan.");
  const [newTargetVocab, setNewTargetVocab] = useState("apologize, compensation, sustainable, delivery, resolution");
  const [newRequiredHint, setNewRequiredHint] = useState("Tunjukkan botol minum atau buku catatan di mejamu sebagai contoh produk fisik!");
  const [newQuizQuestions, setNewQuizQuestions] = useState<QuizQuestionItem[]>([
    {
      question: "What is the most professional response when a client reports a delivery delay?",
      options: [
        "It was the shipping company's fault.",
        "I apologize for the delay; let me track your shipment right now.",
        "You should have ordered two weeks earlier.",
        "We are closed on weekends so please call next Monday."
      ],
      correctIndex: 1,
      explanation: "Taking immediate ownership and offering a direct action step demonstrates professionalism.",
    },
    {
      question: "Which word best describes a package made from natural materials that do not pollute?",
      options: ["Disposable", "Biodegradable", "Toxic", "Artificial"],
      correctIndex: 1,
      explanation: "'Biodegradable' means capable of decomposing naturally without environmental harm.",
    },
  ]);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [isSavingRoom, setIsSavingRoom] = useState(false);
  const [createSuccessMsg, setCreateSuccessMsg] = useState<string | null>(null);

  // Edit Room Modal State
  const [editingRoom, setEditingRoom] = useState<TeacherRoomItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editRoomCode, setEditRoomCode] = useState("");
  const [editDifficulty, setEditDifficulty] = useState("B1");
  const [editCaseStory, setEditCaseStory] = useState("");
  const [editNpcName, setEditNpcName] = useState("");
  const [editNpcPersona, setEditNpcPersona] = useState("");
  const [editRequiredHint, setEditRequiredHint] = useState("");
  const [editTargetVocab, setEditTargetVocab] = useState("");
  const [editQuizQuestions, setEditQuizQuestions] = useState<QuizQuestionItem[]>([]);
  const [isUpdatingRoom, setIsUpdatingRoom] = useState(false);

  // Delete Room Modal State
  const [roomToDelete, setRoomToDelete] = useState<TeacherRoomItem | null>(null);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);

  // Load Rooms & Heatmap on Mount
  useEffect(() => {
    fetchRooms();
    fetchHeatmapData();
  }, []);

  const fetchRooms = async () => {
    setIsLoadingRooms(true);
    try {
      const res = await fetch("/api/teacher/rooms");
      const data = await res.json();
      if (res.ok && data.rooms) {
        setRooms(data.rooms);
      }
    } catch (err) {
      console.warn("Gagal fetch rooms guru:", err);
    } finally {
      setIsLoadingRooms(false);
    }
  };

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

  const handleCopyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    setTimeout(() => setCopiedPin(null), 2500);
  };

  // AI Auto-Generate Case & Quiz Draft
  const handleAutoGenerateAi = async () => {
    if (!newTopic.trim()) {
      alert("Masukkan topik materi pelajaran terlebih dahulu.");
      return;
    }

    setIsGeneratingAi(true);
    try {
      const res = await fetch("/api/generate-quest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "ROOM",
          creatorName: "Guru Bahasa Inggris",
          topic: newTopic,
          difficultyLevel: newDifficulty,
          detected_labels: ["bottle", "book", "cup"],
          generateOnly: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat draf dengan AI.");

      const q = data.quest;
      setNewCaseStory(q.scenario || q.urgent_goal || newCaseStory);
      setNewNpcName(q.npc_name || newNpcName);
      setNewNpcPersona(q.npc_persona || newNpcPersona);
      if (q.target_vocabularies) {
        const vocabStr = Array.isArray(q.target_vocabularies) ? q.target_vocabularies.join(", ") : q.target_vocabularies;
        setNewTargetVocab(vocabStr);
      }
      if (q.quiz_questions && Array.isArray(q.quiz_questions) && q.quiz_questions.length > 0) {
        setNewQuizQuestions(q.quiz_questions);
      }
    } catch (err: any) {
      alert(err.message || "Gagal membuat draf kuis dengan AI.");
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Save Room to MariaDB
  const handleSaveNewRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopic.trim() || !newCaseStory.trim()) {
      alert("Judul materi dan skenario kasus wajib diisi.");
      return;
    }

    setIsSavingRoom(true);
    setCreateSuccessMsg(null);

    const vocabList = newTargetVocab
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/teacher/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTopic,
          creatorName: "Budi Santoso, S.Pd",
          customPin: newPin,
          caseStudyStory: newCaseStory,
          npcName: newNpcName,
          npcPersona: newNpcPersona,
          requiredObjectHint: newRequiredHint,
          targetVocabularies: vocabList,
          quizQuestions: newQuizQuestions,
          difficultyLevel: newDifficulty,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan room.");

      setCreateSuccessMsg(`Room kelas berhasil dibuat dengan PIN [${data.room.roomCode}]! Siswa kini dapat bergabung menggunakan PIN ini.`);
      await fetchRooms();
      setNewPin(`EDU${Math.floor(100 + Math.random() * 900)}`);
      setActiveTab("rooms");
    } catch (err: any) {
      alert(err.message || "Gagal mempublikasikan room.");
    } finally {
      setIsSavingRoom(false);
    }
  };

  // Open Edit Modal & Populate Form
  const handleOpenEditModal = (room: TeacherRoomItem) => {
    setEditingRoom(room);
    setEditTitle(room.title || "");
    setEditRoomCode(room.roomCode || "");
    setEditDifficulty(room.difficultyLevel || "B1");
    setEditCaseStory(room.caseStudyStory || "");
    setEditNpcName(room.npcName || "Mr. Arthur");
    setEditNpcPersona(room.npcPersona || "Examiner & Evaluator");
    setEditRequiredHint(room.requiredObjectHint || "Benda fisik di meja");

    if (Array.isArray(room.targetVocabularies)) {
      setEditTargetVocab(room.targetVocabularies.join(", "));
    } else if (typeof room.targetVocabularies === "string") {
      try {
        const parsed = JSON.parse(room.targetVocabularies);
        setEditTargetVocab(Array.isArray(parsed) ? parsed.join(", ") : room.targetVocabularies);
      } catch {
        setEditTargetVocab(room.targetVocabularies);
      }
    } else {
      setEditTargetVocab("");
    }

    if (Array.isArray(room.quizQuestions)) {
      setEditQuizQuestions(room.quizQuestions);
    } else if (typeof room.quizQuestions === "string") {
      try {
        const parsed = JSON.parse(room.quizQuestions);
        setEditQuizQuestions(Array.isArray(parsed) ? parsed : []);
      } catch {
        setEditQuizQuestions([]);
      }
    } else {
      setEditQuizQuestions([]);
    }
  };

  // Submit Edited Room (PUT)
  const handleSaveEditedRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoom) return;
    if (!editTitle.trim() || !editCaseStory.trim()) {
      alert("Judul materi dan skenario studi kasus wajib diisi.");
      return;
    }

    setIsUpdatingRoom(true);
    const vocabList = editTargetVocab
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/teacher/rooms", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingRoom.id,
          title: editTitle,
          roomCode: editRoomCode,
          difficultyLevel: editDifficulty,
          caseStudyStory: editCaseStory,
          npcName: editNpcName,
          npcPersona: editNpcPersona,
          requiredObjectHint: editRequiredHint,
          targetVocabularies: vocabList,
          quizQuestions: editQuizQuestions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui room.");

      setCreateSuccessMsg(`Room kelas [PIN: ${editRoomCode}] berhasil diperbarui!`);
      await fetchRooms();
      setEditingRoom(null);
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui room.");
    } finally {
      setIsUpdatingRoom(false);
    }
  };

  const handleAddEditQuestion = () => {
    setEditQuizQuestions((prev) => [
      ...prev,
      {
        question: "Pertanyaan kuis baru...",
        options: ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
        correctIndex: 0,
        explanation: "Penjelasan jawaban benar...",
      },
    ]);
  };

  const handleRemoveEditQuestion = (idx: number) => {
    setEditQuizQuestions((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleUpdateEditOption = (qIdx: number, optIdx: number, val: string) => {
    setEditQuizQuestions((prev) => {
      const next = [...prev];
      const opts = [...next[qIdx].options] as [string, string, string, string];
      opts[optIdx] = val;
      next[qIdx] = { ...next[qIdx], options: opts };
      return next;
    });
  };

  // Submit Delete Room (DELETE)
  const handleConfirmDeleteRoom = async () => {
    if (!roomToDelete) return;
    setIsDeletingRoom(true);
    try {
      const res = await fetch(`/api/teacher/rooms?id=${roomToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus room.");

      setCreateSuccessMsg(`Room kelas [PIN: ${roomToDelete.roomCode}] berhasil dihapus.`);
      await fetchRooms();
      setRoomToDelete(null);
    } catch (err: any) {
      alert(err.message || "Gagal menghapus room.");
    } finally {
      setIsDeletingRoom(false);
    }
  };

  // Export e-Rapor CSV
  const handleExportCsv = () => {
    if (evaluations.length === 0) {
      alert("Belum ada data evaluasi speaking untuk diunduh.");
      return;
    }
    const filtered = filterRoomCode === "ALL" ? evaluations : evaluations.filter((ev) => (ev as any).roomCode === filterRoomCode || ev.questTitle.includes(filterRoomCode));
    const dataToExport = filtered.length > 0 ? filtered : evaluations;

    const headers = [
      "No",
      "Nama Siswa",
      "Misi / Room",
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
    const rows = dataToExport.map((ev, idx) => [
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

  // Add quiz question item
  const handleAddQuestion = () => {
    setNewQuizQuestions((prev) => [
      ...prev,
      {
        question: "Pertanyaan baru...",
        options: ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
        correctIndex: 0,
        explanation: "Penjelasan jawaban benar...",
      },
    ]);
  };

  const handleRemoveQuestion = (idxToRemove: number) => {
    setNewQuizQuestions((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-mono text-black">
      {/* Clean Professional Teacher Header */}
      <div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000000] flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-cyan-800 font-mono text-xs font-black uppercase tracking-widest">
            <span className="w-2.5 h-2.5 bg-cyan-500 border border-black inline-block" />
            <span>[DASHBOARD GURU // PUSAT KONTROL PEMBELAJARAN]</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight">
            Pusat Pembelajaran & Evaluasi Speaking Siswa
          </h1>
          <p className="text-xs text-zinc-600">
            Guru: <strong>Budi Santoso, S.Pd</strong> • Terhubung ke Database MariaDB & Engine AI Gemini
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => { fetchRooms(); fetchHeatmapData(); }}
            disabled={isLoadingRooms || isLoadingHeatmap}
            className="brutal-btn-white px-3.5 py-2 text-xs font-black uppercase flex items-center gap-1.5"
            title="Sinkronisasi Data Terbaru"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${(isLoadingRooms || isLoadingHeatmap) ? "animate-spin" : ""}`} />
            <span>[ SINKRONISASI DATA ]</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("builder")}
            className="brutal-btn-yellow px-4 py-2 text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>[ + BUAT ROOM KELAS DENGAN PIN ]</span>
          </button>
        </div>
      </div>

      {createSuccessMsg && (
        <div className="p-4 bg-emerald-100 border-2 border-emerald-700 text-emerald-950 text-xs font-black flex items-center justify-between shadow-[3px_3px_0px_#000000]">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>{createSuccessMsg}</span>
          </div>
          <button onClick={() => setCreateSuccessMsg(null)} className="font-bold underline uppercase">
            [Tutup]
          </button>
        </div>
      )}

      {/* 4 Essential Tabs Control */}
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-zinc-300 pb-3 font-mono">
        <button
          onClick={() => setActiveTab("rooms")}
          className={`px-4 py-2 font-mono text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
            activeTab === "rooms" ? "brutal-btn-yellow" : "brutal-btn-white"
          }`}
        >
          <Key className="w-3.5 h-3.5" />
          <span>[01] DAFTAR ROOM KELAS & PIN ({rooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("grader")}
          className={`px-4 py-2 font-mono text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
            activeTab === "grader" ? "brutal-btn-cyan" : "brutal-btn-white"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>[02] REKAP NILAI SISWA ({evaluations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("builder")}
          className={`px-4 py-2 font-mono text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
            activeTab === "builder" ? "brutal-btn-yellow" : "brutal-btn-white"
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>[03] BUAT ROOM & KUIS MANDIRI</span>
        </button>

        <button
          onClick={() => setActiveTab("diagnostics")}
          className={`px-4 py-2 font-mono text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
            activeTab === "diagnostics" ? "brutal-btn-cyan" : "brutal-btn-white"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>[04] ANALISIS KELEMAHAN KELAS</span>
        </button>
      </div>

      {/* =====================================================================
          TAB 1: DAFTAR ROOM KELAS & PIN
          ===================================================================== */}
      {activeTab === "rooms" && (
        <div className="space-y-4 font-mono">
          <div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000000] flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase text-amber-800">
                [MANAJEMEN KELAS AKTIF // 6-DIGIT PIN FOR STUDENTS]
              </span>
              <h2 className="text-xl font-black uppercase text-black">
                Daftar Room Kelas yang Siap Di-Join Siswa
              </h2>
              <p className="text-xs text-zinc-600">
                Bagikan 6-digit PIN ke siswa atau tampilkan di proyektor kelas agar murid langsung membuka misi studi kasus.
              </p>
            </div>
            <button
              onClick={() => setActiveTab("builder")}
              className="brutal-btn-yellow px-4 py-2 text-xs font-black uppercase flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>[ + BUAT ROOM BARU ]</span>
            </button>
          </div>

          {isLoadingRooms ? (
            <div className="p-8 text-center bg-white border-2 border-black shadow-[4px_4px_0px_#000000]">
              <div className="w-8 h-8 border-4 border-black border-t-[#facc15] animate-spin mx-auto mb-2" />
              <p className="text-xs font-black uppercase">[ MEMUAT DAFTAR ROOM KELAS... ]</p>
            </div>
          ) : rooms.length === 0 ? (
            <div className="p-8 text-center bg-white border-2 border-dashed border-black shadow-[4px_4px_0px_#000000] space-y-3">
              <Key className="w-10 h-10 mx-auto text-zinc-400" />
              <p className="text-sm font-black uppercase">Belum ada room kelas yang dibuat.</p>
              <p className="text-xs text-zinc-600 max-w-md mx-auto">
                Klik tombol "Buat Room Kelas dengan PIN" untuk menyusun topik pelajaran dan menghasilkan PIN 6-digit bagi muridmu.
              </p>
              <button
                onClick={() => setActiveTab("builder")}
                className="brutal-btn-yellow px-5 py-2.5 text-xs font-black uppercase inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>[ BUAT ROOM PERTAMA ]</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000000] space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse border border-black" />
                        <span className="text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 px-2 py-0.5 border border-emerald-800">
                          STATUS: AKTIF
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-zinc-500">
                        Target CEFR: [{room.difficultyLevel}]
                      </span>
                    </div>

                    <div>
                      <div className="text-[10px] font-bold text-zinc-500 uppercase">
                        PIN ROOM KELAS:
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-2xl sm:text-3xl font-black tracking-widest bg-yellow-100 text-black px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000000]">
                          {room.roomCode}
                        </span>
                        <button
                          onClick={() => handleCopyPin(room.roomCode)}
                          className="brutal-btn-white px-2.5 py-1.5 text-xs font-bold uppercase flex items-center gap-1"
                          title="Salin PIN ke Clipboard"
                        >
                          {copiedPin === room.roomCode ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700 font-black">TERSALIN!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>SALIN</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-black text-black uppercase leading-tight line-clamp-2">
                        {room.title}
                      </h3>
                      {room.caseStudyStory && (
                        <p className="text-xs text-zinc-600 line-clamp-2 mt-1 leading-relaxed">
                          {room.caseStudyStory}
                        </p>
                      )}
                    </div>

                    <div className="p-2.5 bg-zinc-50 border border-black text-xs flex items-center justify-between">
                      <span className="text-zinc-600 font-bold">Guru: {room.creatorName}</span>
                      <span className="font-black text-emerald-800">
                        {room.speakingCount || room.submissionsCount || 0} Siswa Selesai
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t-2 border-zinc-200 flex flex-col gap-2 font-mono">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setProjectorModalRoom(room)}
                        className="flex-1 brutal-btn-yellow py-2 text-xs font-black uppercase flex items-center justify-center gap-1.5"
                        title="Tampilkan PIN Layar Penuh di Proyektor Depan Kelas"
                      >
                        <Monitor className="w-3.5 h-3.5" />
                        <span>[ 🖥️ PROYEKTOR PIN ]</span>
                      </button>
                      <button
                        onClick={() => {
                          setFilterRoomCode(room.roomCode);
                          setActiveTab("grader");
                        }}
                        className="flex-1 brutal-btn-white py-2 text-xs font-black uppercase flex items-center justify-center gap-1.5"
                        title="Lihat Rekap Nilai Siswa untuk Room Ini"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>[ 👥 LIHAT NILAI ]</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleOpenEditModal(room)}
                        className="flex-1 brutal-btn-cyan py-2 text-xs font-black uppercase flex items-center justify-center gap-1.5"
                        title="Edit Judul, PIN, Skenario, dan Soal Kuis"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                        <span>[ ✏️ EDIT ROOM ]</span>
                      </button>
                      <button
                        onClick={() => setRoomToDelete(room)}
                        className="px-3.5 py-2 border-2 border-red-700 bg-red-100 hover:bg-red-200 text-red-900 text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000000] transition-colors"
                        title="Hapus Room Kelas & Sesi Terkait"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-700" />
                        <span>[ HAPUS ]</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 2: REKAP NILAI SISWA (GRADEBOOK E-RAPOR)
          ===================================================================== */}
      {activeTab === "grader" && (
        <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-200 pb-3">
            <div>
              <span className="font-mono text-xs font-black uppercase text-cyan-800">
                [GRADEBOOK SPEAKING RESMI // SINKRONISASI DATABASE MARIADB]
              </span>
              <h2 className="font-black text-xl text-black uppercase tracking-tight">
                Rekap Nilai Speaking & Bukti Transkrip Siswa
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportCsv}
                className="brutal-btn-yellow px-3.5 py-2 text-xs font-mono font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
                title="Unduh seluruh rekap nilai dalam format spreadsheet Kurikulum Merdeka"
              >
                <Download className="w-3.5 h-3.5" />
                <span>[ 📥 EXPORT E-RAPOR (.CSV) ]</span>
              </button>
              <button
                onClick={fetchHeatmapData}
                className="brutal-btn-white px-3 py-2 text-xs font-mono font-black uppercase flex items-center gap-1.5"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isLoadingHeatmap ? "animate-spin" : ""}`} />
                <span>[ REFRESH ]</span>
              </button>
            </div>
          </div>

          {isLoadingHeatmap ? (
            <div className="p-8 text-center font-mono text-xs text-zinc-600">
              <div className="w-8 h-8 border-4 border-black border-t-[#22d3ee] animate-spin mx-auto mb-2" />
              [MEMUAT DATA REKAMAN DATABASE MARIADB...]
            </div>
          ) : evaluations.length === 0 ? (
            <div className="p-8 text-center font-mono text-xs text-zinc-600 space-y-2 border-2 border-dashed border-zinc-300">
              <p className="uppercase font-bold text-black text-sm">
                Belum ada rekaman nilai speaking siswa yang masuk.
              </p>
              <p>
                Siswa dapat bergabung menggunakan PIN room kelas dari Tab 1, lalu menyelesaikan tes bicara agar nilainya otomatis muncul di tabel ini.
              </p>
            </div>
          ) : (
            <div className="space-y-3 font-mono">
              <div className="overflow-x-auto border-2 border-black">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#facc15] text-black font-black uppercase border-b-2 border-black">
                    <tr>
                      <th className="p-3">No</th>
                      <th className="p-3">Nama Siswa</th>
                      <th className="p-3">Misi / Quest</th>
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
                        <td className="p-3 font-bold">{idx + 1}</td>
                        <td className="p-3 font-black text-black">{ev.studentName || `Siswa #${idx + 1}`}</td>
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
                            className="px-2.5 py-1 bg-cyan-100 hover:bg-cyan-200 text-cyan-900 border border-black font-black text-[11px] shadow-[1px_1px_0px_#000000] cursor-pointer inline-flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            <span>[ 👁️ TRANSKRIP ]</span>
                          </button>
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

      {/* =====================================================================
          TAB 3: BUAT ROOM & KUIS MANDIRI (LANGSUNG DI DASHBOARD)
          ===================================================================== */}
      {activeTab === "builder" && (
        <div className="border-2 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_#000000] space-y-6">
          <div className="border-b-2 border-zinc-200 pb-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-black uppercase text-amber-800">
                [ROOM & QUIZ BUILDER // MANUAL + AI ENGINE]
              </span>
              <h2 className="text-2xl font-black text-black uppercase tracking-tight">
                Buat Room Kelas & Kuis Speaking Baru
              </h2>
              <p className="text-xs text-zinc-600">
                Ketik materi dan soal sendiri, atau klik tombol Auto-Generate AI untuk membuat draf instan dalam 10 detik.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAutoGenerateAi}
              disabled={isGeneratingAi}
              className="brutal-btn-yellow px-4 py-2 text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAi ? "animate-spin" : ""}`} />
              <span>{isGeneratingAi ? "[ MENYUSUN DRAF AI... ]" : "[ ⚡ AUTO-GENERATE DRAF DENGAN AI ]"}</span>
            </button>
          </div>

          <form onSubmit={handleSaveNewRoom} className="space-y-5 text-xs">
            {/* Top Grid: Topik, PIN, CEFR */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-2 space-y-1">
                <label className="font-black text-black uppercase block">
                  Judul Materi / Topik Misi:
                </label>
                <input
                  type="text"
                  required
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border-2 border-black text-black font-bold focus:bg-white focus:outline-none"
                  placeholder="Contoh: Eco-Friendly Hospitality & Negotiation"
                />
              </div>

              <div className="space-y-1">
                <label className="font-black text-black uppercase block">
                  6-Digit PIN Room Guru:
                </label>
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 bg-yellow-50 border-2 border-black text-black font-black tracking-widest text-base focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Case Study Scenario */}
            <div className="space-y-1">
              <label className="font-black text-black uppercase block">
                Skenario Studi Kasus Dunia Nyata:
              </label>
              <textarea
                required
                rows={3}
                value={newCaseStory}
                onChange={(e) => setNewCaseStory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border-2 border-black text-black font-mono focus:bg-white focus:outline-none leading-relaxed"
                placeholder="Ceritakan latar belakang kasus nyata yang harus diselesaikan siswa saat berbicara dengan NPC..."
              />
            </div>

            {/* NPC Details & Hint */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-black text-black uppercase block">
                  Nama & Persona NPC Penguji:
                </label>
                <input
                  type="text"
                  required
                  value={newNpcName}
                  onChange={(e) => setNewNpcName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border-2 border-black text-black font-bold focus:bg-white focus:outline-none"
                  placeholder="Contoh: Ms. Clara (Foreign Client)"
                />
              </div>

              <div className="space-y-1">
                <label className="font-black text-black uppercase block">
                  Benda Fisik Meja yang Wajib Di-Scan Siswa:
                </label>
                <input
                  type="text"
                  required
                  value={newRequiredHint}
                  onChange={(e) => setNewRequiredHint(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border-2 border-black text-black font-bold focus:bg-white focus:outline-none"
                  placeholder="Contoh: Botol minum atau buku catatan di meja"
                />
              </div>
            </div>

            {/* Target Vocabulary */}
            <div className="space-y-1">
              <label className="font-black text-black uppercase block">
                Target Kosakata Wajib (Dipisahkan Koma):
              </label>
              <input
                type="text"
                required
                value={newTargetVocab}
                onChange={(e) => setNewTargetVocab(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border-2 border-black text-black font-mono focus:bg-white focus:outline-none"
                placeholder="sustainable, eco-friendly, resolution, apology, durable"
              />
            </div>

            {/* Pre-Quiz Questions Builder */}
            <div className="border-2 border-black bg-zinc-50 p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-2">
                <div>
                  <span className="text-[10px] font-black uppercase text-amber-800 block">
                    [STAGE PRE-QUIZ // KUIS PEMAHAMAN SEBELUM BICARA]
                  </span>
                  <h4 className="text-sm font-black text-black uppercase">
                    Butir Soal Kuis Pilihan Ganda ({newQuizQuestions.length} Soal)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="brutal-btn-white px-3 py-1.5 text-xs font-black uppercase flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>[ TAMBAH SOAL ]</span>
                </button>
              </div>

              <div className="space-y-4">
                {newQuizQuestions.map((qItem, qIdx) => (
                  <div key={qIdx} className="p-4 bg-white border-2 border-black space-y-3 shadow-[2px_2px_0px_#000000]">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-xs uppercase bg-[#facc15] text-black px-2 py-0.5 border border-black">
                        SOAL #{qIdx + 1}
                      </span>
                      {newQuizQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="text-red-600 hover:text-red-800 text-xs font-black flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>HAPUS</span>
                        </button>
                      )}
                    </div>

                    <div>
                      <label className="font-bold text-zinc-700 block mb-0.5">Pertanyaan:</label>
                      <input
                        type="text"
                        required
                        value={qItem.question}
                        onChange={(e) => {
                          const updated = [...newQuizQuestions];
                          updated[qIdx].question = e.target.value;
                          setNewQuizQuestions(updated);
                        }}
                        className="w-full px-3 py-2 bg-zinc-50 border border-black text-black font-bold focus:bg-white focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {qItem.options.map((opt, optIdx) => (
                        <div key={optIdx} className="space-y-0.5">
                          <label className="text-[10px] font-bold text-zinc-600 uppercase flex items-center justify-between">
                            <span>Pilihan {String.fromCharCode(65 + optIdx)}:</span>
                            {qItem.correctIndex === optIdx ? (
                              <span className="text-emerald-700 font-black">✓ KUNCI JAWABAN</span>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  const updated = [...newQuizQuestions];
                                  updated[qIdx].correctIndex = optIdx;
                                  setNewQuizQuestions(updated);
                                }}
                                className="text-zinc-500 hover:text-black underline"
                              >
                                Jadikan Kunci
                              </button>
                            )}
                          </label>
                          <input
                            type="text"
                            required
                            value={opt}
                            onChange={(e) => {
                              const updated = [...newQuizQuestions];
                              updated[qIdx].options[optIdx] = e.target.value;
                              setNewQuizQuestions(updated);
                            }}
                            className={`w-full px-2.5 py-1.5 border text-xs ${
                              qItem.correctIndex === optIdx
                                ? "bg-emerald-50 border-emerald-600 font-bold text-black"
                                : "bg-white border-zinc-400 text-black"
                            } focus:outline-none`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSavingRoom}
              className="w-full brutal-btn-yellow py-4 text-sm font-black uppercase flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000000]"
            >
              {isSavingRoom ? (
                <span>[ MENYIMPAN KE DATABASE... ]</span>
              ) : (
                <>
                  <Key className="w-4 h-4 stroke-[2.5]" />
                  <span>[ 🚀 SIMPAN & PUBLIKASIKAN ROOM KELAS (PIN {newPin}) ]</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}

      {/* =====================================================================
          TAB 4: ANALISIS KELEMAHAN KELAS & REMEDIAL
          ===================================================================== */}
      {activeTab === "diagnostics" && (
        <div className="space-y-6 font-mono">
          <div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000000] space-y-1">
            <span className="text-[10px] font-black uppercase text-cyan-800 block">
              [CLASS MISCONCEPTION HEATMAP & AI REMEDIAL ENGINE]
            </span>
            <h2 className="text-xl font-black uppercase text-black">
              Peta Diagnostik Kesalahan Kolektif Siswa
            </h2>
            <p className="text-xs text-zinc-600">
              AI menganalisis transkrip rekaman seluruh murid satu kelas untuk mendeteksi kelemahan kosakata, tata bahasa, dan jeda keraguan yang paling sering terjadi.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Misconceptions List */}
            <div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000000] space-y-4">
              <h3 className="text-sm font-black uppercase text-black border-b-2 border-zinc-200 pb-2 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>Pola Kesalahan Terbanyak Murid:</span>
              </h3>

              {misconceptions.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500 border border-dashed border-zinc-300">
                  Data diagnostik akan otomatis terisi setelah siswa menyelesaikan sesi percakapan.
                </div>
              ) : (
                <div className="space-y-3">
                  {misconceptions.map((item, idx) => (
                    <div key={idx} className="p-3 bg-zinc-50 border border-black space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-amber-800 uppercase">
                          [{item.category}] {item.errorDescription || "Kelemahan Berbicara"}
                        </span>
                        <span className="text-[10px] bg-red-100 text-red-900 px-1.5 py-0.5 border border-red-700 font-bold">
                          {item.affectedPercentage || 0}% Siswa
                        </span>
                      </div>
                      <p className="text-zinc-700 leading-relaxed">
                        Contoh: <span className="line-through text-red-700 font-bold">"{item.exampleMistake}"</span> ➔ <span className="text-emerald-700 font-bold">"{item.correctForm}"</span>
                      </p>
                      <div className="p-2 bg-white border border-zinc-300 text-[11px] text-emerald-800 font-bold">
                        💡 Remedial: {item.recommendedWarmup}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Warm-Up Quiz for Class Screen */}
            <div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000000] space-y-4">
              <h3 className="text-sm font-black uppercase text-black border-b-2 border-zinc-200 pb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Kuis Remedial 5-Menit untuk Layar Kelas:</span>
              </h3>

              {warmUpQuiz && warmUpQuiz.questions ? (
                <div className="space-y-3">
                  <p className="text-xs text-zinc-600 leading-relaxed">
                    Tampilkan kuis ini di proyektor kelas sebelum pelajaran dimulai untuk meluruskan kesalahan umum murid:
                  </p>
                  {warmUpQuiz.questions.map((wq: any, qIdx: number) => (
                    <div key={qIdx} className="p-3 bg-yellow-50 border border-black space-y-2 text-xs">
                      <span className="font-black text-black block">#{qIdx + 1}: {wq.question}</span>
                      <div className="space-y-1">
                        {wq.options.map((opt: string, oIdx: number) => (
                          <div
                            key={oIdx}
                            className={`p-1.5 border text-[11px] ${
                              wq.correctIndex === oIdx ? "bg-emerald-100 border-emerald-600 font-black text-emerald-950" : "bg-white border-zinc-300 text-zinc-800"
                            }`}
                          >
                            {String.fromCharCode(65 + oIdx)}. {opt} {wq.correctIndex === oIdx && "✓ (Kunci Jawaban)"}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 text-center text-xs text-zinc-500 border border-dashed border-zinc-300">
                  Kuis pemanasan remedial otomatis disusun oleh AI saat data rekaman siswa terkumpul.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: FULLSCREEN PROYEKTOR PIN UNTUK LAYAR KELAS
          ===================================================================== */}
      {projectorModalRoom && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 font-mono">
          <div className="bg-white border-4 border-black w-full max-w-2xl shadow-[8px_8px_0px_#000000] p-6 sm:p-8 space-y-6 text-black text-center">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <span className="text-xs font-black uppercase bg-[#facc15] px-3 py-1 border border-black">
                [MODE PROYEKTOR KELAS // TEMBAKKAN KE LAYAR DEPAN]
              </span>
              <button
                onClick={() => setProjectorModalRoom(null)}
                className="p-1.5 bg-black text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-zinc-500 block">
                MASUKKAN 6-DIGIT PIN INI DI HP / LAPTOP MASING-MASING:
              </span>
              <div className="text-5xl sm:text-7xl font-black tracking-widest text-black bg-[#facc15] p-5 border-4 border-black shadow-[6px_6px_0px_#000000] inline-block">
                {projectorModalRoom.roomCode}
              </div>
            </div>

            <div className="p-4 bg-zinc-50 border-2 border-black text-left space-y-1.5 text-xs">
              <span className="font-black text-black uppercase block">Misi Pembelajaran Hari Ini:</span>
              <h3 className="text-base font-black text-black">{projectorModalRoom.title}</h3>
              {projectorModalRoom.caseStudyStory && (
                <p className="text-zinc-700 leading-relaxed text-xs">{projectorModalRoom.caseStudyStory}</p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left text-xs">
              <div className="p-3 bg-white border border-black space-y-1">
                <span className="font-black text-cyan-800 block">1. BUKA APLIKASI</span>
                <p className="text-[11px] text-zinc-600">Buka web di HP/laptop siswa.</p>
              </div>
              <div className="p-3 bg-white border border-black space-y-1">
                <span className="font-black text-amber-800 block">2. LOGIN AKUN</span>
                <p className="text-[11px] text-zinc-600">Nama siswa terbaca otomatis.</p>
              </div>
              <div className="p-3 bg-white border border-black space-y-1">
                <span className="font-black text-emerald-800 block">3. KETIK PIN</span>
                <p className="text-[11px] text-zinc-600">Ketik [{projectorModalRoom.roomCode}] dan mulai!</p>
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setProjectorModalRoom(null)}
                className="brutal-btn-yellow px-8 py-3 text-xs font-black uppercase shadow-[3px_3px_0px_#000000]"
              >
                [ TUTUP TAMPILAN PROYEKTOR ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: BUKTI TRANSKRIP & EVALUASI AI SISWA
          ===================================================================== */}
      {selectedEvaluation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-mono">
          <div className="border-4 border-black bg-white max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-[8px_8px_0px_#000000] space-y-5 text-black">
            <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase bg-[#facc15] text-black px-2 py-0.5 border border-black">
                  [BUKTI AUTENTIK REKAMAN PERCAKAPAN SISWA]
                </span>
                <h3 className="text-xl font-black text-black uppercase mt-1">
                  {selectedEvaluation.studentName} — CEFR {selectedEvaluation.cefrLevel} ({selectedEvaluation.overallScore} Pts)
                </h3>
                <p className="text-xs text-zinc-600">Quest: {selectedEvaluation.questTitle} • Waktu: {selectedEvaluation.timestamp}</p>
              </div>
              <button
                onClick={() => setSelectedEvaluation(null)}
                className="brutal-btn-white px-3 py-1 font-black text-xs uppercase"
              >
                [TUTUP / X]
              </button>
            </div>

            {/* Score Breakdown Pills */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-zinc-50 border border-black">
                <span className="text-[10px] text-zinc-500 uppercase block">Fluency:</span>
                <span className="font-black text-black">{selectedEvaluation.fluencyScore}%</span>
              </div>
              <div className="p-2.5 bg-zinc-50 border border-black">
                <span className="text-[10px] text-zinc-500 uppercase block">Pronunciation:</span>
                <span className="font-black text-black">{selectedEvaluation.pronunciationScore}%</span>
              </div>
              <div className="p-2.5 bg-zinc-50 border border-black">
                <span className="text-[10px] text-zinc-500 uppercase block">Vocabulary:</span>
                <span className="font-black text-black">{selectedEvaluation.vocabularyScore}%</span>
              </div>
              <div className="p-2.5 bg-zinc-50 border border-black">
                <span className="text-[10px] text-zinc-500 uppercase block">Grammar:</span>
                <span className="font-black text-black">{selectedEvaluation.grammarScore}%</span>
              </div>
            </div>

            {/* Transkrip Obrolan Siswa vs NPC */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-black block">
                Transkrip Rekaman Percakapan Berbicara:
              </span>
              <div className="p-4 bg-zinc-50 border-2 border-black max-h-60 overflow-y-auto space-y-3 text-xs">
                {selectedEvaluation.transcriptMessages && selectedEvaluation.transcriptMessages.length > 0 ? (
                  selectedEvaluation.transcriptMessages.map((msg: any, mIdx: number) => (
                    <div
                      key={mIdx}
                      className={`p-2.5 border ${
                        msg.sender === "student" ? "bg-amber-50 border-amber-600 ml-4" : "bg-white border-zinc-300 mr-4"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-black text-[10px] uppercase text-zinc-600">
                          {msg.sender === "student" ? "🎒 SISWA" : "🧑‍🏫 NPC"}
                        </span>
                      </div>
                      <p className="text-black font-mono leading-relaxed">{msg.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-zinc-500 italic">Transkrip dialog belum tersedia untuk sesi ini.</p>
                )}
              </div>
            </div>

            {/* Native-like Upgrades */}
            {selectedEvaluation.nativeUpgrades && selectedEvaluation.nativeUpgrades.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-black uppercase text-emerald-800 block">
                  Koreksi & Native-Like Upgrade Kalimat Siswa:
                </span>
                <div className="space-y-2">
                  {selectedEvaluation.nativeUpgrades.map((upg, uIdx) => (
                    <div key={uIdx} className="p-3 bg-emerald-50 border border-emerald-600 text-xs space-y-1">
                      <div className="text-red-700">
                        <span className="font-bold line-through">"{upg.original}"</span>
                      </div>
                      <div className="text-emerald-900 font-bold flex items-center gap-1.5">
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                        <span>"{upg.upgraded}"</span>
                      </div>
                      <p className="text-[11px] text-zinc-600 italic mt-0.5">{upg.explanation || (upg as any).reason}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedEvaluation(null)}
                className="brutal-btn-yellow px-5 py-2 text-xs font-black uppercase"
              >
                [ SELESAI // TUTUP ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: EDIT ROOM KELAS & KUIS
          ===================================================================== */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 font-mono overflow-y-auto">
          <div className="border-4 border-black bg-white max-w-3xl w-full my-8 p-6 shadow-[8px_8px_0px_#000000] space-y-6 text-black max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase bg-[#22d3ee] text-black px-2 py-0.5 border border-black">
                    [EDIT ROOM KELAS]
                  </span>
                  <span className="text-xs font-black uppercase text-zinc-500">
                    PIN: [{editRoomCode}]
                  </span>
                </div>
                <h2 className="text-lg font-black uppercase tracking-tight mt-1">
                  Sunting Skenario & Kuis Room Kelas
                </h2>
              </div>
              <button
                onClick={() => setEditingRoom(null)}
                className="p-1.5 bg-black text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSaveEditedRoom} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-black uppercase block mb-1">
                    PIN Room Kelas:
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={10}
                    value={editRoomCode}
                    onChange={(e) => setEditRoomCode(e.target.value.toUpperCase())}
                    className="w-full border-2 border-black p-2.5 font-mono text-sm uppercase bg-yellow-50 focus:bg-white outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-black uppercase block mb-1">
                    Target CEFR Level:
                  </label>
                  <select
                    value={editDifficulty}
                    onChange={(e) => setEditDifficulty(e.target.value)}
                    className="w-full border-2 border-black p-2.5 font-mono text-xs bg-white outline-hidden font-bold"
                  >
                    <option value="A1">A1 - Pemula Dasar</option>
                    <option value="A2">A2 - Elementary</option>
                    <option value="B1">B1 - Intermediate</option>
                    <option value="B2">B2 - Upper Intermediate</option>
                    <option value="C1">C1 - Advanced Professional</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black uppercase block mb-1">
                    ID Room di Database:
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editingRoom.id}
                    className="w-full border-2 border-zinc-300 p-2.5 font-mono text-xs bg-zinc-100 text-zinc-500 cursor-not-allowed"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase block mb-1">
                  Judul Skenario Misi / Ujian:
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full border-2 border-black p-2.5 font-mono text-xs bg-white outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase block mb-1">
                  Skenario Kasus Nyata (Case Study Story):
                </label>
                <textarea
                  required
                  rows={3}
                  value={editCaseStory}
                  onChange={(e) => setEditCaseStory(e.target.value)}
                  className="w-full border-2 border-black p-2.5 font-mono text-xs bg-white outline-hidden leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase block mb-1">
                    Nama Karakter Penguji (NPC):
                  </label>
                  <input
                    type="text"
                    value={editNpcName}
                    onChange={(e) => setEditNpcName(e.target.value)}
                    className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase block mb-1">
                    Persona & Sikap Penguji:
                  </label>
                  <input
                    type="text"
                    value={editNpcPersona}
                    onChange={(e) => setEditNpcPersona(e.target.value)}
                    className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-hidden"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase block mb-1">
                    Benda Nyata yang Harus Discan:
                  </label>
                  <input
                    type="text"
                    value={editRequiredHint}
                    onChange={(e) => setEditRequiredHint(e.target.value)}
                    className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-hidden"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase block mb-1">
                    Target Kosakata Wajib (Pisahkan Koma):
                  </label>
                  <input
                    type="text"
                    value={editTargetVocab}
                    onChange={(e) => setEditTargetVocab(e.target.value)}
                    className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-hidden"
                  />
                </div>
              </div>

              {/* Edit Quiz Section */}
              <div className="border-t-2 border-black pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-black uppercase block text-black">
                      Soal Kuis Pilihan Ganda ({editQuizQuestions.length} Butir)
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      Siswa akan menjawab soal-soal ini sebelum atau setelah sesi speaking.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEditQuestion}
                    className="brutal-btn-white px-3 py-1.5 text-xs font-black uppercase flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>[ + Tambah Soal ]</span>
                  </button>
                </div>

                <div className="space-y-4">
                  {editQuizQuestions.map((qItem, qIdx) => (
                    <div key={qIdx} className="border-2 border-black bg-zinc-50 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase bg-black text-white px-2 py-0.5">
                          Soal #{qIdx + 1}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEditQuestion(qIdx)}
                          className="text-red-700 hover:text-red-900 text-xs font-black flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Soal</span>
                        </button>
                      </div>

                      <input
                        type="text"
                        value={qItem.question}
                        onChange={(e) => {
                          const next = [...editQuizQuestions];
                          next[qIdx].question = e.target.value;
                          setEditQuizQuestions(next);
                        }}
                        className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-hidden font-bold"
                        placeholder="Ketik pertanyaan kuis..."
                      />

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {qItem.options.map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-2">
                            <span className="font-black text-zinc-700 w-5">
                              {["A", "B", "C", "D"][optIdx]}.
                            </span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleUpdateEditOption(qIdx, optIdx, e.target.value)}
                              className="flex-1 border border-black p-1.5 font-mono text-xs bg-white outline-hidden"
                            />
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <div>
                          <label className="text-[11px] font-black uppercase block mb-1">
                            Kunci Jawaban Benar:
                          </label>
                          <select
                            value={qItem.correctIndex}
                            onChange={(e) => {
                              const next = [...editQuizQuestions];
                              next[qIdx].correctIndex = parseInt(e.target.value);
                              setEditQuizQuestions(next);
                            }}
                            className="w-full border border-black p-1.5 font-mono text-xs bg-white outline-hidden font-bold"
                          >
                            <option value={0}>Pilihan A</option>
                            <option value={1}>Pilihan B</option>
                            <option value={2}>Pilihan C</option>
                            <option value={3}>Pilihan D</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-black uppercase block mb-1">
                            Penjelasan / Feedback:
                          </label>
                          <input
                            type="text"
                            value={qItem.explanation}
                            onChange={(e) => {
                              const next = [...editQuizQuestions];
                              next[qIdx].explanation = e.target.value;
                              setEditQuizQuestions(next);
                            }}
                            className="w-full border border-black p-1.5 font-mono text-xs bg-white outline-hidden"
                            placeholder="Alasan jawaban ini benar..."
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Modal Footer Actions */}
              <div className="border-t-2 border-black pt-4 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setEditingRoom(null)}
                  disabled={isUpdatingRoom}
                  className="brutal-btn-white px-5 py-2.5 text-xs font-black uppercase"
                >
                  [ BATAL ]
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingRoom}
                  className="brutal-btn-yellow px-6 py-2.5 text-xs font-black uppercase flex items-center gap-1.5 shadow-[3px_3px_0px_#000000]"
                >
                  {isUpdatingRoom ? (
                    <span>[ MENYIMPAN PERUBAHAN... ]</span>
                  ) : (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>[ SIMPAN PERUBAHAN ROOM ]</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: KONFIRMASI HAPUS ROOM KELAS
          ===================================================================== */}
      {roomToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 font-mono">
          <div className="border-4 border-black bg-white max-w-md w-full p-6 shadow-[8px_8px_0px_#000000] space-y-4 text-black">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-red-100 border-2 border-red-700 text-red-700">
                <AlertCircle className="w-5 h-5 stroke-[2.5]" />
              </span>
              <div>
                <span className="text-[10px] font-black uppercase text-red-700 tracking-wider block">
                  [KONFIRMASI TINDAKAN BERBAHAYA]
                </span>
                <h2 className="text-base font-black uppercase text-black">
                  Hapus Room Kelas?
                </h2>
              </div>
            </div>

            <div className="p-3.5 bg-red-50 border-2 border-red-700 text-xs text-red-950 space-y-2">
              <p>
                Anda akan menghapus room kelas:
                <strong className="block text-black font-black mt-1">
                  [PIN: {roomToDelete.roomCode}] {roomToDelete.title}
                </strong>
              </p>
              <p className="text-[11px] text-red-800 leading-relaxed font-bold">
                ⚠️ Peringatan: Seluruh data evaluasi siswa, skor e-Rapor, dan transkrip audio/teks yang terhubung ke room ini akan dihapus secara permanen dari basis data MariaDB.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setRoomToDelete(null)}
                disabled={isDeletingRoom}
                className="brutal-btn-white px-4 py-2 text-xs font-black uppercase"
              >
                [ BATAL ]
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteRoom}
                disabled={isDeletingRoom}
                className="px-5 py-2 border-2 border-black bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeletingRoom ? "[ MENGHAPUS... ]" : "[ YA, HAPUS PERMANEN ]"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
