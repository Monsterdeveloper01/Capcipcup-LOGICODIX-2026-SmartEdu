"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Key, UserCheck, AlertCircle, Sparkles } from "lucide-react";
import Link from "next/link";

export default function RoomJoinPage() {
  const router = useRouter();

  const [roomCode, setRoomCode] = useState("");
  const [studentName, setStudentName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim() || !studentName.trim()) return;

    setIsLoading(true);
    setErrorMsg(null);

    const cleanCode = roomCode.trim().toUpperCase();

    try {
      const res = await fetch(`/api/teacher/room/${cleanCode}`);
      const data = await res.json();

      if (!res.ok || !data.quest) {
        throw new Error(data.error || "Room dengan PIN tersebut tidak ditemukan.");
      }

      const questId = data.quest.id;
      const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

      router.push(`/play/${questId}?subId=${subId}&name=${encodeURIComponent(studentName.trim())}`);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal masuk ke room.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen brutal-grid text-white font-mono p-4 sm:p-6 lg:p-8 flex items-center justify-center">
      <div className="max-w-md w-full space-y-6">
        <Link
          href="/"
          className="brutal-btn-dark px-3 py-1.5 text-xs font-black inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>[ KEMBALI KE HOME ]</span>
        </Link>

        {/* Card */}
        <div className="border-4 border-black dark:border-white bg-[#111317] p-6 sm:p-8 shadow-[8px_8px_0px_#000000] dark:shadow-[8px_8px_0px_#facc15] space-y-5">
          <div className="space-y-1 border-b-2 border-zinc-800 pb-3">
            <span className="text-[10px] font-black uppercase text-[#facc15]">
              [PORTAL MASUK KELAS // SISWA]
            </span>
            <h1 className="text-2xl font-black text-white uppercase tracking-tight">
              GABUNG ROOM GURU
            </h1>
            <p className="text-xs text-zinc-300">
              Masukkan 6-digit PIN yang ditampilkan guru di layar proyektor kelas.
            </p>
          </div>

          {/* Quick Fill Button */}
          <button
            type="button"
            onClick={() => {
              setRoomCode("EDU889");
              setStudentName("Faiz Ramadhan");
            }}
            className="w-full brutal-btn-dark py-2 text-xs font-black uppercase flex items-center justify-center gap-1 text-[#facc15]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>[ ⚡ 1-KLIK ISI DEMO PIN: EDU889 ]</span>
          </button>

          {errorMsg && (
            <div className="p-3 bg-red-950 border-2 border-red-700 text-red-200 text-xs font-black flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleJoin} className="space-y-4 text-xs">
            <div>
              <label className="font-black text-zinc-300 block mb-1 uppercase">
                6-Digit PIN Room Guru:
              </label>
              <input
                type="text"
                required
                maxLength={8}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="CONTOH: EDU889"
                className="w-full px-4 py-3 bg-black border-2 border-white text-[#facc15] font-mono text-lg font-black tracking-widest uppercase focus:border-[#facc15] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-black text-zinc-300 block mb-1 uppercase">
                Nama Lengkap Siswa:
              </label>
              <input
                type="text"
                required
                value={studentName}
                onChange={(e) => setStudentName(e.target.value)}
                placeholder="Contoh: Ahmad Faiz"
                className="w-full px-4 py-3 bg-black border-2 border-white text-white font-mono focus:border-[#facc15] focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full brutal-btn-yellow py-3.5 text-xs sm:text-sm font-black uppercase flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>[ MEMERIKSA ROOM DI MARIADB... ]</span>
              ) : (
                <>
                  <span>[ MASUK KE ARENA SEKARANG ]</span>
                  <ArrowRight className="w-4 h-4 stroke-[3]" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

