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

    const normA = String(formulaA || "")
      .replace(/\s*\((aq|s|l|g|padat|cair|gas|larutan)\)/gi, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();
    const normB = String(formulaB || "")
      .replace(/\s*\((aq|s|l|g|padat|cair|gas|larutan)\)/gi, "")
      .replace(/[^a-zA-Z0-9]/g, "")
      .toUpperCase();

    // Guard: Identical substances (e.g. pouring NaOH into NaOH) never triggers reactions or concatenations
    if (normA && normB && (normA === normB || normA.includes(normB) || normB.includes(normA))) {
      return NextResponse.json({
        success: true,
        reaction: {
          isReacting: false,
          title: `Penambahan Volume ${formulaB}`,
          equation: `${formulaB} + ${formulaA} → ${formulaB}`,
          productName: nameB,
          productFormula: formulaB,
          productColor: typeof reactantB === "object" && reactantB.color ? reactantB.color : "#38bdf8",
          visualEffect: "color_change",
          temperatureChangeC: 0,
          dangerWarning: null,
          explanation: `Pencampuran larutan yang sejenis hanya menambah volume zat cair tanpa menimbulkan reaksi kimiawi.`,
          reasonWhy: `Kedua zat memiliki identitas kimia dan bilangan oksidasi yang sama, sehingga tidak terdapat gaya dorong termodinamika maupun pertukaran partikel/elektron untuk membentuk ikatan baru.`,
          observablePhenomena: `Ketinggian permukaan zat cair dalam bejana meningkat secara proporsional seiring bertambahnya volume, tanpa ada perubahan warna, gelembung gas, endapan, maupun variasi suhu.`,
          level: "SMP",
        },
      });
    }

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
          explanation: `Pencampuran antara ${nameA} dan ${nameB} menghasilkan interaksi fisikokimia dalam larutan dengan sedikit pelepasan kalor solvasi.`,
          reasonWhy: `Partikel-partikel terlarut saling berdifusi secara kinetik dan mengalami solvasi oleh molekul pelarut, mencapai kesetimbangan fasa homogen baru.`,
          observablePhenomena: `Cairan berpadu menghasilkan warna gradasi baru disertai sedikit gelembung halus saat penuangan berlangsung.`,
          level: "SMP",
        },
      });
    }

    const ai = getAiClient();
    const prompt = `Anda adalah Ahli Kimia Fisik dan Simulator Reaksi Kimia Laboratorium Nyata.
Tugas Anda adalah memprediksi SECARA ILMIAH dan MENGHASILKAN PARAMETER VISUALISASI 3D saat dua zat kimia berikut dicampurkan di laboratorium:

- Zat A: ${nameA} (${formulaA})
- Zat B: ${nameB} (${formulaB})

ATURAN HUKUM ILMIAH & KEKEKALAN MASSA (MUTLAK HARUS DIIKUTI):
1. HUKUM KEKEKALAN UNSUR: Produk reaksi HANYA BOLEH mengandung atom/unsur yang ADA di Zat A dan Zat B. DILARANG KERAS memunculkan unsur kimia baru yang tidak ada dalam reaktan (Contoh: jika mencampurkan H2O dan NaOH, produk HANYA boleh mengandung H, O, dan Na. DILARANG MEMUNCULKAN Aluminium/Al, Besi/Fe, Karbon/C, dsb.).
2. JIKA SALAH SATU ADALAH PELARUT AIR (H2O):
   - Jika dicampur dengan minyak/lipid/lemak: Air bersifat polar dan minyak non-polar sehingga tidak menyatu dan membentuk dua lapisan (minyak mengapung di atas). DILARANG menggunakan rumus organik rumit seperti "R-COO-R'". Gunakan rumus ramah siswa: "H2O // Minyak", warna produk: "#eab308" (kuning minyak goreng), visualEffect: "color_change".
   - Jika dicampur dengan asam kuat atau basa kuat (seperti NaOH padat), ini adalah proses pelarutan eksotermik kuat yang melepaskan kalor/panas ("Pelarutan Eksotermik Natrium Hidroksida", produk: NaOH (aq), efek: "steam", suhu: +25°C s/d +30°C).
   - Jika dicampur garam netral yang larut, ini adalah pelarutan biasa.
   - HINDARI penggunaan karakter unicode subscript (misal gunakan 'H2O' angka 2 biasa, BUKAN 'H₂O' agar font 3D tidak error).
3. FASE PADAT VS CAIR (SOLID VS AQUEOUS) PADA OKSIDATOR KUAT (KMnO4 & Gliserin):
   - Jika KMnO4 dalam bentuk serbuk/kristal padat murni (solid/s) dicampur dengan Gliserin murni: Ini adalah reaksi redoks piroteknik spontan dahsyat yang melepaskan asap putih tebal ("visualEffect": "steam"), nyala api ungu, dan lonjakan suhu tinggi (temperatureChangeC: +45°C).
   - Namun JIKA KMnO4 sudah dalam larutan air (aqueous/aq) atau dicampur air: Air meredam panas sehingga TIDAK ADA ASAP MAUPUN API ("visualEffect": "precipitate" atau "color_change", temperatureChangeC: +2°C). Reaksi berlangsung lambat mereduksi ion permanganat ungu menjadi endapan koloid cokelat mangan dioksida (MnO2).
4. KELAYAKAN REAKSI:
   - Apakah kedua zat ini bereaksi secara kimiawi (asam-basa, presipitasi/endapan, redoks, gas, pelarutan eksotermik/endotermik)?
5. JIKA BEREAKSI:
   - "isReacting": true
   - "title": Nama judul reaksi ilmiah yang tepat (contoh: "Pelarutan Eksotermik Natrium Hidroksida", "Reaksi Netralisasi Asam-Basa", "Presipitasi Endapan").
   - "equation": Persamaan reaksi seimbang (misal: "NaOH (s) + H₂O (l) → Na⁺ (aq) + OH⁻ (aq) + Panas").
   - "productName": Nama produk kimia yang nyata.
   - "productFormula": Rumus kimia produk yang valid secara stoikiometri.
   - "productColor": Warna cairan produk dalam format HEX Color (contoh: "#e0f7fa" bening kebiruan aqua untuk NaOH aq, "#10b981" hijau netral, "#fbbf24" kuning, "#1e40af" biru tua, "#f8fafc" putih susu keruh).
   - "visualEffect": Pilih HANYA SALAH SATU: "bubbles" | "steam" | "spark" | "precipitate" | "color_change"
   - "temperatureChangeC": Estimasi perubahan suhu (°C), misal +28 untuk eksotermik, -5 untuk endotermik, 0 untuk netral.
   - "dangerWarning": Peringatan bahaya K3 singkat jika zat korosif/berbahaya.
   - "explanation": Penjelasan sains lengkap, mendalam, dan komprehensif (konsep materi reaksi kimia, apa yang terjadi pada zat-zat tersebut).
   - "reasonWhy": Alasan dan mekanisme ilmiah mengapa reaksi terjadi (contoh: transfer proton asam-basa Bronsted-Lowry, gaya elektrostatik presipitasi Qsp > Ksp, perbedaan potensial reduksi transfer elektron redoks, pemutusan ikatan ester, kenaikan entropi gas tak stabil).
   - "observablePhenomena": Ciri-ciri visual dan fisik nyata yang teramati langsung di laboratorium (perubahan warna produk, endapan padat/gelatin, semburan gelembung gas mendesis, kepulan asap/uap, perubahan suhu dinding bejana).
   - "level": Jenjang materi ("SD" | "SMP" | "SMA").
5. JIKA TIDAK BEREAKSI:
   - "isReacting": false
   - Berikan warna optik hasil percampuran biasa.
   - "visualEffect": "color_change"
   - "explanation": Penjelasan sains rinci mengapa kedua zat tidak bereaksi.
   - "reasonWhy": Alasan ilmiah mengapa tidak terbentuk reaksi (tidak ada afinitas kimia, kedua zat stabil/netral, tidak melampaui energi aktivasi).
   - "observablePhenomena": Tampilan campuran larutan biasa yang berbaur tanpa timbul gas, endapan, atau perubahan suhu.

Kembalikan HANYA format JSON valid tanpa tanda kutip markdown:
{
  "isReacting": true,
  "title": "Nama Reaksi",
  "equation": "Persamaan Reaksi Seimbang",
  "productName": "Nama Produk",
  "productFormula": "Rumus Produk",
  "productColor": "#e0f7fa",
  "visualEffect": "steam",
  "temperatureChangeC": 25,
  "dangerWarning": "Larutan basa kuat, hindari terkena kulit.",
  "explanation": "Penjelasan sains mendalam dan rinci...",
  "reasonWhy": "Alasan dan mekanisme ilmiah terjadinya reaksi...",
  "observablePhenomena": "Ciri-ciri fisik dan visual nyata yang teramati di lab...",
  "level": "SMP"
}`;

    const res = await generateContentWithFallback(ai, { contents: prompt });
    const rawText = res.text || "";

    const cleanJson = rawText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const parsed = JSON.parse(cleanJson);

    // Auto-save reaction discovery into MySQL database if valid & not a generic placeholder
    const isGenericFormula = (f: string) =>
      !f ||
      f.toLowerCase().includes("hasil") ||
      f.toLowerCase().includes("campuran") ||
      f.toLowerCase().includes("complex") ||
      f.toLowerCase().includes("produk");

    if (parsed && parsed.isReacting && !isGenericFormula(String(formulaA)) && !isGenericFormula(String(formulaB))) {
      try {
        const id = `rx_ai_${formulaA}_${formulaB}`.toLowerCase().replace(/[^a-z0-9_]/g, "");
        const reactantAId = `ch_${String(formulaA).toLowerCase().replace(/[^a-z0-9]/g, "")}`;
        const reactantBId = `ch_${String(formulaB).toLowerCase().replace(/[^a-z0-9]/g, "")}`;

        await query(
          `
          INSERT INTO chemical_reactions (
            id, reactant_a_id, reactant_b_id, reactant_a_formula, reactant_b_formula,
            title, equation, product_name, product_formula, product_color,
            visual_effect, temperature_change_c, explanation, reason_why, observable_phenomena, grade_level
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          ON DUPLICATE KEY UPDATE
            title=VALUES(title), equation=VALUES(equation), product_name=VALUES(product_name),
            product_formula=VALUES(product_formula), product_color=VALUES(product_color),
            visual_effect=VALUES(visual_effect), temperature_change_c=VALUES(temperature_change_c),
            explanation=VALUES(explanation), reason_why=VALUES(reason_why),
            observable_phenomena=VALUES(observable_phenomena)
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
            parsed.reasonWhy || "",
            parsed.observablePhenomena || "",
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

