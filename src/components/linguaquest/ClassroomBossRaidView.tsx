"use client";

import { useState } from "react";
import { Mic, Volume2, Sparkles, Send, Flame, Shield, Award, Users, Terminal } from "lucide-react";
import confetti from "canvas-confetti";

export default function ClassroomBossRaidView() {
  const [bossHp, setBossHp] = useState<number>(100);
  const [classScore, setClassScore] = useState<number>(0);
  const [currentSpeaker, setCurrentSpeaker] = useState<string>("Siswa 1 (Meja Depan)");
  const [transcript, setTranscript] = useState<string>("");
  const [bossDialogue, setBossDialogue] = useState<string>(
    "Fools! Humanity's pollution will soon blanket your skies in eternal smog! What can mere students with everyday objects do against my eternal smog?"
  );
  const [raidLogs, setRaidLogs] = useState<Array<{ student: string; text: string; damage: number }>>([]);

  const speakText = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "en-US";
      u.rate = 0.9;
      window.speechSynthesis.speak(u);
    }
  };

  const handleAttackBoss = () => {
    if (!transcript.trim()) return;

    const damage = Math.floor(Math.random() * 25) + 20; // 20 - 45 damage
    const newHp = Math.max(bossHp - damage, 0);
    setBossHp(newHp);
    setClassScore((prev) => prev + damage * 10);

    const log = {
      student: currentSpeaker,
      text: transcript,
      damage,
    };
    setRaidLogs((prev) => [log, ...prev]);
    setTranscript("");

    if (newHp === 0) {
      setBossDialogue("NOOO! The power of young minds and clean technology... has dispersed my smog!");
      speakText("No! The power of your voices has defeated me!");
      confetti({ particleCount: 160, spread: 90, origin: { y: 0.5 } });
    } else {
      const bossReplies = [
        "Insolent! Your words have some merit, but can you sustain this environmental argument?",
        "Gah! That reusable solution struck a critical blow! Who is next to challenge me?",
        "Impressive vocabulary! But my smog still threatens the city!",
      ];
      const randomReply = bossReplies[Math.floor(Math.random() * bossReplies.length)];
      setBossDialogue(randomReply);
      speakText(randomReply);
      setCurrentSpeaker(currentSpeaker === "Siswa 1 (Meja Depan)" ? "Siswa 2 (Barisan Tengah)" : "Siswa 3 (Barisan Belakang)");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Projector Header Bar */}
      <div className="border-3 border-black dark:border-white bg-[#111317] p-4 shadow-[4px_4px_0px_#000000] flex flex-wrap items-center justify-between gap-3 font-mono text-xs font-black">
        <span className="flex items-center gap-2 text-[#ef4444] uppercase">
          <Terminal className="w-4 h-4 stroke-[2.5]" />
          [MODE PROYEKTOR KELAS: 1 LAPTOP GURU DI DEPAN PAPAN TULIS]
        </span>
        <span className="px-3 py-1 bg-[#ef4444] text-white border-2 border-black shadow-[2px_2px_0px_#000000] uppercase">
          [TARGET: CO-OP SPEAKING SELURUH SISWA KELAS]
        </span>
      </div>

      {/* Main Boss Raid Arena */}
      <div className="border-4 border-black dark:border-[#ef4444] bg-[#0c0d10] p-6 sm:p-8 shadow-[8px_8px_0px_#000000] dark:shadow-[8px_8px_0px_#ef4444] space-y-6 font-mono">
        {/* Boss HP Health Bar (Chunky Arcade Blocks) */}
        <div className="space-y-2 max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-between text-xs sm:text-sm font-black">
            <span className="text-[#ef4444] uppercase tracking-wide">
              🌋 TITAN SMOG [BOSS MONSTER POLUSI]
            </span>
            <span className="text-white text-base font-black">{bossHp} / 100 HP</span>
          </div>

          <div className="w-full h-6 bg-black border-3 border-white p-0.5">
            <div
              className={`h-full transition-all duration-300 ${
                bossHp > 40 ? "bg-[#ef4444]" : "bg-[#facc15]"
              }`}
              style={{ width: `${bossHp}%` }}
            />
          </div>
        </div>

        {/* Boss Visual & Dialogue */}
        <div className="flex flex-col items-center text-center space-y-4 py-2">
          <div className="text-7xl select-none">
            {bossHp > 0 ? "🌋" : "🌱"}
          </div>

          <div className="max-w-xl p-5 bg-black border-2 border-white shadow-[4px_4px_0px_#000000] text-sm text-zinc-100 leading-relaxed">
            <p className="font-bold uppercase text-[#facc15] mb-1 text-xs">[TITAN SMOG SAYS]:</p>
            <p className="italic">"{bossDialogue}"</p>
          </div>
        </div>

        {/* Turn Indicator & Attack Form */}
        <div className="p-5 bg-[#12141a] border-3 border-black dark:border-white space-y-4">
          <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-2">
            <span className="font-black text-xs text-[#22d3ee] uppercase">
              [GILIRAN BICARA]: {currentSpeaker.toUpperCase()}
            </span>
            <span className="font-black text-xs text-[#facc15] uppercase">
              [TOTAL SKOR KELAS]: {classScore} PTS
            </span>
          </div>

          <p className="text-xs text-zinc-300 leading-relaxed">
            Siswa yang memegang benda (misal: botol reusable atau tas kain) berdiri dan ucapkan argumen dalam Bahasa Inggris untuk menyerang monster:
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3">
            <input
              type="text"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Contoh: 'We use reusable water bottles instead of single-use plastic!'"
              onKeyDown={(e) => e.key === "Enter" && handleAttackBoss()}
              className="flex-1 w-full px-4 py-3 bg-black border-2 border-white text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-[#facc15]"
            />

            <button
              onClick={handleAttackBoss}
              disabled={!transcript.trim() || bossHp === 0}
              className="w-full sm:w-auto brutal-btn-red px-6 py-3 text-xs sm:text-sm font-mono flex items-center justify-center gap-2"
            >
              <span>⚔️ SERANG BOSS DENGAN SUARA</span>
            </button>
          </div>
        </div>

        {/* Attack Damage Log */}
        {raidLogs.length > 0 && (
          <div className="space-y-2">
            <span className="text-xs font-black text-zinc-400 uppercase block">
              [CATATAN SERANGAN SUARA SISWA KELAS]:
            </span>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {raidLogs.map((log, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-black border-2 border-zinc-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-black text-[#22d3ee] block">{log.student}:</span>
                    <p className="text-zinc-300 italic">"{log.text}"</p>
                  </div>
                  <span className="font-black text-[#ef4444] text-sm flex-shrink-0">
                    -{log.damage} HP CRITICAL!
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
