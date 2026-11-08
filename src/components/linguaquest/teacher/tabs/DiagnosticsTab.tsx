"use client";

import { ClassMisconceptionItem } from "@/lib/linguaquest/types";

interface Props {
  misconceptions: ClassMisconceptionItem[];
}

export default function DiagnosticsTab({ misconceptions }: Props) {
  return (
    <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-200 pb-3">
        <div>
          <span className="font-mono text-xs font-black uppercase text-red-700">
            [ANALISIS DIAGNOSTIK KELEMAHAN KOLEKTIF KELAS]
          </span>
          <h2 className="font-black text-xl text-black uppercase tracking-tight">
            Pola Kesalahan Umum & Rekomendasi Remedial
          </h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {misconceptions.map((item) => (
          <div key={item.id} className="border-2 border-black bg-zinc-50 p-4 space-y-3 font-mono">
            <div className="flex items-center justify-between">
              <span className="px-2 py-0.5 bg-black text-white text-[10px] font-black uppercase">
                {item.category}
              </span>
              <span className="text-xs font-bold text-red-700">
                {item.affectedPercentage}% Siswa Terdampak
              </span>
            </div>
            <h4 className="font-black text-sm text-black uppercase">{item.errorDescription}</h4>
            <div className="p-2 bg-red-100 border border-red-400 text-xs text-red-900">
              <span className="font-bold">Contoh Salah:</span> "{item.exampleMistake}"
            </div>
            <div className="p-2 bg-emerald-100 border border-emerald-400 text-xs text-emerald-900">
              <span className="font-bold">Bentuk Benar:</span> "{item.correctForm}"
            </div>
            <p className="text-[11px] text-zinc-600 italic">
              💡 Saran Guru: {item.recommendedWarmup}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
