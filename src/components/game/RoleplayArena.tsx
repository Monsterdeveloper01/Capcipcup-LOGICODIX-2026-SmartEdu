"use client";

import { useState, useRef, useEffect } from "react";
import { Mic, Send, Volume2, ShieldAlert, Sparkles, CheckSquare, Square, Zap, ArrowRight } from "lucide-react";
import { analyzeSpeechMetricsWithPython, PythonSpeechMetrics, YoloDetection } from "@/lib/python-api";
import BrutalAlertModal, { ModalConfig } from "@/components/linguaquest/common/BrutalAlertModal";

interface RoleplayArenaProps {
  quest: any;
  scannedObject: YoloDetection | null;
  onFinishArena: (chatHistory: any[], pythonMetrics: PythonSpeechMetrics) => void;
}

export default function RoleplayArena({
  quest,
  scannedObject,
  onFinishArena,
}: RoleplayArenaProps) {
  const [messages, setMessages] = useState<any[]>([]);
  const [textInput, setTextInput] = useState("");
  const [spokenTranscript, setSpokenTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const [completedObjectives, setCompletedObjectives] = useState<number[]>([]);
  const [turnStartTime, setTurnStartTime] = useState<number>(Date.now());

  // Custom Brutal Alert Modal
  const [alertModal, setAlertModal] = useState<ModalConfig>({
    isOpen: false,
    title: "",
    message: "",
    type: "warning",
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
  const [lastMetrics, setLastMetrics] = useState<PythonSpeechMetrics>({
    word_count: 0,
    wpm: 90,
    filler_count: 0,
    matched_vocabularies: [],
    vocab_hit_rate: 0,
    fluency_score: 85,
  });

  const recognitionRef = useRef<any>(null);

  // Initialize NPC initial message
  useEffect(() => {
    const greeting = `Hello! I see you have the ${scannedObject?.vocab_card?.name_target || "object"} ready. Please tell me, how will this benefit our community and what makes it durable?`;
    setMessages([
      {
        id: "npc_init",
        sender: "npc",
        text: greeting,
      },
    ]);
    speakNpc(greeting);
    setTurnStartTime(Date.now());
  }, []);

  // Web Speech API
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const r = new SpeechRecognition();
        r.continuous = false;
        r.interimResults = true;
        r.lang = "en-US";

        r.onresult = (ev: any) => {
          let str = "";
          for (let i = ev.resultIndex; i < ev.results.length; i++) {
            str += ev.results[i][0].transcript;
          }
          setSpokenTranscript(str);
        };

        r.onerror = () => setIsListening(false);
        r.onend = () => setIsListening(false);
        recognitionRef.current = r;
      }
    }
  }, []);

  const speakNpc = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 0.95;
      window.speechSynthesis.speak(u);
    }
  };

  const toggleMic = () => {
    if (!recognitionRef.current) {
      showAlert("Mikrofon Tidak Didukung", "Browser Anda belum mendukung Web Speech API. Silakan ketik kalimat di kolom teks.", "info");
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
      } catch (e) {
        console.warn("Speech error:", e);
      }
    }
  };

  const handleSendTurn = async () => {
    const content = (spokenTranscript || textInput).trim();
    if (!content || isAiThinking) return;

    const durationSeconds = Math.max(Math.round((Date.now() - turnStartTime) / 1000), 3);

    // 1. Analyze Fast Telemetry in Python (0 Token)
    const metrics = await analyzeSpeechMetricsWithPython(
      content,
      durationSeconds,
      quest?.target_vocabularies || []
    );
    setLastMetrics(metrics);

    const userMsg = {
      id: `usr_${Date.now()}`,
      sender: "student",
      text: content,
      metrics,
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setTextInput("");
    setSpokenTranscript("");
    setIsAiThinking(true);
    setActiveHint(null);

    // 2. Call Gemini Roleplay Turn
    try {
      const res = await fetch("/api/roleplay-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quest,
          studentSpeech: content,
          messagesHistory: updatedMessages,
          pythonMetrics: metrics,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        const npcMsg = {
          id: `npc_${Date.now()}`,
          sender: "npc",
          text: data.npc_reply,
          grammarTip: data.grammar_tip_on_last_turn,
        };

        setMessages((prev) => [...prev, npcMsg]);
        speakNpc(data.npc_reply);

        if (data.live_hint_id) {
          setActiveHint(data.live_hint_id);
        }

        if (Array.isArray(data.completed_objective_indices)) {
          setCompletedObjectives((prev) =>
            Array.from(new Set([...prev, ...data.completed_objective_indices]))
          );
        }
      }
    } catch (err) {
      console.warn("Roleplay turn error:", err);
    } finally {
      setIsAiThinking(false);
      setTurnStartTime(Date.now());
    }
  };

  return (
    <div className="space-y-4 font-mono">
      {/* Top Telemetry & HUD */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-black border-2 border-[#22d3ee] shadow-[3px_3px_0px_#000000]">
          <span className="text-[10px] font-black text-zinc-400 block uppercase">[PYTHON WPM METER]</span>
          <span className="text-xl font-black text-[#22d3ee]">{lastMetrics.wpm} WPM</span>
        </div>

        <div className="p-3 bg-black border-2 border-[#4ade80] shadow-[3px_3px_0px_#000000]">
          <span className="text-[10px] font-black text-zinc-400 block uppercase">[FLUENCY SCORE]</span>
          <span className="text-xl font-black text-[#4ade80]">{lastMetrics.fluency_score}%</span>
        </div>

        <div className="p-3 bg-black border-2 border-[#facc15] shadow-[3px_3px_0px_#000000]">
          <span className="text-[10px] font-black text-zinc-400 block uppercase">[TARGET VOCAB HIT]</span>
          <span className="text-xl font-black text-[#facc15]">{lastMetrics.vocab_hit_rate}%</span>
        </div>

        <div className="p-3 bg-black border-2 border-white shadow-[3px_3px_0px_#000000] flex items-center justify-center">
          <button
            onClick={() => onFinishArena(messages, lastMetrics)}
            className="w-full brutal-btn-yellow py-2 text-[11px] font-black uppercase"
          >
            [ SELESAI & RAPOR ]
          </button>
        </div>
      </div>

      {/* Main Dialogue Log */}
      <div className="border-3 border-black dark:border-white bg-[#0a0b0e] p-5 min-h-[340px] max-h-[420px] overflow-y-auto space-y-4 shadow-[6px_6px_0px_#000000]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === "student" ? "items-end" : "items-start"}`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-[11px] font-black uppercase text-zinc-400">
                {m.sender === "student" ? "[KAMU // SISWA]" : `[${quest?.npc_name || "NPC"}]`}
              </span>
              {m.sender === "npc" && (
                <button
                  onClick={() => speakNpc(m.text)}
                  className="p-1 bg-black border border-zinc-700 text-zinc-400 hover:text-[#facc15]"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div
              className={`p-4 max-w-xl text-xs sm:text-sm font-mono border-2 border-black leading-relaxed ${
                m.sender === "student"
                  ? "bg-[#22d3ee] text-black shadow-[4px_4px_0px_#000000]"
                  : "bg-[#facc15] text-black shadow-[4px_4px_0px_#000000]"
              }`}
            >
              <p className="font-bold">{m.text}</p>

              {m.grammarTip && (
                <div className="mt-2 pt-2 border-t-2 border-black text-xs">
                  <span className="font-black uppercase block text-[10px]">★ TIPS TATA BAHASA:</span>
                  <p className="italic font-bold">{m.grammarTip}</p>
                </div>
              )}
            </div>
          </div>
        ))}

        {isAiThinking && (
          <div className="font-mono text-xs text-[#facc15] flex items-center gap-2 bg-black p-2 border border-zinc-800">
            <span className="w-2 h-2 bg-[#facc15] animate-ping" />
            <span>[NPC SEDANG MEMPROSES DIALOG DENGAN GEMINI AI...]</span>
          </div>
        )}

        {/* Floating Bisikan AI */}
        {activeHint && (
          <div className="sticky bottom-2 p-3 bg-[#facc15] text-black border-2 border-black shadow-[4px_4px_0px_#000000] flex items-center justify-between gap-3 animate-slideUp">
            <div className="flex items-center gap-2 text-xs">
              <ShieldAlert className="w-4 h-4 flex-shrink-0 stroke-[3]" />
              <div>
                <span className="font-black uppercase block text-[10px]">[BISIKAN AI // PANDUAN KALIMAT]:</span>
                <span className="font-bold">{activeHint}</span>
              </div>
            </div>
            <button
              onClick={() => setActiveHint(null)}
              className="px-2 py-0.5 bg-black text-white text-[10px] font-black"
            >
              [TUTUP]
            </button>
          </div>
        )}
      </div>

      {/* Objectives Checklist & Target Vocabs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="p-3 bg-black border-2 border-zinc-700 space-y-1.5">
          <span className="font-black text-[#facc15] uppercase block">[MISSION OBJECTIVES]:</span>
          {(quest?.mission_objectives || []).map((obj: string, i: number) => {
            const isDone = completedObjectives.includes(i);
            return (
              <div key={i} className="flex items-center gap-2 text-zinc-300">
                {isDone ? (
                  <CheckSquare className="w-4 h-4 text-[#4ade80] flex-shrink-0" />
                ) : (
                  <Square className="w-4 h-4 text-zinc-600 flex-shrink-0" />
                )}
                <span className={isDone ? "line-through text-zinc-500 font-bold" : ""}>
                  {obj}
                </span>
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-black border-2 border-zinc-700 space-y-1.5">
          <span className="font-black text-[#22d3ee] uppercase block">[TARGET VOCABULARIES]:</span>
          <div className="flex flex-wrap gap-1.5">
            {(quest?.target_vocabularies || []).map((v: string, i: number) => {
              const matched = lastMetrics.matched_vocabularies?.includes(v.toLowerCase());
              return (
                <span
                  key={i}
                  className={`px-2 py-0.5 border font-bold uppercase text-[10px] ${
                    matched
                      ? "bg-[#4ade80] text-black border-black font-black"
                      : "bg-zinc-900 text-zinc-400 border-zinc-700"
                  }`}
                >
                  {matched && "✓ "}
                  {v}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* Microphone & Send Bar */}
      <div className="border-3 border-black dark:border-white bg-[#111317] p-4 shadow-[5px_5px_0px_#000000] flex flex-col sm:flex-row items-center gap-3">
        <button
          onClick={toggleMic}
          className={`w-14 h-14 flex items-center justify-center flex-shrink-0 font-black ${
            isListening ? "brutal-btn-red animate-pulse" : "brutal-btn-yellow"
          }`}
          title={isListening ? "Berhenti Bicara" : "Bicara Bahasa Inggris ke NPC"}
        >
          <Mic className="w-6 h-6 stroke-[2.5]" />
        </button>

        <div className="flex-1 w-full space-y-1">
          <input
            type="text"
            value={spokenTranscript || textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={isListening ? "Mendengarkan suaramu... bicara dalam bahasa Inggris..." : "Bicara lewat mikrofon atau ketik kalimat di sini..."}
            onKeyDown={(e) => e.key === "Enter" && handleSendTurn()}
            className="w-full px-4 py-3 bg-black border-2 border-white text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#facc15]"
          />
          {isListening && (
            <span className="text-[10px] text-[#ef4444] font-black uppercase block animate-pulse">
              🔴 SUARA SEDANG DIREKAM REAL-TIME (ENGLISH)...
            </span>
          )}
        </div>

        <button
          onClick={handleSendTurn}
          disabled={(!spokenTranscript && !textInput) || isAiThinking}
          className="brutal-btn-yellow px-6 py-3 text-xs sm:text-sm font-black flex items-center gap-1.5 flex-shrink-0"
        >
          <Send className="w-4 h-4 stroke-[2.5]" />
          <span>KIRIM DIALOG</span>
        </button>
      </div>

      <BrutalAlertModal {...alertModal} />
    </div>
  );
}

