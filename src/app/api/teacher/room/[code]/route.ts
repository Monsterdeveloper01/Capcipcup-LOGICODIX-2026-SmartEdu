import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    const quests = await query<any[]>(
      `SELECT * FROM quests WHERE room_code = ? LIMIT 1`,
      [code.toUpperCase()]
    );

    if (!quests || quests.length === 0) {
      return NextResponse.json({ error: "Room tidak ditemukan." }, { status: 404 });
    }

    const q = quests[0];

    const submissions = await query<any[]>(
      `SELECT s.id, s.student_name, s.status, s.quiz_score, s.speaking_score, s.total_score, s.cefr_level, 
              s.python_fluency_metrics, s.created_at, s.completed_at
       FROM submissions s
       WHERE s.quest_id = ?
       ORDER BY s.total_score DESC, s.created_at DESC`,
      [q.id]
    );

    return NextResponse.json({
      success: true,
      quest: q,
      submissions: submissions || [],
    });
  } catch (err: any) {
    console.error("Room fetch error:", err);
    return NextResponse.json({ error: "Gagal memuat room.", details: err.message }, { status: 500 });
  }
}

