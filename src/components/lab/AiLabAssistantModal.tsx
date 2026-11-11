"use client";

import { useState, useEffect, useRef } from "react";
import {
  Send,
  X,
  Bot,
  Eye,
  Lightbulb,
  RotateCcw,
  User,
  Zap,
} from "lucide-react";
import { ChemicalVessel, ReactionDetail } from "./ChemistryLabScene";
import { LabTask } from "@/lib/lab/types";
import { ChemicalFormula, FormattedAiMessage } from "./ChemicalFormula";

interface AiLabAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeChemicalNames?: string[];
  vessels?: ChemicalVessel[];
  activeReaction?: ReactionDetail | null;
  currentTask?: LabTask | null;
  labMode?: "task" | "sandbox";
  currentStep?: string;
  studentName?: string;
  userId?: string;
  roomCode?: string;
}

function getSituationalGreeting(
  vessels: ChemicalVessel[] = [],
  activeReaction: ReactionDetail | null = null,
  currentTask: LabTask | null = null,
  labMode: "task" | "sandbox" = "sandbox"
): string {
  if (activeReaction) {
    const tempNote =
      activeReaction.temperatureChange > 0
        ? `dengan kenaikan suhu +${activeReaction.temperatureChange}°C (Eksotermik / Melepas Kalor)`
        : activeReaction.temperatureChange < 0
        ? `dengan penurunan suhu ${activeReaction.temperatureChange}°C (Endotermik / Dingin)`
        : "dengan suhu stabil";
    return `Halo! Aku memantau meja labmu: kamu baru saja mereaksikan "${activeReaction.title}" hingga terbentuk "${activeReaction.resultName || "produk baru"}" (${activeReaction.resultFormula}) ${tempNote}. Ada konsep mekanisme reaksi, stoikiometri, atau aturan K3 yang ingin kamu tanyakan?`;
  }

  if (vessels.length >= 2) {
    const names = vessels.map((v) => `${v.name} (${v.formula})`).join(" dan ");
    return `Hai! Di meja praktikummu saat ini sudah ada: ${names}. Kamu bisa mendekatkan dan menuangkan salah satu wadah ke wadah lain untuk mereaksikannya. Mau tahu perkiraan reaksi atau panduan keamanan sebelum kamu mencampurnya?`;
  }

  if (vessels.length === 1) {
    return `Halo! Di mejamu saat ini tersedia ${vessels[0].name} (${vessels[0].formula}). Ingin tahu zat apa yang cocok untuk direaksikan dengannya, atau butuh penjelasan sifat kimia dan panduan K3 bahan ini?`;
  }

  if (labMode === "task" && currentTask) {
    return `Halo! Kamu sedang berada di tugas "${currentTask.title}". Silakan ikuti petunjuk praktikum atau tanyakan rekomendasi langkah eksperimen kepadaku jika ada yang belum kamu pahami!`;
  }

  return "Halo! Meja lab 3D kamu saat ini masih bersih dan kosong. Yuk pilih bahan kimia dari tombol Tambah Zat di bawah meja untuk mulai eksperimen, atau tanyakan rekomendasi praktikum seru kepadaku!";
}

function getSuggestionChips(
  vessels: ChemicalVessel[] = [],
  activeReaction: ReactionDetail | null = null
): string[] {
  if (activeReaction) {
    return [
      "Mengapa reaksi ini bisa terjadi?",
      activeReaction.temperatureChange !== 0
        ? "Kenapa suhunya bisa berubah?"
        : "Apa sifat kimia produk reaksi ini?",
      "Apa aspek keselamatan K3 untuk produk ini?",
      "Tuliskan persamaan reaksi seimbangnya",
    ];
  }
  if (vessels.length >= 2) {
    return [
      "Apa yang terjadi jika zat ini dicampur?",
      "Bagaimana cara penuangan yang aman?",
      "Apakah reaksi ini menghasilkan gas atau endapan?",
    ];
  }
  if (vessels.length === 1) {
    return [
      "Apa karakteristik & kegunaan bahan ini?",
      "Bahan apa yang cocok direaksikan dengannya?",
      "Apa aturan keselamatan kerja bahan ini?",
    ];
  }
  return [
    "Rekomendasikan eksperimen kimia yang seru!",
    "Bagaimana cara memulai praktikum di Meja 3D?",
    "Apa saja aturan keselamatan dasar lab?",
  ];
}

export default function AiLabAssistantModal({
  isOpen,
  onClose,
  activeChemicalNames = [],
  vessels = [],
  activeReaction = null,
  currentTask = null,
  labMode = "sandbox",
  currentStep = "Sedang bereksperimen di Meja 3D",
  studentName = "Siswa",
  userId,
  roomCode,
}: AiLabAssistantModalProps) {
  const [messages, setMessages] = useState<{ sender: "user" | "ai"; text: string; time: string }[]>([]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      const greeting = getSituationalGreeting(vessels, activeReaction, currentTask, labMode);
      setMessages((prev) => {
        if (prev.length === 0) {
          return [{ sender: "ai", text: greeting, time: "Sekarang" }];
        }
        return prev;
      });
    }
  }, [isOpen, vessels, activeReaction, currentTask, labMode]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  if (!isOpen) return null;

  const handleSend = async (customPrompt?: string) => {
    const userText = (customPrompt || inputQuestion).trim();
    if (!userText || isLoading) return;

    if (!customPrompt) setInputQuestion("");
    const newMsg = { sender: "user" as const, text: userText, time: "Baru saja" };
    setMessages((prev) => [...prev, newMsg]);
    setIsLoading(true);

    try {
      const activeChems =
        vessels.length > 0
          ? vessels.map((v) => `${v.name} (${v.formula})`)
          : activeChemicalNames;

      const res = await fetch("/api/lab/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userText,
          activeChemicals: activeChems,
          activeReaction: activeReaction
            ? {
                title: activeReaction.title,
                equation: activeReaction.equation,
                resultName: activeReaction.resultName,
                resultFormula: activeReaction.resultFormula,
                temperatureChange: activeReaction.temperatureChange,
                reasonWhy: activeReaction.reasonWhy,
                explanation: activeReaction.explanation,
              }
            : null,
          currentTask: currentTask
            ? {
                title: currentTask.title,
                instructions: currentTask.instructions,
                level: currentTask.level,
              }
            : null,
          labMode: labMode || "sandbox",
          currentStep,
          studentName,
          userId,
          roomCode,
        }),
      });

      const data = await res.json();
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: data.answer || "Reaksi kimia terjadi ketika molekul saling bertukar ikatan.",
          time: "Baru saja",
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          sender: "ai",
          text: "Maaf, asisten lab sedang mengalami gangguan koneksi. Coba tanyakan kembali beberapa saat lagi.",
          time: "Baru saja",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    const greeting = getSituationalGreeting(vessels, activeReaction, currentTask, labMode);
    setMessages([{ sender: "ai", text: greeting, time: "Sekarang" }]);
  };

  const suggestionChips = getSuggestionChips(vessels, activeReaction);

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 font-sans animate-in fade-in duration-200">
      <div className="pop-card w-full max-w-2xl rounded-3xl flex flex-col h-[600px] max-h-[90vh] overflow-hidden bg-[#FFFDF7] text-slate-900">
        {/* Modal Header */}
        <div className="px-5 py-3.5 bg-[#FACC15] border-b-2 border-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center text-slate-900">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display font-bold text-sm text-slate-900">
                  CupLabs AI • Kak Lab
                </span>
                <span className="text-[9px] bg-[#38BDF8] text-slate-900 border border-slate-900 px-1.5 py-0.5 rounded font-black uppercase tracking-wider">
                  LIVE OBSERVER
                </span>
              </div>
              <span className="text-[11px] font-bold text-slate-800">
                Asisten Virtual Laboratorium Sains &amp; Kimia
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleResetChat}
              className="pop-btn px-2.5 py-1.5 text-xs bg-white text-slate-900 rounded-xl gap-1"
              title="Mulai percakapan baru"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center text-slate-900 hover:bg-rose-100 cursor-pointer"
              title="Tutup dialog"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Real-Time Live Workbench Status Banner */}
        <div className="px-4 py-2 bg-[#BAE6FD] border-b-2 border-slate-900 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-900">
            <Eye className="w-3.5 h-3.5" />
            <span className="font-black text-[11px] uppercase tracking-wide">Observasi Meja 3D:</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="px-2 py-0.5 rounded-lg bg-white text-slate-900 border border-slate-900 font-bold">
              {labMode === "task" ? currentTask?.title || "Tugas Kelas" : "Mode Bebas (Sandbox)"}
            </span>

            {vessels.length > 0 ? (
              <div className="flex items-center gap-1">
                {vessels.map((v) => (
                  <span
                    key={v.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-slate-900 text-slate-900 font-mono font-bold"
                    title={v.name}
                  >
                    <span
                      className="w-2 h-2 rounded-full inline-block border border-slate-900 shrink-0"
                      style={{ backgroundColor: v.color || "#38bdf8" }}
                    />
                    <ChemicalFormula formula={v.formula} />
                  </span>
                ))}
              </div>
            ) : (
              <span className="px-2 py-0.5 rounded-lg bg-white text-slate-500 italic border border-slate-900">
                Meja Kosong
              </span>
            )}

            {activeReaction && (
              <span className="px-2 py-0.5 rounded-lg bg-[#34D399] text-slate-900 border border-slate-900 font-black flex items-center gap-1">
                <Zap className="w-3 h-3" />
                <span className="truncate max-w-[130px]">{activeReaction.title}</span>
              </span>
            )}
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 pop-dots">
          {messages.map((m, i) => (
            <div key={i} className="flex items-start gap-3 animate-in fade-in duration-200">
              <div
                className={`w-8 h-8 rounded-xl border-2 border-slate-900 shrink-0 flex items-center justify-center text-slate-900 text-xs font-bold ${
                  m.sender === "user" ? "bg-[#34D399]" : "bg-[#FACC15]"
                }`}
              >
                {m.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-slate-900">
                    {m.sender === "user" ? "Kamu" : "Kak Lab-AI"}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500">{m.time}</span>
                </div>

                <div
                  className={`text-xs leading-relaxed p-3.5 rounded-2xl border-2 border-slate-900 ${
                    m.sender === "user"
                      ? "bg-[#BAE6FD] text-slate-900 font-medium"
                      : "bg-white text-slate-900 shadow-[2px_2px_0px_#0f172a]"
                  }`}
                >
                  <FormattedAiMessage text={m.text} isUser={false} />
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2.5 text-xs font-bold text-slate-900 bg-[#FEF9C3] p-3 rounded-2xl border-2 border-slate-900 w-fit animate-pulse">
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent animate-spin rounded-full" />
              <span>Kak Lab-AI sedang menganalisis meja praktikummu...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Suggestion Chips */}
        {suggestionChips.length > 0 && (
          <div className="px-3 py-2 bg-white border-t-2 border-slate-900 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-black text-slate-700 shrink-0 uppercase tracking-wider flex items-center gap-1 pl-1">
              <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
              <span>Saran:</span>
            </span>
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(chip)}
                disabled={isLoading}
                className="shrink-0 text-[11px] font-bold bg-[#FEF9C3] hover:bg-[#FACC15] text-slate-900 border border-slate-900 px-3 py-1 rounded-full transition-colors cursor-pointer disabled:opacity-50"
              >
                {chip}
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 bg-white border-t-2 border-slate-900 flex items-center gap-2">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              activeReaction
                ? `Tanyakan tentang reaksi "${activeReaction.title}"...`
                : "Tanyakan konsep kimia, reaksi zat, atau K3..."
            }
            className="flex-1 px-3.5 py-2.5 bg-slate-50 border-2 border-slate-900 rounded-xl text-xs font-semibold text-slate-900 placeholder-slate-400 outline-none"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isLoading || !inputQuestion.trim()}
            className="pop-btn bg-[#34D399] hover:bg-[#10B981] text-slate-900 px-4 py-2.5 rounded-xl text-xs gap-1.5 shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </div>
      </div>
    </div>
  );
}
