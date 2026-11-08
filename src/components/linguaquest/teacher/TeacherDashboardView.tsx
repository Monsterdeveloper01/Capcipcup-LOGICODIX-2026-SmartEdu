"use client";

import { useState, useEffect } from "react";
import { SpeakingEvaluation, ClassMisconceptionItem } from "@/lib/linguaquest/types";
import {
  GraduationCap,
  BookOpen,
  Users,
  Plus,
  ShieldAlert,
  RotateCcw,
  CheckCircle2,
} from "lucide-react";

import {
  ClassroomItem,
  ClassroomMemberItem,
  AvailableStudentItem,
  TeacherRoomItem,
  QuizQuestionItem,
  TeacherTab,
} from "./types";

// Import Modular Tabs
import ClassroomRosterTab from "./tabs/ClassroomRosterTab";
import ClassroomTasksTab from "./tabs/ClassroomTasksTab";
import TaskBuilderTab from "./tabs/TaskBuilderTab";
import GradebookTab from "./tabs/GradebookTab";
import DiagnosticsTab from "./tabs/DiagnosticsTab";

// Import Modular Modals
import ProjectorPinModal from "./modals/ProjectorPinModal";
import AddMemberModal from "./modals/AddMemberModal";
import KickMemberModal from "./modals/KickMemberModal";
import CreateClassModal from "./modals/CreateClassModal";
import EditTaskModal from "./modals/EditTaskModal";
import DeleteTaskModal from "./modals/DeleteTaskModal";
import TranscriptDetailModal from "./modals/TranscriptDetailModal";

export default function TeacherDashboardView() {
  const [activeTab, setActiveTab] = useState<TeacherTab>("classes");

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
  const [isCreatingClass, setIsCreatingClass] = useState(false);

  // Tasks in Selected Classroom State
  const [rooms, setRooms] = useState<TeacherRoomItem[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [filterRoomCode, setFilterRoomCode] = useState<string>("ALL");

  // Gradebook & Heatmap State
  const [evaluations, setEvaluations] = useState<SpeakingEvaluation[]>([]);
  const [misconceptions, setMisconceptions] = useState<ClassMisconceptionItem[]>([]);
  const [isLoadingHeatmap, setIsLoadingHeatmap] = useState(true);
  const [selectedEvaluation, setSelectedEvaluation] = useState<SpeakingEvaluation | null>(null);

  // In-Dashboard Task Builder State
  const [newTopic, setNewTopic] = useState("Handling Customer Negotiation & Service Recovery");
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
  const [isSavingTask, setIsSavingTask] = useState(false);
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

  // Load Classes & Heatmap on mount
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
        setEvaluations(data.evaluations || []);
        setMisconceptions(data.misconceptions || []);
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

    setIsSavingTask(true);
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
      setIsSavingTask(false);
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
    link.setAttribute("download", `Rekap_Nilai_Speaking_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-mono text-black">
      {/* Clean Teacher Header */}
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

      {/* Tab 1: Kelas & Roster Siswa */}
      {activeTab === "classes" && (
        <ClassroomRosterTab
          classes={classes}
          selectedClass={selectedClass}
          classMembers={classMembers}
          roomsCount={rooms.length}
          copiedPin={copiedPin}
          isLoadingMembers={isLoadingMembers}
          onSelectClass={(c) => setSelectedClass(c)}
          onCopyPin={handleCopyPin}
          onOpenProjector={(c) => setProjectorModalClass(c)}
          onOpenCreateClass={() => setShowCreateClassModal(true)}
          onOpenAddMember={() => setShowAddMemberModal(true)}
          onOpenKickMember={(m) => setMemberToKick(m)}
        />
      )}

      {/* Tab 2: Tugas & Misi Kelas */}
      {activeTab === "tasks" && (
        <ClassroomTasksTab
          selectedClass={selectedClass}
          rooms={rooms}
          isLoadingRooms={isLoadingRooms}
          onGoToBuilder={() => setActiveTab("builder")}
          onOpenEditModal={handleOpenEditModal}
          onOpenDeleteModal={(r) => setRoomToDelete(r)}
        />
      )}

      {/* Tab 3: Form Pembuat Tugas Baru */}
      {activeTab === "builder" && (
        <TaskBuilderTab
          selectedClass={selectedClass}
          newTopic={newTopic}
          newDifficulty={newDifficulty}
          newCaseStory={newCaseStory}
          newNpcName={newNpcName}
          newNpcPersona={newNpcPersona}
          newRequiredHint={newRequiredHint}
          newTargetVocab={newTargetVocab}
          newQuizQuestions={newQuizQuestions}
          isGeneratingAi={isGeneratingAi}
          isSavingTask={isSavingTask}
          onTopicChange={setNewTopic}
          onDifficultyChange={setNewDifficulty}
          onCaseStoryChange={setNewCaseStory}
          onNpcNameChange={setNewNpcName}
          onNpcPersonaChange={setNewNpcPersona}
          onRequiredHintChange={setNewRequiredHint}
          onTargetVocabChange={setNewTargetVocab}
          onQuizQuestionsChange={setNewQuizQuestions}
          onAutoGenerateAi={handleAutoGenerateAi}
          onSubmit={handleSaveNewTask}
        />
      )}

      {/* Tab 4: Rekap Nilai Siswa (Gradebook) */}
      {activeTab === "grader" && (
        <GradebookTab
          evaluations={evaluations}
          rooms={rooms}
          filterRoomCode={filterRoomCode}
          isLoadingHeatmap={isLoadingHeatmap}
          onFilterChange={setFilterRoomCode}
          onExportCsv={handleExportCsv}
          onSelectEvaluation={(ev) => setSelectedEvaluation(ev)}
        />
      )}

      {/* Tab 5: Analisis Diagnostik */}
      {activeTab === "diagnostics" && (
        <DiagnosticsTab misconceptions={misconceptions} />
      )}

      {/* Modals */}
      <ProjectorPinModal
        classroom={projectorModalClass}
        tasksCount={rooms.length}
        onClose={() => setProjectorModalClass(null)}
      />

      <AddMemberModal
        selectedClass={selectedClass}
        availableStudents={availableStudents}
        isAddingMember={isAddingMember}
        onAddStudent={handleAddStudentManual}
        onClose={() => setShowAddMemberModal(false)}
      />

      <KickMemberModal
        member={memberToKick}
        selectedClass={selectedClass}
        isKicking={isKicking}
        onConfirm={handleConfirmKick}
        onClose={() => setMemberToKick(null)}
      />

      <CreateClassModal
        isOpen={showCreateClassModal}
        className={newClassName}
        classPin={newClassPin}
        gradeLevel={newClassGrade}
        isCreating={isCreatingClass}
        onClassNameChange={setNewClassName}
        onClassPinChange={setNewClassPin}
        onGradeLevelChange={setNewClassGrade}
        onSubmit={handleCreateNewClassroom}
        onClose={() => setShowCreateClassModal(false)}
      />

      <EditTaskModal
        editingRoom={editingRoom}
        editTitle={editTitle}
        editRoomCode={editRoomCode}
        editDifficulty={editDifficulty}
        editCaseStory={editCaseStory}
        editNpcName={editNpcName}
        editNpcPersona={editNpcPersona}
        editRequiredHint={editRequiredHint}
        editTargetVocab={editTargetVocab}
        editQuizQuestions={editQuizQuestions}
        isUpdating={isUpdatingRoom}
        onTitleChange={setEditTitle}
        onDifficultyChange={setEditDifficulty}
        onCaseStoryChange={setEditCaseStory}
        onNpcNameChange={setEditNpcName}
        onNpcPersonaChange={setEditNpcPersona}
        onRequiredHintChange={setEditRequiredHint}
        onTargetVocabChange={setEditTargetVocab}
        onQuizQuestionsChange={setEditQuizQuestions}
        onSubmit={handleSaveEditedRoom}
        onClose={() => setEditingRoom(null)}
      />

      <DeleteTaskModal
        roomToDelete={roomToDelete}
        isDeleting={isDeletingRoom}
        onConfirm={handleConfirmDeleteRoom}
        onClose={() => setRoomToDelete(null)}
      />

      <TranscriptDetailModal
        selectedEvaluation={selectedEvaluation}
        onClose={() => setSelectedEvaluation(null)}
      />
    </div>
  );
}
