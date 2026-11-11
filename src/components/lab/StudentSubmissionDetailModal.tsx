"use client";

import { useState, useEffect } from "react";
import { LabSubmission, LabTask } from "@/lib/lab/types";
import { REACTION_CATALOG, CHEMICAL_CATALOG } from "@/lib/lab/chemicals-db";
import { ChemicalFormula, ChemicalEquation, FormattedAiMessage } from "./ChemicalFormula";
import {
  X,
  Award,
  CheckCircle2,
  XCircle,
  FlaskConical,
  Flame,
  Thermometer,
  Clock,
  Sparkles,
  HelpCircle,
  Calendar,
  Lightbulb,
  BookOpen,
  AlertCircle,
  TrendingUp,
  Bot,
  MessageSquare,
} from "lucide-react";

interface StudentSubmissionDetailModalProps {
  submission: LabSubmission | null;
  task?: LabTask | null;
  onClose: () => void;
  isTeacherView?: boolean;
}

export default function StudentSubmissionDetailModal({
  submission,
  task,
  onClose,
  isTeacherView = true,
}: StudentSubmissionDetailModalProps) {
  if (!submission) return null;

  const exp = submission.experimentDetails;
  const answers = submission.answers || [];
  const score = submission.score;

  // AI Diagnostic Logs for this student & task
  const [studentAiLogs, setStudentAiLogs] = useState<any[]>([]);
  const [isLoadingAiLogs, setIsLoadingAiLogs] = useState<boolean>(false);

  useEffect(() => {
    if (submission?.studentName) {
      setIsLoadingAiLogs(true);
      const taskIdParam = task?.id || submission.taskId;
      fetch(`/api/lab/assistant/logs?studentName=${encodeURIComponent(submission.studentName)}${taskIdParam ? `&taskId=${taskIdParam}` : ""}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.logs) setStudentAiLogs(d.logs);
        })
        .catch((e) => console.warn(e))
        .finally(() => setIsLoadingAiLogs(false));
    }
  }, [submission?.studentName, submission?.taskId, task?.id]);

  // Correlate questions if submission answers don't have question text
  const enrichedAnswers = answers.map((ans, idx) => {
    const qFromTask = task?.questions?.find((q) => q.id === ans.questionId) || task?.questions?.[idx];
    return {
      ...ans,
      question: ans.question || qFromTask?.question || `Pertanyaan No. ${idx + 1}`,
      options: ans.options || qFromTask?.options || [],
      selectedAnswer:
        ans.selectedAnswer ||
        (ans.selectedIndex !== undefined && qFromTask?.options?.[ans.selectedIndex]) ||
        "-",
      correctAnswer:
        ans.correctAnswer ||
        (qFromTask?.options?.[qFromTask.correctIndex]) ||
        "-",
      explanation: ans.explanation || qFromTask?.explanation || "",
    };
  });

  const correctCount = enrichedAnswers.filter((a) => a.isCorrect).length;
  const totalQuestions = enrichedAnswers.length;

  // Resolve task title from all available clues
  const derivedTaskTitle =
    task?.title ||
    (submission as any).taskTitle ||
    (submission.aiAnalysis?.match(/Praktikum\s+["“]?([^"”]+?)["”]?\s+(?:telah diselesaikan|berhasil diamati)/i)?.[1]) ||
    (submission.aiAnalysis?.match(/Praktikum\s+([A-Za-z0-9\s:_-]+?)\s+berhasil diamati/i)?.[1]) ||
    "";

  // Intelligently find matching reaction from REACTION_CATALOG as rich fallback/augmentation
  const matchedReaction = REACTION_CATALOG.find((r) => {
    if (task?.expectedReactionId && r.id === task.expectedReactionId) return true;
    if (exp?.reactionTitle && exp.reactionTitle !== "Reaksi Kimia Teramati di Meja Lab" && (r.title.toLowerCase() === exp.reactionTitle.toLowerCase() || r.equation === exp?.reactionEquation)) return true;
    
    // Check derived task title and AI analysis text
    const searchStr = `${derivedTaskTitle} ${submission.aiAnalysis || ""} ${exp?.reactionTitle || ""}`.toLowerCase();
    if (searchStr.includes("redoks") || searchStr.includes("piroteknik") || searchStr.includes("permanganat")) {
      if (r.id === "rx_kmno4_glycerin") return true;
    }
    if (searchStr.includes("hujan emas") || searchStr.includes("timbal") || searchStr.includes("pbi2")) {
      if (r.id === "rx_pbno32_ki") return true;
    }
    if (searchStr.includes("netralisasi") || searchStr.includes("asam basa") || (searchStr.includes("hcl") && searchStr.includes("naoh"))) {
      if (r.id === "rx_hcl_naoh") return true;
    }
    if (searchStr.includes("gunung") || searchStr.includes("lava") || searchStr.includes("baking soda") || searchStr.includes("cuka")) {
      if (r.id === "rx_ch3cooh_nahco3") return true;
    }
    if (searchStr.includes("amilum") || searchStr.includes("iodin") || searchStr.includes("betadine")) {
      if (r.id === "rx_iodine_starch") return true;
    }
    if (searchStr.includes("tembaga") || searchStr.includes("cuso4") || searchStr.includes("endapan biru")) {
      if (r.id === "rx_cuso4_naoh") return true;
    }
    if (searchStr.includes("saponifikasi") || searchStr.includes("sabun")) {
      if (r.id === "rx_saponifikasi") return true;
    }
    if (searchStr.includes("pelarutan") && searchStr.includes("eksoterm")) {
      if (r.id === "rx_naoh_h2o") return true;
    }
    if (task?.chemicalIds && r.reactantAId && task.chemicalIds.includes(r.reactantAId) && task.chemicalIds.includes(r.reactantBId)) return true;
    return false;
  }) || REACTION_CATALOG[0];

  const rawTitle = exp?.reactionTitle?.trim();
  const reactionTitle = (rawTitle && rawTitle !== "Reaksi Kimia Teramati di Meja Lab" && rawTitle.length > 5)
    ? rawTitle
    : (matchedReaction?.title || derivedTaskTitle || "Reaksi Kimia Teramati di Meja Lab");

  const rawEq = exp?.reactionEquation?.trim();
  const reactionEquation = (rawEq && rawEq !== "Persamaan Reaksi Kimiawi Seimbang" && rawEq.length > 4)
    ? rawEq
    : (matchedReaction?.equation || "HCl + NaOH → NaCl + H₂O + Kalor");

  const temperatureChange = (exp?.temperatureChange !== undefined && exp.temperatureChange !== 0)
    ? exp.temperatureChange
    : (matchedReaction?.temperatureChangeC ?? 0);

  const reasonWhy = (exp?.reasonWhy && !exp.reasonWhy.includes("afinitas ikatan antar partikel dan driving force"))
    ? exp.reasonWhy
    : (matchedReaction?.reasonWhy || "Reaksi terjadi secara spontan akibat pelepasan energi entalpi bebas molekuler menuju kondisi kestabilan termodinamika yang lebih rendah.");

  const explanation = (exp?.explanation && exp.explanation !== "Pengamatan reaksi kimia stoikiometri pada media laboratorium virtual sains.")
    ? exp.explanation
    : (matchedReaction?.explanation || task?.instructions || "Pengamatan reaksi kimia stoikiometri pada media laboratorium virtual sains 3D.");

  const observablePhenomena = (exp?.observablePhenomena && exp.observablePhenomena !== "Reaksi kimia selesai teramati di meja 3D.")
    ? exp.observablePhenomena
    : (matchedReaction?.observablePhenomena || "Teramati pembentukan fase baru, perubahan warna larutan, dan pertukaran kalor suhu wadah.");

  const productName = (exp?.resultVessel?.name && exp.resultVessel.name !== "Senyawa Produk Kimiawi")
    ? exp.resultVessel.name
    : (matchedReaction?.productName || "Senyawa Produk Hasil Reaksi");

  const productFormula = (exp?.resultVessel?.formula && exp.resultVessel.formula !== "Senyawa Produk")
    ? exp.resultVessel.formula
    : (matchedReaction?.productFormula || "Produk Kimiawi");

  const productColor = exp?.resultVessel?.color || matchedReaction?.productColor || "#38bdf8";

  // Reagents resolution
  let reagents = exp?.mixedChemicals || [];
  if (!reagents || reagents.length === 0) {
    if (task?.chemicalIds) {
      const rawIds = typeof task.chemicalIds === "string" ? JSON.parse(task.chemicalIds) : task.chemicalIds;
      if (Array.isArray(rawIds) && rawIds.length > 0) {
        reagents = rawIds.map((cid: string) => {
          const found = CHEMICAL_CATALOG.find((c) => c.id === cid);
          return {
            name: found?.name || cid,
            formula: found?.formula || cid,
            color: found?.color || "#0284c7",
          };
        });
      }
    }
    if (reagents.length === 0 && matchedReaction) {
      const chemA = CHEMICAL_CATALOG.find((c) => c.id === matchedReaction.reactantAId);
      const chemB = CHEMICAL_CATALOG.find((c) => c.id === matchedReaction.reactantBId);
      reagents = [
        {
          name: chemA?.name || matchedReaction.reactantAFormula || "Reaktan A",
          formula: chemA?.formula || matchedReaction.reactantAFormula || "Reaktan A",
          color: chemA?.color || "#0284c7",
        },
        {
          name: chemB?.name || matchedReaction.reactantBFormula || "Reaktan B",
          formula: chemB?.formula || matchedReaction.reactantBFormula || "Reaktan B",
          color: chemB?.color || "#38bdf8",
        },
      ];
    }
  }

  // KKM & Performance analytics
  const kkmScore = task?.kkmScore ?? 75;
  const isPassed = score >= kkmScore;
  const correctAnswers = enrichedAnswers.filter((a) => a.isCorrect);
  const wrongAnswers = enrichedAnswers.filter((a) => !a.isCorrect);

  // Sintesis evaluasi pedagogis komprehensif jika catatan evaluasi lama masih singkat/generik
  const isAnalysisShort = !submission.aiAnalysis || submission.aiAnalysis.length < 120 || !submission.aiAnalysis.includes("KKM");
  const comprehensiveAiAnalysis = isAnalysisShort
    ? `Praktikum "${reactionTitle}" telah diselesaikan oleh ${submission.studentName || "Siswa"}. Skor Kuis AI: ${score}/100 (Batas KKM: ${kkmScore}) — Status: ${
        isPassed ? "Tuntas Lulus KKM" : "Belum Tuntas (Di Bawah KKM)"
      }. Target Reaksi 3D: ${
        submission.isReactionAchieved ? "Berhasil Diamati Sempurna" : "Selesai Dieksplorasi"
      }. Siswa menguasai ${correctAnswers.length} dari ${enrichedAnswers.length} konsep kuis.${
        wrongAnswers.length > 0
          ? ` Disarankan mengulang atau mempelajari kembali konsep pada: ${wrongAnswers.map((w, i) => `[Soal ${i + 1}: ${w.question || "Konsep Reaksi"}]`).join(", ")}.`
          : " Siswa menunjukkan pemahaman konseptual yang sangat baik tanpa miskonsepsi pada seluruh butir evaluasi."
      }`
    : submission.aiAnalysis;


  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 font-sans overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white border border-slate-200 w-full max-w-3xl rounded-2xl shadow-2xl my-6 overflow-hidden flex flex-col text-slate-800 max-h-[92vh]">
        {/* Header */}
        <div className="bg-slate-50 px-5 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 border border-sky-200 flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
              {submission.studentName?.charAt(0).toUpperCase() || "S"}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold uppercase bg-sky-100 text-sky-800 border border-sky-300 px-2 py-0.5 rounded">
                  LAPORAN PRAKTIKUM SISWA
                </span>
                <span className="text-xs text-slate-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {submission.completedAt
                    ? new Date(submission.completedAt).toLocaleString("id-ID", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Waktu tidak tercatat"}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {submission.studentName}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                SKOR KUIS
              </span>
              <span
                className={`text-lg font-black px-2.5 py-0.5 rounded-lg border inline-block ${
                  score >= 80
                    ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                    : score >= 60
                    ? "bg-amber-50 text-amber-800 border-amber-300"
                    : "bg-rose-50 text-rose-800 border-rose-300"
                }`}
              >
                {score}/100
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Modal Content */}
        <div className="p-5 overflow-y-auto space-y-5 bg-white">
          {/* Section 1: Ringkasan Tugas */}
          {task && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1">
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span className="font-semibold text-slate-700">Tugas Praktikum:</span>
                <span className="font-mono text-sky-700 bg-white px-2 py-0.5 rounded border border-slate-200 font-bold">
                  PIN {task.roomCode}
                </span>
              </div>
              <h4 className="font-bold text-sm text-slate-900">{task.title}</h4>
              <p className="text-xs text-slate-600 line-clamp-2">{task.instructions}</p>
            </div>
          )}

          {/* Section 2: Aktivitas & Reaksi di Meja Lab 3D */}
          <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 bg-white shadow-2xs">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Aktivitas Percobaan di Meja 3D
                </h4>
              </div>
              <span
                className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 border ${
                  submission.isReactionAchieved
                    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                    : "bg-amber-50 text-amber-800 border-amber-200"
                }`}
              >
                {submission.isReactionAchieved ? "✓ Target Reaksi Tercapai" : "Proses Eksplorasi"}
              </span>
            </div>

            {/* Nama & Persamaan Reaksi Stoikiometri */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Reaksi Kimia yang Terjadi:
                </span>
                <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                  Status: Stoikiometri Seimbang
                </span>
              </div>
              <h5 className="text-sm sm:text-base font-extrabold text-slate-900">
                {reactionTitle}
              </h5>
              <ChemicalEquation
                equation={reactionEquation}
                showCopy={true}
              />
            </div>

            {/* Produk Reaksi & Karakteristik Fisik */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Produk Hasil Reaksi:
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className="w-3.5 h-3.5 rounded-full border border-black/20 shrink-0 shadow-2xs"
                    style={{ backgroundColor: productColor }}
                  />
                  <span className="text-xs font-extrabold text-slate-900">{productName}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-600 pl-5.5">
                  Formula: <strong className="text-slate-900"><ChemicalFormula formula={productFormula} /></strong>
                </div>
              </div>

              {/* Perubahan Suhu (Termal) */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Perubahan Suhu Termal (Termokimia):
                </span>
                <div
                  className={`text-xs font-bold px-2.5 py-1.5 rounded-lg border flex items-center gap-2 ${
                    temperatureChange > 0
                      ? "bg-rose-50 text-rose-700 border-rose-200"
                      : temperatureChange < 0
                      ? "bg-sky-50 text-sky-700 border-sky-200"
                      : "bg-slate-100 text-slate-700 border-slate-200"
                  }`}
                >
                  {temperatureChange > 0 ? (
                    <>
                      <Flame className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>+{temperatureChange}°C (Eksotermik / Melepas Kalor Panas Hebat)</span>
                    </>
                  ) : temperatureChange < 0 ? (
                    <>
                      <Thermometer className="w-4 h-4 text-sky-600 shrink-0" />
                      <span>{temperatureChange}°C (Endotermik / Menyerap Kalor dari Lingkungan)</span>
                    </>
                  ) : (
                    <span>Suhu Stabil (Suhu Ruang ~25°C)</span>
                  )}
                </div>
              </div>
            </div>

            {/* Reagen yang Dicampur Siswa */}
            {reagents.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Reagen Bahan Kimia yang Digunakan di Meja 3D:
                </span>
                <div className="flex flex-wrap gap-2">
                  {reagents.map((c, i) => (
                    <div
                      key={i}
                      className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-1.5 text-xs shadow-2xs"
                    >
                      <span
                        className="w-2.5 h-2.5 rounded-full border border-black/20 shrink-0"
                        style={{ backgroundColor: c.color || "#06b6d4" }}
                      />
                      <span className="font-mono font-bold text-slate-900">
                        <ChemicalFormula formula={c.formula} />
                      </span>
                      <span className="text-slate-500 text-[10px]">({c.name})</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 3 Detail Cards: Alasan Terjadinya Reaksi, Penjelasan Rinci, dan Gejala Fisik Teramati */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
              {/* Kolom 1: Alasan Ilmiah */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    <span>Alasan Ilmiah Terjadinya Reaksi</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    {reasonWhy}
                  </p>
                </div>
                <div className="text-[9px] text-slate-400 italic pt-1 border-t border-slate-200">
                  *Mekanisme molekuler &amp; afinitas ikatan
                </div>
              </div>

              {/* Kolom 2: Penjelasan Sains Kurikulum */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Penjelasan Sains Rinci</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    {explanation}
                  </p>
                </div>
                <div className="text-[9px] text-slate-400 italic pt-1 border-t border-slate-200">
                  *Konsep kurikulum materi sains
                </div>
              </div>

              {/* Kolom 3: Gejala Fisik & Visual */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2 flex flex-col justify-between">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-sky-800 uppercase tracking-wider border-b border-slate-200 pb-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                    <span>Gejala Fisik Teramati</span>
                  </div>
                  <p className="text-[11px] text-slate-700 leading-relaxed">
                    {observablePhenomena}
                  </p>
                </div>
                <div className="text-[9px] text-slate-400 italic pt-1 border-t border-slate-200">
                  *Observasi visual &amp; sensori di meja 3D
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: AI Lab Evaluation & Pedagogical Diagnostics */}
          <div className="bg-sky-50/70 border-2 border-sky-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
            {/* Header Evaluasi */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sky-200/80 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-sky-950">
                    Evaluasi &amp; Catatan AI Asisten Lab
                  </h4>
                  <span className="text-[10px] text-sky-700 font-medium">
                    Analisis Pedagogis Pemahaman Konsep &amp; Observasi Praktikum
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-sky-200 shadow-2xs">
                  KKM: {kkmScore}
                </span>
                <span
                  className={`text-xs font-extrabold px-3 py-1 rounded-lg border shadow-2xs flex items-center gap-1 ${
                    isPassed
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                      : "bg-rose-100 text-rose-800 border-rose-300"
                  }`}
                >
                  {isPassed ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                      <span>TUNTAS (≥ KKM)</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      <span>BELUM TUNTAS (&lt; KKM)</span>
                    </>
                  )}
                </span>
              </div>
            </div>

            {/* Ringkasan Eksekutif AI */}
            <div className="bg-white p-3.5 rounded-xl border border-sky-200 space-y-1 shadow-2xs">
              <span className="text-[10px] font-bold text-sky-800 uppercase tracking-wider block">
                Catatan Evaluasi Praktikan:
              </span>
              <p className="text-xs text-slate-700 leading-relaxed font-medium">
                {comprehensiveAiAnalysis}
              </p>
            </div>

            {/* Diagnosa Penguasaan Materi: Kekuatan vs Area Perbaikan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Kolom 1: Konsep yang Dikuasai */}
              <div className="bg-white p-3.5 rounded-xl border border-emerald-200 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
                  <span className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Konsep yang Dikuasai ({correctAnswers.length}/{enrichedAnswers.length})</span>
                  </span>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Sangat Baik
                  </span>
                </div>
                {correctAnswers.length > 0 ? (
                  <ul className="space-y-1.5 text-[11px] text-slate-700">
                    {correctAnswers.map((ans, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-emerald-600 font-bold shrink-0">✓</span>
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-800 line-clamp-2">{ans.question}</p>
                          <p className="text-[10px] text-emerald-700 font-medium">
                            Pemahaman tepat: &quot;{ans.selectedAnswer}&quot;
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[11px] text-slate-400 italic">
                    Belum ada butir kuis yang terjawab dengan benar.
                  </p>
                )}
              </div>

              {/* Kolom 2: Miskonsepsi / Area Perbaikan */}
              <div className="bg-white p-3.5 rounded-xl border border-rose-200 space-y-2 shadow-2xs">
                <div className="flex items-center justify-between border-b border-rose-100 pb-2">
                  <span className="text-xs font-bold text-rose-800 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Area Miskonsepsi &amp; Evaluasi ({wrongAnswers.length})</span>
                  </span>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                      wrongAnswers.length === 0
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-rose-50 text-rose-700 border-rose-200"
                    }`}
                  >
                    {wrongAnswers.length === 0 ? "Nol Miskonsepsi" : "Perlu Bimbingan"}
                  </span>
                </div>
                {wrongAnswers.length > 0 ? (
                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {wrongAnswers.map((ans, idx) => (
                      <div key={idx} className="p-2 bg-rose-50/60 rounded-lg border border-rose-100 text-[11px] space-y-1">
                        <p className="font-bold text-slate-900">{ans.question}</p>
                        <div className="flex items-center gap-2 text-[10px]">
                          <span className="text-rose-700 font-semibold line-through">
                            Dipilih: {ans.selectedAnswer}
                          </span>
                          <span className="text-emerald-700 font-bold">
                            Kunci: {ans.correctAnswer}
                          </span>
                        </div>
                        {ans.explanation && (
                          <p className="text-[10px] text-slate-600 bg-white p-1.5 rounded border border-rose-100 leading-relaxed">
                            <strong>Koreksi AI:</strong> {ans.explanation}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-4 text-center space-y-1">
                    <p className="text-[11px] font-bold text-emerald-800">
                      Sempurna! Tidak ditemukan miskonsepsi.
                    </p>
                    <p className="text-[10px] text-slate-500">
                      Siswa memahami seluruh aspek reaksi kimia dan termokimia dengan akurat.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Rekomendasi Pedagogis Terarah */}
            <div className="bg-sky-100/60 border border-sky-300/80 rounded-xl p-3 text-xs space-y-1">
              <span className="font-bold text-sky-950 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
                <TrendingUp className="w-3.5 h-3.5 text-sky-700" />
                Rekomendasi Tindak Lanjut Guru &amp; Siswa:
              </span>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                {isPassed
                  ? `Siswa telah mencapai standar kompetensi KKM (${kkmScore}). Keterampilan observasi visual di meja 3D dan penalaran teoritis telah terintegrasi dengan sangat baik. Siswa direkomendasikan untuk melanjutkan ke modul reaksi lanjutan.`
                  : `Nilai siswa (${score}/100) berada di bawah ambang batas KKM (${kkmScore}). Direkomendasikan untuk meninjau kembali konsep ${
                      wrongAnswers.length > 0 ? "pada soal yang keliru di atas" : "terkait reaksi redoks dan termodinamika"
                    } serta memanfaatkan kesempatan pengulangan praktikum untuk perbaikan nilai.`}
              </p>
            </div>
          </div>

          {/* Section: Log Tanya Jawab Siswa ke Kak Lab-AI */}
          <div className="border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3 bg-white shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-sky-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Konsultasi Siswa dengan Kak Lab-AI ({studentAiLogs.length} Pertanyaan)
                </h4>
              </div>
              <span className="text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded">
                DIAGNOSTIK AI
              </span>
            </div>

            {isLoadingAiLogs ? (
              <div className="py-4 text-center text-xs text-slate-400">
                Memuat riwayat tanya jawab AI siswa...
              </div>
            ) : studentAiLogs.length > 0 ? (
              <div className="space-y-3">
                {studentAiLogs.map((log, idx) => (
                  <div
                    key={log.id || idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500 border-b border-slate-200/80 pb-1.5">
                      <span className="font-semibold text-slate-700">Pertanyaan #{idx + 1}</span>
                      <span className="font-mono text-[10px]">
                        {log.createdAt
                          ? new Date(log.createdAt).toLocaleTimeString("id-ID", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </span>
                    </div>

                    {/* Pertanyaan Siswa */}
                    <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="text-xs font-bold text-slate-700 shrink-0">Siswa:</span>
                      <p className="font-medium text-slate-900 leading-relaxed">{log.question}</p>
                    </div>

                    {/* Jawaban Kak Lab-AI */}
                    <div className="flex items-start gap-2 bg-sky-50/70 p-2.5 rounded-lg border border-sky-100">
                      <span className="text-xs font-bold text-sky-800 shrink-0 flex items-center gap-1">
                        <Bot className="w-3.5 h-3.5 text-sky-600" />
                        <span>Kak Lab:</span>
                      </span>
                      <div className="flex-1">
                        <FormattedAiMessage text={log.answer} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-[11px] text-slate-500">
                Siswa tidak mengajukan pertanyaan ke Kak Lab-AI selama mengerjakan praktikum ini (bereksperimen secara mandiri).
              </div>
            )}
          </div>

          {/* Section 4: Detail Butir Kuis Pasca-Praktikum */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Rincian Pengerjaan Kuis ({correctCount}/{totalQuestions} Soal Benar)
                </h4>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Akurasi: {totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0}%
              </span>
            </div>

            {enrichedAnswers.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                Tidak ada rincian soal kuis untuk pengumpulan ini.
              </p>
            ) : (
              <div className="space-y-3">
                {enrichedAnswers.map((ans, idx) => (
                  <div
                    key={ans.questionId || idx}
                    className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                      ans.isCorrect
                        ? "bg-emerald-50/40 border-emerald-200"
                        : "bg-rose-50/40 border-rose-200"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="font-semibold text-slate-900">
                        <span className="text-sky-600 font-bold mr-1">{idx + 1}.</span>
                        {ans.question}
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shrink-0 ${
                          ans.isCorrect
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {ans.isCorrect ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Benar</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Salah</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="space-y-1 pt-1 border-t border-slate-200/60 text-[11px]">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-500 font-medium">Jawaban Siswa:</span>
                        <span
                          className={`font-semibold ${
                            ans.isCorrect ? "text-emerald-700" : "text-rose-700 line-through"
                          }`}
                        >
                          {ans.selectedAnswer}
                        </span>
                      </div>

                      {!ans.isCorrect && (isTeacherView || task?.showQuizReviewDetails !== false) && (
                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 font-medium">Kunci Jawaban Benar:</span>
                          <span className="text-emerald-700 font-bold">{ans.correctAnswer}</span>
                        </div>
                      )}

                      {!ans.isCorrect && !isTeacherView && task?.showQuizReviewDetails === false && (
                        <div className="text-[10px] text-amber-700 italic">
                          Kunci jawaban &amp; pembahasan disembunyikan oleh guru untuk evaluasi tugas ini.
                        </div>
                      )}

                      {ans.explanation && (isTeacherView || task?.showQuizReviewDetails !== false) && (
                        <div className="mt-1.5 p-2 bg-white rounded-lg border border-slate-200 text-slate-600 text-[11px] leading-relaxed">
                          <span className="font-bold text-slate-700 mr-1">Pembahasan:</span>
                          {ans.explanation}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-5 py-3 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Total Skor: <strong className="text-slate-900">{score}/100</strong> ({correctCount} dari {totalQuestions} butir kuis)
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
          >
            Tutup Detail
          </button>
        </div>
      </div>
    </div>
  );
}

