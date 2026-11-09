import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET: Ambil daftar tugas di suatu room kelas
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const roomCode = searchParams.get("roomCode");

    let sql = "SELECT * FROM lab_tasks ORDER BY created_at DESC";
    const params: any[] = [];

    if (roomCode) {
      sql = "SELECT * FROM lab_tasks WHERE room_code = ? ORDER BY created_at DESC";
      params.push(roomCode);
    }

    const tasks = await query<any[]>(sql, params);

    return NextResponse.json({
      success: true,
      tasks: (tasks || []).map((t) => ({
        id: t.id,
        classroomId: t.classroom_id,
        roomCode: t.room_code,
        teacherName: t.teacher_name,
        title: t.title,
        gradeLevel: t.grade_level,
        instructions: t.instructions,
        chemicalIds: typeof t.chemical_ids === "string" ? JSON.parse(t.chemical_ids) : t.chemical_ids || [],
        expectedReactionId: t.expected_reaction_id,
        questions: typeof t.quiz_questions === "string" ? JSON.parse(t.quiz_questions) : t.quiz_questions || [],
        createdAt: t.created_at,
      })),
    });
  } catch (err: any) {
    console.error("GET lab_tasks error:", err);
    return NextResponse.json({ error: err.message || "Gagal memuat daftar tugas lab" }, { status: 500 });
  }
}

// POST: Guru membuat tugas praktik baru
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      classroomId,
      roomCode,
      teacherName,
      title,
      gradeLevel,
      instructions,
      chemicalIds,
      expectedReactionId,
      questions,
    } = body;

    if (!title || !chemicalIds || chemicalIds.length === 0) {
      return NextResponse.json({ error: "Judul dan minimal 1 zat kimia wajib dipilih." }, { status: 400 });
    }

    const taskId = `task_${Date.now()}`;
    const code = (roomCode || "LAB889").trim().toUpperCase();

    await query(
      `INSERT INTO lab_tasks 
       (id, classroom_id, room_code, teacher_name, title, grade_level, instructions, chemical_ids, expected_reaction_id, quiz_questions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskId,
        classroomId || "cls_demo_1",
        code,
        teacherName || "Budi Santoso, S.Pd",
        title.trim(),
        gradeLevel || "SMP",
        instructions || "Lakukan pencampuran zat sesuai panduan praktikum.",
        JSON.stringify(chemicalIds),
        expectedReactionId || null,
        JSON.stringify(questions || []),
      ]
    );

    return NextResponse.json({
      success: true,
      taskId,
      message: "Tugas praktik sains berhasil diterbitkan!",
    });
  } catch (err: any) {
    console.error("POST lab_tasks error:", err);
    return NextResponse.json({ error: err.message || "Gagal menyimpan tugas praktikum" }, { status: 500 });
  }
}
