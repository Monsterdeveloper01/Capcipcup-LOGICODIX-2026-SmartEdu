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
  UserPlus,
  UserCheck,
} from "lucide-react";

interface ClassroomItem {
  id: string;
  classCode: string;
  name: string;
  gradeLevel: string;
  academicYear: string;
  teacherName: string;
  description?: string;
  membersCount: number;
  tasksCount: number;
}

interface ClassroomMemberItem {
  memberId: string;
  userId: string;
  studentName: string;
  studentUsername: string;
  joinedAt: string;
  status: string;
  email?: string;
  xp?: number;
  level?: number;
  completedTasksCount?: number;
}

interface AvailableStudentItem {
  userId: string;
  studentName: string;
  studentUsername: string;
  email: string;
}

interface TeacherRoomItem {
  id: string;
  classroomId?: string;
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
  const [activeTab, setActiveTab] = useState<"classes" | "tasks" | "builder" | "grader" | "diagnostics">("classes");

  // Classroom & Roster State
  const [classes, setClasses] = useState<ClassroomItem[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassroomItem | null>(null);
  const [classMembers, setClassMembers] = useState<ClassroomMemberItem[]>([]);
  const [availableStudents, setAvailableStudents] = useState<AvailableStudentItem[]>([]);
  const [isLoadingClasses, setIsLoadingClasses] = useState(true);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);
  const [projectorModalClass, setProjectorModalClass] = useState<ClassroomItem | null>(null);

  // Kick & Add Member State
  const [memberToKick, setMemberToKick] = useState<ClassroomMemberItem | null>(null);
  const [isKicking, setIsKicking] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Create Classroom Modal State
  const [showCreateClassModal, setShowCreateClassModal] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassPin, setNewClassPin] = useState("");
  const [newClassGrade, setNewClassGrade] = useState("Kelas 10 SMK");
  const [newClassDesc, setNewClassDesc] = useState("Kelas Speaking Kurikulum Merdeka Fase E");
  const [isCreatingClass, setIsCreatingClass] = useState(false);

  // Tasks in Selected Classroom State
  const [rooms, setRooms] = useState<TeacherRoomItem[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
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

  // Edit Task Modal State
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

  // Delete Task Modal State
  const [roomToDelete, setRoomToDelete] = useState<TeacherRoomItem | null>(null);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);

  // Load Classes on mount
  useEffect(() => {
    fetchClasses();
    fetchHeatmapData();
  }, []);

  // When selectedClass changes, load its members & tasks
  useEffect(() => {
    if (selectedClass) {
      fetchMembers(selectedClass.id);
      fetchTasks(selectedClass.id, selectedClass.classCode);
    }
  }, [selectedClass]);

  const fetchClasses = async () => {
    setIsLoadingClasses(true);
    try {
      const res = await fetch("/api/teacher/classes");
      const data = await res.json();
      if (res.ok && data.classes) {
        setClasses(data.classes);
        if (data.classes.length > 0) {
          // Keep current selected class or pick first
          setSelectedClass((prev) => {
            if (!prev) return data.classes[0];
            const found = data.classes.find((c: ClassroomItem) => c.id === prev.id);
            return found || data.classes[0];
          });
        }
      }
    } catch (err) {
      console.warn("Gagal fetch classes:", err);
    } finally {
      setIsLoadingClasses(false);
    }
  };

  const fetchMembers = async (classroomId: string) => {
    setIsLoadingMembers(true);
    try {
      const res = await fetch(`/api/teacher/classes/${classroomId}/members`);
      const data = await res.json();
      if (res.ok) {
        setClassMembers(data.members || []);
        setAvailableStudents(data.availableStudents || []);
      }
    } catch (err) {
      console.warn("Gagal fetch class members:", err);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const fetchTasks = async (classroomId: string, classCode: string) => {
    setIsLoadingRooms(true);
    try {
      const res = await fetch(`/api/teacher/rooms?classroomId=${classroomId}&classCode=${classCode}`);
      const data = await res.json();
      if (res.ok && data.rooms) {
        setRooms(data.rooms);
      }
    } catch (err) {
      console.warn("Gagal fetch tasks:", err);
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

  // Kick student from class
  const handleConfirmKick = async () => {
    if (!memberToKick || !selectedClass) return;
    setIsKicking(true);
    try {
      const res = await fetch(
        `/api/teacher/classes/${selectedClass.id}/members?memberId=${memberToKick.memberId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengeluarkan siswa.");

      setCreateSuccessMsg(`Siswa [${memberToKick.studentName}] berhasil dikeluarkan dari kelas.`);
      await fetchMembers(selectedClass.id);
      await fetchClasses();
      setMemberToKick(null);
    } catch (err: any) {
      alert(err.message || "Gagal mengeluarkan siswa.");
    } finally {
      setIsKicking(false);
    }
  };

  // Add student manually
  const handleAddStudentManual = async (student: AvailableStudentItem) => {
    if (!selectedClass) return;
    setIsAddingMember(true);
    try {
      const res = await fetch(`/api/teacher/classes/${selectedClass.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: student.userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menambahkan siswa.");

      setCreateSuccessMsg(`Siswa [${student.studentName}] berhasil dimasukkan ke kelas!`);
      await fetchMembers(selectedClass.id);
      await fetchClasses();
    } catch (err: any) {
      alert(err.message || "Gagal menambahkan siswa.");
    } finally {
      setIsAddingMember(false);
    }
  };

  // Create new classroom
  const handleCreateNewClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) {
      alert("Nama kelas wajib diisi.");
      return;
    }

    setIsCreatingClass(true);
    try {
      const res = await fetch("/api/teacher/classes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClassName.trim(),
          customPin: newClassPin.trim() || undefined,
          gradeLevel: newClassGrade,
          description: newClassDesc,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat kelas.");

      setCreateSuccessMsg(`Kelas [${data.classroom.name}] berhasil dibuat dengan PIN [${data.classroom.classCode}]!`);
      await fetchClasses();
      setShowCreateClassModal(false);
      setNewClassName("");
      setNewClassPin("");
    } catch (err: any) {
      alert(err.message || "Gagal membuat kelas.");
    } finally {
      setIsCreatingClass(false);
    }
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

  // Save Task to Selected Class
  const handleSaveNewTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) {
      alert("Pilih kelas terlebih dahulu.");
      return;
    }
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
          classroomId: selectedClass.id,
          customPin: selectedClass.classCode,
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
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan tugas.");

      setCreateSuccessMsg(`Tugas [${newTopic}] berhasil ditambahkan ke kelas [${selectedClass.name}]!`);
      await fetchTasks(selectedClass.id, selectedClass.classCode);
      await fetchClasses();
      setActiveTab("tasks");
    } catch (err: any) {
      alert(err.message || "Gagal menyimpan tugas.");
    } finally {
      setIsSavingRoom(false);
    }
  };

  // Open Edit Modal & Populate Form
  const handleOpenEditModal = (room: TeacherRoomItem) => {
    setEditingRoom(room);
    setEditTitle(room.title || "");
    setEditRoomCode(room.roomCode || selectedClass?.classCode || "");
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
    if (!editingRoom || !selectedClass) return;
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
      if (!res.ok) throw new Error(data.error || "Gagal memperbarui tugas.");

      setCreateSuccessMsg(`Tugas [${editTitle}] berhasil diperbarui!`);
      await fetchTasks(selectedClass.id, selectedClass.classCode);
      setEditingRoom(null);
    } catch (err: any) {
      alert(err.message || "Gagal memperbarui tugas.");
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
    if (!roomToDelete || !selectedClass) return;
    setIsDeletingRoom(true);
    try {
      const res = await fetch(`/api/teacher/rooms?id=${roomToDelete.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menghapus tugas.");

      setCreateSuccessMsg(`Tugas [${roomToDelete.title}] berhasil dihapus.`);
      await fetchTasks(selectedClass.id, selectedClass.classCode);
      await fetchClasses();
      setRoomToDelete(null);
    } catch (err: any) {
      alert(err.message || "Gagal menghapus tugas.");
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
            onClick={() => {
              fetchClasses();
              if (selectedClass) {
                fetchMembers(selectedClass.id);
                fetchTasks(selectedClass.id, selectedClass.classCode);
              }
              fetchHeatmapData();
            }}
            disabled={isLoadingClasses || isLoadingRooms}
            className="brutal-btn-white px-3.5 py-2 text-xs font-black uppercase flex items-center gap-1.5"
            title="Sinkronisasi Data Terbaru"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${(isLoadingClasses || isLoadingRooms) ? "animate-spin" : ""}`} />
            <span>[ SINKRONISASI DATA ]</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("builder")}
            className="brutal-btn-yellow px-4 py-2 text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>[ + BUAT TUGAS BARU ]</span>
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

      {/* 5 Essential Tabs Control */}
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-zinc-300 pb-3 font-mono">
        <button
          onClick={() => setActiveTab("classes")}
          className={`px-4 py-2 font-mono text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
            activeTab === "classes" ? "brutal-btn-yellow" : "brutal-btn-white"
          }`}
        >
          <GraduationCap className="w-3.5 h-3.5" />
          <span>[01] KELAS & ROSTER SISWA ({classMembers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("tasks")}
          className={`px-4 py-2 font-mono text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
            activeTab === "tasks" ? "brutal-btn-cyan" : "brutal-btn-white"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>[02] TUGAS & MISI KELAS ({rooms.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("builder")}
          className={`px-4 py-2 font-mono text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
            activeTab === "builder" ? "brutal-btn-yellow" : "brutal-btn-white"
          }`}
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>[03] BUAT TUGAS BARU</span>
        </button>

        <button
          onClick={() => setActiveTab("grader")}
          className={`px-4 py-2 font-mono text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
            activeTab === "grader" ? "brutal-btn-cyan" : "brutal-btn-white"
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>[04] REKAP NILAI SISWA ({evaluations.length})</span>
        </button>

        <button
          onClick={() => setActiveTab("diagnostics")}
          className={`px-4 py-2 font-mono text-xs font-black uppercase transition-all flex items-center gap-1.5 ${
            activeTab === "diagnostics" ? "brutal-btn-yellow" : "brutal-btn-white"
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>[05] ANALISIS DIAGNOSTIK</span>
        </button>
      </div>

      {/* =====================================================================
          TAB 1: KELAS & ROSTER SISWA (CLASSROOM & STUDENTS ROSTER)
          ===================================================================== */}
      {activeTab === "classes" && (
        <div className="space-y-6">
          {/* Active Class Card & Switcher */}
          <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-zinc-200 pb-4">
              <div>
                <span className="text-xs font-black text-cyan-800 uppercase tracking-wider block">
                  [ KELAS YANG SEDANG DIAJAR ]
                </span>
                <div className="flex items-center gap-3 mt-1">
                  <h2 className="text-xl sm:text-2xl font-black text-black uppercase">
                    {selectedClass ? selectedClass.name : "Kelas Belum Dipilih"}
                  </h2>
                  {selectedClass && (
                    <span className="px-2.5 py-1 text-xs font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-700">
                      STATUS: AKTIF
                    </span>
                  )}
                </div>
                <p className="text-xs text-zinc-600 mt-1">
                  Jenjang: <strong>{selectedClass?.gradeLevel || "Kelas 10 SMK"}</strong> • Tahun Ajaran: <strong>{selectedClass?.academicYear || "2026/2027"}</strong> • Guru: <strong>{selectedClass?.teacherName || "Budi Santoso, S.Pd"}</strong>
                </p>
              </div>

              {/* Action Buttons for Classroom */}
              <div className="flex flex-wrap items-center gap-2.5">
                {selectedClass && (
                  <button
                    type="button"
                    onClick={() => setProjectorModalClass(selectedClass)}
                    className="brutal-btn-yellow px-4 py-2.5 text-xs font-black uppercase flex items-center gap-2 shadow-[2px_2px_0px_#000000]"
                  >
                    <Monitor className="w-4 h-4" />
                    <span>[ 🖥️ PROYEKTOR PIN KELAS ]</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowCreateClassModal(true)}
                  className="brutal-btn-white px-4 py-2.5 text-xs font-black uppercase flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>[ + BUAT KELAS BARU ]</span>
                </button>
              </div>
            </div>

            {/* Big PIN Bar */}
            {selectedClass && (
              <div className="p-4 bg-zinc-50 border-2 border-black flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-zinc-600 uppercase">
                    KODE / PIN MASUK KELAS UNTUK SISWA:
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl sm:text-3xl font-black tracking-widest bg-[#facc15] text-black px-4 py-1 border-2 border-black shadow-[2px_2px_0px_#000000]">
                      {selectedClass.classCode}
                    </span>
                    <button
                      onClick={() => handleCopyPin(selectedClass.classCode)}
                      className="brutal-btn-white px-3 py-1.5 text-xs font-bold uppercase flex items-center gap-1"
                      title="Salin PIN ke Clipboard"
                    >
                      {copiedPin === selectedClass.classCode ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-black">TERSALIN!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span>SALIN PIN</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-bold text-zinc-700">
                  <span>👥 <strong>{classMembers.length}</strong> Siswa Terdaftar</span>
                  <span>📚 <strong>{rooms.length}</strong> Tugas Speaking Aktif</span>
                </div>
              </div>
            )}

            {/* Classrooms Switcher if Multiple */}
            {classes.length > 1 && (
              <div className="flex items-center gap-2 pt-2 text-xs">
                <span className="font-bold text-zinc-600 uppercase">Ganti Kelas:</span>
                <div className="flex flex-wrap gap-2">
                  {classes.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedClass(c)}
                      className={`px-3 py-1 font-mono text-xs font-bold uppercase border border-black ${
                        selectedClass?.id === c.id ? "bg-[#facc15] font-black" : "bg-white"
                      }`}
                    >
                      [{c.classCode}] {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Roster Murid yang Bergabung */}
          <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-200 pb-3">
              <div>
                <span className="text-xs font-black text-cyan-800 uppercase tracking-wider block">
                  [ ROSTER ANGGOTA KELAS ]
                </span>
                <h3 className="text-lg font-black uppercase text-black">
                  Daftar Siswa yang Tergabung ({classMembers.length} Murid)
                </h3>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMemberModal(true)}
                  className="brutal-btn-cyan px-4 py-2 text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>[ ➕ TAMBAH SISWA MANUAL ]</span>
                </button>
              </div>
            </div>

            {isLoadingMembers ? (
              <div className="py-12 text-center text-xs font-black uppercase">
                [ MEMUAT DATA SISWA KELAS... ]
              </div>
            ) : classMembers.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-zinc-300 p-6 space-y-2">
                <Users className="w-8 h-8 mx-auto text-zinc-400" />
                <p className="text-xs font-bold text-zinc-600">
                  Belum ada murid yang bergabung di kelas ini.
                </p>
                <p className="text-[11px] text-zinc-500">
                  Bagikan PIN <strong>[{selectedClass?.classCode}]</strong> ke siswa atau klik tombol <strong>[+ Tambah Siswa Manual]</strong> di atas.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto border-2 border-black">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#facc15] border-b-2 border-black text-black font-black uppercase">
                      <th className="p-3 border-r border-black w-12 text-center">NO</th>
                      <th className="p-3 border-r border-black">NAMA SISWA</th>
                      <th className="p-3 border-r border-black">USERNAME & EMAIL</th>
                      <th className="p-3 border-r border-black text-center">TUGAS SELESAI</th>
                      <th className="p-3 border-r border-black">STATUS</th>
                      <th className="p-3 text-center w-36">AKSI GURU</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black font-mono">
                    {classMembers.map((m, idx) => (
                      <tr key={m.memberId || idx} className="hover:bg-yellow-50 transition-colors">
                        <td className="p-3 border-r border-black text-center font-bold">{idx + 1}</td>
                        <td className="p-3 border-r border-black font-black text-black">
                          {m.studentName}
                        </td>
                        <td className="p-3 border-r border-black text-zinc-600">
                          @{m.studentUsername} {m.email ? `• ${m.email}` : ""}
                        </td>
                        <td className="p-3 border-r border-black text-center font-bold text-emerald-800">
                          {m.completedTasksCount || 0} / {rooms.length} Misi
                        </td>
                        <td className="p-3 border-r border-black">
                          <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase border border-emerald-600">
                            TERDAFTAR
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => setMemberToKick(m)}
                            className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 border border-red-700 text-[11px] font-black uppercase flex items-center gap-1 mx-auto transition-colors"
                            title="Keluarkan siswa dari kelas ini"
                          >
                            <Trash2 className="w-3 h-3 text-red-700" />
                            <span>[ KICK ]</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 2: TUGAS & COURSE KELAS (ASSIGNMENTS LIST)
          ===================================================================== */}
      {activeTab === "tasks" && (
        <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-zinc-200 pb-4">
            <div>
              <span className="text-xs font-black uppercase text-cyan-800">
                [DAFTAR TUGAS // KELAS: {selectedClass?.name}]
              </span>
              <h2 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight">
                Misi Speaking & Kuis Terstruktur ({rooms.length} Tugas)
              </h2>
              <p className="text-xs text-zinc-600 mt-0.5">
                Siswa di kelas ini dapat memilih dan mengerjakan tugas-tugas di bawah ini.
              </p>
            </div>

            <button
              onClick={() => setActiveTab("builder")}
              className="brutal-btn-yellow px-4 py-2.5 text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>[ + BUAT TUGAS BARU ]</span>
            </button>
          </div>

          {isLoadingRooms ? (
            <div className="py-12 text-center font-mono text-xs font-black uppercase">
              [ MEMUAT DAFTAR TUGAS KELAS... ]
            </div>
          ) : rooms.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-zinc-300 space-y-3 font-mono">
              <BookOpen className="w-10 h-10 mx-auto text-zinc-400 stroke-[1.5]" />
              <p className="text-xs font-bold text-zinc-600">
                Belum ada tugas yang ditugaskan di kelas ini.
              </p>
              <button
                onClick={() => setActiveTab("builder")}
                className="brutal-btn-yellow px-5 py-2.5 text-xs font-black uppercase inline-flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>[ BUAT TUGAS PERTAMA SEKARANG ]</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {rooms.map((room, idx) => (
                <div
                  key={room.id}
                  className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000000] flex flex-col justify-between space-y-4 hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-cyan-100 text-cyan-900 border border-cyan-800">
                        TUGAS #{idx + 1} • KELAS {selectedClass?.classCode}
                      </span>
                      <span className="text-xs font-black uppercase text-zinc-500">
                        Target CEFR: [{room.difficultyLevel}]
                      </span>
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
                      <span className="text-zinc-600 font-bold">
                        NPC: <strong>{room.npcName || "Mr. Arthur"}</strong>
                      </span>
                      <span className="font-black text-emerald-800">
                        {room.speakingCount || room.submissionsCount || 0} Siswa Selesai
                      </span>
                    </div>
                  </div>

                  {/* Actions Bar */}
                  <div className="pt-3 border-t-2 border-zinc-200 flex items-center gap-2 font-mono">
                    <button
                      onClick={() => handleOpenEditModal(room)}
                      className="flex-1 brutal-btn-cyan py-2 text-xs font-black uppercase flex items-center justify-center gap-1.5"
                      title="Edit Judul, Skenario, dan Soal Kuis"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      <span>[ ✏️ EDIT TUGAS ]</span>
                    </button>
                    <button
                      onClick={() => setRoomToDelete(room)}
                      className="px-3.5 py-2 border-2 border-red-700 bg-red-100 hover:bg-red-200 text-red-900 text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000000] transition-colors"
                      title="Hapus Tugas Kelas"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-700" />
                      <span>[ HAPUS ]</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 3: FORM PEMBUAT TUGAS MANDIRI / AI (BUILDER)
          ===================================================================== */}
      {activeTab === "builder" && (
        <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-200 pb-4">
            <div>
              <span className="font-mono text-xs font-black uppercase text-amber-800">
                [FORMULIR PENUGASAN // KELAS: {selectedClass?.name || "Semua Kelas"}]
              </span>
              <h2 className="font-black text-xl sm:text-2xl text-black uppercase tracking-tight">
                Buat Tugas Speaking & Kuis Mandiri Baru
              </h2>
              <p className="text-xs text-zinc-600 mt-0.5">
                Tugas ini akan otomatis ditambahkan ke kelas <strong>[{selectedClass?.classCode}]</strong> dan langsung muncul di daftar tugas murid.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAutoGenerateAi}
              disabled={isGeneratingAi}
              className="brutal-btn-yellow px-4 py-2.5 text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
            >
              <Sparkles className={`w-3.5 h-3.5 text-black ${isGeneratingAi ? "animate-spin" : ""}`} />
              <span>{isGeneratingAi ? "[ MENYUSUN DRAF AI... ]" : "[ ⚡ BUAT DRAF CEPAT DENGAN AI ]"}</span>
            </button>
          </div>

          <form onSubmit={handleSaveNewTask} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black uppercase block mb-1">
                  Kelas Tujuan Penugasan:
                </label>
                <input
                  type="text"
                  disabled
                  value={`[${selectedClass?.classCode}] ${selectedClass?.name}`}
                  className="w-full border-2 border-black p-2.5 font-mono text-xs bg-zinc-100 text-black font-black uppercase"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase block mb-1">
                  Target CEFR Level:
                </label>
                <select
                  value={newDifficulty}
                  onChange={(e) => setNewDifficulty(e.target.value)}
                  className="w-full border-2 border-black p-2.5 font-mono text-xs bg-white outline-hidden font-bold"
                >
                  <option value="A1">A1 - Pemula Dasar</option>
                  <option value="A2">A2 - Elementary</option>
                  <option value="B1">B1 - Intermediate</option>
                  <option value="B2">B2 - Upper Intermediate</option>
                  <option value="C1">C1 - Advanced Professional</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-black uppercase block mb-1">
                Judul Materi / Skenario Kasus:
              </label>
              <input
                type="text"
                required
                value={newTopic}
                onChange={(e) => setNewTopic(e.target.value)}
                placeholder="Contoh: Negosiasi Produk Ramah Lingkungan..."
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
                value={newCaseStory}
                onChange={(e) => setNewCaseStory(e.target.value)}
                className="w-full border-2 border-black p-2.5 font-mono text-xs bg-white outline-hidden leading-relaxed"
                placeholder="Ceritakan latar belakang kasus untuk memancing respon speaking siswa..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black uppercase block mb-1">
                  Nama Karakter Penguji (NPC AI):
                </label>
                <input
                  type="text"
                  value={newNpcName}
                  onChange={(e) => setNewNpcName(e.target.value)}
                  className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-hidden"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase block mb-1">
                  Persona & Sikap Penguji:
                </label>
                <input
                  type="text"
                  value={newNpcPersona}
                  onChange={(e) => setNewNpcPersona(e.target.value)}
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
                  value={newRequiredHint}
                  onChange={(e) => setNewRequiredHint(e.target.value)}
                  className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-hidden"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase block mb-1">
                  Target Kosakata Wajib (Pisahkan Koma):
                </label>
                <input
                  type="text"
                  value={newTargetVocab}
                  onChange={(e) => setNewTargetVocab(e.target.value)}
                  className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-hidden"
                />
              </div>
            </div>

            {/* Soal Kuis Pilihan Ganda */}
            <div className="border-t-2 border-black pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-black uppercase block text-black">
                    Butir Soal Kuis Pilihan Ganda ({newQuizQuestions.length} Soal)
                  </span>
                  <span className="text-[11px] text-zinc-500">
                    Siswa menjawab soal ini sebelum atau sesudah sesi speaking.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAddQuestion}
                  className="brutal-btn-white px-3 py-1.5 text-xs font-black uppercase flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>[ + Tambah Soal ]</span>
                </button>
              </div>

              <div className="space-y-4">
                {newQuizQuestions.map((qItem, qIdx) => (
                  <div key={qIdx} className="border-2 border-black bg-zinc-50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black uppercase bg-black text-white px-2 py-0.5">
                        Soal #{qIdx + 1}
                      </span>
                      {newQuizQuestions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveQuestion(qIdx)}
                          className="text-red-700 hover:text-red-900 text-xs font-black flex items-center gap-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Hapus Soal</span>
                        </button>
                      )}
                    </div>

                    <input
                      type="text"
                      value={qItem.question}
                      onChange={(e) => {
                        const next = [...newQuizQuestions];
                        next[qIdx].question = e.target.value;
                        setNewQuizQuestions(next);
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
                            onChange={(e) => {
                              const next = [...newQuizQuestions];
                              const opts = [...next[qIdx].options] as [string, string, string, string];
                              opts[optIdx] = e.target.value;
                              next[qIdx] = { ...next[qIdx], options: opts };
                              setNewQuizQuestions(next);
                            }}
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
                            const next = [...newQuizQuestions];
                            next[qIdx].correctIndex = parseInt(e.target.value);
                            setNewQuizQuestions(next);
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
                            const next = [...newQuizQuestions];
                            next[qIdx].explanation = e.target.value;
                            setNewQuizQuestions(next);
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

            <div className="border-t-2 border-black pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSavingRoom}
                className="brutal-btn-yellow px-8 py-3 text-xs font-black uppercase flex items-center gap-2 shadow-[3px_3px_0px_#000000]"
              >
                {isSavingRoom ? (
                  <span>[ MENYIMPAN TUGAS KE KELAS... ]</span>
                ) : (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>[ SIMPAN TUGAS & TUGASKAN KE KELAS ]</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          TAB 4: REKAP NILAI SISWA (GRADEBOOK E-RAPOR)
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

            <button
              onClick={handleExportCsv}
              className="brutal-btn-yellow px-4 py-2 text-xs font-mono font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
            >
              <Download className="w-4 h-4" />
              <span>[ UNDUH REKAP CSV (E-RAPOR) ]</span>
            </button>
          </div>

          {/* Filter per Task */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <span className="font-bold text-zinc-600 uppercase">Filter Tugas:</span>
            <button
              onClick={() => setFilterRoomCode("ALL")}
              className={`px-2.5 py-1 text-xs font-bold border border-black ${
                filterRoomCode === "ALL" ? "bg-black text-white" : "bg-white"
              }`}
            >
              SEMUA TUGAS ({evaluations.length})
            </button>
            {rooms.map((r) => (
              <button
                key={r.id}
                onClick={() => setFilterRoomCode(r.roomCode)}
                className={`px-2.5 py-1 text-xs font-bold border border-black truncate max-w-xs ${
                  filterRoomCode === r.roomCode ? "bg-black text-white" : "bg-white"
                }`}
              >
                {r.title}
              </button>
            ))}
          </div>

          {/* Table */}
          {isLoadingHeatmap ? (
            <div className="py-12 text-center text-xs font-black uppercase">
              [ MEMUAT DATA EVALUASI MARIADB... ]
            </div>
          ) : evaluations.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500 font-bold uppercase">
              [ BELUM ADA SESI EVALUASI SISWA YANG SELESAI ]
            </div>
          ) : (
            <div className="overflow-x-auto border-2 border-black">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead>
                  <tr className="bg-[#22d3ee] border-b-2 border-black text-black font-black uppercase">
                    <th className="p-2.5 border-r border-black w-10 text-center">NO</th>
                    <th className="p-2.5 border-r border-black">NAMA SISWA</th>
                    <th className="p-2.5 border-r border-black">TUGAS / ROOM</th>
                    <th className="p-2.5 border-r border-black text-center">CEFR</th>
                    <th className="p-2.5 border-r border-black text-center">SKOR</th>
                    <th className="p-2.5 border-r border-black text-center">FLUENCY</th>
                    <th className="p-2.5 border-r border-black text-center">PRONUN</th>
                    <th className="p-2.5 border-r border-black text-center">VOCAB</th>
                    <th className="p-2.5 border-r border-black text-center">GRAMMAR</th>
                    <th className="p-2.5 text-center">BUKTI EVALUASI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black font-mono">
                  {evaluations.map((ev, idx) => (
                    <tr key={ev.id || (ev as any).sessionId || idx} className="hover:bg-cyan-50">
                      <td className="p-2.5 border-r border-black text-center font-bold">{idx + 1}</td>
                      <td className="p-2.5 border-r border-black font-black">{ev.studentName}</td>
                      <td className="p-2.5 border-r border-black text-zinc-600 truncate max-w-xs">{ev.questTitle}</td>
                      <td className="p-2.5 border-r border-black text-center font-black bg-yellow-50">{ev.cefrLevel}</td>
                      <td className="p-2.5 border-r border-black text-center font-black text-base">{ev.overallScore}</td>
                      <td className="p-2.5 border-r border-black text-center">{ev.fluencyScore}%</td>
                      <td className="p-2.5 border-r border-black text-center">{ev.pronunciationScore}%</td>
                      <td className="p-2.5 border-r border-black text-center">{ev.vocabularyScore}%</td>
                      <td className="p-2.5 border-r border-black text-center">{ev.grammarScore}%</td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => setSelectedEvaluation(ev)}
                          className="px-2.5 py-1 bg-black text-white hover:bg-zinc-800 text-[11px] font-bold uppercase inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          <span>[ TRANSKRIP ]</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =====================================================================
          TAB 5: ANALISIS DIAGNOSTIK & REMEDIAL
          ===================================================================== */}
      {activeTab === "diagnostics" && (
        <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-200 pb-3">
            <div>
              <span className="font-mono text-xs font-black uppercase text-red-700">
                [ANALISIS DIAGNOSTIK KELEMAHAN KOLEKTIF KELAS]
              </span>
              <h2 className="font-black text-xl text-black uppercase tracking-tight">
                Pola Kesalahan Umum & Rekomendasi Remedial
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {misconceptions.map((item) => (
              <div key={item.id} className="border-2 border-black bg-zinc-50 p-4 space-y-3 font-mono">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 bg-black text-white text-[10px] font-black uppercase">
                    {item.category}
                  </span>
                  <span className="text-xs font-bold text-red-700">
                    {item.affectedPercentage}% Siswa Terdampak
                  </span>
                </div>
                <h4 className="font-black text-sm text-black uppercase">{item.errorDescription}</h4>
                <div className="p-2 bg-red-100 border border-red-400 text-xs text-red-900">
                  <span className="font-bold">Contoh Salah:</span> "{item.exampleMistake}"
                </div>
                <div className="p-2 bg-emerald-100 border border-emerald-400 text-xs text-emerald-900">
                  <span className="font-bold">Bentuk Benar:</span> "{item.correctForm}"
                </div>
                <p className="text-[11px] text-zinc-600 italic">
                  💡 Saran Guru: {item.recommendedWarmup}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: FULLSCREEN PROYEKTOR PIN KELAS
          ===================================================================== */}
      {projectorModalClass && (
        <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 font-mono">
          <div className="bg-white border-4 border-black w-full max-w-2xl shadow-[8px_8px_0px_#000000] p-6 sm:p-8 space-y-6 text-black text-center">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <span className="text-xs font-black uppercase bg-[#facc15] px-3 py-1 border border-black">
                [MODE PROYEKTOR KELAS // TEMBAKKAN KE LAYAR DEPAN]
              </span>
              <button
                onClick={() => setProjectorModalClass(null)}
                className="p-1.5 bg-black text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-zinc-500 block">
                MASUKKAN PIN INI DI HP / LAPTOP UNTUK GABUNG KE KELAS:
              </span>
              <div className="text-5xl sm:text-7xl font-black tracking-widest text-black bg-[#facc15] p-5 border-4 border-black shadow-[6px_6px_0px_#000000] inline-block">
                {projectorModalClass.classCode}
              </div>
            </div>

            <div className="p-4 bg-zinc-50 border-2 border-black text-left space-y-1.5 text-xs">
              <span className="font-black text-black uppercase block">Nama Rombongan Belajar:</span>
              <h3 className="text-base font-black text-black">{projectorModalClass.name}</h3>
              <p className="text-zinc-600 text-xs">
                Guru: <strong>{projectorModalClass.teacherName}</strong> • {rooms.length} Tugas Speaking Aktif Tersedia
              </p>
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
                <p className="text-[11px] text-zinc-600">Ketik [{projectorModalClass.classCode}] & pilih tugas!</p>
              </div>
            </div>

            <div className="pt-2 flex justify-center">
              <button
                onClick={() => setProjectorModalClass(null)}
                className="brutal-btn-yellow px-8 py-3 text-xs font-black uppercase shadow-[3px_3px_0px_#000000]"
              >
                [ TUTUP TAMPILAN PROYEKTOR ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: TAMBAH SISWA SECARA MANUAL
          ===================================================================== */}
      {showAddMemberModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 font-mono">
          <div className="border-4 border-black bg-white max-w-lg w-full p-6 shadow-[8px_8px_0px_#000000] space-y-4 text-black">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div>
                <span className="text-[10px] font-black uppercase bg-[#22d3ee] px-2 py-0.5 border border-black">
                  [MANUAL ENROLLMENT]
                </span>
                <h3 className="text-base font-black uppercase text-black mt-1">
                  Tambahkan Siswa ke {selectedClass?.name}
                </h3>
              </div>
              <button
                onClick={() => setShowAddMemberModal(false)}
                className="p-1 bg-black text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-zinc-600">
              Pilih siswa terdaftar di database sekolah untuk langsung dimasukkan ke dalam kelas ini tanpa perlu siswa mengetik PIN:
            </p>

            <div className="max-h-64 overflow-y-auto space-y-2 border-2 border-black p-2 bg-zinc-50">
              {availableStudents.length === 0 ? (
                <div className="p-4 text-center text-xs text-zinc-500 font-bold uppercase">
                  Semua siswa terdaftar sudah bergabung di kelas ini.
                </div>
              ) : (
                availableStudents.map((s) => (
                  <div
                    key={s.userId}
                    className="p-2.5 bg-white border border-black flex items-center justify-between text-xs hover:bg-yellow-50"
                  >
                    <div>
                      <span className="font-black text-black block">{s.studentName}</span>
                      <span className="text-[11px] text-zinc-500">@{s.studentUsername} • {s.email}</span>
                    </div>
                    <button
                      type="button"
                      disabled={isAddingMember}
                      onClick={() => handleAddStudentManual(s)}
                      className="brutal-btn-yellow px-3 py-1 text-xs font-black uppercase flex items-center gap-1"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>[ + MASUKKAN ]</span>
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowAddMemberModal(false)}
                className="brutal-btn-white px-5 py-2 text-xs font-black uppercase"
              >
                [ TUTUP ]
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: KONFIRMASI KICK MURID
          ===================================================================== */}
      {memberToKick && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 font-mono">
          <div className="border-4 border-black bg-white max-w-md w-full p-6 shadow-[8px_8px_0px_#000000] space-y-4 text-black">
            <div className="flex items-center gap-2">
              <span className="p-2 bg-red-100 border-2 border-red-700 text-red-700">
                <AlertCircle className="w-5 h-5 stroke-[2.5]" />
              </span>
              <div>
                <span className="text-[10px] font-black uppercase text-red-700 tracking-wider block">
                  [KONFIRMASI KICK MURID]
                </span>
                <h2 className="text-base font-black uppercase text-black">
                  Keluarkan Siswa dari Kelas?
                </h2>
              </div>
            </div>

            <div className="p-3.5 bg-red-50 border-2 border-red-700 text-xs text-red-950 space-y-1">
              <p>
                Anda akan mengeluarkan siswa: <strong>{memberToKick.studentName} (@{memberToKick.studentUsername})</strong> dari rombongan belajar <strong>{selectedClass?.name}</strong>.
              </p>
              <p className="text-[11px] text-zinc-600 pt-1">
                Siswa tidak akan lagi memiliki akses ke tugas-tugas di kelas ini kecuali bergabung kembali dengan PIN.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setMemberToKick(null)}
                disabled={isKicking}
                className="brutal-btn-white px-4 py-2 text-xs font-black uppercase"
              >
                [ BATAL ]
              </button>
              <button
                type="button"
                onClick={handleConfirmKick}
                disabled={isKicking}
                className="px-5 py-2 border-2 border-black bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isKicking ? "[ MENGELUARKAN... ]" : "[ YA, KICK SEKARANG ]"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: BUAT KELAS BARU
          ===================================================================== */}
      {showCreateClassModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 font-mono">
          <div className="border-4 border-black bg-white max-w-md w-full p-6 shadow-[8px_8px_0px_#000000] space-y-4 text-black">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div>
                <span className="text-[10px] font-black uppercase bg-[#facc15] px-2 py-0.5 border border-black">
                  [KELAS BARU]
                </span>
                <h3 className="text-base font-black uppercase text-black mt-1">
                  Buat Rombongan Belajar Kelas Baru
                </h3>
              </div>
              <button
                onClick={() => setShowCreateClassModal(false)}
                className="p-1 bg-black text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewClassroom} className="space-y-3.5 text-xs">
              <div>
                <label className="font-black uppercase block mb-1">
                  Nama Kelas:
                </label>
                <input
                  type="text"
                  required
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Contoh: Kelas 11 Pemasaran 1"
                  className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-hidden font-bold"
                />
              </div>

              <div>
                <label className="font-black uppercase block mb-1">
                  Kustom PIN Kelas (Opsional, kosongkan untuk acak):
                </label>
                <input
                  type="text"
                  maxLength={10}
                  value={newClassPin}
                  onChange={(e) => setNewClassPin(e.target.value.toUpperCase())}
                  placeholder="Contoh: PM101"
                  className="w-full border-2 border-black p-2 font-mono text-xs uppercase bg-white outline-hidden"
                />
              </div>

              <div>
                <label className="font-black uppercase block mb-1">
                  Tingkat Jenjang:
                </label>
                <select
                  value={newClassGrade}
                  onChange={(e) => setNewClassGrade(e.target.value)}
                  className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-hidden font-bold"
                >
                  <option value="Kelas 10 SMK">Kelas 10 SMK</option>
                  <option value="Kelas 11 SMK">Kelas 11 SMK</option>
                  <option value="Kelas 12 SMK">Kelas 12 SMK</option>
                  <option value="Kelas 10 SMA">Kelas 10 SMA</option>
                  <option value="Kelas 11 SMA">Kelas 11 SMA</option>
                  <option value="Kelas 12 SMA">Kelas 12 SMA</option>
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateClassModal(false)}
                  className="brutal-btn-white px-4 py-2 text-xs font-black uppercase"
                >
                  [ BATAL ]
                </button>
                <button
                  type="submit"
                  disabled={isCreatingClass}
                  className="brutal-btn-yellow px-5 py-2 text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{isCreatingClass ? "[ MENYIMPAN... ]" : "[ SIMPAN KELAS ]"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: EDIT TUGAS KELAS & KUIS
          ===================================================================== */}
      {editingRoom && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 font-mono overflow-y-auto">
          <div className="border-4 border-black bg-white max-w-3xl w-full my-8 p-6 shadow-[8px_8px_0px_#000000] space-y-6 text-black max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b-2 border-black pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase bg-[#22d3ee] text-black px-2 py-0.5 border border-black">
                    [EDIT TUGAS KELAS]
                  </span>
                  <span className="text-xs font-black uppercase text-zinc-500">
                    PIN: [{editRoomCode}]
                  </span>
                </div>
                <h2 className="text-lg font-black uppercase tracking-tight mt-1">
                  Sunting Skenario & Kuis Tugas Kelas
                </h2>
              </div>
              <button
                onClick={() => setEditingRoom(null)}
                className="p-1.5 bg-black text-white hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditedRoom} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    PIN Kelas:
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editRoomCode}
                    className="w-full border-2 border-zinc-300 p-2.5 font-mono text-xs bg-zinc-100 text-zinc-500 cursor-not-allowed font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-black uppercase block mb-1">
                  Judul Tugas Misi:
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
                  Skenario Kasus Nyata:
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
                    Nama NPC Penguji:
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
                    Persona NPC:
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
                    Target Kosakata (Pisahkan Koma):
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
                  <span className="text-xs font-black uppercase block text-black">
                    Soal Kuis Pilihan Ganda ({editQuizQuestions.length} Butir)
                  </span>
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
                            Kunci Jawaban:
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
                            Penjelasan:
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
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

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
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>[ SIMPAN PERUBAHAN TUGAS ]</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =====================================================================
          MODAL: KONFIRMASI HAPUS TUGAS
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
                  [PERINGATAN HAPUS TUGAS]
                </span>
                <h2 className="text-base font-black uppercase text-black">
                  Hapus Tugas dari Kelas?
                </h2>
              </div>
            </div>

            <div className="p-3.5 bg-red-50 border-2 border-red-700 text-xs text-red-950 space-y-1">
              <p>
                Anda akan menghapus tugas:
                <strong className="block text-black font-black mt-1">
                  {roomToDelete.title}
                </strong>
              </p>
              <p className="text-[11px] text-red-800 leading-relaxed font-bold pt-1">
                ⚠️ Peringatan: Data nilai dan transkrip percakapan siswa pada tugas ini akan ikut terhapus dari database.
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

      {/* =====================================================================
          MODAL: BUKTI TRANSKRIP & EVALUASI AI SISWA
          ===================================================================== */}
      {selectedEvaluation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-mono">
          <div className="border-4 border-black bg-white max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-[8px_8px_0px_#000000] space-y-5 text-black">
            <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-3">
              <div>
                <span className="text-[10px] font-black uppercase bg-black text-[#facc15] px-2 py-0.5">
                  BUKTI TRANSKRIP PERCAKAPAN & EVALUASI
                </span>
                <h3 className="text-lg font-black text-black uppercase mt-1">
                  {selectedEvaluation.studentName} • {selectedEvaluation.questTitle}
                </h3>
              </div>
              <button
                onClick={() => setSelectedEvaluation(null)}
                className="p-1 bg-black text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Score Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
              <div className="p-2.5 bg-yellow-100 border border-black">
                <span className="block text-[10px] font-bold text-zinc-600 uppercase">CEFR LEVEL</span>
                <span className="text-xl font-black text-black">{selectedEvaluation.cefrLevel}</span>
              </div>
              <div className="p-2.5 bg-cyan-100 border border-black">
                <span className="block text-[10px] font-bold text-zinc-600 uppercase">SKOR AKHIR</span>
                <span className="text-xl font-black text-cyan-900">{selectedEvaluation.overallScore}/100</span>
              </div>
              <div className="p-2.5 bg-zinc-100 border border-black">
                <span className="block text-[10px] font-bold text-zinc-600 uppercase">KELANCARAN</span>
                <span className="text-xl font-black text-zinc-900">{selectedEvaluation.fluencyScore}%</span>
              </div>
              <div className="p-2.5 bg-zinc-100 border border-black">
                <span className="block text-[10px] font-bold text-zinc-600 uppercase">TATA BAHASA</span>
                <span className="text-xl font-black text-zinc-900">{selectedEvaluation.grammarScore}%</span>
              </div>
            </div>

            {/* Transcript Log */}
            <div className="space-y-2">
              <span className="text-xs font-black uppercase text-zinc-700 block">
                Dialog Asli Siswa dengan NPC Penguji:
              </span>
              <div className="p-4 bg-zinc-50 border-2 border-black max-h-56 overflow-y-auto space-y-3 text-xs leading-relaxed">
                {(selectedEvaluation.transcriptMessages || (selectedEvaluation as any).transcript || []).map((msg: any, mIdx: number) => (
                  <div key={mIdx} className="space-y-0.5">
                    <span className={`font-black uppercase text-[10px] ${
                      msg.sender === "npc" ? "text-cyan-800" : "text-amber-800"
                    }`}>
                      [{msg.sender === "npc" ? "NPC PENGUJI" : selectedEvaluation.studentName}]:
                    </span>
                    <p className="text-black bg-white p-2 border border-zinc-300 font-mono">
                      {msg.text}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Native Upgrades */}
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
    </div>
  );
}
