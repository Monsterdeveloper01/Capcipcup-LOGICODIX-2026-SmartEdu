"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Sparkles, ArrowLeft, ArrowRight, BookOpen, Layers, Plus, Trash2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import CameraScanner from "@/components/game/CameraScanner";
import { YoloDetection } from "@/lib/python-api";
import BrutalAlertModal, { ModalConfig } from "@/components/linguaquest/common/BrutalAlertModal";

interface QuizQuestionItem {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export default function SoloCreatePage() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<"camera" | "topic" | "manual">("topic");
  const [customTopic, setCustomTopic] = useState("Hospitality Service & Guest Experience");
  const [studentName, setStudentName] = useState("Solo Explorer");
  const [difficultyLevel, setDifficultyLevel] = useState("B1");
  const [isGenerating, setIsGenerating] = useState(false);

  // Custom Brutal Alert Modal
  const [alertModal, setAlertModal] = useState<ModalConfig>({
    isOpen: false,
    title: "",
    message: "",
    type: "warning",
  });

  const showAlert = (title: string, message: string, type: ModalConfig["type"] = "warning") => {
    setAlertModal({
      isOpen: true,
      title,
      message,
      type,
      confirmText: "[ OKE / MENGERTI ]",
      onConfirm: () => setAlertModal((prev) => ({ ...prev, isOpen: false })),
    });
  };

  // Manual Mode State
  const [manualTitle, setManualTitle] = useState("Misi Mandiri: Practical English Conversation");
  const [manualStory, setManualStory] = useState("Kamu sedang berada dalam situasi simulasi profesional berbahasa Inggris.");
  const [manualNpcName, setManualNpcName] = useState("Mr. Robert (Examiner)");
  const [manualQuestions, setManualQuestions] = useState<QuizQuestionItem[]>([
    {
      question: "What is the most impactful way to deliver a 30-second elevator pitch?",
      options: [
        "I want to explain my entire educational background and university courses.",
        "We reduce startup server costs by 35%.",
        "Please allow me to present my thirty-page business documentation binder.",
        "You must listen to my personal story about starting a software company."
      ],
      correctIndex: 1,
      explanation: "'We reduce startup server costs by 35%' leads with a punchy, quantifiable value proposition.",
    },
    {
      question: "If you need a client to repeat a point politely, what should you say?",
      options: [
        "Speak louder because I could not hear your presentation.",
        "Could you please clarify that point?",
        "I have no idea what you just said right now.",
        "Your explanation was completely incomprehensible to everyone here."
      ],
      correctIndex: 1,
      explanation: "'Could you please clarify that point?' is concise, polite, and professional.",
    },
  ]);

  const handleGenerateQuest = async (detectedLabels: string[] = ["bottle", "book"]) => {
    setIsGenerating(true);

    try {
      const payload: any = {
        mode: "SOLO",
        creatorName: studentName,
        topic: activeTab === "topic" ? customTopic : `Exploration with ${detectedLabels.join(" and ")}`,
        detected_labels: detectedLabels,
        difficultyLevel,
      };

      if (activeTab === "manual") {
        payload.customCase = {
          title: manualTitle,
          case_study_story: manualStory,
          npc_name: manualNpcName,
          npc_persona: "Kritis dan apresiatif terhadap respons bahasa Inggris mandiri.",
          required_object_hint: "Gunakan objek fisik di sekitarmu!",
          mission_objectives: [
            "Jawab pertanyaan NPC dengan kalimat lengkap",
            "Gunakan kosakata yang relevan",
          ],
          target_vocabularies: ["professional", "solution", "inquiry"],
        };
        payload.customQuiz = manualQuestions;
      }

      const res = await fetch("/api/generate-quest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat quest.");

      const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      router.push(`/play/${data.quest.id}?subId=${subId}&name=${encodeURIComponent(studentName)}`);
    } catch (err: any) {
      showAlert("Gagal Membuat Misi Mandiri", err.message || "Gagal membuat solo quest.", "danger");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCameraConfirmed = (detection: YoloDetection) => {
    handleGenerateQuest([detection.label]);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-black font-mono p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="brutal-btn-white px-3.5 py-1.5 text-xs font-mono inline-flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>[ KEMBALI KE BERANDA ]</span>
          </Link>
          <span className="font-mono text-xs font-black uppercase bg-[#facc15] text-black px-3 py-1 border-2 border-black shadow-[2px_2px_0px_#000000]">
            [MODE 2: SOLO EXPLORER // MANDIRI]
          </span>
        </div>

        {/* Hero Banner */}
        <div className="border-2 border-black bg-white p-6 sm:p-8 shadow-[4px_4px_0px_#000000] space-y-3">
          <div className="flex items-center gap-2 text-cyan-700 text-xs font-black uppercase">
            <Sparkles className="w-5 h-5 stroke-[2.5]" />
            <span>[FEATURE 1: SOLO CASE & PRE-QUIZ BUILDER]</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-black uppercase tracking-tight">
            BUAT SOAL & MISI STUDI KASUS SENDIRI
          </h1>
          <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed max-w-2xl">
            Pemain mandiri dapat memindai benda nyata di meja dengan kamera (YOLO O-Token), mengetik topik latihan favorit untuk di-generate AI, atau merancang skenario dan kuis sendiri secara manual.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setActiveTab("topic")}
            className={`px-4 py-2 text-xs font-mono font-black uppercase border-2 border-black shadow-[3px_3px_0px_#000000] transition-all ${
              activeTab === "topic" ? "bg-[#facc15] text-black" : "bg-white text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            [ PILIHAN A: ⚡ KETIK TOPIK & GENERATE AI ]
          </button>

          <button
            onClick={() => setActiveTab("camera")}
            className={`px-4 py-2 text-xs font-mono font-black uppercase border-2 border-black shadow-[3px_3px_0px_#000000] transition-all ${
              activeTab === "camera" ? "bg-[#facc15] text-black" : "bg-white text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            [ PILIHAN B: 📷 SCAN BENDA NYATA (YOLO) ]
          </button>

          <button
            onClick={() => setActiveTab("manual")}
            className={`px-4 py-2 text-xs font-mono font-black uppercase border-2 border-black shadow-[3px_3px_0px_#000000] transition-all ${
              activeTab === "manual" ? "bg-[#22d3ee] text-black" : "bg-white text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            [ PILIHAN C: ✍️ MANUAL CASE & QUIZ BUILDER ]
          </button>
        </div>

        {/* Configuration Bar */}
        <div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000000] flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
          <div className="flex-1 min-w-[200px]">
            <label className="font-black text-black block mb-1 uppercase">Nama Panggilanmu:</label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 border-2 border-black text-black font-mono focus:bg-white focus:outline-none"
            />
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="font-black text-black block mb-1 uppercase">Tingkat Kesulitan CEFR:</label>
            <select
              value={difficultyLevel}
              onChange={(e) => setDifficultyLevel(e.target.value)}
              className="w-full px-3 py-2 bg-zinc-50 border-2 border-black text-black font-bold focus:outline-none"
            >
              <option value="A2">A2 (Elementary)</option>
              <option value="B1">B1 (Intermediate - Recommended)</option>
              <option value="B2">B2 (Vantage / Advanced)</option>
            </select>
          </div>
        </div>

        {/* Tab Content A: Topic Input */}
        {activeTab === "topic" && (
          <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-4 text-xs font-mono">
            <div>
              <label className="font-black text-black block mb-1 uppercase">
                Topik Skenario yang Ingin Kamu Latih:
              </label>
              <input
                type="text"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value)}
                placeholder="Contoh: Job Interview for Tech Startup / Hotel Reception"
                className="w-full px-4 py-3 bg-zinc-50 border-2 border-black text-black font-mono text-sm focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap gap-2 text-zinc-600">
              <span className="font-black uppercase text-[10px] text-black">Preset Cepat:</span>
              <button
                type="button"
                onClick={() => setCustomTopic("Eco-Friendly Product Sales Pitch")}
                className="px-2.5 py-1 bg-zinc-100 border border-black hover:bg-[#facc15] text-black font-bold"
              >
                Eco-Friendly Pitch
              </button>
              <button
                type="button"
                onClick={() => setCustomTopic("Hotel Guest Complaint Recovery")}
                className="px-2.5 py-1 bg-zinc-100 border border-black hover:bg-[#facc15] text-black font-bold"
              >
                Hotel Complaint
              </button>
              <button
                type="button"
                onClick={() => setCustomTopic("Explaining Indonesian Batik to Foreign Tourist")}
                className="px-2.5 py-1 bg-zinc-100 border border-black hover:bg-[#facc15] text-black font-bold"
              >
                Indonesian Batik
              </button>
            </div>

            <button
              onClick={() => handleGenerateQuest(["laptop", "book", "bottle"])}
              disabled={isGenerating || !customTopic.trim()}
              className="w-full brutal-btn-yellow py-3.5 text-xs sm:text-sm font-mono font-black uppercase flex items-center justify-center gap-2"
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

        {/* Tab Content B: Camera YOLO */}
        {activeTab === "camera" && (
          <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-4 font-mono">
            <CameraScanner
              requiredHint="Arahkan kamera ke benda nyata apa pun di mejamu untuk membuat misi instan!"
              onObjectConfirmed={handleCameraConfirmed}
            />
          </div>
        )}

        {/* Tab Content C: Manual Builder */}
        {activeTab === "manual" && (
          <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-5 font-mono text-xs">
            <div className="border-b-2 border-zinc-200 pb-3 flex items-center justify-between">
              <span className="font-black uppercase text-black">[MANUAL CASE & QUIZ CREATOR]</span>
              <span className="text-zinc-500 font-bold">KONTROL PENUH PEMAIN</span>
            </div>

            <div className="space-y-4">
              <div>
                <label className="font-black text-black block mb-1 uppercase">Judul Misi Mandiri:</label>
                <input
                  type="text"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border-2 border-black text-black font-mono focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-black text-black block mb-1 uppercase">Skenario Situasi:</label>
                <textarea
                  rows={2}
                  value={manualStory}
                  onChange={(e) => setManualStory(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border-2 border-black text-black font-mono focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-black text-black block mb-1 uppercase">Nama & Peran NPC Penguji:</label>
                <input
                  type="text"
                  value={manualNpcName}
                  onChange={(e) => setManualNpcName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border-2 border-black text-black font-mono focus:bg-white focus:outline-none"
                />
              </div>

              <div className="space-y-3 pt-2">
                <span className="font-black uppercase text-black block">SOAL PRE-QUIZ MANDIRI:</span>
                {manualQuestions.map((q, idx) => (
                  <div key={idx} className="p-3 bg-zinc-50 border border-black space-y-2">
                    <span className="font-bold text-black uppercase">Soal #{idx + 1}:</span>
                    <input
                      type="text"
                      value={q.question}
                      onChange={(e) => {
                        const updated = [...manualQuestions];
                        updated[idx].question = e.target.value;
                        setManualQuestions(updated);
                      }}
                      className="w-full px-2.5 py-1.5 bg-white border border-black font-mono text-xs focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleGenerateQuest(["book", "pen"])}
              disabled={isGenerating}
              className="w-full brutal-btn-yellow py-3.5 text-xs sm:text-sm font-mono font-black uppercase flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <span>[ MENYIMPAN MISI MANDIRI... ]</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>[ SIMPAN MISI & MULAI PRE-QUIZ ]</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      <BrutalAlertModal {...alertModal} />
    </div>
  );
}
