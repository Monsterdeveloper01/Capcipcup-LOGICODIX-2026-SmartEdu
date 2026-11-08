"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Users, Trophy, Play, RefreshCw, ArrowLeft, Terminal, Copy, Check, BarChart2 } from "lucide-react";
import Link from "next/link";

export default function TeacherLiveRoomPage() {
  const params = useParams();
  const roomCode = (params.code as string).toUpperCase();

  const [quest, setQuest] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchRoomData();
    const interval = setInterval(fetchRoomData, 5000); // Poll every 5s for live student submissions
    return () => clearInterval(interval);
  }, [roomCode]);

  const fetchRoomData = async () => {
    try {
      const res = await fetch(`/api/teacher/room/${roomCode}`);
      const data = await res.json();
      if (res.ok) {
        setQuest(data.quest);
        setSubmissions(data.submissions || []);
      }
    } catch (err) {
      console.warn("Polling room error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const copyRoomPin = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen brutal-grid text-white font-mono p-4 sm:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Refresh Bar */}
        <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-3">
          <Link
            href="/teacher/create"
            className="brutal-btn-dark px-3 py-1.5 text-xs font-black flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>[ BUAT ROOM LAIN ]</span>
          </Link>

          <button
            onClick={fetchRoomData}
            className="brutal-btn-dark px-3 py-1.5 text-xs font-black flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>[ REFRESH LIVE ]</span>
          </button>
        </div>

        {/* Big Projector PIN Banner */}
        <div className="border-4 border-black dark:border-white bg-[#111317] p-6 sm:p-8 shadow-[8px_8px_0px_#000000] dark:shadow-[8px_8px_0px_#facc15] flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="text-xs font-black uppercase text-[#22d3ee]">
              [ROOM KELAS AKTIF // MODE PROYEKTOR]
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase">
              {quest?.title || "Misi Studi Kasus Kelas"}
            </h1>
            <p className="text-xs text-zinc-300">
              Pengajar: <strong>{quest?.creator_name || "Guru"}</strong> • Minta murid membuka <code>/room/join</code> di ponsel mereka.
            </p>
          </div>

          <div className="p-4 bg-black border-3 border-[#facc15] shadow-[4px_4px_0px_#000000] text-center space-y-1">
            <span className="text-[10px] font-black text-zinc-400 uppercase block">
              6-DIGIT ROOM PIN UNTUK MURID:
            </span>
            <div className="flex items-center gap-2">
              <span className="text-4xl sm:text-5xl font-black text-[#facc15] tracking-widest">
                {roomCode}
              </span>
              <button
                onClick={copyRoomPin}
                className="brutal-btn-yellow p-2"
                title="Salin PIN"
              >
                {copied ? <Check className="w-4 h-4 stroke-[3]" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Live Leaderboard & Submissions */}
        <div className="border-3 border-black dark:border-white bg-[#111317] p-6 shadow-[5px_5px_0px_#000000] space-y-4">
          <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-3">
            <div>
              <span className="text-xs font-black uppercase text-[#4ade80]">
                [LIVE SUBMISSIONS LEADERBOARD]
              </span>
              <h3 className="font-black text-lg text-white uppercase">
                Hasil Pengerjaan Murid di Kelas ({submissions.length} Masuk)
              </h3>
            </div>

            {quest && (
              <Link
                href={`/play/${quest.id}?name=SiswaDemo`}
                target="_blank"
                className="brutal-btn-yellow px-3 py-1.5 text-xs font-black flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5 fill-black" />
                <span>[ UJI COBA SEBAGAI MURID ]</span>
              </Link>
            )}
          </div>

          {submissions.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400 space-y-2 border-2 border-dashed border-zinc-700">
              <p className="font-bold text-white uppercase">Menunggu murid bergabung...</p>
              <p>Minta siswa memasukkan PIN <strong>{roomCode}</strong> pada halaman join.</p>
            </div>
          ) : (
            <div className="overflow-x-auto border-2 border-black">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#facc15] text-black font-black uppercase border-b-2 border-black">
                  <tr>
                    <th className="p-3">Rank</th>
                    <th className="p-3">Nama Siswa</th>
                    <th className="p-3">Skor Kuis</th>
                    <th className="p-3">Skor Speaking</th>
                    <th className="p-3">Total Skor</th>
                    <th className="p-3">CEFR</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 bg-[#0a0b0e] text-zinc-300">
                  {submissions.map((sub, idx) => (
                    <tr key={sub.id} className="hover:bg-zinc-900 transition-colors">
                      <td className="p-3 font-black text-white">#{idx + 1}</td>
                      <td className="p-3 font-bold text-white">{sub.student_name}</td>
                      <td className="p-3 font-black text-[#facc15]">{sub.quiz_score}%</td>
                      <td className="p-3 font-black text-[#22d3ee]">{sub.speaking_score}%</td>
                      <td className="p-3 font-black text-xl text-[#4ade80]">{sub.total_score}</td>
                      <td className="p-3 font-black">[{sub.cefr_level || "B1"}]</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 bg-[#4ade80] text-black font-black text-[10px] uppercase">
                          {sub.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

