"use client";

import { useState, useRef, useEffect } from "react";
import { GameMode, QuestScenario, ScannedItem, RoleplayTurnMessage, SpeakingEvaluation } from "@/lib/linguaquest/types";
import confetti from "canvas-confetti";
import {
  Camera,
  Upload,
  Volume2,
  Mic,
  Send,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  ArrowRight,
  Flame,
  Zap,
  Terminal,
  ShieldAlert,
  Radio,
  Sparkles,
} from "lucide-react";

const GAME_MODES = [
  {
    id: "survival" as GameMode,
    code: "MOD-01",
    title: "Survival & Adventure RPG",
    target: "Siswa SD – SMA",
    description: "Terdampar di pulau misterius. Scan barang di sekitarmu sebagai alat barter untuk melobi penjaga gerbang kuno.",
    badge: "Anti-Speaking Anxiety",
    accent: "border-[#facc15]",
    icon: "🏕️",
  },
  {
    id: "smk_career" as GameMode,
    code: "MOD-02",
    title: "SMK & Career Simulator",
    target: "SMK Perhotelan & Bisnis",
    description: "Hadapi tamu VIP asing yang komplain di hotel bintang 5. Negosiasikan solusi profesional dan tawarkan kompensasi.",
    badge: "Vocational Hospitality",
    accent: "border-[#22d3ee]",
    icon: "🏨",
  },
  {
    id: "local_pride" as GameMode,
    code: "MOD-03",
    title: "Local Pride Ambassador",
    target: "Budaya & Produk Lokal",
    description: "Jelaskan keistimewaan warisan budaya nusantara (Batik, Kopi, Anyaman) ke travel blogger mancanegara.",
    badge: "Cultural Diplomacy",
    accent: "border-[#4ade80]",
    icon: "🎨",
  },
  {
    id: "boss_raid" as GameMode,
    code: "MOD-04",
    title: "Classroom Boss Raid",
    target: "Satu Kelas Kolaboratif",
    description: "Gabungkan benda nyata 3-4 siswa untuk berdebat melawan Titan Polusi Lingkungan dalam Mode Proyektor.",
    badge: "Classroom Co-op",
    accent: "border-[#ef4444]",
    icon: "⚔️",
  },
];

export default function StudentGameView({
  onXpEarned,
}: {
  onXpEarned?: (xp: number) => void;
}) {
  const [selectedMode, setSelectedMode] = useState<GameMode>("survival");
  const [step, setStep] = useState<"select_mode" | "scanning" | "inventory" | "hud" | "autopsy">("select_mode");

  // Camera & Image State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [scanError, setScanError] = useState<string | null>(null);

  // Quest & Inventory State
  const [currentQuest, setCurrentQuest] = useState<QuestScenario | null>(null);
  const [inventoryItems, setInventoryItems] = useState<ScannedItem[]>([]);

  // HUD & Speaking State
  const [messages, setMessages] = useState<RoleplayTurnMessage[]>([]);
  const [rapport, setRapport] = useState<number>(20);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [spokenTranscript, setSpokenTranscript] = useState<string>("");
  const [textInput, setTextInput] = useState<string>("");
  const [isAiThinking, setIsAiThinking] = useState<boolean>(false);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [sessionStartTime, setSessionStartTime] = useState<number>(0);
  const [hesitationCounter, setHesitationCounter] = useState<number>(0);

  // Post-Game Autopsy State
  const [evaluation, setEvaluation] = useState<SpeakingEvaluation | null>(null);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // Speech Recognition Ref
  const recognitionRef = useRef<any>(null);

  // ============================================================================
  // CAMERA STREAM HANDLER
  // ============================================================================
  useEffect(() => {
    let stream: MediaStream | null = null;

    if (step === "scanning" && isCameraActive) {
      navigator.mediaDevices
        ?.getUserMedia({ video: { facingMode: "environment", width: 1280, height: 720 } })
        .then((s) => {
          stream = s;
          if (videoRef.current) {
            videoRef.current.srcObject = s;
            videoRef.current.play().catch(() => {});
          }
        })
        .catch((err) => {
          console.warn("Kamera tidak dapat diakses:", err);
          setIsCameraActive(false);
          setScanError("Kamera tidak dapat diakses atau izin ditolak. Anda dapat mengunggah file foto di bawah.");
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [step, isCameraActive]);

  // ============================================================================
  // WEB SPEECH API (STT & TTS)
  // ============================================================================
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
      alert("Browser Anda belum mendukung Web Speech API. Silakan gunakan Chrome/Edge atau ketik kalimat di kolom teks.");
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

  // ============================================================================
  // ACTION: SNAP & SCAN OBJECTS DENGAN GEMINI AI VISION
  // ============================================================================
  const handleSnapFromVideo = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setCapturedImage(dataUrl);
    processVisionScan(dataUrl);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
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

  // ============================================================================
  // ACTION: START HUD ROLEPLAY
  // ============================================================================
  const startRoleplaySession = () => {
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

  // ============================================================================
  // ACTION: SEND SPOKEN TURN TO NPC AI
  // ============================================================================
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

    // Tandai jika ada item inventori yang berhasil diucapkan
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

  // ============================================================================
  // ACTION: FINISH QUEST & RUN POST-GAME AUTOPSY
  // ============================================================================
  const finishQuestSession = async (allMessages?: RoleplayTurnMessage[]) => {
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
          studentName: "Siswa Petualang",
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
    setStep("select_mode");
    setCapturedImage(null);
    setCurrentQuest(null);
    setInventoryItems([]);
    setMessages([]);
    setEvaluation(null);
    setActiveHint(null);
  };

  // ============================================================================
  // RENDER: STEP 1 - SELECT GAME MODE (NEO-BRUTALIST CARTRIDGES)
  // ============================================================================
  if (step === "select_mode") {
    return (
      <div className="space-y-8 font-mono">
        {/* Anti-slop Stark Brutalist Hero (Clean Light) */}
        <div className="border-2 border-black bg-white p-6 sm:p-8 shadow-[4px_4px_0px_#000000] relative">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-200 pb-4 mb-5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 bg-[#facc15] border border-black inline-block" />
              <span className="font-mono text-xs font-black uppercase tracking-widest text-black">
                [PROTOCOL: LIVE_VISION_ENGLISH_RPG]
              </span>
            </div>
            <span className="font-mono text-xs font-bold text-zinc-600">
              TARGET: PATAHKAN PASSIVE FLUENCY TRAP
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-black uppercase tracking-tight leading-none mb-4">
            SCAN BENDA NYATA. HADAPI NPC. <br />
            <span className="text-black bg-[#facc15] px-2.5 py-0.5 inline-block border-2 border-black shadow-[2px_2px_0px_#000000] mt-1.5">
              BICARA BAHASA INGGRIS SEKARANG.
            </span>
          </h1>

          <p className="text-xs sm:text-sm font-mono text-zinc-700 max-w-2xl leading-relaxed">
            Hentikan menghafal rumus di atas kertas. Arahkan kamera ke meja juri atau ruanganmu. AI Vision mendeteksi objek nyata, mengubahnya menjadi Kartu Item RPG, dan mengunci kamu dalam misi darurat berbicara spontan selama 3 menit.
          </p>
        </div>

        {/* 4 Neo-Brutalist Game Cartridges (Light Cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {GAME_MODES.map((mode) => (
            <div
              key={mode.id}
              onClick={() => {
                setSelectedMode(mode.id);
                setStep("scanning");
                setIsCameraActive(true);
              }}
              className="group cursor-pointer bg-white border-2 border-black p-6 shadow-[4px_4px_0px_#000000] transition-all hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#facc15] flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-3">
                  <span className="font-mono text-xs font-black bg-[#facc15] text-black px-2.5 py-1 border border-black shadow-[2px_2px_0px_#000000]">
                    [{mode.code}]
                  </span>
                  <span className="font-mono text-[11px] font-bold uppercase text-zinc-600">
                    {mode.badge}
                  </span>
                </div>

                <div className="flex items-start gap-4">
                  <div className="text-4xl p-2.5 bg-zinc-50 border-2 border-black shadow-[2px_2px_0px_#000000] group-hover:scale-105 transition-transform">
                    {mode.icon}
                  </div>
                  <div>
                    <h3 className="font-black text-xl text-black uppercase tracking-tight group-hover:text-amber-600 transition-colors">
                      {mode.title}
                    </h3>
                    <span className="font-mono text-xs font-bold text-cyan-700 block mt-0.5">
                      TARGET: {mode.target}
                    </span>
                  </div>
                </div>

                <p className="text-xs font-mono text-zinc-700 leading-relaxed bg-zinc-50 p-3.5 border border-black">
                  {mode.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t-2 border-zinc-200 flex items-center justify-between">
                <span className="font-mono text-xs font-black uppercase text-black group-hover:text-amber-600">
                  [ AKTIFKAN KAMERA ]
                </span>
                <ArrowRight className="w-4 h-4 text-black group-hover:translate-x-1.5 transition-transform stroke-[3]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: STEP 2 - SCANNING REAL OBJECTS (INDUSTRIAL APERTURE VIEWFINDER)
  // ============================================================================
  if (step === "scanning") {
    return (
      <div className="max-w-3xl mx-auto space-y-5 font-mono">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep("select_mode")}
            className="brutal-btn-white px-3 py-1.5 text-xs font-mono"
          >
            ← KEMBALI KE PILIHAN MODE
          </button>
          <span className="font-mono text-xs font-black uppercase bg-[#facc15] text-black px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000000]">
            [LANGKAH 01: OBJECT_TO_INVENTORY]
          </span>
        </div>

        {/* Industrial Viewfinder Frame (Clean Light Frame) */}
        <div className="border-2 border-black bg-white shadow-[4px_4px_0px_#000000] relative">
          {/* Viewfinder Header Bar */}
          <div className="p-3 bg-zinc-100 border-b-2 border-black flex items-center justify-between text-xs font-mono font-black text-black">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-red-600 rounded-full border border-black animate-pulse" />
              <span>[CAM_FEED: 1280X720 // SENSOR: ACTIVE]</span>
            </div>
            <span className="text-black hidden sm:inline bg-[#facc15] px-2 py-0.5 border border-black">
              [TARGET: 2-3 BENDA DI MEJA]
            </span>
          </div>

          {/* Camera Viewport with Corner Crosshairs */}
          <div className="relative h-[380px] sm:h-[460px] bg-zinc-900 flex items-center justify-center overflow-hidden">
            {capturedImage ? (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            ) : isCameraActive ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-3 text-zinc-300 p-6 text-center">
                <Camera className="w-12 h-12 stroke-[2] text-[#facc15]" />
                <p className="font-mono text-xs max-w-sm">
                  Kamera belum aktif. Klik tombol di bawah untuk menyalakan webcam atau unggah foto benda dari komputermu.
                </p>
                <button
                  onClick={() => setIsCameraActive(true)}
                  className="brutal-btn-yellow px-5 py-2.5 text-xs font-mono"
                >
                  NYALAKAN KAMERA WEBCAM
                </button>
              </div>
            )}

            {/* Corner Crosshairs */}
            <div className="absolute top-4 left-4 font-mono text-xl font-black text-[#facc15] select-none pointer-events-none">
              + [0,0]
            </div>
            <div className="absolute top-4 right-4 font-mono text-xl font-black text-[#facc15] select-none pointer-events-none">
              [W,0] +
            </div>
            <div className="absolute bottom-4 left-4 font-mono text-xl font-black text-[#facc15] select-none pointer-events-none">
              + [0,H]
            </div>
            <div className="absolute bottom-4 right-4 font-mono text-xl font-black text-[#facc15] select-none pointer-events-none">
              [W,H] +
            </div>

            {/* Targeting Reticle */}
            {isCameraActive && !capturedImage && (
              <div className="absolute inset-10 border-2 border-[#facc15] border-dashed pointer-events-none flex items-center justify-center">
                <div className="font-mono text-xs font-black uppercase text-black bg-[#facc15] px-3 py-1 border-2 border-black shadow-[3px_3px_0px_#000000]">
                  [POSISIKAN OBJEK DI AREA BIDIK INI]
                </div>
              </div>
            )}

            {/* Analyzing Overlay */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-white/95 flex flex-col items-center justify-center gap-3 z-30 p-6 text-center">
                <div className="w-10 h-10 border-4 border-black border-t-[#facc15] animate-spin" />
                <span className="font-mono text-sm font-black uppercase text-black bg-[#facc15] px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000000]">
                  [GEMINI 3.1 FLASH-LITE // VISION SCANNING...]
                </span>
                <p className="font-mono text-xs text-zinc-700 max-w-xs">
                  Mengekstrak kosakata bahasa Inggris, simbol fonetik IPA, idiom, dan menyintesis skenario darurat RPG...
                </p>
              </div>
            )}
          </div>

          {/* Scan Error Bar */}
          {scanError && (
            <div className="p-3 bg-red-50 border-t-2 border-red-600 text-red-900 text-xs font-mono font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
              <span>{scanError}</span>
            </div>
          )}

          {/* Bottom Shutter Controls */}
          <div className="p-4 bg-white border-t-2 border-black flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="brutal-btn-white px-3.5 py-2 text-xs font-mono cursor-pointer flex items-center gap-2">
                <Upload className="w-3.5 h-3.5" />
                <span>[ UNGGAH FOTO ]</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>

              {capturedImage && (
                <button
                  onClick={() => {
                    setCapturedImage(null);
                    setIsCameraActive(true);
                  }}
                  className="brutal-btn-white px-3 py-2 text-xs font-mono"
                >
                  [ FOTO ULANG ]
                </button>
              )}
            </div>

            {isCameraActive && !capturedImage && (
              <button
                onClick={handleSnapFromVideo}
                disabled={isAnalyzing}
                className="brutal-btn-yellow px-6 py-2.5 text-xs sm:text-sm font-mono flex items-center gap-2"
              >
                <Camera className="w-4 h-4 stroke-[2.5]" />
                <span>📸 JEPRET & ANALISIS OBJEK (AI VISION)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: STEP 3 - INVENTORY CARDS & QUEST BRIEFING (LIGHT TACTILE CARDS)
  // ============================================================================
  if (step === "inventory") {
    return (
      <div className="max-w-4xl mx-auto space-y-6 font-mono">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep("scanning")}
            className="brutal-btn-white px-3 py-1.5 text-xs font-mono"
          >
            ← SCAN FOTO LAIN
          </button>
          <span className="font-mono text-xs font-black uppercase bg-[#4ade80] text-black px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000000]">
            [STATUS: {inventoryItems.length} OBJEK TERDETEKSI & TERDAFTAR]
          </span>
        </div>

        {/* 3 Brutalist RPG Inventory Cards (Light Mode) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {inventoryItems.map((item, idx) => (
            <div
              key={item.id}
              className="bg-white border-2 border-black p-5 shadow-[4px_4px_0px_#000000] flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-2">
                  <span className="font-mono text-[10px] font-black uppercase text-zinc-600">
                    [ITEM-0{idx + 1}: {item.objectName}]
                  </span>
                  <button
                    onClick={() => speakText(item.englishWord)}
                    title="Dengarkan Pengucapan Bahasa Inggris (IPA)"
                    className="brutal-btn-cyan p-1 text-[10px] font-mono"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <h4 className="font-black text-xl text-black uppercase tracking-tight">
                    {item.englishWord}
                  </h4>
                  <p className="font-mono text-xs font-bold text-cyan-700 mt-0.5">
                    {item.phonetics}
                  </p>
                </div>

                <div className="p-3 bg-zinc-50 border border-black font-mono text-[11px] text-zinc-800">
                  <span className="font-black text-black block uppercase mb-0.5">
                    [IDIOM]:
                  </span>
                  <p className="italic">"{item.idiom}"</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t-2 border-zinc-200 font-mono text-[11px] font-bold text-emerald-700 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{item.rpgAttribute}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Emergency Quest Memorandum (Light Mode) */}
        {currentQuest && (
          <div className="border-2 border-black bg-white p-6 sm:p-8 shadow-[4px_4px_0px_#000000] space-y-5">
            {/* Memorandum Header Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-zinc-200 pb-4">
              <div className="flex items-center gap-3.5">
                <span className="text-4xl p-2 bg-zinc-50 border-2 border-black shadow-[2px_2px_0px_#000000]">
                  {currentQuest.npcAvatar}
                </span>
                <div>
                  <div className="font-mono text-xs font-black uppercase text-black">
                    [DARURAT: MISI PERCAKAPAN NPC]
                  </div>
                  <h3 className="font-black text-2xl text-black uppercase tracking-tight">
                    {currentQuest.title}
                  </h3>
                  <p className="font-mono text-xs text-cyan-800 font-bold">
                    NPC: {currentQuest.npcName} ({currentQuest.npcRole})
                  </p>
                </div>
              </div>

              <div className="font-mono text-xs font-black bg-[#facc15] text-black px-4 py-2 border-2 border-black shadow-[2px_2px_0px_#000000]">
                ⏱️ BATAS WAKTU: {currentQuest.timeLimitSeconds} DETIK
              </div>
            </div>

            <div className="font-mono text-xs sm:text-sm text-zinc-800 leading-relaxed bg-zinc-50 p-4 border border-black">
              <span className="font-black text-black block mb-1 uppercase">
                [SKENARIO SITUASI]:
              </span>
              {currentQuest.scenarioBrief}
            </div>

            <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
              <span className="font-black text-black uppercase">
                KOSAKATA WAJIB DIUCAPKAN:
              </span>
              {currentQuest.targetVocab.map((word, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-[#facc15] text-black font-black uppercase border border-black shadow-[2px_2px_0px_#000000]"
                >
                  {word}
                </span>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={startRoleplaySession}
                className="brutal-btn-yellow px-8 py-3.5 text-sm sm:text-base font-mono flex items-center gap-2"
              >
                <span>MASUK KE ARENA & BICARA KE NPC</span>
                <ArrowRight className="w-5 h-5 stroke-[3]" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // RENDER: STEP 4 - LIVE COACHING HUD (LIGHT THEME ARCADE HUD)
  // ============================================================================
  if (step === "hud" && currentQuest) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 font-mono">
        {/* Top Bar: NPC Identity & Arcade Rapport Meter */}
        <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_#000000] flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-1.5 bg-zinc-50 border-2 border-black">{currentQuest.npcAvatar}</span>
            <div>
              <div className="font-mono text-[10px] font-black uppercase text-zinc-600">
                [TARGET NPC]
              </div>
              <h3 className="font-black text-sm text-black uppercase">{currentQuest.npcName}</h3>
              <p className="font-mono text-xs text-zinc-600">{currentQuest.npcRole}</p>
            </div>
          </div>

          {/* Arcade Rapport Health Bar */}
          <div className="flex-1 max-w-xs space-y-1">
            <div className="flex items-center justify-between font-mono text-xs font-black">
              <span className="text-zinc-600 uppercase">[RAPPORT METER]:</span>
              <span className={rapport >= 80 ? "text-emerald-700 font-black" : "text-amber-700 font-black"}>
                {rapport}% {rapport >= 80 ? "[PASS!]" : "[TARGET: 80%]"}
              </span>
            </div>
            <div className="w-full h-4 bg-zinc-100 border-2 border-black p-0.5">
              <div
                className={`h-full transition-all duration-300 ${
                  rapport >= 80 ? "bg-emerald-500" : "bg-[#facc15]"
                }`}
                style={{ width: `${rapport}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => finishQuestSession()}
            className="brutal-btn-white px-3.5 py-2 text-xs font-mono"
          >
            [ SELESAIKAN & AUTOPSI ]
          </button>
        </div>

        {/* Live Conversation Stream (Clean Light Stream) */}
        <div className="border-2 border-black bg-zinc-50 p-5 min-h-[340px] max-h-[420px] overflow-y-auto space-y-4 shadow-[4px_4px_0px_#000000] relative">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "student" ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[11px] font-black uppercase text-zinc-600">
                  {msg.sender === "student" ? "[KAMU // SISWA]" : `[${currentQuest.npcName.toUpperCase()}]`}
                </span>
                {msg.sender === "npc" && (
                  <button
                    onClick={() => speakText(msg.text)}
                    className="p-1 bg-white border border-black text-black hover:bg-[#facc15]"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div
                className={`p-4 max-w-xl text-sm leading-relaxed border-2 border-black font-mono ${
                  msg.sender === "student"
                    ? "bg-[#22d3ee] text-black shadow-[3px_3px_0px_#000000]"
                    : "bg-[#facc15] text-black shadow-[3px_3px_0px_#000000]"
                }`}
              >
                <p className="font-bold">{msg.text}</p>

                {msg.upgrade && (
                  <div className="mt-2.5 pt-2 border-t-2 border-black text-xs">
                    <span className="font-black uppercase block text-[10px]">
                      ★ NATIVE-LIKE UPGRADE:
                    </span>
                    <p className="italic font-bold">"{msg.upgrade}"</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isAiThinking && (
            <div className="font-mono text-xs text-black flex items-center gap-2 bg-amber-50 p-2.5 border border-black">
              <span className="w-2 h-2 bg-amber-500 rounded-full animate-ping" />
              <span>[NPC SEDANG MENDENGARKAN DAN MERESPONS...]</span>
            </div>
          )}

          {/* Floating Brutalist "Bisikan AI" Warning Card */}
          {activeHint && (
            <div className="sticky bottom-2 left-0 right-0 p-3.5 bg-[#facc15] text-black border-2 border-black shadow-[4px_4px_0px_#000000] flex items-center justify-between gap-3 animate-slideUp">
              <div className="flex items-center gap-2 font-mono text-xs">
                <ShieldAlert className="w-5 h-5 flex-shrink-0 stroke-[2.5]" />
                <div>
                  <span className="font-black uppercase block">
                    [ ! BISIKAN AI: PETUNJUK KATA DARURAT ! ]
                  </span>
                  <span className="font-bold">{activeHint}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveHint(null)}
                className="px-2 py-1 bg-black text-white font-mono text-[10px] font-black uppercase"
              >
                [TUTUP]
              </button>
            </div>
          )}
        </div>

        {/* Scanned Items Tray: Glows when Spoken in Brutal Style */}
        <div className="p-3 bg-white border-2 border-black flex flex-wrap items-center gap-2 font-mono text-xs">
          <span className="font-black text-black mr-2 uppercase">
            [BENDA DIUCAPKAN]:
          </span>
          {inventoryItems.map((item) => (
            <span
              key={item.id}
              className={`px-3 py-1 font-black uppercase border-2 transition-all ${
                item.usedInSpeech
                  ? "brutal-glow-active bg-[#facc15] text-black border-black"
                  : "bg-zinc-100 text-zinc-600 border-zinc-400"
              }`}
            >
              {item.usedInSpeech && "✓ "}
              {item.englishWord}
            </span>
          ))}
        </div>

        {/* Live Speech Microphone Input Controller */}
        <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_#000000] flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={toggleListening}
            className={`w-14 h-14 flex items-center justify-center flex-shrink-0 transition-all font-mono font-black ${
              isListening
                ? "brutal-btn-red animate-pulse"
                : "brutal-btn-yellow"
            }`}
            title={isListening ? "Klik untuk Berhenti Bicara" : "Klik & Bicara dalam Bahasa Inggris"}
          >
            <Mic className="w-6 h-6 stroke-[2.5]" />
          </button>

          <div className="flex-1 w-full space-y-1">
            <input
              type="text"
              value={spokenTranscript || textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={isListening ? "Mendengarkan suaramu... bicara dalam Bahasa Inggris..." : "Bicara lewat mikrofon, atau ketik kalimat di sini..."}
              onKeyDown={(e) => e.key === "Enter" && handleSendSpokenLine()}
              className="w-full px-4 py-3 bg-zinc-50 border-2 border-black text-sm font-mono text-black placeholder-zinc-500 focus:outline-none focus:bg-white"
            />
            {isListening && (
              <span className="font-mono text-[10px] text-red-600 font-black uppercase block animate-pulse">
                🔴 SUARA SEDANG DIREKAM REAL-TIME VIA WEB SPEECH API (ENGLISH)...
              </span>
            )}
          </div>

          <button
            onClick={() => handleSendSpokenLine()}
            disabled={(!spokenTranscript && !textInput) || isAiThinking}
            className="brutal-btn-yellow px-5 py-3 text-xs font-mono flex items-center gap-1.5 flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>KIRIM JAWABAN</span>
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: STEP 5 - POST-GAME CEFR RAPOR (LIGHT DIAGNOSTIC AUTOPSY)
  // ============================================================================
  if (step === "autopsy") {
    return (
      <div className="max-w-4xl mx-auto space-y-6 font-mono">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs font-black uppercase bg-[#facc15] text-black px-3.5 py-1 border-2 border-black shadow-[2px_2px_0px_#000000]">
            [POST-GAME CEFR REPLAY & AUTOPSY]
          </span>
          <button
            onClick={resetAll}
            className="brutal-btn-white px-3.5 py-1.5 text-xs font-mono flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>MAIN MISI BARU</span>
          </button>
        </div>

        {isEvaluating ? (
          <div className="border-2 border-black bg-white p-12 text-center shadow-[4px_4px_0px_#000000] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-black border-t-[#facc15] animate-spin" />
            <h3 className="font-mono text-base font-black text-black uppercase">
              [MENGANALISIS TRANSKRIP SESI BERBICARA DENGAN STANDAR CEFR...]
            </h3>
            <p className="font-mono text-xs text-zinc-600 max-w-sm">
              Menilai kelancaran, tata bahasa, dan membandingkan kalimatmu dengan versi Native-like Upgrade...
            </p>
          </div>
        ) : evaluation ? (
          <div className="space-y-6">
            {/* Top Diagnostic Banner */}
            <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] flex flex-wrap items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="font-mono text-xs font-black text-amber-800 uppercase tracking-wider block">
                  [HASIL DIAGNOSTIK KELANCARAN BERBICARA]
                </span>
                <h3 className="text-2xl font-black text-black uppercase">{evaluation.questTitle}</h3>
                <p className="font-mono text-xs text-zinc-700 max-w-xl">{evaluation.transcriptSummary}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center p-3 px-5 bg-zinc-50 border-2 border-black shadow-[3px_3px_0px_#000000]">
                  <span className="font-mono text-[10px] font-black text-zinc-600 uppercase block">LEVEL CEFR</span>
                  <span className="font-mono text-3xl font-black text-emerald-700">{evaluation.cefrLevel}</span>
                </div>

                <div className="text-center p-3 px-5 bg-[#facc15] text-black border-2 border-black shadow-[3px_3px_0px_#000000]">
                  <span className="font-mono text-[10px] font-black uppercase block">SKOR TOTAL</span>
                  <span className="font-mono text-3xl font-black">{evaluation.overallScore}</span>
                </div>
              </div>
            </div>

            {/* 4-Pillar Score Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0px_#000000]">
                <span className="font-mono text-xs font-bold text-zinc-600 block mb-1 uppercase">Fluency</span>
                <span className="font-mono text-2xl font-black text-amber-600">{evaluation.fluencyScore}%</span>
              </div>
              <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0px_#000000]">
                <span className="font-mono text-xs font-bold text-zinc-600 block mb-1 uppercase">Pronunciation</span>
                <span className="font-mono text-2xl font-black text-cyan-700">{evaluation.pronunciationScore}%</span>
              </div>
              <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0px_#000000]">
                <span className="font-mono text-xs font-bold text-zinc-600 block mb-1 uppercase">Vocabulary</span>
                <span className="font-mono text-2xl font-black text-emerald-700">{evaluation.vocabularyScore}%</span>
              </div>
              <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0px_#000000]">
                <span className="font-mono text-xs font-bold text-zinc-600 block mb-1 uppercase">Grammar</span>
                <span className="font-mono text-2xl font-black text-rose-600">{evaluation.grammarScore}%</span>
              </div>
            </div>

            {/* Native-like Upgrade Comparison Table */}
            {evaluation.nativeUpgrades.length > 0 && (
              <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-4">
                <h4 className="font-mono text-sm font-black text-black uppercase flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  [NATIVE-LIKE UPGRADE: CARA MENGUCAPKAN DENGAN LEBIH ALAMI]
                </h4>

                <div className="space-y-3 font-mono text-xs">
                  {evaluation.nativeUpgrades.map((item, idx) => (
                    <div key={idx} className="p-4 bg-zinc-50 border-2 border-black space-y-2">
                      <div>
                        <span className="text-zinc-600 font-bold block text-[11px] uppercase">
                          Yang Kamu Ucapkan:
                        </span>
                        <p className="text-zinc-800 italic">"{item.original}"</p>
                      </div>
                      <div>
                        <span className="text-emerald-700 font-black block text-[11px] uppercase">
                          Versi Lebih Natural (Native):
                        </span>
                        <p className="text-black font-bold">"{item.upgraded}"</p>
                      </div>
                      <p className="text-[11px] text-zinc-600 pt-1 border-t border-zinc-200">{item.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_#000000] space-y-2 font-mono">
                <h5 className="font-black text-xs text-emerald-800 uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> [KELEBIHAN KAMU]:
                </h5>
                <ul className="text-xs text-zinc-700 space-y-1.5 list-disc list-inside">
                  {evaluation.strengths.map((str, idx) => (
                    <li key={idx}>{str}</li>
                  ))}
                </ul>
              </div>

              <div className="p-5 bg-white border-2 border-black shadow-[4px_4px_0px_#000000] space-y-2 font-mono">
                <h5 className="font-black text-xs text-amber-800 uppercase flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> [AREA PERLU DITINGKATKAN]:
                </h5>
                <ul className="text-xs text-zinc-700 space-y-1.5 list-disc list-inside">
                  {evaluation.areasToImprove.map((area, idx) => (
                    <li key={idx}>{area}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  return null;
}
