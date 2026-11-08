"use client";

import { Download, Eye } from "lucide-react";
import { TeacherRoomItem } from "../types";
import { SpeakingEvaluation } from "@/lib/linguaquest/types";

interface Props {
  evaluations: SpeakingEvaluation[];
  rooms: TeacherRoomItem[];
  filterRoomCode: string;
  isLoadingHeatmap: boolean;
  onFilterChange: (val: string) => void;
  onExportCsv: () => void;
  onSelectEvaluation: (ev: SpeakingEvaluation) => void;
}

export default function GradebookTab({
  evaluations,
  rooms,
  filterRoomCode,
  isLoadingHeatmap,
  onFilterChange,
  onExportCsv,
  onSelectEvaluation,
}: Props) {
  return (
    <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-200 pb-3">
        <div>
          <span className="font-mono text-xs font-black uppercase text-cyan-800">
            [GRADEBOOK SPEAKING RESMI // SINKRONISASI DATABASE MARIADB]
          </span>
          <h2 className="font-black text-xl text-black uppercase tracking-tight">
            Rekap Nilai Speaking & Bukti Transkrip Siswa
          </h2>
        </div>

        <button
          onClick={onExportCsv}
          className="brutal-btn-yellow px-4 py-2 text-xs font-mono font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
        >
          <Download className="w-4 h-4" />
          <span>[ UNDUH REKAP CSV (E-RAPOR) ]</span>
        </button>
      </div>

      {/* Filter per Task */}
      <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
        <span className="font-bold text-zinc-600 uppercase">Filter Tugas:</span>
        <button
          onClick={() => onFilterChange("ALL")}
          className={`px-2.5 py-1 text-xs font-bold border border-black ${
            filterRoomCode === "ALL" ? "bg-black text-white" : "bg-white"
          }`}
        >
          SEMUA TUGAS ({evaluations.length})
        </button>
        {rooms.map((r) => (
          <button
            key={r.id}
            onClick={() => onFilterChange(r.roomCode)}
            className={`px-2.5 py-1 text-xs font-bold border border-black truncate max-w-xs ${
              filterRoomCode === r.roomCode ? "bg-black text-white" : "bg-white"
            }`}
          >
            {r.title}
          </button>
        ))}
      </div>

      {/* Table */}
      {isLoadingHeatmap ? (
        <div className="py-12 text-center text-xs font-black uppercase">
          [ MEMUAT DATA EVALUASI MARIADB... ]
        </div>
      ) : evaluations.length === 0 ? (
        <div className="py-12 text-center text-xs text-zinc-500 font-bold uppercase">
          [ BELUM ADA SESI EVALUASI SISWA YANG SELESAI ]
        </div>
      ) : (
        <div className="overflow-x-auto border-2 border-black">
          <table className="w-full text-left text-xs border-collapse font-mono">
            <thead>
              <tr className="bg-[#22d3ee] border-b-2 border-black text-black font-black uppercase">
                <th className="p-2.5 border-r border-black w-10 text-center">NO</th>
                <th className="p-2.5 border-r border-black">NAMA SISWA</th>
                <th className="p-2.5 border-r border-black">TUGAS / ROOM</th>
                <th className="p-2.5 border-r border-black text-center">CEFR</th>
                <th className="p-2.5 border-r border-black text-center">SKOR</th>
                <th className="p-2.5 border-r border-black text-center">FLUENCY</th>
                <th className="p-2.5 border-r border-black text-center">PRONUN</th>
                <th className="p-2.5 border-r border-black text-center">VOCAB</th>
                <th className="p-2.5 border-r border-black text-center">GRAMMAR</th>
                <th className="p-2.5 text-center">BUKTI EVALUASI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black font-mono">
              {evaluations.map((ev, idx) => (
                <tr key={ev.id || (ev as any).sessionId || idx} className="hover:bg-cyan-50">
                  <td className="p-2.5 border-r border-black text-center font-bold">{idx + 1}</td>
                  <td className="p-2.5 border-r border-black font-black">{ev.studentName}</td>
                  <td className="p-2.5 border-r border-black text-zinc-600 truncate max-w-xs">{ev.questTitle}</td>
                  <td className="p-2.5 border-r border-black text-center font-black bg-yellow-50">{ev.cefrLevel}</td>
                  <td className="p-2.5 border-r border-black text-center font-black text-base">{ev.overallScore}</td>
                  <td className="p-2.5 border-r border-black text-center">{ev.fluencyScore}%</td>
                  <td className="p-2.5 border-r border-black text-center">{ev.pronunciationScore}%</td>
                  <td className="p-2.5 border-r border-black text-center">{ev.vocabularyScore}%</td>
                  <td className="p-2.5 border-r border-black text-center">{ev.grammarScore}%</td>
                  <td className="p-2.5 text-center">
                    <button
                      onClick={() => onSelectEvaluation(ev)}
                      className="px-2.5 py-1 bg-black text-white hover:bg-zinc-800 text-[11px] font-bold uppercase inline-flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      <span>[ TRANSKRIP ]</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
