"use client";

import { useState } from "react";
import { CHEMICAL_CATALOG, REACTION_CATALOG } from "@/lib/lab/chemicals-db";
import { LabTaskQuestion } from "@/lib/lab/types";
import {
  FlaskConical,
  Plus,
  Trash2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  BookOpen,
} from "lucide-react";

interface TeacherTaskBuilderProps {
  roomCode?: string;
  teacherName?: string;
  onTaskCreated?: (task: any) => void;
  onCancel?: () => void;
}

export default function TeacherTaskBuilder({
  roomCode = "LAB889",
  teacherName = "Budi Santoso, S.Pd",
  onTaskCreated,
  onCancel,
}: TeacherTaskBuilderProps) {
  const [title, setTitle] = useState("");
  const [gradeLevel, setGradeLevel] = useState<"SD" | "SMP" | "SMA">("SMP");
  const [instructions, setInstructions] = useState("");
  const [selectedChemicalIds, setSelectedChemicalIds] = useState<string[]>([]);
  const [expectedReactionId, setExpectedReactionId] = useState<string>("");

  // Quiz questions (Manual or AI Generated)
  const [questions, setQuestions] = useState<LabTaskQuestion[]>([]);
  const [isGeneratingAiQuiz, setIsGeneratingAiQuiz] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleChemical = (id: string) => {
    setSelectedChemicalIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Quick Preset Selection
  const applyPresetReaction = (rxId: string) => {
    const rx = REACTION_CATALOG.find((r) => r.id === rxId);
    if (!rx) return;

    setTitle(rx.title);
    setGradeLevel(rx.level);
    setInstructions(
      `Ambil bejana [${rx.reactantAFormula}] dan tuangkan perlahan ke dalam bejana [${rx.reactantBFormula}]. Amati perubahan visual dan suhunya!`
    );
    setSelectedChemicalIds([rx.reactantAId, rx.reactantBId, "ch_h2o"]);
    setExpectedReactionId(rx.id);
  };

  // Generate Post-Lab Quiz with Gemini AI
  const handleGenerateAiQuiz = async () => {
    if (selectedChemicalIds.length === 0) {
      setErrorMsg("Pilih minimal 1 zat kimia terlebih dahulu sebelum meminta AI menyusun kuis.");
      return;
    }

    setIsGeneratingAiQuiz(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/lab/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || "Praktikum Sains & Reaksi Kimia",
          gradeLevel,
          chemicalIds: selectedChemicalIds,
          instructions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal memproses kuis AI.");

      setQuestions(data.questions || []);
    } catch (err: any) {
      console.error("AI Quiz error:", err);
      setErrorMsg(err.message || "Gagal membuat kuis otomatis.");
    } finally {
      setIsGeneratingAiQuiz(false);
    }
  };

  const handleSaveTask = async () => {
    if (!title.trim()) {
      setErrorMsg("Judul tugas praktikum wajib diisi.");
      return;
    }
    if (selectedChemicalIds.length === 0) {
      setErrorMsg("Pilih minimal 1 zat kimia untuk ditaruh di meja 3D siswa.");
      return;
    }
    if (questions.length === 0) {
      setErrorMsg("Tugas memerlukan minimal 1 butir kuis pemahaman (klik tombol 'Generate Kuis AI' atau tambahkan manual).");
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/lab/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode,
          teacherName,
          title,
          gradeLevel,
          instructions,
          chemicalIds: selectedChemicalIds,
          expectedReactionId: expectedReactionId || null,
          questions,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal menyimpan tugas praktikum.");

      onTaskCreated?.(data);
    } catch (err: any) {
      setErrorMsg(err.message || "Gagal menyimpan tugas.");
    } finally {
      setIsSaving(false);
    }
  };

  const filteredChemicals = CHEMICAL_CATALOG.filter((c) => c.level === gradeLevel);

  return (
    <div className="bg-white border-4 border-black p-5 sm:p-7 shadow-[8px_8px_0px_#000000] font-mono space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b-4 border-black pb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <span className="text-xs font-black uppercase bg-[#facc15] text-black px-2.5 py-0.5 border-2 border-black shadow-[2px_2px_0px_#000000]">
            [ PORTAL GURU // PEMBUATAN TUGAS PRAKTIKUM 3D ]
          </span>
          <h2 className="text-lg sm:text-2xl font-black uppercase tracking-tight text-black mt-2">
            RANCANG TUGAS MEJA LAB & KUIS AI
          </h2>
          <p className="text-xs text-zinc-600 font-bold">
            Pilih zat kimia dari database, buat instruksi observasi, dan biarkan AI menyusun kuis pemahamannya.
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-black text-zinc-500">ROOM KELAS:</span>
          <div className="text-sm font-black text-black bg-zinc-100 px-3 py-1 border-2 border-black">
            PIN {roomCode}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-100 border-2 border-black text-xs font-bold text-red-900 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Quick Presets (Rekomendasi Cepat Berdasarkan Reaksi Nyata) */}
      <div className="p-4 bg-zinc-50 border-2 border-black space-y-2">
        <div className="flex items-center gap-2 text-xs font-black uppercase text-black">
          <BookOpen className="w-4 h-4 text-cyan-700" />
          <span>TEMPLAT EKSPERIMEN CEPAT (KLIK UNTUK OTOMATIS MENGISI FORM):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {REACTION_CATALOG.map((rx) => (
            <button
              key={rx.id}
              type="button"
              onClick={() => applyPresetReaction(rx.id)}
              className="px-2.5 py-1 bg-white hover:bg-[#facc15] text-black text-xs font-black border-2 border-black shadow-[2px_2px_0px_#000000] active:translate-x-0.5 active:translate-y-0.5 text-left"
            >
              [{rx.level}] {rx.title}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Informasi Utama Tugas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-black uppercase text-black">
            Judul Tugas Praktikum:
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Reaksi Netralisasi Asam Klorida dan Soda Api"
            className="w-full p-2.5 bg-white border-2 border-black text-xs font-bold text-black focus:outline-none focus:bg-amber-50"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-black">
            Jenjang Kurikulum:
          </label>
          <select
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value as any)}
            className="w-full p-2.5 bg-white border-2 border-black text-xs font-black text-black focus:outline-none"
          >
            <option value="SD">SD (Sains Dasar & Lingkungan)</option>
            <option value="SMP">SMP (Zat & Asam-Basa Dasar)</option>
            <option value="SMA">SMA (Reaksi Redoks & Stoikiometri)</option>
          </select>
        </div>
      </div>

      {/* 3. Instruksi Langkah untuk Siswa */}
      <div className="space-y-1.5">
        <label className="text-xs font-black uppercase text-black">
          Instruksi Misi Praktikum (Apa yang harus dilakukan siswa di Meja 3D):
        </label>
        <textarea
          rows={3}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Tuliskan langkah-langkah yang harus dilakukan siswa di meja 3D (misal: 'Ambil tabung A, dekatkan ke tabung B untuk menuang. Perhatikan perubahan warna dan gelembung!')..."
          className="w-full p-2.5 bg-white border-2 border-black text-xs font-bold text-black focus:outline-none focus:bg-amber-50"
        />
      </div>

      {/* 4. Pemilihan Zat Kimia untuk Meja 3D */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-black uppercase text-black">
            PILIH ZAT KIMIA DARI DATABASE ({selectedChemicalIds.length} Terpilih untuk Meja 3D Siswa):
          </label>
          <span className="text-[11px] text-zinc-500 font-bold">
            Klik kartu zat untuk mencentang/menghapus
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {CHEMICAL_CATALOG.map((chem) => {
            const isSelected = selectedChemicalIds.includes(chem.id);
            return (
              <button
                key={chem.id}
                type="button"
                onClick={() => toggleChemical(chem.id)}
                className={`p-2.5 border-2 border-black text-left flex flex-col justify-between transition-all ${
                  isSelected
                    ? "bg-[#facc15] shadow-[3px_3px_0px_#000000] scale-[1.02]"
                    : "bg-white hover:bg-zinc-100 shadow-[1px_1px_0px_#000000] opacity-80"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-black">{chem.formula}</span>
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black"
                    style={{ backgroundColor: chem.color }}
                  />
                </div>
                <div className="text-[11px] font-bold text-zinc-800 truncate mt-1">
                  {chem.name}
                </div>
                <div className="flex items-center justify-between text-[10px] font-black text-zinc-500 mt-2 border-t border-black/20 pt-1">
                  <span>{chem.level}</span>
                  <span className="font-black text-black">
                    {isSelected ? "✓ AKTIF" : "+ PILIH"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Generator Kuis AI & Soal Evaluasi */}
      <div className="p-4 bg-amber-50 border-4 border-black space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-black pb-2">
          <div>
            <h4 className="text-xs sm:text-sm font-black uppercase text-black flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              <span>KUIS EVALUASI PRAKTIKUM ({questions.length} SOAL)</span>
            </h4>
            <p className="text-[11px] text-zinc-600 font-bold">
              Kuis ini akan dikerjakan siswa tepat setelah berhasil mempraktikkan reaksi di meja 3D.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateAiQuiz}
            disabled={isGeneratingAiQuiz}
            className="brutal-btn-yellow px-4 py-2 text-xs font-black uppercase flex items-center gap-1.5 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGeneratingAiQuiz ? "✨ AI SEDANG MENYUSUN SOAL..." : "✨ GENERATE KUIS DENGAN AI"}</span>
          </button>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-6 text-zinc-500 text-xs font-bold border-2 border-dashed border-black bg-white p-4">
            Belum ada soal kuis. Klik tombol <strong>&quot;✨ GENERATE KUIS DENGAN AI&quot;</strong> di atas untuk membuat soal observasi otomatis!
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id || idx} className="p-3 bg-white border-2 border-black text-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-black text-black">
                    {idx + 1}. {q.question}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-red-600 hover:text-red-800 text-[11px] font-black"
                  >
                    [ HAPUS ]
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2">
                  {q.options.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className={`p-1.5 border border-black text-[11px] font-bold ${
                        optIdx === q.correctIndex ? "bg-emerald-100 text-emerald-950 font-black" : "bg-zinc-50"
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}. {opt}{" "}
                      {optIdx === q.correctIndex && "✓ (Kunci Jawaban)"}
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-zinc-600 italic bg-zinc-50 p-1.5 border border-zinc-200">
                  <strong>Pembahasan Ilmiah:</strong> {q.explanation}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Action Submit Buttons */}
      <div className="flex items-center justify-between border-t-4 border-black pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="brutal-btn-white px-4 py-2 text-xs font-black uppercase"
          >
            [ BATAL ]
          </button>
        )}

        <button
          type="button"
          onClick={handleSaveTask}
          disabled={isSaving}
          className="brutal-btn-yellow px-6 py-3 text-xs sm:text-sm font-black uppercase flex items-center gap-2 ml-auto shadow-[4px_4px_0px_#000000] disabled:opacity-50"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>{isSaving ? "MENYIMPAN TUGAS..." : "TERBITKAN TUGAS PRAKTIKUM KE KELAS"}</span>
        </button>
      </div>
    </div>
  );
}
