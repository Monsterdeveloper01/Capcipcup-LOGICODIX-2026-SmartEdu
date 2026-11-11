"use client";

import { ChemicalMeasurement } from "@/lib/lab/chemicalProperties";
import { ChemicalFormula } from "./ChemicalFormula";
import {
  X,
  Thermometer,
  Flame,
  Snowflake,
  Sparkles,
  Layers,
  Info,
  Beaker,
  Droplet,
  TestTube2,
  Lightbulb,
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
  const mercuryPercent = Math.min(100, Math.max(8, (temp / 100) * 100));

  return (
    <div className="w-full pop-card rounded-3xl overflow-hidden font-sans text-slate-900 bg-white animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Header Panel */}
      <div className="bg-[#BAE6FD] p-4 sm:px-6 border-b-2 border-slate-900 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#FACC15] border-2 border-slate-900 text-slate-900 flex items-center justify-center shrink-0">
            {activeTool === "thermometer" ? (
              <Thermometer className="w-5 h-5" />
            ) : activeTool === "ph_meter" ? (
              <TestTube2 className="w-5 h-5" />
            ) : (
              <Layers className="w-5 h-5" />
            )}
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block">
              HASIL PENGUKURAN INSTRUMEN LAB
            </span>
            <h4 className="font-display font-bold text-sm sm:text-base text-slate-900 flex flex-wrap items-center gap-1.5">
              <span>{measurement.vesselName}</span>
              <span className="text-slate-600 font-normal">|</span>
              <span className="text-slate-900 font-mono text-xs bg-white px-2 py-0.5 rounded-md border border-slate-900">
                <ChemicalFormula formula={measurement.formula} />
              </span>
            </h4>
          </div>
        </div>

        {/* Tool Switcher Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 py-1 text-xs">
          {[
            { id: "thermometer", label: "Termometer Celup", icon: Thermometer },
            { id: "litmus_red", label: "Lakmus Merah", icon: Droplet },
            { id: "litmus_blue", label: "Lakmus Biru", icon: Droplet },
            { id: "ph_meter", label: "Indikator pH", icon: TestTube2 },
          ].map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => onSelectTool(t.id as any)}
                className={`px-3 py-1.5 rounded-xl font-extrabold border-2 border-slate-900 whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTool === t.id
                    ? "bg-[#FACC15] text-slate-900 shadow-[2px_2px_0px_#0f172a]"
                    : "bg-white text-slate-700 hover:bg-slate-100"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${
                    t.id === "litmus_red"
                      ? "text-rose-600"
                      : t.id === "litmus_blue"
                      ? "text-blue-600"
                      : ""
                  }`}
                />
                <span>{t.label}</span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center text-slate-900 hover:bg-rose-100 cursor-pointer ml-1"
            title="Tutup Panel Alat Ukur"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Body Content */}
      <div className="p-5 sm:p-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Column: Visual Gauge */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            {(activeTool === "thermometer" || activeTool === "hand") && (
              <div className="bg-[#FFFDF7] border-2 border-slate-900 rounded-2xl p-4 space-y-3 h-full flex flex-col justify-center">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                    <Thermometer className="w-4 h-4 text-rose-600" />
                    <span>Pengukuran Suhu Termometer Celup</span>
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border border-slate-900 ${
                      temp > 40
                        ? "bg-[#FDA4AF] text-slate-900"
                        : temp < 22
                        ? "bg-[#BAE6FD] text-slate-900"
                        : "bg-[#A7F3D0] text-slate-900"
                    }`}
                  >
                    {measurement.thermalCategory}
                  </span>
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <div className="relative w-8 h-32 bg-slate-200 rounded-full border-2 border-slate-900 p-0.7 flex flex-col justify-end items-center overflow-hidden shrink-0">
                    <div
                      className="w-3 bg-gradient-to-t from-rose-600 via-rose-500 to-red-400 rounded-t-full transition-all duration-700 ease-out"
                      style={{ height: `${mercuryPercent}%` }}
                    />
                    <div className="w-5 h-5 rounded-full bg-rose-600 border-2 border-slate-900 shrink-0 mt-0.5" />
                  </div>

                  <div className="flex-1 space-y-1.5">
                    <div className="flex items-baseline gap-2">
                      <span className="text-3xl font-mono font-black text-slate-900 tracking-tight">
                        {temp.toFixed(1)}°C
                      </span>
                      <span className="text-xs text-slate-600 font-bold font-mono">
                        ({(temp + 273.15).toFixed(1)} K)
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">
                      {temp > 35 ? (
                        <span className="text-rose-700 font-bold flex items-center gap-1.5">
                          <Flame className="w-4 h-4 text-rose-600 shrink-0" />
                          <span>Reaksi eksotermik melepaskan energi panas ke larutan.</span>
                        </span>
                      ) : temp < 22 ? (
                        <span className="text-sky-700 font-bold flex items-center gap-1.5">
                          <Snowflake className="w-4 h-4 text-sky-600 shrink-0" />
                          <span>Reaksi endotermik menyerap energi kalor dari lingkungan.</span>
                        </span>
                      ) : (
                        "Suhu cairan seimbang dengan temperatur ruang laboratorium (~25°C)."
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {(activeTool === "litmus_red" || activeTool === "litmus_blue") && (
              <div className="bg-[#FFFDF7] border-2 border-slate-900 rounded-2xl p-4 space-y-3 h-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#2563EB]" />
                    <span>Hasil Uji Kertas Lakmus Asam-Basa</span>
                  </span>
                  <span
                    className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border border-slate-900 ${
                      measurement.category.includes("Asam")
                        ? "bg-[#FDA4AF] text-slate-900"
                        : measurement.category.includes("Basa")
                        ? "bg-[#BAE6FD] text-slate-900"
                        : "bg-[#A7F3D0] text-slate-900"
                    }`}
                  >
                    Sifat: {measurement.category}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {/* Lakmus Merah */}
                  <div
                    className={`p-3 rounded-xl border-2 border-slate-900 transition-all ${
                      activeTool === "litmus_red"
                        ? "bg-[#FEF9C3] shadow-[3px_3px_0px_#0f172a]"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase text-slate-800">
                        Lakmus Merah
                      </span>
                      {measurement.litmusRed.isChanged && (
                        <span className="text-[9px] bg-[#38BDF8] text-slate-900 border border-slate-900 px-1.5 py-0.2 rounded font-black">
                          BERUBAH
                        </span>
                      )}
                    </div>

                    <div className="h-11 rounded-xl overflow-hidden border-2 border-slate-900 flex flex-col mb-2">
                      <div
                        className="flex-1"
                        style={{ backgroundColor: measurement.litmusRed.initialColor }}
                      />
                      <div
                        className="flex-1 transition-colors duration-500"
                        style={{ backgroundColor: measurement.litmusRed.finalColor }}
                      />
                    </div>

                    <div className="text-[11px] font-bold text-slate-900 leading-tight">
                      {measurement.litmusRed.resultText}
                    </div>
                  </div>

                  {/* Lakmus Biru */}
                  <div
                    className={`p-3 rounded-xl border-2 border-slate-900 transition-all ${
                      activeTool === "litmus_blue"
                        ? "bg-[#FEF9C3] shadow-[3px_3px_0px_#0f172a]"
                        : "bg-white"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-black uppercase text-slate-800">
                        Lakmus Biru
                      </span>
                      {measurement.litmusBlue.isChanged && (
                        <span className="text-[9px] bg-[#FB7185] text-white border border-slate-900 px-1.5 py-0.2 rounded font-black">
                          BERUBAH
                        </span>
                      )}
                    </div>

                    <div className="h-11 rounded-xl overflow-hidden border-2 border-slate-900 flex flex-col mb-2">
                      <div
                        className="flex-1"
                        style={{ backgroundColor: measurement.litmusBlue.initialColor }}
                      />
                      <div
                        className="flex-1 transition-colors duration-500"
                        style={{ backgroundColor: measurement.litmusBlue.finalColor }}
                      />
                    </div>

                    <div className="text-[11px] font-bold text-slate-900 leading-tight">
                      {measurement.litmusBlue.resultText}
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-white rounded-xl border-2 border-slate-900 text-xs text-slate-800 space-y-1">
                  <span className="font-black text-slate-900 flex items-center gap-1.5 text-[11px] uppercase">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                    <span>Kesimpulan Uji Lakmus:</span>
                  </span>
                  <p className="text-xs leading-relaxed">
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

            {activeTool === "ph_meter" && (
              <div className="bg-[#FFFDF7] border-2 border-slate-900 rounded-2xl p-4 space-y-3 h-full">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-emerald-700" />
                    <span>Indikator pH Universal (Skala 0 - 14)</span>
                  </span>
                  <span className="text-xs font-mono font-black text-slate-900 bg-[#FACC15] border-2 border-slate-900 px-2.5 py-0.5 rounded-lg">
                    pH {measurement.pH.toFixed(1)}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <div className="relative h-7 rounded-xl overflow-hidden flex border-2 border-slate-900">
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

                    <div
                      className="absolute top-0 bottom-0 w-3 bg-white border-2 border-slate-900 -translate-x-1/2 transition-all duration-500"
                      style={{ left: `${(measurement.pH / 14) * 100}%` }}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] font-extrabold text-slate-600 px-0.5">
                    <span>0 (Sangat Asam)</span>
                    <span>7 (Netral)</span>
                    <span>14 (Sangat Basa)</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-white rounded-xl border-2 border-slate-900">
                  <div
                    className="w-7 h-12 rounded-lg border-2 border-slate-900 shrink-0 flex flex-col justify-end p-0.5"
                    style={{ backgroundColor: "#fef08a" }}
                  >
                    <div
                      className="w-full h-6 rounded-sm transition-colors duration-500"
                      style={{ backgroundColor: measurement.universalColor }}
                    />
                  </div>
                  <div className="space-y-0.5 text-xs">
                    <span className="font-extrabold text-slate-900 block">
                      Warna Indikator pH: {measurement.category}
                    </span>
                    <p className="text-xs text-slate-700">
                      Konsentrasi ion hidronium terukur pada nilai pH{" "}
                      <strong className="font-mono">{measurement.pH.toFixed(1)}</strong>.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Scientific Explanation & Quick Switch Beaker */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-3">
            <div className="p-4 bg-[#D1FAE5] border-2 border-slate-900 rounded-2xl space-y-2 flex-1">
              <div className="flex items-center gap-1.5 text-slate-900 font-black uppercase text-xs">
                <Info className="w-4 h-4 text-emerald-800 shrink-0" />
                <span>Penjelasan Ilmiah Kurikulum</span>
              </div>
              <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
                {measurement.explanation}
              </p>
            </div>

            {allVessels.length > 1 && onSelectVessel && (
              <div className="space-y-2 pt-2 border-t-2 border-slate-900/15">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 block">
                  Pindahkan Alat ke Bejana Lain:
                </span>
                <div className="flex flex-wrap gap-2">
                  {allVessels
                    .filter((v) => v.id !== measurement.vesselId)
                    .map((v) => (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => onSelectVessel(v.id)}
                        className="pop-btn px-3 py-1.5 bg-white hover:bg-[#FEF08A] text-slate-900 text-xs rounded-xl gap-1.5"
                      >
                        <Beaker className="w-3.5 h-3.5 text-[#2563EB]" />
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
