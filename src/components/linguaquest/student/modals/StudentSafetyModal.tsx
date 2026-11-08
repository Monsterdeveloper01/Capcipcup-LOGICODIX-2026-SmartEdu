"use client";

import { ShieldAlert } from "lucide-react";
import { SafetyAlert } from "../types";

interface StudentSafetyModalProps {
  isOpen: boolean;
  safetyAlert: SafetyAlert | null;
  onAcknowledge: () => void;
}

export default function StudentSafetyModal({
  isOpen,
  safetyAlert,
  onAcknowledge,
}: StudentSafetyModalProps) {
  if (!isOpen || !safetyAlert) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white border-4 border-red-600 w-full max-w-lg shadow-[8px_8px_0px_#dc2626] p-6 space-y-4 font-mono text-black">
        <div className="flex items-center gap-3 border-b-2 border-red-600 pb-3">
          <div className="p-2 bg-red-600 text-white">
            <ShieldAlert className="w-7 h-7 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-red-600 block">
              [SAFE-SCHOOL SHIELD // PROTOKOL KEAMANAN SEKOLAH]
            </span>
            <h3 className="text-xl font-black uppercase text-red-700 tracking-tight">
              BENDA BERBAHAYA TERDETEKSI!
            </h3>
          </div>
        </div>

        <div className="p-3 bg-red-50 border-2 border-red-600 space-y-2 text-xs">
          <div>
            <span className="font-black text-red-900 uppercase block">OBJEK YANG DILARANG:</span>
            <span className="font-mono text-sm font-black text-red-700 bg-white px-2 py-0.5 border border-red-600 inline-block mt-0.5">
              ⚠️ {safetyAlert.hazardName}
            </span>
          </div>
          <div>
            <span className="font-black text-red-900 uppercase block">PENJELASAN EDUKATIF AI:</span>
            <p className="text-red-800 leading-relaxed mt-0.5">
              {safetyAlert.warningMessage}
            </p>
          </div>
        </div>

        <p className="text-[11px] text-zinc-600 leading-normal">
          Demi kepatuhan kurikulum dan keselamatan lingkungan sekolah, LinguaQuest menolak memproses benda tajam, rokok/api, atau benda berbahaya lainnya. Silakan ganti dengan benda aman di mejamu (buku, pensil, botol minum, dll.).
        </p>

        <div className="pt-2 flex justify-end">
          <button
            onClick={onAcknowledge}
            className="brutal-btn-yellow px-6 py-3 text-xs font-mono font-black uppercase border-2 border-black shadow-[3px_3px_0px_#000000]"
          >
            [ SAYA MENGERTI — SCAN BENDA AMAN LAINNYA ]
          </button>
        </div>
      </div>
    </div>
  );
}
