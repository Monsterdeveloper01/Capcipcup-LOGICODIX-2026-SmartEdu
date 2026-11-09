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
    <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4 font-mono">
      <div className="bg-white border-4 border-black w-full max-w-lg shadow-[8px_8px_0px_#facc15] flex flex-col h-[520px]">
        {/* Modal Header */}
        <div className="p-3 bg-[#facc15] border-b-4 border-black flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 stroke-[2.5]" />
            <span className="font-black text-xs uppercase text-black">
              [ ASISTEN LAB VIRTUAL SAINS // TANYA AI ]
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 bg-black text-white hover:bg-zinc-800 text-xs font-black"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-zinc-50">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] p-2.5 border-2 border-black text-xs font-bold leading-relaxed shadow-[2px_2px_0px_#000000] ${
                  m.sender === "user"
                    ? "bg-[#facc15] text-black"
                    : "bg-white text-zinc-900"
                }`}
              >
                {m.text}
              </div>
              <span className="text-[10px] text-zinc-500 mt-1 font-bold">
                {m.sender === "user" ? "Kamu" : "Kak Lab-AI"} • {m.time}
              </span>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs font-bold text-zinc-600 bg-white p-2 border-2 border-black w-fit">
              <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent animate-spin rounded-full" />
              <span>Kak Lab-AI sedang menganalisis konsep kimia...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 bg-white border-t-4 border-black flex items-center gap-2">
          <input
            type="text"
            value={inputQuestion}
            onChange={(e) => setInputQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Tanyakan konsep praktikum, kenapa timbul gas, K3 lab..."
            className="flex-1 p-2 bg-zinc-100 border-2 border-black text-xs font-bold text-black focus:outline-none focus:bg-amber-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={isLoading || !inputQuestion.trim()}
            className="brutal-btn-yellow px-4 py-2 text-xs font-black uppercase flex items-center gap-1 disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>KIRIM</span>
          </button>
        </div>
      </div>
    </div>
  );
}
