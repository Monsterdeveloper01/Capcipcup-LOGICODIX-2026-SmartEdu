import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireTeacher, getServerSessionUser } from "@/lib/auth/session";

// GET: Ambil daftar tugas di suatu room kelas (terisolasi per kelas & guru)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("taskId");
    const rawRoomCode = searchParams.get("roomCode") || searchParams.get("classCode");
    const classroomId = searchParams.get("classroomId");
    const teacherId = searchParams.get("teacherId");
    const teacherName = searchParams.get("teacherName");
    const studentUsername = searchParams.get("studentUsername");
    const studentId = searchParams.get("studentId");

    const sessionUser = await getServerSessionUser();

    let sql = "SELECT * FROM lab_tasks";
    const conditions: string[] = [];
    const params: any[] = [];

    if (taskId) {
      conditions.push("id = ?");
      params.push(taskId);
    } else if (classroomId && rawRoomCode) {
      const code = rawRoomCode.trim().toUpperCase();
      conditions.push("(classroom_id = ? OR UPPER(TRIM(room_code)) = ?)");
      params.push(classroomId, code);
    } else if (classroomId) {
      conditions.push("classroom_id = ?");
      params.push(classroomId);
    } else if (rawRoomCode) {
      const code = rawRoomCode.trim().toUpperCase();
      conditions.push(`(
        UPPER(TRIM(room_code)) = ? 
        OR classroom_id IN (SELECT id FROM classrooms WHERE UPPER(TRIM(class_code)) = ?)
      )`);
      params.push(code, code);
    } else if (studentUsername || studentId) {
      if (studentUsername && studentId) {
        conditions.push(`classroom_id IN (
          SELECT classroom_id FROM classroom_members WHERE student_username = ? OR user_id = ?
        )`);
        params.push(studentUsername.trim(), studentId.trim());
      } else if (studentUsername) {
        conditions.push(`classroom_id IN (
          SELECT classroom_id FROM classroom_members WHERE student_username = ?
        )`);
        params.push(studentUsername.trim());
      } else {
        conditions.push(`classroom_id IN (
          SELECT classroom_id FROM classroom_members WHERE user_id = ?
        )`);
        params.push(studentId!.trim());
      }
    } else if (teacherId || teacherName) {
      conditions.push(`(
        teacher_name = ? 
        OR classroom_id IN (SELECT id FROM classrooms WHERE teacher_id = ? OR teacher_name = ?)
      )`);
      params.push(teacherName || "", teacherId || "", teacherName || "");
    } else if (sessionUser) {
      if (sessionUser.role === "teacher") {
        conditions.push(`(
          teacher_name = ? 
          OR classroom_id IN (SELECT id FROM classrooms WHERE teacher_id = ? OR teacher_name = ?)
        )`);
        params.push(sessionUser.name, sessionUser.id, sessionUser.name);
      } else if (sessionUser.role === "student") {
        conditions.push(`classroom_id IN (
          SELECT classroom_id FROM classroom_members WHERE student_username = ? OR user_id = ?
        )`);
        params.push(sessionUser.username, sessionUser.id);
      }
    }

    if (conditions.length > 0) {
      sql += " WHERE " + conditions.join(" AND ");
    } else if (!sessionUser || (sessionUser.role !== "admin" && sessionUser.role !== "superadmin")) {
      return NextResponse.json({ success: true, tasks: [] });
    }

    sql += " ORDER BY created_at DESC";

    const tasks = await query<any[]>(sql, params);

    return NextResponse.json({
      success: true,
      tasks: (tasks || []).map((t) => ({
        id: t.id,
        classroomId: t.classroom_id,
        roomCode: t.room_code,
        teacherName: t.teacher_name,
        title: t.title,
        level: t.grade_level || "SMP",
        gradeLevel: t.grade_level || "SMP",
        instructions: t.instructions,
        chemicalIds: typeof t.chemical_ids === "string" ? JSON.parse(t.chemical_ids) : t.chemical_ids || [],
        expectedReactionId: t.expected_reaction_id,
        questions: typeof t.quiz_questions === "string" ? JSON.parse(t.quiz_questions) : t.quiz_questions || [],
        kkmScore: t.kkm_score !== null && t.kkm_score !== undefined ? Number(t.kkm_score) : 75,
        allowRetakeBelowKkm: t.allow_retake_below_kkm !== null && t.allow_retake_below_kkm !== undefined ? Boolean(Number(t.allow_retake_below_kkm)) : true,
        showQuizReviewDetails: t.show_quiz_review_details !== null && t.show_quiz_review_details !== undefined ? Boolean(Number(t.show_quiz_review_details)) : true,
        createdAt: t.created_at,
      })),
    });
  } catch (err: any) {
    console.error("GET lab_tasks error:", err);
    return NextResponse.json({ error: err.message || "Gagal memuat daftar tugas lab" }, { status: 500 });
  }
}

// POST: Khusus Guru membuat tugas praktik baru
export async function POST(req: Request) {
  try {
    const auth = await requireTeacher();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

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
      kkmScore,
      allowRetakeBelowKkm,
      showQuizReviewDetails,
    } = body;

    if (!title || !chemicalIds || chemicalIds.length === 0) {
      return NextResponse.json({ error: "Judul dan minimal 1 zat kimia wajib dipilih." }, { status: 400 });
    }

    const taskId = `task_${Date.now()}`;
    const code = (roomCode || "LAB889").trim().toUpperCase();
    const effectiveTeacher = auth.user.name || teacherName || "Guru Pengampu";
    const effectiveKkm = Number.isInteger(Number(kkmScore)) ? Math.min(100, Math.max(0, Number(kkmScore))) : 75;
    const effectiveAllowRetake = allowRetakeBelowKkm !== false ? 1 : 0;
    const effectiveShowReview = showQuizReviewDetails !== false ? 1 : 0;

    // Ensure classroom exists for this roomCode or fallback gracefully
    let effectiveClassroomId = classroomId;
    if (!effectiveClassroomId) {
      const cls = await query<any[]>("SELECT id FROM classrooms WHERE class_code = ? LIMIT 1", [code]);
      if (cls && cls.length > 0) {
        effectiveClassroomId = cls[0].id;
      } else {
        effectiveClassroomId = `cls_${code.toLowerCase()}_${Date.now()}`;
        try {
          await query(
            `INSERT INTO classrooms (id, class_code, name, grade_level, teacher_name, description)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [
              effectiveClassroomId,
              code,
              `Kelas Praktikum ${code}`,
              gradeLevel === "SMA" ? "SMA Kelas 11" : gradeLevel === "SMP" ? "SMP Kelas 8" : "SD Kelas 5",
              effectiveTeacher,
              `Ruang Praktikum Virtual Sains dengan PIN ${code}`,
            ]
          );
        } catch {
          effectiveClassroomId = "cls_demo_1";
        }
      }
    }

    await query(
      `INSERT INTO lab_tasks 
       (id, classroom_id, room_code, teacher_name, title, grade_level, instructions, chemical_ids, expected_reaction_id, quiz_questions, kkm_score, allow_retake_below_kkm, show_quiz_review_details)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskId,
        effectiveClassroomId || "cls_demo_1",
        code,
        effectiveTeacher,
        title.trim(),
        gradeLevel || "SMP",
        instructions || "Lakukan pencampuran zat sesuai panduan praktikum.",
        JSON.stringify(chemicalIds),
        expectedReactionId || null,
        JSON.stringify(questions || []),
        effectiveKkm,
        effectiveAllowRetake,
        effectiveShowReview,
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

// PUT: Guru memperbarui / mengedit tugas praktikum yang sudah ada
export async function PUT(req: Request) {
  try {
    const auth = await requireTeacher();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const {
      id,
      title,
      gradeLevel,
      instructions,
      chemicalIds,
      expectedReactionId,
      questions,
      kkmScore,
      allowRetakeBelowKkm,
      showQuizReviewDetails,
    } = body;

    if (!id || !title || !chemicalIds || chemicalIds.length === 0) {
      return NextResponse.json(
        { error: "ID tugas, judul tugas, dan minimal 1 reagen kimia wajib diisi." },
        { status: 400 }
      );
    }

    const effectiveKkm = Number.isInteger(Number(kkmScore)) ? Math.min(100, Math.max(0, Number(kkmScore))) : 75;
    const effectiveAllowRetake = allowRetakeBelowKkm !== false ? 1 : 0;
    const effectiveShowReview = showQuizReviewDetails !== false ? 1 : 0;

    await query(
      `UPDATE lab_tasks 
       SET title = ?, 
           grade_level = ?, 
           instructions = ?, 
           chemical_ids = ?, 
           expected_reaction_id = ?, 
           quiz_questions = ?, 
           kkm_score = ?, 
           allow_retake_below_kkm = ?,
           show_quiz_review_details = ?
       WHERE id = ?`,
      [
        title.trim(),
        gradeLevel || "SMP",
        instructions || "Lakukan pencampuran zat sesuai panduan praktikum.",
        JSON.stringify(chemicalIds),
        expectedReactionId || null,
        JSON.stringify(questions || []),
        effectiveKkm,
        effectiveAllowRetake,
        effectiveShowReview,
        id,
      ]
    );

    return NextResponse.json({
      success: true,
      taskId: id,
      message: "Perubahan tugas praktikum berhasil disimpan!",
    });
  } catch (err: any) {
    console.error("PUT lab_tasks error:", err);
    return NextResponse.json({ error: err.message || "Gagal memperbarui tugas praktikum" }, { status: 500 });
  }
}

// DELETE: Khusus Guru menghapus tugas praktikum
export async function DELETE(req: Request) {
  try {
    const auth = await requireTeacher();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const taskId = searchParams.get("id");

    if (!taskId) {
      return NextResponse.json({ error: "ID tugas wajib disertakan." }, { status: 400 });
    }

    // Pastikan guru hanya dapat menghapus tugas miliknya / kelasnya sendiri
    if (auth.user.role === "teacher") {
      const existing = await query<any[]>(
        `SELECT lt.id FROM lab_tasks lt
         LEFT JOIN classrooms c ON c.id = lt.classroom_id
         WHERE lt.id = ? AND (lt.teacher_name = ? OR c.teacher_id = ? OR c.teacher_name = ?)
         LIMIT 1`,
        [taskId, auth.user.name, auth.user.id, auth.user.name]
      );
      if (!existing || existing.length === 0) {
        return NextResponse.json(
          { error: "Anda tidak memiliki hak akses untuk menghapus tugas praktikum ini." },
          { status: 403 }
        );
      }
    }

    // Cascade delete submissions untuk tugas ini
    await query("DELETE FROM lab_submissions WHERE task_id = ?", [taskId]);
    await query("DELETE FROM lab_tasks WHERE id = ?", [taskId]);

    return NextResponse.json({
      success: true,
      message: "Tugas praktikum beserta seluruh rekap pengumpulannya berhasil dihapus.",
    });
  } catch (err: any) {
    console.error("DELETE lab_tasks error:", err);
    return NextResponse.json({ error: err.message || "Gagal menghapus tugas praktikum" }, { status: 500 });
  }
}
