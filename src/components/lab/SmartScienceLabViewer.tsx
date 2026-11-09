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

  // Mobile drawer state
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

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
          <div className="flex items-center gap-2.5">
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
          </div>

          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(false)}
            className="md:hidden text-[#949ba4] hover:text-white p-1"
          >
            <X className="w-5 h-5" />
          </button>
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
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-5 text-xs font-semibold">
          {/* Section 1: Menu Utama */}
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

            <button
              type="button"
              onClick={() => {
                setActiveTab("teacher_builder");
                setIsMobileDrawerOpen(false);
              }}
              className={`w-full px-3 py-2 rounded-lg flex items-center justify-between text-left transition-colors ${
                activeTab === "teacher_builder"
                  ? "bg-[#5865F2] text-white shadow-sm"
                  : "text-[#dbdee1] hover:bg-[#35373c] hover:text-white"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <GraduationCap className="w-4 h-4" />
                <span>Portal Guru (Buat Tugas)</span>
              </div>
              <span className="text-[9px] bg-[#FEE75C] text-black px-1.5 py-0.2 rounded font-black">
                GURU
              </span>
            </button>
          </div>

          {/* Section 2: Fitur AI & Evaluasi */}
          <div className="space-y-1">
            <span className="px-2 text-[10px] font-bold text-[#949ba4] uppercase tracking-wider">
              Asisten AI & Evaluasi
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
          </div>

          {/* Section 3: Reagen Aktif di Meja */}
          <div className="space-y-1.5 pt-2 border-t border-[#3b3e45]">
            <span className="px-2 text-[10px] font-bold text-[#949ba4] uppercase tracking-wider flex items-center justify-between">
              <span>Bahan di Meja 3D</span>
              <span className="text-white font-mono">{vessels.length} Zat</span>
            </span>

            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
              {vessels.map((v, i) => (
                <div
                  key={v.id || i}
                  className="px-2.5 py-1.5 bg-[#1e1f22] border border-[#3b3e45] rounded-md flex items-center justify-between text-[11px]"
                >
                  <div className="truncate pr-1">
                    <span className="font-mono font-bold text-white mr-1.5">{v.formula}</span>
                    <span className="text-[#949ba4] truncate">{v.name}</span>
                  </div>
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-black shrink-0"
                    style={{ backgroundColor: v.color }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Profile Bar Footer */}
        <div className="h-14 bg-[#232428] px-3 flex items-center justify-between shrink-0 border-t border-[#202225]">
          <div className="flex items-center gap-2.5 truncate">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-bold text-xs shadow">
                {studentName.charAt(0)}
              </div>
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-[#57F287] border-2 border-[#232428]" />
            </div>
            <div className="truncate">
              <div className="text-xs font-semibold text-white truncate">{studentName}</div>
              <div className="text-[10px] text-[#57F287] truncate">● Praktikan Aktif</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              const name = prompt("Masukkan nama siswa:", studentName);
              if (name) setStudentName(name);
            }}
            className="text-[11px] text-[#949ba4] hover:text-white px-2 py-1 rounded hover:bg-[#35373c] transition-colors"
          >
            Ubah
          </button>
        </div>
      </aside>

      {/* =========================================================================
          MAIN WORKSPACE CONTENT (CENTER)
          ========================================================================= */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#313338] overflow-hidden">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-[#202225] bg-[#313338] px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-sm z-10">
          <div className="flex items-center gap-3">
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
                    ? "Meja Praktikum Sains 3D & Web-AR"
                    : activeTab === "tasks"
                    ? "Daftar Tugas Praktikum Kelas"
                    : "Portal Guru: Rancang Tugas Meja Lab"}
                </span>
              </h2>
              <p className="text-[11px] text-[#949ba4] hidden sm:block">
                {activeTab === "lab"
                  ? "Simulasi interaktif reaksi zat kimia dengan gesture tangan & deteksi otomatis"
                  : activeTab === "tasks"
                  ? `Menampilkan tugas aktif untuk kelas dengan PIN Room [${roomCode}]`
                  : "Buat tugas baru, tentukan komposisi zat di meja, dan susun kuis evaluasi AI"}
              </p>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2.5">
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
              className="px-3 py-1.5 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Tanya AI</span>
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
              {/* Task Banner (If teacher task is active) */}
              {currentTask && (
                <div className="bg-[#2b2d31] border border-[#3b3e45] rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#57F287] animate-pulse" />
                      <span className="text-[10px] font-bold uppercase bg-[#5865F2] text-white px-2 py-0.5 rounded">
                        Tugas Guru: {currentTask.teacherName}
                      </span>
                      <span className="text-xs text-[#949ba4] font-medium">
                        Jenjang {currentTask.gradeLevel} • PIN {currentTask.roomCode}
                      </span>
                    </div>
                    <h3 className="font-bold text-sm text-white">{currentTask.title}</h3>
                    <p className="text-xs text-[#dbdee1] leading-relaxed">
                      📋 <strong>Instruksi:</strong> {currentTask.instructions}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {currentTask.questions && currentTask.questions.length > 0 && (
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
                  </div>
                </div>
              )}

              {/* 3D Workbench Stage Canvas Container - PURE BLACK VOID BACKGROUND */}
              <div className="bg-black border border-[#202225] rounded-2xl overflow-hidden relative shadow-2xl h-[480px] sm:h-[540px]">
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

                {/* Layer 1: 3D WebGL Canvas (Beakers, Table, Liquids & Reactions on black background) */}
                <div className="absolute inset-0 z-10 pointer-events-auto">
                  <ChemistryLabScene
                    handTransform={isCameraActive ? handTransform : undefined}
                    onReactionDetected={handleReactionDetected}
                    vessels={vessels}
                    setVessels={setVessels}
                    activeReaction={activeReaction}
                  />
                </div>

                {/* Layer 2: Glowing Hand Skeleton Tracker Canvas (Rendered directly OVER the 3D scene) */}
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
                <div className="absolute top-3 left-3 z-30 flex items-center gap-2 pointer-events-none">
                  <span className="bg-[#1e1f22]/90 backdrop-blur-md text-[#57F287] text-[11px] font-bold px-2.5 py-1 rounded-lg border border-[#35363c] flex items-center gap-1.5 shadow">
                    <span className="w-2 h-2 rounded-full bg-[#57F287] animate-pulse" />
                    Hand Skeleton Tracker Active
                  </span>
                </div>

                <div className="absolute top-3 right-3 z-30 flex items-center gap-2 pointer-events-none">
                  <div className="bg-[#1e1f22]/90 backdrop-blur-md border border-[#35363c] px-3 py-1.5 rounded-lg text-xs shadow space-y-0.5 text-right">
                    <div className="flex items-center justify-end gap-1.5 text-xs font-bold text-[#57F287]">
                      <span className={`w-2 h-2 rounded-full ${handTransform.handDetected ? "bg-[#57F287] animate-pulse" : "bg-[#ed4245]"}`} />
                      <span>{handTransform.handDetected ? "Sensor Tangan: Terdeteksi" : "Sensor: Arahkan Tangan..."}</span>
                    </div>
                    <div className="text-[10px] text-[#949ba4]">
                      {handTransform.isGrabbing
                        ? "✊ Memegang Bejana Kimia"
                        : handTransform.handDetected
                        ? "✋ Mode Membidik (Hover)"
                        : "Arahkan tangan ke kamera"}
                    </div>
                  </div>
                </div>

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

                  <button
                    type="button"
                    onClick={() => {
                      if (currentTask) applyTaskToWorkbench(currentTask);
                      else setVessels(INITIAL_VESSELS);
                    }}
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

              {/* Dedicated Reaction Observation Panel (Out of Camera & 3D Viewport) */}
              {activeReaction && (
                <div className="bg-[#2b2d31] border border-[#3b3e45] rounded-xl p-4 sm:p-5 text-[#dbdee1] space-y-3 shadow-xl transition-all animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3b3e45] pb-3">
                    <div className="flex items-center gap-2.5 font-bold text-sm sm:text-base text-white">
                      <Sparkles className="w-5 h-5 text-[#57F287] flex-shrink-0" />
                      <span>⚡ Reaksi Berhasil Terdeteksi: [{activeReaction.title}]</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold bg-[#1e1f22] text-[#57F287] px-2.5 py-0.5 rounded border border-[#3b3e45]">
                        Jenjang {activeReaction.level}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveReaction(null)}
                        className="p-1 px-2 text-xs font-semibold text-[#949ba4] hover:text-white hover:bg-[#35373c] rounded transition-colors"
                      >
                        ✕ Tutup
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
                    <div className="md:col-span-2 space-y-2">
                      <div className="p-3 bg-[#1e1f22] border border-[#3b3e45] rounded-lg text-xs sm:text-sm font-semibold font-mono text-[#57F287] overflow-x-auto">
                        <code>{activeReaction.equation}</code>
                      </div>
                      <p className="text-xs text-[#dbdee1] leading-relaxed">
                        {activeReaction.explanation}
                      </p>
                    </div>

                    <div className="p-3.5 bg-[#1e1f22] border border-[#3b3e45] rounded-lg space-y-3 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-[#949ba4] uppercase">
                          Perubahan Suhu Termal:
                        </span>
                        <div className="text-sm font-bold text-white">
                          {activeReaction.temperatureChange > 0
                            ? `🔥 +${activeReaction.temperatureChange}°C (Eksotermik / Melepas Panas)`
                            : activeReaction.temperatureChange < 0
                            ? `❄️ ${activeReaction.temperatureChange}°C (Endotermik / Menyerap Panas)`
                            : "Suhu Stabil (Netral)"}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 pt-1">
                        {currentTask?.questions && currentTask.questions.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setIsQuizModalOpen(true)}
                            className="bg-[#5865F2] hover:bg-[#4752c4] text-white px-4 py-2 font-semibold text-xs rounded-lg flex items-center justify-center gap-2 shadow transition-colors"
                          >
                            <Award className="w-4 h-4" />
                            <span>Lanjut ke Kuis Pemahaman AI →</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setIsAiAssistantOpen(true)}
                          className="bg-[#2b2d31] hover:bg-[#35373c] text-white border border-[#3b3e45] px-3 py-1.5 font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#FEE75C]" />
                          <span>Konsultasi dengan Asisten AI</span>
                        </button>
                      </div>
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
              VIEW 3: GURU MEMBUAT TUGAS
              =================================================================== */}
          {activeTab === "teacher_builder" && (
            <div className="max-w-5xl mx-auto w-full">
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
    </div>
  );
}
