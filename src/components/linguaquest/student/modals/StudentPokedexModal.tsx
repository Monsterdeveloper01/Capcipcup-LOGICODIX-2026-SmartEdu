"use client";

import { useState } from "react";
import { BookOpen, X, Search, Volume2, Zap } from "lucide-react";
import { ScannedItem } from "@/lib/linguaquest/types";

interface StudentPokedexModalProps {
  isOpen: boolean;
  onClose: () => void;
  deck: ScannedItem[];
  onSpeak: (text: string) => void;
}

export default function StudentPokedexModal({
  isOpen,
  onClose,
  deck,
  onSpeak,
}: StudentPokedexModalProps) {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const filteredDeck = deck.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.englishWord.toLowerCase().includes(q) ||
      item.objectName.toLowerCase().includes(q) ||
      (item.idiom && item.idiom.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black w-full max-w-3xl shadow-[8px_8px_0px_#000000] p-6 space-y-5 font-mono text-black max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-4">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-[#facc15] border-2 border-black shadow-[2px_2px_0px_#000000]">
              <BookOpen className="w-6 h-6 text-black stroke-[2.5]" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase text-zinc-600 block">
                [FEATURE 3 // PERSISTENT INVENTORY DECK]
              </span>
              <h3 className="text-xl sm:text-2xl font-black uppercase tracking-tight">
                BUKU KOLEKSI KATA (VOCAB POKEDEX)
              </h3>
              <p className="text-xs text-zinc-600">
                Total {deck.length} kartu kosakata benda nyata tersimpan di memori perangkat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-black text-white hover:bg-zinc-800 border-2 border-black"
          >
            <X className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3.5 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kartu (contoh: bottle, coffee, notebook)..."
            className="w-full pl-9 pr-4 py-2.5 bg-zinc-50 border-2 border-black text-xs font-mono text-black focus:outline-none focus:bg-white"
          />
        </div>

        {/* Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-h-[50vh] overflow-y-auto p-1">
          {filteredDeck.map((item, idx) => (
            <div
              key={item.id || idx}
              className="bg-white border-2 border-black p-4 shadow-[3px_3px_0px_#000000] flex flex-col justify-between space-y-3"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between border-b border-zinc-200 pb-1.5">
                  <span className="text-[10px] font-black uppercase text-zinc-600 truncate max-w-[130px]">
                    {item.objectName}
                  </span>
                  <button
                    onClick={() => onSpeak(item.englishWord)}
                    title="Dengarkan Pengucapan (IPA Audio)"
                    className="brutal-btn-yellow p-1 text-[10px]"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <h4 className="font-black text-lg text-black uppercase tracking-tight">
                    {item.englishWord}
                  </h4>
                  <span className="text-xs font-bold text-cyan-700 block">
                    {item.phonetics}
                  </span>
                </div>

                <div className="p-2 bg-zinc-50 border border-black text-[11px] text-zinc-800">
                  <span className="font-black block uppercase text-[9px] text-black">
                    [IDIOM]:
                  </span>
                  <p className="italic">"{item.idiom}"</p>
                </div>
              </div>

              <div className="pt-2 border-t border-zinc-200 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                <Zap className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{item.rpgAttribute}</span>
              </div>
            </div>
          ))}
          {filteredDeck.length === 0 && (
            <div className="col-span-full py-8 text-center text-zinc-500 text-xs">
              Tidak ada kartu yang cocok dengan pencarian "{searchTerm}".
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t-2 border-zinc-200 pt-3 text-xs">
          <span className="text-zinc-600 font-bold hidden sm:inline">
            💡 Tip: Arahkan kamera ke meja untuk membuka kartu item baru!
          </span>
          <button
            onClick={onClose}
            className="brutal-btn-yellow px-5 py-2 font-mono font-black uppercase ml-auto"
          >
            [ TUTUP POKEDEX ]
          </button>
        </div>
      </div>
    </div>
  );
}
