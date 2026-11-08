"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, ArrowLeft, Sparkles, Terminal, Key } from "lucide-react";
import Link from "next/link";

export default function TeacherCreateRoomPage() {
  const router = useRouter();

  const [creatorName, setCreatorName] = useState("Budi Santoso, S.Pd");
  const [topic, setTopic] = useState("Eco-Friendly Packaging & Youth Innovation");
  const [gradeLevel, setGradeLevel] = useState("SMK Kelas 11 (Perhotelan & Bisnis)");
  const [difficultyLevel, setDifficultyLevel] = useState("B1");
  const [roomCode, setRoomCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !creatorName) return;

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/generate-quest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "ROOM",
          roomCode,
          creatorName,
          topic,
          difficultyLevel,
          detected_labels: ["bottle", "book", "cup"],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat room.");

      router.push(`/teacher/room/${data.quest.room_code || roomCode}`);
    } catch (err: any) {
      alert(err.message || "Gagal membuat room.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen brutal-grid text-white font-mono p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href="/"
          className="brutal-btn-dark px-3.5 py-1.5 text-xs font-black inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>[ KEMBALI KE HOME ]</span>
        </Link>

        {/* Header */}
        <div className="border-4 border-black dark:border-white bg-[#111317] p-6 shadow-[6px_6px_0px_#000000] dark:shadow-[6px_6px_0px_#22d3ee] space-y-2">
          <div className="flex items-center gap-2 text-[#22d3ee] text-xs font-black uppercase">
            <GraduationCap className="w-4 h-4 stroke-[2.5]" />
            <span>[TEACHER STUDIO // ROOM & CASE-STUDY CREATOR]</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            BUAT ROOM KELAS & MISI STUDI KASUS
          </h1>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Sistem akan men-generate skenario roleplay, target kosakata, dan kuis otomatis menggunakan Gemini AI dalam hitungan detik. Murid dapat bergabung menggunakan PIN 6-digit.
          </p>
        </div>

        {/* Creation Form */}
        <div className="border-3 border-black dark:border-white bg-[#111317] p-6 sm:p-7 shadow-[5px_5px_0px_#000000] space-y-5">
          <form onSubmit={handleCreateRoom} className="space-y-4 text-xs">
            <div>
              <label className="font-black text-zinc-300 block mb-1 uppercase">
                Nama Pengajar / Guru:
              </label>
              <input
                type="text"
                required
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                className="w-full px-4 py-3 bg-black border-2 border-white text-white font-mono focus:border-[#facc15] focus:outline-none"
              />
            </div>

            <div>
              <label className="font-black text-zinc-300 block mb-1 uppercase">
                Topik Studi Kasus / Materi Pembelajaran (RPP):
              </label>
              <input
                type="text"
                required
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="Contoh: Handling Guest Complaints / Sustainable Tourism"
                className="w-full px-4 py-3 bg-black border-2 border-white text-white font-mono focus:border-[#facc15] focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="font-black text-zinc-300 block mb-1 uppercase">
                  Tingkat Kelas:
                </label>
                <input
                  type="text"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-4 py-3 bg-black border-2 border-white text-white font-mono focus:border-[#facc15] focus:outline-none"
                />
              </div>

              <div>
                <label className="font-black text-zinc-300 block mb-1 uppercase">
                  Target CEFR Difficulty:
                </label>
                <select
                  value={difficultyLevel}
                  onChange={(e) => setDifficultyLevel(e.target.value)}
                  className="w-full px-4 py-3 bg-black border-2 border-white text-white font-black"
                >
                  <option value="A2">A2 (Elementary)</option>
                  <option value="B1">B1 (Intermediate - Recommended)</option>
                  <option value="B2">B2 (Vantage / Upper Intermediate)</option>
                  <option value="C1">C1 (Effective Operational Proficiency)</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-black border-2 border-[#facc15] flex items-center justify-between">
              <div>
                <span className="text-[10px] font-black uppercase text-zinc-400 block">
                  PIN ROOM GENERATED UNTUK SISWA:
                </span>
                <span className="text-2xl font-black text-[#facc15] tracking-widest">
                  {roomCode}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRoomCode(Math.random().toString(36).substring(2, 8).toUpperCase())}
                className="brutal-btn-dark px-3 py-1.5 text-xs font-black uppercase"
              >
                [ ACAK PIN ]
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full brutal-btn-yellow py-4 text-xs sm:text-sm font-black uppercase flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <span>[ AI SEDANG MERANCANG STUDI KASUS & SOAL KUIS... ]</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  <span>[ BUAT ROOM & BUKA DASHBOARD KELAS ]</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
