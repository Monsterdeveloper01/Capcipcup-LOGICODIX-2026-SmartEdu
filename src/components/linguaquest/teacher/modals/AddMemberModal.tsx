"use client";

import { useState, useMemo, useEffect } from "react";
import { X, UserPlus, Search } from "lucide-react";
import { ClassroomItem, AvailableStudentItem } from "../types";

interface Props {
  isOpen: boolean;
  selectedClass: ClassroomItem | null;
  availableStudents: AvailableStudentItem[];
  isAddingMember: boolean;
  onAddStudent: (student: AvailableStudentItem) => void;
  onClose: () => void;
}

export default function AddMemberModal({
  isOpen,
  selectedClass,
  availableStudents,
  isAddingMember,
  onAddStudent,
  onClose,
}: Props) {
  const [searchQuery, setSearchQuery] = useState("");

  // Reset query whenever modal is closed
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen]);

  // Cari 5 siswa yang paling relevan berdasarkan nama, username, atau email
  const matchingStudents = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    return availableStudents
      .map((s) => {
        const name = (s.studentName || "").toLowerCase();
        const username = (s.studentUsername || "").toLowerCase();
        const email = (s.email || "").toLowerCase();

        let score = 0;
        if (name === q || username === q) score += 100;
        else if (name.startsWith(q) || username.startsWith(q)) score += 50;
        else if (name.includes(` ${q}`) || name.includes(q)) score += 30;
        else if (username.includes(q)) score += 20;
        else if (email.includes(q)) score += 10;

        return { student: s, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((item) => item.student);
  }, [searchQuery, availableStudents]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 font-mono">
      <div className="border-4 border-black bg-white max-w-lg w-full p-6 shadow-[8px_8px_0px_#000000] space-y-4 text-black">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div>
            <span className="text-[10px] font-black uppercase bg-[#22d3ee] px-2 py-0.5 border border-black">
              [MANUAL ENROLLMENT // CARI SISWA]
            </span>
            <h3 className="text-base font-black uppercase text-black mt-1">
              Tambahkan Siswa ke {selectedClass?.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-black text-white hover:bg-zinc-800"
            title="Tutup Modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-600">
          Ketik nama siswa yang ingin ditambahkan. Sistem akan mencari <strong>maksimal 5 siswa yang paling cocok</strong> dari database sekolah:
        </p>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
          <input
            type="text"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Ketik nama atau username siswa..."
            className="w-full pl-9 pr-9 py-2.5 bg-zinc-50 border-2 border-black text-xs font-mono text-black placeholder-zinc-400 focus:outline-none focus:bg-white"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-2.5 text-zinc-400 hover:text-black"
              title="Hapus ketikan"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results Container */}
        <div className="max-h-64 overflow-y-auto space-y-2 border-2 border-black p-2 bg-zinc-50">
          {!searchQuery.trim() ? (
            <div className="p-8 text-center border-2 border-dashed border-zinc-300 bg-white space-y-2">
              <Search className="w-8 h-8 mx-auto text-zinc-400 stroke-[2]" />
              <p className="text-xs font-black uppercase text-black">
                KETIK NAMA ATAU USERNAME SISWA
              </p>
              <p className="text-[11px] text-zinc-600 max-w-xs mx-auto leading-relaxed">
                Silakan ketik pada kolom pencarian di atas. Sistem akan menampilkan 5 siswa yang paling cocok.
              </p>
            </div>
          ) : matchingStudents.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-600 font-bold bg-white border border-black space-y-1">
              <p className="uppercase">[ SISWA TIDAK DITEMUKAN ]</p>
              <p className="text-[11px] text-zinc-500 font-normal">
                Tidak ada siswa yang cocok dengan kata kunci "{searchQuery}" atau siswa sudah terdaftar di kelas ini.
              </p>
            </div>
          ) : (
            <>
              <div className="text-[10px] font-black uppercase text-zinc-600 px-1 pt-1 flex items-center justify-between">
                <span>[ 5 HASIL PALING COCOK ]:</span>
                <span className="text-emerald-700 font-black">{matchingStudents.length} SISWA DITEMUKAN</span>
              </div>
              {matchingStudents.map((s) => (
                <div
                  key={s.userId}
                  className="p-2.5 bg-white border-2 border-black flex items-center justify-between text-xs hover:bg-yellow-50 shadow-[2px_2px_0px_#000000] transition-all"
                >
                  <div className="space-y-0.5">
                    <span className="font-black text-black block">{s.studentName}</span>
                    <span className="text-[11px] text-zinc-600 font-bold">
                      @{s.studentUsername} {s.email ? `• ${s.email}` : ""}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={isAddingMember}
                    onClick={() => onAddStudent(s)}
                    className="brutal-btn-yellow px-3 py-1.5 text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>{isAddingMember ? "[ MENAMBAHKAN... ]" : "[ + MASUKKAN ]"}</span>
                  </button>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-2 flex items-center justify-between border-t border-zinc-200">
          <span className="text-[11px] text-zinc-500">
            {searchQuery.trim() ? `Menampilkan ${matchingStudents.length} dari 5 slot pencarian` : "Maksimal 5 siswa per pencarian"}
          </span>
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
