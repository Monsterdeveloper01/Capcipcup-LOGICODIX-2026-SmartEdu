import { NextResponse } from "next/server";
import { getAiClient, hasAiKey, generateContentWithFallback } from "@/lib/ai/client";

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

    return NextResponse.json({
      success: true,
      reaction: parsed,
    });
  } catch (err: any) {
    console.error("AI Dynamic Reaction Error:", err);
    return NextResponse.json({
      success: true,
      reaction: {
        isReacting: true,
        title: "Interaksi Kimia Dinamis",
        equation: "Zat A + Zat B → Produk Interaksi Larutan",
        productName: "Larutan Campuran Baru",
        productFormula: "Reaksi Kompleks",
        productColor: "#06b6d4",
        visualEffect: "bubbles",
        temperatureChangeC: 3,
        dangerWarning: null,
        explanation: "Kedua zat bereaksi membentuk molekul baru dalam larutan.",
        level: "SMP",
      },
    });
  }
}
