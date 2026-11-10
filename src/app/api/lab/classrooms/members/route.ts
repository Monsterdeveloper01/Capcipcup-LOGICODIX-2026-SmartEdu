import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET: Ambil daftar siswa yang terdaftar di suatu kelas
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classroomId = searchParams.get("classroomId");
    const classCode = searchParams.get("classCode");

    let sql = `
      SELECT cm.*, c.class_code, c.name as classroom_name
      FROM classroom_members cm
      JOIN classrooms c ON c.id = cm.classroom_id
    `;
    const params: any[] = [];

    if (classroomId) {
      sql += " WHERE cm.classroom_id = ? ORDER BY cm.joined_at DESC";
      params.push(classroomId);
    } else if (classCode) {
      sql += " WHERE c.class_code = ? ORDER BY cm.joined_at DESC";
      params.push(classCode.toUpperCase().trim());
    } else {
      sql += " ORDER BY cm.joined_at DESC";
    }

    const members = await query<any[]>(sql, params);

    return NextResponse.json({
      success: true,
      members: (members || []).map((m) => ({
        id: m.id,
        classroomId: m.classroom_id,
        classroomName: m.classroom_name,
        classCode: m.class_code,
        userId: m.user_id,
        studentName: m.student_name,
        studentUsername: m.student_username,
        joinedAt: m.joined_at,
        status: m.status,
      })),
    });
  } catch (err: any) {
    console.error("GET classroom members error:", err);
    return NextResponse.json({ error: err.message || "Gagal memuat daftar anggota kelas." }, { status: 500 });
  }
}

