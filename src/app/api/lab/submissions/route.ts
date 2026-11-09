import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// POST: Siswa mengumpulkan hasil praktik + kuis
export async function POST(req: Request) {
  try {
    const { taskId, studentName, isReactionAchieved, score, answers, aiAnalysis } = await req.json();

    if (!taskId || !studentName) {
      return NextResponse.json({ error: "Task ID dan nama siswa wajib diisi." }, { status: 400 });
    }

    const submissionId = `sub_${Date.now()}`;

    await query(
      `INSERT INTO lab_submissions 
       (id, task_id, student_name, is_reaction_achieved, quiz_score, quiz_answers, ai_feedback)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,   
      [
        submissionId,
        taskId,
        studentName,
        Boolean(isReactionAchieved),
        Number(score) || 0,
        JSON.stringify(answers || []),
        aiAnalysis || "Praktikum selesai dengan baik.",
      ]
    );

    return NextResponse.json({
      success: true,
      submissionId,
      message: "Laporan praktikum dan kuis berhasil dikumpulkan ke Guru!",
    });
  } catch (err: any) {
    console.error("POST lab_submission error:", err);
    return NextResponse.json({ error: err.message || "Gagal menyimpan hasil praktikum" }, { status: 500 });
  }
}

// GET: Guru mengambil rekap nilai satu tugas praktikum
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");

    let sql = "SELECT * FROM lab_submissions ORDER BY completed_at DESC";
    const params: any[] = [];

    if (taskId) {
      sql = "SELECT * FROM lab_submissions WHERE task_id = ? ORDER BY completed_at DESC";
      params.push(taskId);
    }

    const rows = await query<any[]>(sql, params);

    return NextResponse.json({
      success: true,
      submissions: (rows || []).map((r) => ({
        id: r.id,
        taskId: r.task_id,
        studentName: r.student_name,
        isReactionAchieved: Boolean(r.is_reaction_achieved),
        score: r.quiz_score,
        answers: typeof r.quiz_answers === "string" ? JSON.parse(r.quiz_answers) : r.quiz_answers || [],
        aiAnalysis: r.ai_feedback,
        completedAt: r.completed_at,
      })),
    });
  } catch (err: any) {
    console.error("GET lab_submissions error:", err);
    return NextResponse.json({ error: err.message || "Gagal mengambil data nilai" }, { status: 500 });
  }
}
