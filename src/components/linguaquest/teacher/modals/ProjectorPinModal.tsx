"use client";

import { X } from "lucide-react";
import { ClassroomItem } from "../types";

interface Props {
  classroom: ClassroomItem | null;
  tasksCount: number;
  onClose: () => void;
}

export default function ProjectorPinModal({ classroom, tasksCount, onClose }: Props) {
  if (!classroom) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 font-mono">
      <div className="bg-white border-4 border-black w-full max-w-2xl shadow-[8px_8px_0px_#000000] p-6 sm:p-8 space-y-6 text-black text-center">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <span className="text-xs font-black uppercase bg-[#facc15] px-3 py-1 border border-black">
            [MODE PROYEKTOR KELAS // TEMBAKKAN KE LAYAR DEPAN]
          </span>
          <button
            onClick={onClose}
            className="p-1.5 bg-black text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-black uppercase text-zinc-500 block">
            MASUKKAN PIN INI DI HP / LAPTOP UNTUK GABUNG KE KELAS:
          </span>
          <div className="text-5xl sm:text-7xl font-black tracking-widest text-black bg-[#facc15] p-5 border-4 border-black shadow-[6px_6px_0px_#000000] inline-block">
            {classroom.classCode}
          </div>
        </div>

        <div className="p-4 bg-zinc-50 border-2 border-black text-left space-y-1.5 text-xs">
          <span className="font-black text-black uppercase block">Nama Rombongan Belajar:</span>
          <h3 className="text-base font-black text-black">{classroom.name}</h3>
          <p className="text-zinc-600 text-xs">
            Guru: <strong>{classroom.teacherName}</strong> • {tasksCount} Tugas Speaking Aktif Tersedia
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-left text-xs">
          <div className="p-3 bg-white border border-black space-y-1">
            <span className="font-black text-cyan-800 block">1. BUKA APLIKASI</span>
            <p className="text-[11px] text-zinc-600">Buka web di HP/laptop siswa.</p>
          </div>
          <div className="p-3 bg-white border border-black space-y-1">
            <span className="font-black text-amber-800 block">2. LOGIN AKUN</span>
            <p className="text-[11px] text-zinc-600">Nama siswa terbaca otomatis.</p>
          </div>
          <div className="p-3 bg-white border border-black space-y-1">
            <span className="font-black text-emerald-800 block">3. KETIK PIN</span>
            <p className="text-[11px] text-zinc-600">Ketik [{classroom.classCode}] & pilih tugas!</p>
          </div>
        </div>

        <div className="pt-2 flex justify-center">
          <button
            onClick={onClose}
            className="brutal-btn-yellow px-8 py-3 text-xs font-black uppercase shadow-[3px_3px_0px_#000000]"
          >
            [ TUTUP TAMPILAN PROYEKTOR ]
          </button>
        </div>
      </div>
    </div>
  );
}
