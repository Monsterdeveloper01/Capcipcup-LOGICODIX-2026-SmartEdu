import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const rows = await query<any[]>(
      `SELECT s.*, q.title as quest_title, q.case_study_story, q.npc_name 
       FROM submissions s
       LEFT JOIN quests q ON s.quest_id = q.id
       WHERE s.id = ? LIMIT 1`,
      [id]
    );

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: "Data submission tidak ditemukan." }, { status: 404 });
    }

    const sub = rows[0];

    const parseJson = (val: any) => {
      if (typeof val === "string") {
        try {
          return JSON.parse(val);
        } catch {
          return null;
        }
      }
      return val || null;
    };

    return NextResponse.json({
      success: true,
      submission: {
        id: sub.id,
        quest_id: sub.quest_id,
        quest_title: sub.quest_title || "Case Study Mission",
        student_name: sub.student_name,
        status: sub.status,
        quiz_score: sub.quiz_score,
        speaking_score: sub.speaking_score,
        total_score: sub.total_score,
        cefr_level: sub.cefr_level,
        python_fluency_metrics: parseJson(sub.python_fluency_metrics) || {},
        ai_feedback: parseJson(sub.ai_feedback) || {},
        chat_transcript: parseJson(sub.chat_transcript) || [],
        created_at: sub.created_at,
        completed_at: sub.completed_at,
      },
    });
  } catch (err: any) {
    console.error("Fetch submission error:", err);
    return NextResponse.json({ error: "Gagal memuat hasil evaluasi.", details: err.message }, { status: 500 });
  }
}

