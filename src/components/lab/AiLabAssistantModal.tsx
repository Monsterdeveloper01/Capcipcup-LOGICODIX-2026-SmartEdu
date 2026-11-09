"use client";

import { useState } from "react";
import { MessageSquare, Send, Sparkles, X, Bot, AlertTriangle } from "lucide-react";

interface AiLabAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeChemicalNames: string[];
  currentStep?: string;
}

export default function AiLabAssistantModal({
  isOpen,
  onClose,
  activeChemicalNames,
  currentStep = "Sedang bereksperimen di Meja 3D",
}: AiLabAssistantModalProps) {
  const [messages, setMessages] = useState<
    { sender: "user" | "ai"; text: string; time: string }[]
  >([
    {
      sender: "ai",
      text: `Halo! Saya Asisten Laboratorium Sains AI. Saya siap membantumu memahami reaksi kimia dari zat di mejamu (${activeChemicalNames.join(", ")}). Ada konsep yang ingin kamu tanyakan?`,
      time: "Sekarang",
    },
  ]);

  const [inputQuestion, setInputQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSend = async () => {
    if (!inputQuestion.trim() || isLoading) return;

    const userText = inputQuestion.trim();
    setInputQuestion("");
    const newMsg = { sender: "user" as const, text: userText, time: "Baru saja" };
    setMessages((prev) => [...prev, newMsg]);
    setIsLoading(true);

    try {
      const res = await fetch("/api/lab/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: userText,
          activeChemicals: activeChemicalNames,
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

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 font-sans animate-in fade-in duration-200">
      <div className="bg-[#313338] border border-[#202225] w-full max-w-lg rounded-xl shadow-2xl flex flex-col h-[540px] overflow-hidden text-[#dbdee1]">
        {/* Modal Header */}
        <div className="px-4 py-3 bg-[#2b2d31] border-b border-[#202225] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center text-white font-black text-sm shadow">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-[#f2f3f5]">Kak Lab-AI</span>
                <span className="text-[10px] bg-[#5865F2] text-white px-1.5 py-0.2 rounded font-bold uppercase tracking-wider">
                  BOT
                </span>
              </div>
              <span className="text-[11px] text-[#949ba4]">
                Asisten Virtual Laboratorium Kimia & Sains
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-[#949ba4] hover:text-white hover:bg-[#35373c] rounded-full transition-colors"
            title="Tutup dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 bg-[#313338]">
          {messages.map((m, i) => (
            <div key={i} className="flex items-start gap-3">
              <div
                className={`w-9 h-9 rounded-full shrink-0 flex items-center justify-center text-white text-xs font-bold ${
                  m.sender === "user" ? "bg-emerald-600" : "bg-[#5865F2]"
                }`}
              >
                {m.sender === "user" ? "👤" : <Bot className="w-5 h-5" />}
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold text-xs ${
                      m.sender === "user" ? "text-emerald-400" : "text-[#5865F2]"
                    }`}
                  >
                    {m.sender === "user" ? "Siswa (Kamu)" : "Kak Lab-AI"}
                  </span>
                  {m.sender === "ai" && (
                    <span className="text-[9px] bg-[#5865F2] text-white px-1 rounded font-bold">
                      BOT
                    </span>
                  )}
                  <span className="text-[10px] text-[#949ba4]">{m.time}</span>
                </div>

                <div
                  className={`text-xs leading-relaxed p-3 rounded-lg border ${
                    m.sender === "user"
                      ? "bg-[#2b2d31] border-[#383a40] text-[#f2f3f5]"
                      : "bg-[#2b2d31] border-[#383a40] text-[#dbdee1]"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2.5 text-xs text-[#949ba4] bg-[#2b2d31] p-3 rounded-lg border border-[#383a40] w-fit">
              <div className="w-4 h-4 border-2 border-[#5865F2] border-t-transparent animate-spin rounded-full" />
              <span>Kak Lab-AI sedang menganalisis reaksi kimia...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-[#2b2d31] border-t border-[#202225] flex items-center gap-2">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Tanyakan konsep praktikum, kenapa timbul gas, K3..."
            className="flex-1 px-3.5 py-2.5 bg-[#383a40] border border-transparent focus:border-[#5865F2] rounded-lg text-xs font-medium text-white placeholder-[#80848e] outline-none transition-colors"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || !inputQuestion.trim()}
            className="bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Kirim</span>
          </button>
        </div>
      </div>
    </div>
  );
}
