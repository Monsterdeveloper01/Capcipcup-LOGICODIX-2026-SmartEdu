"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import { useSearchParams, usePathname } from "next/navigation";
import CameraFeed from "@/components/camera/CameraFeed";
import HandGestureTracker, {
  HandTransform,
  HandDistancePreset,
  HandProximityHint,
} from "@/components/camera/HandGestureTracker";
import AiLabAssistantModal from "./AiLabAssistantModal";
import StudentSubmissionDetailModal from "./StudentSubmissionDetailModal";
import InteractiveMeasurementInspector from "./InteractiveMeasurementInspector";
import { ChemicalFormula, ChemicalEquation } from "./ChemicalFormula";
import AuthLoginModal from "@/components/auth/AuthLoginModal";
import { AuthUser } from "@/lib/auth/types";
import {
  ChemicalVessel,
  ReactionDetail,
  InteractiveToolType,
} from "./ChemistryLabScene";
import { evaluateChemicalProperties, ChemicalMeasurement } from "@/lib/lab/chemicalProperties";
import { CHEMICAL_CATALOG, REACTION_CATALOG } from "@/lib/lab/chemicals-db";
import { resolveReactionForTask } from "@/lib/lab/reactionResolver";
import { LabTask, LabSubmission, ExperimentDetailLog } from "@/lib/lab/types";
import {
  FlaskConical,
  RotateCcw,
  Plus,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Award,
  ClipboardList,
  Video,
  VideoOff,
  X,
  BookOpen,
  Search,
  Lock,
  Trash2,
  Flame,
  LogIn,
  LogOut,
  ArrowLeft,
  ArrowDown,
  Play,
  Volume2,
  VolumeX,
  Hand,
  Thermometer,
  TestTube2,
  Droplet,
  ExternalLink,
  Lightbulb,
  Eye,
  Snowflake,
  Scale,
  Info,
  Beaker,
  SlidersHorizontal,
} from "lucide-react";
import labSound from "@/lib/audio/labSoundEngine";

// Dynamic import for 3D Canvas
const ChemistryLabScene = dynamic(() => import("./ChemistryLabScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-[#FFFDF7] pop-dots font-sans">
      <div className="flex flex-col items-center gap-3 pop-card px-6 py-5 rounded-2xl">
        <div className="w-10 h-10 border-4 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
        <span className="text-xs font-black tracking-wider text-slate-900 uppercase">
          Memuat 3D Science Engine...
        </span>
      </div>
    </div>
  ),
});

export default function SmartScienceLabViewer() {
  // User Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [viewingSubmissionDetail, setViewingSubmissionDetail] = useState<LabSubmission | null>(null);

  const isTeacher = currentUser?.role === "teacher" || currentUser?.role === "superadmin";
  const isGuest = !currentUser;

  // Lab Mode: "sandbox" vs "task"
  const [labMode, setLabMode] = useState<"task" | "sandbox">("sandbox");

  // Popover toggles for clean Full-Screen HUD
  const [isInstructionOpen, setIsInstructionOpen] = useState<boolean>(false);
  const [isVesselListOpen, setIsVesselListOpen] = useState<boolean>(false);

  // SFX Audio Mute State
  const [isSoundMuted, setIsSoundMuted] = useState<boolean>(() => labSound.getIsMuted());

  // Interactive Measurement Tools State
  const [activeTool, setActiveTool] = useState<InteractiveToolType>("hand");
  const [dippedVesselId, setDippedVesselId] = useState<string | null>(null);
  const [activeMeasurement, setActiveMeasurement] = useState<ChemicalMeasurement | null>(null);

  // 3D Lab State
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null);
  const [vessels, setVessels] = useState<ChemicalVessel[]>([]);
  const [activeReaction, setActiveReaction] = useState<ReactionDetail | null>(null);
  const [chemicalCatalog, setChemicalCatalog] = useState(CHEMICAL_CATALOG);
  const [reactionsList, setReactionsList] = useState<ReactionDetail[]>([]);

  // Catalog picker modal state
  const [isAddChemicalModalOpen, setIsAddChemicalModalOpen] = useState<boolean>(false);
  const [searchChemicalQuery, setSearchChemicalQuery] = useState<string>("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");

  // Modals & Task State
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState<boolean>(false);
  const [isTaskReactionDone, setIsTaskReactionDone] = useState<boolean>(false);
  const [lastQuizScore, setLastQuizScore] = useState<number | null>(null);
  const [isReactionAnimating, setIsReactionAnimating] = useState<boolean>(false);
  const reactionLockTimerRef = useRef<NodeJS.Timeout | null>(null);

  // URL Search Params
  const searchParams = useSearchParams();
  const urlTaskId = searchParams.get("taskId");
  const urlMode = searchParams.get("mode");
  const urlClassCode = searchParams.get("classCode");

  // Room & Tasks State
  const [roomCode, setRoomCode] = useState<string>(urlClassCode ? urlClassCode.toUpperCase() : "LAB889");
  const [tasks, setTasks] = useState<LabTask[]>([]);
  const [currentTask, setCurrentTask] = useState<LabTask | null>(null);
  const [studentName, setStudentName] = useState<string>("Guest");
  const [studentSubmissions, setStudentSubmissions] = useState<LabSubmission[]>([]);

  // Cleanup timer
  useEffect(() => {
    return () => {
      if (reactionLockTimerRef.current) clearTimeout(reactionLockTimerRef.current);
    };
  }, []);

  // Guest mode guard
  useEffect(() => {
    if (!isAuthLoading && isGuest && labMode !== "sandbox") {
      setLabMode("sandbox");
      setCurrentTask(null);
    }
  }, [isGuest, isAuthLoading, labMode]);

  // Hand tracking state
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
  const [handRangePreset, setHandRangePreset] = useState<HandDistancePreset>("close");
  const [isCameraSettingsOpen, setIsCameraSettingsOpen] = useState<boolean>(false);
  const [showCameraPreview, setShowCameraPreview] = useState<boolean>(false);
  const [handProximityHint, setHandProximityHint] = useState<HandProximityHint>("none");
  const [isNavigatingBack, setIsNavigatingBack] = useState<boolean>(false);

  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/lab") {
      setIsNavigatingBack(false);
    }
    return () => {
      setIsNavigatingBack(false);
    };
  }, [pathname, urlTaskId, urlClassCode, urlMode]);

  const handleReturnToDashboard = () => {
    if (isNavigatingBack) return;
    setIsNavigatingBack(true);
    setIsCameraActive(false);
    labSound.stopPouring();
    // Gunakan navigasi penuh agar WebGL/MediaPipe dibersihkan sempurna dan tidak ada state tersimpan di router cache
    setTimeout(() => {
      window.location.assign("/");
    }, 60);
  };

  const handleGestureUpdate = useCallback((transform: HandTransform) => {
    setHandTransform(transform);
  }, []);

  // Fetch student submissions
  const fetchStudentSubmissions = useCallback(
    async (name?: string) => {
      const clean = (name || currentUser?.name || studentName || "").trim();
      if (!clean || clean === "Guest") {
        setStudentSubmissions([]);
        return;
      }
      try {
        const res = await fetch(`/api/lab/submissions?studentName=${encodeURIComponent(clean)}`);
        const data = await res.json();
        if (res.ok && data.submissions) {
          setStudentSubmissions(data.submissions);
        }
      } catch (e) {
        console.warn("Failed fetching student submissions:", e);
      }
    },
    [currentUser?.name, studentName]
  );

  // Sync submission updates from the separate /quiz browser tab
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "cuplabs_submission_updated") {
        fetchStudentSubmissions();
      }
    };
    const handleFocus = () => {
      if (!isGuest) {
        fetchStudentSubmissions();
      }
    };
    window.addEventListener("storage", handleStorage);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("focus", handleFocus);
    };
  }, [fetchStudentSubmissions, isGuest]);

  // Fetch chemical catalog & reaction catalog
  useEffect(() => {
    fetch("/api/lab/chemicals")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.chemicals) && data.chemicals.length > 0) {
          setChemicalCatalog(data.chemicals);
        }
      })
      .catch(() => {});

    fetch("/api/lab/reactions")
      .then((res) => res.json())
      .then((data) => {
        if (data && Array.isArray(data.reactions) && data.reactions.length > 0) {
          setReactionsList(data.reactions);
        }
      })
      .catch(() => {});
  }, []);

  // Check session
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
          if (data.user.role === "teacher" || data.user.role === "superadmin") {
            setLabMode("sandbox");
          } else if (data.user.role === "student") {
            setStudentName(data.user.name);
            fetchStudentSubmissions(data.user.name);
          }
        } else {
          setCurrentUser(null);
          setStudentName("Guest");
          setLabMode("sandbox");
          setCurrentTask(null);
          setStudentSubmissions([]);
        }
      })
      .catch(() => {
        setCurrentUser(null);
        setStudentName("Guest");
        setLabMode("sandbox");
        setCurrentTask(null);
        setStudentSubmissions([]);
      })
      .finally(() => setIsAuthLoading(false));
  }, [fetchStudentSubmissions]);

  // Apply Task to 3D Workbench
  const applyTaskToWorkbench = useCallback(
    (task: LabTask) => {
      if (reactionLockTimerRef.current) {
        clearTimeout(reactionLockTimerRef.current);
        reactionLockTimerRef.current = null;
      }
      setIsReactionAnimating(false);
      setCurrentTask(task);

      const existingSub = studentSubmissions.find((s) => s.taskId === task.id);
      if (existingSub) {
        setIsTaskReactionDone(Boolean(existingSub.isReactionAchieved));
        setLastQuizScore(existingSub.score);
        setIsCameraActive(false);
      } else {
        setIsTaskReactionDone(false);
        setLastQuizScore(null);
        setIsCameraActive(true);
      }

      const rawIds = task.chemicalIds || [];
      const ids: string[] =
        typeof rawIds === "string" ? JSON.parse(rawIds) : Array.isArray(rawIds) ? rawIds : [];

      const taskVessels: ChemicalVessel[] = ids.map((chemId, index) => {
        const chem =
          chemicalCatalog.find((c) => c.id === chemId) ||
          CHEMICAL_CATALOG.find((c) => c.id === chemId) || {
            id: chemId,
            name: "Bahan Kimia",
            formula: "Reagen",
            color: "#38bdf8",
            level: task.level || task.gradeLevel || "SMP",
          };

        const posX = (index - (ids.length - 1) / 2) * 2.3;
        return {
          id: `v_${chem.id}_${index}`,
          name: chem.name,
          formula: chem.formula,
          type: index % 2 === 0 ? "beaker" : "flask",
          color: chem.color,
          initialColor: chem.color,
          position: [posX, 0.55, 0.25],
          level: task.level || task.gradeLevel || "SMP",
          liquidLevel: 0.7,
          temperatureC: 25,
          components: [chem.formula],
        };
      });

      if (existingSub) {
        const { reaction, vessel } = resolveReactionForTask(task, existingSub.experimentDetails);
        setVessels([vessel]);
        setActiveReaction(reaction);
      } else {
        setVessels(taskVessels.length > 0 ? taskVessels : []);
        setActiveReaction(null);
      }

      setLabMode(isTeacher ? "sandbox" : "task");
    },
    [chemicalCatalog, isTeacher, studentSubmissions]
  );

  // Load room tasks from URL params
  useEffect(() => {
    if (isGuest) {
      setTasks([]);
      return;
    }

    const code = (urlClassCode || roomCode || "").trim().toUpperCase();
    if (code) {
      setRoomCode(code);
      const taskQueryUrl = urlTaskId
        ? `/api/lab/tasks?taskId=${encodeURIComponent(urlTaskId)}`
        : `/api/lab/tasks?roomCode=${encodeURIComponent(code)}`;

      fetch(taskQueryUrl)
        .then((r) => r.json())
        .then((data) => {
          if (data && data.tasks && data.tasks.length > 0) {
            setTasks(data.tasks);
            if (urlTaskId) {
              const matched = data.tasks.find((t: LabTask) => t.id === urlTaskId) || data.tasks[0];
              if (matched) {
                applyTaskToWorkbench(matched);
                return;
              }
            }
            if (urlMode === "task" && !isGuest) {
              applyTaskToWorkbench(data.tasks[0]);
            }
          } else {
            setTasks([]);
          }
        })
        .catch(() => {});
    }

    if (urlMode === "sandbox" || isGuest) {
      setLabMode("sandbox");
      setCurrentTask(null);
      if (urlMode === "sandbox") setVessels([]);
    }
  }, [urlTaskId, urlMode, urlClassCode, isGuest]);

  // Sync student submission status when loaded after task mount
  useEffect(() => {
    if (currentTask && studentSubmissions.length > 0) {
      const existingSub = studentSubmissions.find((s) => s.taskId === currentTask.id);
      if (existingSub) {
        setIsTaskReactionDone(Boolean(existingSub.isReactionAchieved));
        setLastQuizScore(existingSub.score);
        const { reaction, vessel } = resolveReactionForTask(currentTask, existingSub.experimentDetails);
        setVessels([vessel]);
        setActiveReaction(reaction);
      }
    }
  }, [studentSubmissions, currentTask]);

  // Persist pending 3D reaction details for the separate /quiz browser tab
  const persistPendingExperimentForQuiz = useCallback(
    (achieved: boolean, reactionObj?: ReactionDetail | null) => {
      if (!currentTask) return;
      const rx = reactionObj || activeReaction;
      const matchedRx = REACTION_CATALOG.find(
        (r) =>
          (currentTask.expectedReactionId && r.id === currentTask.expectedReactionId) ||
          (currentTask.title && currentTask.title.toLowerCase().includes(r.title.toLowerCase()))
      );

      const expDetails: ExperimentDetailLog = {
        reactionTitle: rx?.title || matchedRx?.title || currentTask.title,
        reactionEquation: rx?.equation || matchedRx?.equation || "",
        temperatureChange:
          rx?.temperatureChange ??
          (matchedRx && "temperatureChangeC" in matchedRx ? (matchedRx as any).temperatureChangeC : 0),
        observablePhenomena:
          rx?.observablePhenomena ||
          matchedRx?.observablePhenomena ||
          "Reaksi kimia selesai teramati di meja 3D.",
        explanation: rx?.explanation || matchedRx?.explanation || currentTask.instructions || "",
        reasonWhy: rx?.reasonWhy || matchedRx?.reasonWhy || "",
        mixedChemicals:
          vessels.length > 0
            ? vessels.map((v) => ({ name: v.name, formula: v.formula, color: v.color }))
            : (currentTask.chemicalIds || []).map((cid: string) => {
                const found = CHEMICAL_CATALOG.find((c) => c.id === cid);
                return {
                  name: found?.name || cid,
                  formula: found?.formula || cid,
                  color: found?.color || "#38bdf8",
                };
              }),
        resultVessel:
          vessels.length > 0
            ? {
                name: vessels[0].name,
                formula: vessels[0].formula,
                color: vessels[0].color,
                temperatureC: vessels[0].temperatureC,
              }
            : {
                name: rx?.resultName || matchedRx?.productName || "Produk Kimiawi",
                formula: rx?.resultFormula || matchedRx?.productFormula || "Senyawa Produk",
                color: rx?.resultColor || matchedRx?.productColor || "#38bdf8",
              },
        completedAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem(
          `cuplabs_pending_exp_${currentTask.id}`,
          JSON.stringify({ isReactionAchieved: achieved, experimentDetails: expDetails })
        );
      } catch {}
    },
    [activeReaction, currentTask, vessels]
  );

  // Open quiz in a new browser tab
  const handleOpenQuizInNewTab = () => {
    if (!currentTask) return;
    persistPendingExperimentForQuiz(isTaskReactionDone, activeReaction);
    const quizUrl = `/quiz?taskId=${encodeURIComponent(currentTask.id)}&classCode=${encodeURIComponent(
      roomCode || currentTask.roomCode
    )}`;
    window.open(quizUrl, "_blank", "noopener,noreferrer");
  };

  // Tool handlers
  const handleSelectTool = (tool: InteractiveToolType) => {
    setActiveTool(tool);
    if (tool === "hand") {
      setActiveMeasurement(null);
      setDippedVesselId(null);
    } else if (vessels.length > 0) {
      const targetV = dippedVesselId ? vessels.find((v) => v.id === dippedVesselId) : vessels[0];
      if (targetV) {
        setDippedVesselId(targetV.id);
        setActiveMeasurement(evaluateChemicalProperties(targetV));
        labSound.playGlassClink("soft");
      }
    }
  };

  const handleDipTool = (vessel: ChemicalVessel, _tool: InteractiveToolType) => {
    setDippedVesselId(vessel.id);
    setActiveMeasurement(evaluateChemicalProperties(vessel));
    labSound.playGlassClink("soft");
  };

  // Reaction detection handler
  const handleReactionDetected = (
    reaction: ReactionDetail,
    _vesselA?: ChemicalVessel,
    vesselB?: ChemicalVessel
  ) => {
    setActiveReaction(reaction);

    if (vesselB && dippedVesselId === vesselB.id) {
      setActiveMeasurement(evaluateChemicalProperties(vesselB));
    }

    if (!isTeacher && labMode === "task") {
      const isTargetFulfilled = currentTask?.expectedReactionId
        ? reaction.id === currentTask.expectedReactionId ||
          reaction.title.toLowerCase().includes(currentTask.title.toLowerCase())
        : true;

      if (isTargetFulfilled && !isTaskReactionDone && !isReactionAnimating) {
        setIsReactionAnimating(true);
        persistPendingExperimentForQuiz(true, reaction);

        if (reactionLockTimerRef.current) clearTimeout(reactionLockTimerRef.current);
        reactionLockTimerRef.current = setTimeout(() => {
          setIsReactionAnimating(false);
          setIsTaskReactionDone(true);
          setIsCameraActive(false);
        }, 4500);
      }
    }
  };

  // Add chemical in sandbox
  const handleAddChemicalToWorkbench = (chem: any) => {
    const nextIdx = vessels.length;
    const slotPositions = [-1.4, 1.4, -2.8, 2.8, 0, -3.8, 3.8];
    const posX =
      slotPositions[nextIdx] ??
      (nextIdx % 2 === 0 ? 1 : -1) * (1.2 + Math.floor(nextIdx / 2) * 1.3);

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
      components: [chem.formula],
    };

    setVessels((prev) => [...prev, newVessel]);
    labSound.playGlassClink("medium");
    setIsAddChemicalModalOpen(false);
  };

  const handleRemoveVessel = (vesselId: string) => {
    setVessels((prev) => prev.filter((v) => v.id !== vesselId));
    if (dippedVesselId === vesselId) {
      setDippedVesselId(null);
      setActiveMeasurement(null);
    }
    labSound.playGlassClink("soft");
  };

  const handleResetWorkbench = () => {
    labSound.playGlassClink("soft");
    if (reactionLockTimerRef.current) {
      clearTimeout(reactionLockTimerRef.current);
      reactionLockTimerRef.current = null;
    }
    setIsReactionAnimating(false);
    setDippedVesselId(null);
    setActiveMeasurement(null);

    if (!isTeacher && labMode === "task" && currentTask) {
      // Reset back to task starting reagents
      const rawIds = currentTask.chemicalIds || [];
      const ids: string[] =
        typeof rawIds === "string" ? JSON.parse(rawIds) : Array.isArray(rawIds) ? rawIds : [];
      const taskVessels: ChemicalVessel[] = ids.map((chemId, index) => {
        const chem =
          chemicalCatalog.find((c) => c.id === chemId) ||
          CHEMICAL_CATALOG.find((c) => c.id === chemId) || {
            id: chemId,
            name: "Bahan Kimia",
            formula: "Reagen",
            color: "#38bdf8",
            level: currentTask.level || currentTask.gradeLevel || "SMP",
          };
        const posX = (index - (ids.length - 1) / 2) * 2.3;
        return {
          id: `v_${chem.id}_${index}`,
          name: chem.name,
          formula: chem.formula,
          type: index % 2 === 0 ? "beaker" : "flask",
          color: chem.color,
          initialColor: chem.color,
          position: [posX, 0.55, 0.25],
          level: currentTask.level || currentTask.gradeLevel || "SMP",
          liquidLevel: 0.7,
          temperatureC: 25,
          components: [chem.formula],
        };
      });
      setVessels(taskVessels);
      setActiveReaction(null);
    } else {
      setVessels([]);
      setActiveReaction(null);
    }

    setIsTaskReactionDone(false);
    setIsCameraActive(true);
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      setStudentName("Guest");
      setStudentSubmissions([]);
      setLabMode("sandbox");
      setCurrentTask(null);
      setVessels([]);
    } catch {}
  };

  const isExperimentLocked = !isTeacher && labMode === "task" && isTaskReactionDone;
  const isCameraEffective = isCameraActive && !isExperimentLocked;

  useEffect(() => {
    if (isExperimentLocked) setIsCameraActive(false);
  }, [isExperimentLocked]);

  const currentSubmission = currentTask
    ? studentSubmissions.find((s) => s.taskId === currentTask.id)
    : null;
  const kkmScore = currentTask?.kkmScore ?? 75;
  const allowRetakeBelowKkm = currentTask?.allowRetakeBelowKkm !== false;
  const isBelowKkm = currentSubmission ? currentSubmission.score < kkmScore : false;
  const canRetake = !currentSubmission || (allowRetakeBelowKkm && isBelowKkm);
  const activeChemNames = vessels.map((v) => `${v.name} (${v.formula})`);

  const scrollToObservations = () => {
    document.getElementById("lab-observation-section")?.scrollIntoView({ behavior: "smooth" });
  };

  const hasObservationSection = Boolean(
    activeReaction ||
      activeMeasurement ||
      (labMode === "task" && (isTaskReactionDone || currentSubmission))
  );

  return (
    <div className="w-full min-h-screen flex flex-col bg-[#FFFDF7] text-slate-900 font-sans select-none">
      {/* =========================================================================
          FULL-SCREEN 3D LAB WORKBENCH (NO SIDEBAR, NO NAVBAR)
          ========================================================================= */}
      <section className="relative w-full h-screen shrink-0 overflow-hidden bg-slate-100">
        {/* Layer 0: Camera Feed for MediaPipe (Hidden off-flow or shown as compact PiP guide) */}
        {isCameraEffective && (
          <div
            className={
              showCameraPreview
                ? `absolute right-3 sm:right-5 w-44 sm:w-52 aspect-video z-30 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] overflow-hidden bg-slate-950 pointer-events-auto transition-all ${
                    isCameraSettingsOpen ? "top-28 sm:top-[108px]" : "top-16"
                  }`
                : "fixed top-16 right-4 w-56 aspect-video opacity-0 pointer-events-none -z-10 overflow-hidden"
            }
          >
            <CameraFeed
              isActive={isCameraEffective}
              onVideoReady={setVideoElement}
              showControls={false}
              className="w-full h-full rounded-none"
            />
            {showCameraPreview && (
              <>
                {/* Comfort Zone Visual Guide Frame matching handRangePreset */}
                <div
                  className={`absolute pointer-events-none border-2 border-dashed rounded-lg transition-all ${
                    handProximityHint === "too_close"
                      ? "border-amber-400"
                      : handTransform.handDetected
                      ? "border-emerald-400"
                      : "border-sky-300/80"
                  }`}
                  style={{
                    inset:
                      handRangePreset === "close"
                        ? "22% 23%"
                        : handRangePreset === "normal"
                        ? "16% 14%"
                        : "8% 5%",
                  }}
                />
                <div className="absolute top-1.5 inset-x-1.5 flex items-center justify-between pointer-events-auto">
                  <span className="px-1.5 py-0.5 rounded bg-slate-900/85 text-[9px] font-black uppercase text-white border border-white/20">
                    Zona Tangan
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowCameraPreview(false)}
                    className="w-5 h-5 rounded bg-white text-slate-900 border border-slate-900 flex items-center justify-center cursor-pointer"
                    title="Tutup pratinjau kamera"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Layer 1: Full-Viewport 3D WebGL Scene */}
        <div className="absolute inset-0 z-10 pointer-events-auto">
          <ChemistryLabScene
            handTransform={isCameraEffective ? handTransform : undefined}
            onReactionDetected={handleReactionDetected}
            vessels={vessels}
            setVessels={setVessels}
            activeReaction={activeReaction}
            reactions={reactionsList}
            isLocked={isExperimentLocked}
            activeTool={activeTool}
            dippedVesselId={dippedVesselId}
            onDipTool={handleDipTool}
          />
        </div>

        {/* Layer 2: Hand Skeleton Overlay */}
        {isCameraEffective && (
          <div className="absolute inset-0 z-20 pointer-events-none">
            <HandGestureTracker
              videoElement={videoElement}
              isActive={isCameraEffective}
              onGestureUpdate={handleGestureUpdate}
              mode="lab"
              showBuiltInHud={false}
              distancePreset={handRangePreset}
              onProximityHintChange={setHandProximityHint}
            />
          </div>
        )}

        {/* =======================================================================
            FLOATING SPATIAL HUD — TOP BAR (LEFT: NAVIGATION & TASK BRIEF, RIGHT: SENSORS & AI)
            ======================================================================= */}
        <div className="absolute top-3 inset-x-3 sm:top-4 sm:inset-x-5 z-30 flex flex-wrap items-start justify-between gap-2.5 pointer-events-none">
          {/* Top-Left Cluster */}
          <div className="flex flex-col items-start gap-2 pointer-events-auto max-w-full sm:max-w-lg">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleReturnToDashboard}
                disabled={isNavigatingBack}
                className="pop-btn bg-white hover:bg-slate-100 text-slate-900 px-3.5 py-2 rounded-xl text-xs gap-1.5"
                title="Kembali ke Dashboard Kelas"
              >
                <ArrowLeft className="w-4 h-4 text-[#2563EB]" />
                <span>Dashboard</span>
              </button>

              {/* Mode / Task Pill */}
              {labMode === "task" && currentTask ? (
                <div className="flex items-center gap-1.5 bg-[#38BDF8] border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-xl px-3 py-1.5">
                  <ClipboardList className="w-4 h-4 text-slate-900 shrink-0" />
                  <span className="text-xs font-extrabold text-slate-900 max-w-[160px] sm:max-w-[230px] truncate">
                    {currentTask.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsInstructionOpen((v) => !v)}
                    className="ml-1 px-2 py-0.5 bg-[#FACC15] hover:bg-[#fde047] border border-slate-900 rounded-lg text-[10px] font-black uppercase text-slate-900 cursor-pointer flex items-center gap-1"
                  >
                    <Info className="w-3 h-3" />
                    <span>{isInstructionOpen ? "Tutup" : "Instruksi"}</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-[#34D399] border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-xl px-3.5 py-1.5">
                  <FlaskConical className="w-4 h-4 text-slate-900" />
                  <span className="text-xs font-black uppercase tracking-wide text-slate-900">
                    {isTeacher ? "Sandbox Guru" : "Mode Bebas (Sandbox)"}
                  </span>
                </div>
              )}

              {isExperimentLocked && (
                <span className="bg-[#FB7185] text-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] text-[11px] font-black uppercase px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Terkunci (Review)</span>
                </span>
              )}
            </div>

            {/* Expandable Floating Task Instruction Popover */}
            {labMode === "task" && currentTask && isInstructionOpen && (
              <div className="pop-card rounded-2xl p-4 bg-[#FEF9C3] max-w-md space-y-2 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between border-b-2 border-slate-900/15 pb-1.5">
                  <span className="text-[10px] font-black uppercase text-slate-800">
                    Panduan Tugas • KKM {kkmScore} •{" "}
                    {allowRetakeBelowKkm ? "Remedial Diizinkan" : "Sekali Selesai"}
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsInstructionOpen(false)}
                    className="p-0.5 rounded hover:bg-slate-900/10 cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-xs text-slate-900 leading-relaxed font-medium">
                  {currentTask.instructions}
                </p>
              </div>
            )}

            {/* Reaction Animating Notification */}
            {isReactionAnimating && (
              <div className="pop-card rounded-xl px-3.5 py-2 bg-[#FACC15] text-slate-900 text-xs font-black flex items-center gap-2 animate-bounce">
                <Sparkles className="w-4 h-4 animate-spin" />
                <span>Reaksi Sedang Berlangsung! Amati Perubahan Zat di Meja 3D</span>
              </div>
            )}
          </div>

          {/* Top-Right Cluster: Camera Sensor, SFX, Tanya AI, Account + Compact Calibration */}
          <div className="flex flex-col items-end gap-2 pointer-events-auto">
            <div className="flex flex-wrap items-center justify-end gap-2">
              {/* Sensor Kamera Toggle */}
              <button
                type="button"
                onClick={() => {
                  if (!isExperimentLocked) setIsCameraActive((prev) => !prev);
                }}
                disabled={isExperimentLocked}
                className={`pop-btn px-3 py-2 rounded-xl text-xs gap-1.5 ${
                  isExperimentLocked
                    ? "bg-slate-200 text-slate-500"
                    : isCameraEffective
                    ? "bg-[#A7F3D0] text-slate-900"
                    : "bg-[#FFE4E6] text-slate-900"
                }`}
                title={
                  isExperimentLocked
                    ? "Kamera nonaktif pada mode review selesai"
                    : "Aktifkan atau matikan sensor gesture tangan"
                }
              >
                {isCameraEffective ? <Video className="w-3.5 h-3.5" /> : <VideoOff className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">
                  {isExperimentLocked
                    ? "Sensor Terkunci"
                    : isCameraEffective
                    ? handTransform.handDetected
                      ? handTransform.hands && handTransform.hands.length > 1
                        ? "2 Sarung Tangan Aktif"
                        : handTransform.isGrabbing
                        ? "Tangan: Menggenggam"
                        : "Tangan: Membidik"
                      : "Sensor: Aktif"
                    : "Sensor: Nonaktif"}
                </span>
              </button>

              {/* Toggle Buka/Tutup Pengaturan Jarak Kamera & Pratinjau */}
              {isCameraEffective && (
                <button
                  type="button"
                  onClick={() => setIsCameraSettingsOpen((prev) => !prev)}
                  className={`pop-btn px-2.5 py-2 rounded-xl text-xs gap-1.5 ${
                    isCameraSettingsOpen
                      ? "bg-[#38BDF8] text-slate-900"
                      : "bg-white hover:bg-slate-100 text-slate-900"
                  }`}
                  title={isCameraSettingsOpen ? "Tutup pengaturan jarak kamera" : "Buka pengaturan jarak & cek kamera"}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Jarak</span>
                </button>
              )}

              {/* SFX Audio Toggle */}
              <button
                type="button"
                onClick={() => {
                  const newMuted = labSound.toggleMute();
                  setIsSoundMuted(newMuted);
                  if (!newMuted) labSound.playGlassClink("soft");
                }}
                className={`pop-btn px-3 py-2 rounded-xl text-xs gap-1.5 ${
                  !isSoundMuted ? "bg-white text-slate-900" : "bg-[#FED7AA] text-slate-900"
                }`}
                title={!isSoundMuted ? "Matikan Efek Suara" : "Aktifkan Efek Suara"}
              >
                {!isSoundMuted ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span className="hidden md:inline">{!isSoundMuted ? "SFX ON" : "SFX OFF"}</span>
              </button>

              {/* Tanya Lab-AI Button */}
              {!isGuest && (
                <button
                  type="button"
                  onClick={() => setIsAiAssistantOpen(true)}
                  className="pop-btn bg-[#FACC15] hover:bg-[#fde047] text-slate-900 px-3.5 py-2 rounded-xl text-xs gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Tanya AI</span>
                </button>
              )}

              {/* User Pill */}
              {currentUser ? (
                <div className="flex items-center gap-1.5 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-xl px-2.5 py-1.5">
                  <span className="text-[10px] font-black uppercase bg-[#38BDF8] text-slate-900 border border-slate-900 px-1.5 py-0.5 rounded">
                    {isTeacher ? "GURU" : "SISWA"}
                  </span>
                  <span className="text-xs font-bold text-slate-900 max-w-[100px] truncate hidden sm:inline">
                    {currentUser.name}
                  </span>
                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Keluar Akun"
                    className="p-0.5 text-slate-500 hover:text-rose-600 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsAuthModalOpen(true)}
                  className="pop-btn bg-[#38BDF8] text-slate-900 px-3.5 py-2 rounded-xl text-xs gap-1.5"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Masuk</span>
                </button>
              )}
            </div>

            {/* Collapsible Camera Distance Calibration & Mini Preview Strip */}
            {isCameraEffective && isCameraSettingsOpen && (
              <div className="flex flex-wrap items-center justify-end gap-1.5 bg-white/95 border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-xl px-2.5 py-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 hidden sm:inline">
                  Jarak:
                </span>
                {(
                  [
                    { id: "close", label: "Dekat" },
                    { id: "normal", label: "Sedang" },
                    { id: "wide", label: "Luas" },
                  ] as const
                ).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setHandRangePreset(preset.id)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-black border transition-all cursor-pointer ${
                      handRangePreset === preset.id
                        ? "bg-[#38BDF8] text-slate-900 border-slate-900 shadow-[1px_1px_0px_#0f172a]"
                        : "bg-slate-50 text-slate-600 border-slate-300 hover:bg-slate-100"
                    }`}
                    title={
                      preset.id === "close"
                        ? "Nyaman untuk duduk dekat di depan laptop (25-55 cm)"
                        : preset.id === "normal"
                        ? "Jarak standar meja belajar (50-80 cm)"
                        : "Jangkauan penuh untuk jarak jauh (>80 cm)"
                    }
                  >
                    {preset.label}
                  </button>
                ))}

                <span
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black border ${
                    handProximityHint === "too_close"
                      ? "bg-[#FACC15] text-slate-900 border-slate-900"
                      : handProximityHint === "optimal"
                      ? "bg-[#A7F3D0] text-slate-900 border-slate-900"
                      : "bg-slate-100 text-slate-500 border-slate-300"
                  }`}
                >
                  {handProximityHint === "too_close"
                    ? "Terlalu Dekat"
                    : handProximityHint === "optimal"
                    ? "Posisi Pas"
                    : "Arahkan Tangan"}
                </span>

                <button
                  type="button"
                  onClick={() => setShowCameraPreview((prev) => !prev)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-black border border-slate-900 flex items-center gap-1 cursor-pointer transition-all ${
                    showCameraPreview
                      ? "bg-[#FACC15] text-slate-900"
                      : "bg-slate-100 text-slate-800 hover:bg-slate-200"
                  }`}
                  title="Tampilkan atau sembunyikan pratinjau kamera kecil"
                >
                  <Eye className="w-3 h-3" />
                  <span>{showCameraPreview ? "Tutup Cam" : "Cek Cam"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCameraSettingsOpen(false)}
                  className="p-0.5 rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
                  title="Tutup panel jarak"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Empty Table Prompt (Center-Bottom above Dock) */}
        {(labMode === "sandbox" || isGuest) && vessels.length === 0 && (
          <div className="absolute inset-x-4 bottom-24 sm:bottom-28 flex justify-center pointer-events-none z-30">
            <div className="pop-card rounded-2xl px-5 py-3 bg-[#FFFDF7] flex flex-wrap items-center justify-center gap-3 pointer-events-auto">
              <FlaskConical className="w-5 h-5 text-emerald-700" />
              <span className="text-xs font-bold text-slate-800">
                Meja lab masih kosong. Tambahkan zat kimia untuk mulai bereksperimen!
              </span>
              <button
                type="button"
                onClick={() => setIsAddChemicalModalOpen(true)}
                className="pop-btn px-3.5 py-1.5 bg-[#34D399] text-slate-900 text-xs rounded-xl gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Bahan Kimia</span>
              </button>
            </div>
          </div>
        )}

        {!isGuest && labMode === "task" && vessels.length === 0 && (
          <div className="absolute inset-x-4 bottom-24 sm:bottom-28 flex justify-center pointer-events-none z-30">
            <div className="pop-card rounded-2xl px-5 py-3 bg-[#FFFDF7] flex flex-wrap items-center justify-center gap-3 pointer-events-auto">
              <ClipboardList className="w-5 h-5 text-[#2563EB]" />
              <span className="text-xs font-bold text-slate-800">
                {currentTask
                  ? `Tugas "${currentTask.title}" siap dimulai di meja.`
                  : "Siapkan bahan tugas ke meja praktik."}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (currentTask) applyTaskToWorkbench(currentTask);
                  else if (tasks.length > 0) applyTaskToWorkbench(tasks[0]);
                }}
                className="pop-btn px-3.5 py-1.5 bg-[#38BDF8] text-slate-900 text-xs rounded-xl gap-1.5"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Siapkan Bahan</span>
              </button>
            </div>
          </div>
        )}

        {/* Floating Scroll CTA when Reaction / Measurement / Completion Exists */}
        {hasObservationSection && (
          <div className="absolute bottom-24 right-4 sm:right-6 z-30 pointer-events-auto">
            <button
              type="button"
              onClick={scrollToObservations}
              className="pop-btn bg-[#FACC15] hover:bg-[#fde047] text-slate-900 px-4 py-2.5 rounded-2xl text-xs gap-2 animate-bounce"
            >
              <ArrowDown className="w-4 h-4" />
              <span>Lihat Hasil &amp; Penjelasan di Bawah</span>
            </button>
          </div>
        )}

        {/* =======================================================================
            FLOATING SPATIAL BOTTOM DOCK: INSTRUMENTS + ADD CHEMICALS + QUIZ TAB
            ======================================================================= */}
        <div className="absolute bottom-3 inset-x-3 sm:bottom-4 sm:inset-x-6 z-30 flex flex-col items-center gap-2 pointer-events-none">
          {/* Active Beaker Immersion Sub-Bar (Visible when an instrument != hand is active) */}
          {activeTool !== "hand" && vessels.length > 0 && (
            <div className="pointer-events-auto bg-[#FFFDF7] border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-2xl px-3 py-1.5 flex flex-wrap items-center justify-center gap-1.5 max-w-full">
              <span className="text-[11px] font-black uppercase text-slate-700 mr-1">
                Celup ke Bejana:
              </span>
              {vessels.map((v) => {
                const isSelected = dippedVesselId === v.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleDipTool(v, activeTool)}
                    className={`px-2.5 py-1 rounded-xl text-xs font-bold border-2 border-slate-900 transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? "bg-[#34D399] text-slate-900 shadow-[2px_2px_0px_#0f172a]"
                        : "bg-white text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-full border border-slate-900 shrink-0"
                      style={{ backgroundColor: v.color || "#0284c7" }}
                    />
                    <span>{v.formula}</span>
                  </button>
                );
              })}

              {activeMeasurement && (
                <button
                  type="button"
                  onClick={scrollToObservations}
                  className="ml-1 px-2.5 py-1 rounded-xl bg-[#FACC15] border-2 border-slate-900 text-[11px] font-black text-slate-900 cursor-pointer flex items-center gap-1"
                >
                  <ArrowDown className="w-3 h-3" />
                  <span>Hasil Ukur</span>
                </button>
              )}
            </div>
          )}

          {/* Active Vessel Quick Popover (in Sandbox / Teacher mode for inspecting or removing individual beakers) */}
          {(labMode === "sandbox" || isTeacher) && isVesselListOpen && (
            <div className="pointer-events-auto pop-card rounded-2xl p-3 bg-[#FFFDF7] w-full max-w-md space-y-2">
              <div className="flex items-center justify-between border-b-2 border-slate-900/10 pb-1.5">
                <span className="text-[11px] font-black uppercase text-slate-800">
                  Zat Aktif di Meja ({vessels.length})
                </span>
                <button
                  type="button"
                  onClick={() => setIsVesselListOpen(false)}
                  className="p-0.5 rounded hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {vessels.length === 0 ? (
                <p className="text-xs text-slate-500 text-center py-2">Meja masih kosong.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto">
                  {vessels.map((v, i) => (
                    <div
                      key={v.id || i}
                      className="px-2.5 py-1.5 bg-white border-2 border-slate-900 rounded-xl flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span
                          className="w-3 h-3 rounded-full border border-slate-900 shrink-0"
                          style={{ backgroundColor: v.color }}
                        />
                        <span className="font-mono font-bold truncate">{v.formula}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVessel(v.id)}
                        className="text-rose-600 hover:bg-rose-50 p-1 rounded-lg cursor-pointer shrink-0"
                        title="Hapus zat ini dari meja"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Main Arcade-Lab Floating Dock */}
          <div className="pointer-events-auto bg-[#FFFDF7] border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-2xl p-1.5 sm:px-2.5 flex flex-wrap items-center justify-center gap-1.5 max-w-full">
            {/* Group 1: Interactive Instruments */}
            {[
              { id: "hand", label: "Tangan", icon: Hand, colorClass: "bg-[#38BDF8]" },
              { id: "thermometer", label: "Termometer", icon: Thermometer, colorClass: "bg-[#FED7AA]" },
              { id: "litmus_red", label: "Lakmus Merah", icon: Droplet, colorClass: "bg-[#FDA4AF]" },
              { id: "litmus_blue", label: "Lakmus Biru", icon: Droplet, colorClass: "bg-[#93C5FD]" },
              { id: "ph_meter", label: "Indikator pH", icon: TestTube2, colorClass: "bg-[#FDE047]" },
            ].map((item) => {
              const IconComp = item.icon;
              const isSelected = activeTool === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectTool(item.id as InteractiveToolType)}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-extrabold border-2 transition-all cursor-pointer flex items-center gap-1.5 ${
                    isSelected
                      ? `${item.colorClass} border-slate-900 text-slate-900 shadow-[2px_2px_0px_#0f172a] -translate-y-0.5`
                      : "bg-white border-transparent hover:border-slate-900 text-slate-700 hover:text-slate-900"
                  }`}
                >
                  <IconComp
                    className={`w-3.5 h-3.5 ${
                      item.id === "litmus_red"
                        ? "text-rose-600"
                        : item.id === "litmus_blue"
                        ? "text-blue-600"
                        : ""
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}

            <div className="w-0.5 h-6 bg-slate-900/20 mx-0.5 hidden sm:block" />

            {/* Group 2: Workbench Reagents & Actions */}
            {(labMode === "sandbox" || isTeacher) ? (
              <>
                <button
                  type="button"
                  onClick={() => setIsAddChemicalModalOpen(true)}
                  className="pop-btn bg-[#34D399] hover:bg-[#10B981] text-slate-900 px-3.5 py-1.5 rounded-xl text-xs gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Tambah Zat</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsVesselListOpen((prev) => !prev)}
                  className="pop-btn bg-white hover:bg-slate-100 text-slate-900 px-3 py-1.5 rounded-xl text-xs gap-1.5"
                  title="Lihat & kelola bejana di atas meja"
                >
                  <Beaker className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Meja ({vessels.length})</span>
                </button>

                <button
                  type="button"
                  onClick={handleResetWorkbench}
                  className="pop-btn bg-white hover:bg-rose-50 text-slate-900 px-3 py-1.5 rounded-xl text-xs gap-1.5"
                  title="Kosongkan Meja"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset</span>
                </button>
              </>
            ) : (
              <>
                {currentTask?.questions && currentTask.questions.length > 0 && (
                  <button
                    type="button"
                    onClick={handleOpenQuizInNewTab}
                    className={`pop-btn px-3.5 py-1.5 rounded-xl text-xs gap-1.5 ${
                      isTaskReactionDone
                        ? "bg-[#FACC15] hover:bg-[#fde047] text-slate-900"
                        : "bg-white hover:bg-slate-100 text-slate-900"
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>
                      {lastQuizScore !== null
                        ? `Kuis (${lastQuizScore}/100)`
                        : "Kerjakan Kuis"}
                    </span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                )}

                {canRetake && (
                  <button
                    type="button"
                    onClick={handleResetWorkbench}
                    className="pop-btn bg-white hover:bg-slate-100 text-slate-900 px-3 py-1.5 rounded-xl text-xs gap-1.5"
                    title="Ulangi Eksperimen"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Ulangi</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setCurrentTask(null);
                    setLabMode("sandbox");
                    setVessels([]);
                    setIsTaskReactionDone(false);
                    setActiveReaction(null);
                  }}
                  className="pop-btn bg-[#A7F3D0] text-slate-900 px-3 py-1.5 rounded-xl text-xs gap-1.5"
                  title="Pindah ke Meja Sandbox Bebas"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sandbox</span>
                </button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          BELOW-THE-STAGE OBSERVATION WORKSPACE
          (HASIL REAKSI, ALASAN TERJADINYA REAKSI, PENGUKURAN ALAT)
          ========================================================================= */}
      {hasObservationSection && (
        <section
          id="lab-observation-section"
          className="w-full pop-dots border-t-4 border-slate-900 py-8 px-4 sm:px-8"
        >
          <div className="max-w-6xl mx-auto space-y-6">
            {/* 1. Task Submission / Completion Banner */}
            {!isTeacher && labMode === "task" && (currentSubmission || isTaskReactionDone) && (
              <div
                className={`pop-card rounded-3xl p-5 sm:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  currentSubmission
                    ? currentSubmission.score >= kkmScore
                      ? "bg-[#D1FAE5]"
                      : "bg-[#FEF08A]"
                    : "bg-[#A7F3D0]"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase bg-white text-slate-900 border-2 border-slate-900 px-2.5 py-0.5 rounded-full">
                      {currentSubmission
                        ? currentSubmission.score >= kkmScore
                          ? `TUNTAS LULUS KKM ${kkmScore}`
                          : `BELUM TUNTAS (< KKM ${kkmScore})`
                        : "TARGET REAKSI TERCAPAI"}
                    </span>
                    {currentSubmission && (
                      <span className="text-xs font-mono font-black text-slate-900">
                        Skor Kuis: {currentSubmission.score}/100
                      </span>
                    )}
                  </div>

                  <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900">
                    {currentSubmission
                      ? "Laporan Praktikum & Nilai Kuis Tersimpan"
                      : "Eksperimen Berhasil! Reaksi Kimia Sudah Terkunci untuk Pengamatan"}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-700 font-medium">
                    {currentSubmission
                      ? currentSubmission.score >= kkmScore
                        ? "Selamat! Nilai kamu telah memenuhi standar ketuntasan minimal."
                        : allowRetakeBelowKkm
                        ? "Skor masih di bawah KKM. Kamu dapat mengulang praktikum atau membuka ulang tab kuis untuk remedial."
                        : "Nilai telah tersimpan. Tugas ini bersifat sekali selesai."
                      : currentTask?.questions && currentTask.questions.length > 0
                      ? "Pelajari alasan dan penjelasan reaksi di bawah, lalu buka halaman Kuis di tab baru untuk mengerjakan evaluasi."
                      : "Amati persamaan reaksi dan penjelasan ilmiah di bawah ini."}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  {currentTask?.questions && currentTask.questions.length > 0 && (
                    <button
                      type="button"
                      onClick={handleOpenQuizInNewTab}
                      className="pop-btn bg-[#FACC15] hover:bg-[#fde047] text-slate-900 px-5 py-2.5 rounded-xl text-xs gap-2"
                    >
                      <Award className="w-4 h-4" />
                      <span>
                        {currentSubmission
                          ? !allowRetakeBelowKkm || currentSubmission.score >= kkmScore
                            ? "Review Kuis (Tab Baru)"
                            : "Kerjakan Remedial Kuis (Tab Baru)"
                          : "Kerjakan Kuis Evaluasi (Tab Baru)"}
                      </span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {currentSubmission && (
                    <button
                      type="button"
                      onClick={() => setViewingSubmissionDetail(currentSubmission)}
                      className="pop-btn bg-white text-slate-900 px-4 py-2.5 rounded-xl text-xs gap-1.5"
                    >
                      <BookOpen className="w-4 h-4 text-[#2563EB]" />
                      <span>Laporan Lengkap</span>
                    </button>
                  )}

                  {canRetake && (
                    <button
                      type="button"
                      onClick={handleResetWorkbench}
                      className="pop-btn bg-white text-slate-900 px-4 py-2.5 rounded-xl text-xs gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Ulangi Praktik</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* 2. Interactive Measurement Inspector Panel */}
            {activeTool !== "hand" && activeMeasurement && (
              <InteractiveMeasurementInspector
                measurement={activeMeasurement}
                onClose={() => {
                  setActiveTool("hand");
                  setActiveMeasurement(null);
                  setDippedVesselId(null);
                }}
                activeTool={activeTool}
                onSelectTool={handleSelectTool}
                allVessels={vessels.map((v) => ({ id: v.id, name: v.name, formula: v.formula }))}
                onSelectVessel={(vId) => {
                  const v = vessels.find((item) => item.id === vId);
                  if (v) handleDipTool(v, activeTool);
                }}
              />
            )}

            {/* 3. Reaction Observation Panel (Hasil Reaksi, Alasan, Penjelasan, Fenomena) */}
            {activeReaction && (
              <div className="pop-card rounded-3xl p-5 sm:p-7 bg-white space-y-5 animate-in fade-in duration-300">
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-slate-900/15 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-[#34D399] border-2 border-slate-900 flex items-center justify-center text-slate-900 shrink-0">
                      <Sparkles className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                        HASIL REAKSI KIMIA TERDETEKSI
                      </span>
                      <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900">
                        {activeReaction.title}
                      </h3>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black bg-[#BAE6FD] text-slate-900 px-3 py-1 rounded-full border-2 border-slate-900">
                      Jenjang {activeReaction.level}
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveReaction(null)}
                      className="pop-btn px-3 py-1.5 text-xs bg-white text-slate-800 rounded-xl gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Tutup</span>
                    </button>
                  </div>
                </div>

                {/* Equation & Result Product */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
                  <div className="lg:col-span-8 flex flex-col justify-center">
                    <ChemicalEquation
                      equation={activeReaction.equation}
                      showCopy={true}
                      title="Persamaan Reaksi Kimia (Stoikiometri Seimbang)"
                    />
                  </div>
                  <div className="lg:col-span-4 p-4 bg-[#FEF9C3] border-2 border-slate-900 rounded-2xl flex flex-col justify-center gap-1.5">
                    <span className="text-[10px] font-black tracking-wider uppercase text-slate-600">
                      Produk Reaksi Terbentuk
                    </span>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full border-2 border-slate-900 shrink-0"
                        style={{ backgroundColor: activeReaction.resultColor || "#38bdf8" }}
                      />
                      <span className="text-sm font-extrabold text-slate-900 truncate">
                        {activeReaction.resultName || "Produk Kimiawi"}
                      </span>
                    </div>
                    <div className="text-xs text-slate-700 font-mono">
                      Formula:{" "}
                      <strong className="text-slate-900">
                        <ChemicalFormula formula={activeReaction.resultFormula} />
                      </strong>
                    </div>
                  </div>
                </div>

                {/* 3 Structured Columns: Alasan, Penjelasan, Ciri Fisik */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch pt-1">
                  {/* Column 1: Alasan Terjadinya Reaksi */}
                  <div className="bg-[#FEF9C3] border-2 border-slate-900 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wide border-b-2 border-slate-900/15 pb-2">
                        <Lightbulb className="w-4 h-4 text-amber-700" />
                        <span>Alasan Terjadinya Reaksi</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                        {activeReaction.reasonWhy ||
                          "Reaksi terjadi akibat adanya driving force termodinamika atau afinitas ikatan antar-partikel zat menuju kondisi kestabilan energi yang lebih rendah."}
                      </p>
                    </div>
                    <div className="text-[10px] font-bold text-slate-600 pt-2 border-t border-slate-900/15">
                      Mekanisme molekuler &amp; afinitas ikatan
                    </div>
                  </div>

                  {/* Column 2: Penjelasan Sains Rinci */}
                  <div className="bg-[#D1FAE5] border-2 border-slate-900 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wide border-b-2 border-slate-900/15 pb-2">
                        <BookOpen className="w-4 h-4 text-emerald-800" />
                        <span>Penjelasan Sains Rinci</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                        {activeReaction.explanation}
                      </p>
                    </div>
                    <div className="text-[10px] font-bold text-slate-600 pt-2 border-t border-slate-900/15">
                      Konsep materi kurikulum sains
                    </div>
                  </div>

                  {/* Column 3: Ciri-Ciri Fisik & Suhu Termal */}
                  <div className="bg-[#E0F2FE] border-2 border-slate-900 rounded-2xl p-4 flex flex-col justify-between space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs font-black text-slate-900 uppercase tracking-wide border-b-2 border-slate-900/15 pb-2">
                        <Eye className="w-4 h-4 text-[#2563EB]" />
                        <span>Ciri-Ciri Fisik Teramati</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                        {activeReaction.observablePhenomena ||
                          "Teramati perubahan warna larutan, pembentukan fase baru, dan perubahan temperatur wadah."}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-900/15 space-y-1.5">
                      <span className="text-[10px] font-black text-slate-700 uppercase">
                        Perubahan Suhu Termal:
                      </span>
                      <div
                        className={`text-xs font-extrabold px-3 py-1.5 rounded-xl border-2 border-slate-900 flex items-center gap-1.5 ${
                          activeReaction.temperatureChange > 0
                            ? "bg-[#FFE4E6] text-slate-900"
                            : activeReaction.temperatureChange < 0
                            ? "bg-white text-slate-900"
                            : "bg-white text-slate-900"
                        }`}
                      >
                        {activeReaction.temperatureChange > 0 ? (
                          <Flame className="w-4 h-4 text-rose-600 shrink-0" />
                        ) : activeReaction.temperatureChange < 0 ? (
                          <Snowflake className="w-4 h-4 text-sky-600 shrink-0" />
                        ) : (
                          <Scale className="w-4 h-4 text-slate-700 shrink-0" />
                        )}
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
                <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t-2 border-slate-900/15">
                  <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Hasil pengamatan reaksi siap dijadikan bahan evaluasi kuis.</span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2.5">
                    {!isTeacher && currentTask?.questions && currentTask.questions.length > 0 && (
                      <button
                        type="button"
                        onClick={handleOpenQuizInNewTab}
                        className="pop-btn bg-[#FACC15] hover:bg-[#fde047] text-slate-900 px-5 py-2.5 text-xs rounded-xl gap-2"
                      >
                        <Award className="w-4 h-4" />
                        <span>Kerjakan Kuis Evaluasi (Tab Baru)</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {!isGuest && (
                      <button
                        type="button"
                        onClick={() => setIsAiAssistantOpen(true)}
                        className="pop-btn bg-[#38BDF8] text-slate-900 px-4 py-2.5 text-xs rounded-xl gap-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Tanya Asisten Lab-AI</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* =========================================================================
          MODALS (AI ASSISTANT, CHEMICAL CATALOG PICKER, LOGIN, SUBMISSION DETAIL)
          ========================================================================= */}
      <AiLabAssistantModal
        isOpen={isAiAssistantOpen && !isGuest}
        onClose={() => setIsAiAssistantOpen(false)}
        activeChemicalNames={activeChemNames}
        vessels={vessels}
        activeReaction={activeReaction}
        currentTask={currentTask}
        labMode={labMode}
        currentStep={currentTask?.title || "Eksplorasi Mandiri"}
        studentName={currentUser?.name || studentName}
        userId={currentUser?.id}
        roomCode={roomCode}
      />

      {/* Chemical Catalog Picker Modal (Mode Sandbox) */}
      {isAddChemicalModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="pop-card rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden bg-[#FFFDF7] animate-in zoom-in-95 duration-200">
            <div className="p-4 sm:px-6 border-b-2 border-slate-900 flex items-center justify-between bg-[#34D399]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center text-slate-900">
                  <FlaskConical className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-slate-900 text-base">
                    Katalog Reagen Kimia (Sandbox)
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-800">
                    Pilih zat kimia untuk diletakkan di atas meja lab 3D.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddChemicalModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center text-slate-900 hover:bg-rose-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search & Filter */}
            <div className="p-4 border-b-2 border-slate-900/15 bg-white space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchChemicalQuery}
                  onChange={(e) => setSearchChemicalQuery(e.target.value)}
                  placeholder="Cari zat kimia (misal: NaOH, Air, Asam Klorida, Garam)..."
                  className="w-full pl-10 pr-3 py-2 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px]">
                {["ALL", "asam", "basa", "garam", "oksidator", "organik", "indikator"].map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategoryFilter(cat)}
                    className={`px-3 py-1 rounded-full font-black whitespace-nowrap border-2 border-slate-900 transition-colors cursor-pointer ${
                      selectedCategoryFilter === cat
                        ? "bg-[#FACC15] text-slate-900"
                        : "bg-white text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    {cat === "ALL" ? "Semua" : cat.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            {/* Chemicals Grid */}
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
                    className="p-3 bg-white border-2 border-slate-900 rounded-2xl flex items-center justify-between gap-3 shadow-[2px_2px_0px_#0f172a]"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-9 h-9 rounded-xl border-2 border-slate-900 flex items-center justify-center shrink-0"
                        style={{ backgroundColor: chem.color || "#06b6d4" }}
                      >
                        <FlaskConical className="w-4 h-4 text-white drop-shadow-xs" />
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-slate-900 text-xs">
                            {chem.formula}
                          </span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded font-black uppercase bg-[#FEF08A] border border-slate-900 text-slate-900">
                            {chem.level}
                          </span>
                        </div>
                        <div className="text-xs font-bold text-slate-700 truncate">{chem.name}</div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleAddChemicalToWorkbench(chem)}
                      className="pop-btn px-3 py-1.5 bg-[#34D399] text-slate-900 text-xs rounded-xl shrink-0 gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Taruh</span>
                    </button>
                  </div>
                ))}
            </div>

            <div className="p-3 px-5 border-t-2 border-slate-900 bg-white flex items-center justify-between text-xs font-bold text-slate-600">
              <span>{chemicalCatalog.length} bahan kimia siap diracik</span>
              <button
                type="button"
                onClick={() => setIsAddChemicalModalOpen(false)}
                className="pop-btn px-4 py-1.5 bg-slate-100 text-slate-900 rounded-xl text-xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthLoginModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
          if (user.role === "student") {
            setStudentName(user.name);
            fetchStudentSubmissions(user.name);
          }
        }}
        currentUser={currentUser}
      />

      {/* Submission Detail Modal */}
      {viewingSubmissionDetail && (
        <StudentSubmissionDetailModal
          submission={viewingSubmissionDetail}
          isTeacherView={isTeacher}
          task={currentTask || tasks.find((t) => t.id === viewingSubmissionDetail.taskId)}
          onClose={() => setViewingSubmissionDetail(null)}
        />
      )}

      {/* Full-Screen Pop-Bauhaus Loading Overlay saat kembali ke Dashboard */}
      {isNavigatingBack && (
        <div className="fixed inset-0 z-[100] bg-[#FFFDF7]/95 backdrop-blur-sm pop-dots flex items-center justify-center p-4">
          <div className="pop-card rounded-3xl px-8 py-7 bg-white flex flex-col items-center gap-4 max-w-sm w-full text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#38BDF8] border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] flex items-center justify-center">
              <FlaskConical className="w-7 h-7 text-slate-900 animate-bounce" />
            </div>
            <div className="w-full h-2.5 rounded-full bg-slate-100 border-2 border-slate-900 overflow-hidden">
              <div className="h-full w-2/3 bg-[#FACC15] animate-pulse rounded-full" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black uppercase tracking-wider text-slate-900">
                Kembali ke Dashboard...
              </p>
              <p className="text-xs font-medium text-slate-600">
                Menutup meja lab 3D &amp; menyiapkan daftar kelasmu.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
