import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { REACTION_CATALOG } from "@/lib/lab/chemicals-db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const reactantA = searchParams.get("reactantA");
    const reactantB = searchParams.get("reactantB");

    let sql = `
      SELECT 
        id,
        reactant_a_id AS reactantAId,
        reactant_b_id AS reactantBId,
        reactant_a_formula AS substanceA,
        reactant_b_formula AS substanceB,
        title,
        equation,
        product_name AS resultName,
        product_formula AS resultFormula,
        product_color AS resultColor,
        visual_effect AS effectType,
        temperature_change_c AS temperatureChange,
        explanation,
        grade_level AS level
      FROM chemical_reactions
    `;

    const params: any[] = [];

    if (reactantA && reactantB) {
      sql += `
        WHERE (
          (reactant_a_formula = ? AND reactant_b_formula = ?) OR
          (reactant_a_formula = ? AND reactant_b_formula = ?) OR
          (reactant_a_id = ? AND reactant_b_id = ?) OR
          (reactant_a_id = ? AND reactant_b_id = ?)
        )
      `;
      params.push(reactantA, reactantB, reactantB, reactantA, reactantA, reactantB, reactantB, reactantA);
    }

    const rows = await query<any[]>(sql, params);

    // If database returned rows, return them!
    if (rows && rows.length > 0) {
      return NextResponse.json({ reactions: rows });
    }

    // Fallback to in-memory catalog if database is momentarily empty
    const formattedCatalog = REACTION_CATALOG.map((r) => ({
      id: r.id,
      reactantAId: r.reactantAId,
      reactantBId: r.reactantBId,
      substanceA: r.reactantAFormula,
      substanceB: r.reactantBFormula,
      title: r.title,
      equation: r.equation,
      resultName: r.productName,
      resultFormula: r.productFormula,
      resultColor: r.productColor,
      effectType: r.visualEffect,
      temperatureChange: r.temperatureChangeC,
      explanation: r.explanation,
      level: r.level,
    }));

    if (reactantA && reactantB) {
      const match = formattedCatalog.filter(
        (r) =>
          (r.substanceA === reactantA && r.substanceB === reactantB) ||
          (r.substanceA === reactantB && r.substanceB === reactantA)
      );
      return NextResponse.json({ reactions: match });
    }

    return NextResponse.json({ reactions: formattedCatalog });
  } catch (err: any) {
    console.error("Fetch chemical_reactions error:", err);
    // Safe fallback to catalog on DB connection error
    return NextResponse.json({
      reactions: REACTION_CATALOG.map((r) => ({
        id: r.id,
        reactantAId: r.reactantAId,
        reactantBId: r.reactantBId,
        substanceA: r.reactantAFormula,
        substanceB: r.reactantBFormula,
        title: r.title,
        equation: r.equation,
        resultName: r.productName,
        resultFormula: r.productFormula,
        resultColor: r.productColor,
        effectType: r.visualEffect,
        temperatureChange: r.temperatureChangeC,
        explanation: r.explanation,
        level: r.level,
      })),
      source: "fallback_catalog",
      error: err?.message,
    });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Support single reaction object or array of reactions!
    const reactionsList = Array.isArray(body) ? body : [body];

    if (reactionsList.length === 0) {
      return NextResponse.json({ error: "Data reaksi tidak boleh kosong." }, { status: 400 });
    }

    const saved: any[] = [];

    for (const r of reactionsList) {
      const id = r.id || `rx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const reactantA = r.substanceA || r.reactantA || r.reactantAFormula || r.reactantAId;
      const reactantB = r.substanceB || r.reactantB || r.reactantBFormula || r.reactantBId;
      const reactantAId = r.reactantAId || `ch_${String(reactantA).toLowerCase().replace(/[^a-z0-9]/g, "")}`;
      const reactantBId = r.reactantBId || `ch_${String(reactantB).toLowerCase().replace(/[^a-z0-9]/g, "")}`;
      const title = r.title || `Reaksi ${reactantA} + ${reactantB}`;
      const equation = r.equation || `${reactantA} + ${reactantB} → ${r.resultFormula || r.productFormula || "Produk Reaksi"}`;
      const productName = r.resultName || r.productName || "Hasil Reaksi Kimia";
      const productFormula = r.resultFormula || r.productFormula || "Zat Baru";
      const productColor = r.resultColor || r.productColor || "#38bdf8";
      const visualEffect = r.effectType || r.visualEffect || "color_change";
      const temperatureChange = parseInt(String(r.temperatureChange ?? r.temperatureChangeC ?? 0), 10);
      const explanation = r.explanation || `Reaksi kimia antara ${reactantA} dan ${reactantB}.`;
      const gradeLevel = r.level || r.gradeLevel || "SMP";

      await query(
        `
        INSERT INTO chemical_reactions (
          id, reactant_a_id, reactant_b_id, reactant_a_formula, reactant_b_formula,
          title, equation, product_name, product_formula, product_color,
          visual_effect, temperature_change_c, explanation, grade_level
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          reactant_a_formula=VALUES(reactant_a_formula), reactant_b_formula=VALUES(reactant_b_formula),
          title=VALUES(title), equation=VALUES(equation), product_name=VALUES(product_name),
          product_formula=VALUES(product_formula), product_color=VALUES(product_color),
          visual_effect=VALUES(visual_effect), temperature_change_c=VALUES(temperature_change_c),
          explanation=VALUES(explanation), grade_level=VALUES(grade_level)
      `,
        [
          id,
          reactantAId,
          reactantBId,
          reactantA,
          reactantB,
          title,
          equation,
          productName,
          productFormula,
          productColor,
          visualEffect,
          temperatureChange,
          explanation,
          gradeLevel,
        ]
      );

      saved.push({
        id,
        substanceA: reactantA,
        substanceB: reactantB,
        title,
        equation,
        resultName: productName,
        resultFormula: productFormula,
        resultColor: productColor,
        effectType: visualEffect,
        temperatureChange,
        explanation,
        level: gradeLevel,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menyimpan ${saved.length} reaksi kimia ke database!`,
      reactions: saved,
    });
  } catch (err: any) {
    console.error("Save chemical_reactions error:", err);
    return NextResponse.json({ error: err?.message || "Gagal menyimpan reaksi kimia ke database." }, { status: 500 });
  }
}

