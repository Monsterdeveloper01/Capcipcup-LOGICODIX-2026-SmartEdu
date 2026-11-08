"use client";

import { useState, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import { GameMode, QuestScenario, ScannedItem, RoleplayTurnMessage, SpeakingEvaluation } from "@/lib/linguaquest/types";
import { ActiveClassroom, SafetyAlert, CodeSwitchRescue, StudentStep, ClassroomTaskItem } from "./types";

// Subcomponents & Modals
import StudentClassroomGate from "./steps/StudentClassroomGate";
import StudentTaskCatalog from "./steps/StudentTaskCatalog";
import StudentScanningStep from "./steps/StudentScanningStep";
import StudentInventoryStep from "./steps/StudentInventoryStep";
import StudentDialogueHud from "./steps/StudentDialogueHud";
import StudentAutopsyStep from "./steps/StudentAutopsyStep";
import StudentPokedexModal from "./modals/StudentPokedexModal";
import StudentSafetyModal from "./modals/StudentSafetyModal";
import StudentSosModal from "./modals/StudentSosModal";
import BrutalAlertModal, { ModalConfig } from "../common/BrutalAlertModal";

export default function StudentGameView({
  onXpEarned,
  currentUser,
}: {
  onXpEarned?: (xp: number) => void;
  currentUser?: any;
}) {
  const [selectedMode] = useState<GameMode>("survival");
  const [step, setStep] = useState<StudentStep>("select_mode");

  // Brutal Alert & Confirm Modal (replaces browser native alerts)
  const [alertModal, setAlertModal] = useState<ModalConfig>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const showAlert = (title: string, message: string, type: ModalConfig["type"] = "warning") => {
    setAlertModal({
      isOpen: true,
      title,
      message,
      type,
      confirmText: "[ OKE / MENGERTI ]",
      onConfirm: () => setAlertModal((prev) => ({ ...prev, isOpen: false })),
    });
  };

  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    confirmText = "[ YA, LANJUTKAN ]",
    type: ModalConfig["type"] = "confirm"
  ) => {
    setAlertModal({
      isOpen: true,
      title,
      message,
      type,
      confirmText,
      cancelText: "[ BATAL ]",
      onConfirm: () => {
        setAlertModal((prev) => ({ ...prev, isOpen: false }));
        onConfirm();
      },
      onCancel: () => setAlertModal((prev) => ({ ...prev, isOpen: false })),
    });
  };

  // Classroom Gate State
  const [activeClassroom, setActiveClassroom] = useState<ActiveClassroom | null>(null);
  const [classTasks, setClassTasks] = useState<ClassroomTaskItem[]>([]);
  const [, setSelectedTask] = useState<any | null>(null);
  const [isLoadingTasks, setIsLoadingTasks] = useState<boolean>(false);
  const [, setIsClassroomChecking] = useState<boolean>(true);
  const [inputPin, setInputPin] = useState<string>("");
  const [inputStudentName, setInputStudentName] = useState<string>(currentUser?.name || "Ahmad Faiz");
  const [joinError, setJoinError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState<boolean>(false);

  // Camera & Image State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Centralized Bulletproof Camera Killer (Turns off Hardware Light Immediately)
  const stopCameraStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {}
      });
      streamRef.current = null;
    }

    if (videoRef.current && videoRef.current.srcObject) {
      const ms = videoRef.current.srcObject as MediaStream;
      if (ms && typeof ms.getTracks === "function") {
        ms.getTracks().forEach((track) => {
          try {
            track.stop();
          } catch (e) {}
        });
      }
      videoRef.current.srcObject = null;
    }

    setIsCameraActive(false);
  };

  // Quest & Inventory State
  const [currentQuest, setCurrentQuest] = useState<QuestScenario | null>(null);
  const [inventoryItems, setInventoryItems] = useState<ScannedItem[]>([]);

  // Feature 3: Pokedex Deck State
  const [showPokedexModal, setShowPokedexModal] = useState<boolean>(false);
  const [pokedexDeck, setPokedexDeck] = useState<ScannedItem[]>([]);

  // Feature 5: Safe-School Shield State
  const [safetyAlert, setSafetyAlert] = useState<SafetyAlert | null>(null);
  const [showSafetyModal, setShowSafetyModal] = useState<boolean>(false);
  const [safetyViolationNotice, setSafetyViolationNotice] = useState<string | null>(null);

  // Feature 6: Code-Switching Rescue State
  const [codeSwitchRescue, setCodeSwitchRescue] = useState<CodeSwitchRescue | null>(null);
  const [showSosModal, setShowSosModal] = useState<boolean>(false);
  const [sosInput, setSosInput] = useState<string>("");

  // HUD & Speaking State
  const [messages, setMessages] = useState<RoleplayTurnMessage[]>([]);
  const [rapport, setRapport] = useState<number>(20);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [spokenTranscript, setSpokenTranscript] = useState<string>("");
  const [textInput, setTextInput] = useState<string>("");
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [hesitationCounter] = useState<number>(0);

  // Post-Game Autopsy State
  const [evaluation, setEvaluation] = useState<SpeakingEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null);

  // Load Active Classroom and its tasks from localStorage & database
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        if (!currentUser) {
          setActiveClassroom(null);
          return;
        }

        const userKey = currentUser.id || currentUser.username || "student";
        const savedClass =
          localStorage.getItem(`lq_classroom_${userKey}`) ||
          localStorage.getItem("lq_active_classroom");

        if (savedClass) {
          const parsed = JSON.parse(savedClass);
          setActiveClassroom(parsed);
          fetchClassTasks(parsed.roomCode || "EDU889");
        } else {
          setActiveClassroom(null);
        }
      } catch (e) {
        console.warn("Classroom load error:", e);
      } finally {
        setIsClassroomChecking(false);
      }
    } else {
      setIsClassroomChecking(false);
    }
  }, [currentUser]);

  const fetchClassTasks = async (pin: string) => {
    setIsLoadingTasks(true);
    try {
      const res = await fetch(`/api/student/classroom?pin=${pin}&userId=${currentUser?.id || ""}`);
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.classroom) {
          setActiveClassroom((prev) => ({
            ...prev,
            id: data.classroom.id,
            roomCode: data.classroom.classCode,
            name: data.classroom.name,
            creatorName: data.classroom.teacherName,
            gradeLevel: data.classroom.gradeLevel,
          }));
        }
        if (data.tasks) {
          setClassTasks(data.tasks);
        }
      }
    } catch (err) {
      console.warn("Fetch class tasks error:", err);
    } finally {
      setIsLoadingTasks(false);
    }
  };

  // Sync student name when currentUser changes
  useEffect(() => {
    if (currentUser?.name) {
      setInputStudentName(currentUser.name);
    }
  }, [currentUser]);

  // Handle joining classroom via PIN
  const handleJoinClassroom = async (overridePin?: string) => {
    const pinToUse = (overridePin || inputPin).trim().toUpperCase();
    const nameToUse = currentUser?.name || inputStudentName.trim() || "Ahmad Faiz";

    if (!pinToUse) {
      setJoinError("Masukkan 6-digit PIN room kelas yang diberikan gurumu.");
      return;
    }

    setIsJoining(true);
    setJoinError(null);

    try {
      const res = await fetch("/api/student/classroom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pin: pinToUse,
          userId: currentUser?.id,
          studentName: nameToUse,
          studentUsername: currentUser?.username,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Kelas dengan PIN [${pinToUse}] tidak ditemukan. Pastikan gurumu sudah membuat kelas di dashboard Guru.`);
      }

      const cls = data.classroom;
      const classData: ActiveClassroom = {
        id: cls.id,
        roomCode: cls.classCode,
        name: cls.name,
        creatorName: cls.teacherName || "Budi Santoso, S.Pd",
        topic: cls.name,
        gradeLevel: cls.gradeLevel,
        description: cls.description,
      };

      setActiveClassroom(classData);
      setClassTasks(data.tasks || []);
      if (typeof window !== "undefined") {
        const userKey = currentUser?.id || currentUser?.username || "student";
        localStorage.setItem(`lq_classroom_${userKey}`, JSON.stringify(classData));
        localStorage.setItem("lq_active_classroom", JSON.stringify(classData));
      }
    } catch (err: any) {
      setJoinError(err.message || "Gagal masuk ke kelas.");
    } finally {
      setIsJoining(false);
    }
  };

  // Select a task and launch camera & roleplay
  const handleSelectAndStartTask = (task: any) => {
    let parsedObjectives = [];
    try {
      parsedObjectives = typeof task.mission_objectives === "string" ? JSON.parse(task.mission_objectives) : task.mission_objectives || task.missionObjectives || [];
    } catch (e) {}

    let parsedVocab: string[] = [];
    try {
      parsedVocab = typeof task.target_vocabularies === "string" ? JSON.parse(task.target_vocabularies) : task.target_vocabularies || task.targetVocabularies || [];
    } catch (e) {}

    setSelectedTask(task);
    const teacherQuest: QuestScenario = {
      id: task.id,
      title: task.title,
      mode: "smk_career",
      npcName: task.npc_name || task.npcName || "Mr. Arthur",
      npcRole: task.npc_persona || task.npcPersona || "Examiner & Evaluator",
      npcAvatar: "🧑‍🏫",
      npcPersonality: task.npc_persona || task.npcPersona || "Kritis dan apresiatif",
      scenarioBrief: task.case_study_story || task.caseStudyStory || "Skenario studi kasus kelas bahasa Inggris.",
      urgentGoal: parsedObjectives[0] || "Jelaskan ide dan solusi utamamu kepada NPC menggunakan bahasa Inggris.",
      targetVocab: parsedVocab.length > 0 ? parsedVocab : ["sustainable", "solution", "durable"],
      timeLimitSeconds: 180,
      initialNpcGreeting: `Hello! I'm ${task.npc_name || task.npcName || "your examiner"}. I am reviewing your class project today regarding "${task.title}". Could you introduce yourself and show the items you brought?`,
      curriculumTopic: task.title,
      targetItems: [],
    };
    setCurrentQuest(teacherQuest);
    setStep("scanning");
    setIsCameraActive(true);
  };

  const handleReturnToClassCatalog = () => {
    stopCameraStream();
    setSelectedTask(null);
    setStep("select_mode");
    if (activeClassroom?.roomCode) {
      fetchClassTasks(activeClassroom.roomCode);
    }
  };

  const handleLeaveClassroom = () => {
    showConfirm(
      "Konfirmasi Keluar Kelas",
      "Apakah kamu yakin ingin keluar dari rombongan kelas ini? Kamu harus memasukkan PIN baru untuk masuk kembali.",
      () => {
        setActiveClassroom(null);
        setClassTasks([]);
        setSelectedTask(null);
        if (typeof window !== "undefined") {
          const userKey = currentUser?.id || currentUser?.username || "student";
          localStorage.removeItem(`lq_classroom_${userKey}`);
          localStorage.removeItem("lq_active_classroom");
        }
        resetAll();
      },
      "[ YA, KELUAR KELAS ]",
      "danger"
    );
  };

  // Load Vocab Pokedex from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("lq_inventory_deck");
        if (saved) {
          setPokedexDeck(JSON.parse(saved));
        } else {
          const defaultDeck: ScannedItem[] = [
            {
              id: "dex_seed_1",
              objectName: "Botol Minum",
              englishWord: "Tumbler / Water Bottle",
              phonetics: "/ˈtʌm.blər/",
              meaningId: "Botol wadah minuman praktis tahan lama",
              rpgAttribute: "+15 Hydration Endurance",
              idiom: "Pour oil on troubled waters (Menenangkan suasana tegang)",
              iconName: "Droplet",
              usedInSpeech: false,
            },
            {
              id: "dex_seed_2",
              objectName: "Buku Catatan",
              englishWord: "Notebook",
              phonetics: "/ˈnoʊt.bʊk/",
              meaningId: "Buku catatan untuk menulis ide dan materi",
              rpgAttribute: "+20 Arcane Knowledge",
              idiom: "Read between the lines (Menangkap makna tersirat)",
              iconName: "BookOpen",
              usedInSpeech: false,
            },
            {
              id: "dex_seed_3",
              objectName: "Cangkir Kopi",
              englishWord: "Coffee Mug",
              phonetics: "/ˈkɔː.fi mʌɡ/",
              meaningId: "Cangkir tempat minum kopi atau teh",
              rpgAttribute: "+25 Focus & Energy",
              idiom: "Not my cup of tea (Bukan hal yang saya sukai)",
              iconName: "Coffee",
              usedInSpeech: false,
            },
          ];
          localStorage.setItem("lq_inventory_deck", JSON.stringify(defaultDeck));
          setPokedexDeck(defaultDeck);
        }
      } catch (e) {
        console.warn("Pokedex load error:", e);
      }
    }
  }, []);

  const saveItemsToPokedex = (newItems: ScannedItem[]) => {
    if (typeof window === "undefined" || !newItems || newItems.length === 0) return;
    setPokedexDeck((prev) => {
      const existing = new Set(prev.map((i) => i.englishWord.toLowerCase()));
      const filtered = newItems.filter((i) => !existing.has(i.englishWord.toLowerCase()));
      const updated = [...filtered, ...prev];
      try {
        localStorage.setItem("lq_inventory_deck", JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  // Camera stream handler with automatic hardware shutoff
  useEffect(() => {
    let isCancelled = false;

    if (step === "scanning" && isCameraActive && !capturedImage) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: "environment", width: 1280, height: 720 } })
        .then((s) => {
          if (isCancelled) {
            s.getTracks().forEach((track) => {
              try { track.stop(); } catch (e) {}
            });
            return;
          }

          if (streamRef.current && streamRef.current !== s) {
            streamRef.current.getTracks().forEach((t) => {
              try { t.stop(); } catch (e) {}
            });
          }

          streamRef.current = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch((err) => {
          console.warn("Kamera tidak dapat diakses:", err);
          stopCameraStream();
          setScanError("Kamera tidak dapat diakses atau izin ditolak. Anda dapat mengunggah file foto di bawah.");
        });
    } else {
      stopCameraStream();
    }

    return () => {
      isCancelled = true;
      stopCameraStream();
    };
  }, [step, isCameraActive, capturedImage]);

  // Web Speech API (STT) setup
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setSpokenTranscript(currentTranscript);
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition error:", event.error);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      }
    }
  }, []);

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleListening = () => {
    if (!recognitionRef.current) {
      showAlert(
        "Mikrofon Tidak Didukung",
        "Browser Anda belum mendukung Web Speech API. Silakan gunakan Google Chrome, Microsoft Edge, atau ketik kalimat di kolom input teks.",
        "warning"
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setSpokenTranscript("");
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.warn("Error starting speech recognition:", err);
      }
    }
  };

  // Vision Scan Actions
  const handleSnapFromVideo = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);

    stopCameraStream();
    setCapturedImage(dataUrl);
    processVisionScan(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    stopCameraStream();
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setCapturedImage(dataUrl);
      processVisionScan(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const processVisionScan = async (base64Image: string) => {
    setIsAnalyzing(true);
    setScanError(null);

    try {
      const res = await fetch("/api/linguaquest/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: base64Image,
          mode: selectedMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses gambar.");
      }

      if (data.safetyAlert && data.safetyAlert.isHazard) {
        setSafetyAlert(data.safetyAlert);
        setShowSafetyModal(true);
        setIsCameraActive(false);
        setCapturedImage(null);
        return;
      }

      if (data.scannedItems && data.scannedItems.length > 0) {
        saveItemsToPokedex(data.scannedItems);
      }

      setCurrentQuest(data.quest);
      setInventoryItems(data.scannedItems);
      setStep("inventory");

      if (data.quest?.initialNpcGreeting) {
        setTimeout(() => speakText(data.quest.initialNpcGreeting), 900);
      }
    } catch (err: any) {
      console.error("Scan error:", err);
      setScanError(err.message || "Gagal mendeteksi objek. Pastikan GEMINI_API_KEY terpasang di .env.local.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Roleplay Session Actions
  const startRoleplaySession = () => {
    stopCameraStream();
    if (!currentQuest) return;
    const initialMsg: RoleplayTurnMessage = {
      id: `npc_init_${Date.now()}`,
      sender: "npc",
      text: currentQuest.initialNpcGreeting,
      timestamp: Date.now(),
    };
    setMessages([initialMsg]);
    setRapport(25);
    setSessionStartTime(Date.now());
    setStep("hud");
    speakText(currentQuest.initialNpcGreeting);
  };

  const handleSendSpokenLine = async (overrideText?: string) => {
    const textToSend = (overrideText || spokenTranscript || textInput).trim();
    if (!textToSend || !currentQuest || isAiThinking) return;

    const studentMsg: RoleplayTurnMessage = {
      id: `student_${Date.now()}`,
      sender: "student",
      text: textToSend,
      timestamp: Date.now(),
    };

    const newMessages = [...messages, studentMsg];
    setMessages(newMessages);
    setSpokenTranscript("");
    setTextInput("");
    setIsAiThinking(true);
    setActiveHint(null);

    const lowerText = textToSend.toLowerCase();
    setInventoryItems((prev) =>
      prev.map((item) => ({
        ...item,
        usedInSpeech: item.usedInSpeech || lowerText.includes(item.englishWord.toLowerCase()),
      }))
    );

    try {
      const res = await fetch("/api/linguaquest/roleplay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quest: currentQuest,
          studentSpeech: textToSend,
          messagesHistory: newMessages,
          currentRapport: rapport,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses percakapan.");

      const npcMsg: RoleplayTurnMessage = data.npcMessage;
      setMessages((prev) => [...prev, npcMsg]);
      setRapport(data.newRapport);

      if (data.isSafetyViolation) {
        setSafetyViolationNotice(
          "⚠️ Safe-School Shield: Ujaran mengandung kata kasar atau tidak pantas. Poin Rapport berkurang -20. Silakan gunakan bahasa yang sopan dan santun."
        );
      } else {
        setSafetyViolationNotice(null);
      }

      if (data.codeSwitchRescue && data.codeSwitchRescue.detectedIndonesianWord) {
        setCodeSwitchRescue(data.codeSwitchRescue);
      } else {
        setCodeSwitchRescue(null);
      }

      if (npcMsg.hint) setActiveHint(npcMsg.hint);
      speakText(npcMsg.text);

      if (data.isQuestCompleted) {
        setTimeout(() => finishQuestSession(newMessages), 2500);
      }
    } catch (err: any) {
      console.error("Roleplay turn error:", err);
    } finally {
      setIsAiThinking(false);
    }
  };

  const handleSendSosQuery = () => {
    if (!sosInput.trim()) return;
    const term = sosInput.trim();
    setShowSosModal(false);
    setSosInput("");
    handleSendSpokenLine(`Excuse me, what is the English word for "${term}"?`);
  };

  const finishQuestSession = async (allMessages?: RoleplayTurnMessage[]) => {
    stopCameraStream();
    if (!currentQuest) return;
    setIsEvaluating(true);
    setStep("autopsy");

    const duration = Math.round((Date.now() - sessionStartTime) / 1000);

    try {
      const res = await fetch("/api/linguaquest/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quest: currentQuest,
          messages: allMessages || messages,
          durationSeconds: duration,
          hesitationSeconds: hesitationCounter,
          codeSwitchingCount: 0,
          studentName: currentUser?.name || inputStudentName || "Ahmad Faiz",
          roomCode: activeClassroom?.roomCode || "CLASS-10A",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses evaluasi CEFR.");

      setEvaluation(data.evaluation);
      onXpEarned?.(data.evaluation.xpEarned || 200);

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.5 },
      });
    } catch (err: any) {
      console.error("Evaluation error:", err);
    } finally {
      setIsEvaluating(false);
    }
  };

  const resetAll = () => {
    stopCameraStream();
    setStep("select_mode");
    setCapturedImage(null);
    setCurrentQuest(null);
    setInventoryItems([]);
    setMessages([]);
    setEvaluation(null);
    setActiveHint(null);
    setCodeSwitchRescue(null);
    setSafetyViolationNotice(null);
  };

  return (
    <>
      {/* STEP 0: CLASSROOM GATE (UNENROLLED) */}
      {!activeClassroom && (
        <StudentClassroomGate
          currentUser={currentUser}
          inputPin={inputPin}
          setInputPin={setInputPin}
          inputStudentName={inputStudentName}
          isJoining={isJoining}
          joinError={joinError}
          onJoinClassroom={handleJoinClassroom}
        />
      )}

      {/* STEP 1: TASK CATALOG IN ACTIVE CLASSROOM */}
      {step === "select_mode" && activeClassroom && (
        <StudentTaskCatalog
          activeClassroom={activeClassroom}
          classTasks={classTasks}
          isLoadingTasks={isLoadingTasks}
          pokedexCount={pokedexDeck.length}
          onOpenPokedex={() => setShowPokedexModal(true)}
          onLeaveClassroom={handleLeaveClassroom}
          onRefreshTasks={() => fetchClassTasks(activeClassroom.roomCode)}
          onSelectTask={handleSelectAndStartTask}
        />
      )}

      {/* STEP 2: SCANNING OBJECTS WITH CAMERA / VISION */}
      {step === "scanning" && (
        <StudentScanningStep
          activeClassroom={activeClassroom}
          pokedexCount={pokedexDeck.length}
          videoRef={videoRef}
          isCameraActive={isCameraActive}
          capturedImage={capturedImage}
          isAnalyzing={isAnalyzing}
          scanError={scanError}
          onReturnToCatalog={handleReturnToClassCatalog}
          onOpenPokedex={() => setShowPokedexModal(true)}
          onStartCamera={() => setIsCameraActive(true)}
          onSnapFromVideo={handleSnapFromVideo}
          onFileUpload={handleFileUpload}
          onRetake={() => {
            setCapturedImage(null);
            setIsCameraActive(true);
          }}
        />
      )}

      {/* STEP 3: INVENTORY CARDS & QUEST BRIEFING */}
      {step === "inventory" && (
        <StudentInventoryStep
          activeClassroom={activeClassroom}
          inventoryItems={inventoryItems}
          currentQuest={currentQuest}
          pokedexCount={pokedexDeck.length}
          onRescan={() => setStep("scanning")}
          onOpenPokedex={() => setShowPokedexModal(true)}
          onSpeak={speakText}
          onStartRoleplay={startRoleplaySession}
        />
      )}

      {/* STEP 4: LIVE ROLEPLAY DIALOGUE HUD */}
      {step === "hud" && currentQuest && (
        <StudentDialogueHud
          activeClassroom={activeClassroom}
          currentQuest={currentQuest}
          messages={messages}
          rapport={rapport}
          isListening={isListening}
          spokenTranscript={spokenTranscript}
          textInput={textInput}
          setTextInput={setTextInput}
          isAiThinking={isAiThinking}
          activeHint={activeHint}
          setActiveHint={setActiveHint}
          inventoryItems={inventoryItems}
          safetyViolationNotice={safetyViolationNotice}
          setSafetyViolationNotice={setSafetyViolationNotice}
          codeSwitchRescue={codeSwitchRescue}
          setCodeSwitchRescue={setCodeSwitchRescue}
          pokedexCount={pokedexDeck.length}
          onOpenPokedex={() => setShowPokedexModal(true)}
          onOpenSos={() => setShowSosModal(true)}
          onFinishSession={() => finishQuestSession()}
          onToggleListening={toggleListening}
          onSendSpokenLine={handleSendSpokenLine}
          onSpeak={speakText}
        />
      )}

      {/* STEP 5: POST-GAME AUTOPSY & CEFR REPORT */}
      {step === "autopsy" && (
        <StudentAutopsyStep
          activeClassroom={activeClassroom}
          isEvaluating={isEvaluating}
          evaluation={evaluation}
          pokedexCount={pokedexDeck.length}
          onOpenPokedex={() => setShowPokedexModal(true)}
          onReturnToCatalog={handleReturnToClassCatalog}
        />
      )}

      {/* SHARED MODALS */}
      <StudentPokedexModal
        isOpen={showPokedexModal}
        onClose={() => setShowPokedexModal(false)}
        deck={pokedexDeck}
        onSpeak={speakText}
      />

      <StudentSafetyModal
        isOpen={showSafetyModal}
        safetyAlert={safetyAlert}
        onAcknowledge={() => {
          setShowSafetyModal(false);
          setSafetyAlert(null);
          setCapturedImage(null);
          setIsCameraActive(true);
        }}
      />

      <StudentSosModal
        isOpen={showSosModal}
        onClose={() => setShowSosModal(false)}
        sosInput={sosInput}
        setSosInput={setSosInput}
        onSubmit={handleSendSosQuery}
      />

      {/* Global Neo-Brutalist Alert/Confirm Modal */}
      <BrutalAlertModal {...alertModal} />
    </>
  );
}
