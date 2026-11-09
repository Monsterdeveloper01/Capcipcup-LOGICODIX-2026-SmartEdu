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
  Camera,
  RotateCcw,
  Plus,
  Sparkles,
  CheckCircle2,
  HelpCircle,
  Layers,
  Hand,
  BookOpen,
  Award,
  Users,
  GraduationCap,
  ClipboardList,
} from "lucide-react";

// Dynamic import for 3D Canvas
const ChemistryLabScene = dynamic(() => import("./ChemistryLabScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center text-cyan-400 bg-slate-950/90 font-mono">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-bold tracking-widest uppercase">[ MEMUAT 3D SCIENCE ENGINE... ]</span>
      </div>
    </div>
  ),
});

export default function SmartScienceLabViewer() {
  // Mode state: "lab_practice" | "teacher_builder" | "task_list"
  const [activeTab, setActiveTab] = useState<"lab" | "teacher_builder" | "tasks">("lab");

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

    // Prompt student to take the AI Quiz after experiencing the reaction
    setTimeout(() => {
      setIsQuizModalOpen(true);
    }, 2800);
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
    <div className="w-full flex flex-col gap-4 font-mono">
      {/* 1. Universal Cyber-Lab Navigation Bar */}
      <div className="p-3.5 bg-white border-4 border-black shadow-[6px_6px_0px_#000000] flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#facc15] border-2 border-black flex items-center justify-center text-black shadow-[2px_2px_0px_#000000]">
            <FlaskConical className="w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black uppercase text-black flex items-center gap-2">
              <span>CAPCIPCUP SMARTEDU // 3D VIRTUAL SCIENCE LAB</span>
              <span className="text-[10px] bg-emerald-300 text-black px-2 py-0.5 border border-black font-black uppercase">
                WEB-AR + AI QUIZ
              </span>
            </h1>
            <p className="text-xs text-zinc-600 font-bold">
              Praktikum Sains & Reaksi Kimia Interaktif dengan Guru & Asisten AI
            </p>
          </div>
        </div>

        {/* View Mode Switcher */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab("lab")}
            className={`px-3 py-1.5 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 ${
              activeTab === "lab" ? "bg-[#facc15] text-black" : "bg-white text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            <span>[ MEJA LAB 3D ]</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("tasks")}
            className={`px-3 py-1.5 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 ${
              activeTab === "tasks" ? "bg-[#facc15] text-black" : "bg-white text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>[ DAFTAR TUGAS ({tasks.length}) ]</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("teacher_builder")}
            className={`px-3 py-1.5 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 ${
              activeTab === "teacher_builder" ? "bg-[#facc15] text-black" : "bg-white text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>[ GURU: BUAT TUGAS ]</span>
          </button>
        </div>
      </div>

      {/* 2. Active Task Mission Banner (When a task is selected) */}
      {currentTask && activeTab === "lab" && (
        <div className="p-3 bg-amber-50 border-4 border-black shadow-[4px_4px_0px_#000000] flex flex-wrap items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse border border-black" />
              <span className="text-xs font-black text-black uppercase">
                [ TUGAS DARI GURU: {currentTask.teacherName} • PIN {currentTask.roomCode} ]
              </span>
              <span className="text-[10px] bg-black text-[#facc15] px-1.5 py-0.2 font-black">
                {currentTask.gradeLevel}
              </span>
            </div>
            <h2 className="text-sm font-black text-black uppercase">{currentTask.title}</h2>
            <p className="text-xs font-bold text-zinc-700">
              📋 <strong>Instruksi:</strong> {currentTask.instructions}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsAiAssistantOpen(true)}
              className="brutal-btn-yellow px-3 py-1.5 text-xs font-black uppercase flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>[ TANYA KAK LAB-AI ]</span>
            </button>

            {currentTask.questions && currentTask.questions.length > 0 && (
              <button
                type="button"
                onClick={() => setIsQuizModalOpen(true)}
                className={`px-3 py-1.5 text-xs font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000000] flex items-center gap-1.5 ${
                  lastQuizScore !== null
                    ? "bg-emerald-300 text-black"
                    : isTaskReactionDone
                    ? "bg-[#facc15] animate-bounce"
                    : "bg-white text-zinc-700"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>
                  {lastQuizScore !== null
                    ? `[ KUIS SELESAI: ${lastQuizScore}/100 ]`
                    : "[ KERJAKAN KUIS AI ]"}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* 3. VIEW 1: Meja Lab 3D Interaktif */}
      {activeTab === "lab" && (
        <div className="border-4 border-black bg-zinc-950 shadow-[8px_8px_0px_#000000] relative overflow-hidden h-[540px] sm:h-[620px]">
          {/* Layer 0: Camera Feed (Webcam background for AR immersion) */}
          {isCameraActive && (
            <div className="absolute inset-0 z-0 opacity-45 pointer-events-none">
              <CameraFeed
                isActive={isCameraActive}
                onVideoReady={setVideoElement}
                showControls={false}
                className="w-full h-full rounded-none"
              />
            </div>
          )}

          {/* Layer 1: Hand Gesture Skeleton Tracker */}
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

          {/* Layer 3: HUD Sensor Status (Top-Right) */}
          <div className="absolute top-3 right-3 z-20 flex flex-col items-end gap-2 pointer-events-none font-mono">
            <div className="bg-black/85 backdrop-blur-md border-2 border-[#facc15] p-2.5 text-xs text-white shadow-[3px_3px_0px_#facc15] space-y-1">
              <div className="flex items-center gap-2 font-black text-[#facc15]">
                <span className={`w-2.5 h-2.5 rounded-full ${handTransform.handDetected ? "bg-emerald-400 animate-pulse" : "bg-red-500"}`} />
                <span>SENSOR TANGAN: {handTransform.handDetected ? "TERDETEKSI" : "MENCARI..."}</span>
              </div>
              <div className="text-[11px] text-zinc-300">
                STATUS:{" "}
                <span className="font-bold text-white">
                  {handTransform.isGrabbing
                    ? "✊ MEMEGANG BOTOL"
                    : handTransform.handDetected
                    ? "✋ MEMBIDIK (HOVER)"
                    : "ARAHKAN TANGAN KE KAMERA"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 pointer-events-auto">
              <button
                type="button"
                onClick={() => setIsCameraActive((prev) => !prev)}
                className={`px-2.5 py-1 text-[11px] font-black uppercase border-2 border-black shadow-[2px_2px_0px_#000000] ${
                  isCameraActive ? "bg-red-400 text-black" : "bg-[#facc15] text-black"
                }`}
              >
                {isCameraActive ? "[ MATIKAN KAMERA ]" : "[ NYALAKAN KAMERA ]"}
              </button>
            </div>
          </div>

          {/* Layer 4: Floating Reaction Alert Card */}
          {activeReaction && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 max-w-lg w-[90%] pointer-events-auto animate-bounce-short">
              <div className="bg-[#facc15] border-4 border-black p-4 text-black shadow-[6px_6px_0px_#000000] font-mono space-y-2">
                <div className="flex items-center justify-between border-b-2 border-black pb-2">
                  <div className="flex items-center gap-2 font-black text-sm">
                    <Sparkles className="w-5 h-5" />
                    <span>⚡ REAKSI BERHASIL: [{activeReaction.title}]</span>
                  </div>
                  <span className="text-xs font-black bg-black text-white px-2 py-0.5 uppercase">
                    {activeReaction.level}
                  </span>
                </div>

                <div className="p-2 bg-white border-2 border-black text-xs font-bold font-mono">
                  <code>{activeReaction.equation}</code>
                </div>

                <p className="text-xs font-medium text-zinc-900 leading-relaxed">
                  {activeReaction.explanation}
                </p>

                <div className="flex items-center justify-between text-[11px] font-black border-t-2 border-black pt-1.5">
                  <span>
                    SUHU: {activeReaction.temperatureChange > 0 ? `+${activeReaction.temperatureChange}°C (Eksotermik)` : activeReaction.temperatureChange < 0 ? `${activeReaction.temperatureChange}°C (Endotermik)` : "Netral"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsQuizModalOpen(true)}
                    className="bg-black text-[#facc15] px-3 py-1 font-black text-xs uppercase"
                  >
                    LANJUT KE KUIS AI →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. VIEW 2: Daftar Tugas Kelas Siswa */}
      {activeTab === "tasks" && (
        <div className="p-5 bg-white border-4 border-black shadow-[6px_6px_0px_#000000] space-y-4">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <div>
              <span className="text-xs font-black uppercase bg-[#facc15] text-black px-2 py-0.5 border border-black">
                [ TUGAS PRAKTIKUM KELAS: ROOM PIN {roomCode} ]
              </span>
              <h3 className="text-lg font-black uppercase text-black mt-1">
                PILIH TUGAS PRAKTIKUM UNTUK DIMULAI
              </h3>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="PIN ROOM"
                className="w-28 p-1.5 text-xs font-black border-2 border-black text-center"
              />
              <button
                type="button"
                onClick={fetchTasks}
                className="brutal-btn-yellow px-3 py-1.5 text-xs font-black uppercase"
              >
                CARI
              </button>
            </div>
          </div>

          {tasks.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 font-bold border-2 border-dashed border-black">
              Belum ada tugas praktikum di Room ini. Silakan klik menu &quot;[ GURU: BUAT TUGAS ]&quot; untuk membuat tugas baru.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 border-2 border-black bg-zinc-50 hover:bg-amber-50 transition-colors shadow-[3px_3px_0px_#000000] space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 uppercase">
                        {task.gradeLevel}
                      </span>
                      <span className="text-xs text-zinc-500 font-bold">
                        Guru: {task.teacherName}
                      </span>
                    </div>
                    <h4 className="font-black text-sm text-black uppercase">{task.title}</h4>
                    <p className="text-xs text-zinc-600 font-bold leading-relaxed">
                      {task.instructions}
                    </p>
                    <div className="text-[11px] font-black text-cyan-900 pt-1">
                      🔬 {task.chemicalIds?.length || 0} Zat Kimia Tersedia di Meja 3D
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => applyTaskToWorkbench(task)}
                    className="brutal-btn-yellow w-full py-2 text-xs font-black uppercase text-center"
                  >
                    ▶ BUKA MEJA LAB & MULAI PRAKTIKUM
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 5. VIEW 3: Guru Membuat Tugas Praktik */}
      {activeTab === "teacher_builder" && (
        <TeacherTaskBuilder
          roomCode={roomCode}
          onTaskCreated={() => {
            fetchTasks();
            setActiveTab("tasks");
          }}
          onCancel={() => setActiveTab("lab")}
        />
      )}

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
