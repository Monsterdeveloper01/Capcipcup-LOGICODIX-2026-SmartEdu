"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import CameraFeed from "@/components/camera/CameraFeed";
import HandGestureTracker, { HandTransform } from "@/components/camera/HandGestureTracker";
import TeacherTaskBuilder from "./TeacherTaskBuilder";
import AiLabAssistantModal from "./AiLabAssistantModal";
import PostLabQuizModal from "./PostLabQuizModal";
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
  Users,
  GraduationCap,
  ClipboardList,
  Hash,
  Volume2,
  Mic,
  MicOff,
  Headphones,
  Settings,
  ChevronDown,
  Search,
  Bell,
  Pin,
  Send,
  Smile,
  MessageSquare,
  Compass,
  Video,
  VideoOff,
  Radio,
  X,
  Menu,
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
  // Mode state: "lab" | "teacher_builder" | "tasks"
  const [activeTab, setActiveTab] = useState<"lab" | "teacher_builder" | "tasks">("lab");

  // Discord UI States
  const [isMemberSidebarOpen, setIsMemberSidebarOpen] = useState<boolean>(true);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState<boolean>(false);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isDeafened, setIsDeafened] = useState<boolean>(false);
  const [chatMessageInput, setChatMessageInput] = useState<string>("");

  // Room & Tasks State
  const [roomCode, setRoomCode] = useState<string>("LAB889");
  const [tasks, setTasks] = useState<LabTask[]>([]);
  const [currentTask, setCurrentTask] = useState<LabTask | null>(null);
  const [studentName, setStudentName] = useState<string>("Ahmad Faiz");

  // 3D Lab State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [vessels, setVessels] = useState<ChemicalVessel[]>(INITIAL_VESSELS);
  const [activeReaction, setActiveReaction] = useState<ReactionDetail | null>(null);

  // Modals
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
        if (data.tasks.length > 0 && !currentTask) {
          applyTaskToWorkbench(data.tasks[0]);
        }
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
      const chem = CHEMICAL_CATALOG.find((c) => c.id === chemId) || {
        id: chemId,
        name: "Bahan Kimia",
        formula: "Reagen",
        color: "#38bdf8",
        level: task.level,
      };

      const posX = (index - ((task.chemicalIds.length - 1) / 2)) * 1.35;
      return {
        id: `v_${chem.id}_${index}`,
        name: chem.name,
        formula: chem.formula,
        type: index % 2 === 0 ? "beaker" : "flask",
        color: chem.color,
        initialColor: chem.color,
        position: [posX, 0.55, 0],
        level: task.level,
        liquidLevel: 0.7,
        temperatureC: 25,
      };
    });

    setVessels(taskVessels.length > 0 ? taskVessels : INITIAL_VESSELS);
    setActiveTab("lab");
  };

  const handleReactionDetected = (reaction: ReactionDetail) => {
    setActiveReaction(reaction);
    setIsTaskReactionDone(true);
  };

  const handleSubmitQuiz = async (score: number, answers: any[]) => {
    setLastQuizScore(score);
    if (!currentTask) return;

    try {
      await fetch("/api/lab/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId: currentTask.id,
          studentName,
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

  const handleSendChat = () => {
    if (!chatMessageInput.trim()) return;
    setIsAiAssistantOpen(true);
    setChatMessageInput("");
  };

  const activeChemNames = vessels.map((v) => `${v.name} (${v.formula})`);

  return (
    <div className="h-full w-full flex bg-[#1e1f22] overflow-hidden text-[#dbdee1] select-none font-sans">
      {/* =========================================================================
          DISCORD COLUMN 1: LEFT-MOST SERVER / GUILD RAIL (72px)
          ========================================================================= */}
      <div className="w-[72px] bg-[#1e1f22] flex flex-col items-center py-3 gap-2 shrink-0 z-30">
        {/* Direct Message / Home Button */}
        <div className="relative group flex items-center justify-center w-full">
          <div className="absolute left-0 w-1 h-5 bg-white rounded-r transition-all duration-200 opacity-0 group-hover:opacity-100 group-hover:h-8" />
          <button
            type="button"
            onClick={() => setActiveTab("lab")}
            className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-[#5865F2] text-[#dbdee1] hover:text-white flex items-center justify-center transition-all duration-200 shadow-md group-hover:shadow-lg"
            title="Beranda Lab Sains"
          >
            <FlaskConical className="w-6 h-6" />
          </button>
        </div>

        {/* Server Separator */}
        <div className="w-8 h-[2px] bg-[#35363c] rounded-full my-0.5" />

        {/* Server 1: Active Capcipcup Science Lab */}
        <div className="relative group flex items-center justify-center w-full">
          <div className="absolute left-0 w-1 h-10 bg-white rounded-r transition-all duration-200" />
          <button
            type="button"
            onClick={() => setActiveTab("lab")}
            className="w-12 h-12 rounded-[16px] bg-[#5865F2] text-white flex items-center justify-center transition-all duration-200 shadow-lg font-black text-sm"
            title="Capcipcup SmartEdu Science Lab"
          >
            🔬
          </button>
        </div>

        {/* Server 2: Kimia Praktik */}
        <div className="relative group flex items-center justify-center w-full">
          <div className="absolute left-0 w-1 h-2 bg-white rounded-r transition-all duration-200 opacity-0 group-hover:opacity-100 group-hover:h-6" />
          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-[#5865F2] text-[#dbdee1] hover:text-white flex items-center justify-center transition-all duration-200 font-bold text-sm"
            title="Kelas Reaksi Kimia (SD/SMP/SMA)"
          >
            🧪
          </button>
        </div>

        {/* Server 3: Fisika Praktikum */}
        <div className="relative group flex items-center justify-center w-full">
          <div className="absolute left-0 w-1 h-2 bg-white rounded-r transition-all duration-200 opacity-0 group-hover:opacity-100 group-hover:h-6" />
          <button
            type="button"
            className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-[#5865F2] text-[#dbdee1] hover:text-white flex items-center justify-center transition-all duration-200 font-bold text-sm"
            title="Kelas Fisika Mekanika"
          >
            ⚛️
          </button>
        </div>

        {/* Server 4: Biologi Pintar */}
        <div className="relative group flex items-center justify-center w-full">
          <div className="absolute left-0 w-1 h-2 bg-white rounded-r transition-all duration-200 opacity-0 group-hover:opacity-100 group-hover:h-6" />
          <button
            type="button"
            className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-[#5865F2] text-[#dbdee1] hover:text-white flex items-center justify-center transition-all duration-200 font-bold text-sm"
            title="Kelas Biologi Molekuler"
          >
            🧬
          </button>
        </div>

        {/* Add Server Button */}
        <div className="relative group flex items-center justify-center w-full">
          <button
            type="button"
            onClick={() => {
              const newPin = prompt("Masukkan PIN Room Baru:", roomCode);
              if (newPin) setRoomCode(newPin.toUpperCase().trim());
            }}
            className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-[#23a55a] text-[#23a55a] hover:text-white flex items-center justify-center transition-all duration-200"
            title="Ganti / Gabung Room Kelas Baru"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* Explore Server Button */}
        <div className="relative group flex items-center justify-center w-full mt-auto">
          <button
            type="button"
            className="w-12 h-12 rounded-[24px] hover:rounded-[16px] bg-[#313338] hover:bg-[#23a55a] text-[#23a55a] hover:text-white flex items-center justify-center transition-all duration-200"
            title="Jelajahi Praktikum Publik"
          >
            <Compass className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          DISCORD COLUMN 2: CHANNEL SIDEBAR & SERVER NAV (240px)
          ========================================================================= */}
      <div
        className={`w-60 bg-[#2b2d31] flex flex-col shrink-0 border-r border-[#202225] z-20 ${
          isMobileNavOpen ? "absolute inset-y-0 left-[72px] shadow-2xl flex" : "hidden md:flex"
        }`}
      >
        {/* Server Header Dropdown */}
        <div className="h-12 border-b border-[#202225] px-4 flex items-center justify-between font-bold text-white hover:bg-[#35373c]/60 cursor-pointer transition-colors shadow-sm">
          <div className="flex items-center gap-1.5 truncate">
            <span className="truncate text-sm font-bold">Capcipcup SmartEdu</span>
            <span className="w-4 h-4 rounded-full bg-[#5865F2] text-white flex items-center justify-center text-[10px] shrink-0 font-bold">
              ✓
            </span>
          </div>
          <ChevronDown className="w-4 h-4 text-[#949ba4] shrink-0" />
        </div>

        {/* Room PIN Badge */}
        <div className="px-3 pt-3 pb-1">
          <div className="bg-[#1e1f22] border border-[#35373c] rounded-lg p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#57F287] animate-pulse" />
              <div className="text-[11px] font-semibold text-white">
                ROOM: <span className="text-[#57F287] font-mono font-bold">{roomCode}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const newPin = prompt("Masukkan PIN Room:", roomCode);
                if (newPin) setRoomCode(newPin.toUpperCase().trim());
              }}
              className="text-[10px] bg-[#35373c] hover:bg-[#5865F2] text-white px-1.5 py-0.5 rounded font-medium transition-colors"
            >
              Ubah
            </button>
          </div>
        </div>

        {/* Channels List */}
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4 text-xs font-medium">
          {/* CATEGORY 1: LABORATORIUM 3D */}
          <div className="space-y-0.5">
            <div className="px-2 py-1 text-[11px] font-bold text-[#949ba4] uppercase tracking-wider flex items-center justify-between">
              <span>🔬 Laboratorium 3D</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveTab("lab");
                setIsMobileNavOpen(false);
              }}
              className={`w-full px-2.5 py-1.5 rounded flex items-center justify-between text-left transition-colors ${
                activeTab === "lab"
                  ? "bg-[#404249] text-white font-semibold"
                  : "text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Hash className="w-4 h-4 text-[#80848e] shrink-0" />
                <span className="truncate">meja-lab-3d</span>
              </div>
              <span className="text-[10px] bg-[#57F287]/20 text-[#57F287] px-1.5 py-0.2 rounded font-bold">
                LIVE
              </span>
            </button>

            <button
              type="button"
              onClick={() => setIsMemberSidebarOpen(true)}
              className="w-full px-2.5 py-1.5 rounded flex items-center justify-between text-left text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1] transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <Hash className="w-4 h-4 text-[#80848e] shrink-0" />
                <span className="truncate">reagen-aktif</span>
              </div>
              <span className="text-[10px] bg-[#1e1f22] text-[#949ba4] px-1.5 py-0.2 rounded">
                {vessels.length}
              </span>
            </button>
          </div>

          {/* CATEGORY 2: TUGAS & KELAS */}
          <div className="space-y-0.5">
            <div className="px-2 py-1 text-[11px] font-bold text-[#949ba4] uppercase tracking-wider flex items-center justify-between">
              <span>📋 Tugas & Praktikum</span>
            </div>

            <button
              type="button"
              onClick={() => {
                setActiveTab("tasks");
                setIsMobileNavOpen(false);
              }}
              className={`w-full px-2.5 py-1.5 rounded flex items-center justify-between text-left transition-colors ${
                activeTab === "tasks"
                  ? "bg-[#404249] text-white font-semibold"
                  : "text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Hash className="w-4 h-4 text-[#80848e] shrink-0" />
                <span className="truncate">daftar-tugas</span>
              </div>
              {tasks.length > 0 && (
                <span className="text-[10px] bg-[#5865F2] text-white px-1.5 py-0.2 rounded font-bold">
                  {tasks.length}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab("teacher_builder");
                setIsMobileNavOpen(false);
              }}
              className={`w-full px-2.5 py-1.5 rounded flex items-center justify-between text-left transition-colors ${
                activeTab === "teacher_builder"
                  ? "bg-[#404249] text-white font-semibold"
                  : "text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1]"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <Hash className="w-4 h-4 text-[#80848e] shrink-0" />
                <span className="truncate">guru-buat-tugas</span>
              </div>
              <span className="text-[9px] bg-[#FEE75C] text-black px-1.5 py-0.2 rounded font-black uppercase">
                GURU
              </span>
            </button>
          </div>

          {/* CATEGORY 3: AI & EVALUASI */}
          <div className="space-y-0.5">
            <div className="px-2 py-1 text-[11px] font-bold text-[#949ba4] uppercase tracking-wider flex items-center justify-between">
              <span>🤖 Asisten AI & Evaluasi</span>
            </div>

            <button
              type="button"
              onClick={() => setIsAiAssistantOpen(true)}
              className="w-full px-2.5 py-1.5 rounded flex items-center justify-between text-left text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1] transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <Hash className="w-4 h-4 text-[#80848e] shrink-0" />
                <span className="truncate">tanya-lab-ai</span>
              </div>
              <span className="text-[9px] bg-[#5865F2] text-white px-1 py-0.2 rounded font-bold">
                BOT
              </span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (currentTask) setIsQuizModalOpen(true);
                else alert("Pilih tugas terlebih dahulu dari channel #daftar-tugas!");
              }}
              className="w-full px-2.5 py-1.5 rounded flex items-center justify-between text-left text-[#949ba4] hover:bg-[#35373c] hover:text-[#dbdee1] transition-colors"
            >
              <div className="flex items-center gap-2 truncate">
                <Hash className="w-4 h-4 text-[#80848e] shrink-0" />
                <span className="truncate">kuis-evaluasi</span>
              </div>
              {lastQuizScore !== null && (
                <span className="text-[10px] bg-[#57F287] text-black px-1.5 py-0.2 rounded font-black">
                  {lastQuizScore}
                </span>
              )}
            </button>
          </div>

          {/* CATEGORY 4: VOICE CHANNELS */}
          <div className="space-y-0.5">
            <div className="px-2 py-1 text-[11px] font-bold text-[#949ba4] uppercase tracking-wider flex items-center justify-between">
              <span>🔊 Voice & Sensor Comm</span>
            </div>

            <div className="w-full px-2.5 py-1.5 rounded flex items-center justify-between text-left text-[#57F287] bg-[#35373c]/30">
              <div className="flex items-center gap-2 truncate">
                <Volume2 className="w-4 h-4 text-[#57F287] shrink-0" />
                <span className="truncate font-medium">Lab Audio Stage #1</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] font-bold text-[#57F287]">
                <Radio className="w-3 h-3 animate-pulse" />
                <span>24ms</span>
              </div>
            </div>
          </div>
        </div>

        {/* Discord User Bar Footer */}
        <div className="h-[52px] bg-[#232428] px-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 overflow-hidden hover:bg-[#35373c]/50 p-1 rounded cursor-pointer transition-colors flex-1 min-w-0 mr-1">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-bold text-xs">
                AF
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#57F287] border-2 border-[#232428]" />
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate">{studentName}</div>
              <div className="text-[10px] text-[#949ba4] truncate">#2026 • Siswa</div>
            </div>
          </div>

          <div className="flex items-center text-[#b5bac1]">
            <button
              type="button"
              onClick={() => setIsMicMuted((prev) => !prev)}
              className={`p-1.5 hover:text-white hover:bg-[#35373c] rounded transition-colors ${
                isMicMuted ? "text-[#ed4245]" : ""
              }`}
              title={isMicMuted ? "Nyalakan Mikrofon" : "Matikan Mikrofon"}
            >
              {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setIsDeafened((prev) => !prev)}
              className={`p-1.5 hover:text-white hover:bg-[#35373c] rounded transition-colors ${
                isDeafened ? "text-[#ed4245]" : ""
              }`}
              title={isDeafened ? "Nyalakan Suara" : "Bisukan"}
            >
              <Headphones className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                const name = prompt("Ganti nama siswa:", studentName);
                if (name) setStudentName(name);
              }}
              className="p-1.5 hover:text-white hover:bg-[#35373c] rounded transition-colors"
              title="Pengaturan Profil"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* =========================================================================
          DISCORD COLUMN 3: MAIN STAGE & CHAT WORKSPACE
          ========================================================================= */}
      <div className="flex-1 flex flex-col bg-[#313338] min-w-0 overflow-hidden">
        {/* Top Channel Header Bar */}
        <div className="h-12 border-b border-[#202225] bg-[#313338] px-4 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-2 overflow-hidden">
            <button
              type="button"
              onClick={() => setIsMobileNavOpen((prev) => !prev)}
              className="md:hidden p-1 text-[#949ba4] hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>

            <Hash className="w-5 h-5 text-[#80848e] shrink-0" />
            <h2 className="font-bold text-sm text-[#f2f3f5] truncate">
              {activeTab === "lab"
                ? "meja-lab-3d"
                : activeTab === "tasks"
                ? "daftar-tugas"
                : "guru-buat-tugas"}
            </h2>

            <div className="hidden sm:block h-4 w-[1px] bg-[#4e5058] mx-1" />

            <span className="hidden sm:inline-block text-xs text-[#949ba4] truncate font-medium">
              {activeTab === "lab"
                ? "Meja eksperimen kimia 3D Web-AR real-time dengan gesture & AI"
                : activeTab === "tasks"
                ? "Daftar tugas praktikum yang ditugaskan oleh guru kelas"
                : "Portal rancang praktikum kimia dan pembuat kuis otomatis"}
            </span>
          </div>

          {/* Right Header Action Icons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCameraActive((prev) => !prev)}
              className={`px-3 py-1 text-xs font-semibold rounded flex items-center gap-1.5 transition-colors ${
                isCameraActive
                  ? "bg-[#23a55a] text-white hover:bg-[#1f9250]"
                  : "bg-[#ed4245] text-white hover:bg-[#da373c]"
              }`}
              title="Toggle Live Video Feed"
            >
              {isCameraActive ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isCameraActive ? "LIVE CAMERA" : "CAMERA OFF"}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsAiAssistantOpen(true)}
              className="px-2.5 py-1 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-semibold rounded flex items-center gap-1.5 transition-colors shadow-sm"
              title="Tanya Asisten Lab-AI"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Tanya AI</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMemberSidebarOpen((prev) => !prev)}
              className={`p-1.5 hover:text-white rounded transition-colors ${
                isMemberSidebarOpen ? "text-white bg-[#35373c]" : "text-[#949ba4] hover:bg-[#35373c]"
              }`}
              title="Daftar Siswa & Reagen"
            >
              <Users className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Main Body Area */}
        <div className="flex-1 overflow-y-auto flex flex-col bg-[#313338]">
          {/* ===================================================================
              VIEW 1: LAB 3D & DISCORD CALL STAGE
              =================================================================== */}
          {activeTab === "lab" && (
            <div className="flex-1 flex flex-col p-3 sm:p-4 gap-4">
              {/* Discord Video Call / Stage Container */}
              <div className="bg-[#111214] border border-[#202225] rounded-xl overflow-hidden relative shadow-2xl h-[440px] sm:h-[500px] shrink-0">
                {/* Layer 0: Camera Feed (AR overlay) */}
                {isCameraActive && (
                  <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
                    <CameraFeed
                      isActive={isCameraActive}
                      onVideoReady={setVideoElement}
                      showControls={false}
                      className="w-full h-full rounded-none"
                    />
                  </div>
                )}

                {/* Layer 1: Hand Gesture Tracker */}
                {isCameraActive && (
                  <HandGestureTracker
                    videoElement={videoElement}
                    isActive={isCameraActive}
                    onGestureUpdate={handleGestureUpdate}
                  />
                )}

                {/* Layer 2: 3D WebGL Canvas */}
                <div className="absolute inset-0 z-10 pointer-events-auto">
                  <ChemistryLabScene
                    handTransform={isCameraActive ? handTransform : undefined}
                    onReactionDetected={handleReactionDetected}
                    vessels={vessels}
                    setVessels={setVessels}
                    activeReaction={activeReaction}
                  />
                </div>

                {/* Layer 3: Top Live HUD Overlays (Discord Stream Tags) */}
                <div className="absolute top-3 left-3 z-20 flex items-center gap-2 pointer-events-none font-sans">
                  <span className="bg-[#ed4245] text-white text-[11px] font-bold px-2 py-0.5 rounded flex items-center gap-1.5 shadow">
                    <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                    LIVE 60FPS
                  </span>
                  <span className="bg-[#1e1f22]/80 backdrop-blur-md text-[#dbdee1] text-xs font-semibold px-2.5 py-0.5 rounded border border-[#35363c]">
                    {studentName}&apos;s Lab Workbench
                  </span>
                </div>

                <div className="absolute top-3 right-3 z-20 flex items-center gap-2 pointer-events-none font-sans">
                  <div className="bg-[#1e1f22]/90 backdrop-blur-md border border-[#35363c] px-3 py-1 rounded-lg text-xs shadow space-y-0.5 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-[#57F287]">
                      <span className={`w-2 h-2 rounded-full ${handTransform.handDetected ? "bg-[#57F287] animate-pulse" : "bg-[#ed4245]"}`} />
                      <span>{handTransform.handDetected ? "Sensor Tangan: Terdeteksi" : "Sensor: Mencari Tangan..."}</span>
                    </div>
                    <div className="text-[10px] text-[#949ba4]">
                      {handTransform.isGrabbing
                        ? "✊ Memegang Bejana"
                        : handTransform.handDetected
                        ? "✋ Mode Membidik (Hover)"
                        : "Arahkan telapak tangan ke kamera"}
                    </div>
                  </div>
                </div>

                {/* Layer 4: Discord Bottom Call Control Dock */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5 bg-[#1e1f22]/90 backdrop-blur-md px-4 py-2 rounded-full border border-[#35363c] shadow-2xl pointer-events-auto">
                  <button
                    type="button"
                    onClick={() => setIsCameraActive((prev) => !prev)}
                    className={`p-2.5 rounded-full transition-colors ${
                      isCameraActive ? "bg-[#313338] hover:bg-[#35373c] text-white" : "bg-[#ed4245] hover:bg-[#da373c] text-white"
                    }`}
                    title={isCameraActive ? "Matikan Kamera Web-AR" : "Nyalakan Kamera Web-AR"}
                  >
                    {isCameraActive ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (currentTask) applyTaskToWorkbench(currentTask);
                      else setVessels(INITIAL_VESSELS);
                    }}
                    className="p-2.5 bg-[#313338] hover:bg-[#35373c] text-[#dbdee1] hover:text-white rounded-full transition-colors"
                    title="Reset Posisi Bejana Kimia"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <div className="h-5 w-[1px] bg-[#4e5058] mx-0.5" />

                  <button
                    type="button"
                    onClick={() => setIsAiAssistantOpen(true)}
                    className="px-3.5 py-1.5 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-semibold rounded-full flex items-center gap-1.5 transition-colors shadow"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Konsultasi AI</span>
                  </button>

                  {currentTask?.questions && currentTask.questions.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setIsQuizModalOpen(true)}
                      className={`px-3.5 py-1.5 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-colors shadow ${
                        isTaskReactionDone
                          ? "bg-[#FEE75C] text-black hover:bg-yellow-400 font-bold animate-pulse"
                          : "bg-[#2b2d31] hover:bg-[#35373c] text-white"
                      }`}
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>{lastQuizScore !== null ? `Kuis: ${lastQuizScore}/100` : "Kerjakan Kuis"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Discord Embed & Message Activity Stream */}
              <div className="space-y-4 font-sans max-w-4xl">
                {/* Activity 1: Teacher Mission Announcement Embed */}
                {currentTask && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-amber-600 flex items-center justify-center text-white text-base font-bold shrink-0 shadow">
                      👨‍🏫
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">Guru IPA ({currentTask.teacherName})</span>
                        <span className="text-[10px] bg-[#FEE75C] text-black px-1.5 py-0.2 rounded font-black uppercase">
                          GURU
                        </span>
                        <span className="text-[11px] text-[#949ba4]">Hari ini pukul 16:30</span>
                      </div>

                      {/* Discord Rich Embed Card */}
                      <div className="bg-[#2b2d31] border-l-4 border-[#5865F2] rounded-md p-3.5 space-y-2 text-xs shadow-md">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] uppercase font-bold text-[#5865F2]">
                            Tugas Praktikum Terbit: Jenjang {currentTask.gradeLevel}
                          </span>
                          <span className="text-[10px] text-[#949ba4] font-mono">PIN: {currentTask.roomCode}</span>
                        </div>

                        <h4 className="font-bold text-sm text-[#f2f3f5]">{currentTask.title}</h4>
                        <p className="text-xs text-[#dbdee1] leading-relaxed">{currentTask.instructions}</p>

                        <div className="pt-2 border-t border-[#35363c] flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <span className="text-[#949ba4]">
                            🔬 {currentTask.chemicalIds?.length || 0} Reagen Kimia disiapkan di meja lab 3D.
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setIsAiAssistantOpen(true)}
                              className="text-[#5865F2] hover:underline font-semibold"
                            >
                              Tanya Konsep ke AI →
                            </button>
                            {currentTask.questions && currentTask.questions.length > 0 && (
                              <button
                                type="button"
                                onClick={() => setIsQuizModalOpen(true)}
                                className="bg-[#5865F2] hover:bg-[#4752c4] text-white px-2.5 py-1 rounded font-semibold transition-colors"
                              >
                                Buka Lembar Kuis
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Activity 2: Bot Reaction Result Embed */}
                {activeReaction && (
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#5865F2] flex items-center justify-center text-white text-base font-bold shrink-0 shadow">
                      🤖
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-[#5865F2]">Kak Lab-AI</span>
                        <span className="text-[10px] bg-[#5865F2] text-white px-1.5 py-0.2 rounded font-bold uppercase">
                          BOT
                        </span>
                        <span className="text-[11px] text-[#949ba4]">Baru saja</span>
                      </div>

                      {/* Discord Reaction Embed Card */}
                      <div className="bg-[#2b2d31] border-l-4 border-[#57F287] rounded-md p-4 space-y-3 shadow-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-bold text-[#57F287]">
                            <Sparkles className="w-4 h-4" />
                            <span>⚡ Reaksi Berhasil Terdeteksi: [{activeReaction.title}]</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold bg-[#1e1f22] text-[#57F287] px-2 py-0.5 rounded border border-[#3b3e45]">
                              JENJANG {activeReaction.level}
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveReaction(null)}
                              className="text-[#949ba4] hover:text-white p-1"
                              title="Tutup Embed Reaksi"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Equation in Discord Code Block */}
                        <div className="bg-[#1e1f22] border border-[#3b3e45] rounded p-2.5 font-mono text-xs text-[#57F287] font-semibold overflow-x-auto">
                          <code>{activeReaction.equation}</code>
                        </div>

                        <p className="text-xs text-[#dbdee1] leading-relaxed">
                          {activeReaction.explanation}
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[#3b3e45] text-xs">
                          <div className="space-y-0.5">
                            <span className="text-[10px] uppercase font-bold text-[#949ba4]">Perubahan Suhu Termal:</span>
                            <div className="font-bold text-white">
                              {activeReaction.temperatureChange > 0
                                ? `🔥 +${activeReaction.temperatureChange}°C (Eksotermik / Melepas Panas)`
                                : activeReaction.temperatureChange < 0
                                ? `❄️ ${activeReaction.temperatureChange}°C (Endotermik / Menyerap Panas)`
                                : "Suhu Stabil (Netral)"}
                            </div>
                          </div>

                          <div className="space-y-0.5">
                            <span className="text-[10px] uppercase font-bold text-[#949ba4]">Status Eksperimen:</span>
                            <div className="font-bold text-[#57F287] flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Reaksi Kimia Tervalidasi</span>
                            </div>
                          </div>
                        </div>

                        {/* Discord Action Row Buttons */}
                        <div className="flex flex-wrap items-center gap-2 pt-2">
                          {currentTask?.questions && currentTask.questions.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setIsQuizModalOpen(true)}
                              className="bg-[#5865F2] hover:bg-[#4752c4] text-white px-4 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow"
                            >
                              <Award className="w-4 h-4" />
                              <span>Kerjakan Kuis Evaluasi AI →</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setIsAiAssistantOpen(true)}
                            className="bg-[#4e5058] hover:bg-[#6d6f78] text-white px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Tanyakan Penjelasan ke AI</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Discord Chat Input Box */}
                <div className="pt-2">
                  <div className="bg-[#383a40] rounded-lg px-4 py-2.5 flex items-center gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => setIsAiAssistantOpen(true)}
                      className="w-6 h-6 rounded-full bg-[#4e5058] hover:bg-[#5865F2] text-white flex items-center justify-center transition-colors text-xs font-bold"
                      title="Mulai Diskusi dengan AI"
                    >
                      +
                    </button>
                    <input
                      type="text"
                      value={chatMessageInput}
                      onChange={(e) => setChatMessageInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                      placeholder="Kirim pesan ke #meja-lab-3d atau tanyakan konsep reaksi ke Kak Lab-AI..."
                      className="flex-1 bg-transparent border-none outline-none text-white placeholder-[#80848e] text-xs font-medium"
                    />
                    <button
                      type="button"
                      onClick={handleSendChat}
                      className="text-[#949ba4] hover:text-[#5865F2] p-1 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ===================================================================
              VIEW 2: DISCORD FORUM / DAFTAR TUGAS KELAS
              =================================================================== */}
          {activeTab === "tasks" && (
            <div className="p-4 sm:p-6 space-y-5 max-w-5xl mx-auto w-full">
              {/* Forum Channel Welcome Banner */}
              <div className="bg-[#2b2d31] border border-[#202225] rounded-xl p-5 space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Hash className="w-5 h-5 text-[#5865F2]" />
                      <span>Daftar Tugas Praktikum Sains</span>
                    </h3>
                    <p className="text-xs text-[#949ba4] mt-1">
                      Pilih praktikum yang telah disiapkan oleh guru untuk memulai simulasi 3D Web-AR dan kuis evaluasi.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={roomCode}
                      onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                      placeholder="PIN ROOM"
                      className="w-28 px-3 py-1.5 bg-[#1e1f22] border border-[#3b3e45] text-xs font-bold text-white text-center rounded outline-none focus:border-[#5865F2]"
                    />
                    <button
                      type="button"
                      onClick={fetchTasks}
                      className="bg-[#5865F2] hover:bg-[#4752c4] text-white px-4 py-1.5 text-xs font-semibold rounded transition-colors shadow"
                    >
                      Cari Room
                    </button>
                  </div>
                </div>
              </div>

              {tasks.length === 0 ? (
                <div className="text-center py-12 text-[#949ba4] text-xs border border-dashed border-[#3b3e45] rounded-xl bg-[#2b2d31] p-6 space-y-3">
                  <p>Belum ada tugas praktikum di Room {roomCode}.</p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("teacher_builder")}
                    className="bg-[#5865F2] hover:bg-[#4752c4] text-white px-4 py-2 text-xs font-semibold rounded-lg shadow"
                  >
                    + Masuk ke Portal Guru & Buat Tugas
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {tasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-[#2b2d31] hover:bg-[#35373c] border border-[#202225] rounded-xl p-4 space-y-3 transition-colors flex flex-col justify-between shadow-md"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold bg-[#5865F2] text-white px-2 py-0.5 rounded uppercase">
                            {task.gradeLevel}
                          </span>
                          <span className="text-xs text-[#949ba4]">Guru: {task.teacherName}</span>
                        </div>

                        <h4 className="font-bold text-sm text-[#f2f3f5]">{task.title}</h4>
                        <p className="text-xs text-[#dbdee1] leading-relaxed line-clamp-3">
                          {task.instructions}
                        </p>

                        <div className="text-xs text-[#57F287] font-semibold pt-1">
                          🔬 {task.chemicalIds?.length || 0} Reagen Kimia Siap di Meja Lab
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#3b3e45] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 text-xs text-[#949ba4]">
                          <span className="px-1.5 py-0.5 bg-[#1e1f22] rounded text-[11px]">👍 14</span>
                          <span className="px-1.5 py-0.5 bg-[#1e1f22] rounded text-[11px]">🧪 8</span>
                        </div>

                        <button
                          type="button"
                          onClick={() => applyTaskToWorkbench(task)}
                          className="bg-[#5865F2] hover:bg-[#4752c4] text-white px-4 py-2 text-xs font-semibold rounded-lg transition-colors shadow"
                        >
                          ▶ Buka Meja Lab 3D
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ===================================================================
              VIEW 3: DISCORD TEACHER TASK BUILDER
              =================================================================== */}
          {activeTab === "teacher_builder" && (
            <div className="p-4 sm:p-6">
              <TeacherTaskBuilder
                roomCode={roomCode}
                onTaskCreated={() => {
                  fetchTasks();
                  setActiveTab("tasks");
                }}
                onCancel={() => setActiveTab("lab")}
              />
            </div>
          )}
        </div>
      </div>

      {/* =========================================================================
          DISCORD COLUMN 4: MEMBER & REAGENTS SIDEBAR (240px)
          ========================================================================= */}
      {isMemberSidebarOpen && (
        <div className="w-60 bg-[#2b2d31] border-l border-[#202225] flex flex-col shrink-0 select-none hidden lg:flex">
          {/* Members Sidebar Header */}
          <div className="h-12 border-b border-[#202225] px-4 flex items-center justify-between text-xs font-bold text-[#949ba4] uppercase tracking-wider">
            <span>Daftar Anggota Lab</span>
            <button
              type="button"
              onClick={() => setIsMemberSidebarOpen(false)}
              className="text-[#949ba4] hover:text-white p-1"
            >
              ✕
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-4 text-xs font-medium">
            {/* GROUP 1: GURU & AI BOT */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider px-2">
                Instruktur & AI — 2
              </span>

              {/* Bot: Kak Lab-AI */}
              <div
                onClick={() => setIsAiAssistantOpen(true)}
                className="flex items-center gap-2.5 p-1.5 rounded hover:bg-[#35373c] cursor-pointer transition-colors"
              >
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-bold text-xs">
                    🤖
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#57F287] border-2 border-[#2b2d31]" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-[#5865F2] truncate">Kak Lab-AI</span>
                    <span className="text-[9px] bg-[#5865F2] text-white px-1 rounded font-bold">BOT</span>
                  </div>
                  <div className="text-[10px] text-[#949ba4] truncate">Menganalisis Reaksi 3D</div>
                </div>
              </div>

              {/* Guru */}
              <div className="flex items-center gap-2.5 p-1.5 rounded hover:bg-[#35373c] cursor-pointer transition-colors">
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-full bg-amber-600 flex items-center justify-center text-white font-bold text-xs">
                    👨‍🏫
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#57F287] border-2 border-[#2b2d31]" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-white truncate">Guru IPA</span>
                    <span className="text-[9px] bg-[#FEE75C] text-black px-1 rounded font-black">GURU</span>
                  </div>
                  <div className="text-[10px] text-[#949ba4] truncate">Online</div>
                </div>
              </div>
            </div>

            {/* GROUP 2: SISWA DI LAB */}
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider px-2">
                Siswa di Lab — 1
              </span>

              <div className="flex items-center gap-2.5 p-1.5 rounded bg-[#35373c]/50">
                <div className="relative shrink-0">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">
                    👤
                  </div>
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#57F287] border-2 border-[#2b2d31]" />
                </div>
                <div className="truncate">
                  <span className="font-semibold text-white truncate">{studentName} (Kamu)</span>
                  <div className="text-[10px] text-[#57F287] truncate">Streaming 3D Web-AR</div>
                </div>
              </div>
            </div>

            {/* GROUP 3: INVENTARIS REAGEN DI MEJA */}
            <div className="space-y-1 pt-2 border-t border-[#3b3e45]">
              <span className="text-[11px] font-bold text-[#949ba4] uppercase tracking-wider px-2 flex items-center justify-between">
                <span>Reagen di Meja</span>
                <span className="text-[#57F287]">{vessels.length}</span>
              </span>

              <div className="space-y-1 pt-1">
                {vessels.map((v, i) => (
                  <div
                    key={v.id || i}
                    className="p-2 rounded bg-[#1e1f22] border border-[#3b3e45] space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-white text-xs">{v.formula}</span>
                      <span
                        className="w-3 h-3 rounded-full border border-black shadow"
                        style={{ backgroundColor: v.color }}
                      />
                    </div>
                    <div className="text-[11px] text-[#949ba4] truncate">{v.name}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          DISCORD MODALS
          ========================================================================= */}
      {/* Modal 1: AI Lab Assistant */}
      <AiLabAssistantModal
        isOpen={isAiAssistantOpen}
        onClose={() => setIsAiAssistantOpen(false)}
        activeChemicalNames={activeChemNames}
        currentStep={currentTask?.title || "Eksplorasi Mandiri"}
      />

      {/* Modal 2: Post-Lab Quiz */}
      {currentTask && (
        <PostLabQuizModal
          isOpen={isQuizModalOpen}
          onClose={() => setIsQuizModalOpen(false)}
          taskTitle={currentTask.title}
          questions={currentTask.questions || []}
          onSubmitQuiz={handleSubmitQuiz}
        />
      )}
    </div>
  );
}
