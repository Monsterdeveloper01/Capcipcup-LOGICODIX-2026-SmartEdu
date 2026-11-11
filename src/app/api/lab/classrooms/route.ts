import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireTeacher, getServerSessionUser } from "@/lib/auth/session";

// GET: Ambil daftar ruang kelas terisolasi per guru / siswa
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    const teacherId = searchParams.get("teacherId");
    const teacherName = searchParams.get("teacherName");
    const studentUsername = searchParams.get("studentUsername");
    const studentId = searchParams.get("studentId");

    const sessionUser = await getServerSessionUser();

    let sql = `
      SELECT 
        c.*,
        (SELECT COUNT(*) FROM classroom_members cm WHERE cm.classroom_id = c.id) as student_count,
        (SELECT COUNT(*) FROM lab_tasks lt WHERE lt.classroom_id = c.id OR lt.room_code = c.class_code) as task_count
      FROM classrooms c
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (code) {
      conditions.push("c.class_code = ?");
      params.push(code.toUpperCase().trim());
    } else if (studentUsername || studentId) {
      // Siswa mencari kelas yang diikutinya berdasarkan username atau ID
      sql = `
        SELECT 
          c.*,
          (SELECT COUNT(*) FROM classroom_members cm WHERE cm.classroom_id = c.id) as student_count,
          (SELECT COUNT(*) FROM lab_tasks lt WHERE lt.classroom_id = c.id OR lt.room_code = c.class_code) as task_count
        FROM classrooms c
        JOIN classroom_members cm ON cm.classroom_id = c.id
      `;
      if (studentUsername && studentId) {
        conditions.push("(cm.student_username = ? OR cm.user_id = ?)");
        params.push(studentUsername.trim(), studentId.trim());
      } else if (studentUsername) {
        conditions.push("cm.student_username = ?");
        params.push(studentUsername.trim());
      } else {
        conditions.push("cm.user_id = ?");
        params.push(studentId!.trim());
      }
    } else if (teacherId || teacherName) {
      // Filter eksplisit guru pengampu
      if (teacherId && teacherName) {
        conditions.push("(c.teacher_id = ? OR c.teacher_name = ?)");
        params.push(teacherId.trim(), teacherName.trim());
      } else if (teacherId) {
        conditions.push("c.teacher_id = ?");
        params.push(teacherId.trim());
      } else {
        conditions.push("c.teacher_name = ?");
        params.push(teacherName!.trim());
      }
    } else if (sessionUser) {
      // Scoping otomatis berdasarkan sesi pengguna yang sedang login
      if (sessionUser.role === "teacher") {
        conditions.push("(c.teacher_id = ? OR c.teacher_name = ?)");
        params.push(sessionUser.id, sessionUser.name);
      } else if (sessionUser.role === "student") {
        sql = `
          SELECT 
            c.*,
            (SELECT COUNT(*) FROM classroom_members cm WHERE cm.classroom_id = c.id) as student_count,
            (SELECT COUNT(*) FROM lab_tasks lt WHERE lt.classroom_id = c.id OR lt.room_code = c.class_code) as task_count
          FROM classrooms c
          JOIN classroom_members cm ON cm.classroom_id = c.id
        `;
        conditions.push("(cm.student_username = ? OR cm.user_id = ?)");
        params.push(sessionUser.username, sessionUser.id);
      }
      // role admin & superadmin tetap diizinkan melihat semua tanpa filter
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    }
    sql += " ORDER BY c.created_at DESC";

    const rows = await query<any[]>(sql, params);

    return NextResponse.json({
      success: true,
      classrooms: (rows || []).map((r) => ({
        id: r.id,
        classCode: r.class_code,
        name: r.name,
        gradeLevel: r.grade_level,
        academicYear: r.academic_year || "2026/2027",
        teacherId: r.teacher_id,
        teacherName: r.teacher_name,
        description: r.description,
        studentCount: Number(r.student_count || 0),
        taskCount: Number(r.task_count || 0),
        createdAt: r.created_at,
      })),
    });
  } catch (err: any) {
    console.error("GET classrooms error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal memuat daftar kelas." },
      { status: 500 }
    );
  }
}

// POST: Khusus Guru membuat ruang kelas baru
export async function POST(req: Request) {
  try {
    const auth = await requireTeacher();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const { name, gradeLevel, description, classCode, teacherName } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Nama kelas wajib diisi." }, { status: 400 });
    }

    // Generate random 6-character class code if not provided
    const code = (classCode || `KIM${Math.floor(100 + Math.random() * 900)}`).toUpperCase().trim();
    const classroomId = `cls_${Date.now()}`;

    // Check if code already exists
    const existing = await query<any[]>("SELECT id FROM classrooms WHERE class_code = ? LIMIT 1", [code]);
    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: `Kode kelas '${code}' sudah digunakan. Silakan gunakan kode lain.` },
        { status: 400 }
      );
    }

    const effectiveTeacher = auth.user.name || teacherName || "Guru Pengampu";

    await query(
      `INSERT INTO classrooms (id, class_code, name, grade_level, academic_year, teacher_id, teacher_name, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        classroomId,
        code,
        name.trim(),
        gradeLevel || "SMA Kelas 11",
        "2026/2027",
        auth.user.id || "usr_teacher_01",
        effectiveTeacher,
        description || `Ruang Kelas Praktikum Sains Virtual ${name.trim()}`,
      ]
    );

    return NextResponse.json({
      success: true,
      classroom: {
        id: classroomId,
        classCode: code,
        name: name.trim(),
        gradeLevel: gradeLevel || "SMA Kelas 11",
        teacherName: effectiveTeacher,
        description: description || `Ruang Kelas Praktikum Sains Virtual ${name.trim()}`,
        studentCount: 0,
        taskCount: 0,
      },
    });
  } catch (err: any) {
    console.error("POST classroom error:", err);
    return NextResponse.json(
      { error: err.message || "Gagal membuat ruang kelas." },
      { status: 500 }
    );
  }
}

// DELETE: Khusus Guru menghapus ruang kelas
export async function DELETE(req: Request) {
  try {
    const auth = await requireTeacher();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID kelas wajib disertakan." }, { status: 400 });
    }

    // Pastikan guru hanya dapat menghapus kelas miliknya sendiri (kecuali role admin/superadmin)
    if (auth.user.role === "teacher") {
      const cls = await query<any[]>(
        "SELECT id FROM classrooms WHERE id = ? AND (teacher_id = ? OR teacher_name = ?) LIMIT 1",
        [id, auth.user.id, auth.user.name]
      );
      if (!cls || cls.length === 0) {
        return NextResponse.json(
          { error: "Anda tidak memiliki hak akses untuk menghapus ruang kelas ini." },
          { status: 403 }
        );
      }
    }

    // Cascade delete relasi turunan: submissions -> tasks -> members -> classroom
    await query("DELETE FROM lab_submissions WHERE task_id IN (SELECT id FROM lab_tasks WHERE classroom_id = ?)", [id]);
    await query("DELETE FROM lab_tasks WHERE classroom_id = ?", [id]);
    await query("DELETE FROM classroom_members WHERE classroom_id = ?", [id]);
    await query("DELETE FROM classrooms WHERE id = ?", [id]);

    return NextResponse.json({ success: true, message: "Kelas beserta seluruh data tugas dan anggotanya berhasil dihapus." });
  } catch (err: any) {
    console.error("DELETE classroom error:", err);
    return NextResponse.json({ error: err.message || "Gagal menghapus kelas." }, { status: 500 });
  }
}

