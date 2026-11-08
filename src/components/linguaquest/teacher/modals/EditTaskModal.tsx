"use client";

import { X, Check, Plus, Trash2, Headphones, Volume2 } from "lucide-react";
import { TeacherRoomItem, QuizQuestionItem } from "../types";

interface Props {
  editingRoom: TeacherRoomItem | null;
  editTitle: string;
  editRoomCode: string;
  editDifficulty: string;
  editCaseStory: string;
  editNpcName: string;
  editNpcPersona: string;
  editRequiredHint: string;
  editTargetVocab: string;
  editQuizQuestions: QuizQuestionItem[];
  isUpdating: boolean;
  onTitleChange: (val: string) => void;
  onDifficultyChange: (val: string) => void;
  onCaseStoryChange: (val: string) => void;
  onNpcNameChange: (val: string) => void;
  onNpcPersonaChange: (val: string) => void;
  onRequiredHintChange: (val: string) => void;
  onTargetVocabChange: (val: string) => void;
  onQuizQuestionsChange: (questions: QuizQuestionItem[]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}

export default function EditTaskModal({
  editingRoom,
  editTitle,
  editRoomCode,
  editDifficulty,
  editCaseStory,
  editNpcName,
  editNpcPersona,
  editRequiredHint,
  editTargetVocab,
  editQuizQuestions,
  isUpdating,
  onTitleChange,
  onDifficultyChange,
  onCaseStoryChange,
  onNpcNameChange,
  onNpcPersonaChange,
  onRequiredHintChange,
  onTargetVocabChange,
  onQuizQuestionsChange,
  onSubmit,
  onClose,
}: Props) {
  if (!editingRoom) return null;

  const isSpeakingTask = editingRoom.taskType === "HYBRID" || editingRoom.taskType === "SPEAKING_ONLY" || !editingRoom.taskType;
  const isQuizTask = editingRoom.taskType === "HYBRID" || editingRoom.taskType === "QUIZ_ONLY" || editingRoom.taskType === "LISTENING_ONLY" || !editingRoom.taskType;

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
      ...editQuizQuestions,
      {
        type: "multiple_choice",
        audioScript: "",
        question: "Pertanyaan kuis baru...",
        options: ["Pilihan A", "Pilihan B", "Pilihan C", "Pilihan D"],
        correctIndex: 0,
        explanation: "Penjelasan jawaban benar...",
      },
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    onQuizQuestionsChange(editQuizQuestions.filter((_, i) => i !== idx));
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    const next = [...editQuizQuestions];
    const opts = [...next[qIdx].options] as [string, string, string, string];
    opts[optIdx] = val;
    next[qIdx] = { ...next[qIdx], options: opts };
    onQuizQuestionsChange(next);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 font-mono overflow-y-auto">
      <div className="border-4 border-black bg-white max-w-3xl w-full my-8 p-6 shadow-[8px_8px_0px_#000000] space-y-6 text-black max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase bg-[#22d3ee] text-black px-2 py-0.5 border border-black">
                [EDIT TUGAS KELAS]
              </span>
              <span className="text-xs font-black uppercase text-zinc-500">
                PIN: [{editRoomCode}]
              </span>
            </div>
            <h2 className="text-lg font-black uppercase tracking-tight mt-1">
              Sunting Skenario & Kuis Tugas Kelas
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-black text-white hover:bg-zinc-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black uppercase block mb-1">
                Target CEFR Level:
              </label>
              <select
                value={editDifficulty}
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

            <div>
              <label className="text-xs font-black uppercase block mb-1">
                PIN Kelas:
              </label>
              <input
                type="text"
                disabled
                value={editRoomCode}
                className="w-full border-2 border-zinc-300 p-2.5 font-mono text-xs bg-zinc-100 text-zinc-500 cursor-not-allowed font-bold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-black uppercase block mb-1">
              Judul Tugas Misi:
            </label>
            <input
              type="text"
              required
              value={editTitle}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="Contoh: Restaurant Dining & Food Allergy Inquiry"
              className="w-full border-2 border-black p-2.5 font-mono text-xs bg-white outline-hidden font-bold placeholder-zinc-400"
            />
          </div>

          {/* Skenario Speaking (Hanya untuk tugas yang melibatkan speaking) */}
          {isSpeakingTask && (
            <div className="p-4 border-2 border-black bg-zinc-50 space-y-4">
              <span className="text-[10px] font-black uppercase bg-black text-[#facc15] px-2 py-0.5">
                SKENARIO ROLEPLAY & NPC
              </span>

              <div>
                <label className="text-xs font-black uppercase block mb-1">
                  Skenario Kasus Nyata:
                </label>
                <textarea
                  required={isSpeakingTask}
                  rows={3}
                  value={editCaseStory}
                  onChange={(e) => onCaseStoryChange(e.target.value)}
                  placeholder="Contoh: Pelanggan asing merasa kecewa dengan keterlambatan pengiriman..."
                  className="w-full border-2 border-black p-2.5 font-mono text-xs bg-white outline-hidden leading-relaxed placeholder-zinc-400"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-black uppercase block mb-1">
                    Nama NPC Penguji:
                  </label>
                  <input
                    type="text"
                    value={editNpcName}
                    onChange={(e) => onNpcNameChange(e.target.value)}
                    placeholder="Contoh: Ms. Clara (Foreign Client)"
                    className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-hidden placeholder-zinc-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase block mb-1">
                    Persona NPC:
                  </label>
                  <input
                    type="text"
                    value={editNpcPersona}
                    onChange={(e) => onNpcPersonaChange(e.target.value)}
                    placeholder="Contoh: Tegas, kritis terhadap ketepatan waktu, menghargai solusi transparan."
                    className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-hidden placeholder-zinc-400"
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
                    value={editRequiredHint}
                    onChange={(e) => onRequiredHintChange(e.target.value)}
                    placeholder="Contoh: Tunjukkan botol minum atau buku catatan di meja!"
                    className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-hidden placeholder-zinc-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-black uppercase block mb-1">
                    Target Kosakata (Pisahkan Koma):
                  </label>
                  <input
                    type="text"
                    value={editTargetVocab}
                    onChange={(e) => onTargetVocabChange(e.target.value)}
                    placeholder="Contoh: apologize, compensation, sustainable, delivery, resolution"
                    className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-hidden placeholder-zinc-400"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Edit Quiz Section */}
          {isQuizTask && (
            <div className="border-t-2 border-black pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase block text-black">
                Soal Kuis Pilihan Ganda ({editQuizQuestions.length} Butir)
              </span>
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
              {editQuizQuestions.map((qItem, qIdx) => (
                <div key={qIdx} className="border-2 border-black bg-zinc-50 p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase bg-black text-white px-2 py-0.5">
                        Soal #{qIdx + 1}
                      </span>
                      <select
                        value={qItem.type || "multiple_choice"}
                        onChange={(e) => {
                          const next = [...editQuizQuestions];
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
                          <span>Naskah Audio Listening:</span>
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
                          const next = [...editQuizQuestions];
                          next[qIdx].audioScript = e.target.value;
                          onQuizQuestionsChange(next);
                        }}
                        placeholder="Ketik teks dialog bahasa Inggris yang akan dibacakan audio ke siswa..."
                        className="w-full border border-black p-2 font-mono text-xs bg-white text-black outline-none font-bold"
                      />
                    </div>
                  )}

                  <input
                    type="text"
                    value={qItem.question}
                    onChange={(e) => {
                      const next = [...editQuizQuestions];
                      next[qIdx].question = e.target.value;
                      onQuizQuestionsChange(next);
                    }}
                    className="w-full border-2 border-black p-2 font-mono text-xs bg-white outline-hidden font-bold"
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
                        Kunci Jawaban:
                      </label>
                      <select
                        value={qItem.correctIndex}
                        onChange={(e) => {
                          const next = [...editQuizQuestions];
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
                        Penjelasan:
                      </label>
                      <input
                        type="text"
                        value={qItem.explanation}
                        onChange={(e) => {
                          const next = [...editQuizQuestions];
                          next[qIdx].explanation = e.target.value;
                          onQuizQuestionsChange(next);
                        }}
                        className="w-full border border-black p-1.5 font-mono text-xs bg-white outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

          <div className="border-t-2 border-black pt-4 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              disabled={isUpdating}
              className="brutal-btn-white px-5 py-2.5 text-xs font-black uppercase"
            >
              [ BATAL ]
            </button>
            <button
              type="submit"
              disabled={isUpdating}
              className="brutal-btn-yellow px-6 py-2.5 text-xs font-black uppercase flex items-center gap-1.5 shadow-[3px_3px_0px_#000000]"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>[ SIMPAN PERUBAHAN TUGAS ]</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

