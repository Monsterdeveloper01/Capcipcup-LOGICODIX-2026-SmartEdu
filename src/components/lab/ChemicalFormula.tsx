"use client";

import React, { useState } from "react";
import { Check, Copy, FlaskConical, ArrowRight } from "lucide-react";

/**
 * Interface untuk bagian-bagian penyusun satu rumus kimia
 */
export interface ParsedFormula {
  raw: string;
  coefficient: string;
  tokens: { type: "element" | "subscript" | "paren" | "dot" | "text"; value: string }[];
  charge: string;
  specialSymbol: string; // 'v', '^', '↓', '↑'
  state: string; // '(aq)', '(s)', '(l)', '(g)'
}

/**
 * Mem-parsing string rumus kimia (misal: "2KMnO4 (aq)", "Pb(NO3)2", "SO4^2-", "Fe3+")
 */
export function parseFormula(rawFormula: string): ParsedFormula {
  let str = (rawFormula || "").trim();

  // 1. Ekstrak koefisien stoikiometri di depan (misal "2KMnO4" atau "16HCl")
  let coefficient = "";
  const coeffMatch = str.match(/^(\d+(?:\/\d+)?)\s*([A-Z].*)$/);
  if (coeffMatch) {
    coefficient = coeffMatch[1];
    str = coeffMatch[2].trim();
  }

  // 2. Ekstrak fasa/wujud zat di akhir: (s), (aq), (l), (g), (s, kuning), dll.
  let state = "";
  const stateMatch = str.match(/\s*(\((?:s|l|g|aq|solid|liquid|gas)(?:,\s*[^)]+)?\))\s*$/i);
  if (stateMatch && stateMatch.index !== undefined) {
    state = stateMatch[1];
    str = str.slice(0, stateMatch.index).trim();
  }

  // 3. Ekstrak simbol endapan atau gas (v, ^, ↓, ↑)
  let specialSymbol = "";
  const symMatch = str.match(/\s*([v^↓↑])\s*$/);
  if (symMatch && symMatch.index !== undefined) {
    specialSymbol = symMatch[1];
    str = str.slice(0, symMatch.index).trim();
  }

  // 4. Ekstrak muatan ion (charge) di akhir: e.g. ^2-, 2-, 2+, +, -, ^3+
  let charge = "";
  const chargeMatch = str.match(/(\^?(?:\d*[+-]|[+-]\d*))$/);
  if (chargeMatch && chargeMatch[1] && (chargeMatch[1].includes("+") || chargeMatch[1].includes("-"))) {
    charge = chargeMatch[1].replace("^", "");
    if (chargeMatch.index !== undefined) {
      str = str.slice(0, chargeMatch.index);
    }
  }

  // 5. Tokenisasi elemen, tanda kurung, dot hidrat, dan angka subskrip
  const tokens: { type: "element" | "subscript" | "paren" | "dot" | "text"; value: string }[] = [];
  const regex = /([A-Z][a-z]?)|(\d+)|([()])|(\.)|([^\s])/g;
  let m: RegExpExecArray | null;

  while ((m = regex.exec(str)) !== null) {
    if (m[1]) {
      tokens.push({ type: "element", value: m[1] });
    } else if (m[2]) {
      tokens.push({ type: "subscript", value: m[2] });
    } else if (m[3]) {
      tokens.push({ type: "paren", value: m[3] });
    } else if (m[4]) {
      tokens.push({ type: "dot", value: "•" });
    } else if (m[5]) {
      tokens.push({ type: "text", value: m[5] });
    }
  }

  return {
    raw: rawFormula,
    coefficient,
    tokens,
    charge,
    specialSymbol,
    state,
  };
}

/**
 * Komponen untuk merender satu rumus kimia rapi dengan subskrip, superskrip ion, dan status fasa
 */
export function ChemicalFormula({
  formula,
  className = "",
  showState = true,
}: {
  formula: string;
  className?: string;
  showState?: boolean;
}) {
  if (!formula) return null;
  const parsed = parseFormula(formula);

  return (
    <span className={`inline-flex items-baseline font-mono tracking-tight select-text ${className}`}>
      {/* Koefisien Stoikiometri */}
      {parsed.coefficient && (
        <span className="font-bold text-slate-800 dark:text-slate-100 mr-0.5">
          {parsed.coefficient}
        </span>
      )}

      {/* Rangkaian Simbol Unsur & Subskrip */}
      <span className="font-semibold">
        {parsed.tokens.map((token, idx) => {
          if (token.type === "subscript") {
            return (
              <sub
                key={idx}
                className="text-[0.72em] font-bold text-sky-700 leading-none select-text align-sub bottom-[-0.2em] relative"
              >
                {token.value}
              </sub>
            );
          }
          if (token.type === "paren") {
            return (
              <span key={idx} className="text-slate-500 font-bold">
                {token.value}
              </span>
            );
          }
          if (token.type === "dot") {
            return (
              <span key={idx} className="mx-0.5 text-amber-600 font-bold">
                •
              </span>
            );
          }
          return (
            <span key={idx} className="text-slate-900">
              {token.value}
            </span>
          );
        })}
      </span>

      {/* Muatan Ion (Superskrip) */}
      {parsed.charge && (
        <sup className="text-[0.7em] font-bold text-amber-600 leading-none select-text align-super top-[-0.3em] relative ml-0.5">
          {parsed.charge}
        </sup>
      )}

      {/* Simbol Endapan / Gas */}
      {parsed.specialSymbol && (
        <span
          className={`text-[0.75em] font-black ml-0.5 select-none ${
            parsed.specialSymbol === "v" || parsed.specialSymbol === "↓"
              ? "text-amber-600"
              : "text-sky-600"
          }`}
          title={
            parsed.specialSymbol === "v" || parsed.specialSymbol === "↓"
              ? "Endapan (Precipitate)"
              : "Pelepasan Gas"
          }
        >
          {parsed.specialSymbol === "v" ? "↓" : parsed.specialSymbol === "^" ? "↑" : parsed.specialSymbol}
        </span>
      )}

      {/* Fasa Zat: (s), (aq), (l), (g) */}
      {showState && parsed.state && (
        <span className="text-[0.75em] font-sans italic text-slate-500 font-normal ml-0.5">
          {parsed.state}
        </span>
      )}
    </span>
  );
}

/**
 * Komponen untuk merender satu persamaan reaksi kimia lengkap
 * Contoh: "2KMnO4 (aq) + C3H5(OH)3 (l) -> 2MnO2 v (s, cokelat) + K2CO3 + H2O"
 */
export function ChemicalEquation({
  equation,
  className = "",
  showCopy = true,
  title,
}: {
  equation: string;
  className?: string;
  showCopy?: boolean;
  title?: string;
}) {
  const [copied, setCopied] = useState(false);

  if (!equation) return null;

  // Split panah reaksi
  const arrowRegex = /\s*(?:<==>|<=>|-->|->|==>|=>|⇌|⇄)\s*/;
  const parts = equation.split(arrowRegex);

  const isReversible = equation.includes("<") || equation.includes("⇌") || equation.includes("⇄");
  const arrowSymbol = isReversible ? "⇌" : "→";

  const handleCopy = () => {
    navigator.clipboard.writeText(equation);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (parts.length < 2) {
    // Fallback jika bukan persamaan reaksi berpanah
    return (
      <div className={`p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs ${className}`}>
        <ChemicalFormula formula={equation} />
      </div>
    );
  }

  const leftTerms = parts[0].split(/\s+\+\s+/).map((t) => t.trim()).filter(Boolean);
  const rightTerms = parts[1].split(/\s+\+\s+/).map((t) => t.trim()).filter(Boolean);

  return (
    <div
      className={`group relative bg-gradient-to-r from-slate-50 via-white to-slate-50 border border-slate-200/90 rounded-xl p-3 sm:p-3.5 shadow-xs transition-all hover:border-sky-300 ${className}`}
    >
      {title && (
        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 pb-1.5 mb-2">
          <FlaskConical className="w-3 h-3 text-sky-600" />
          <span>{title}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 font-mono text-xs sm:text-sm">
        {/* Sisi Reaktan (Kiri) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {leftTerms.map((term, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-slate-400 font-bold px-0.5 select-none">+</span>}
              <span className="bg-sky-50/60 hover:bg-sky-50 border border-sky-100 px-2 py-0.5 rounded-lg text-slate-900 transition-colors">
                <ChemicalFormula formula={term} />
              </span>
            </React.Fragment>
          ))}
        </div>

        {/* Panah Reaksi */}
        <div
          className={`flex items-center justify-center px-1 font-bold text-base select-none shrink-0 ${
            isReversible ? "text-emerald-600" : "text-sky-600"
          }`}
          title={isReversible ? "Reaksi Bolak-Balik (Kesetimbangan)" : "Reaksi Satu Arah (Irreversibel)"}
        >
          {arrowSymbol}
        </div>

        {/* Sisi Produk (Kanan) */}
        <div className="flex flex-wrap items-center gap-1.5">
          {rightTerms.map((term, i) => (
            <React.Fragment key={i}>
              {i > 0 && <span className="text-slate-400 font-bold px-0.5 select-none">+</span>}
              <span className="bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg text-slate-900 transition-colors">
                <ChemicalFormula formula={term} />
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Tombol Copy Persamaan */}
      {showCopy && (
        <button
          type="button"
          onClick={handleCopy}
          className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-slate-700 bg-white/80 hover:bg-slate-100 border border-slate-200/80 rounded-lg transition-colors text-xs flex items-center gap-1 shadow-2xs opacity-80 group-hover:opacity-100"
          title="Salin persamaan reaksi"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-600" />
              <span className="text-[10px] text-emerald-700 font-semibold font-sans">Tersalin</span>
            </>
          ) : (
            <Copy className="w-3 h-3" />
          )}
        </button>
      )}
    </div>
  );
}

/**
 * Helper deteksi apakah sebuah kata adalah rumus kimia
 */
export function isWordChemicalFormula(word: string): boolean {
  const clean = word.replace(/^[("'`,.:;!?]+|[("'`,.:;!?]+$/g, "");
  if (!clean || clean.length < 2) return false;
  if (clean === "3D" || clean === "AI" || clean === "PIN" || clean === "SD" || clean === "SMP" || clean === "SMA") return false;

  // Unsur diikuti angka subskrip, e.g. H2O, CO2, KMnO4, CH3COOH, PbI2
  if (/^[A-Z][a-z]?\d/.test(clean) || /[A-Z][a-z]?\d+/.test(clean)) return true;

  // Memiliki tanda kurung unsur, e.g. Pb(NO3)2, (OH)3
  if (/\([A-Za-z0-9]+\)\d*/.test(clean)) return true;

  // Memiliki muatan ion, e.g. Na+, Cl-, OH-, Cu2+, SO4^2-, NO3-, CH3COO-
  if (/^[A-Z][A-Za-z0-9]*(\^?[+-]|\^\d+[+-]|\d+[+-])$/.test(clean)) return true;

  // Daftar rumus umum tanpa angka
  const known = ["HCL", "NAOH", "NACL", "KI", "KOH", "AGCL", "CUO", "MNO", "ZNO", "HF", "HBR", "HI"];
  if (known.includes(clean.toUpperCase())) return true;

  return false;
}

/**
 * Format satu baris kalimat: mengenali **bold**, kata rumus kimia, dan teks biasa
 */
function renderFormattedSentence(sentence: string, keyPrefix: string): React.ReactNode {
  // Split berdasarkan bold markdown **...**
  const boldParts = sentence.split(/(\*\*[^*]+\*\*)/g);

  return boldParts.map((bPart, bIdx) => {
    const isBold = bPart.startsWith("**") && bPart.endsWith("**");
    const content = isBold ? bPart.slice(2, -2) : bPart;

    // Split per kata untuk mendeteksi rumus kimia inline
    const words = content.split(/(\s+)/);

    const renderedWords = words.map((w, wIdx) => {
      // Jika spasi biasa
      if (/^\s+$/.test(w)) return w;

      // Cek tanda baca di depan/belakang
      const prefixMatch = w.match(/^[("'`,.:;!?]+/);
      const suffixMatch = w.match(/[("'`,.:;!?]+$/);
      const prefix = prefixMatch ? prefixMatch[0] : "";
      const suffix = suffixMatch ? suffixMatch[0] : "";
      const core = w.slice(prefix.length, w.length - suffix.length);

      if (isWordChemicalFormula(core)) {
        return (
          <React.Fragment key={`${keyPrefix}-${bIdx}-${wIdx}`}>
            {prefix}
            <span className="bg-sky-50/70 border border-sky-200/60 px-1 py-0.2 rounded font-mono text-[0.95em]">
              <ChemicalFormula formula={core} />
            </span>
            {suffix}
          </React.Fragment>
        );
      }

      return w;
    });

    if (isBold) {
      return (
        <strong key={`${keyPrefix}-${bIdx}`} className="font-bold text-slate-900">
          {renderedWords}
        </strong>
      );
    }

    return <React.Fragment key={`${keyPrefix}-${bIdx}`}>{renderedWords}</React.Fragment>;
  });
}

/**
 * Komponen utama untuk merender jawaban chat AI (Kak Lab-AI) dengan formula kimia & reaksi stoikiometri
 */
export function FormattedAiMessage({
  text,
  isUser = false,
}: {
  text: string;
  isUser?: boolean;
}) {
  if (!text) return null;

  // Jika pesan dari user, render teks biasa
  if (isUser) {
    return <p className="whitespace-pre-wrap">{text}</p>;
  }

  // Pecah per baris untuk memisahkan blok reaksi kimia, bullet list, dan paragraf biasa
  const lines = text.split("\n");

  return (
    <div className="space-y-2.5 text-xs leading-relaxed text-slate-800">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim();

        // Baris kosong
        if (!trimmed) {
          return <div key={lineIdx} className="h-1" />;
        }

        // Cek apakah baris ini adalah persamaan reaksi lengkap (memiliki -> atau --> atau ⇌)
        const isEquation =
          (trimmed.includes("->") || trimmed.includes("-->") || trimmed.includes("⇌") || trimmed.includes("<=>")) &&
          /[A-Z]/.test(trimmed);

        if (isEquation) {
          // Bersihkan backtick jika ada
          const cleanEq = trimmed.replace(/^`+|`+$/g, "").trim();
          return (
            <div key={lineIdx} className="my-2">
              <ChemicalEquation equation={cleanEq} showCopy={true} />
            </div>
          );
        }

        // Cek apakah bullet point (- atau * atau 1.)
        const bulletMatch = trimmed.match(/^([-*]|\d+\.)\s+(.+)$/);
        if (bulletMatch) {
          const bulletSymbol = bulletMatch[1];
          const bulletContent = bulletMatch[2];

          return (
            <div key={lineIdx} className="flex items-start gap-2 pl-1.5 my-1">
              <span className="text-sky-600 font-bold select-none shrink-0 text-xs">
                {bulletSymbol.includes(".") ? bulletSymbol : "•"}
              </span>
              <div className="flex-1">
                {renderFormattedSentence(bulletContent, `bullet-${lineIdx}`)}
              </div>
            </div>
          );
        }

        // Paragraf biasa
        return (
          <p key={lineIdx} className="leading-relaxed">
            {renderFormattedSentence(line, `p-${lineIdx}`)}
          </p>
        );
      })}
    </div>
  );
}

