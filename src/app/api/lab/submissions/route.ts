import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getServerSessionUser } from "@/lib/auth/session";

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

// GET: Guru / Siswa mengambil rekap nilai terisolasi per kelas, tugas, atau murid
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");
    const classroomId = searchParams.get("classroomId");
    const rawRoomCode = searchParams.get("roomCode") || searchParams.get("classCode");
    const studentName = searchParams.get("studentName");
    const studentUsername = searchParams.get("studentUsername");
    const teacherId = searchParams.get("teacherId");
    const teacherName = searchParams.get("teacherName");

    const sessionUser = await getServerSessionUser();

    let sql = `
      SELECT 
        s.id,
        s.task_id,
        s.student_name,
        s.is_reaction_achieved,
        s.quiz_score,
        s.quiz_answers,
        s.ai_feedback,
        s.experiment_details,
        s.completed_at,
        lt.title as task_title,
        lt.grade_level as task_grade_level,
        lt.classroom_id,
        lt.room_code,
        lt.teacher_name,
        lt.kkm_score,
        c.name as classroom_name,
        c.class_code
      FROM lab_submissions s
      JOIN lab_tasks lt ON lt.id = s.task_id
      LEFT JOIN classrooms c ON (c.id = lt.classroom_id OR UPPER(TRIM(c.class_code)) = UPPER(TRIM(lt.room_code)))
    `;
    const conditions: string[] = [];
    const params: any[] = [];

    if (taskId) {
      conditions.push("s.task_id = ?");
      params.push(taskId);
    }

    if (classroomId && rawRoomCode) {
      const code = rawRoomCode.trim().toUpperCase();
      conditions.push("(lt.classroom_id = ? OR c.id = ? OR UPPER(TRIM(lt.room_code)) = ? OR UPPER(TRIM(c.class_code)) = ?)");
      params.push(classroomId, classroomId, code, code);
    } else if (classroomId) {
      conditions.push("(lt.classroom_id = ? OR c.id = ?)");
      params.push(classroomId, classroomId);
    } else if (rawRoomCode) {
      const code = rawRoomCode.trim().toUpperCase();
      conditions.push("(UPPER(TRIM(lt.room_code)) = ? OR UPPER(TRIM(c.class_code)) = ?)");
      params.push(code, code);
    }

    if (studentName) {
      conditions.push("UPPER(TRIM(s.student_name)) = ?");
      params.push(studentName.trim().toUpperCase());
    }

    if (studentUsername) {
      conditions.push(`(
        s.student_name IN (SELECT student_name FROM classroom_members WHERE student_username = ?)
        OR s.student_name IN (SELECT name FROM users WHERE username = ?)
      )`);
      params.push(studentUsername.trim(), studentUsername.trim());
    }

    if (teacherId && teacherName) {
      conditions.push("(c.teacher_id = ? OR lt.teacher_name = ? OR c.teacher_name = ?)");
      params.push(teacherId.trim(), teacherName.trim(), teacherName.trim());
    } else if (teacherName) {
      conditions.push("(lt.teacher_name = ? OR c.teacher_name = ?)");
      params.push(teacherName.trim(), teacherName.trim());
    } else if (teacherId) {
      conditions.push("c.teacher_id = ?");
      params.push(teacherId.trim());
    } else if (!taskId && !classroomId && !rawRoomCode && !studentName && !studentUsername && sessionUser) {
      if (sessionUser.role === "teacher") {
        conditions.push("(c.teacher_id = ? OR lt.teacher_name = ? OR c.teacher_name = ?)");
        params.push(sessionUser.id, sessionUser.name, sessionUser.name);
      } else if (sessionUser.role === "student") {
        conditions.push("UPPER(TRIM(s.student_name)) = ?");
        params.push(sessionUser.name.trim().toUpperCase());
      }
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    } else if (!sessionUser || (sessionUser.role !== "admin" && sessionUser.role !== "superadmin")) {
      return NextResponse.json({ success: true, submissions: [] });
    }

    sql += " ORDER BY s.completed_at DESC";

    const rows = await query<any[]>(sql, params);

    return NextResponse.json({
      success: true,
      submissions: (rows || []).map((r) => ({
        id: r.id,
        taskId: r.task_id,
        taskTitle: r.task_title || "Praktikum Kimia",
        classroomId: r.classroom_id,
        roomCode: r.room_code || r.class_code,
        teacherName: r.teacher_name,
        kkmScore: r.kkm_score !== null && r.kkm_score !== undefined ? Number(r.kkm_score) : 75,
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
