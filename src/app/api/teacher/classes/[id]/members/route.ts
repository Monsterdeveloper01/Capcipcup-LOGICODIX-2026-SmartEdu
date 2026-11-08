import { NextResponse } from "next/server";
import { query } from "@/lib/db";

interface RouteParams {
  params: Promise<{ id: string }>;
}

// GET /api/teacher/classes/[id]/members
// Mengambil daftar siswa yang tergabung di kelas ini + siswa sekolah yang belum tergabung
export async function GET(req: Request, { params }: RouteParams) {
  try {
    const { id: classroomId } = await params;

    // 1. Ambil detail kelas
    const classRows = await query<any[]>("SELECT * FROM classrooms WHERE id = ? LIMIT 1", [classroomId]);
    if (!classRows || classRows.length === 0) {
      return NextResponse.json({ error: "Kelas tidak ditemukan." }, { status: 404 });
    }
    const classroom = classRows[0];

    // 2. Ambil murid yang sudah bergabung di kelas ini
    const members = await query<any[]>(`
      SELECT cm.id as memberId, cm.user_id as userId, cm.student_name as studentName,
             cm.student_username as studentUsername, cm.joined_at as joinedAt, cm.status,
             u.email, u.xp, u.level, u.streak_days as streakDays,
             (SELECT COUNT(*) FROM submissions s 
              JOIN quests q ON s.quest_id = q.id 
              WHERE (q.classroom_id = cm.classroom_id OR q.room_code = ?) 
              AND s.student_name = cm.student_name) as completedTasksCount
      FROM classroom_members cm
      LEFT JOIN users u ON cm.user_id = u.id
      WHERE cm.classroom_id = ?
      ORDER BY cm.joined_at DESC
    `, [classroom.class_code, classroomId]);

    // 3. Ambil siswa sekolah yang BELUM masuk ke kelas ini (untuk ditambahkan manual)
    const availableStudents = await query<any[]>(`
      SELECT u.id as userId, u.name as studentName, u.username as studentUsername, u.email
      FROM users u
      WHERE u.role = 'student'
      AND u.id NOT IN (
        SELECT cm2.user_id FROM classroom_members cm2 WHERE cm2.classroom_id = ?
      )
      ORDER BY u.name ASC
    `, [classroomId]);

    return NextResponse.json({
      success: true,
      classroom: {
        id: classroom.id,
        classCode: classroom.class_code,
        name: classroom.name,
        teacherName: classroom.teacher_name,
        gradeLevel: classroom.grade_level,
      },
      members: members || [],
      availableStudents: availableStudents || [],
    });
  } catch (err: any) {
    console.error("Fetch classroom members error:", err);
    return NextResponse.json(
      { error: "Gagal mengambil data roster murid.", details: err.message },
      { status: 500 }
    );
  }
}

// POST /api/teacher/classes/[id]/members
// Menambahkan siswa secara manual oleh Guru
export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { id: classroomId } = await params;
    const body = await req.json();
    const { userId, studentName, studentUsername } = body;

    if (!userId) {
      return NextResponse.json({ error: "User ID siswa wajib disertakan." }, { status: 400 });
    }

    // Ambil data user siswa dari database
    const userRows = await query<any[]>("SELECT id, name, username FROM users WHERE id = ? LIMIT 1", [userId]);
    if (!userRows || userRows.length === 0) {
      return NextResponse.json({ error: "Akun siswa tidak ditemukan." }, { status: 404 });
    }

    const s = userRows[0];
    const finalName = studentName || s.name;
    const finalUsername = studentUsername || s.username;

    // Cek apakah sudah terdaftar
    const existing = await query<any[]>(
      "SELECT id FROM classroom_members WHERE classroom_id = ? AND user_id = ? LIMIT 1",
      [classroomId, s.id]
    );

    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: "Siswa ini sudah terdaftar sebagai anggota di kelas ini." },
        { status: 400 }
      );
    }

    const newMemberId = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await query(
      `INSERT INTO classroom_members (id, classroom_id, user_id, student_name, student_username)
       VALUES (?, ?, ?, ?, ?)`,
      [newMemberId, classroomId, s.id, finalName, finalUsername]
    );

    return NextResponse.json({
      success: true,
      message: `Siswa [${finalName}] berhasil ditambahkan ke dalam kelas!`,
      member: {
        memberId: newMemberId,
        userId: s.id,
        studentName: finalName,
        studentUsername: finalUsername,
      },
    });
  } catch (err: any) {
    console.error("Add student to class error:", err);
    return NextResponse.json(
      { error: "Gagal menambahkan siswa ke kelas.", details: err.message },
      { status: 500 }
    );
  }
}

// DELETE /api/teacher/classes/[id]/members
// Kick / Keluarkan murid dari kelas
export async function DELETE(req: Request, { params }: RouteParams) {
  try {
    const { id: classroomId } = await params;
    const { searchParams } = new URL(req.url);
    const memberId = searchParams.get("memberId");
    const userId = searchParams.get("userId");

    if (!memberId && !userId) {
      return NextResponse.json({ error: "memberId atau userId wajib disertakan." }, { status: 400 });
    }

    let targetMember: any = null;
    if (memberId) {
      const rows = await query<any[]>("SELECT * FROM classroom_members WHERE id = ? AND classroom_id = ? LIMIT 1", [memberId, classroomId]);
      if (rows && rows.length > 0) targetMember = rows[0];
    } else if (userId) {
      const rows = await query<any[]>("SELECT * FROM classroom_members WHERE user_id = ? AND classroom_id = ? LIMIT 1", [userId, classroomId]);
      if (rows && rows.length > 0) targetMember = rows[0];
    }

    if (!targetMember) {
      return NextResponse.json({ error: "Data keanggotaan siswa tidak ditemukan di kelas ini." }, { status: 404 });
    }

    await query("DELETE FROM classroom_members WHERE id = ?", [targetMember.id]);

    return NextResponse.json({
      success: true,
      message: `Siswa [${targetMember.student_name}] telah berhasil dikeluarkan (di-kick) dari kelas.`,
    });
  } catch (err: any) {
    console.error("Kick student error:", err);
    return NextResponse.json(
      { error: "Gagal mengeluarkan siswa.", details: err.message },
      { status: 500 }
    );
  }
}

