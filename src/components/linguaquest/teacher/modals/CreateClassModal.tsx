"use client";

import { X, Check } from "lucide-react";

interface Props {
  isOpen: boolean;
  className: string;
  classPin: string;
  gradeLevel: string;
  isCreating: boolean;
  onClassNameChange: (val: string) => void;
  onClassPinChange: (val: string) => void;
  onGradeLevelChange: (val: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function CreateClassModal({
  isOpen,
  className,
  classPin,
  gradeLevel,
  isCreating,
  onClassNameChange,
  onClassPinChange,
  onGradeLevelChange,
  onSubmit,
  onClose,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 font-mono">
      <div className="border-4 border-black bg-white max-w-md w-full p-6 shadow-[8px_8px_0px_#000000] space-y-4 text-black">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div>
            <span className="text-[10px] font-black uppercase bg-[#facc15] px-2 py-0.5 border border-black">
              [KELAS BARU]
            </span>
            <h3 className="text-base font-black uppercase text-black mt-1">
              Buat Rombongan Belajar Kelas Baru
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 bg-black text-white hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="font-black uppercase block mb-1">
              Nama Kelas:
            </label>
            <input
              type="text"
              required
              value={className}
              onChange={(e) => onClassNameChange(e.target.value)}
              placeholder="Contoh: Kelas 11 Pemasaran 1"
              className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-hidden font-bold"
            />
          </div>

          <div>
            <label className="font-black uppercase block mb-1">
              Kustom PIN Kelas (Opsional, kosongkan untuk acak):
            </label>
            <input
              type="text"
              maxLength={10}
              value={classPin}
              onChange={(e) => onClassPinChange(e.target.value.toUpperCase())}
              placeholder="Contoh: PM101"
              className="w-full border-2 border-black p-2 font-mono text-xs uppercase bg-white outline-hidden"
            />
          </div>

          <div>
            <label className="font-black uppercase block mb-1">
              Tingkat Jenjang:
            </label>
            <select
              value={gradeLevel}
              onChange={(e) => onGradeLevelChange(e.target.value)}
              className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-hidden font-bold"
            >
              <option value="Kelas 10 SMK">Kelas 10 SMK</option>
              <option value="Kelas 11 SMK">Kelas 11 SMK</option>
              <option value="Kelas 12 SMK">Kelas 12 SMK</option>
              <option value="Kelas 10 SMA">Kelas 10 SMA</option>
              <option value="Kelas 11 SMA">Kelas 11 SMA</option>
              <option value="Kelas 12 SMA">Kelas 12 SMA</option>
            </select>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="brutal-btn-white px-4 py-2 text-xs font-black uppercase"
            >
              [ BATAL ]
            </button>
            <button
              type="submit"
              disabled={isCreating}
              className="brutal-btn-yellow px-5 py-2 text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
            >
              <Check className="w-3.5 h-3.5 stroke-[3]" />
              <span>{isCreating ? "[ MENYIMPAN... ]" : "[ SIMPAN KELAS ]"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
