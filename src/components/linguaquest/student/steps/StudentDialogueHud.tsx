"use client";

import { Volume2, BookOpen, ShieldAlert, Lightbulb, X, Mic, Send } from "lucide-react";
import { ActiveClassroom, CodeSwitchRescue } from "../types";
import { QuestScenario, RoleplayTurnMessage, ScannedItem } from "@/lib/linguaquest/types";

interface StudentDialogueHudProps {
  activeClassroom: ActiveClassroom | null;
  currentQuest: QuestScenario;
  messages: RoleplayTurnMessage[];
  rapport: number;
  isListening: boolean;
  spokenTranscript: string;
  textInput: string;
  setTextInput: (val: string) => void;
  isAiThinking: boolean;
  activeHint: string | null;
  setActiveHint: (val: string | null) => void;
  inventoryItems: ScannedItem[];
  safetyViolationNotice: string | null;
  setSafetyViolationNotice: (val: string | null) => void;
  codeSwitchRescue: CodeSwitchRescue | null;
  setCodeSwitchRescue: (val: CodeSwitchRescue | null) => void;
  pokedexCount: number;
  onOpenPokedex: () => void;
  onOpenSos: () => void;
  onFinishSession: () => void;
  onToggleListening: () => void;
  onSendSpokenLine: (overrideText?: string) => void;
  onSpeak: (text: string) => void;
}

export default function StudentDialogueHud({
  activeClassroom,
  currentQuest,
  messages,
  rapport,
  isListening,
  spokenTranscript,
  textInput,
  setTextInput,
  isAiThinking,
  activeHint,
  setActiveHint,
  inventoryItems,
  safetyViolationNotice,
  setSafetyViolationNotice,
  codeSwitchRescue,
  setCodeSwitchRescue,
  pokedexCount,
  onOpenPokedex,
  onOpenSos,
  onFinishSession,
  onToggleListening,
  onSendSpokenLine,
  onSpeak,
}: StudentDialogueHudProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-4 font-mono">
      {/* Active Class Indicator */}
      {activeClassroom && (
        <div className="p-2.5 bg-emerald-50 border-2 border-black flex flex-wrap items-center justify-between gap-2 text-xs font-mono font-bold text-black shadow-[2px_2px_0px_#000000]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse border border-black" />
            <span>[KELAS AKTIF: PIN {activeClassroom.roomCode} • GURU: {activeClassroom.creatorName}]</span>
          </div>
          <span className="text-cyan-900 font-black truncate">{activeClassroom.questTitle || activeClassroom.name}</span>
        </div>
      )}

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

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPokedex}
            className="brutal-btn-yellow px-3 py-2 text-xs font-mono font-black flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
          >
            <BookOpen className="w-3.5 h-3.5 stroke-[2.5]" />
            <span className="hidden sm:inline">🎒 POKEDEX ({pokedexCount})</span>
          </button>
          <button
            onClick={onFinishSession}
            className="brutal-btn-white px-3.5 py-2 text-xs font-mono"
          >
            [ SELESAIKAN & AUTOPSI ]
          </button>
        </div>
      </div>

      {/* Live Conversation Stream */}
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
                  onClick={() => onSpeak(msg.text)}
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

      {/* Feature 5: Safety Violation Notice Banner */}
      {safetyViolationNotice && (
        <div className="p-3 bg-red-100 border-2 border-red-600 text-red-900 font-mono text-xs font-black flex items-center justify-between gap-3 shadow-[3px_3px_0px_#000000]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-red-600 flex-shrink-0" />
            <span>{safetyViolationNotice}</span>
          </div>
          <button
            onClick={() => setSafetyViolationNotice(null)}
            className="px-2 py-1 bg-red-600 text-white text-[10px] font-black uppercase"
          >
            [TUTUP]
          </button>
        </div>
      )}

      {/* Feature 6: Code-Switching Rescue Banner (ID -> EN) */}
      {codeSwitchRescue && (
        <div className="p-3.5 bg-[#fef08a] border-2 border-black text-black font-mono text-xs shadow-[4px_4px_0px_#000000] flex flex-wrap items-center justify-between gap-3 animate-slideUp">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-amber-800 stroke-[2.5]" />
              <span className="font-black uppercase text-amber-900">
                [ 💡 AI CODE-SWITCHING RESCUE // LUPA KATA ]:
              </span>
            </div>
            <p className="text-zinc-900 font-bold">
              Kamu menyebut <span className="bg-white px-1.5 py-0.5 border border-black italic">"{codeSwitchRescue.detectedIndonesianWord}"</span> → Gunakan istilah Inggris:{" "}
              <span className="bg-amber-400 px-2 py-0.5 border border-black font-black uppercase text-black">
                "{codeSwitchRescue.englishEquivalent}"
              </span>
            </p>
            <p className="text-[11px] text-zinc-700 italic">{codeSwitchRescue.explanation}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSpeak(codeSwitchRescue.englishEquivalent)}
              title="Dengarkan Pelafalan Asli"
              className="brutal-btn-white p-2 text-xs"
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setTextInput(textInput ? `${textInput} ${codeSwitchRescue.englishEquivalent}` : codeSwitchRescue.englishEquivalent);
                setCodeSwitchRescue(null);
              }}
              className="brutal-btn-yellow px-3 py-1.5 text-xs font-mono font-black uppercase shadow-[2px_2px_0px_#000000]"
            >
              [ + SISIPKAN KE INPUT ]
            </button>
            <button
              type="button"
              onClick={() => setCodeSwitchRescue(null)}
              className="p-1.5 bg-black text-white hover:bg-zinc-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Live Speech Microphone Input Controller */}
      <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_#000000] flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={onToggleListening}
            className={`w-14 h-14 flex items-center justify-center flex-shrink-0 transition-all font-mono font-black ${
              isListening
                ? "brutal-btn-red animate-pulse"
                : "brutal-btn-yellow"
            }`}
            title={isListening ? "Klik untuk Berhenti Bicara" : "Klik & Bicara dalam Bahasa Inggris"}
          >
            <Mic className="w-6 h-6 stroke-[2.5]" />
          </button>

          {/* Feature 6 SOS Button */}
          <button
            type="button"
            onClick={onOpenSos}
            className="brutal-btn-white px-3 py-3 h-14 text-xs font-mono font-black flex items-center gap-1.5 flex-shrink-0"
            title="Tanya Terjemahan Kata Indonesia ke Inggris ke NPC"
          >
            <Lightbulb className="w-4 h-4 text-amber-600 stroke-[2.5]" />
            <span className="hidden sm:inline">SOS: LUPA KATA</span>
          </button>
        </div>

        <div className="flex-1 w-full space-y-1">
          <input
            type="text"
            value={spokenTranscript || textInput}
            onChange={(e) => setTextInput(e.target.value)}
            placeholder={isListening ? "Mendengarkan suaramu... bicara dalam Bahasa Inggris..." : "Bicara lewat mikrofon, atau ketik kalimat di sini..."}
            onKeyDown={(e) => e.key === "Enter" && onSendSpokenLine()}
            className="w-full px-4 py-3 bg-zinc-50 border-2 border-black text-sm font-mono text-black placeholder-zinc-500 focus:outline-none focus:bg-white"
          />
          {isListening && (
            <span className="font-mono text-[10px] text-red-600 font-black uppercase block animate-pulse">
              🔴 SUARA SEDANG DIREKAM REAL-TIME VIA WEB SPEECH API (ENGLISH)...
            </span>
          )}
        </div>

        <button
          onClick={() => onSendSpokenLine()}
          disabled={(!spokenTranscript && !textInput) || isAiThinking}
          className="brutal-btn-yellow px-5 py-3 h-14 text-xs font-mono flex items-center gap-1.5 flex-shrink-0"
        >
          <Send className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>KIRIM JAWABAN</span>
        </button>
      </div>
    </div>
  );
}

