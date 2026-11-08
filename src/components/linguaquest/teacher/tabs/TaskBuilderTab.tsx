"use client";

import { Sparkles, Plus, Trash2, Check, Headphones, Mic, BookOpen, Volume2, FileText } from "lucide-react";
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
  const isSpeakingTask = taskType === "HYBRID" || taskType === "SPEAKING_ONLY";
  const isQuizTask = taskType === "HYBRID" || taskType === "QUIZ_ONLY" || taskType === "LISTENING_ONLY";

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
        type: taskType === "LISTENING_ONLY" ? "listening" : "multiple_choice",
        audioScript: "",
        question: "",
        options: ["", "", "", ""],
        correctIndex: 0,
        explanation: "",
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
          Guru memiliki kebebasan penuh: buat tugas <strong>Hanya Kuis Saja</strong>, <strong>Kuis & Listening</strong>, <strong>Hanya Speaking</strong>, atau <strong>Kombinasi Keduanya</strong>.
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
              Masukkan Tujuan Belajar
            </h3>
          </div>
        </div>

        <p className="text-xs text-zinc-800 leading-relaxed">
          Ketik materi atau capaian pembelajaran (RPP) yang ingin diajarkan. Sistem AI akan menyusun skenario, penguji NPC, atau butir kuis secara otomatis.
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
            <div className="grid grid-cols-1 gap-1.5">
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
                onClick={() => {
                  onTaskTypeChange("QUIZ_ONLY");
                  onIncludeListeningChange(false);
                }}
                className={`px-2.5 py-1.5 text-[11px] font-black uppercase border-2 text-left flex items-center gap-1.5 transition-all ${
                  taskType === "QUIZ_ONLY"
                    ? "bg-[#93c5fd] text-black border-black shadow-[2px_2px_0px_#000000]"
                    : "bg-white text-zinc-700 border-zinc-400"
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>📝 Hanya Kuis Saja</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onTaskTypeChange("LISTENING_ONLY");
                  onIncludeListeningChange(true);
                }}
                className={`px-2.5 py-1.5 text-[11px] font-black uppercase border-2 text-left flex items-center gap-1.5 transition-all ${
                  taskType === "LISTENING_ONLY"
                    ? "bg-[#22d3ee] text-black border-black shadow-[2px_2px_0px_#000000]"
                    : "bg-white text-zinc-700 border-zinc-400"
                }`}
              >
                <Headphones className="w-3.5 h-3.5" />
                <span>🎧 Kuis & Listening</span>
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
                <option value="A2">A2 - Elementary</option>
                <option value="B1">B1 - Intermediate</option>
                <option value="B2">B2 - Upper Intermediate</option>
                <option value="C1">C1 - Advanced</option>
              </select>
            </div>
          </div>

          {/* Opsi Listening & Tombol Generate */}
          <div className="flex flex-col justify-between gap-3">
            <div>
              <label className="font-black uppercase block mb-1">Pengaturan Audio:</label>
              {taskType === "HYBRID" ? (
                <label className="flex items-center gap-2 cursor-pointer p-2 bg-white border border-black text-xs font-bold">
                  <input
                    type="checkbox"
                    checked={includeListening}
                    onChange={(e) => onIncludeListeningChange(e.target.checked)}
                    className="w-4 h-4 accent-black"
                  />
                  <span>Sertakan Soal Listening Audio (TTS)</span>
                </label>
              ) : taskType === "LISTENING_ONLY" ? (
                <div className="p-2 bg-cyan-50 border border-cyan-800 text-cyan-900 text-[11px] font-black uppercase">
                  🎧 Soal Listening Audio Diaktifkan Otomatis
                </div>
              ) : taskType === "QUIZ_ONLY" ? (
                <div className="p-2 bg-blue-50 border border-blue-800 text-blue-900 text-[11px] font-black uppercase">
                  📝 Murni Pilihan Ganda Tertulis
                </div>
              ) : (
                <div className="p-2 bg-amber-50 border border-amber-800 text-amber-900 text-[11px] font-black uppercase">
                  🎙️ Mode Khusus Percakapan Lisan
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={onAutoGenerateAi}
              disabled={isGeneratingAi}
              className="w-full brutal-btn-yellow py-3 text-xs font-black uppercase flex items-center justify-center gap-2 shadow-[2px_2px_0px_#000000]"
            >
              <Sparkles className={`w-4 h-4 stroke-[2.5] ${isGeneratingAi ? "animate-spin" : ""}`} />
              <span>
                {isGeneratingAi
                  ? "[ MERANCANG DRAF DENGAN AI... ]"
                  : "[ ✨ AI GENERATE TUGAS LENGKAP ]"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. FORM DETAIL TUGAS & EDITOR SOAL                                        */}
      {/* ========================================================================= */}
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-black uppercase block mb-1">
              Rombongan Kelas Penerima:
            </label>
            <input
              type="text"
              readOnly
              disabled
              value={selectedClass ? `[${selectedClass.classCode}] ${selectedClass.name}` : "Pilih kelas di tab kiri"}
              className="w-full border-2 border-black p-2.5 font-mono text-xs bg-zinc-100 font-bold"
            />
          </div>

          <div>
            <label className="text-xs font-black uppercase block mb-1">
              Format Penugasan Aktif:
            </label>
            <div className="p-2.5 bg-zinc-50 border-2 border-black text-xs font-black uppercase flex items-center gap-2">
              {taskType === "HYBRID" && <span className="text-amber-800">⚡ KOMBINASI SPEAKING + KUIS</span>}
              {taskType === "SPEAKING_ONLY" && <span className="text-emerald-800">🎙️ HANYA SPEAKING ROLEPLAY</span>}
              {taskType === "QUIZ_ONLY" && <span className="text-blue-800">📝 HANYA KUIS SAJA (PILIHAN GANDA)</span>}
              {taskType === "LISTENING_ONLY" && <span className="text-cyan-800">🎧 KUIS DENGAN AUDIO LISTENING</span>}
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
            className="w-full border-2 border-black p-2.5 font-mono text-xs bg-white outline-none font-bold placeholder-zinc-400"
          />
        </div>

        {/* SECTION: SKENARIO SPEAKING & NPC (HANYA DITAMPILKAN JIKA MEMILIKI FITUR SPEAKING) */}
        {isSpeakingTask && (
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
                className="w-full border-2 border-black p-2.5 font-mono text-xs bg-white outline-none leading-relaxed placeholder-zinc-400"
                placeholder="Contoh: Pelanggan asing merasa kecewa dengan keterlambatan pengiriman produk ramah lingkungan. Jelaskan kendala secara sopan dan tawarkan kompensasi solusi praktis..."
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
                  placeholder="Contoh: Ms. Clara (Foreign Client)"
                  className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-none placeholder-zinc-400"
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
                  placeholder="Contoh: Tegas, kritis terhadap ketepatan waktu, menghargai solusi transparan."
                  className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-none placeholder-zinc-400"
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
                  placeholder="Contoh: Tunjukkan botol minum atau buku catatan di mejamu sebagai contoh produk fisik!"
                  className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-none placeholder-zinc-400"
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
                  placeholder="Contoh: apologize, compensation, sustainable, delivery, resolution"
                  className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-none placeholder-zinc-400"
                />
              </div>
            </div>
          </div>
        )}

        {/* SECTION: BUTIR SOAL KUIS & LISTENING (HANYA DITAMPILKAN JIKA BUKAN SPEAKING_ONLY) */}
        {isQuizTask && (
          <div className="border-t-2 border-black pt-4 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="text-xs font-black uppercase block text-black">
                  Butir Soal Kuis {taskType === "LISTENING_ONLY" ? "& Listening" : ""} ({newQuizQuestions.length} Soal)
                </span>
                <span className="text-[11px] text-zinc-600">
                  {taskType === "QUIZ_ONLY"
                    ? "Butir soal pilihan ganda tertulis."
                    : "Termasuk soal pilihan ganda teks konseptual maupun soal listening audio."}
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

            {newQuizQuestions.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-zinc-300 p-4 space-y-2">
                <BookOpen className="w-6 h-6 mx-auto text-zinc-400" />
                <p className="text-xs font-bold text-zinc-600">
                  Belum ada butir soal. Gunakan tombol [ ✨ AI GENERATE TUGAS LENGKAP ] di atas atau klik [+ Tambah Soal Manual].
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {newQuizQuestions.map((qItem, qIdx) => (
                  <div
                    key={qIdx}
                    className="p-4 border-2 border-black bg-zinc-50 shadow-[2px_2px_0px_#000000] space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase bg-black text-[#facc15] px-2 py-0.5">
                          SOAL #{qIdx + 1}
                        </span>
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
                          placeholder="Contoh: I am terribly sorry about the air conditioner noise. Since we are fully booked, I cannot move you, but I will send a technician immediately..."
                          className="w-full border border-black p-2 font-mono text-xs bg-white text-black outline-none font-bold placeholder-zinc-400"
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
                        className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-none font-bold placeholder-zinc-400"
                        placeholder="Contoh: What is the most professional response when a client reports a delivery delay?"
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
                            placeholder={optIdx === 0 ? "Contoh: I apologize for the delay; let me track your shipment." : `Pilihan ${["A", "B", "C", "D"][optIdx]}`}
                            className="flex-1 border border-black p-1.5 font-mono text-xs bg-white outline-none placeholder-zinc-400"
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
                          className="w-full border border-black p-1.5 font-mono text-xs bg-white outline-none placeholder-zinc-400"
                          placeholder="Contoh: Mengakui kendala dan menawarkan langkah konkret menunjukkan keprofesionalan."
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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