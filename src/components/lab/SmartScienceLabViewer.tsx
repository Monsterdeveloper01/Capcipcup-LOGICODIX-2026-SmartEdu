"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import CameraFeed from "@/components/camera/CameraFeed";
import HandGestureTracker, { HandTransform } from "@/components/camera/HandGestureTracker";
import TeacherTaskBuilder from "./TeacherTaskBuilder";
import AiLabAssistantModal from "./AiLabAssistantModal";
import PostLabQuizModal from "./PostLabQuizModal";
import AuthLoginModal from "@/components/auth/AuthLoginModal";
import { AuthUser } from "@/lib/auth/types";
import {
  ChemicalVessel,
  ReactionDetail,
  INITIAL_VESSELS,
} from "./ChemistryLabScene";
import { CHEMICAL_CATALOG } from "@/lib/lab/chemicals-db";
import { LabTask } from "@/lib/lab/types";
import {
  FlaskConical,
  RotateCcw,
  Plus,
  Sparkles,
  CheckCircle2,
  Award,
  GraduationCap,
  ClipboardList,
  Video,
  VideoOff,
  X,
  Menu,
  ChevronRight,
  BookOpen,
  HelpCircle,
  Beaker,
  Search,
  Lock,
  Unlock,
  Trash2,
  SlidersHorizontal,
  Flame,
  LogIn,
  LogOut,
  ShieldCheck,
  UserCheck,
  Users,
  PlusCircle,
  ArrowLeft,
} from "lucide-react";

// Dynamic import for 3D Canvas
const ChemistryLabScene = dynamic(() => import("./ChemistryLabScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-[#5865F2] bg-[#111214] font-sans">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-[#5865F2] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold tracking-wider text-[#949ba4] uppercase">
          Memuat 3D Science Engine...
        </span>
      </div>
    </div>
  ),
});

export default function SmartScienceLabViewer() {
  // Navigation: "lab" | "tasks" | "teacher_builder"
  const [activeTab, setActiveTab] = useState<"lab" | "tasks" | "teacher_builder">("lab");

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);

  // Role helper: check if logged in as teacher / superadmin
  const isTeacher = currentUser?.role === "teacher" || currentUser?.role === "superadmin";

  // Teacher Dashboard sub-section ("create" | "list" | "submissions")
  const [teacherBuilderSection, setTeacherBuilderSection] = useState<"create" | "list" | "submissions">("create");

  // Strict role guard: redirect non-teachers away from teacher builder view
  useEffect(() => {
    if (activeTab === "teacher_builder" && !isTeacher) {
      setActiveTab("lab");
    }
  }, [activeTab, isTeacher]);

  // Mobile drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  // URL Search Params for Route /lab?taskId=...&mode=...&classCode=...
  const searchParams = useSearchParams();
  const urlTaskId = searchParams.get("taskId");
  const urlMode = searchParams.get("mode");
  const urlClassCode = searchParams.get("classCode");

  // Room & Tasks State
  const [roomCode, setRoomCode] = useState<string>(urlClassCode ? urlClassCode.toUpperCase() : "LAB889");
  const [tasks, setTasks] = useState<LabTask[]>([]);
  const [currentTask, setCurrentTask] = useState<LabTask | null>(null);
  const [studentName, setStudentName] = useState<string>("Ahmad Faiz");

  // Read URL params on mount or when params change
  useEffect(() => {
    if (urlClassCode) {
      setRoomCode(urlClassCode.toUpperCase());
    }
    if (urlMode === "sandbox") {
      setLabMode("sandbox");
      setCurrentTask(null);
      setVessels([]);
      setActiveTab("lab");
    } else if (urlMode === "task") {
      setLabMode("task");
      setActiveTab("lab");
    }

    if (urlTaskId) {
      fetch(`/api/lab/tasks?taskId=${urlTaskId}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.tasks && data.tasks.length > 0) {
            applyTaskToWorkbench(data.tasks[0]);
          }
        })
        .catch((e) => console.warn("Failed loading task from URL:", e));
    }
  }, [urlTaskId, urlMode, urlClassCode]);

  // Check existing session from /api/auth/me on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          if (data.user.role === "teacher") {
            setLabMode("sandbox");
          } else if (data.user.role === "student") {
            setStudentName(data.user.name);
          }
        }
      })
      .catch((e) => console.warn("Failed fetching session user:", e));
  }, []);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      setStudentName("Ahmad Faiz");
      setActiveTab("lab");
    } catch (e) {
      console.warn("Logout error:", e);
    }
  };

  const handleLoginSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    if (user.role === "teacher") {
      setLabMode("sandbox");
      setActiveTab("teacher_builder");
      setTeacherBuilderSection("create");
    } else {
      setStudentName(user.name);
      setActiveTab("tasks");
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus tugas praktikum ini?")) return;
    try {
      const res = await fetch(`/api/lab/tasks?id=${taskId}`, { method: "DELETE" });
      if (res.ok) {
        fetchTasks();
      }
    } catch (e) {
      console.error("Delete task error:", e);
    }
  };

  // 3D Lab State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [vessels, setVessels] = useState<ChemicalVessel[]>([]);
  const [activeReaction, setActiveReaction] = useState<ReactionDetail | null>(null);
  const [chemicalCatalog, setChemicalCatalog] = useState(CHEMICAL_CATALOG);
  const [reactionsList, setReactionsList] = useState<ReactionDetail[]>([]);

  // Fetch live chemical catalog & reaction rules from MySQL database
  useEffect(() => {
    fetch("/api/lab/chemicals")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.chemicals) && data.chemicals.length > 0) {
          setChemicalCatalog(data.chemicals);
        }
      })
      .catch((e) => console.warn("Failed fetching dynamic chemicals:", e));

    fetch("/api/lab/reactions")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.reactions) && data.reactions.length > 0) {
          setReactionsList(data.reactions);
        }
      })
      .catch((e) => console.warn("Failed fetching dynamic reactions:", e));
  }, []);

  // Dual Student Lab Mode: "sandbox" (Mode Eksplorasi Bebas - Default) vs "task" (Saat membuka tugas dari Daftar Tugas)
  const [labMode, setLabMode] = useState<"task" | "sandbox">("sandbox");
  const [isAddChemicalModalOpen, setIsAddChemicalModalOpen] = useState<boolean>(false);
  const [searchChemicalQuery, setSearchChemicalQuery] = useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [isSuccessModalDismissed, setIsSuccessModalDismissed] = useState<boolean>(false);

  // Modals & Quiz State
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);
  const [isQuizModalOpen, setIsQuizModalOpen] = useState<boolean>(false);
  const [isTaskReactionDone, setIsTaskReactionDone] = useState<boolean>(false);
  const [lastQuizScore, setLastQuizScore] = useState<number | null>(null);

  // Hand tracking state from MediaPipe
  const [handTransform, setHandTransform] = useState<HandTransform>({
    rotationX: 0,
    rotationY: 0,
    scale: 1,
    isPinching: false,
    isGrabbing: false,
    handDetected: false,
    activeMode: "rotate",
    wristAngle: 0,
  });

  const handleGestureUpdate = useCallback((transform: HandTransform) => {
    setHandTransform(transform);
  }, []);

  // Fetch tasks for the current room
  useEffect(() => {
    fetchTasks();
  }, [roomCode]);

  const fetchTasks = async () => {
    try {
      const res = await fetch(`/api/lab/tasks?roomCode=${roomCode}`);
      const data = await res.json();
      if (res.ok && data.tasks) {
        setTasks(data.tasks);
      }
    } catch (err) {
      console.warn("Fetch lab tasks error:", err);
    }
  };

  // Setup the 3D Workbench strictly based on the Teacher's Task
  const applyTaskToWorkbench = (task: LabTask) => {
    setCurrentTask(task);
    setIsTaskReactionDone(false);
    setLastQuizScore(null);

    // Build vessels only from chemicals assigned by the teacher
    const taskVessels: ChemicalVessel[] = (task.chemicalIds || []).map((chemId, index) => {
      const chem = chemicalCatalog.find((c) => c.id === chemId) || CHEMICAL_CATALOG.find((c) => c.id === chemId) || {
        id: chemId,
        name: "Bahan Kimia",
        formula: "Reagen",
        color: "#38bdf8",
        level: task.level,
      };

      // Spacing 2.3m antar bejana agar leluasa di atas meja praktik tanpa bertabrakan
      const posX = (index - ((task.chemicalIds.length - 1) / 2)) * 2.3;
      return {
        id: `v_${chem.id}_${index}`,
        name: chem.name,
        formula: chem.formula,
        type: index % 2 === 0 ? "beaker" : "flask",
        color: chem.color,
        initialColor: chem.color,
        position: [posX, 0.55, 0.25],
        level: task.level,
        liquidLevel: 0.7,
        temperatureC: 25,
      };
    });

    setVessels(taskVessels.length > 0 ? taskVessels : []);
    // Guru selalu menggunakan Mode Sandbox untuk uji coba bebas tanpa terkunci
    setLabMode(isTeacher ? "sandbox" : "task");
    setIsSuccessModalDismissed(false);
    setActiveTab("lab");
  };

  // Reaction Detection Handler (Dual Mode Rules)
  const handleReactionDetected = (reaction: ReactionDetail) => {
    setActiveReaction(reaction);

    if (!isTeacher && labMode === "task") {
      // In Task Mode: check if target reaction is fulfilled
      const isTargetFulfilled = currentTask?.expectedReactionId
        ? reaction.id === currentTask.expectedReactionId ||
          reaction.title.toLowerCase().includes(currentTask.title.toLowerCase())
        : true; // Default to true on first successful reaction if teacher didn't specify reaction id

      if (isTargetFulfilled) {
        setIsTaskReactionDone(true);
        setIsSuccessModalDismissed(false);
      }
    }
  };

  // Sandbox Mode: Add Any Chemical Reagent to Workbench
  const handleAddChemicalToWorkbench = (chem: any) => {
    const nextIdx = vessels.length;
    // Smart workbench spacing:
    // 1st item: -1.4, 2nd item: 1.4, 3rd item: -2.8, 4th item: 2.8, 5th item: 0
    const slotPositions = [-1.4, 1.4, -2.8, 2.8, 0, -3.8, 3.8];
    const posX = slotPositions[nextIdx] ?? ((nextIdx % 2 === 0 ? 1 : -1) * (1.2 + Math.floor(nextIdx / 2) * 1.3));

    const newVessel: ChemicalVessel = {
      id: `v_${chem.id}_${Date.now()}`,
      name: chem.name,
      formula: chem.formula,
      type: nextIdx % 2 === 0 ? "beaker" : "flask",
      color: chem.color || "#06b6d4",
      initialColor: chem.color || "#06b6d4",
      position: [posX, 0.55, 0.25],
      level: chem.level || "SMA",
      liquidLevel: 0.7,
      temperatureC: 25,
    };

    setVessels((prev) => [...prev, newVessel]);
    setIsAddChemicalModalOpen(false);
  };

  // Remove individual vessel from workbench
  const handleRemoveVessel = (vesselId: string) => {
    setVessels((prev) => prev.filter((v) => v.id !== vesselId));
  };

  // Reset Workbench positions and reactions
  const handleResetWorkbench = () => {
    if (!isTeacher && labMode === "task" && currentTask) {
      applyTaskToWorkbench(currentTask);
    } else {
      setVessels([]); // Di Mode Sandbox, reset mengosongkan seluruh meja
      setActiveReaction(null);
    }
    setIsTaskReactionDone(false);
    setIsSuccessModalDismissed(false);
  };

  // Switch student lab mode
  const handleSwitchMode = (mode: "task" | "sandbox") => {
    if (isTeacher && mode !== "sandbox") return; // Guru terkunci di mode Sandbox
    setLabMode(mode);
    setIsTaskReactionDone(false);
    setIsSuccessModalDismissed(false);
    setActiveReaction(null);
    if (mode === "sandbox") {
      setCurrentTask(null);
      setVessels([]); // Mode Sandbox: Meja lab dikosongkan total agar murid bebas memilih dari katalog!
      setActiveTab("lab");
    } else if (mode === "task") {
      if (currentTask) {
        applyTaskToWorkbench(currentTask);
      } else if (tasks.length > 0) {
        applyTaskToWorkbench(tasks[0]);
      } else {
        setVessels([]);
      }
    }
  };

  // Is experiment interaction locked (Target reached in task mode)
  const isExperimentLocked = !isTeacher && labMode === "task" && isTaskReactionDone;

  const handleSubmitQuiz = async (score: number, answers: any[]) => {
    setLastQuizScore(score);
    if (!currentTask) return;

    try {
      await fetch("/api/lab/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: currentTask.id,
          studentName: currentUser?.name || studentName,
          isReactionAchieved: isTaskReactionDone,
          score,
          answers,
          aiAnalysis: `Praktikum ${currentTask.title} berhasil diamati. Skor Kuis: ${score}/100.`,
        }),
      });
    } catch (err) {
      console.error("Save submission error:", err);
    }
  };

  const activeChemNames = vessels.map((v) => `${v.name} (${v.formula})`);

  return (
    <div className="h-full w-full flex bg-[#1e1f22] overflow-hidden text-[#dbdee1] font-sans select-none">
      {/* =========================================================================
          DISCORD-INSPIRED SLEEK SIDEBAR NAVIGATION (250px)
          ========================================================================= */}
      <aside
        className={`w-64 bg-[#2b2d31] border-r border-[#202225] flex flex-col shrink-0 z-30 transition-transform duration-200 ${
          isMobileDrawerOpen
            ? "fixed inset-y-0 left-0 shadow-2xl flex"
            : "hidden md:flex"
        }`}
      >
        {/* App Branding Header */}
        <div className="h-14 border-b border-[#202225] px-4 flex items-center justify-between shadow-sm">
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-85 transition-opacity" title="Kembali ke Dashboard Utama">
            <div className="w-8 h-8 rounded-xl bg-[#5865F2] flex items-center justify-center text-white shadow-md">
              <FlaskConical className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-1.5">
                Capcipcup
                <span className="text-[10px] bg-[#5865F2] text-white px-1.5 py-0.2 rounded font-bold">
                  LAB 3D
                </span>
              </h1>
              <span className="text-[10px] text-[#949ba4] font-medium">
                Virtual Science Laboratory
              </span>
            </div>
          </Link>

          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(false)}
            className="md:hidden text-[#949ba4] hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Back to Dashboard Button */}
        <div className="px-3 pt-3">
          <Link
            href="/"
            className="w-full py-2 px-3 bg-[#1e1f22] hover:bg-[#35373c] border border-[#3b3e45] hover:border-[#5865F2] text-white text-xs font-bold rounded-xl flex items-center justify-between transition-colors shadow"
          >
            <div className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4 text-[#FEE75C]" />
              <span>Dashboard Kelas</span>
            </div>
            <span className="text-[9px] bg-[#5865F2] text-white px-1.5 py-0.5 rounded font-black">
              HOME
            </span>
          </Link>
        </div>

        {/* Room PIN Card */}
        <div className="p-3">
          <div className="bg-[#1e1f22] border border-[#3b3e45] rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#949ba4] font-medium text-[11px]">Room Praktikum:</span>
              <button
                type="button"
                onClick={() => {
                  const newPin = prompt("Masukkan PIN Room Baru:", roomCode);
                  if (newPin) setRoomCode(newPin.toUpperCase().trim());
                }}
                className="text-[10px] bg-[#35373c] hover:bg-[#5865F2] text-white px-2 py-0.5 rounded transition-colors font-semibold"
              >
                Ganti PIN
              </button>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono font-bold text-white text-sm tracking-wider">
                {roomCode}
              </span>
              <span className="text-[10px] text-[#57F287] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#57F287] animate-pulse" />
                SD • SMP • SMA
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 text-xs font-semibold">
          {isTeacher ? (
            /* ==========================================================
               TEACHER SIDEBAR NAVIGATION (GURU PENGAMPU)
               Guru hanya menggunakan Mode Sandbox untuk uji coba lab
               ========================================================== */
            <>
              {/* Teacher Sandbox Status Banner */}
              <div className="space-y-1.5 bg-[#1e1f22] p-2.5 rounded-xl border border-[#3b3e45]">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#FEE75C] uppercase tracking-wider flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>Mode Lab Guru</span>
                  </span>
                  <span className="text-[9px] bg-[#23a55a] text-white px-1.5 py-0.5 rounded font-black tracking-wide">
                    SANDBOX
                  </span>
                </div>
                <p className="text-[10px] text-[#949ba4] leading-relaxed">
                  Guru berpraktikum dalam <strong>Mode Sandbox</strong> untuk menguji reaksi & racikan secara bebas sebelum ditugaskan ke siswa.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLabMode("sandbox");
                    setActiveTab("lab");
                    setIsMobileDrawerOpen(false);
                  }}
                  className={`w-full py-1.5 px-2.5 rounded-lg text-left text-xs font-bold flex items-center justify-between transition-all ${
                    activeTab === "lab"
                      ? "bg-[#23a55a] text-white shadow"
                      : "bg-[#2b2d31] text-[#dbdee1] hover:text-white hover:bg-[#35373c]"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <FlaskConical className="w-3.5 h-3.5" />
                    <span>Uji Coba Meja Lab 3D</span>
                  </div>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      activeTab === "lab" ? "bg-white/20 text-white" : "bg-[#1e1f22] text-[#57F287]"
                    }`}
                  >
                    WEB-AR
                  </span>
                </button>
              </div>

              {/* Section 1: Dashboard & Manajemen Guru */}
              <div className="space-y-1">
                <span className="px-2 text-[10px] font-bold text-[#949ba4] uppercase tracking-wider">
                  Manajemen & Tugas Guru
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setTeacherBuilderSection("create");
                    setActiveTab("teacher_builder");
                    setIsMobileDrawerOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-left transition-colors ${
                    activeTab === "teacher_builder" && teacherBuilderSection === "create"
                      ? "bg-[#5865F2] text-white shadow-sm"
                      : "text-[#dbdee1] hover:bg-[#35373c] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <PlusCircle className="w-4 h-4 text-[#5865F2]" />
                    <span>Rancang Tugas Baru</span>
                  </div>
                  <span className="text-[9px] bg-[#5865F2]/20 text-[#5865F2] px-1.5 py-0.5 rounded font-bold border border-[#5865F2]/30">
                    AI Kuis
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTeacherBuilderSection("list");
                    setActiveTab("teacher_builder");
                    setIsMobileDrawerOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-left transition-colors ${
                    activeTab === "teacher_builder" && teacherBuilderSection === "list"
                      ? "bg-[#5865F2] text-white shadow-sm"
                      : "text-[#dbdee1] hover:bg-[#35373c] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ClipboardList className="w-4 h-4 text-[#FEE75C]" />
                    <span>Tugas Diterbitkan</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                      activeTab === "teacher_builder" && teacherBuilderSection === "list"
                        ? "bg-white/20 text-white"
                        : "bg-[#1e1f22] text-[#dbdee1]"
                    }`}
                  >
                    {tasks.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setTeacherBuilderSection("submissions");
                    setActiveTab("teacher_builder");
                    setIsMobileDrawerOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-left transition-colors ${
                    activeTab === "teacher_builder" && teacherBuilderSection === "submissions"
                      ? "bg-[#5865F2] text-white shadow-sm"
                      : "text-[#dbdee1] hover:bg-[#35373c] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-[#57F287]" />
                    <span>Rekap Nilai Siswa</span>
                  </div>
                  <span className="text-[9px] bg-[#57F287]/20 text-[#57F287] px-1.5 py-0.5 rounded font-bold border border-[#57F287]/30">
                    Hasil
                  </span>
                </button>
              </div>

              {/* Section 2: Asisten AI Guru */}
              <div className="space-y-1">
                <span className="px-2 text-[10px] font-bold text-[#949ba4] uppercase tracking-wider">
                  Asisten AI Guru
                </span>

                <button
                  type="button"
                  onClick={() => setIsAiAssistantOpen(true)}
                  className="w-full px-3 py-2 rounded-lg flex items-center justify-between text-left text-[#dbdee1] hover:bg-[#35373c] hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#FEE75C]" />
                    <span>Konsultasi Lab-AI</span>
                  </div>
                  <span className="text-[9px] bg-[#5865F2] text-white px-1.5 py-0.5 rounded font-bold">
                    AI
                  </span>
                </button>
              </div>

              {/* Section 3: Bahan Kimia di Meja Guru (Mode Sandbox Bebas) */}
              <div className="space-y-1.5 pt-2 border-t border-[#3b3e45]">
                <div className="px-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#949ba4] uppercase tracking-wider">
                    Bahan di Meja 3D ({vessels.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsAddChemicalModalOpen(true)}
                    className="text-[10px] text-[#57F287] hover:underline flex items-center gap-0.5 font-bold"
                  >
                    <Plus className="w-3 h-3" />
                    Tambah
                  </button>
                </div>

                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {vessels.length === 0 ? (
                    <div className="py-3 px-2 bg-[#1e1f22]/60 border border-dashed border-[#3b3e45] rounded-md text-center space-y-1">
                      <p className="text-[11px] text-[#949ba4]">Meja praktik kosong</p>
                      <p className="text-[10px] text-[#64748b]">Klik &quot;Tambah&quot; untuk memilih zat</p>
                    </div>
                  ) : (
                    vessels.map((v, i) => (
                      <div
                        key={v.id || i}
                        className="px-2.5 py-1.5 bg-[#1e1f22] border border-[#3b3e45] rounded-md flex items-center justify-between text-[11px] group hover:border-[#5865F2] transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate pr-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black shrink-0"
                            style={{ backgroundColor: v.color }}
                          />
                          <div className="truncate">
                            <span className="font-mono font-bold text-white mr-1">{v.formula}</span>
                            <span className="text-[#949ba4] truncate text-[10px]">{v.name}</span>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveVessel(v.id)}
                          className="opacity-60 hover:opacity-100 text-[#ed4245] p-0.5 rounded hover:bg-[#ed4245]/20 transition-all shrink-0"
                          title="Hapus bejana dari meja"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-1 flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setIsAddChemicalModalOpen(true)}
                    className="flex-1 py-1.5 px-2 bg-[#23a55a] hover:bg-[#1f9250] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Zat</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleResetWorkbench}
                    className="py-1.5 px-2.5 bg-[#35373c] hover:bg-[#404249] text-[#dbdee1] hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center transition-colors shadow"
                    title="Kosongkan Meja"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            /* ==========================================================
               STUDENT SIDEBAR NAVIGATION (SISWA PRAKTIKAN / TAMU)
               ========================================================== */
            <>
              {/* Section 1: Menu Utama Siswa */}
              <div className="space-y-1">
                <span className="px-2 text-[10px] font-bold text-[#949ba4] uppercase tracking-wider">
                  Navigasi Meja Lab
                </span>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("lab");
                    setIsMobileDrawerOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-left transition-colors ${
                    activeTab === "lab"
                      ? "bg-[#5865F2] text-white shadow-sm"
                      : "text-[#dbdee1] hover:bg-[#35373c] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <FlaskConical className="w-4 h-4" />
                    <span>Meja Praktikum 3D</span>
                  </div>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      activeTab === "lab" ? "bg-white/20 text-white" : "bg-[#1e1f22] text-[#57F287]"
                    }`}
                  >
                    WEB-AR
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActiveTab("tasks");
                    setIsMobileDrawerOpen(false);
                  }}
                  className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-left transition-colors ${
                    activeTab === "tasks"
                      ? "bg-[#5865F2] text-white shadow-sm"
                      : "text-[#dbdee1] hover:bg-[#35373c] hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <ClipboardList className="w-4 h-4" />
                    <span>Daftar Tugas Kelas</span>
                  </div>
                  {tasks.length > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                        activeTab === "tasks" ? "bg-white/20 text-white" : "bg-[#1e1f22] text-[#dbdee1]"
                      }`}
                    >
                      {tasks.length}
                    </span>
                  )}
                </button>
              </div>

              {/* Section 2: Fitur AI & Evaluasi Siswa */}
              <div className="space-y-1">
                <span className="px-2 text-[10px] font-bold text-[#949ba4] uppercase tracking-wider">
                  {labMode === "task" ? "Asisten AI & Evaluasi" : "Asisten AI Praktikum"}
                </span>

                <button
                  type="button"
                  onClick={() => setIsAiAssistantOpen(true)}
                  className="w-full px-3 py-2 rounded-lg flex items-center justify-between text-left text-[#dbdee1] hover:bg-[#35373c] hover:text-white transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Sparkles className="w-4 h-4 text-[#FEE75C]" />
                    <span>Tanya Asisten Lab-AI</span>
                  </div>
                  <span className="text-[9px] bg-[#5865F2] text-white px-1.5 py-0.2 rounded font-bold">
                    AI
                  </span>
                </button>

                {/* Kuis Evaluasi Sains HANYA tampil di Mode Tugas (disembunyikan di Mode Sandbox) */}
                {labMode === "task" && (
                  <button
                    type="button"
                    onClick={() => {
                      if (currentTask) setIsQuizModalOpen(true);
                      else alert("Pilih tugas praktikum terlebih dahulu untuk mengerjakan kuis!");
                    }}
                    className="w-full px-3 py-2 rounded-lg flex items-center justify-between text-left text-[#dbdee1] hover:bg-[#35373c] hover:text-white transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <Award className="w-4 h-4 text-[#57F287]" />
                      <span>Kuis Evaluasi Sains</span>
                    </div>
                    {lastQuizScore !== null && (
                      <span className="text-[10px] bg-[#57F287] text-black px-1.5 py-0.2 rounded font-bold">
                        {lastQuizScore}/100
                      </span>
                    )}
                  </button>
                )}
              </div>

              {/* Section 3: Reagen Aktif di Meja */}
              <div className="space-y-1.5 pt-2 border-t border-[#3b3e45]">
                <div className="px-1 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#949ba4] uppercase tracking-wider">
                    Bahan di Meja 3D ({vessels.length})
                  </span>
                  {labMode === "sandbox" && (
                    <button
                      type="button"
                      onClick={() => setIsAddChemicalModalOpen(true)}
                      className="text-[10px] text-[#57F287] hover:underline flex items-center gap-0.5 font-bold"
                    >
                      <Plus className="w-3 h-3" />
                      Tambah
                    </button>
                  )}
                </div>

                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {vessels.length === 0 ? (
                    <div className="py-3 px-2 bg-[#1e1f22]/60 border border-dashed border-[#3b3e45] rounded-md text-center space-y-1">
                      <p className="text-[11px] text-[#949ba4]">Meja praktik kosong</p>
                      <p className="text-[10px] text-[#64748b]">Klik &quot;Tambah&quot; untuk memilih zat</p>
                    </div>
                  ) : (
                    vessels.map((v, i) => (
                      <div
                        key={v.id || i}
                        className="px-2.5 py-1.5 bg-[#1e1f22] border border-[#3b3e45] rounded-md flex items-center justify-between text-[11px] group hover:border-[#5865F2] transition-colors"
                      >
                        <div className="flex items-center gap-2 truncate pr-1">
                          <span
                            className="w-2.5 h-2.5 rounded-full border border-black shrink-0"
                            style={{ backgroundColor: v.color }}
                          />
                          <div className="truncate">
                            <span className="font-mono font-bold text-white mr-1">{v.formula}</span>
                            <span className="text-[#949ba4] truncate text-[10px]">{v.name}</span>
                          </div>
                        </div>

                        {labMode === "sandbox" && (
                          <button
                            type="button"
                            onClick={() => handleRemoveVessel(v.id)}
                            className="opacity-60 hover:opacity-100 text-[#ed4245] p-0.5 rounded hover:bg-[#ed4245]/20 transition-all shrink-0"
                            title="Hapus bejana dari meja"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {labMode === "sandbox" && (
                  <div className="pt-1 flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsAddChemicalModalOpen(true)}
                      className="flex-1 py-1.5 px-2 bg-[#23a55a] hover:bg-[#1f9250] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Tambah Zat</span>
                    </button>
                    {vessels.length > 0 && (
                      <button
                        type="button"
                        onClick={handleResetWorkbench}
                        className="py-1.5 px-2.5 bg-[#35373c] hover:bg-[#404249] text-[#dbdee1] hover:text-white rounded-lg text-xs font-semibold flex items-center justify-center transition-colors shadow"
                        title="Kosongkan Meja"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* User Profile Bar Footer */}
        <div className="h-14 bg-[#232428] px-3 flex items-center justify-between shrink-0 border-t border-[#202225]">
          <div
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-2.5 truncate cursor-pointer group flex-1"
          >
            <div className="relative shrink-0">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow ${
                  currentUser?.role === "teacher"
                    ? "bg-[#FEE75C] text-black"
                    : "bg-[#5865F2] text-white"
                }`}
              >
                {currentUser ? currentUser.name.charAt(0) : studentName.charAt(0)}
              </div>
              <span
                className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#232428] ${
                  currentUser ? "bg-[#57F287]" : "bg-[#949ba4]"
                }`}
              />
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate group-hover:text-[#5865F2] transition-colors">
                {currentUser ? currentUser.name : studentName}
              </div>
              <div className="text-[10px] text-[#949ba4] truncate flex items-center gap-1">
                {currentUser?.role === "teacher" ? (
                  <span className="text-[#FEE75C] font-semibold">● Guru Pengampu</span>
                ) : currentUser?.role === "student" ? (
                  <span className="text-[#57F287] font-semibold">● Siswa Praktikan</span>
                ) : (
                  <span>● Tamu (Klik Masuk)</span>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAuthModalOpen(true)}
            className="text-[11px] text-[#949ba4] hover:text-white px-2 py-1 rounded hover:bg-[#35373c] transition-colors font-medium shrink-0 cursor-pointer"
          >
            {currentUser ? "Ganti" : "Masuk"}
          </button>
        </div>
      </aside>

      {/* =========================================================================
          MAIN WORKSPACE CONTENT (CENTER)
          ========================================================================= */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#313338] overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-[#202225] bg-[#313338] px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-2.5">
            <Link
              href="/"
              className="px-3 py-1.5 bg-[#2b2d31] hover:bg-[#35373c] border border-[#3b3e45] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow shrink-0"
              title="Kembali ke Dashboard Kelas"
            >
              <ArrowLeft className="w-4 h-4 text-[#FEE75C]" />
              <span className="hidden sm:inline">Dashboard Kelas</span>
            </Link>

            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(true)}
              className="md:hidden p-1.5 text-[#949ba4] hover:text-white hover:bg-[#35373c] rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <span>
                  {activeTab === "lab"
                    ? isTeacher
                      ? "Meja Sandbox Guru (Uji Coba Eksperimen 3D)"
                      : "Meja Praktikum Sains 3D & Web-AR"
                    : activeTab === "tasks"
                    ? "Daftar Tugas Praktikum Kelas"
                    : "Portal Guru: Dashboard Manajemen Praktikum"}
                </span>
              </h2>
              <p className="text-[11px] text-[#949ba4] hidden sm:block">
                {activeTab === "lab"
                  ? isTeacher
                    ? "Simulasi bebas racik zat kimia untuk demonstrasi & persiapan materi sebelum ditugaskan ke siswa"
                    : "Simulasi interaktif reaksi zat kimia dengan gesture tangan & deteksi otomatis"
                  : activeTab === "tasks"
                  ? `Menampilkan tugas aktif untuk kelas dengan PIN Room [${roomCode}]`
                  : "Buat tugas baru, tentukan komposisi zat di meja, dan susun kuis evaluasi AI"}
              </p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5">
            {/* Account Status / Login Button */}
            {currentUser ? (
              <div className="flex items-center gap-2 bg-[#2b2d31] border border-[#3b3e45] rounded-xl px-2.5 py-1 shadow-sm">
                <span
                  className={`text-[10px] font-black uppercase px-1.5 py-0.5 rounded shadow ${
                    currentUser.role === "teacher"
                      ? "bg-[#FEE75C] text-black"
                      : "bg-[#5865F2] text-white"
                  }`}
                >
                  {currentUser.role === "teacher" ? "GURU" : "SISWA"}
                </span>
                <span className="text-xs font-bold text-white max-w-[110px] sm:max-w-[170px] truncate">
                  {currentUser.name}
                </span>
                <button
                  type="button"
                  onClick={handleLogout}
                  title="Keluar / Ganti Akun"
                  className="p-1 text-[#949ba4] hover:text-[#ed4245] rounded hover:bg-[#35373c] transition-colors ml-0.5 cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1.5 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow-sm cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk (Guru / Siswa)</span>
              </button>
            )}

            {activeTab === "lab" && (
              <button
                type="button"
                onClick={() => setIsCameraActive((prev) => !prev)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm ${
                  isCameraActive
                    ? "bg-[#23a55a] text-white hover:bg-[#1f9250]"
                    : "bg-[#ed4245] text-white hover:bg-[#da373c]"
                }`}
              >
                {isCameraActive ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">
                  {isCameraActive ? "🖐️ Sensor Tangan Aktif" : "🖐️ Sensor Nonaktif"}
                </span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAiAssistantOpen(true)}
              className="px-3 py-1.5 bg-[#2b2d31] hover:bg-[#35373c] border border-[#3b3e45] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#FEE75C]" />
              <span className="hidden sm:inline">Tanya AI</span>
            </button>
          </div>
        </header>

        {/* Body Viewport */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 lg:p-6 space-y-4">
          {/* ===================================================================
              VIEW 1: MEJA PRAKTIKUM SAINS 3D
              =================================================================== */}
          {activeTab === "lab" && (
            <div className="space-y-4 max-w-6xl mx-auto w-full">
              {/* Mode Bar & Task Target Banner */}
              <div className="bg-[#2b2d31] border border-[#3b3e45] rounded-xl p-3.5 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded flex items-center gap-1.5 ${
                        isTeacher
                          ? "bg-[#23a55a] text-white"
                          : labMode === "task"
                          ? "bg-[#5865F2] text-white"
                          : "bg-[#23a55a] text-white"
                      }`}
                    >
                      {isTeacher ? (
                        <>
                          <FlaskConical className="w-3 h-3" />
                          <span>Meja Uji Coba Guru (Mode Sandbox)</span>
                        </>
                      ) : labMode === "task" ? (
                        <>
                          <ClipboardList className="w-3 h-3" />
                          <span>Mode Tugas Terpandu</span>
                        </>
                      ) : (
                        <>
                          <FlaskConical className="w-3 h-3" />
                          <span>Mode Sandbox (Eksplorasi Bebas)</span>
                        </>
                      )}
                    </span>

                    {!isTeacher && labMode === "task" && isTaskReactionDone && (
                      <span className="text-[10px] bg-[#ed4245] text-white font-bold px-2 py-0.5 rounded flex items-center gap-1 animate-pulse">
                        <Lock className="w-3 h-3" />
                        <span>Selesai & Dikunci</span>
                      </span>
                    )}

                    {!isTeacher && labMode === "task" && currentTask && (
                      <span className="text-xs text-[#949ba4] font-medium">
                        Guru: {currentTask.teacherName} • Jenjang {currentTask.gradeLevel} • PIN {currentTask.roomCode}
                      </span>
                    )}

                    {isTeacher && (
                      <span className="text-xs text-[#57F287] font-medium">
                        ● Meja Bebas Uji Reagen & Spontanitas
                      </span>
                    )}
                  </div>

                  <h3 className="font-bold text-sm text-white">
                    {isTeacher
                      ? "Laboratorium Virtual Guru: Uji Coba & Demonstrasi Reaksi"
                      : labMode === "task"
                      ? currentTask?.title || "Eksperimen Netralisasi Asam Basa"
                      : "Eksplorasi Meja Bebas (Sandbox Mode)"}
                  </h3>

                  <p className="text-xs text-[#dbdee1] leading-relaxed">
                    {isTeacher ? (
                      "Sebagai guru pengampu, Anda berada dalam mode Sandbox tanpa batasan tugas. Anda bebas menambahkan reagen apa pun, memeriksa reaksi alami spontan, serta memastikan keamanan simulasi sebelum merancangnya menjadi tugas kelas."
                    ) : labMode === "task" ? (
                      <>
                        📋 <strong>Instruksi Guru:</strong>{" "}
                        {currentTask?.instructions || "Campurkan reagen yang telah disiapkan di atas meja hingga bereaksi."}
                        {isTaskReactionDone && (
                          <span className="text-[#57F287] font-semibold ml-2">
                            ✓ Target reaksi tercapai! Eksperimen dihentikan agar hasil tidak berubah.
                          </span>
                        )}
                      </>
                    ) : (
                      "Bebas menambahkan reagen kimia apa saja ke meja lab, meracik berbagai kombinasi cairan, dan mengamati reaksi alami tanpa batasan tugas guru."
                    )}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {isTeacher ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsAddChemicalModalOpen(true)}
                        className="px-3.5 py-1.5 bg-[#23a55a] hover:bg-[#1f9250] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Tambah Zat</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetWorkbench}
                        className="px-3 py-1.5 bg-[#35373c] hover:bg-[#404249] text-[#dbdee1] hover:text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow"
                        title="Kosongkan Meja"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Meja</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setTeacherBuilderSection("create");
                          setActiveTab("teacher_builder");
                        }}
                        className="px-3.5 py-1.5 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow"
                      >
                        <ClipboardList className="w-4 h-4" />
                        <span>Portal Guru →</span>
                      </button>
                    </>
                  ) : labMode === "sandbox" ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setIsAddChemicalModalOpen(true)}
                        className="px-3.5 py-1.5 bg-[#23a55a] hover:bg-[#1f9250] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Tambah Bahan Kimia</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleResetWorkbench}
                        className="px-3 py-1.5 bg-[#35373c] hover:bg-[#404249] text-[#dbdee1] hover:text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow"
                        title="Bersihkan Meja"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Reset Meja</span>
                      </button>
                    </>
                  ) : (
                    <>
                      {currentTask?.questions && currentTask.questions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsQuizModalOpen(true)}
                          className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shadow ${
                            isTaskReactionDone
                              ? "bg-[#FEE75C] text-black hover:bg-yellow-400 animate-pulse"
                              : "bg-[#1e1f22] text-[#dbdee1] hover:bg-[#35373c] border border-[#3b3e45]"
                          }`}
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>
                            {lastQuizScore !== null
                              ? `Kuis Selesai (${lastQuizScore}/100)`
                              : "Kerjakan Kuis AI"}
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleResetWorkbench}
                        className="px-3 py-1.5 bg-[#35373c] hover:bg-[#404249] text-[#dbdee1] hover:text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 shadow"
                        title="Ulangi Eksperimen"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Ulangi</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setCurrentTask(null);
                          setLabMode("sandbox");
                          setVessels([]);
                          setIsTaskReactionDone(false);
                          setActiveReaction(null);
                        }}
                        className="px-3 py-1.5 bg-[#2b2d31] hover:bg-[#35373c] text-[#dbdee1] hover:text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 border border-[#3b3e45]"
                        title="Kembali ke meja lab bebas"
                      >
                        <FlaskConical className="w-3.5 h-3.5 text-[#57F287]" />
                        <span>Meja Bebas</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* 3D Workbench Stage Canvas Container - Clean Laboratory Environment */}
              <div className="bg-[#f1f5f9] border border-[#3b3e45] rounded-2xl overflow-hidden relative shadow-2xl h-[490px] sm:h-[560px]">
                {/* Layer 0: Camera Feed (Visually hidden - runs strictly for MediaPipe vision tracking without showing webcam video) */}
                {isCameraActive && (
                  <div className="absolute inset-0 opacity-0 pointer-events-none -z-10">
                    <CameraFeed
                      isActive={isCameraActive}
                      onVideoReady={setVideoElement}
                      showControls={false}
                      className="w-full h-full rounded-none"
                    />
                  </div>
                )}

                {/* Layer 1: 3D WebGL Canvas */}
                <div className="absolute inset-0 z-10 pointer-events-auto">
                  <ChemistryLabScene
                    handTransform={isCameraActive ? handTransform : undefined}
                    onReactionDetected={handleReactionDetected}
                    vessels={vessels}
                    setVessels={setVessels}
                    activeReaction={activeReaction}
                    reactions={reactionsList}
                    isLocked={isExperimentLocked}
                  />
                </div>

                {/* Layer 2: Glowing Hand Skeleton Tracker Canvas */}
                {isCameraActive && (
                  <div className="absolute inset-0 z-20 pointer-events-none">
                    <HandGestureTracker
                      videoElement={videoElement}
                      isActive={isCameraActive}
                      onGestureUpdate={handleGestureUpdate}
                    />
                  </div>
                )}

                {/* Layer 3: HUD Status Overlay */}
                <div className="absolute top-3 left-3 z-30 flex flex-col gap-1.5 pointer-events-none">
                  <span className="bg-[#1e1f22]/90 backdrop-blur-md text-[#57F287] text-[11px] font-bold px-2.5 py-1 rounded-lg border border-[#35363c] flex items-center gap-1.5 shadow">
                    <span className="w-2 h-2 rounded-full bg-[#57F287] animate-pulse" />
                    Hand Skeleton Tracker Active
                  </span>

                  {isExperimentLocked && (
                    <span className="bg-[#ed4245]/90 backdrop-blur-md text-white text-[11px] font-bold px-2.5 py-1 rounded-lg border border-red-700 flex items-center gap-1.5 shadow animate-pulse">
                      <Lock className="w-3.5 h-3.5" />
                      Praktikum Selesai (Bejana Terkunci)
                    </span>
                  )}
                </div>

                <div className="absolute top-3 right-3 z-30 flex items-center gap-2 pointer-events-none">
                  <div className="bg-[#1e1f22]/90 backdrop-blur-md border border-[#35363c] px-3 py-1.5 rounded-lg text-xs shadow space-y-0.5 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-[#57F287]">
                      <span className={`w-2 h-2 rounded-full ${handTransform.handDetected ? "bg-[#57F287] animate-pulse" : "bg-[#ed4245]"}`} />
                      <span>{handTransform.handDetected ? "Sensor Tangan: Terdeteksi" : "Sensor: Arahkan Tangan..."}</span>
                    </div>
                    <div className="text-[10px] text-[#949ba4]">
                      {isExperimentLocked
                        ? "🔒 Terkunci - Praktikum Selesai"
                        : handTransform.isGrabbing
                        ? "✊ Memegang Bejana Kimia"
                        : handTransform.handDetected
                        ? "✋ Mode Membidik (Hover)"
                        : "Arahkan tangan ke kamera"}
                    </div>
                  </div>
                </div>

                {/* Sandbox Empty Table Banner */}
                {labMode === "sandbox" && vessels.length === 0 && (
                  <div className="absolute inset-x-0 bottom-16 flex justify-center pointer-events-none z-30">
                    <div className="bg-[#1e1f22]/95 backdrop-blur-md border border-[#35363c] text-white px-4 py-2 rounded-xl shadow-2xl flex items-center gap-3 pointer-events-auto">
                      <FlaskConical className="w-4 h-4 text-[#57F287]" />
                      <span className="text-xs text-[#dbdee1]">Meja lab kosong. Klik <strong>+ Tambah Bahan</strong> untuk menaruh zat kimia.</span>
                      <button
                        type="button"
                        onClick={() => setIsAddChemicalModalOpen(true)}
                        className="px-3 py-1 bg-[#23a55a] hover:bg-[#1f9250] text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1 shadow"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Pilih Zat</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Layer 4: Floating Quick Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-[#1e1f22]/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-[#35363c] shadow-2xl pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => setIsCameraActive((prev) => !prev)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                      isCameraActive ? "bg-[#35373c] text-white hover:bg-[#404249]" : "bg-[#ed4245] text-white"
                    }`}
                  >
                    {isCameraActive ? "🖐️ Sensor: ON" : "🖐️ Sensor: OFF"}
                  </button>

                  {labMode === "sandbox" && (
                    <button
                      type="button"
                      onClick={() => setIsAddChemicalModalOpen(true)}
                      className="px-3 py-1 bg-[#23a55a] hover:bg-[#1f9250] text-white rounded-full text-xs font-semibold flex items-center gap-1 transition-colors shadow"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Zat</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={handleResetWorkbench}
                    className="p-1.5 bg-[#35373c] hover:bg-[#404249] text-[#dbdee1] hover:text-white rounded-full transition-colors"
                    title="Reset Posisi Bejana"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsAiAssistantOpen(true)}
                    className="px-3 py-1 bg-[#5865F2] hover:bg-[#4752c4] text-white rounded-full text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>Tanya AI</span>
                  </button>
                </div>
              </div>

              {/* Task Completion Celebration Modal (Auto-Stop in Task Mode) */}
              {labMode === "task" && isTaskReactionDone && !isSuccessModalDismissed && (
                <div className="bg-gradient-to-r from-[#2b2d31] via-[#1e1f22] to-[#2b2d31] border-2 border-[#57F287] rounded-xl p-5 text-white shadow-2xl animate-in zoom-in-95 duration-200">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">🎉</span>
                        <h4 className="font-extrabold text-base text-[#57F287]">
                          TARGET PRAKTIKUM TERCAPAI! (Eksperimen Dihentikan)
                        </h4>
                      </div>
                      <p className="text-xs text-[#dbdee1]">
                        Kamu berhasil mereaksikan zat hingga menghasilkan produk{" "}
                        <strong className="text-white underline">
                          {activeReaction?.resultName || activeReaction?.title}
                        </strong>
                        . Meja lab dikunci otomatis oleh sistem agar hasil pengamatan tidak berubah.
                      </p>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0 w-full sm:w-auto">
                      {currentTask?.questions && currentTask.questions.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsQuizModalOpen(true)}
                          className="flex-1 sm:flex-none px-4 py-2.5 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-lg transition-transform hover:scale-105"
                        >
                          <Award className="w-4 h-4 text-[#FEE75C]" />
                          <span>Kerjakan Kuis Evaluasi AI →</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleResetWorkbench}
                        className="px-3 py-2.5 bg-[#35373c] hover:bg-[#404249] text-white font-semibold text-xs rounded-lg transition-colors flex items-center gap-1"
                        title="Ulangi praktikum dari awal"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Ulangi</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsSuccessModalDismissed(true)}
                        className="p-2 text-[#949ba4] hover:text-white rounded hover:bg-[#35373c]"
                        title="Tutup banner"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Dedicated Reaction Observation Panel (Out of Camera & 3D Viewport) */}
              {activeReaction && (
                <div className="bg-[#2b2d31] border-2 border-[#5865F2]/40 rounded-xl p-4 sm:p-6 text-[#dbdee1] space-y-4 shadow-2xl transition-all animate-in fade-in slide-in-from-top-2 duration-300">
                  {/* Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#3b3e45] pb-3.5">
                    <div className="flex items-center gap-2.5 font-bold text-sm sm:text-base text-white max-w-full">
                      <span className="p-1.5 rounded-lg bg-[#5865F2]/20 text-[#5865F2] border border-[#5865F2]/30 flex items-center justify-center">
                        <Sparkles className="w-4 h-4 text-[#57F287]" />
                      </span>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                        <span className="text-white font-extrabold text-base">Hasil Reaksi Terdeteksi:</span>
                        <span className="text-[#57F287] font-bold">{activeReaction.title}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-[#1e1f22] text-[#5865F2] px-3 py-1 rounded-full border border-[#5865F2]/40 shadow-sm">
                        Kurikulum Jenjang {activeReaction.level}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveReaction(null)}
                        className="p-1.5 px-3 text-xs font-semibold text-[#949ba4] hover:text-white hover:bg-[#35373c] rounded-lg transition-colors border border-transparent hover:border-[#4e5058]"
                      >
                        ✕ Tutup
                      </button>
                    </div>
                  </div>

                  {/* Persamaan Kimia & Produk */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-stretch">
                    <div className="lg:col-span-8 p-3.5 bg-[#1e1f22] border border-[#3b3e45] rounded-xl flex flex-col justify-center gap-1.5 shadow-inner">
                      <div className="flex items-center justify-between text-[11px] font-bold tracking-wider uppercase text-[#949ba4]">
                        <span>Persamaan Reaksi Kimia (Stoikiometri)</span>
                        <span className="text-xs text-[#5865F2] font-mono">Status: Seimbang</span>
                      </div>
                      <div className="text-sm sm:text-base font-bold font-mono text-[#57F287] overflow-x-auto py-1">
                        <code>{activeReaction.equation}</code>
                      </div>
                    </div>
                    <div className="lg:col-span-4 p-3.5 bg-[#1e1f22] border border-[#3b3e45] rounded-xl flex flex-col justify-center gap-1 shadow-inner">
                      <span className="text-[11px] font-bold tracking-wider uppercase text-[#949ba4]">Produk Reaksi</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-white/30 shrink-0 shadow"
                          style={{ backgroundColor: activeReaction.resultColor || "#38bdf8" }}
                        />
                        <span className="text-sm font-extrabold text-white truncate">
                          {activeReaction.resultName || "Produk Kimiawi"}
                        </span>
                      </div>
                      <div className="text-xs text-[#949ba4] font-mono">
                        Formula: <strong className="text-[#dbdee1]">{activeReaction.resultFormula}</strong>
                      </div>
                    </div>
                  </div>

                  {/* 3 Structured Columns: Alasan Terjadinya Reaksi, Penjelasan Sains Rinci, Ciri-Ciri Fisik & Termal */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch pt-1">
                    {/* Kolom 1: Alasan Terjadinya Reaksi */}
                    <div className="bg-[#1e1f22] border border-[#3b3e45] rounded-xl p-4 flex flex-col justify-between space-y-2 hover:border-[#FEE75C]/50 transition-colors">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#FEE75C] uppercase tracking-wide border-b border-[#2e3035] pb-2">
                          <span className="text-base">💡</span>
                          <span>Alasan Terjadinya Reaksi</span>
                        </div>
                        <p className="text-xs text-[#dbdee1] leading-relaxed">
                          {activeReaction.reasonWhy ||
                            "Reaksi terjadi akibat adanya driving force termodinamika atau afinitas ikatan antar-partikel zat (seperti pelepasan proton, pembentukan endapan tak larut, atau transfer elektron) menuju kondisi energi bebas yang lebih stabil."}
                        </p>
                      </div>
                      <div className="text-[10px] text-[#949ba4] italic pt-1 border-t border-[#2e3035]">
                        *Mekanisme molekuler & afinitas ikatan
                      </div>
                    </div>

                    {/* Kolom 2: Penjelasan Sains Rinci */}
                    <div className="bg-[#1e1f22] border border-[#3b3e45] rounded-xl p-4 flex flex-col justify-between space-y-2 hover:border-[#57F287]/50 transition-colors">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#57F287] uppercase tracking-wide border-b border-[#2e3035] pb-2">
                          <span className="text-base">📖</span>
                          <span>Penjelasan Sains Rinci</span>
                        </div>
                        <p className="text-xs text-[#dbdee1] leading-relaxed">
                          {activeReaction.explanation}
                        </p>
                      </div>
                      <div className="text-[10px] text-[#949ba4] italic pt-1 border-t border-[#2e3035]">
                        *Konsep materi kurikulum sains
                      </div>
                    </div>

                    {/* Kolom 3: Ciri-Ciri Fisik Teramati & Suhu Termal */}
                    <div className="bg-[#1e1f22] border border-[#3b3e45] rounded-xl p-4 flex flex-col justify-between space-y-3 hover:border-[#38bdf8]/50 transition-colors">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-bold text-[#38bdf8] uppercase tracking-wide border-b border-[#2e3035] pb-2">
                          <span className="text-base">👁️</span>
                          <span>Ciri-Ciri Fisik Teramati</span>
                        </div>
                        <p className="text-xs text-[#dbdee1] leading-relaxed">
                          {activeReaction.observablePhenomena ||
                            "Teramati perubahan warna larutan, pembentukan fase baru, dan perubahan temperatur wadah sesuai karakteristik produk reaksi."}
                        </p>
                      </div>

                      {/* Termal Badge */}
                      <div className="pt-2 border-t border-[#2e3035] space-y-1">
                        <span className="text-[10px] font-bold text-[#949ba4] uppercase">Perubahan Suhu Termal:</span>
                        <div
                          className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 ${
                            activeReaction.temperatureChange > 0
                              ? "bg-[#ef4444]/10 text-[#f87171] border-[#ef4444]/30"
                              : activeReaction.temperatureChange < 0
                              ? "bg-[#38bdf8]/10 text-[#38bdf8] border-[#38bdf8]/30"
                              : "bg-[#2b2d31] text-[#dbdee1] border-[#3b3e45]"
                          }`}
                        >
                          <span>
                            {activeReaction.temperatureChange > 0
                              ? "🔥"
                              : activeReaction.temperatureChange < 0
                              ? "❄️"
                              : "⚖️"}
                          </span>
                          <span>
                            {activeReaction.temperatureChange > 0
                              ? `+${activeReaction.temperatureChange}°C (Eksotermik / Melepas Panas)`
                              : activeReaction.temperatureChange < 0
                              ? `${activeReaction.temperatureChange}°C (Endotermik / Menyerap Panas)`
                              : "Suhu Stabil (Netral pada Suhu Ruang)"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#3b3e45]">
                    <div className="text-xs text-[#949ba4] flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-[#57F287]" />
                      <span>Hasil reaksi tercatat ke log observasi praktikum kelas.</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      {isTeacher ? (
                        <button
                          type="button"
                          onClick={() => {
                            setTeacherBuilderSection("create");
                            setActiveTab("teacher_builder");
                          }}
                          className="bg-[#5865F2] hover:bg-[#4752c4] text-white px-4 py-2 font-semibold text-xs rounded-lg flex items-center justify-center gap-2 shadow transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Rancang Jadi Tugas Siswa →</span>
                        </button>
                      ) : (
                        currentTask?.questions && currentTask.questions.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setIsQuizModalOpen(true)}
                            className="bg-[#5865F2] hover:bg-[#4752c4] text-white px-4 py-2 font-semibold text-xs rounded-lg flex items-center justify-center gap-2 shadow transition-colors"
                          >
                            <Award className="w-4 h-4 text-[#FEE75C]" />
                            <span>Lanjut ke Kuis Pemahaman AI →</span>
                          </button>
                        )
                      )}
                      <button
                        type="button"
                        onClick={() => setIsAiAssistantOpen(true)}
                        className="bg-[#2b2d31] hover:bg-[#35373c] text-white border border-[#3b3e45] px-3 py-2 font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#FEE75C]" />
                        <span>Konsultasi Asisten Lab-AI</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ===================================================================
              VIEW 2: DAFTAR TUGAS KELAS
              =================================================================== */}
          {activeTab === "tasks" && (
            <div className="space-y-5 max-w-5xl mx-auto w-full">
              <div className="bg-[#2b2d31] border border-[#3b3e45] rounded-xl p-5 flex flex-wrap items-center justify-between gap-3 shadow-md">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    Daftar Tugas Praktikum Sains
                  </h3>
                  <p className="text-xs text-[#949ba4] mt-0.5">
                    Pilih tugas praktikum yang telah disiapkan guru untuk dimulai di Meja 3D.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="PIN ROOM"
                    className="w-28 px-3 py-1.5 bg-[#1e1f22] border border-[#3b3e45] text-xs font-bold text-white text-center rounded-lg outline-none focus:border-[#5865F2]"
                  />
                  <button
                    type="button"
                    onClick={fetchTasks}
                    className="bg-[#5865F2] hover:bg-[#4752c4] text-white px-4 py-1.5 text-xs font-semibold rounded-lg transition-colors shadow"
                  >
                    Cari
                  </button>
                </div>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-12 text-[#949ba4] text-xs border border-dashed border-[#3b3e45] rounded-xl bg-[#2b2d31] p-8 space-y-4 max-w-lg mx-auto">
                  <div className="w-12 h-12 rounded-full bg-[#1e1f22] flex items-center justify-center mx-auto text-[#949ba4] border border-[#3b3e45]">
                    <ClipboardList className="w-6 h-6 text-[#5865F2]" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-white font-bold text-sm">Belum Ada Tugas Praktikum Aktif</h4>
                    <p className="text-xs text-[#949ba4] leading-relaxed">
                      {isTeacher
                        ? `Belum ada tugas yang diterbitkan untuk Room ${roomCode}. Silakan rancang tugas baru untuk kelas ini.`
                        : `Guru pengampu belum menerbitkan tugas praktikum baru untuk Room ${roomCode}. Anda dapat bereksplorasi di Meja Praktikum 3D.`}
                    </p>
                  </div>
                  {isTeacher ? (
                    <button
                      type="button"
                      onClick={() => {
                        setTeacherBuilderSection("create");
                        setActiveTab("teacher_builder");
                      }}
                      className="bg-[#5865F2] hover:bg-[#4752c4] text-white px-5 py-2.5 text-xs font-semibold rounded-lg shadow inline-flex items-center gap-2 transition-colors"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>+ Masuk ke Portal Guru &amp; Buat Tugas</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setActiveTab("lab")}
                      className="bg-[#23a55a] hover:bg-[#1f9250] text-white px-5 py-2.5 text-xs font-semibold rounded-lg shadow inline-flex items-center gap-2 transition-colors"
                    >
                      <FlaskConical className="w-4 h-4" />
                      <span>Eksplorasi Meja Praktikum 3D (Sandbox) →</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-[#2b2d31] hover:bg-[#35373c] border border-[#3b3e45] rounded-xl p-5 space-y-3 transition-colors flex flex-col justify-between shadow-md"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold bg-[#5865F2] text-white px-2 py-0.5 rounded uppercase">
                            {task.gradeLevel}
                          </span>
                          <span className="text-xs text-[#949ba4]">Guru: {task.teacherName}</span>
                        </div>

                        <h4 className="font-bold text-sm text-white">{task.title}</h4>
                        <p className="text-xs text-[#dbdee1] leading-relaxed">
                          {task.instructions}
                        </p>

                        <div className="text-xs text-[#57F287] font-semibold pt-1">
                          🔬 {task.chemicalIds?.length || 0} Reagen Kimia Tersedia di Meja 3D
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => applyTaskToWorkbench(task)}
                        className="bg-[#5865F2] hover:bg-[#4752c4] text-white w-full py-2.5 text-xs font-semibold rounded-lg transition-colors shadow text-center mt-2"
                      >
                        ▶ Buka Meja Lab & Mulai Praktikum
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================================================================
              VIEW 3: GURU MEMBUAT TUGAS (KHUSUS ROLE GURU & ADMIN)
              =================================================================== */}
          {activeTab === "teacher_builder" && isTeacher && (
            <div className="max-w-5xl mx-auto w-full">
              <TeacherTaskBuilder
                roomCode={roomCode}
                teacherName={currentUser?.name || "Budi Santoso, S.Pd"}
                tasks={tasks}
                initialSection={teacherBuilderSection}
                onSectionChange={setTeacherBuilderSection}
                onTaskCreated={() => {
                  fetchTasks();
                }}
                onDeleteTask={handleDeleteTask}
                onPreviewTask={(task) => applyTaskToWorkbench(task)}
                onCancel={() => {
                  setLabMode("sandbox");
                  setActiveTab("lab");
                }}
              />
            </div>
          )}
        </div>
      </main>

      {/* =========================================================================
          MODALS
          ========================================================================= */}
      {/* Modal 1: AI Lab Assistant Modal */}
      <AiLabAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        activeChemicalNames={activeChemNames}
        currentStep={currentTask?.title || "Eksplorasi Mandiri"}
      />

      {/* Modal 2: Post-Lab Quiz Modal */}
      {currentTask && (
        <PostLabQuizModal
          isOpen={isQuizModalOpen}
          onClose={() => setIsQuizModalOpen(false)}
          taskTitle={currentTask.title}
          questions={currentTask.questions || []}
          onSubmitQuiz={handleSubmitQuiz}
        />
      )}

      {/* Modal 3: Sandbox Mode - Chemical Catalog Picker Modal */}
      {isAddChemicalModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-[#2b2d31] border border-[#3b3e45] rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-4 border-b border-[#202225] flex items-center justify-between bg-[#1e1f22]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#23a55a] flex items-center justify-center text-white">
                  <FlaskConical className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm">
                    Katalog Reagen Kimia (Mode Sandbox)
                  </h3>
                  <p className="text-[11px] text-[#949ba4]">
                    Pilih bahan kimia untuk diletakkan di atas meja praktik lab 3D.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddChemicalModalOpen(false)}
                className="p-1 text-[#949ba4] hover:text-white rounded-lg hover:bg-[#35373c] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="p-3 border-b border-[#202225] bg-[#2b2d31] space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-[#949ba4] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchChemicalQuery}
                  onChange={(e) => setSearchChemicalQuery(e.target.value)}
                  placeholder="Cari zat kimia (misal: NaOH, Air, Asam Klorida, Garam)..."
                  className="w-full pl-9 pr-3 py-2 bg-[#1e1f22] border border-[#3b3e45] rounded-lg text-xs text-white placeholder-[#949ba4] outline-none focus:border-[#5865F2]"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                {["ALL", "asam", "basa", "garam", "oksidator", "organik", "indikator"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-2.5 py-1 rounded-full font-bold whitespace-nowrap transition-colors ${
                      selectedCategoryFilter === cat
                        ? "bg-[#5865F2] text-white"
                        : "bg-[#1e1f22] text-[#949ba4] hover:text-white hover:bg-[#35373c]"
                    }`}
                  >
                    {cat === "ALL" ? "Semua Kategori" : cat.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Chemicals Grid View */}
            <div className="p-4 overflow-y-auto flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {chemicalCatalog
                .filter((chem) => {
                  const q = searchChemicalQuery.toLowerCase();
                  const matchSearch =
                    chem.name.toLowerCase().includes(q) ||
                    chem.formula.toLowerCase().includes(q) ||
                    (chem.category || "").toLowerCase().includes(q);
                  const matchCat =
                    selectedCategoryFilter === "ALL" ||
                    (chem.category || "").toLowerCase() === selectedCategoryFilter.toLowerCase();
                  return matchSearch && matchCat;
                })
                .map((chem) => (
                  <div
                    key={chem.id}
                    className="p-3 bg-[#1e1f22] border border-[#3b3e45] rounded-xl flex items-center justify-between gap-3 hover:border-[#5865F2] transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl border border-black/30 flex items-center justify-center shrink-0 shadow"
                        style={{ backgroundColor: chem.color || "#06b6d4" }}
                      >
                        <FlaskConical className="w-4 h-4 text-white drop-shadow" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-white text-xs">
                            {chem.formula}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-bold uppercase bg-[#35373c] text-[#949ba4]">
                            {chem.level}
                          </span>
                        </div>
                        <div className="text-xs text-[#dbdee1] truncate">{chem.name}</div>
                        {chem.category && (
                          <div className="text-[10px] text-[#949ba4] capitalize">
                            {chem.category}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddChemicalToWorkbench(chem)}
                      className="px-3 py-1.5 bg-[#5865F2] group-hover:bg-[#4752c4] text-white text-xs font-bold rounded-lg shrink-0 flex items-center gap-1 shadow transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Taruh</span>
                    </button>
                  </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-[#202225] bg-[#1e1f22] flex items-center justify-between text-xs text-[#949ba4]">
              <span>
                {chemicalCatalog.length} reagen kimia siap digunakan di laboratorium 3D
              </span>
              <button
                type="button"
                onClick={() => setIsAddChemicalModalOpen(false)}
                className="px-3 py-1.5 bg-[#35373c] hover:bg-[#404249] text-white rounded-lg text-xs font-semibold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 4: Authentication & Role Login Modal (Guru & Siswa) */}
      <AuthLoginModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        currentUser={currentUser}
      />
    </div>
  );
}
