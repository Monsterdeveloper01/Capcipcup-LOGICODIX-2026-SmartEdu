"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, ArrowLeft, Sparkles, Plus, Trash2, CheckCircle2, BookOpen, Layers } from "lucide-react";
import Link from "next/link";
import BrutalAlertModal, { ModalConfig } from "@/components/linguaquest/common/BrutalAlertModal";

interface QuizQuestionItem {
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
}

export default function TeacherCreateRoomPage() {
  const router = useRouter();

  // Basic Info
  const [creatorName, setCreatorName] = useState("Budi Santoso, S.Pd");
  const [topic, setTopic] = useState("Eco-Friendly Hospitality & Sustainable Living");
  const [gradeLevel, setGradeLevel] = useState("SMK Kelas 11 (Perhotelan & Pariwisata)");
  const [difficultyLevel, setDifficultyLevel] = useState("B1");
  const [roomCode, setRoomCode] = useState(() => Math.random().toString(36).substring(2, 8).toUpperCase());

  // Builder Mode: "ai_assisted" or "manual"
  const [builderMode, setBuilderMode] = useState<"ai_assisted" | "manual">("ai_assisted");
  const [isGeneratingDraft, setIsGeneratingDraft] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  // Case Study Details
  const [caseTitle, setCaseTitle] = useState("Misi Studi Kasus: Eco-Friendly Hospitality");
  const [caseStory, setCaseStory] = useState(
    "Hotel tempatmu bertugas sedang meluncurkan program ramah lingkungan. Hadapi tamu VIP asing yang menanyakan detail fasilitas bebas plastik dan tawarkan alternatif fasilitas ramah lingkungan."
  );
  const [npcName, setNpcName] = useState("Mr. Arthur (VIP Foreign Guest)");
  const [npcPersona, setNpcPersona] = useState("Kritis, teliti tentang kebersihan dan kelestarian alam, ramah jika dilayani profesional.");
  const [targetVocab, setTargetVocab] = useState("sustainable, biodegradable, hospitality, amenity, alternative");
  const [requiredHint, setRequiredHint] = useState("Gunakan botol minum atau wadah reusable di sekitarmu!");

  // Pre-Quiz Questions (3 to 5 questions)
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionItem[]>([
    {
      question: "Which term best describes hotel amenities that degrade naturally without polluting?",
      options: ["Biodegradable", "Disposable", "Hazardous", "Permanent"],
      correctIndex: 0,
      explanation: "'Biodegradable' means capable of being decomposed by bacteria or other living organisms.",
    },
    {
      question: "What is the most effective opening hook for a professional elevator pitch?",
      options: [
        "I would like to respectfully present our forty-page market analysis report.",
        "We cut hotel plastic waste by 40%.",
        "I have always dreamed of working at your prestigious international company.",
        "You should read our detailed technical manual regarding hospitality amenities."
      ],
      correctIndex: 1,
      explanation: "'We cut hotel plastic waste by 40%' is a punchy, value-first opening statement.",
    },
    {
      question: "When a guest is dissatisfied with their room, what is the best first response?",
      options: [
        "Please file a formal complaint with our general manager tomorrow.",
        "I will resolve this issue immediately for you.",
        "Our hotel policies do not allow guest room adjustments.",
        "You should have selected our premium executive suite."
      ],
      correctIndex: 1,
      explanation: "Taking immediate ownership calmly is standard five-star hospitality etiquette.",
    },
  ]);

  // AI Draft Generator Handler
  const handleGenerateAiDraft = async () => {
    setIsGeneratingDraft(true);
    try {
      const res = await fetch("/api/generate-quest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "ROOM",
          creatorName,
          topic,
          difficultyLevel,
          detected_labels: ["bottle", "book", "cup"],
          generateOnly: true,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat draf dengan AI.");

      if (data.draft) {
        setCaseTitle(data.draft.title || caseTitle);
        setCaseStory(data.draft.case_study_story || caseStory);
        setNpcName(data.draft.npc_name || npcName);
        setNpcPersona(data.draft.npc_persona || npcPersona);
        setRequiredHint(data.draft.required_object_hint || requiredHint);
        if (data.draft.target_vocabularies) {
          setTargetVocab(data.draft.target_vocabularies.join(", "));
        }
        if (data.draft.quiz_questions && data.draft.quiz_questions.length > 0) {
          setQuizQuestions(data.draft.quiz_questions);
        }
      }
    } catch (err: any) {
      showAlert("Gagal Menghubungi AI", err.message || "Gagal menghubungi AI. Draf bawaan tetap digunakan.", "warning");
    } finally {
      setIsGeneratingDraft(false);
    }
  };

  // Question editing helpers
  const handleAddQuestion = () => {
    setQuizQuestions([
      ...quizQuestions,
      {
        question: "Pertanyaan kuis baru...",
        options: ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
        correctIndex: 0,
        explanation: "Penjelasan mengapa jawaban ini benar.",
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    if (quizQuestions.length <= 1) {
      showAlert("Peringatan Soal Kuis", "Minimal harus ada 1 butir soal kuis.", "warning");
      return;
    }
    setQuizQuestions(quizQuestions.filter((_, i) => i !== idx));
  };

  const handleUpdateQuestionText = (idx: number, text: string) => {
    const updated = [...quizQuestions];
    updated[idx].question = text;
    setQuizQuestions(updated);
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...quizQuestions];
    updated[qIdx].options[optIdx] = val;
    setQuizQuestions(updated);
  };

  const handleSetCorrectIndex = (qIdx: number, correctIdx: number) => {
    const updated = [...quizQuestions];
    updated[qIdx].correctIndex = correctIdx;
    setQuizQuestions(updated);
  };

  const handleUpdateExplanation = (qIdx: number, text: string) => {
    const updated = [...quizQuestions];
    updated[qIdx].explanation = text;
    setQuizQuestions(updated);
  };

  // Submit Final Room & Case Study
  const handleSaveAndCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic || !creatorName) return;

    setIsSubmitting(true);
    try {
      const vocabList = targetVocab.split(",").map((v) => v.trim()).filter(Boolean);

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
          customCase: {
            title: caseTitle,
            case_study_story: caseStory,
            npc_name: npcName,
            npc_persona: npcPersona,
            required_object_hint: requiredHint,
            mission_objectives: [
              `Gunakan minimal 2 kosakata target (${vocabList.slice(0, 2).join(", ")})`,
              "Jawab keluhan atau pertanyaan NPC dengan sopan dan lugas",
              "Selesaikan misi sebelum batas waktu berakhir",
            ],
            target_vocabularies: vocabList,
          },
          customQuiz: quizQuestions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan room.");

      router.push(`/teacher/room/${data.quest.room_code || roomCode}`);
    } catch (err: any) {
      showAlert("Gagal Membuat Room", err.message || "Gagal membuat room.", "danger");
    } finally {
      setIsSubmitting(false);
    }
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
            [TEACHER STUDIO // ROOM & CASE BUILDER]
          </span>
        </div>

        {/* Hero Banner */}
        <div className="border-2 border-black bg-white p-6 sm:p-8 shadow-[4px_4px_0px_#000000] space-y-3">
          <div className="flex items-center gap-2 text-cyan-700 text-xs font-black uppercase">
            <GraduationCap className="w-5 h-5 stroke-[2.5]" />
            <span>[FEATURE 1: CUSTOM CASE & PRE-QUIZ BUILDER]</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-black uppercase tracking-tight">
            RANCANG STUDI KASUS & BUTIR SOAL KUIS MANDIRI
          </h1>
          <p className="text-xs sm:text-sm text-zinc-700 leading-relaxed max-w-2xl">
            Sebagai guru, Anda bebas memilih: gunakan <strong>AI Auto-Generate</strong> untuk draf instan atau susun <strong>soal kuis pilihan ganda dan skenario studi kasus sendiri secara manual</strong>. Seluruh data tersimpan otomatis di MariaDB.
          </p>
        </div>

        {/* Builder Mode Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setBuilderMode("ai_assisted")}
            className={`px-4 py-2.5 text-xs font-mono font-black uppercase border-2 border-black shadow-[3px_3px_0px_#000000] flex items-center gap-2 ${
              builderMode === "ai_assisted" ? "bg-[#facc15] text-black" : "bg-white text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>MODE A: ⚡ AI AUTO-GENERATE DRAF (BISA DIEDIT)</span>
          </button>
          <button
            type="button"
            onClick={() => setBuilderMode("manual")}
            className={`px-4 py-2.5 text-xs font-mono font-black uppercase border-2 border-black shadow-[3px_3px_0px_#000000] flex items-center gap-2 ${
              builderMode === "manual" ? "bg-[#22d3ee] text-black" : "bg-white text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            <Layers className="w-4 h-4 stroke-[2.5]" />
            <span>MODE B: ✍️ MANUAL BUILDER (KONTROL PENUH GURU)</span>
          </button>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSaveAndCreateRoom} className="space-y-6">
          {/* Section 1: Room & Metadata */}
          <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-4">
            <div className="border-b-2 border-zinc-200 pb-3 flex items-center justify-between">
              <span className="text-xs font-black uppercase text-black">[01. METADATA ROOM & KELAS]</span>
              <span className="text-xs font-bold text-zinc-500">PIN 6-DIGIT OTOMATIS</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
              <div>
                <label className="font-black text-black block mb-1 uppercase">Nama Guru / Pengajar:</label>
                <input
                  type="text"
                  required
                  value={creatorName}
                  onChange={(e) => setCreatorName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border-2 border-black text-black font-mono focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-black text-black block mb-1 uppercase">Tingkat Kelas / RPP:</label>
                <input
                  type="text"
                  value={gradeLevel}
                  onChange={(e) => setGradeLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border-2 border-black text-black font-mono focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-black text-black block mb-1 uppercase">Topik Utama / Unit Materi:</label>
                <input
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Contoh: Sustainable Hospitality / Job Interview Prep"
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border-2 border-black text-black font-mono focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-black text-black block mb-1 uppercase">Target Standar CEFR:</label>
                <select
                  value={difficultyLevel}
                  onChange={(e) => setDifficultyLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border-2 border-black text-black font-black focus:outline-none"
                >
                  <option value="A2">A2 (Elementary)</option>
                  <option value="B1">B1 (Intermediate - Direkomendasikan)</option>
                  <option value="B2">B2 (Vantage / Upper Intermediate)</option>
                  <option value="C1">C1 (Effective Operational Proficiency)</option>
                </select>
              </div>
            </div>

            <div className="p-4 bg-zinc-50 border-2 border-black flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-black uppercase text-zinc-600 block">
                  PIN ROOM UNTUK 35 SISWA:
                </span>
                <span className="text-3xl font-black text-black tracking-widest bg-[#facc15] px-3 py-0.5 border border-black inline-block mt-1">
                  {roomCode}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setRoomCode(Math.random().toString(36).substring(2, 8).toUpperCase())}
                className="brutal-btn-white px-3.5 py-2 text-xs font-mono font-black uppercase"
              >
                [ REGENERATE PIN ]
              </button>
            </div>
          </div>

          {/* Section 2: Case Study & NPC Persona */}
          <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-4">
            <div className="border-b-2 border-zinc-200 pb-3 flex flex-wrap items-center justify-between gap-2">
              <span className="text-xs font-black uppercase text-black">[02. SKENARIO STUDI KASUS & KARAKTER NPC]</span>
              {builderMode === "ai_assisted" && (
                <button
                  type="button"
                  onClick={handleGenerateAiDraft}
                  disabled={isGeneratingDraft}
                  className="brutal-btn-yellow px-3.5 py-1.5 text-xs font-mono flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isGeneratingDraft ? "[ AI MERANCANG DRAF... ]" : "[ ⚡ AUTO-GENERATE DRAF AI ]"}</span>
                </button>
              )}
            </div>

            <div className="space-y-4 text-xs font-mono">
              <div>
                <label className="font-black text-black block mb-1 uppercase">Judul Misi Studi Kasus:</label>
                <input
                  type="text"
                  required
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border-2 border-black text-black font-mono focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="font-black text-black block mb-1 uppercase">Narasi Kasus / Skenario Darurat:</label>
                <textarea
                  rows={3}
                  required
                  value={caseStory}
                  onChange={(e) => setCaseStory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border-2 border-black text-black font-mono focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-black text-black block mb-1 uppercase">Nama & Peran NPC:</label>
                  <input
                    type="text"
                    required
                    value={npcName}
                    onChange={(e) => setNpcName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border-2 border-black text-black font-mono focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-black text-black block mb-1 uppercase">Persona / Karakteristik Berbicara NPC:</label>
                  <input
                    type="text"
                    required
                    value={npcPersona}
                    onChange={(e) => setNpcPersona(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border-2 border-black text-black font-mono focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-black text-black block mb-1 uppercase">Kosakata Wajib (Pisahkan dengan koma):</label>
                  <input
                    type="text"
                    required
                    value={targetVocab}
                    onChange={(e) => setTargetVocab(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border-2 border-black text-black font-mono focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-black text-black block mb-1 uppercase">Petunjuk Objek Nyata Kamera:</label>
                  <input
                    type="text"
                    required
                    value={requiredHint}
                    onChange={(e) => setRequiredHint(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border-2 border-black text-black font-mono focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Pre-Quiz Questions Editor */}
          <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-4">
            <div className="border-b-2 border-zinc-200 pb-3 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-black uppercase text-black block">
                  [03. BUTIR SOAL PRE-QUIZ ({quizQuestions.length} SOAL TERSEDIA)]
                </span>
                <span className="text-[11px] text-zinc-600">
                  Dikerjakan murid sebagai pengantar sebelum berbicara ke NPC.
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="brutal-btn-white px-3.5 py-1.5 text-xs font-mono flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ TAMBAH SOAL KUIS</span>
              </button>
            </div>

            <div className="space-y-5">
              {quizQuestions.map((q, qIdx) => (
                <div key={qIdx} className="p-4 bg-zinc-50 border-2 border-black space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-black uppercase bg-[#facc15] px-2 py-0.5 border border-black">
                      BUTIR SOAL #{qIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      title="Hapus Soal Ini"
                      className="text-red-600 hover:text-red-800 font-bold flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>HAPUS</span>
                    </button>
                  </div>

                  <div>
                    <label className="font-bold text-black block mb-1">Pertanyaan:</label>
                    <input
                      type="text"
                      required
                      value={q.question}
                      onChange={(e) => handleUpdateQuestionText(qIdx, e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-black font-mono focus:outline-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="font-bold text-black block">Pilihan Jawaban (Pilih radio untuk Kunci Jawaban):</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, optIdx) => (
                        <div
                          key={optIdx}
                          className={`flex items-center gap-2 p-2 border ${
                            q.correctIndex === optIdx ? "bg-emerald-50 border-emerald-600" : "bg-white border-zinc-300"
                          }`}
                        >
                          <input
                            type="radio"
                            name={`correct_${qIdx}`}
                            checked={q.correctIndex === optIdx}
                            onChange={() => handleSetCorrectIndex(qIdx, optIdx)}
                            className="w-4 h-4 accent-emerald-600 cursor-pointer"
                          />
                          <span className="font-bold text-black w-4">{String.fromCharCode(65 + optIdx)}.</span>
                          <input
                            type="text"
                            required
                            value={opt}
                            onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                            className="flex-1 px-2 py-1 bg-transparent border-b border-zinc-400 focus:outline-none text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="font-bold text-black block mb-1">Penjelasan Kunci Jawaban (Edukasi):</label>
                    <input
                      type="text"
                      required
                      value={q.explanation}
                      onChange={(e) => handleUpdateExplanation(qIdx, e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-black font-mono text-xs focus:outline-none text-zinc-700"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Action Button */}
          <div className="border-2 border-black bg-white p-5 shadow-[4px_4px_0px_#000000] flex flex-wrap items-center justify-between gap-4">
            <div className="text-xs font-mono text-zinc-700">
              <span className="font-black text-black block uppercase">STATUS ROOM KELAS:</span>
              PIN [{roomCode}] Siap dipublikasikan ke siswa
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="brutal-btn-yellow px-8 py-3.5 text-xs sm:text-sm font-mono font-black uppercase flex items-center gap-2 shadow-[4px_4px_0px_#000000]"
            >
              {isSubmitting ? (
                <span>[ MENYIMPAN ROOM & KUIS KE MARIADB... ]</span>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
                  <span>[ SIMPAN ROOM & BUKA DASHBOARD KELAS ]</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <BrutalAlertModal {...alertModal} />
    </div>
  );
}
