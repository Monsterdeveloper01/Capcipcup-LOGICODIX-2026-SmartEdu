import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rows = await query<any[]>(
      `SELECT * FROM quests WHERE id = ? OR room_code = ? LIMIT 1`,
      [id, id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Quest tidak ditemukan." }, { status: 404 });
    }

    const q = rows[0];

    const parseJson = (val: any) => {
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return [];
        }
      }
      return val || [];
    };

    return NextResponse.json({
      success: true,
      quest: {
        id: q.id,
        mode: q.mode,
        room_code: q.room_code,
        creator_name: q.creator_name,
        title: q.title,
        target_language: q.target_language,
        difficulty_level: q.difficulty_level,
        case_study_story: q.case_study_story,
        npc_name: q.npc_name,
        npc_persona: q.npc_persona,
        required_object_hint: q.required_object_hint,
        mission_objectives: parseJson(q.mission_objectives),
        target_vocabularies: parseJson(q.target_vocabularies),
        quiz_questions: parseJson(q.quiz_questions),
        created_at: q.created_at,
      },
    });
  } catch (err: any) {
    console.error("Fetch quest error:", err);
    return NextResponse.json({ error: "Gagal memuat quest.", details: err.message }, { status: 500 });
  }
}

