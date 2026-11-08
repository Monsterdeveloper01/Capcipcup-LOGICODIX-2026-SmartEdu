"use client";

import { Monitor, Plus, Check, Copy, UserPlus, Trash2, Users } from "lucide-react";
import { ClassroomItem, ClassroomMemberItem } from "../types";

interface Props {
  classes: ClassroomItem[];
  selectedClass: ClassroomItem | null;
  classMembers: ClassroomMemberItem[];
  roomsCount: number;
  copiedPin: string | null;
  isLoadingMembers: boolean;
  onSelectClass: (c: ClassroomItem) => void;
  onCopyPin: (pin: string) => void;
  onOpenProjector: (c: ClassroomItem) => void;
  onOpenCreateClass: () => void;
  onOpenAddMember: () => void;
  onOpenKickMember: (m: ClassroomMemberItem) => void;
}

export default function ClassroomRosterTab({
  classes,
  selectedClass,
  classMembers,
  roomsCount,
  copiedPin,
  isLoadingMembers,
  onSelectClass,
  onCopyPin,
  onOpenProjector,
  onOpenCreateClass,
  onOpenAddMember,
  onOpenKickMember,
}: Props) {
  return (
    <div className="space-y-6">
      {/* Active Class Card & Switcher */}
      <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b-2 border-zinc-200 pb-4">
          <div>
            <span className="text-xs font-black text-cyan-800 uppercase tracking-wider block">
              [ KELAS YANG SEDANG DIAJAR ]
            </span>
            <div className="flex items-center gap-3 mt-1">
              <h2 className="text-xl sm:text-2xl font-black text-black uppercase">
                {selectedClass ? selectedClass.name : "Kelas Belum Dipilih"}
              </h2>
              {selectedClass && (
                <span className="px-2.5 py-1 text-xs font-black uppercase bg-emerald-100 text-emerald-900 border border-emerald-700">
                  STATUS: AKTIF
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-600 mt-1">
              Jenjang: <strong>{selectedClass?.gradeLevel || "Kelas 10 SMK"}</strong> • Tahun Ajaran: <strong>{selectedClass?.academicYear || "2026/2027"}</strong> • Guru: <strong>{selectedClass?.teacherName || "Budi Santoso, S.Pd"}</strong>
            </p>
          </div>

          {/* Action Buttons for Classroom */}
          <div className="flex flex-wrap items-center gap-2.5">
            {selectedClass && (
              <button
                type="button"
                onClick={() => onOpenProjector(selectedClass)}
                className="brutal-btn-yellow px-4 py-2.5 text-xs font-black uppercase flex items-center gap-2 shadow-[2px_2px_0px_#000000]"
              >
                <Monitor className="w-4 h-4" />
                <span>[ 🖥️ PROYEKTOR PIN KELAS ]</span>
              </button>
            )}

            <button
              type="button"
              onClick={onOpenCreateClass}
              className="brutal-btn-white px-4 py-2.5 text-xs font-black uppercase flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>[ + BUAT KELAS BARU ]</span>
            </button>
          </div>
        </div>

        {/* Big PIN Bar */}
        {selectedClass && (
          <div className="p-4 bg-zinc-50 border-2 border-black flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-black text-zinc-600 uppercase">
                KODE / PIN MASUK KELAS UNTUK SISWA:
              </span>
              <div className="flex items-center gap-2">
                <span className="text-2xl sm:text-3xl font-black tracking-widest bg-[#facc15] text-black px-4 py-1 border-2 border-black shadow-[2px_2px_0px_#000000]">
                  {selectedClass.classCode}
                </span>
                <button
                  onClick={() => onCopyPin(selectedClass.classCode)}
                  className="brutal-btn-white px-3 py-1.5 text-xs font-bold uppercase flex items-center gap-1"
                  title="Salin PIN ke Clipboard"
                >
                  {copiedPin === selectedClass.classCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 font-black">TERSALIN!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>SALIN PIN</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-bold text-zinc-700">
              <span>👥 <strong>{classMembers.length}</strong> Siswa Terdaftar</span>
              <span>📚 <strong>{roomsCount}</strong> Tugas Speaking Aktif</span>
            </div>
          </div>
        )}

        {/* Classrooms Switcher if Multiple */}
        {classes.length > 1 && (
          <div className="flex items-center gap-2 pt-2 text-xs">
            <span className="font-bold text-zinc-600 uppercase">Ganti Kelas:</span>
            <div className="flex flex-wrap gap-2">
              {classes.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelectClass(c)}
                  className={`px-3 py-1 font-mono text-xs font-bold uppercase border border-black ${
                    selectedClass?.id === c.id ? "bg-[#facc15] font-black" : "bg-white"
                  }`}
                >
                  [{c.classCode}] {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Roster Murid yang Bergabung */}
      <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-200 pb-3">
          <div>
            <span className="text-xs font-black text-cyan-800 uppercase tracking-wider block">
              [ ROSTER ANGGOTA KELAS ]
            </span>
            <h3 className="text-lg font-black uppercase text-black">
              Daftar Siswa yang Tergabung ({classMembers.length} Murid)
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenAddMember}
              className="brutal-btn-cyan px-4 py-2 text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>[ ➕ TAMBAH SISWA MANUAL ]</span>
            </button>
          </div>
        </div>

        {isLoadingMembers ? (
          <div className="py-12 text-center text-xs font-black uppercase">
            [ MEMUAT DATA SISWA KELAS... ]
          </div>
        ) : classMembers.length === 0 ? (
          <div className="py-12 text-center border-2 border-dashed border-zinc-300 p-6 space-y-2">
            <Users className="w-8 h-8 mx-auto text-zinc-400" />
            <p className="text-xs font-bold text-zinc-600">
              Belum ada murid yang bergabung di kelas ini.
            </p>
            <p className="text-[11px] text-zinc-500">
              Bagikan PIN <strong>[{selectedClass?.classCode}]</strong> ke siswa atau klik tombol <strong>[+ Tambah Siswa Manual]</strong> di atas.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto border-2 border-black">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#facc15] border-b-2 border-black text-black font-black uppercase">
                  <th className="p-3 border-r border-black w-12 text-center">NO</th>
                  <th className="p-3 border-r border-black">NAMA SISWA</th>
                  <th className="p-3 border-r border-black">USERNAME & EMAIL</th>
                  <th className="p-3 border-r border-black text-center">TUGAS SELESAI</th>
                  <th className="p-3 border-r border-black">STATUS</th>
                  <th className="p-3 text-center w-36">AKSI GURU</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black font-mono">
                {classMembers.map((m, idx) => (
                  <tr key={m.memberId || idx} className="hover:bg-yellow-50 transition-colors">
                    <td className="p-3 border-r border-black text-center font-bold">{idx + 1}</td>
                    <td className="p-3 border-r border-black font-black text-black">
                      {m.studentName}
                    </td>
                    <td className="p-3 border-r border-black text-zinc-600">
                      @{m.studentUsername} {m.email ? `• ${m.email}` : ""}
                    </td>
                    <td className="p-3 border-r border-black text-center font-bold text-emerald-800">
                      {m.completedTasksCount || 0} / {roomsCount} Misi
                    </td>
                    <td className="p-3 border-r border-black">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-black uppercase border border-emerald-600">
                        TERDAFTAR
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={() => onOpenKickMember(m)}
                        className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 border border-red-700 text-[11px] font-black uppercase flex items-center gap-1 mx-auto transition-colors"
                        title="Keluarkan siswa dari kelas ini"
                      >
                        <Trash2 className="w-3 h-3 text-red-700" />
                        <span>[ KICK ]</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

