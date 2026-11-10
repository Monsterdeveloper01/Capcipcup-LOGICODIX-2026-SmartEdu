import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// POST: Siswa bergabung ke kelas menggunakan Kode Kelas (PIN)
export async function POST(req: Request) {
  try {
    const { classCode, userId, studentName, studentUsername } = await req.json();

    if (!classCode || !classCode.trim()) {
      return NextResponse.json({ error: "Kode kelas wajib diisi." }, { status: 400 });
    }

    const code = classCode.toUpperCase().trim();

    // Check if classroom exists
    const classrooms = await query<any[]>("SELECT * FROM classrooms WHERE class_code = ? LIMIT 1", [code]);
    if (!classrooms || classrooms.length === 0) {
      return NextResponse.json(
        { error: `Kelas dengan Kode [${code}] tidak ditemukan. Mohon pastikan kode yang diberikan oleh guru Anda benar.` },
        { status: 404 }
      );
    }

    const classroom = classrooms[0];
    const username = (studentUsername || "siswa").trim();
    const name = (studentName || "Ahmad Faiz").trim();
    const uid = (userId || "usr_student_01").trim();

    // Check if student already joined
    const existingMember = await query<any[]>(
      "SELECT id FROM classroom_members WHERE classroom_id = ? AND student_username = ? LIMIT 1",
      [classroom.id, username]
    );

    if (!existingMember || existingMember.length === 0) {
      const memberId = `cm_${Date.now()}`;
      await query(
        `INSERT INTO classroom_members (id, classroom_id, user_id, student_name, student_username, joined_at, status)
         VALUES (?, ?, ?, ?, ?, NOW(), 'ACTIVE')`,
        [memberId, classroom.id, uid, name, username]
      );
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil bergabung ke kelas ${classroom.name}!`,
      classroom: {
        id: classroom.id,
        classCode: classroom.class_code,
        name: classroom.name,
        gradeLevel: classroom.grade_level,
        teacherName: classroom.teacher_name,
        description: classroom.description,
      },
    });
  } catch (err: any) {
    console.error("POST join classroom error:", err);
    return NextResponse.json({ error: err.message || "Gagal bergabung ke kelas." }, { status: 500 });
  }
}

