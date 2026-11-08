"use client";

import { YoloDetection } from "@/lib/python-api";
import { Volume2, Sparkles, Check, ArrowRight, Zap } from "lucide-react";

interface VocabCardModalProps {
  detection: YoloDetection;
  onProceed: () => void;
  onScanAnother: () => void;
}

export default function VocabCardModal({
  detection,
  onProceed,
  onScanAnother,
}: VocabCardModalProps) {
  const { vocab_card, confidence, label } = detection;

  const playPronunciation = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(vocab_card.name_target);
      u.lang = "en-US";
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 font-mono">
      <div className="border-4 border-black dark:border-white bg-[#111317] p-6 max-w-md w-full shadow-[8px_8px_0px_#000000] dark:shadow-[8px_8px_0px_#facc15] space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-2">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 bg-[#4ade80] border border-black animate-ping" />
            <span className="text-[10px] font-black uppercase text-[#4ade80]">
              [YOLO DETECTION: SUCCESS // {Math.round(confidence * 100)}% CONF]
            </span>
          </div>
          <span className="text-[10px] bg-[#facc15] text-black px-2 py-0.5 font-black border border-black uppercase">
            ITEM UNLOCKED
          </span>
        </div>

        {/* Card Main Item */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs text-zinc-400 uppercase">{vocab_card.name_id}</span>
            <button
              onClick={playPronunciation}
              className="brutal-btn-cyan p-1.5 text-xs font-black"
              title="Dengarkan Pengucapan Asli"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          <h3 className="text-2xl font-black text-white uppercase tracking-tight">
            {vocab_card.name_target}
          </h3>

          <p className="text-xs font-bold text-[#22d3ee]">
            {vocab_card.phonetics}
          </p>
        </div>

        {/* Adjectives Box */}
        <div className="p-3 bg-black border-2 border-zinc-700 space-y-1.5 text-xs">
          <span className="text-[#facc15] font-black uppercase block">
            Target Adjectives (Kata Sifat Benda):
          </span>
          <div className="flex flex-wrap gap-1.5">
            {vocab_card.adjectives.map((adj, i) => (
              <span key={i} className="px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-white font-bold">
                +{adj}
              </span>
            ))}
          </div>
        </div>

        {vocab_card.idiom && (
          <div className="p-3 bg-black border-2 border-[#facc15] text-xs">
            <span className="font-black text-[#facc15] block uppercase mb-0.5">Idiom Terkait:</span>
            <p className="italic text-zinc-200">"{vocab_card.idiom}"</p>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex flex-col sm:flex-row gap-2">
          <button
            onClick={onScanAnother}
            className="w-full brutal-btn-dark py-2.5 text-xs font-black uppercase"
          >
            [ SCAN ULANG ]
          </button>
          <button
            onClick={onProceed}
            className="w-full brutal-btn-yellow py-2.5 text-xs font-black uppercase flex items-center justify-center gap-1.5"
          >
            <span>[ LANJUT KE ARENA ]</span>
            <ArrowRight className="w-4 h-4 stroke-[3]" />
          </button>
        </div>
      </div>
    </div>
  );
}

