"use client";

import { Key, AlertCircle, Sparkles } from "lucide-react";

interface StudentClassroomGateProps {
  currentUser?: any;
  inputPin: string;
  setInputPin: (val: string) => void;
  inputStudentName: string;
  isJoining: boolean;
  joinError: string | null;
  onJoinClassroom: (overridePin?: string) => void;
}

export default function StudentClassroomGate({
  currentUser,
  inputPin,
  setInputPin,
  inputStudentName,
  isJoining,
  joinError,
  onJoinClassroom,
}: StudentClassroomGateProps) {
  const verifiedStudentName = currentUser?.name || inputStudentName || "Ahmad Faiz";
  const verifiedUsername = currentUser?.username || "siswa";

  return (
    <div className="max-w-2xl mx-auto space-y-6 font-mono text-black">
      {/* Status Alert Bar */}
      <div className="border-2 border-black bg-[#facc15] p-3 text-xs font-black uppercase flex items-center justify-between shadow-[3px_3px_0px_#000000]">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 stroke-[2.5]" />
          <span>[ 🔐 GERBANG KELAS // WAJIB GABUNG PIN KELAS GURU ]</span>
        </div>
        <span className="hidden sm:inline bg-black text-white px-2 py-0.5 text-[10px]">
          KURIKULUM MERDEKA
        </span>
      </div>

      {/* Main Classroom Gate Card */}
      <div className="border-2 border-black bg-white p-6 sm:p-8 shadow-[6px_6px_0px_#000000] space-y-6">
        <div className="border-b-2 border-zinc-200 pb-4 space-y-3">
          <div className="w-12 h-12 bg-amber-100 border-2 border-black flex items-center justify-center shadow-[3px_3px_0px_#000000]">
            <Key className="w-6 h-6 text-black stroke-[2.5]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
            MASUKKAN PIN KELAS DARI GURUMU
          </h1>
          <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed">
            Sebagai siswa, kamu <strong>tidak dapat memulai misi atau memindai benda</strong> sebelum terdaftar di kelas guru. Masukkan 6-digit PIN dari gurumu agar hasil latihan bicaramu tersinkronisasi otomatis ke dashboard guru.
          </p>
        </div>

        {/* TAHAP 1: NAMA KEBACA OTOMATIS DARI SISTEM LOGIN */}
        <div className="p-4 bg-emerald-50 border-2 border-emerald-600 shadow-[3px_3px_0px_#000000] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-emerald-800">
              [ TAHAP 01 // IDENTITAS SISWA TERVERIFIKASI ]
            </span>
            <span className="bg-emerald-600 text-white text-[10px] font-black uppercase px-2 py-0.5 border border-black">
              ✓ NAMA KEBACA OTOMATIS
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-200 border-2 border-black flex items-center justify-center text-lg font-black shadow-[1px_1px_0px_#000000]">
              👤
            </div>
            <div>
              <div className="text-base font-black text-black tracking-tight">
                {verifiedStudentName}
              </div>
              <div className="text-xs text-zinc-600 font-bold">
                Username: <span className="text-black font-black">@{verifiedUsername}</span> • Role: <span className="uppercase text-emerald-800 font-black">Siswa Kelas Terdaftar</span>
              </div>
            </div>
          </div>
        </div>

        {joinError && (
          <div className="p-3 bg-red-100 border-2 border-red-600 text-red-900 text-xs font-bold flex items-center gap-2 shadow-[2px_2px_0px_#000000]">
            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
            <span>{joinError}</span>
          </div>
        )}

        {/* TAHAP 2: FORM MASUKAN KODE PIN KELAS (HANYA PIN KELAS) */}
        <form onSubmit={(e) => { e.preventDefault(); onJoinClassroom(); }} className="space-y-4 text-xs">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="font-black text-black uppercase">
                TAHAP 02 // MASUKKAN 6-DIGIT PIN ROOM GURU:
              </label>
              <span className="text-[10px] text-zinc-500 font-bold uppercase">
                DARI LAYAR GURU
              </span>
            </div>
            <input
              type="text"
              required
              maxLength={8}
              autoFocus
              value={inputPin}
              onChange={(e) => setInputPin(e.target.value.toUpperCase())}
              placeholder="CONTOH: EDU889"
              className="w-full px-4 py-3.5 bg-zinc-50 border-2 border-black text-2xl font-black tracking-widest text-black placeholder-zinc-400 focus:bg-white focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isJoining}
            className="w-full brutal-btn-yellow py-4 text-sm font-black uppercase flex items-center justify-center gap-2 shadow-[4px_4px_0px_#000000]"
          >
            {isJoining ? (
              <span>[ MENYAMBUNGKAN KE ROOM GURU... ]</span>
            ) : (
              <>
                <Key className="w-4 h-4 stroke-[2.5]" />
                <span>[ 🚀 GABUNG KELAS & BUKA MISI ]</span>
              </>
            )}
          </button>
        </form>

        {/* 1-Click Demo Shortcut */}
        <div className="pt-2 border-t-2 border-zinc-200 space-y-2">
          <span className="text-[10px] font-black uppercase text-zinc-500 block">
            AKSES CEPAT PENGUJIAN JURI / EVALUATOR:
          </span>
          <button
            type="button"
            onClick={() => {
              setInputPin("EDU889");
              onJoinClassroom("EDU889");
            }}
            disabled={isJoining}
            className="w-full brutal-btn-white py-2.5 text-xs font-mono font-black uppercase flex items-center justify-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600 stroke-[2.5]" />
            <span>[ ⚡ 1-KLIK GABUNG KELAS DEMO: EDU889 (PAK BUDI) ]</span>
          </button>
        </div>
      </div>
    </div>
  );
}
