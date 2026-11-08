import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/student/classroom?pin=EDU889&userId=usr_student_01
// Mengambil detail kelas yang diikuti siswa beserta seluruh tugas yang aktif di kelas tersebut
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get("pin");
    const userId = searchParams.get("userId");

    if (!pin && !userId) {
      return NextResponse.json({ error: "PIN Kelas atau User ID wajib disertakan." }, { status: 400 });
    }

    let classroom: any = null;

    if (pin) {
      const cls = await query<any[]>("SELECT * FROM classrooms WHERE class_code = ? LIMIT 1", [pin.trim().toUpperCase()]);
      if (cls && cls.length > 0) classroom = cls[0];
    } else if (userId) {
      const member = await query<any[]>(
        `SELECT c.* FROM classroom_members cm 
         JOIN classrooms c ON cm.classroom_id = c.id 
         WHERE cm.user_id = ? 
         ORDER BY cm.joined_at DESC LIMIT 1`,
        [userId]
      );
      if (member && member.length > 0) classroom = member[0];
    }

    if (!classroom) {
      return NextResponse.json({ success: false, error: "Kelas tidak ditemukan atau siswa belum terdaftar." }, { status: 404 });
    }

    // Ambil daftar tugas di kelas ini
    const tasks = await query<any[]>(
      `SELECT q.id, q.task_type as taskType, q.room_code as roomCode, q.creator_name as creatorName, q.title,
              q.difficulty_level as difficultyLevel, q.case_study_story as caseStudyStory,
              q.npc_name as npcName, q.npc_persona as npcPersona, q.required_object_hint as requiredObjectHint,
              q.mission_objectives as missionObjectives, q.target_vocabularies as targetVocabularies,
              q.quiz_questions as quizQuestions, q.created_at as createdAt,
              (SELECT COUNT(*) FROM submissions s WHERE s.quest_id = q.id) as totalSubmissions
       FROM quests q
       WHERE q.classroom_id = ? OR q.room_code = ?
       ORDER BY q.created_at DESC`,
      [classroom.id, classroom.class_code]
    );

    // Ambil status pengerjaan spesifik untuk user ini jika userId disertakan
    let userSubmissions: any[] = [];
    if (userId) {
      const userRows = await query<any[]>("SELECT name, username FROM users WHERE id = ? LIMIT 1", [userId]);
      const studentName = userRows?.[0]?.name;
      if (studentName) {
        userSubmissions = await query<any[]>(
          `SELECT s.quest_id as questId, s.status, s.total_score as totalScore, s.speaking_score as speakingScore,
                  s.quiz_score as quizScore, s.cefr_level as cefrLevel, s.completed_at as completedAt
           FROM submissions s
           WHERE s.student_name = ?`,
          [studentName]
        );
      }
    }

    const tasksWithStatus = (tasks || []).map((t) => {
      const sub = userSubmissions.find((s) => s.questId === t.id);
      return {
        ...t,
        isCompleted: sub ? sub.status === "COMPLETED" : false,
        studentScore: sub ? sub.totalScore : null,
        studentCefr: sub ? sub.cefrLevel : null,
        completedAt: sub ? sub.completedAt : null,
      };
    });

    return NextResponse.json({
      success: true,
      classroom: {
        id: classroom.id,
        classCode: classroom.class_code,
        name: classroom.name,
        teacherName: classroom.teacher_name,
        gradeLevel: classroom.grade_level,
        description: classroom.description,
      },
      tasks: tasksWithStatus,
    });
  } catch (err: any) {
    console.error("Student classroom fetch error:", err);
    return NextResponse.json(
      { error: "Gagal mengambil data kelas.", details: err.message },
      { status: 500 }
    );
  }
}

// POST /api/student/classroom
// Siswa memasukkan PIN untuk bergabung ke kelas
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { pin, userId, studentName, studentUsername } = body;

    if (!pin || !pin.trim()) {
      return NextResponse.json({ error: "PIN Kelas wajib diisi." }, { status: 400 });
    }

    const cleanPin = pin.trim().toUpperCase();

    // 1. Validasi keberadaan kelas dengan PIN tersebut
    const classRows = await query<any[]>("SELECT * FROM classrooms WHERE class_code = ? LIMIT 1", [cleanPin]);
    if (!classRows || classRows.length === 0) {
      return NextResponse.json(
        { error: `PIN Kelas [${cleanPin}] tidak ditemukan. Pastikan PIN yang kamu masukkan sesuai dengan yang diberikan guru.` },
        { status: 404 }
      );
    }

    const classroom = classRows[0];

    // 2. Daftarkan siswa ke `classroom_members` jika ada userId
    if (userId) {
      const existing = await query<any[]>(
        "SELECT id FROM classroom_members WHERE classroom_id = ? AND user_id = ? LIMIT 1",
        [classroom.id, userId]
      );

      if (!existing || existing.length === 0) {
        const memberId = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await query(
          `INSERT INTO classroom_members (id, classroom_id, user_id, student_name, student_username)
           VALUES (?, ?, ?, ?, ?)`,
          [memberId, classroom.id, userId, studentName || "Siswa", studentUsername || "student"]
        );
      }
    }

    // 3. Ambil daftar tugas di kelas ini
    const tasks = await query<any[]>(
      `SELECT q.id, q.room_code as roomCode, q.creator_name as creatorName, q.title,
              q.difficulty_level as difficultyLevel, q.case_study_story as caseStudyStory,
              q.npc_name as npcName, q.npc_persona as npcPersona, q.required_object_hint as requiredObjectHint,
              q.mission_objectives as missionObjectives, q.target_vocabularies as targetVocabularies,
              q.quiz_questions as quizQuestions, q.created_at as createdAt
       FROM quests q
       WHERE q.classroom_id = ? OR q.room_code = ?
       ORDER BY q.created_at DESC`,
      [classroom.id, classroom.class_code]
    );

    return NextResponse.json({
      success: true,
      message: `Berhasil bergabung ke [${classroom.name}]!`,
      classroom: {
        id: classroom.id,
        classCode: classroom.class_code,
        name: classroom.name,
        teacherName: classroom.teacher_name,
        gradeLevel: classroom.grade_level,
        description: classroom.description,
      },
      tasks: tasks || [],
    });
  } catch (err: any) {
    console.error("Student join classroom error:", err);
    return NextResponse.json(
      { error: "Gagal bergabung ke kelas.", details: err.message },
      { status: 500 }
    );
  }
}

// DELETE /api/student/classroom
// Siswa keluar dari kelas
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classroomId = searchParams.get("classroomId");
    const userId = searchParams.get("userId");

    if (classroomId && userId) {
      await query("DELETE FROM classroom_members WHERE classroom_id = ? AND user_id = ?", [classroomId, userId]);
    }

    return NextResponse.json({
      success: true,
      message: "Berhasil keluar dari kelas.",
    });
  } catch (err: any) {
    console.error("Student leave classroom error:", err);
    return NextResponse.json(
      { error: "Gagal keluar dari kelas.", details: err.message },
      { status: 500 }
    );
  }
}

