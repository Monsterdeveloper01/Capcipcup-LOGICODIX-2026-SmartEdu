"use client";

import { Sparkles, Plus, Trash2, Check } from "lucide-react";
import { ClassroomItem, QuizQuestionItem } from "../types";

interface Props {
  selectedClass: ClassroomItem | null;
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
  const handleAddQuestion = () => {
    onQuizQuestionsChange([
      ...newQuizQuestions,
      {
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
    <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b-2 border-zinc-200 pb-4">
        <div>
          <span className="font-mono text-xs font-black uppercase text-amber-800">
            [FORMULIR PENUGASAN // KELAS: {selectedClass?.name || "Semua Kelas"}]
          </span>
          <h2 className="font-black text-xl sm:text-2xl text-black uppercase tracking-tight">
            Buat Tugas Speaking & Kuis Mandiri Baru
          </h2>
          <p className="text-xs text-zinc-600 mt-0.5">
            Tugas ini akan otomatis ditambahkan ke kelas <strong>[{selectedClass?.classCode}]</strong> dan langsung muncul di daftar tugas murid.
          </p>
        </div>

        <button
          type="button"
          onClick={onAutoGenerateAi}
          disabled={isGeneratingAi}
          className="brutal-btn-yellow px-4 py-2.5 text-xs font-black uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_#000000]"
        >
          <Sparkles className={`w-3.5 h-3.5 text-black ${isGeneratingAi ? "animate-spin" : ""}`} />
          <span>{isGeneratingAi ? "[ MENYUSUN DRAF AI... ]" : "[ ⚡ BUAT DRAF CEPAT DENGAN AI ]"}</span>
        </button>
      </div>

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
              Target CEFR Level:
            </label>
            <select
              value={newDifficulty}
              onChange={(e) => onDifficultyChange(e.target.value)}
              className="w-full border-2 border-black p-2.5 font-mono text-xs bg-white outline-hidden font-bold"
            >
              <option value="A1">A1 - Pemula Dasar</option>
              <option value="A2">A2 - Elementary</option>
              <option value="B1">B1 - Intermediate</option>
              <option value="B2">B2 - Upper Intermediate</option>
              <option value="C1">C1 - Advanced Professional</option>
            </select>
          </div>
        </div>

        <div>
          <label className="text-xs font-black uppercase block mb-1">
            Judul Materi / Skenario Kasus:
          </label>
          <input
            type="text"
            required
            value={newTopic}
            onChange={(e) => onTopicChange(e.target.value)}
            placeholder="Contoh: Negosiasi Produk Ramah Lingkungan..."
            className="w-full border-2 border-black p-2.5 font-mono text-xs bg-white outline-hidden font-bold"
          />
        </div>

        <div>
          <label className="text-xs font-black uppercase block mb-1">
            Skenario Kasus Nyata (Case Study Story):
          </label>
          <textarea
            required
            rows={3}
            value={newCaseStory}
            onChange={(e) => onCaseStoryChange(e.target.value)}
            className="w-full border-2 border-black p-2.5 font-mono text-xs bg-white outline-hidden leading-relaxed"
            placeholder="Ceritakan latar belakang kasus untuk memancing respon speaking siswa..."
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
              className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-hidden"
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
              className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-hidden"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-black uppercase block mb-1">
              Benda Nyata yang Harus Discan:
            </label>
            <input
              type="text"
              value={newRequiredHint}
              onChange={(e) => onRequiredHintChange(e.target.value)}
              className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-hidden"
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
              className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-hidden"
            />
          </div>
        </div>

        {/* Soal Kuis Pilihan Ganda */}
        <div className="border-t-2 border-black pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-black uppercase block text-black">
                Butir Soal Kuis Pilihan Ganda ({newQuizQuestions.length} Soal)
              </span>
              <span className="text-[11px] text-zinc-500">
                Siswa menjawab soal ini sebelum atau sesudah sesi speaking.
              </span>
            </div>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="brutal-btn-white px-3 py-1.5 text-xs font-black uppercase flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>[ + Tambah Soal ]</span>
            </button>
          </div>

          <div className="space-y-4">
            {newQuizQuestions.map((qItem, qIdx) => (
              <div key={qIdx} className="border-2 border-black bg-zinc-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase bg-black text-white px-2 py-0.5">
                    Soal #{qIdx + 1}
                  </span>
                  {newQuizQuestions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(qIdx)}
                      className="text-red-700 hover:text-red-900 text-xs font-black flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Soal</span>
                    </button>
                  )}
                </div>

                <input
                  type="text"
                  value={qItem.question}
                  onChange={(e) => {
                    const next = [...newQuizQuestions];
                    next[qIdx].question = e.target.value;
                    onQuizQuestionsChange(next);
                  }}
                  className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-hidden font-bold"
                  placeholder="Ketik pertanyaan kuis..."
                />

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
                        className="flex-1 border border-black p-1.5 font-mono text-xs bg-white outline-hidden"
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
                        next[qIdx].correctIndex = parseInt(e.target.value);
                        onQuizQuestionsChange(next);
                      }}
                      className="w-full border border-black p-1.5 font-mono text-xs bg-white outline-hidden font-bold"
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
                      className="w-full border border-black p-1.5 font-mono text-xs bg-white outline-hidden"
                      placeholder="Alasan jawaban ini benar..."
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t-2 border-black pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isSavingTask}
            className="brutal-btn-yellow px-8 py-3 text-xs font-black uppercase flex items-center gap-2 shadow-[3px_3px_0px_#000000]"
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

