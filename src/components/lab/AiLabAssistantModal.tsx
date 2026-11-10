"use client";

import { useState, useEffect, useRef } from "react";
import {
  Send,
  Sparkles,
  X,
  Bot,
  FlaskConical,
  Flame,
  ShieldAlert,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  Eye,
  RotateCcw,
} from "lucide-react";
import { ChemicalVessel, ReactionDetail } from "./ChemistryLabScene";
import { LabTask } from "@/lib/lab/types";

interface AiLabAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeChemicalNames?: string[];
  vessels?: ChemicalVessel[];
  activeReaction?: ReactionDetail | null;
  currentTask?: LabTask | null;
  labMode?: "task" | "sandbox";
  currentStep?: string;
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

  return "Halo! Meja lab 3D kamu saat ini masih bersih dan kosong. Yuk pilih bahan kimia dari katalog di sebelah kiri untuk mulai eksperimen, atau tanyakan rekomendasi praktikum seru kepadaku!";
}

function getSuggestionChips(
  vessels: ChemicalVessel[] = [],
  activeReaction: ReactionDetail | null = null
): string[] {
  if (activeReaction) {
    return [
      "💡 Mengapa reaksi ini bisa terjadi?",
      activeReaction.temperatureChange !== 0 ? "🔥 Kenapa suhunya bisa berubah?" : "🧪 Apa sifat kimia produk reaksi ini?",
      "⚠️ Apa aspek keselamatan K3 untuk produk ini?",
      "📝 Tuliskan persamaan reaksi seimbangnya",
    ];
  }
  if (vessels.length >= 2) {
    return [
      "🧪 Apa yang terjadi jika zat ini dicampur?",
      "📖 Bagaimana cara penuangan yang aman?",
      "🔍 Apakah reaksi ini menghasilkan gas atau endapan?",
    ];
  }
  if (vessels.length === 1) {
    return [
      "🔬 Apa karakteristik & kegunaan bahan ini?",
      "💡 Bahan apa yang cocok direaksikan dengannya?",
      "🛡️ Apa aturan keselamatan kerja bahan ini?",
    ];
  }
  return [
    "💡 Rekomendasikan eksperimen kimia yang seru!",
    "🚀 Bagaimana cara memulai praktikum di Meja 3D?",
    "⚠️ Apa saja aturan keselamatan dasar lab?",
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
}: AiLabAssistantModalProps) {
  const [messages, setMessages] = useState<{ sender: "user" | "ai"; text: string; time: string }[]>([]);
  const [inputQuestion, setInputQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Initialize or update initial greeting reflecting live workbench status
  useEffect(() => {
    if (isOpen) {
      const greeting = getSituationalGreeting(vessels, activeReaction, currentTask, labMode);
      setMessages((prev) => {
        // If already has conversation, keep it; if empty or opening anew, seed greeting
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
    } catch (err) {
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
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 font-sans animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 w-full max-w-2xl rounded-2xl shadow-2xl flex flex-col h-[600px] max-h-[90vh] overflow-hidden text-slate-800">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-sky-600 flex items-center justify-center text-white shadow-md shadow-sky-600/20">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-slate-900">CupLabs AI • Kak Lab</span>
                <span className="text-[10px] bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                  REAL-TIME OBSERVER
                </span>
              </div>
              <span className="text-[11px] text-slate-500">
                Asisten Virtual Laboratorium Sains & Kimia
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleResetChat}
              className="p-1.5 px-2.5 text-xs text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-1 border border-slate-200"
              title="Mulai percakapan baru dengan status meja saat ini"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset Sesi</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              title="Tutup dialog"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Real-Time Live Workbench Status Banner */}
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Eye className="w-3.5 h-3.5 text-sky-600" />
            <span className="font-bold text-[11px] text-slate-800 uppercase tracking-wide">
              Observasi Meja 3D:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            {/* Mode Badge */}
            <span className="px-2 py-0.5 rounded bg-white text-slate-700 border border-slate-200 font-medium shadow-2xs">
              {labMode === "task" ? `🎯 ${currentTask?.title || "Tugas Kelas"}` : "⚡ Mode Bebas (Sandbox)"}
            </span>

            {/* Chemicals on table */}
            {vessels.length > 0 ? (
              <div className="flex items-center gap-1">
                {vessels.map((v) => (
                  <span
                    key={v.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-900 font-mono shadow-2xs"
                    title={v.name}
                  >
                    <span
                      className="w-2 h-2 rounded-full inline-block border border-black/10"
                      style={{ backgroundColor: v.color || "#38bdf8" }}
                    />
                    {v.formula}
                  </span>
                ))}
              </div>
            ) : (
              <span className="px-2 py-0.5 rounded bg-white text-slate-400 italic border border-slate-200">
                Meja Kosong
              </span>
            )}

            {/* Active Reaction Badge */}
            {activeReaction && (
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold flex items-center gap-1 animate-pulse shadow-2xs">
                <span>⚡</span>
                <span className="truncate max-w-[130px]">{activeReaction.title}</span>
                {activeReaction.temperatureChange !== 0 && (
                  <span className="font-mono text-[10px]">
                    ({activeReaction.temperatureChange > 0 ? `+${activeReaction.temperatureChange}°C` : `${activeReaction.temperatureChange}°C`})
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-50">
          {messages.map((m, i) => (
            <div key={i} className="flex items-start gap-3 animate-in fade-in duration-200">
              <div
                className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold shadow-sm ${
                  m.sender === "user" ? "bg-emerald-600" : "bg-sky-600"
                }`}
              >
                {m.sender === "user" ? "👤" : <Bot className="w-4 h-4" />}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold text-xs ${
                      m.sender === "user" ? "text-emerald-700" : "text-sky-700"
                    }`}
                  >
                    {m.sender === "user" ? "Siswa (Kamu)" : "Kak Lab-AI"}
                  </span>
                  {m.sender === "ai" && (
                    <span className="text-[9px] bg-sky-100 text-sky-800 border border-sky-200 px-1.5 py-0.2 rounded font-bold">
                      BOT
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">{m.time}</span>
                </div>

                <div
                  className={`text-xs leading-relaxed p-3.5 rounded-xl border shadow-xs ${
                    m.sender === "user"
                      ? "bg-sky-600 border-sky-600 text-white"
                      : "bg-white border-slate-200 text-slate-800"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{m.text}</p>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2.5 text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-200 w-fit shadow-xs animate-pulse">
              <div className="w-4 h-4 border-2 border-sky-600 border-t-transparent animate-spin rounded-full" />
              <span>Kak Lab-AI sedang menganalisis kondisi meja praktikummu...</span>
            </div>
          )}

          <div ref={chatBottomRef} />
        </div>

        {/* Dynamic Contextual Suggestion Chips */}
        {suggestionChips.length > 0 && (
          <div className="px-3 py-2 bg-white border-t border-slate-200 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[10px] font-bold text-slate-500 shrink-0 uppercase tracking-wider flex items-center gap-1 pl-1">
              <Lightbulb className="w-3 h-3 text-amber-500" />
              Saran:
            </span>
            {suggestionChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(chip)}
                disabled={isLoading}
                className="shrink-0 text-[11px] bg-slate-50 hover:bg-slate-100 hover:text-slate-900 text-slate-700 border border-slate-200 hover:border-sky-300 px-2.5 py-1 rounded-full transition-colors flex items-center gap-1 shadow-2xs disabled:opacity-50"
              >
                <span>{chip}</span>
              </button>
            ))}
          </div>
        )}

        {/* Input Bar */}
        <div className="p-3 bg-white border-t border-slate-200 flex items-center gap-2">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder={
              activeReaction
                ? `Tanyakan tentang reaksi "${activeReaction.title}", produk, atau suhu...`
                : vessels.length > 0
                ? `Tanyakan tentang ${vessels.map((v) => v.formula).join(", ")}, K3, atau cara reaksi...`
                : "Tanyakan konsep kimia, rekomendasi eksperimen, atau aturan K3..."
            }
            className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 focus:border-sky-600 rounded-xl text-xs font-medium text-slate-900 placeholder-slate-400 outline-none transition-colors"
          />
          <button
            type="button"
            onClick={() => handleSend()}
            disabled={isLoading || !inputQuestion.trim()}
            className="bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm shrink-0"
          >
            <Send className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </div>
      </div>
    </div>
  );
}
