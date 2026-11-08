"use client";

import { useState } from "react";
import { Mic, Volume2, Sparkles, Send, Flame, Shield, Award, Users } from "lucide-react";
import confetti from "canvas-confetti";

export default function ClassroomBossRaidView() {
  const [bossHp, setBossHp] = useState<number>(100);
  const [classScore, setClassScore] = useState<number>(0);
  const [currentSpeaker, setCurrentSpeaker] = useState<string>("Siswa 1 (Meja Depan)");
  const [transcript, setTranscript] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [bossDialogue, setBossDialogue] = useState<string>(
    "Fools! Humanity's pollution will soon blanket your skies! What can mere students with everyday objects do against my eternal smog?"
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
      confetti({ particleCount: 150, spread: 90, origin: { y: 0.5 } });
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
    <div className="max-w-5xl mx-auto space-y-6 animate-fadeIn">
      {/* Projector Header */}
      <div className="p-4 rounded-3xl bg-zinc-950 border border-zinc-800 flex items-center justify-between text-xs font-bold text-zinc-300">
        <span className="flex items-center gap-2 text-rose-400">
          <Flame className="w-4 h-4 fill-rose-500" /> Mode Proyektor: 1 Laptop Guru di Depan Kelas
        </span>
        <span className="px-3 py-1 rounded-full bg-rose-950/80 border border-rose-800 text-rose-300">
          Target: Berbicara Kolaboratif Seluruh Kelas (Co-op Speaking)
        </span>
      </div>

      {/* Main Boss Raid Arena */}
      <div className="rounded-3xl p-8 bg-gradient-to-b from-rose-950/60 via-zinc-950 to-zinc-950 border border-rose-800/60 shadow-2xl relative overflow-hidden space-y-6">
        {/* Boss HP Bar */}
        <div className="space-y-2 max-w-2xl mx-auto text-center">
          <div className="flex items-center justify-between text-sm font-extrabold">
            <span className="text-rose-400 flex items-center gap-1.5">
              🌋 TITAN SMOG (Boss Monster Polusi)
            </span>
            <span className="text-white font-mono">{bossHp} / 100 HP</span>
          </div>
          <div className="w-full h-5 rounded-full bg-zinc-900 border border-zinc-800 overflow-hidden p-0.5">
            <div
              className="h-full rounded-full bg-gradient-to-r from-rose-600 via-orange-500 to-amber-400 transition-all duration-500"
              style={{ width: `${bossHp}%` }}
            />
          </div>
        </div>

        {/* Boss Visual & Dialogue */}
        <div className="flex flex-col items-center text-center space-y-4 py-4">
          <div className="text-7xl animate-pulse drop-shadow-[0_0_35px_rgba(244,63,94,0.4)]">
            {bossHp > 0 ? "🌋" : "🌱"}
          </div>

          <div className="max-w-xl p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-sm text-zinc-200 leading-relaxed shadow-xl">
            <p className="font-serif italic font-medium">"{bossDialogue}"</p>
          </div>
        </div>

        {/* Speaker Turn & Voice Assault Controller */}
        <div className="p-6 rounded-3xl bg-zinc-900/90 border border-zinc-800 max-w-2xl mx-auto space-y-4 shadow-xl">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-indigo-400 flex items-center gap-1.5">
              <Users className="w-4 h-4" /> Giliran Bicara: <strong>{currentSpeaker}</strong>
            </span>
            <span className="text-zinc-400">Total Skor Kelas: <strong className="text-amber-400">{classScore} Pts</strong></span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="text"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Siswa maju, pegang mikrofon, dan berikan argumen dalam Bahasa Inggris..."
              onKeyDown={(e) => e.key === "Enter" && handleAttackBoss()}
              className="flex-1 px-4 py-3 rounded-xl bg-zinc-950 border border-zinc-800 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500"
            />

            <button
              onClick={handleAttackBoss}
              disabled={!transcript.trim() || bossHp === 0}
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-extrabold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition-all flex-shrink-0"
            >
              <Send className="w-4 h-4" />
              <span>Serang Boss!</span>
            </button>
          </div>
        </div>

        {/* Live Attack Logs */}
        {raidLogs.length > 0 && (
          <div className="max-w-2xl mx-auto space-y-2">
            <span className="text-[11px] font-bold text-zinc-500 uppercase block">Log Serangan Argumen Siswa:</span>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {raidLogs.map((log, idx) => (
                <div key={idx} className="p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-850 flex items-center justify-between text-xs">
                  <span className="text-zinc-300">
                    <strong className="text-indigo-400">{log.student}:</strong> "{log.text}"
                  </span>
                  <span className="font-bold text-rose-400 flex-shrink-0 ml-2">-{log.damage} HP</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

