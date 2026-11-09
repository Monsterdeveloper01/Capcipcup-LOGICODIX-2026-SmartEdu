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
    <div className="bg-[#313338] border border-[#202225] p-5 sm:p-6 rounded-xl shadow-2xl font-sans text-[#dbdee1] space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-[#202225] pb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase bg-[#5865F2] text-white px-2 py-0.5 rounded">
              PORTAL GURU
            </span>
            <span className="text-xs text-[#949ba4]">Pembuatan Tugas Praktikum 3D</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-[#f2f3f5] mt-1">
            Rancang Tugas Meja Lab & Kuis AI
          </h2>
          <p className="text-xs text-[#949ba4]">
            Pilih zat kimia dari database, buat instruksi observasi, dan biarkan AI menyusun kuis pemahamannya.
          </p>
        </div>

        <div className="text-right">
          <span className="text-[10px] font-bold text-[#949ba4] uppercase">ROOM KELAS</span>
          <div className="text-sm font-bold text-white bg-[#1e1f22] px-3 py-1 rounded border border-[#3b3e45]">
            PIN {roomCode}
          </div>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-[#ed4245]/20 border border-[#ed4245] text-xs font-semibold text-[#f2f3f5] rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#ed4245] flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Quick Presets */}
      <div className="p-3.5 bg-[#2b2d31] border border-[#3b3e45] rounded-lg space-y-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#f2f3f5]">
          <BookOpen className="w-4 h-4 text-[#5865F2]" />
          <span>Templat Eksperimen Cepat (Klik untuk mengisi form otomatis):</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {REACTION_CATALOG.map((rx) => (
            <button
              key={rx.id}
              type="button"
              onClick={() => applyPresetReaction(rx.id)}
              className="px-2.5 py-1.5 bg-[#1e1f22] hover:bg-[#5865F2] hover:text-white text-[#dbdee1] text-xs font-medium rounded border border-[#3b3e45] transition-colors text-left"
            >
              <span className="text-[#57F287] font-bold mr-1">[{rx.level}]</span>
              {rx.title}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Informasi Utama Tugas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-1.5">
          <label className="text-xs font-bold text-[#f2f3f5] uppercase">
            Judul Tugas Praktikum:
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Contoh: Reaksi Netralisasi Asam Klorida dan Soda Api"
            className="w-full p-2.5 bg-[#1e1f22] border border-[#3b3e45] focus:border-[#5865F2] text-xs font-medium text-white rounded-lg outline-none transition-colors"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-bold text-[#f2f3f5] uppercase">
            Jenjang Kurikulum:
          </label>
          <select
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value as any)}
            className="w-full p-2.5 bg-[#1e1f22] border border-[#3b3e45] focus:border-[#5865F2] text-xs font-semibold text-white rounded-lg outline-none"
          >
            <option value="SD">SD (Sains Dasar & Lingkungan)</option>
            <option value="SMP">SMP (Zat & Asam-Basa Dasar)</option>
            <option value="SMA">SMA (Reaksi Redoks & Stoikiometri)</option>
          </select>
        </div>
      </div>

      {/* 3. Instruksi Langkah untuk Siswa */}
      <div className="space-y-1.5">
        <label className="text-xs font-bold text-[#f2f3f5] uppercase">
          Instruksi Misi Praktikum (Apa yang harus dilakukan siswa di Meja 3D):
        </label>
        <textarea
          rows={3}
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          placeholder="Tuliskan langkah-langkah yang harus dilakukan siswa di meja 3D (misal: 'Ambil bejana NaOH, tuangkan perlahan ke dalam bejana HCl. Amati perubahan suhu dan warna!')..."
          className="w-full p-2.5 bg-[#1e1f22] border border-[#3b3e45] focus:border-[#5865F2] text-xs font-medium text-white rounded-lg outline-none transition-colors"
        />
      </div>

      {/* 4. Pemilihan Zat Kimia untuk Meja 3D */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-[#f2f3f5] uppercase">
            PILIH ZAT KIMIA ({selectedChemicalIds.length} Terpilih untuk Meja 3D):
          </label>
          <span className="text-[11px] text-[#949ba4]">
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
                className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all ${
                  isSelected
                    ? "bg-[#404249] border-[#5865F2] ring-1 ring-[#5865F2]"
                    : "bg-[#2b2d31] hover:bg-[#35373c] border-[#3b3e45]"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs font-bold text-white font-mono">{chem.formula}</span>
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black shadow-sm"
                    style={{ backgroundColor: chem.color }}
                  />
                </div>
                <div className="text-[11px] text-[#dbdee1] truncate mt-1">
                  {chem.name}
                </div>
                <div className="flex items-center justify-between text-[10px] text-[#949ba4] mt-2 border-t border-[#3b3e45] pt-1">
                  <span>{chem.level}</span>
                  <span className={`font-bold ${isSelected ? "text-[#57F287]" : "text-[#949ba4]"}`}>
                    {isSelected ? "✓ Aktif" : "+ Tambah"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Generator Kuis AI & Soal Evaluasi */}
      <div className="p-4 bg-[#2b2d31] border border-[#3b3e45] rounded-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#3b3e45] pb-3">
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-[#f2f3f5] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#FEE75C]" />
              <span>Kuis Evaluasi Praktikum ({questions.length} Soal)</span>
            </h4>
            <p className="text-[11px] text-[#949ba4]">
              Kuis ini akan dikerjakan siswa tepat setelah berhasil mempraktikkan reaksi di meja 3D.
            </p>
          </div>

          <button
            type="button"
            onClick={handleGenerateAiQuiz}
            disabled={isGeneratingAiQuiz}
            className="bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-50 text-white px-4 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors shadow"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isGeneratingAiQuiz ? "Menyusun Soal AI..." : "Generate Kuis AI"}</span>
          </button>
        </div>

        {questions.length === 0 ? (
          <div className="text-center py-6 text-[#949ba4] text-xs border border-dashed border-[#3b3e45] rounded-lg bg-[#1e1f22] p-4">
            Belum ada soal kuis. Klik tombol <strong>&quot;Generate Kuis AI&quot;</strong> di atas untuk membuat soal observasi otomatis!
          </div>
        ) : (
          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id || idx} className="p-3 bg-[#1e1f22] border border-[#3b3e45] rounded-lg text-xs space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-bold text-white">
                    {idx + 1}. {q.question}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuestions((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-[#ed4245] hover:underline text-[11px] font-semibold"
                  >
                    Hapus
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pl-2">
                  {q.options.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className={`p-2 rounded border text-[11px] ${
                        optIdx === q.correctIndex
                          ? "bg-[#23a55a]/20 border-[#23a55a] text-[#57F287] font-semibold"
                          : "bg-[#2b2d31] border-[#3b3e45] text-[#dbdee1]"
                      }`}
                    >
                      <span className="font-bold mr-1">{String.fromCharCode(65 + optIdx)}.</span> {opt}{" "}
                      {optIdx === q.correctIndex && "✓ (Kunci)"}
                    </div>
                  ))}
                </div>

                <div className="text-[10px] text-[#949ba4] bg-[#2b2d31] p-2 rounded border border-[#3b3e45]">
                  <strong className="text-[#5865F2]">Pembahasan:</strong> {q.explanation}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 6. Action Submit Buttons */}
      <div className="flex items-center justify-between border-t border-[#202225] pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="bg-[#4e5058] hover:bg-[#6d6f78] text-white px-4 py-2 text-xs font-semibold rounded-lg transition-colors"
          >
            Batal
          </button>
        )}

        <button
          type="button"
          onClick={handleSaveTask}
          disabled={isSaving}
          className="bg-[#23a55a] hover:bg-[#1f9250] text-white px-6 py-2.5 text-xs sm:text-sm font-semibold rounded-lg flex items-center gap-2 ml-auto shadow transition-colors disabled:opacity-50"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>{isSaving ? "Menyimpan Tugas..." : "Terbitkan Tugas ke Kelas"}</span>
        </button>
      </div>
    </div>
  );
}
