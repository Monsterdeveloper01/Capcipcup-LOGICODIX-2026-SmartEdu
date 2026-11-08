"use client";

import { BookOpen, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { ActiveClassroom } from "../types";
import { SpeakingEvaluation } from "@/lib/linguaquest/types";

interface StudentAutopsyStepProps {
  activeClassroom: ActiveClassroom | null;
  isEvaluating: boolean;
  evaluation: SpeakingEvaluation | null;
  pokedexCount: number;
  onOpenPokedex: () => void;
  onReturnToCatalog: () => void;
}

export default function StudentAutopsyStep({
  activeClassroom,
  isEvaluating,
  evaluation,
  pokedexCount,
  onOpenPokedex,
  onReturnToCatalog,
}: StudentAutopsyStepProps) {
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
        <span className="font-mono text-xs font-black uppercase bg-[#facc15] text-black px-3.5 py-1 border-2 border-black shadow-[2px_2px_0px_#000000]">
          [POST-GAME CEFR REPLAY & AUTOPSY]
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPokedex}
            className="brutal-btn-yellow px-3.5 py-1.5 text-xs font-mono font-black flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
          >
            <BookOpen className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>🎒 BUKU KOLEKSI ({pokedexCount})</span>
          </button>
          <button
            onClick={onReturnToCatalog}
            className="brutal-btn-yellow px-4 py-1.5 text-xs font-mono font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
          >
            <BookOpen className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>[ 📋 DAFTAR TUGAS KELAS ]</span>
          </button>
        </div>
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
          {evaluation.nativeUpgrades && evaluation.nativeUpgrades.length > 0 && (
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
