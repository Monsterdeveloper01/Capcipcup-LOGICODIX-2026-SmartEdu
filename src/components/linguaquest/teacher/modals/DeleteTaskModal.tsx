"use client";

import { AlertCircle, Trash2 } from "lucide-react";
import { TeacherRoomItem } from "../types";

interface Props {
  roomToDelete: TeacherRoomItem | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export default function DeleteTaskModal({
  roomToDelete,
  isDeleting,
  onConfirm,
  onClose,
}: Props) {
  if (!roomToDelete) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 font-mono">
      <div className="border-4 border-black bg-white max-w-md w-full p-6 shadow-[8px_8px_0px_#000000] space-y-4 text-black">
        <div className="flex items-center gap-2">
          <span className="p-2 bg-red-100 border-2 border-red-700 text-red-700">
            <AlertCircle className="w-5 h-5 stroke-[2.5]" />
          </span>
          <div>
            <span className="text-[10px] font-black uppercase text-red-700 tracking-wider block">
              [PERINGATAN HAPUS TUGAS]
            </span>
            <h2 className="text-base font-black uppercase text-black">
              Hapus Tugas dari Kelas?
            </h2>
          </div>
        </div>

        <div className="p-3.5 bg-red-50 border-2 border-red-700 text-xs text-red-950 space-y-1">
          <p>
            Anda akan menghapus tugas:
            <strong className="block text-black font-black mt-1">
              {roomToDelete.title}
            </strong>
          </p>
          <p className="text-[11px] text-red-800 leading-relaxed font-bold pt-1">
            ⚠️ Peringatan: Data nilai dan transkrip percakapan siswa pada tugas ini akan ikut terhapus dari database.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="brutal-btn-white px-4 py-2 text-xs font-black uppercase"
          >
            [ BATAL ]
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2 border-2 border-black bg-red-600 hover:bg-red-700 text-white text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? "[ MENGHAPUS... ]" : "[ YA, HAPUS PERMANEN ]"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

