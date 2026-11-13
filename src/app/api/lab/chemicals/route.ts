import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { CHEMICAL_CATALOG } from "@/lib/lab/chemicals-db";
import { requireTeacher } from "@/lib/auth/session";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const level = searchParams.get("level");
    const category = searchParams.get("category");

    let sql = `
      SELECT 
        id,
        name,
        formula,
        color,
        category,
        grade_level AS level,
        description,
        safety_note AS safetyNote,
        hazard_level AS hazardLevel
      FROM chemicals
    `;

    const conditions: string[] = [];
    const params: any[] = [];

    if (level) {
      conditions.push("grade_level = ?");
      params.push(level);
    }
    if (category) {
      conditions.push("category = ?");
      params.push(category);
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }

    sql += " ORDER BY id ASC";

    const rows = await query<any[]>(sql, params);

    if (rows && rows.length > 0) {
      return NextResponse.json({ chemicals: rows });
    }

    // Fallback to catalog if database has no rows
    let catalog = CHEMICAL_CATALOG;
    if (level) {
      catalog = catalog.filter((c) => c.level === level);
    }
    if (category) {
      catalog = catalog.filter((c) => c.category === category);
    }

    return NextResponse.json({ chemicals: catalog });
  } catch (err: any) {
    console.error("Fetch chemicals error:", err);
    return NextResponse.json({
      chemicals: CHEMICAL_CATALOG,
      source: "fallback_catalog",
      error: err?.message,
    });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireTeacher();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const chemicalsList = Array.isArray(body) ? body : [body];

    if (chemicalsList.length === 0) {
      return NextResponse.json({ error: "Data zat kimia tidak boleh kosong." }, { status: 400 });
    }

    const saved: any[] = [];

    for (const c of chemicalsList) {
      const formula = c.formula || c.id || "UNK";
      const id = c.id || `ch_${formula.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
      const name = c.name || formula;
      const color = c.color || "#60a5fa";
      const category = c.category || "umum";
      const gradeLevel = c.level || c.grade_level || "SMP";
      const description = c.description || `Zat kimia ${name} (${formula})`;
      const safetyNote = c.safetyNote || c.safety_note || "Gunakan perlengkapan lab standar.";
      const hazardLevel = parseInt(String(c.hazardLevel ?? c.hazard_level ?? 0), 10);

      await query(
        `
        INSERT INTO chemicals (
          id, name, formula, color, category, grade_level, description, safety_note, hazard_level
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
          name=VALUES(name), formula=VALUES(formula), color=VALUES(color),
          category=VALUES(category), grade_level=VALUES(grade_level),
          description=VALUES(description), safety_note=VALUES(safety_note),
          hazard_level=VALUES(hazard_level)
      `,
        [id, name, formula, color, category, gradeLevel, description, safetyNote, hazardLevel]
      );

      saved.push({
        id,
        name,
        formula,
        color,
        category,
        level: gradeLevel,
        description,
        safetyNote,
        hazardLevel,
      });
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil menyimpan ${saved.length} zat kimia ke database!`,
      chemicals: saved,
    });
  } catch (err: any) {
    console.error("Save chemicals error:", err);
    return NextResponse.json({ error: err?.message || "Gagal menyimpan zat kimia ke database." }, { status: 500 });
  }
}

