"use client";

import { Sparkles, Plus, Trash2, Check, Headphones, Mic, BookOpen, Volume2 } from "lucide-react";
import { ClassroomItem, QuizQuestionItem, TaskType } from "../types";

interface Props {
  selectedClass: ClassroomItem | null;
  taskType: TaskType;
  learningObjective: string;
  questionCount: number;
  includeListening: boolean;
  newTopic: string;
  newDifficulty: string;
  newCaseStory: string;
  newNpcName: string;
  newNpcPersona: string;
  newRequiredHint: string;
  newTargetVocab: string;
  newQuizQuestions: QuizQuestionItem[];
  isGeneratingAi: boolean;
  isSavingTask: boolean;
  onTaskTypeChange: (val: TaskType) => void;
  onLearningObjectiveChange: (val: string) => void;
  onQuestionCountChange: (val: number) => void;
  onIncludeListeningChange: (val: boolean) => void;
  onTopicChange: (val: string) => void;
  onDifficultyChange: (val: string) => void;
  onCaseStoryChange: (val: string) => void;
  onNpcNameChange: (val: string) => void;
  onNpcPersonaChange: (val: string) => void;
  onRequiredHintChange: (val: string) => void;
  onTargetVocabChange: (val: string) => void;
  onQuizQuestionsChange: (questions: QuizQuestionItem[]) => void;
  onAutoGenerateAi: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export default function TaskBuilderTab({
  selectedClass,
  taskType,
  learningObjective,
  questionCount,
  includeListening,
  newTopic,
  newDifficulty,
  newCaseStory,
  newNpcName,
  newNpcPersona,
  newRequiredHint,
  newTargetVocab,
  newQuizQuestions,
  isGeneratingAi,
  isSavingTask,
  onTaskTypeChange,
  onLearningObjectiveChange,
  onQuestionCountChange,
  onIncludeListeningChange,
  onTopicChange,
  onDifficultyChange,
  onCaseStoryChange,
  onNpcNameChange,
  onNpcPersonaChange,
  onRequiredHintChange,
  onTargetVocabChange,
  onQuizQuestionsChange,
  onAutoGenerateAi,
  onSubmit,
}: Props) {
  const testPlayAudio = (text: string) => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "en-US";
      utterance.rate = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAddQuestion = () => {
    onQuizQuestionsChange([
      ...newQuizQuestions,
      {
        type: "multiple_choice",
        audioScript: "",
        question: "Pertanyaan baru...",
        options: ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
        correctIndex: 0,
        explanation: "Penjelasan jawaban benar...",
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    onQuizQuestionsChange(newQuizQuestions.filter((_, i) => i !== idx));
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    const next = [...newQuizQuestions];
    const opts = [...next[qIdx].options] as [string, string, string, string];
    opts[optIdx] = val;
    next[qIdx] = { ...next[qIdx], options: opts };
    onQuizQuestionsChange(next);
  };

  return (
    <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-6 font-mono text-black">
      {/* Header */}
      <div className="border-b-2 border-zinc-200 pb-4">
        <span className="text-xs font-black uppercase text-amber-800 block">
          [FORMULIR PENUGASAN // KELAS: {selectedClass?.name || "Semua Kelas"}]
        </span>
        <h2 className="font-black text-xl sm:text-2xl text-black uppercase tracking-tight">
          Buat Tugas Baru untuk Kelas [{selectedClass?.classCode}]
        </h2>
        <p className="text-xs text-zinc-600 mt-0.5">
          Guru memiliki kebebasan penuh: buat tugas <strong>Speaking Roleplay Saja</strong>, <strong>Kuis & Listening Saja</strong>, atau <strong>Kombinasi Keduanya</strong>.
        </p>
      </div>

      {/* ========================================================================= */}
      {/* 1. ASISTEN AI GENERATOR DARI MAKSUD & TUJUAN BELAJAR                      */}
      {/* ========================================================================= */}
      <div className="p-5 border-2 border-black bg-gradient-to-r from-amber-50 to-yellow-100 shadow-[4px_4px_0px_#000000] space-y-4">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 bg-[#facc15] border-2 border-black shadow-[1px_1px_0px_#000000]">
            <Sparkles className="w-5 h-5 text-black" />
          </span>
          <div>
            <span className="text-[10px] font-black uppercase bg-black text-[#facc15] px-2 py-0.5">
              FITUR CERDAS // OTOMATISASI GENERATOR AI GEMINI
            </span>
            <h3 className="text-sm sm:text-base font-black uppercase text-black">
              Guru Tidak Perlu Merangkai Skenario Manual: Cukup Masukkan Tujuan Belajar
            </h3>
          </div>
        </div>

        <p className="text-xs text-zinc-800 leading-relaxed">
          Ketik tujuan belajar / materi yang ingin diajarkan. AI Gemini akan otomatis menyusun judul, skenario studi kasus, penguji NPC, hingga butir soal listening dengan audio script sesuai jumlah yang diminta.
        </p>

        {/* Input Tujuan Belajar */}
        <div>
          <label className="text-xs font-black uppercase block mb-1">
            🎯 Maksud & Tujuan Pembelajaran (Capaian Pembelajaran / RPP):
          </label>
          <textarea
            rows={2}
            value={learningObjective}
            onChange={(e) => onLearningObjectiveChange(e.target.value)}
            placeholder="Contoh: Siswa mampu memesan kamar hotel dalam bahasa Inggris, menanyakan sarapan, dan menyampaikan permintaan kamar lantai atas..."
            className="w-full border-2 border-black p-2.5 font-mono text-xs bg-white text-black outline-none font-bold placeholder-zinc-400"
          />
        </div>

        {/* Controls: Jenis Tugas, Jumlah Soal, CEFR, Listening */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          {/* Format Tugas */}
          <div>
            <label className="font-black uppercase block mb-1">Pilihan Format Tugas:</label>
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => onTaskTypeChange("HYBRID")}
                className={`px-2.5 py-1.5 text-[11px] font-black uppercase border-2 text-left flex items-center gap-1.5 transition-all ${
                  taskType === "HYBRID"
                    ? "bg-[#facc15] text-black border-black shadow-[2px_2px_0px_#000000]"
                    : "bg-white text-zinc-700 border-zinc-400"
                }`}
              >
                <span>⚡ Speaking + Kuis</span>
              </button>
              <button
                type="button"
                onClick={() => onTaskTypeChange("SPEAKING_ONLY")}
                className={`px-2.5 py-1.5 text-[11px] font-black uppercase border-2 text-left flex items-center gap-1.5 transition-all ${
                  taskType === "SPEAKING_ONLY"
                    ? "bg-[#facc15] text-black border-black shadow-[2px_2px_0px_#000000]"
                    : "bg-white text-zinc-700 border-zinc-400"
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>🎙️ Hanya Speaking</span>
              </button>
              <button
                type="button"
                onClick={() => onTaskTypeChange("QUIZ_ONLY")}
                className={`px-2.5 py-1.5 text-[11px] font-black uppercase border-2 text-left flex items-center gap-1.5 transition-all ${
                  taskType === "QUIZ_ONLY"
                    ? "bg-[#22d3ee] text-black border-black shadow-[2px_2px_0px_#000000]"
                    : "bg-white text-zinc-700 border-zinc-400"
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>📝 Hanya Kuis & Listening</span>
              </button>
            </div>
          </div>

          {/* Jumlah Soal */}
          <div>
            <label className="font-black uppercase block mb-1">Jumlah Butir Soal:</label>
            <select
              value={questionCount}
              disabled={taskType === "SPEAKING_ONLY"}
              onChange={(e) => onQuestionCountChange(parseInt(e.target.value, 10))}
              className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-none font-bold disabled:bg-zinc-100 disabled:text-zinc-400"
            >
              <option value={1}>1 Soal Kilat</option>
              <option value={3}>3 Soal Standar</option>
              <option value={5}>5 Soal Lengkap</option>
              <option value={8}>8 Soal Mendalam</option>
              <option value={10}>10 Soal Ujian</option>
            </select>

            <div className="mt-3">
              <label className="font-black uppercase block mb-1">Target CEFR:</label>
              <select
                value={newDifficulty}
                onChange={(e) => onDifficultyChange(e.target.value)}
                className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-none font-bold"
              >
                <option value="A1">A1 - Pemula Dasar</option>
                <option value="A2">A2 - Elementary</option>
                <option value="B1">B1 - Intermediate</option>
                <option value="B2">B2 - Upper Intermediate</option>
                <option value="C1">C1 - Advanced Professional</option>
              </select>
            </div>
          </div>

          {/* Opsi Soal Listening */}
          <div className="flex flex-col justify-between">
            <div>
              <label className="font-black uppercase block mb-1">Tipe Soal Listening:</label>
              <label className="flex items-center gap-2 p-2.5 bg-white border-2 border-black cursor-pointer shadow-[2px_2px_0px_#000000]">
                <input
                  type="checkbox"
                  checked={includeListening}
                  disabled={taskType === "SPEAKING_ONLY"}
                  onChange={(e) => onIncludeListeningChange(e.target.checked)}
                  className="w-4 h-4 accent-amber-500"
                />
                <span className="text-xs font-bold leading-tight">
                  Sertakan Soal Listening dengan Suara Audio (TTS)
                </span>
              </label>
              <p className="text-[10px] text-zinc-600 mt-1">
                Sistem otomatis membacakan teks naskah audio dengan pengucapan bahasa Inggris natural.
              </p>
            </div>

            <button
              type="button"
              onClick={onAutoGenerateAi}
              disabled={isGeneratingAi}
              className="w-full brutal-btn-yellow py-3 text-xs font-black uppercase flex items-center justify-center gap-2 shadow-[3px_3px_0px_#000000] mt-3"
            >
              <Sparkles className={`w-4 h-4 ${isGeneratingAi ? "animate-spin text-amber-700" : ""}`} />
              <span>{isGeneratingAi ? "[ MENYUSUN DRAF AI... ]" : "[ ⚡ GENERATE OTOMATIS DENGAN AI ]"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FORMULIR PENUGASAN (DETAIL YANG DAPAT DIEDIT GURU)                    */}
      {/* ========================================================================= */}
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-black uppercase block mb-1">
              Kelas Tujuan Penugasan:
            </label>
            <input
              type="text"
              disabled
              value={`[${selectedClass?.classCode}] ${selectedClass?.name}`}
              className="w-full border-2 border-black p-2.5 font-mono text-xs bg-zinc-100 text-black font-black uppercase"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase block mb-1">
              Format Penugasan Aktif:
            </label>
            <div className="p-2.5 bg-zinc-50 border-2 border-black text-xs font-black uppercase flex items-center gap-2">
              {taskType === "HYBRID" && <span className="text-amber-800">⚡ KOMBINASI SPEAKING + KUIS</span>}
              {taskType === "SPEAKING_ONLY" && <span className="text-emerald-800">🎙️ HANYA SPEAKING ROLEPLAY</span>}
              {taskType === "QUIZ_ONLY" && <span className="text-cyan-800">📝 HANYA BUTIR SOAL & LISTENING</span>}
            </div>
          </div>
        </div>

        <div>
          <label className="text-xs font-black uppercase block mb-1">
            Judul Tugas / Materi:
          </label>
          <input
            type="text"
            required
            value={newTopic}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder="Contoh: Restaurant Dining & Food Allergy Inquiry"
            className="w-full border-2 border-black p-2.5 font-mono text-xs bg-white outline-none font-bold"
          />
        </div>

        {/* SECTION: SKENARIO SPEAKING & NPC (HANYA DITAMPILKAN JIKA BUKAN QUIZ_ONLY) */}
        {taskType !== "QUIZ_ONLY" && (
          <div className="p-4 border-2 border-black bg-zinc-50 space-y-4">
            <span className="text-[10px] font-black uppercase bg-black text-[#facc15] px-2 py-0.5">
              BAGIAN 01 // SKENARIO SPEAKING & OBJEK FISIK
            </span>

            <div>
              <label className="text-xs font-black uppercase block mb-1">
                Skenario Kasus Nyata (Case Study Story):
              </label>
              <textarea
                required
                rows={3}
                value={newCaseStory}
                onChange={(e) => onCaseStoryChange(e.target.value)}
                className="w-full border-2 border-black p-2.5 font-mono text-xs bg-white outline-none leading-relaxed"
                placeholder="Ceritakan situasi studi kasus di mana siswa harus berbicara menggunakan bahasa Inggris..."
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black uppercase block mb-1">
                  Nama Karakter Penguji (NPC AI):
                </label>
                <input
                  type="text"
                  value={newNpcName}
                  onChange={(e) => onNpcNameChange(e.target.value)}
                  className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase block mb-1">
                  Persona & Sikap Penguji:
                </label>
                <input
                  type="text"
                  value={newNpcPersona}
                  onChange={(e) => onNpcPersonaChange(e.target.value)}
                  className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black uppercase block mb-1">
                  Petunjuk Benda Nyata yang Harus Discan:
                </label>
                <input
                  type="text"
                  value={newRequiredHint}
                  onChange={(e) => onRequiredHintChange(e.target.value)}
                  className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase block mb-1">
                  Target Kosakata Wajib (Pisahkan Koma):
                </label>
                <input
                  type="text"
                  value={newTargetVocab}
                  onChange={(e) => onTargetVocabChange(e.target.value)}
                  className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION: BUTIR SOAL KUIS & LISTENING (HANYA DITAMPILKAN JIKA BUKAN SPEAKING_ONLY) */}
        {taskType !== "SPEAKING_ONLY" && (
          <div className="border-t-2 border-black pt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-black uppercase block text-black">
                  Butir Soal Kuis & Listening ({newQuizQuestions.length} Soal)
                </span>
                <span className="text-[11px] text-zinc-600">
                  Termasuk soal pilihan ganda teks konseptual maupun soal listening audio.
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="brutal-btn-white px-3 py-1.5 text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>[ + Tambah Soal Manual ]</span>
              </button>
            </div>

            <div className="space-y-4">
              {newQuizQuestions.map((qItem, qIdx) => (
                <div key={qIdx} className="border-2 border-black bg-zinc-50 p-4 space-y-3 shadow-[3px_3px_0px_#000000]">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase bg-black text-white px-2 py-0.5">
                        Soal #{qIdx + 1}
                      </span>
                      {/* Switch Tipe Soal */}
                      <select
                        value={qItem.type || "multiple_choice"}
                        onChange={(e) => {
                          const next = [...newQuizQuestions];
                          next[qIdx].type = e.target.value as any;
                          onQuizQuestionsChange(next);
                        }}
                        className="border border-black px-2 py-0.5 text-xs font-black uppercase bg-white"
                      >
                        <option value="multiple_choice">📝 Pilihan Ganda Teks</option>
                        <option value="listening">🎧 Soal Listening (Audio Suara)</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="text-red-700 hover:text-red-900 text-xs font-black flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Soal</span>
                    </button>
                  </div>

                  {/* Naskah Audio untuk Soal Listening */}
                  {qItem.type === "listening" && (
                    <div className="p-3 bg-amber-50 border-2 border-amber-600 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-black uppercase text-amber-900 flex items-center gap-1.5">
                          <Headphones className="w-3.5 h-3.5" />
                          <span>Naskah Audio Listening (Disuarakan oleh Sistem):</span>
                        </label>
                        {qItem.audioScript && (
                          <button
                            type="button"
                            onClick={() => testPlayAudio(qItem.audioScript || "")}
                            className="brutal-btn-yellow px-2.5 py-1 text-[10px] font-black uppercase flex items-center gap-1"
                          >
                            <Volume2 className="w-3 h-3" />
                            <span>[ 🔊 Tes Putar Audio ]</span>
                          </button>
                        )}
                      </div>
                      <textarea
                        rows={2}
                        value={qItem.audioScript || ""}
                        onChange={(e) => {
                          const next = [...newQuizQuestions];
                          next[qIdx].audioScript = e.target.value;
                          onQuizQuestionsChange(next);
                        }}
                        placeholder="Ketik teks percakapan / pengumuman dalam bahasa Inggris yang akan dibacakan audio ke siswa..."
                        className="w-full border border-black p-2 font-mono text-xs bg-white text-black outline-none font-bold"
                      />
                    </div>
                  )}

                  {/* Pertanyaan */}
                  <div>
                    <label className="text-[11px] font-black uppercase block mb-1">
                      Kalimat Pertanyaan:
                    </label>
                    <input
                      type="text"
                      value={qItem.question}
                      onChange={(e) => {
                        const next = [...newQuizQuestions];
                        next[qIdx].question = e.target.value;
                        onQuizQuestionsChange(next);
                      }}
                      className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-none font-bold"
                      placeholder="Ketik pertanyaan kuis..."
                    />
                  </div>

                  {/* Pilihan A, B, C, D */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                    {qItem.options.map((opt, optIdx) => (
                      <div key={optIdx} className="flex items-center gap-2">
                        <span className="font-black text-zinc-700 w-5">
                          {["A", "B", "C", "D"][optIdx]}.
                        </span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                          className="flex-1 border border-black p-1.5 font-mono text-xs bg-white outline-none"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[11px] font-black uppercase block mb-1">
                        Kunci Jawaban Benar:
                      </label>
                      <select
                        value={qItem.correctIndex}
                        onChange={(e) => {
                          const next = [...newQuizQuestions];
                          next[qIdx].correctIndex = parseInt(e.target.value, 10);
                          onQuizQuestionsChange(next);
                        }}
                        className="w-full border border-black p-1.5 font-mono text-xs bg-white outline-none font-bold"
                      >
                        <option value={0}>Pilihan A</option>
                        <option value={1}>Pilihan B</option>
                        <option value={2}>Pilihan C</option>
                        <option value={3}>Pilihan D</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-black uppercase block mb-1">
                        Penjelasan / Feedback:
                      </label>
                      <input
                        type="text"
                        value={qItem.explanation}
                        onChange={(e) => {
                          const next = [...newQuizQuestions];
                          next[qIdx].explanation = e.target.value;
                          onQuizQuestionsChange(next);
                        }}
                        className="w-full border border-black p-1.5 font-mono text-xs bg-white outline-none"
                        placeholder="Alasan jawaban ini benar..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="border-t-2 border-black pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSavingTask}
            className="brutal-btn-yellow px-8 py-3.5 text-xs font-black uppercase flex items-center gap-2 shadow-[4px_4px_0px_#000000]"
          >
            {isSavingTask ? (
              <span>[ MENYIMPAN TUGAS KE KELAS... ]</span>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>[ SIMPAN TUGAS & TUGASKAN KE KELAS ]</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
