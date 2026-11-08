"use client";

import { AlertCircle, Trash2 } from "lucide-react";
import { ClassroomItem, ClassroomMemberItem } from "../types";

interface Props {
  member: ClassroomMemberItem | null;
  selectedClass: ClassroomItem | null;
  isKicking: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function KickMemberModal({
  member,
  selectedClass,
  isKicking,
  onConfirm,
  onClose,
}: Props) {
  if (!member) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 font-mono">
      <div className="border-4 border-black bg-white max-w-md w-full p-6 shadow-[8px_8px_0px_#000000] space-y-4 text-black">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-red-100 border-2 border-red-700 text-red-700">
            <AlertCircle className="w-5 h-5 stroke-[2.5]" />
          </span>
          <div>
            <span className="text-[10px] font-black uppercase text-red-700 tracking-wider block">
              [KONFIRMASI KICK MURID]
            </span>
            <h2 className="text-base font-black uppercase text-black">
              Keluarkan Siswa dari Kelas?
            </h2>
          </div>
        </div>

        <div className="p-3.5 bg-red-50 border-2 border-red-700 text-xs text-red-950 space-y-1">
          <p>
            Anda akan mengeluarkan siswa: <strong>{member.studentName} (@{member.studentUsername})</strong> dari rombongan belajar <strong>{selectedClass?.name}</strong>.
          </p>
          <p className="text-[11px] text-zinc-600 pt-1">
            Siswa tidak akan lagi memiliki akses ke tugas-tugas di kelas ini kecuali bergabung kembali dengan PIN.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isKicking}
            className="brutal-btn-white px-4 py-2 text-xs font-black uppercase"
          >
            [ BATAL ]
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isKicking}
            className="px-5 py-2 border-2 border-black bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isKicking ? "[ MENGELUARKAN... ]" : "[ YA, KICK SEKARANG ]"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

