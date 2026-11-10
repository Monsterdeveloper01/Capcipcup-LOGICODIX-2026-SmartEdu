import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// POST: Siswa mengumpulkan hasil praktik + kuis
export async function POST(req: Request) {
  try {
    const { taskId, studentName, isReactionAchieved, score, answers, aiAnalysis, experimentDetails } = await req.json();

    if (!taskId || !studentName) {
      return NextResponse.json({ error: "Task ID dan nama siswa wajib diisi." }, { status: 400 });
    }

    const cleanStudent = studentName.trim();
    const existing = await query<any[]>(
      "SELECT id FROM lab_submissions WHERE task_id = ? AND UPPER(TRIM(student_name)) = ? LIMIT 1",
      [taskId, cleanStudent.toUpperCase()]
    );

    let submissionId = `sub_${Date.now()}`;
    const expJson = experimentDetails ? JSON.stringify(experimentDetails) : null;
    const ansJson = JSON.stringify(answers || []);

    if (existing && existing.length > 0) {
      submissionId = existing[0].id;
      await query(
        `UPDATE lab_submissions 
         SET is_reaction_achieved = ?, quiz_score = ?, quiz_answers = ?, ai_feedback = ?, experiment_details = ?, completed_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          Boolean(isReactionAchieved),
          Number(score) || 0,
          ansJson,
          aiAnalysis || "Praktikum selesai dengan baik.",
          expJson,
          submissionId,
        ]
      );

      return NextResponse.json({
        success: true,
        submissionId,
        message: "Laporan praktikum dan kuis berhasil diperbarui!",
      });
    }

    await query(
      `INSERT INTO lab_submissions 
       (id, task_id, student_name, is_reaction_achieved, quiz_score, quiz_answers, ai_feedback, experiment_details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        submissionId,
        taskId,
        cleanStudent,
        Boolean(isReactionAchieved),
        Number(score) || 0,
        ansJson,
        aiAnalysis || "Praktikum selesai dengan baik.",
        expJson,
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

// GET: Guru / Siswa mengambil rekap nilai dan detail praktikum
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");
    const studentName = searchParams.get("studentName");

    let sql = "SELECT * FROM lab_submissions";
    const conditions: string[] = [];
    const params: any[] = [];

    if (taskId) {
      conditions.push("task_id = ?");
      params.push(taskId);
    }
    if (studentName) {
      conditions.push("UPPER(TRIM(student_name)) = ?");
      params.push(studentName.trim().toUpperCase());
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }
    sql += " ORDER BY completed_at DESC";

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
        experimentDetails: typeof r.experiment_details === "string" ? JSON.parse(r.experiment_details) : r.experiment_details || null,
        completedAt: r.completed_at,
      })),
    });
  } catch (err: any) {
    console.error("GET lab_submissions error:", err);
    return NextResponse.json({ error: err.message || "Gagal mengambil data nilai" }, { status: 500 });
  }
}
