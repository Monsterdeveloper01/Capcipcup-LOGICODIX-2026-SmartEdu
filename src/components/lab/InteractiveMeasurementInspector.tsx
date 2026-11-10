"use client";

import { ChemicalMeasurement } from "@/lib/lab/chemicalProperties";
import { ChemicalFormula } from "./ChemicalFormula";
import {
  X,
  Thermometer,
  Flame,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowRight,
  Info,
  Beaker,
} from "lucide-react";

interface InteractiveMeasurementInspectorProps {
  measurement: ChemicalMeasurement | null;
  onClose: () => void;
  activeTool: "hand" | "thermometer" | "litmus_red" | "litmus_blue" | "ph_meter";
  onSelectTool: (tool: "hand" | "thermometer" | "litmus_red" | "litmus_blue" | "ph_meter") => void;
  allVessels?: { id: string; name: string; formula: string }[];
  onSelectVessel?: (vesselId: string) => void;
}

export default function InteractiveMeasurementInspector({
  measurement,
  onClose,
  activeTool,
  onSelectTool,
  allVessels = [],
  onSelectVessel,
}: InteractiveMeasurementInspectorProps) {
  if (!measurement) return null;

  const temp = measurement.temperatureC;
  // Kalkulasi persentase tinggi kolom raksa (0°C = 0%, 100°C = 100%)
  const mercuryPercent = Math.min(100, Math.max(8, (temp / 100) * 100));

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden font-sans text-slate-800 animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Header Panel */}
      <div className="bg-slate-50 p-3.5 sm:px-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-sky-600 text-white flex items-center justify-center shadow-xs shrink-0">
            {activeTool === "thermometer" ? (
              <Thermometer className="w-5 h-5" />
            ) : (
              <Layers className="w-5 h-5" />
            )}
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              HASIL PENGUKURAN INSTRUMEN LABORATORIUM
            </span>
            <h4 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
              <span>{measurement.vesselName}</span>
              <span className="text-slate-400 font-normal">|</span>
              <span className="text-sky-700 font-mono text-xs">
                Formula: <ChemicalFormula formula={measurement.formula} />
              </span>
            </h4>
          </div>
        </div>

        {/* Switcher Tab Alat Ukur Langsung di Header */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1 text-xs">
          {[
            { id: "thermometer", label: "🌡️ Termometer Celup" },
            { id: "litmus_red", label: "🔴 Lakmus Merah" },
            { id: "litmus_blue", label: "🔵 Lakmus Biru" },
            { id: "ph_meter", label: "🧪 Indikator pH" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelectTool(t.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                activeTool === t.id
                  ? "bg-sky-600 text-white shadow-xs"
                  : "bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
              }`}
            >
              {t.label}
            </button>
          ))}

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer ml-1 border border-transparent hover:border-slate-200"
            title="Tutup Panel Alat Ukur"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body Content - Responsive Grid Layout */}
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* Kolom Kiri: Visualisasi Pengukuran Alat */}
          <div className="lg:col-span-7 flex flex-col justify-between">
        {/* =========================================================================
            TOOL 1: TERMOMETER CELUP LABORATORIUM
            ========================================================================= */}
        {(activeTool === "thermometer" || activeTool === "hand") && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Thermometer className="w-4 h-4 text-rose-500" />
                <span>Pengukuran Suhu Termometer Celup</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  temp > 40
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : temp < 22
                    ? "bg-sky-50 text-sky-700 border-sky-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                {measurement.thermalCategory}
              </span>
            </div>

            {/* Visual Gauge Kolom Raksa Termometer */}
            <div className="flex items-center gap-3">
              <div className="relative w-7 h-28 bg-slate-200 rounded-full border border-slate-300 p-0.7 flex flex-col justify-end items-center overflow-hidden shadow-inner shrink-0">
                {/* Etched measurement graduation lines */}
                <div className="absolute inset-y-1 right-0.5 w-1 flex flex-col justify-between py-1 opacity-40">
                  <span className="w-2 border-t border-black text-[6px]" />
                  <span className="w-1.5 border-t border-black text-[6px]" />
                  <span className="w-2 border-t border-black text-[6px]" />
                  <span className="w-1.5 border-t border-black text-[6px]" />
                  <span className="w-2 border-t border-black text-[6px]" />
                </div>
                {/* Mercury Liquid Column */}
                <div
                  className="w-2.5 bg-gradient-to-t from-rose-600 via-rose-500 to-red-400 rounded-t-full transition-all duration-700 ease-out shadow-xs"
                  style={{ height: `${mercuryPercent}%` }}
                />
                {/* Bottom Bulb */}
                <div className="w-5 h-5 rounded-full bg-rose-600 border border-rose-700 shrink-0 shadow-xs mt-0.5" />
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-black text-slate-900 tracking-tight">
                    {temp.toFixed(1)}°C
                  </span>
                  <span className="text-xs text-slate-500 font-semibold">
                    ({(temp + 273.15).toFixed(1)} K)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {temp > 35 ? (
                    <span className="text-rose-700 font-semibold flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5 text-rose-600" />
                      Reaksi eksotermik melepaskan energi panas ke larutan.
                    </span>
                  ) : temp < 22 ? (
                    <span className="text-sky-700 font-semibold">
                      ❄️ Reaksi endotermik menyerap energi kalor dari lingkungan.
                    </span>
                  ) : (
                    "Suhu cairan seimbang dengan temperatur ruang laboratorium (~25°C)."
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TOOL 2 & 3: KERTAS LAKMUS MERAH & BIRU
            ========================================================================= */}
        {(activeTool === "litmus_red" || activeTool === "litmus_blue") && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-600" />
                <span>Hasil Uji Kertas Lakmus Asam-Basa</span>
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                  measurement.category.includes("Asam")
                    ? "bg-rose-50 text-rose-700 border-rose-200"
                    : measurement.category.includes("Basa")
                    ? "bg-sky-50 text-sky-700 border-sky-200"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200"
                }`}
              >
                Sifat: {measurement.category}
              </span>
            </div>

            {/* Strip Perbandingan Dua Kertas Lakmus */}
            <div className="grid grid-cols-2 gap-2.5">
              {/* Lakmus Merah */}
              <div
                className={`p-2.5 rounded-xl border transition-all ${
                  activeTool === "litmus_red"
                    ? "bg-white border-sky-400 ring-2 ring-sky-100 shadow-sm"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500">
                    Lakmus Merah
                  </span>
                  {measurement.litmusRed.isChanged && (
                    <span className="text-[9px] bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded font-bold">
                      BERUBAH
                    </span>
                  )}
                </div>

                {/* Strip Visual */}
                <div className="h-10 rounded-lg overflow-hidden border border-black/10 flex flex-col shadow-inner mb-1.5">
                  <div
                    className="flex-1"
                    style={{ backgroundColor: measurement.litmusRed.initialColor }}
                    title="Bagian kering atas (Merah)"
                  />
                  <div
                    className="flex-1 transition-colors duration-500"
                    style={{ backgroundColor: measurement.litmusRed.finalColor }}
                    title="Bagian tercelup larutan"
                  />
                </div>

                <div className="text-[10px] font-bold text-slate-800 leading-tight">
                  {measurement.litmusRed.resultText}
                </div>
              </div>

              {/* Lakmus Biru */}
              <div
                className={`p-2.5 rounded-xl border transition-all ${
                  activeTool === "litmus_blue"
                    ? "bg-white border-sky-400 ring-2 ring-sky-100 shadow-sm"
                    : "bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-extrabold uppercase text-slate-500">
                    Lakmus Biru
                  </span>
                  {measurement.litmusBlue.isChanged && (
                    <span className="text-[9px] bg-rose-100 text-rose-800 px-1.5 py-0.2 rounded font-bold">
                      BERUBAH
                    </span>
                  )}
                </div>

                {/* Strip Visual */}
                <div className="h-10 rounded-lg overflow-hidden border border-black/10 flex flex-col shadow-inner mb-1.5">
                  <div
                    className="flex-1"
                    style={{ backgroundColor: measurement.litmusBlue.initialColor }}
                    title="Bagian kering atas (Biru)"
                  />
                  <div
                    className="flex-1 transition-colors duration-500"
                    style={{ backgroundColor: measurement.litmusBlue.finalColor }}
                    title="Bagian tercelup larutan"
                  />
                </div>

                <div className="text-[10px] font-bold text-slate-800 leading-tight">
                  {measurement.litmusBlue.resultText}
                </div>
              </div>
            </div>

            {/* Kesimpulan Lakmus */}
            <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
              <span className="font-bold text-slate-900 block text-[11px]">
                💡 Kesimpulan Uji Lakmus:
              </span>
              <p className="text-[11px] leading-relaxed">
                {measurement.category.includes("Asam") ? (
                  <span>
                    Larutan mengubah kertas lakmus biru menjadi <strong>merah</strong>, menandakan larutan ini bersifat <strong>ASAM</strong>.
                  </span>
                ) : measurement.category.includes("Basa") ? (
                  <span>
                    Larutan mengubah kertas lakmus merah menjadi <strong>biru</strong>, menandakan larutan ini bersifat <strong>BASA</strong>.
                  </span>
                ) : (
                  <span>
                    Kedua kertas lakmus tidak mengalami perubahan warna, menandakan larutan bersifat <strong>NETRAL</strong> (pH ~7).
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        {/* =========================================================================
            TOOL 4: INDIKATOR pH UNIVERSAL (SKALA 0 - 14)
            ========================================================================= */}
        {activeTool === "ph_meter" && (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Indikator pH Universal (Skala 0 - 14)</span>
              </span>
              <span className="text-xs font-black text-sky-800 bg-sky-100 border border-sky-300 px-2 py-0.5 rounded">
                pH {measurement.pH.toFixed(1)}
              </span>
            </div>

            {/* Spektrum Warna pH Bar */}
            <div className="space-y-1.5">
              <div className="relative h-6 rounded-lg overflow-hidden flex border border-black/20 shadow-xs">
                {[
                  { ph: 0, c: "#dc2626" },
                  { ph: 2, c: "#ef4444" },
                  { ph: 4, c: "#f97316" },
                  { ph: 6, c: "#eab308" },
                  { ph: 7, c: "#22c55e" },
                  { ph: 9, c: "#06b6d4" },
                  { ph: 11, c: "#2563eb" },
                  { ph: 13, c: "#7c3aed" },
                  { ph: 14, c: "#581c87" },
                ].map((s) => (
                  <div key={s.ph} className="flex-1" style={{ backgroundColor: s.c }} />
                ))}

                {/* Marker Penunjuk pH */}
                <div
                  className="absolute top-0 bottom-0 w-2.5 bg-white border-2 border-slate-900 rounded-sm shadow-md -translate-x-1/2 transition-all duration-500"
                  style={{ left: `${(measurement.pH / 14) * 100}%` }}
                />
              </div>

              <div className="flex justify-between text-[9px] font-bold text-slate-400 px-0.5">
                <span>0 (Sangat Asam)</span>
                <span>7 (Netral)</span>
                <span>14 (Sangat Basa)</span>
              </div>
            </div>

            {/* Strip Indikator Celup Universal */}
            <div className="flex items-center gap-3 p-2.5 bg-white rounded-lg border border-slate-200">
              <div
                className="w-6 h-12 rounded border border-black/20 shrink-0 shadow-xs flex flex-col justify-end p-0.5"
                style={{ backgroundColor: "#fef08a" }}
              >
                <div
                  className="w-full h-6 rounded-xs transition-colors duration-500 shadow-2xs"
                  style={{ backgroundColor: measurement.universalColor }}
                />
              </div>
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-slate-900 block">
                  Warna Indikator pH: {measurement.category}
                </span>
                <p className="text-[11px] text-slate-600">
                  Konsentrasi ion hidronium [H+] terukur pada nilai pH <strong>{measurement.pH.toFixed(1)}</strong>.
                </p>
              </div>
            </div>
          </div>
        )}
          </div>

          {/* Kolom Kanan: Penjelasan Ilmiah & Navigasi Bejana Meja */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
            {/* Penjelasan Ilmiah Kurikulum */}
            <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-xl space-y-1.5 flex-1">
              <div className="flex items-center gap-1.5 text-sky-900 font-bold text-xs">
                <Info className="w-4 h-4 text-sky-600 shrink-0" />
                <span>Penjelasan Ilmiah Kurikulum:</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {measurement.explanation}
              </p>
            </div>

            {/* Pilihan Cepat: Celupkan ke Bejana Lain di Meja */}
            {allVessels.length > 1 && onSelectVessel && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Celupkan ke Bejana Lain di Meja:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {allVessels
                    .filter((v) => v.id !== measurement.vesselId)
                    .map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => onSelectVessel(v.id)}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-sky-50 hover:text-sky-800 hover:border-sky-200 border border-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Beaker className="w-3.5 h-3.5 text-sky-600" />
                        <span>{v.name}</span>
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

