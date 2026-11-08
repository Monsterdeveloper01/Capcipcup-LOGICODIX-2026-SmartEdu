"use client";

import { Plus, BookOpen, Pencil, Trash2 } from "lucide-react";
import { ClassroomItem, TeacherRoomItem } from "../types";

interface Props {
  selectedClass: ClassroomItem | null;
  rooms: TeacherRoomItem[];
  isLoadingRooms: boolean;
  onGoToBuilder: () => void;
  onOpenEditModal: (room: TeacherRoomItem) => void;
  onOpenDeleteModal: (room: TeacherRoomItem) => void;
}

export default function ClassroomTasksTab({
  selectedClass,
  rooms,
  isLoadingRooms,
  onGoToBuilder,
  onOpenEditModal,
  onOpenDeleteModal,
}: Props) {
  return (
    <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-zinc-200 pb-4">
        <div>
          <span className="text-xs font-black uppercase text-cyan-800">
            [DAFTAR TUGAS // KELAS: {selectedClass?.name}]
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-black uppercase tracking-tight">
            Misi Speaking & Kuis Terstruktur ({rooms.length} Tugas)
          </h2>
          <p className="text-xs text-zinc-600 mt-0.5">
            Siswa di kelas ini dapat memilih dan mengerjakan tugas-tugas di bawah ini.
          </p>
        </div>

        <button
          onClick={onGoToBuilder}
          className="brutal-btn-yellow px-4 py-2.5 text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>[ + BUAT TUGAS BARU ]</span>
        </button>
      </div>

      {isLoadingRooms ? (
        <div className="py-12 text-center font-mono text-xs font-black uppercase">
          [ MEMUAT DAFTAR TUGAS KELAS... ]
        </div>
      ) : rooms.length === 0 ? (
        <div className="p-12 text-center border-2 border-dashed border-zinc-300 space-y-3 font-mono">
          <BookOpen className="w-10 h-10 mx-auto text-zinc-400 stroke-[1.5]" />
          <p className="text-xs font-bold text-zinc-600">
            Belum ada tugas yang ditugaskan di kelas ini.
          </p>
          <button
            onClick={onGoToBuilder}
            className="brutal-btn-yellow px-5 py-2.5 text-xs font-black uppercase inline-flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>[ BUAT TUGAS PERTAMA SEKARANG ]</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {rooms.map((room, idx) => (
            <div
              key={room.id}
              className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000000] flex flex-col justify-between space-y-4 hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-black text-[#facc15] border border-black">
                      #{idx + 1}
                    </span>
                    {room.taskType === "QUIZ_ONLY" ? (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-blue-100 text-blue-900 border border-blue-800">
                        📝 Hanya Kuis Saja
                      </span>
                    ) : room.taskType === "LISTENING_ONLY" ? (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-cyan-100 text-cyan-900 border border-cyan-800">
                        🎧 Kuis & Listening
                      </span>
                    ) : room.taskType === "SPEAKING_ONLY" ? (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-100 text-emerald-900 border border-emerald-800">
                        🎙️ Speaking Only
                      </span>
                    ) : (
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-amber-100 text-amber-900 border border-amber-800">
                        ⚡ Speaking + Kuis
                      </span>
                    )}
                  </div>
                  <span className="text-xs font-black uppercase text-zinc-500">
                    CEFR: [{room.difficultyLevel}]
                  </span>
                </div>

                <div>
                  <h3 className="text-base font-black text-black uppercase leading-tight line-clamp-2">
                    {room.title}
                  </h3>
                  {room.caseStudyStory && (
                    <p className="text-xs text-zinc-600 line-clamp-2 mt-1 leading-relaxed">
                      {room.caseStudyStory}
                    </p>
                  )}
                </div>

                <div className="p-2.5 bg-zinc-50 border border-black text-xs flex items-center justify-between">
                  <span className="text-zinc-600 font-bold">
                    NPC: <strong>{room.npcName || "Mr. Arthur"}</strong>
                  </span>
                  <span className="font-black text-emerald-800">
                    {room.speakingCount || room.submissionsCount || 0} Siswa Selesai
                  </span>
                </div>
              </div>

              {/* Actions Bar */}
              <div className="pt-3 border-t-2 border-zinc-200 flex items-center gap-2 font-mono">
                <button
                  onClick={() => onOpenEditModal(room)}
                  className="flex-1 brutal-btn-cyan py-2 text-xs font-black uppercase flex items-center justify-center gap-1.5"
                  title="Edit Judul, Skenario, dan Soal Kuis"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>[ ✏️ EDIT TUGAS ]</span>
                </button>
                <button
                  onClick={() => onOpenDeleteModal(room)}
                  className="px-3.5 py-2 border-2 border-red-700 bg-red-100 hover:bg-red-200 text-red-900 text-xs font-black uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_#000000] transition-colors"
                  title="Hapus Tugas Kelas"
                >
                  <Trash2 className="w-3.5 h-3.5 text-red-700" />
                  <span>[ HAPUS ]</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

