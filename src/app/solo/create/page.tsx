"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Sparkles, ArrowLeft, ArrowRight, BookOpen, Layers } from "lucide-react";
import Link from "next/link";
import CameraScanner from "@/components/game/CameraScanner";
import { YoloDetection } from "@/lib/python-api";

export default function SoloCreatePage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"camera" | "topic">("camera");
  const [customTopic, setCustomTopic] = useState("Hospitality Service & Guest Experience");
  const [studentName, setStudentName] = useState("Solo Explorer");
  const [difficultyLevel, setDifficultyLevel] = useState("B1");
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateQuest = async (detectedLabels: string[] = ["bottle", "book"]) => {
    setIsGenerating(true);

    try {
      const res = await fetch("/api/generate-quest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "SOLO",
          creatorName: studentName,
          topic: activeTab === "topic" ? customTopic : `Exploration with ${detectedLabels.join(" and ")}`,
          detected_labels: detectedLabels,
          difficultyLevel,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat quest.");

      const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      router.push(`/play/${data.quest.id}?subId=${subId}&name=${encodeURIComponent(studentName)}`);
    } catch (err: any) {
      alert(err.message || "Gagal membuat solo quest.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCameraConfirmed = (detection: YoloDetection) => {
    handleGenerateQuest([detection.label]);
  };

  return (
    <div className="min-h-screen brutal-grid text-white font-mono p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Link
          href="/"
          className="brutal-btn-dark px-3.5 py-1.5 text-xs font-black inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>[ KEMBALI KE HOME ]</span>
        </Link>

        {/* Header */}
        <div className="border-4 border-black dark:border-white bg-[#111317] p-6 shadow-[6px_6px_0px_#000000] dark:shadow-[6px_6px_0px_#facc15] space-y-2">
          <div className="flex items-center gap-2 text-[#facc15] text-xs font-black uppercase">
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>[MODE 2: SOLO EXPLORER // MANDIRI]</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            BUAT SOAL & MISI STUDI KASUS SENDIRI
          </h1>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Pindai benda di sekitarmu dengan kamera atau ketik skenario latihan yang kamu inginkan. AI akan merancang kuis kontekstual dan arena roleplay instan.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center gap-2 border-b-2 border-zinc-800 pb-3">
          <button
            onClick={() => setActiveTab("camera")}
            className={`px-4 py-2 text-xs font-black uppercase transition-all ${
              activeTab === "camera" ? "brutal-btn-yellow" : "brutal-btn-dark"
            }`}
          >
            [ PILIHAN A: SCAN BENDA DI SEKITARMU (YOLO) ]
          </button>

          <button
            onClick={() => setActiveTab("topic")}
            className={`px-4 py-2 text-xs font-black uppercase transition-all ${
              activeTab === "topic" ? "brutal-btn-yellow" : "brutal-btn-dark"
            }`}
          >
            [ PILIHAN B: KETIK TOPIK LATIHAN KUSTOM ]
          </button>
        </div>

        {/* User Configuration Bar */}
        <div className="border-3 border-black dark:border-white bg-[#111317] p-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex-1 min-w-[200px]">
            <label className="font-bold text-zinc-300 block mb-1 uppercase">Nama Panggilanmu:</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-3 py-2 bg-black border-2 border-white text-white font-mono focus:border-[#facc15] focus:outline-none"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="font-bold text-zinc-300 block mb-1 uppercase">Tingkat Kesulitan CEFR:</label>
            <select
              value={difficultyLevel}
              onChange={(e) => setDifficultyLevel(e.target.value)}
              className="w-full px-3 py-2 bg-black border-2 border-white text-white font-bold"
            >
              <option value="A2">A2 (Elementary)</option>
              <option value="B1">B1 (Intermediate)</option>
              <option value="B2">B2 (Vantage / Advanced)</option>
            </select>
          </div>
        </div>

        {/* Tab Content A: Camera YOLO */}
        {activeTab === "camera" && (
          <div className="space-y-4">
            <CameraScanner
              requiredHint="Arahkan kamera ke benda nyata apa pun di mejamu untuk membuat misi instan!"
              onObjectConfirmed={handleCameraConfirmed}
            />
          </div>
        )}

        {/* Tab Content B: Topic Input */}
        {activeTab === "topic" && (
          <div className="border-3 border-black dark:border-white bg-[#111317] p-6 shadow-[5px_5px_0px_#000000] space-y-4 text-xs">
            <div>
              <label className="font-bold text-zinc-300 block mb-1 uppercase">
                Topik Skenario yang Ingin Kamu Latih:
              </label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Contoh: Job Interview for Tech Startup / Hotel Reception"
                className="w-full px-4 py-3 bg-black border-2 border-white text-white font-mono text-sm focus:border-[#facc15] focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2 text-zinc-400">
              <span className="font-bold uppercase text-[10px]">Contoh Cepat:</span>
              <button
                type="button"
                onClick={() => setCustomTopic("Eco-Friendly Product Sales Pitch")}
                className="px-2 py-1 bg-black border border-zinc-700 hover:border-white text-white"
              >
                Eco-Friendly Pitch
              </button>
              <button
                type="button"
                onClick={() => setCustomTopic("Hotel Guest Complaint Recovery")}
                className="px-2 py-1 bg-black border border-zinc-700 hover:border-white text-white"
              >
                Hotel Complaint
              </button>
              <button
                type="button"
                onClick={() => setCustomTopic("Explaining Indonesian Batik to Foreign Tourist")}
                className="px-2 py-1 bg-black border border-zinc-700 hover:border-white text-white"
              >
                Indonesian Batik
              </button>
            </div>

            <button
              onClick={() => handleGenerateQuest(["laptop", "book", "bottle"])}
              disabled={isGenerating || !customTopic.trim()}
              className="w-full brutal-btn-yellow py-3.5 text-xs sm:text-sm font-black uppercase flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <span>[ AI MERANCANG KUIS & SKENARIO STUDI KASUS... ]</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 stroke-[2.5]" />
                  <span>[ BUAT MISI & MULAI PRE-QUIZ ]</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

