"use client";

import { X, ArrowRight } from "lucide-react";
import { SpeakingEvaluation } from "@/lib/linguaquest/types";

interface Props {
  selectedEvaluation: SpeakingEvaluation | null;
  onClose: () => void;
}

export default function TranscriptDetailModal({ selectedEvaluation, onClose }: Props) {
  if (!selectedEvaluation) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-mono">
      <div className="border-4 border-black bg-white max-w-3xl w-full max-h-[85vh] overflow-y-auto p-6 shadow-[8px_8px_0px_#000000] space-y-5 text-black">
        <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-3">
          <div>
            <span className="text-[10px] font-black uppercase bg-black text-[#facc15] px-2 py-0.5">
              BUKTI TRANSKRIP PERCAKAPAN & EVALUASI
            </span>
            <h3 className="text-lg font-black text-black uppercase mt-1">
              {selectedEvaluation.studentName} • {selectedEvaluation.questTitle}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-black text-white hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Score Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
          <div className="p-2.5 bg-yellow-100 border border-black">
            <span className="block text-[10px] font-bold text-zinc-600 uppercase">CEFR LEVEL</span>
            <span className="text-xl font-black text-black">{selectedEvaluation.cefrLevel}</span>
          </div>
          <div className="p-2.5 bg-cyan-100 border border-black">
            <span className="block text-[10px] font-bold text-zinc-600 uppercase">SKOR AKHIR</span>
            <span className="text-xl font-black text-cyan-900">{selectedEvaluation.overallScore}/100</span>
          </div>
          <div className="p-2.5 bg-zinc-100 border border-black">
            <span className="block text-[10px] font-bold text-zinc-600 uppercase">KELANCARAN</span>
            <span className="text-xl font-black text-zinc-900">{selectedEvaluation.fluencyScore}%</span>
          </div>
          <div className="p-2.5 bg-zinc-100 border border-black">
            <span className="block text-[10px] font-bold text-zinc-600 uppercase">TATA BAHASA</span>
            <span className="text-xl font-black text-zinc-900">{selectedEvaluation.grammarScore}%</span>
          </div>
        </div>

        {/* Transcript Log */}
        <div className="space-y-2">
          <span className="text-xs font-black uppercase text-zinc-700 block">
            Dialog Asli Siswa dengan NPC Penguji:
          </span>
          <div className="p-4 bg-zinc-50 border-2 border-black max-h-56 overflow-y-auto space-y-3 text-xs leading-relaxed">
            {(selectedEvaluation.transcriptMessages || (selectedEvaluation as any).transcript || []).map((msg: any, mIdx: number) => (
              <div key={mIdx} className="space-y-0.5">
                <span className={`font-black uppercase text-[10px] ${
                  msg.sender === "npc" ? "text-cyan-800" : "text-amber-800"
                }`}>
                  [{msg.sender === "npc" ? "NPC PENGUJI" : selectedEvaluation.studentName}]:
                </span>
                <p className="text-black bg-white p-2 border border-zinc-300 font-mono">
                  {msg.text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Native Upgrades */}
        {selectedEvaluation.nativeUpgrades && selectedEvaluation.nativeUpgrades.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-black uppercase text-emerald-800 block">
              Koreksi & Native-Like Upgrade Kalimat Siswa:
            </span>
            <div className="space-y-2">
              {selectedEvaluation.nativeUpgrades.map((upg, uIdx) => (
                <div key={uIdx} className="p-3 bg-emerald-50 border border-emerald-600 text-xs space-y-1">
                  <div className="text-red-700">
                    <span className="font-bold line-through">"{upg.original}"</span>
                  </div>
                  <div className="text-emerald-900 font-bold flex items-center gap-1.5">
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />
                    <span>"{upg.upgraded}"</span>
                  </div>
                  <p className="text-[11px] text-zinc-600 italic mt-0.5">{upg.explanation || (upg as any).reason}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="brutal-btn-yellow px-5 py-2 text-xs font-black uppercase"
          >
            [ SELESAI // TUTUP ]
          </button>
        </div>
      </div>
    </div>
  );
}

