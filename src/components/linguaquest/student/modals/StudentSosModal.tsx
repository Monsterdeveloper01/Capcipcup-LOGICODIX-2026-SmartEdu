"use client";

import { Lightbulb, X } from "lucide-react";

interface StudentSosModalProps {
  isOpen: boolean;
  onClose: () => void;
  sosInput: string;
  setSosInput: (val: string) => void;
  onSubmit: () => void;
}

export default function StudentSosModal({
  isOpen,
  onClose,
  sosInput,
  setSosInput,
  onSubmit,
}: StudentSosModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-black w-full max-w-md shadow-[8px_8px_0px_#000000] p-6 space-y-4 font-mono text-black">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#facc15] border border-black">
              <Lightbulb className="w-5 h-5 text-black stroke-[2.5]" />
            </span>
            <div>
              <span className="text-[10px] font-black uppercase text-zinc-600 block">
                [CODE-SWITCHING RESCUE // ID -&gt; EN]
              </span>
              <h3 className="text-base font-black uppercase text-black">
                LUPA KATA BAHASA INGGRIS?
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-black text-white hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-700 leading-relaxed">
          Ketik kata atau istilah Bahasa Indonesia yang ingin kamu tanyakan ke NPC. NPC AI akan langsung mengajarimu kata bahasa Inggrisnya di tengah percakapan!
        </p>

        <div>
          <label className="font-black text-black block mb-1 text-xs uppercase">
            Kata Bahasa Indonesia (contoh: talenan, timbangan, wadah):
          </label>
          <input
            type="text"
            autoFocus
            value={sosInput}
            onChange={(e) => setSosInput(e.target.value)}
            placeholder="Contoh: talenan..."
            onKeyDown={(e) => e.key === "Enter" && onSubmit()}
            className="w-full px-3.5 py-2.5 bg-zinc-50 border-2 border-black text-sm font-mono text-black focus:outline-none focus:bg-white"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 text-xs">
          <button
            type="button"
            onClick={onClose}
            className="brutal-btn-white px-4 py-2 font-mono uppercase"
          >
            [ BATAL ]
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={!sosInput.trim()}
            className="brutal-btn-yellow px-5 py-2 font-mono font-black uppercase flex items-center gap-1.5"
          >
            <span>[ TANYA KE NPC SEKARANG ]</span>
          </button>
        </div>
      </div>
    </div>
  );
}
