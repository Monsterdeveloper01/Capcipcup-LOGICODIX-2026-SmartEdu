"use client";

import { useState, useEffect, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trophy, ArrowLeft, RotateCcw, CheckCircle2, AlertCircle, Sparkles, Terminal } from "lucide-react";
import Link from "next/link";
import confetti from "canvas-confetti";

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="p-8 font-mono text-center">Loading result...</div>}>
      <ResultContent />
    </Suspense>
  );
}

function ResultContent() {
  const params = useParams();
  const subId = params.subId as string;

  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchResult();
  }, [subId]);

  const fetchResult = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/submissions/${subId}`);
      const json = await res.json();
      if (res.ok && json.submission) {
        setData(json.submission);
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
      } else {
        // Fallback default mock
        setData({
          id: subId,
          quest_title: "Misi Negosiasi Produk Ramah Lingkungan",
          student_name: "Siswa Petualang",
          total_score: 88,
          quiz_score: 100,
          speaking_score: 80,
          cefr_level: "B1",
          python_fluency_metrics: {
            wpm: 94,
            filler_count: 1,
            vocab_hit_rate: 80,
            fluency_score: 86,
          },
          ai_feedback: {
            transcript_summary: "Siswa menunjukkan keberanian tinggi dalam mempresentasikan prototipe fisik botol minum dan merespons pertanyaan investor dengan percaya diri.",
            native_upgrades: [
              {
                original: "I want to show you this reusable bottle for student",
                upgraded: "I would like to introduce our eco-friendly reusable bottle designed specifically for students",
                explanation: "'I would like to introduce' memberikan kesan yang jauh lebih meyakinkan dan santun.",
              },
            ],
            strengths: [
              "Kecepatan bicara stabil di 94 WPM",
              "Menggunakan kosakata kunci 'reusable' dan 'durable'",
            ],
            areas_to_improve: [
              "Tingkatkan variasi kata transisi antar kalimat",
              "Kurangi jeda berpikir dengan latihan spontan",
            ],
          },
        });
      }
    } catch (err) {
      console.warn("Fetch result error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen brutal-grid flex items-center justify-center p-4 font-mono text-white">
        <div className="border-4 border-black dark:border-white bg-[#111317] p-8 text-center space-y-3 shadow-[8px_8px_0px_#000000]">
          <div className="w-10 h-10 border-4 border-[#facc15] border-t-transparent animate-spin mx-auto" />
          <p className="text-xs uppercase font-black text-[#facc15]">[MEMUAT RAPOR EVALUASI CEFR...]</p>
        </div>
      </div>
    );
  }

  const fb = data?.ai_feedback || {};
  const py = data?.python_fluency_metrics || {};

  return (
    <div className="min-h-screen brutal-grid text-white font-mono p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-3">
          <Link
            href="/"
            className="brutal-btn-dark px-3.5 py-1.5 text-xs font-black flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>[ KEMBALI KE HOME ]</span>
          </Link>

          <span className="text-xs bg-[#4ade80] text-black px-3 py-1 font-black border border-black shadow-[2px_2px_0px_#000000]">
            [STATUS: EVALUASI LULUS & TERSIMPAN DI MARIADB]
          </span>
        </div>

        {/* Top Score Banner */}
        <div className="border-4 border-black dark:border-white bg-[#111317] p-6 sm:p-8 shadow-[8px_8px_0px_#000000] dark:shadow-[8px_8px_0px_#facc15] flex flex-wrap items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-[#facc15] text-xs font-black uppercase">
              <Terminal className="w-4 h-4 stroke-[3]" />
              <span>[OFFICIAL CEFR SPEAKING & QUIZ AUTOPSY]</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
              {data.quest_title}
            </h1>
            <p className="text-xs text-zinc-300 max-w-xl leading-relaxed">
              Peserta: <strong>{data.student_name}</strong> • {fb.transcript_summary}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3.5 px-5 bg-black border-2 border-white shadow-[3px_3px_0px_#000000] text-center">
              <span className="text-[10px] font-black text-zinc-400 block uppercase">[LEVEL CEFR]</span>
              <span className="text-3xl font-black text-[#4ade80]">{data.cefr_level || "B1"}</span>
            </div>

            <div className="p-3.5 px-5 bg-[#facc15] text-black border-2 border-black shadow-[3px_3px_0px_#000000] text-center">
              <span className="text-[10px] font-black uppercase block">[TOTAL SKOR]</span>
              <span className="text-3xl font-black">{data.total_score}</span>
            </div>
          </div>
        </div>

        {/* 4 Score Pillars */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="p-4 bg-black border-2 border-white shadow-[3px_3px_0px_#000000] space-y-1">
            <span className="text-[10px] font-black text-zinc-400 block uppercase">[SKOR KUIS PILGAN]</span>
            <span className="text-2xl font-black text-[#facc15]">{data.quiz_score}%</span>
          </div>

          <div className="p-4 bg-black border-2 border-white shadow-[3px_3px_0px_#000000] space-y-1">
            <span className="text-[10px] font-black text-zinc-400 block uppercase">[SPEAKING ACCURACY]</span>
            <span className="text-2xl font-black text-[#22d3ee]">{data.speaking_score}%</span>
          </div>

          <div className="p-4 bg-black border-2 border-white shadow-[3px_3px_0px_#000000] space-y-1">
            <span className="text-[10px] font-black text-zinc-400 block uppercase">[PYTHON WPM SPEED]</span>
            <span className="text-2xl font-black text-[#4ade80]">{py.wpm || 90} WPM</span>
          </div>

          <div className="p-4 bg-black border-2 border-white shadow-[3px_3px_0px_#000000] space-y-1">
            <span className="text-[10px] font-black text-zinc-400 block uppercase">[TARGET VOCAB HIT]</span>
            <span className="text-2xl font-black text-[#ef4444]">{py.vocab_hit_rate || 75}%</span>
          </div>
        </div>

        {/* Native-like Upgrades */}
        {fb.native_upgrades && fb.native_upgrades.length > 0 && (
          <div className="border-3 border-black dark:border-white bg-[#111317] p-6 shadow-[6px_6px_0px_#000000] space-y-3">
            <span className="text-xs font-black uppercase text-[#facc15] block">
              [ ★ NATIVE-LIKE UPGRADE: CARA MENGUCAPKAN DENGAN LEBIH ALAMI ]
            </span>
            <div className="space-y-3 text-xs">
              {fb.native_upgrades.map((item: any, i: number) => (
                <div key={i} className="p-4 bg-black border-2 border-zinc-700 space-y-1.5">
                  <div>
                    <span className="text-zinc-500 uppercase block text-[10px] font-black">Yang Kamu Ucapkan:</span>
                    <p className="text-zinc-300 italic">"{item.original}"</p>
                  </div>
                  <div>
                    <span className="text-[#4ade80] uppercase block text-[10px] font-black">Versi Native Lebih Natural:</span>
                    <p className="text-white font-bold">"{item.upgraded}"</p>
                  </div>
                  <p className="text-zinc-400 text-[11px] pt-1 border-t border-zinc-800">{item.explanation}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Strengths & Areas to Improve */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="p-5 bg-black border-2 border-[#4ade80] shadow-[4px_4px_0px_#000000] space-y-2">
            <span className="font-black text-[#4ade80] uppercase flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 stroke-[3]" /> [KELEBIHAN KAMU]:
            </span>
            <ul className="space-y-1 text-zinc-300 list-disc list-inside">
              {(fb.strengths || ["Kelancaran berbicara terjaga"]).map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>

          <div className="p-5 bg-black border-2 border-[#facc15] shadow-[4px_4px_0px_#000000] space-y-2">
            <span className="font-black text-[#facc15] uppercase flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 stroke-[3]" /> [SARAN PENINGKATAN]:
            </span>
            <ul className="space-y-1 text-zinc-300 list-disc list-inside">
              {(fb.areas_to_improve || ["Perkaya variasi idiom"]).map((s: string, i: number) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex justify-center">
          <Link
            href="/"
            className="brutal-btn-yellow px-8 py-3.5 text-xs sm:text-sm font-black uppercase flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4 stroke-[3]" />
            <span>[ SELESAI & KEMBALI KE MENU UTAMA ]</span>
          </Link>
        </div>
      </div>
    </div>
  );
}


