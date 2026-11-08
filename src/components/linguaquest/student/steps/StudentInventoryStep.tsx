"use client";

import { Volume2, Zap, BookOpen, ArrowRight } from "lucide-react";
import { ActiveClassroom } from "../types";
import { QuestScenario, ScannedItem } from "@/lib/linguaquest/types";

interface StudentInventoryStepProps {
  activeClassroom: ActiveClassroom | null;
  inventoryItems: ScannedItem[];
  currentQuest: QuestScenario | null;
  pokedexCount: number;
  onRescan: () => void;
  onOpenPokedex: () => void;
  onSpeak: (text: string) => void;
  onStartRoleplay: () => void;
}

export default function StudentInventoryStep({
  activeClassroom,
  inventoryItems,
  currentQuest,
  pokedexCount,
  onRescan,
  onOpenPokedex,
  onSpeak,
  onStartRoleplay,
}: StudentInventoryStepProps) {
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

      <div className="flex items-center justify-between">
        <button
          onClick={onRescan}
          className="brutal-btn-white px-3 py-1.5 text-xs font-mono"
        >
          ← SCAN FOTO LAIN
        </button>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPokedex}
            className="brutal-btn-yellow px-3.5 py-1 text-xs font-mono font-black flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
          >
            <BookOpen className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>🎒 BUKU KOLEKSI ({pokedexCount})</span>
          </button>
          <span className="font-mono text-xs font-black uppercase bg-[#4ade80] text-black px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000000]">
            [STATUS: {inventoryItems.length} OBJEK TERDAFTAR]
          </span>
        </div>
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
                  onClick={() => onSpeak(item.englishWord)}
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

      {/* Dynamic Emergency Quest Memorandum */}
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
              onClick={onStartRoleplay}
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

