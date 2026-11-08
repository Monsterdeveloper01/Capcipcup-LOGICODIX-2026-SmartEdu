"use client";

import { useState, useRef, useEffect } from "react";
import { GameMode, QuestScenario, ScannedItem, RoleplayTurnMessage, SpeakingEvaluation } from "@/lib/linguaquest/types";
import confetti from "canvas-confetti";
import {
  Camera,
  Upload,
  Sparkles,
  Volume2,
  Mic,
  MicOff,
  Send,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  Trophy,
  ArrowRight,
  Flame,
  Award,
  BookOpen,
  Coffee,
  Glasses,
  Droplet,
  Package,
  Layers,
  Lightbulb,
  Zap,
} from "lucide-react";

const GAME_MODES = [
  {
    id: "survival" as GameMode,
    title: "Survival & Adventure RPG",
    target: "Siswa SD – SMA",
    description: "Gunakan benda di sekitarmu sebagai alat bertahan hidup untuk meyakinkan penjaga gerbang pulau kuno.",
    badge: "Anti-Speaking Anxiety",
    color: "from-amber-600 to-orange-700",
    border: "border-amber-500/40",
    icon: "🏕️",
  },
  {
    id: "smk_career" as GameMode,
    title: "SMK & Career Simulator",
    target: "SMK Pariwisata, Perhotelan & Bisnis",
    description: "Hadapi tamu VIP asing yang komplain di hotel bintang 5. Gunakan bahasa Inggris diplomatis profesional.",
    badge: "Vocational Ready",
    color: "from-indigo-600 to-blue-700",
    border: "border-indigo-500/40",
    icon: "🏨",
  },
  {
    id: "local_pride" as GameMode,
    title: "Local Pride Ambassador",
    target: "Budaya & Identitas Nasional",
    description: "Jelaskan keistimewaan warisan budaya (Batik, Tempe, Anyaman) ke travel blogger internasional.",
    badge: "Cultural Diplomacy",
    color: "from-emerald-600 to-teal-700",
    border: "border-emerald-500/40",
    icon: "🎨",
  },
  {
    id: "boss_raid" as GameMode,
    title: "Classroom Boss Raid",
    target: "Kolaboratif Satu Kelas",
    description: "Gabungkan benda nyata beberapa siswa untuk berdebat melawan Titan Polusi Lingkungan.",
    badge: "Co-op Debate",
    color: "from-rose-600 to-red-800",
    border: "border-rose-500/40",
    icon: "⚔️",
  },
];

export default function StudentGameView({
  onXpEarned,
}: {
  onXpEarned?: (xp: number) => void;
}) {
  const [selectedMode, setSelectedMode] = useState<GameMode>("survival");
  const [step, setStep] = useState<"select_mode" | "scanning" | "inventory" | "briefing" | "hud" | "autopsy">("select_mode");

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
  const [latestUpgrade, setLatestUpgrade] = useState<string | null>(null);
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
          console.warn("Gagal membuka kamera:", err);
          setIsCameraActive(false);
          setScanError("Kamera tidak dapat diakses atau izin ditolak. Anda juga dapat mengunggah foto file di bawah.");
        });
    }

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [step, isCameraActive]);

  // ============================================================================
  // WEB SPEECH API (SPEECH-TO-TEXT & TEXT-TO-SPEECH)
  // ============================================================================
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-US"; // Bahasa Inggris

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
      alert("Browser Anda belum mendukung Web Speech API. Silakan gunakan Chrome atau ketik teks langsung.");
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

      // Auto TTS ucapan selamat datang dari NPC
      if (data.quest?.initialNpcGreeting) {
        setTimeout(() => speakText(data.quest.initialNpcGreeting), 1000);
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
      if (npcMsg.upgrade) setLatestUpgrade(npcMsg.upgrade);

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
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
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
    setLatestUpgrade(null);
  };

  // ============================================================================
  // RENDER: STEP 1 - SELECT GAME MODE
  // ============================================================================
  if (step === "select_mode") {
    return (
      <div className="space-y-8 animate-fadeIn">
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 bg-indigo-950/80 px-3 py-1 rounded-full border border-indigo-800">
            Pilih Jalur Permainan RPG
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Scan Lingkungan Nyata, Buka Cerita Bahasa Inggrismu
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Tidak ada materi teks kaku. Benda apa saja di sekitarmu (kamar, kantin, tas sekolah, atau meja juri) akan diubah menjadi kartu inventori ajaib untuk menyelesaikan misi percakapan spontan!
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl mx-auto">
          {GAME_MODES.map((mode) => (
            <div
              key={mode.id}
              onClick={() => {
                setSelectedMode(mode.id);
                setStep("scanning");
                setIsCameraActive(true);
              }}
              className={`group cursor-pointer rounded-3xl p-6 bg-zinc-900/80 hover:bg-zinc-850 border ${
                selectedMode === mode.id ? "border-indigo-500 shadow-xl shadow-indigo-500/10" : "border-zinc-800"
              } transition-all duration-200 relative overflow-hidden`}
            >
              <div className="flex items-start justify-between gap-4 mb-4">
                <span className="text-4xl p-2.5 rounded-2xl bg-zinc-800/80 border border-zinc-700/50 group-hover:scale-110 transition-transform">
                  {mode.icon}
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full bg-zinc-850 border border-zinc-700 text-zinc-300">
                  {mode.badge}
                </span>
              </div>
              <h3 className="font-extrabold text-lg text-white mb-1 group-hover:text-indigo-300 transition-colors">
                {mode.title}
              </h3>
              <p className="text-xs font-semibold text-indigo-400 mb-2">{mode.target}</p>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">{mode.description}</p>
              <div className="flex items-center gap-2 text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
                <span>Pilih Mode & Mulai Scan Kamera</span>
                <ArrowRight className="w-3.5 h-3.5 text-indigo-400" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: STEP 2 - SCANNING REAL OBJECTS WITH CAMERA
  // ============================================================================
  if (step === "scanning") {
    return (
      <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep("select_mode")}
            className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1.5"
          >
            ← Ganti Mode Permainan
          </button>
          <span className="text-xs font-bold text-indigo-400 bg-indigo-950/60 px-3 py-1 rounded-full border border-indigo-800/60">
            Langkah 1: Object-to-Inventory (AI Vision)
          </span>
        </div>

        <div className="rounded-3xl bg-zinc-950 border border-zinc-800 overflow-hidden shadow-2xl relative">
          <div className="p-4 bg-zinc-900/60 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold text-white">Arahkan Kamera ke 2-3 Benda Nyata di Sekitarmu</span>
            </div>
            <span className="text-[11px] text-zinc-400">Contoh: Botol, Kacamata, Sepatu, Kopi, Buku</span>
          </div>

          {/* Camera Viewport / Preview */}
          <div className="relative h-[380px] sm:h-[460px] bg-black flex items-center justify-center overflow-hidden">
            {capturedImage ? (
              <img src={capturedImage} alt="Captured" className="w-full h-full object-cover" />
            ) : isCameraActive ? (
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-3 text-zinc-500 p-6 text-center">
                <Camera className="w-12 h-12 stroke-[1.5]" />
                <p className="text-xs max-w-sm">
                  Kamera belum aktif. Klik tombol di bawah untuk menyalakan kamera atau unggah foto benda dari komputermu.
                </p>
                <button
                  onClick={() => setIsCameraActive(true)}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md"
                >
                  Buka Akses Kamera Web
                </button>
              </div>
            )}

            {/* Overlaid Target Reticle */}
            {isCameraActive && !capturedImage && (
              <div className="absolute inset-8 border-2 border-dashed border-indigo-400/40 rounded-3xl pointer-events-none flex items-center justify-center">
                <div className="text-[11px] font-semibold text-white/80 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                  Letakkan benda di area ini lalu jepret
                </div>
              </div>
            )}

            {/* Loading AI Vision Scan Overlay */}
            {isAnalyzing && (
              <div className="absolute inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center gap-3 z-30">
                <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm font-bold text-white">Mendeteksi Benda dengan Gemini 2.5 Flash Vision...</span>
                <p className="text-xs text-zinc-400 max-w-xs text-center">
                  Menerjemahkan ke kosakata bahasa Inggris, IPA phonetics, idiom, dan menyintesis misi RPG darurat...
                </p>
              </div>
            )}
          </div>

          {/* Error Message if any */}
          {scanError && (
            <div className="p-4 bg-rose-950/60 border-t border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{scanError}</span>
            </div>
          )}

          {/* Bottom Controls */}
          <div className="p-4 bg-zinc-900/80 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="cursor-pointer px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-2 transition-all">
                <Upload className="w-3.5 h-3.5" />
                <span>Unggah Foto dari File</span>
                <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
              </label>

              {capturedImage && (
                <button
                  onClick={() => {
                    setCapturedImage(null);
                    setIsCameraActive(true);
                  }}
                  className="px-3 py-2 rounded-xl bg-zinc-800 text-zinc-300 text-xs font-semibold hover:text-white transition-all"
                >
                  Foto Ulang
                </button>
              )}
            </div>

            {isCameraActive && !capturedImage && (
              <button
                onClick={handleSnapFromVideo}
                disabled={isAnalyzing}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition-all active:scale-95"
              >
                <Camera className="w-4 h-4" />
                <span>📸 Jepret & Analisis Objek AI</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: STEP 3 - INVENTORY CARDS & QUEST BRIEFING
  // ============================================================================
  if (step === "inventory") {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep("scanning")}
            className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1.5"
          >
            ← Scan Foto Lain
          </button>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-800/60 flex items-center gap-1.5">
            <Sparkles className="w-3 h-3" /> Objek Berhasil Dideteksi & Dikonversi ke Item RPG
          </span>
        </div>

        {/* Scanned Items Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {inventoryItems.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl p-5 bg-zinc-900/90 border border-zinc-800 hover:border-indigo-500/50 transition-all flex flex-col justify-between shadow-xl"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                    {item.objectName}
                  </span>
                  <button
                    onClick={() => speakText(item.englishWord)}
                    title="Dengarkan Pengucapan Bahasa Inggris (IPA)"
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-indigo-600 text-zinc-300 hover:text-white transition-all"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <h4 className="font-extrabold text-base text-white">{item.englishWord}</h4>
                  <p className="text-xs font-mono text-indigo-400">{item.phonetics}</p>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-[11px] text-zinc-300">
                  <span className="font-semibold text-amber-400 block mb-0.5">Idiom Terkait:</span>
                  <p className="italic">{item.idiom}</p>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-800/80 text-[11px] text-emerald-400 font-semibold flex items-center gap-1.5">
                <Zap className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{item.rpgAttribute}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Dynamic Quest Briefing Card */}
        {currentQuest && (
          <div className="rounded-3xl p-6 bg-gradient-to-br from-indigo-950/80 via-zinc-900 to-zinc-950 border border-indigo-700/50 shadow-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2 rounded-2xl bg-indigo-900/60 border border-indigo-600/40">
                  {currentQuest.npcAvatar}
                </span>
                <div>
                  <h3 className="font-extrabold text-lg text-white">{currentQuest.title}</h3>
                  <p className="text-xs text-indigo-300">
                    Bertemu dengan <strong>{currentQuest.npcName}</strong> ({currentQuest.npcRole})
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-amber-300 bg-amber-950/80 border border-amber-600/50 px-3 py-1 rounded-full">
                ⏱️ Waktu: {currentQuest.timeLimitSeconds} Detik
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed bg-black/40 p-3.5 rounded-2xl border border-white/5">
              {currentQuest.scenarioBrief}
            </p>

            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-zinc-400">Kosakata Wajib Diucapkan:</span>
              {currentQuest.targetVocab.map((word, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-0.5 rounded-full bg-indigo-900/60 border border-indigo-500/40 text-indigo-200 font-mono font-semibold"
                >
                  {word}
                </span>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={startRoleplaySession}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-extrabold text-sm flex items-center gap-2 shadow-xl shadow-emerald-600/25 transition-all active:scale-95"
              >
                <span>Mulai Percakapan Spontan (Start Speaking)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ============================================================================
  // RENDER: STEP 4 - LIVE COACHING HUD (THE GAME SCREEN)
  // ============================================================================
  if (step === "hud" && currentQuest) {
    return (
      <div className="max-w-4xl mx-auto space-y-4 animate-fadeIn">
        {/* Top Bar: Quest Title & Rapport / Health Meter */}
        <div className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{currentQuest.npcAvatar}</span>
            <div>
              <h3 className="font-extrabold text-sm text-white">{currentQuest.npcName}</h3>
              <p className="text-xs text-zinc-400">{currentQuest.npcRole}</p>
            </div>
          </div>

          {/* Grammar & Confidence Meter (Rapport Bar) */}
          <div className="flex-1 max-w-xs space-y-1">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-zinc-400">Kepercayaan NPC:</span>
              <span className={rapport >= 80 ? "text-emerald-400" : "text-amber-400"}>
                {rapport}% {rapport >= 80 ? "(Misi Lulus!)" : ""}
              </span>
            </div>
            <div className="w-full h-3 rounded-full bg-zinc-800 overflow-hidden p-0.5 border border-zinc-700">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  rapport >= 80
                    ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                    : "bg-gradient-to-r from-amber-500 to-indigo-500"
                }`}
                style={{ width: `${rapport}%` }}
              />
            </div>
          </div>

          <button
            onClick={() => finishQuestSession()}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold transition-all"
          >
            Selesai & Evaluasi Rapor
          </button>
        </div>

        {/* Middle Area: Dialogue Stream & Floating Hint */}
        <div className="rounded-3xl bg-zinc-950/90 border border-zinc-800 p-6 min-h-[340px] max-h-[420px] overflow-y-auto space-y-4 shadow-2xl relative">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === "student" ? "items-end" : "items-start"}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold text-zinc-400">
                  {msg.sender === "student" ? "Kamu (Siswa)" : currentQuest.npcName}
                </span>
                {msg.sender === "npc" && (
                  <button
                    onClick={() => speakText(msg.text)}
                    className="p-1 rounded text-zinc-400 hover:text-indigo-400"
                  >
                    <Volume2 className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div
                className={`p-4 rounded-2xl max-w-xl text-sm leading-relaxed ${
                  msg.sender === "student"
                    ? "bg-indigo-600 text-white rounded-tr-none shadow-md"
                    : "bg-zinc-900 text-zinc-100 rounded-tl-none border border-zinc-800 shadow-md"
                }`}
              >
                <p>{msg.text}</p>

                {/* Native-like Upgrade preview if available */}
                {msg.upgrade && (
                  <div className="mt-2.5 pt-2 border-t border-indigo-400/30 text-xs text-amber-200">
                    <span className="font-bold flex items-center gap-1 text-[11px]">
                      <Sparkles className="w-3 h-3 text-amber-300" /> Native-like Upgrade:
                    </span>
                    <p className="italic font-medium">{msg.upgrade}</p>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isAiThinking && (
            <div className="flex items-center gap-2 text-xs text-indigo-400 p-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
              <span>{currentQuest.npcName} sedang mendengarkan dan merespons...</span>
            </div>
          )}

          {/* Bisikan AI Floating Card (Smart Hint System) */}
          {activeHint && (
            <div className="sticky bottom-2 left-0 right-0 p-3.5 rounded-2xl bg-amber-950/90 border border-amber-600/50 backdrop-blur-md text-amber-200 text-xs shadow-xl flex items-center justify-between gap-3 animate-slideUp">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <div>
                  <span className="font-bold block">Bisikan AI (Smart Hint):</span>
                  <span>{activeHint}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveHint(null)}
                className="text-[10px] font-bold text-amber-400 hover:text-white"
              >
                Tutup
              </button>
            </div>
          )}
        </div>

        {/* Scanned Inventory Tray: Items Glow when Spoken */}
        <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-bold text-zinc-400 mr-2 flex items-center gap-1">
            <Package className="w-3.5 h-3.5" /> Item Nyata:
          </span>
          {inventoryItems.map((item) => (
            <span
              key={item.id}
              className={`px-3 py-1 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                item.usedInSpeech
                  ? "bg-amber-500/20 text-amber-300 border border-amber-400 shadow-md shadow-amber-500/20"
                  : "bg-zinc-800/80 text-zinc-400 border border-zinc-700/60"
              }`}
            >
              {item.usedInSpeech && <CheckCircle2 className="w-3 h-3 text-amber-400" />}
              <span>{item.englishWord}</span>
            </span>
          ))}
        </div>

        {/* Voice Input Controller (Live Speech-to-Text Microphone) */}
        <div className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 shadow-2xl flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={toggleListening}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 shadow-lg ${
              isListening
                ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse shadow-rose-600/40"
                : "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
            }`}
            title={isListening ? "Klik untuk Berhenti Bicara" : "Klik & Bicara dalam Bahasa Inggris"}
          >
            {isListening ? <Mic className="w-6 h-6 animate-bounce" /> : <Mic className="w-6 h-6" />}
          </button>

          <div className="flex-1 w-full space-y-1">
            <input
              type="text"
              value={spokenTranscript || textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder={isListening ? "Mendengarkan suaramu... silakan bicara dalam Bahasa Inggris..." : "Bicara lewat mikrofon di kiri, atau ketik kalimat di sini..."}
              onKeyDown={(e) => e.key === "Enter" && handleSendSpokenLine()}
              className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
            />
            {isListening && (
              <span className="text-[10px] text-rose-400 font-semibold block animate-pulse">
                🔴 Suara sedang direkam secara real-time via Web Speech API (English)...
              </span>
            )}
          </div>

          <button
            onClick={() => handleSendSpokenLine()}
            disabled={(!spokenTranscript && !textInput) || isAiThinking}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-all flex-shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim Jawaban</span>
          </button>
        </div>
      </div>
    );
  }

  // ============================================================================
  // RENDER: STEP 5 - POST-GAME AUTOPSY & CEFR RAPOR
  // ============================================================================
  if (step === "autopsy") {
    return (
      <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
        <div className="flex items-center justify-between">
          <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-800">
            Post-Game Replay & Autopsy Cerdas
          </span>
          <button
            onClick={resetAll}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-all"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Main Misi Baru</span>
          </button>
        </div>

        {isEvaluating ? (
          <div className="rounded-3xl p-12 bg-zinc-950 border border-zinc-800 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <h3 className="font-extrabold text-base text-white">Menganalisis Transkrip Sesi Berbicara dengan CEFR Rubrik...</h3>
            <p className="text-xs text-zinc-400 max-w-sm">
              Menilai kelancaran (fluency), keakuratan tata bahasa, dan membandingkan kalimatmu dengan versi Native-like Upgrade...
            </p>
          </div>
        ) : evaluation ? (
          <div className="space-y-6">
            {/* Top Score Banner */}
            <div className="rounded-3xl p-6 bg-gradient-to-r from-indigo-950 via-zinc-900 to-zinc-950 border border-indigo-700/60 shadow-2xl flex flex-wrap items-center justify-between gap-6">
              <div className="space-y-1">
                <span className="text-xs font-bold text-indigo-400 uppercase tracking-wider">Hasil Evaluasi Kelancaran</span>
                <h3 className="text-2xl font-black text-white">{evaluation.questTitle}</h3>
                <p className="text-xs text-zinc-400 max-w-xl">{evaluation.transcriptSummary}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-center p-3 px-5 rounded-2xl bg-zinc-900 border border-zinc-800">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">Level CEFR</span>
                  <span className="text-2xl font-black text-emerald-400">{evaluation.cefrLevel}</span>
                </div>

                <div className="text-center p-3 px-5 rounded-2xl bg-indigo-900/60 border border-indigo-600/50">
                  <span className="text-[10px] font-bold text-indigo-300 uppercase block">Skor Total</span>
                  <span className="text-2xl font-black text-white">{evaluation.overallScore}</span>
                </div>
              </div>
            </div>

            {/* 4-Pillar Score Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-xs font-semibold text-zinc-400 block mb-1">Fluency (Kelancaran)</span>
                <span className="text-xl font-bold text-white">{evaluation.fluencyScore}%</span>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-xs font-semibold text-zinc-400 block mb-1">Pronunciation</span>
                <span className="text-xl font-bold text-white">{evaluation.pronunciationScore}%</span>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-xs font-semibold text-zinc-400 block mb-1">Vocabulary Usage</span>
                <span className="text-xl font-bold text-white">{evaluation.vocabularyScore}%</span>
              </div>
              <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
                <span className="text-xs font-semibold text-zinc-400 block mb-1">Grammar Accuracy</span>
                <span className="text-xl font-bold text-white">{evaluation.grammarScore}%</span>
              </div>
            </div>

            {/* Native-like Upgrade Comparison Table */}
            {evaluation.nativeUpgrades.length > 0 && (
              <div className="rounded-3xl p-6 bg-zinc-950 border border-zinc-800 space-y-4 shadow-xl">
                <h4 className="font-bold text-sm text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Native-like Upgrade: Cara Mengucapkan dengan Lebih Alami
                </h4>

                <div className="space-y-3">
                  {evaluation.nativeUpgrades.map((item, idx) => (
                    <div key={idx} className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-2 text-xs">
                      <div>
                        <span className="text-zinc-500 font-semibold block text-[11px]">Yang Kamu Ucapkan:</span>
                        <p className="text-zinc-300 italic">"{item.original}"</p>
                      </div>
                      <div>
                        <span className="text-emerald-400 font-bold block text-[11px]">Versi Lebih Natural (Native):</span>
                        <p className="text-white font-semibold">"{item.upgraded}"</p>
                      </div>
                      <p className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-800">{item.explanation}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths & Improvements */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-2">
                <h5 className="font-bold text-xs text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Kelebihan Kamu:
                </h5>
                <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
                  {evaluation.strengths.map((str, idx) => (
                    <li key={idx}>{str}</li>
                  ))}
                </ul>
              </div>

              <div className="p-5 rounded-3xl bg-zinc-950 border border-zinc-800 space-y-2">
                <h5 className="font-bold text-xs text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5" /> Area Perlu Ditingkatkan:
                </h5>
                <ul className="text-xs text-zinc-300 space-y-1.5 list-disc list-inside">
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

