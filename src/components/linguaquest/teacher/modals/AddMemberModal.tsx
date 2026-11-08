"use client";

import { X, UserPlus } from "lucide-react";
import { ClassroomItem, AvailableStudentItem } from "../types";

interface Props {
  selectedClass: ClassroomItem | null;
  availableStudents: AvailableStudentItem[];
  isAddingMember: boolean;
  onAddStudent: (student: AvailableStudentItem) => void;
  onClose: () => void;
}

export default function AddMemberModal({
  selectedClass,
  availableStudents,
  isAddingMember,
  onAddStudent,
  onClose,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 font-mono">
      <div className="border-4 border-black bg-white max-w-lg w-full p-6 shadow-[8px_8px_0px_#000000] space-y-4 text-black">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div>
            <span className="text-[10px] font-black uppercase bg-[#22d3ee] px-2 py-0.5 border border-black">
              [MANUAL ENROLLMENT]
            </span>
            <h3 className="text-base font-black uppercase text-black mt-1">
              Tambahkan Siswa ke {selectedClass?.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-black text-white hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-600">
          Pilih siswa terdaftar di database sekolah untuk langsung dimasukkan ke dalam kelas ini tanpa perlu siswa mengetik PIN:
        </p>

        <div className="max-h-64 overflow-y-auto space-y-2 border-2 border-black p-2 bg-zinc-50">
          {availableStudents.length === 0 ? (
            <div className="p-4 text-center text-xs text-zinc-500 font-bold uppercase">
              Semua siswa terdaftar sudah bergabung di kelas ini.
            </div>
          ) : (
            availableStudents.map((s) => (
              <div
                key={s.userId}
                className="p-2.5 bg-white border border-black flex items-center justify-between text-xs hover:bg-yellow-50"
              >
                <div>
                  <span className="font-black text-black block">{s.studentName}</span>
                  <span className="text-[11px] text-zinc-500">@{s.studentUsername} • {s.email}</span>
                </div>
                <button
                  type="button"
                  disabled={isAddingMember}
                  onClick={() => onAddStudent(s)}
                  className="brutal-btn-yellow px-3 py-1 text-xs font-black uppercase flex items-center gap-1"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>[ + MASUKKAN ]</span>
                </button>
              </div>
            ))
          )}
        </div>

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="brutal-btn-white px-5 py-2 text-xs font-black uppercase"
          >
            [ TUTUP ]
          </button>
        </div>
      </div>
    </div>
  );
}
