import { NextResponse } from "next/server";
import { getAiClient, hasAiKey, generateContentWithFallback } from "@/lib/ai/client";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const { reactantA, reactantB } = await req.json();

    if (!reactantA || !reactantB) {
      return NextResponse.json(
        { error: "Zat kimia A dan B harus disertakan." },
        { status: 400 }
      );
    }

    const nameA = typeof reactantA === "string" ? reactantA : reactantA.name || reactantA.formula;
    const formulaA = typeof reactantA === "object" ? reactantA.formula : reactantA;
    const nameB = typeof reactantB === "string" ? reactantB : reactantB.name || reactantB.formula;
    const formulaB = typeof reactantB === "object" ? reactantB.formula : reactantB;

    // Fallback if AI Key is missing
    if (!hasAiKey()) {
      return NextResponse.json({
        success: true,
        reaction: {
          isReacting: true,
          title: `Interaksi ${formulaA} + ${formulaB}`,
          equation: `${formulaA} + ${formulaB} → Campuran Larutan Homogen`,
          productName: `Campuran ${nameA} & ${nameB}`,
          productFormula: `${formulaA}•${formulaB}`,
          productColor: "#06b6d4",
          visualEffect: "bubbles",
          temperatureChangeC: 5,
          dangerWarning: null,
          explanation: `Pencampuran antara ${nameA} dan ${nameB} menghasilkan interaksi fisikokimia dalam larutan.`,
          level: "SMP",
        },
      });
    }

    const ai = getAiClient();
    const prompt = `Anda adalah Ahli Kimia Fisik dan Simulator Reaksi Kimia Otomatis.
Tugas Anda adalah memprediksi SECARA ILMIAH dan MENGHASILKAN PARAMETER VISUALISASI 3D saat dua zat kimia berikut dicampurkan di laboratorium:

- Zat A: ${nameA} (${formulaA})
- Zat B: ${nameB} (${formulaB})

ANALISIS YANG HARUS DILAKUKAN:
1. Apakah kedua zat ini bereaksi secara kimiawi (reaksi asam-basa, presipitasi/endapan, redoks, pembentukan gas, dehidrasi, dsb.)? Atau hanya pencampuran fisik tanpa reaksi kimia?
2. Jika bereaksi:
   - Tuliskan nama judul fenomena reaksi (contoh: "Reaksi Netralisasi Pembentukan Garam", "Reaksi Presipitasi Hujan Emas", "Reaksi Redoks Spontan").
   - Tuliskan persamaan reaksi kimia seimbang (misal: "HCl + NaOH → NaCl + H₂O").
   - Apa nama dan rumus produk akhir yang terbentuk?
   - Apa warna cairan produk akhir dalam format HEX Color (contoh: "#ef4444" merah, "#10b981" hijau netral, "#fbbf24" kuning emas, "#1e40af" biru tua, "#f8fafc" putih susu, dsb.)?
   - Apa efek visual 3D yang paling dominan? Pilih HANYA SALAH SATU:
     * "bubbles" (timbul gelembung gas buih meluap)
     * "steam" (timbul uap panas atau asap putih)
     * "spark" (letupan api mini atau kilau kristal presipitasi)
     * "precipitate" (terbentuk endapan suspensi padat)
     * "color_change" (hanya perubahan warna gradien perlahan)
   - Berapa estimasi perubahan suhu cairan dalam derajat Celsius (contoh: +15 jika eksotermik melepaskan panas, -5 jika endotermik menyerap panas/dingin, atau 0 jika tidak ada perubahan suhu)?
   - Apakah ada bahaya K3 nyata jika dilakukan sembrono di lab (misal ledakan, gas racun, korosif)? Jika ada, tuliskan kalimat peringatan singkat di "dangerWarning".
   - Tuliskan penjelasan edukatif ilmiah yang ramah dan mudah dipahami siswa dalam 2 kalimat.
   - Tentukan jenjang materi yang relevan ("SD", "SMP", atau "SMA").
3. Jika TIDAK BEREAKSI secara kimia:
   - "isReacting": false
   - Berikan warna hasil percampuran optik (misal warna A + warna B berbaur)
   - visualEffect: "color_change"
   - Jelaskan mengapa kedua zat tidak bereaksi (misal: sama-sama garam netral, atau tidak memiliki potensial reduksi yang cukup).

Kembalikan HANYA format JSON valid tanpa tanda kutip markdown, contoh:
{
  "isReacting": true,
  "title": "Nama Reaksi",
  "equation": "Persamaan Reaksi Seimbang",
  "productName": "Nama Produk",
  "productFormula": "Rumus Produk",
  "productColor": "#10b981",
  "visualEffect": "steam",
  "temperatureChangeC": 15,
  "dangerWarning": "Gunakan sarung tangan karena reaksi melepaskan uap asam korosif.",
  "explanation": "Penjelasan sains singkat...",
  "level": "SMP"
}`;

    const res = await generateContentWithFallback(ai, { contents: prompt });
    const rawText = res.text || "";

    const cleanJson = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanJson);

    // Auto-save reaction discovery into MySQL database if valid
    if (parsed && parsed.isReacting) {
      try {
        const id = `rx_ai_${formulaA}_${formulaB}`.toLowerCase().replace(/[^a-z0-9_]/g, "");
        const reactantAId = `ch_${String(formulaA).toLowerCase().replace(/[^a-z0-9]/g, "")}`;
        const reactantBId = `ch_${String(formulaB).toLowerCase().replace(/[^a-z0-9]/g, "")}`;

        await query(
          `
          INSERT INTO chemical_reactions (
            id, reactant_a_id, reactant_b_id, reactant_a_formula, reactant_b_formula,
            title, equation, product_name, product_formula, product_color,
            visual_effect, temperature_change_c, explanation, grade_level
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            title=VALUES(title), equation=VALUES(equation), product_name=VALUES(product_name),
            product_formula=VALUES(product_formula), product_color=VALUES(product_color),
            visual_effect=VALUES(visual_effect), temperature_change_c=VALUES(temperature_change_c),
            explanation=VALUES(explanation)
        `,
          [
            id,
            reactantAId,
            reactantBId,
            formulaA,
            formulaB,
            parsed.title || `Reaksi ${formulaA} + ${formulaB}`,
            parsed.equation || `${formulaA} + ${formulaB} → ${parsed.productFormula}`,
            parsed.productName || "Zat Baru",
            parsed.productFormula || "Produk Reaksi",
            parsed.productColor || "#38bdf8",
            parsed.visualEffect || "bubbles",
            parsed.temperatureChangeC || 0,
            parsed.explanation || "",
            parsed.level || "SMA",
          ]
        );
      } catch (saveDbErr) {
        // Non-blocking error logging
        console.warn("Failed to auto-cache reaction to DB:", saveDbErr);
      }
    }

    return NextResponse.json({
      success: true,
      reaction: parsed,
    });
  } catch (err: any) {
    console.error("AI Dynamic Reaction Error:", err);
    return NextResponse.json(
      {
        error: "Gagal memproses simulasi reaksi kimia AI.",
        details: err?.message,
      },
      { status: 500 }
    );
  }
}

