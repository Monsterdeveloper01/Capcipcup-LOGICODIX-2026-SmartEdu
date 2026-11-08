"use client";

import { GraduationCap, BookOpen, LogOut, RotateCcw, Camera, ArrowRight } from "lucide-react";
import { ActiveClassroom } from "../types";

interface StudentTaskCatalogProps {
  activeClassroom: ActiveClassroom;
  classTasks: any[];
  isLoadingTasks: boolean;
  pokedexCount: number;
  onOpenPokedex: () => void;
  onLeaveClassroom: () => void;
  onRefreshTasks: () => void;
  onSelectTask: (task: any) => void;
}

export default function StudentTaskCatalog({
  activeClassroom,
  classTasks,
  isLoadingTasks,
  pokedexCount,
  onOpenPokedex,
  onLeaveClassroom,
  onRefreshTasks,
  onSelectTask,
}: StudentTaskCatalogProps) {
  return (
    <div className="max-w-4xl mx-auto space-y-6 font-mono text-black">
      {/* Active Class Header */}
      <div className="border-2 border-black bg-white p-4 shadow-[4px_4px_0px_#000000] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#facc15] border-2 border-black shadow-[2px_2px_0px_#000000]">
            <GraduationCap className="w-6 h-6 text-black stroke-[2.5]" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-emerald-800 block">
              [ 🎓 KELAS AKTIF TERHUBUNG ]
            </span>
            <h3 className="font-black text-lg text-black uppercase">
              PIN: [{activeClassroom.roomCode}] • GURU: {activeClassroom.creatorName}
            </h3>
            <p className="text-xs text-cyan-800 font-bold">
              Target CEFR: {activeClassroom.difficultyLevel || "B1"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenPokedex}
            className="brutal-btn-yellow px-3.5 py-2 text-xs font-mono font-black flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>🎒 BUKU KOLEKSI ({pokedexCount})</span>
          </button>
          <button
            type="button"
            onClick={onLeaveClassroom}
            className="brutal-btn-white px-3.5 py-2 text-xs font-mono text-red-600 hover:text-red-800 font-black flex items-center gap-1"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>[ KELUAR KELAS ]</span>
          </button>
        </div>
      </div>

      {/* Classroom Tasks Catalog */}
      <div className="border-2 border-black bg-white p-6 shadow-[6px_6px_0px_#000000] space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-200 pb-4">
          <div>
            <span className="text-xs font-black uppercase text-amber-800 block">
              [KATALOG TUGAS KELAS // KURIKULUM MERDEKA]
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight">
              Tugas & Misi Speaking ({classTasks.length} Misi Aktif)
            </h2>
            <p className="text-xs text-zinc-600 mt-0.5">
              Pilih salah satu misi di bawah ini untuk memulai latihan percakapan dengan penguji AI.
            </p>
          </div>

          <button
            type="button"
            onClick={onRefreshTasks}
            className="brutal-btn-white px-3 py-1.5 text-xs font-black uppercase flex items-center gap-1.5"
            title="Muat ulang daftar tugas"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isLoadingTasks ? "animate-spin" : ""}`} />
            <span>[ REFRESH TUGAS ]</span>
          </button>
        </div>

        {isLoadingTasks ? (
          <div className="py-12 text-center text-xs font-black uppercase">
            [ MEMUAT DAFTAR TUGAS DARI GURU... ]
          </div>
        ) : classTasks.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-zinc-300 p-6 space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-zinc-400" />
            <p className="text-xs font-bold text-zinc-600">
              Guru belum menugaskan misi speaking di kelas ini.
            </p>
            <p className="text-[11px] text-zinc-500">
              Silakan tunggu atau minta gurumu untuk menerbitkan tugas di kelas ini.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {classTasks.map((task, idx) => (
              <div
                key={task.id}
                className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000000] flex flex-col justify-between space-y-4 hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-black text-[#facc15] border border-black">
                      TUGAS #{idx + 1} • CEFR: {task.difficultyLevel || task.difficulty_level || "B1"}
                    </span>
                    {task.isCompleted ? (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-700">
                        ✅ SELESAI ({task.studentScore}/100)
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-700">
                        ⏳ BELUM DIKERJAKAN
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-base font-black text-black uppercase leading-tight line-clamp-2">
                      {task.title}
                    </h3>
                    {(task.caseStudyStory || task.case_study_story) && (
                      <p className="text-xs text-zinc-600 line-clamp-2 mt-1 leading-relaxed">
                        {task.caseStudyStory || task.case_study_story}
                      </p>
                    )}
                  </div>

                  <div className="p-2.5 bg-zinc-50 border border-black text-xs space-y-1">
                    <div className="text-zinc-700 font-bold">
                      NPC: <span className="text-black font-black">{task.npcName || task.npc_name || "Mr. Arthur"}</span>
                    </div>
                    <div className="text-cyan-800 font-bold truncate">
                      Scan: {task.requiredObjectHint || task.required_object_hint || "Benda fisik di meja"}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => onSelectTask(task)}
                    className={`w-full py-3 text-xs font-black uppercase flex items-center justify-center gap-2 shadow-[2px_2px_0px_#000000] ${
                      task.isCompleted ? "brutal-btn-cyan" : "brutal-btn-yellow"
                    }`}
                  >
                    <Camera className="w-4 h-4 stroke-[2.5]" />
                    <span>{task.isCompleted ? "[ 🔄 KERJAKAN ULANG MISI ]" : "[ 🚀 KERJAKAN MISI INI ]"}</span>
                    <ArrowRight className="w-3.5 h-3.5 stroke-[3]" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
