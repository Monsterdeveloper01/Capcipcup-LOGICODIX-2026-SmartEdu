import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      questId,
      studentName = "Siswa LinguaQuest",
      roomCode,
      quizAnswers = [],
      quizScore = 100,
      totalQuestions = 3,
      correctCount = 3,
      cefrLevel = "B1",
    } = body;

    if (!questId) {
      return NextResponse.json({ error: "questId wajib disertakan." }, { status: 400 });
    }

    const subId = `sub_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const xpEarned = Math.round((quizScore / 100) * 150) + 50;

    const feedback = {
      summary: `Berhasil menyelesaikan kuis pemahaman (${correctCount}/${totalQuestions} soal benar). Skor: ${quizScore}/100.`,
      score: quizScore,
      correctCount,
      totalQuestions,
      xpEarned,
      completedAt: new Date().toISOString(),
    };

    // 1. Simpan ke submissions
    await query(
      `INSERT INTO submissions (
        id, quest_id, student_name, status, quiz_score, total_score,
        quiz_answers, cefr_level, ai_feedback, completed_at
      ) VALUES (?, ?, ?, 'COMPLETED', ?, ?, ?, ?, ?, NOW())
      ON DUPLICATE KEY UPDATE 
        status = 'COMPLETED',
        quiz_score = VALUES(quiz_score),
        total_score = VALUES(total_score),
        quiz_answers = VALUES(quiz_answers),
        cefr_level = VALUES(cefr_level),
        ai_feedback = VALUES(ai_feedback),
        completed_at = NOW()`,
      [
        subId,
        questId,
        studentName,
        quizScore,
        quizScore,
        JSON.stringify(quizAnswers),
        cefrLevel,
        JSON.stringify(feedback),
      ]
    );

    // 2. Berikan reward XP ke student jika ada user yang cocok
    try {
      await query(
        `UPDATE users SET xp = xp + ?, level = FLOOR((xp + ?) / 500) + 1 
         WHERE name = ? OR username = ?`,
        [xpEarned, xpEarned, studentName, studentName]
      );
    } catch (e) {
      console.warn("Update user xp warning:", e);
    }

    return NextResponse.json({
      success: true,
      submissionId: subId,
      quizScore,
      xpEarned,
      feedback,
    });
  } catch (err: any) {
    console.error("Quiz submission error:", err);
    return NextResponse.json(
      { error: "Gagal menyimpan jawaban kuis.", details: err.message },
      { status: 500 }
    );
  }
}
