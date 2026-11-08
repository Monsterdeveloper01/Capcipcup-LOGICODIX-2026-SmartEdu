import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const classCode = searchParams.get("classCode");
    const classroomId = searchParams.get("classroomId");

    let sql = `
      SELECT q.id, q.classroom_id as classroomId, q.room_code as roomCode, q.creator_name as creatorName, q.title, 
             q.task_type as taskType,
             q.difficulty_level as difficultyLevel, q.case_study_story as caseStudyStory,
             q.npc_name as npcName, q.npc_persona as npcPersona, q.required_object_hint as requiredObjectHint,
             q.mission_objectives as missionObjectives, q.target_vocabularies as targetVocabularies,
             q.quiz_questions as quizQuestions, q.created_at as createdAt,
             (SELECT COUNT(*) FROM submissions s WHERE s.quest_id = q.id) as submissionsCount,
             (SELECT COUNT(*) FROM speaking_sessions sp WHERE sp.class_code = q.room_code) as speakingCount
      FROM quests q
      WHERE q.room_code IS NOT NULL
    `;
    const params: any[] = [];

    if (classroomId && classCode) {
      sql += ` AND (q.classroom_id = ? OR q.room_code = ?)`;
      params.push(classroomId, classCode);
    } else if (classroomId) {
      sql += ` AND q.classroom_id = ?`;
      params.push(classroomId);
    } else if (classCode) {
      sql += ` AND q.room_code = ?`;
      params.push(classCode);
    }

    sql += ` ORDER BY q.created_at DESC`;

    const rooms = await query<any[]>(sql, params);

    return NextResponse.json({
      success: true,
      rooms: rooms || [],
    });
  } catch (err: any) {
    console.error("Fetch teacher rooms error:", err);
    return NextResponse.json({ error: "Gagal mengambil daftar room kelas.", details: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      title,
      taskType = "HYBRID",
      creatorName = "Budi Santoso, S.Pd",
      classroomId = "cls_demo_edu889",
      customPin,
      caseStudyStory,
      npcName = "Mr. Arthur",
      npcPersona = "Examiner & Evaluator",
      requiredObjectHint = "Benda fisik di meja",
      missionObjectives = [],
      targetVocabularies = [],
      quizQuestions = [],
      difficultyLevel = "B1",
    } = body;

    const finalCaseStory = caseStudyStory?.trim() || (taskType === "QUIZ_ONLY" ? "Pengerjaan Butir Soal Kuis & Listening Comprehension." : "");

    if (!title || (!finalCaseStory && taskType !== "QUIZ_ONLY")) {
      return NextResponse.json(
        { error: "Judul misi dan skenario studi kasus wajib diisi." },
        { status: 400 }
      );
    }

    // Ambil PIN dari classroom jika ada, atau gunakan customPin
    let finalRoomCode = customPin?.trim().toUpperCase();
    if (!finalRoomCode && classroomId) {
      const cls = await query<any[]>("SELECT class_code FROM classrooms WHERE id = ? LIMIT 1", [classroomId]);
      if (cls && cls.length > 0) {
        finalRoomCode = cls[0].class_code;
      }
    }
    if (!finalRoomCode) {
      finalRoomCode = `EDU${Math.floor(100 + Math.random() * 900)}`;
    }

    const newId = `quest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await query(
      `INSERT INTO quests (
        id, mode, classroom_id, task_type, room_code, creator_name, title, target_language, difficulty_level,
        case_study_story, npc_name, npc_persona, required_object_hint,
        mission_objectives, target_vocabularies, quiz_questions
      ) VALUES (?, 'ROOM', ?, ?, ?, ?, ?, 'English', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        classroomId,
        taskType,
        finalRoomCode,
        creatorName,
        title,
        difficultyLevel,
        finalCaseStory || "Tugas kuis dan latihan bahasa Inggris.",
        npcName,
        npcPersona,
        requiredObjectHint,
        JSON.stringify(missionObjectives),
        JSON.stringify(targetVocabularies),
        JSON.stringify(quizQuestions),
      ]
    );

    return NextResponse.json({
      success: true,
      message: `Tugas kelas [${title}] berhasil ditambahkan ke kelas dengan PIN ${finalRoomCode}`,
      room: {
        id: newId,
        classroomId,
        roomCode: finalRoomCode,
        title,
        creatorName,
        difficultyLevel,
        quizQuestionsCount: quizQuestions.length,
      },
    });
  } catch (err: any) {
    console.error("Create room error:", err);
    return NextResponse.json(
      { error: "Gagal membuat room kelas.", details: err.message },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      title,
      taskType,
      roomCode,
      caseStudyStory,
      npcName = "Mr. Arthur",
      npcPersona = "Examiner & Evaluator",
      requiredObjectHint = "Benda fisik di meja",
      missionObjectives = [],
      targetVocabularies = [],
      quizQuestions = [],
      difficultyLevel = "B1",
    } = body;

    const finalCaseStory = caseStudyStory?.trim() || (taskType === "QUIZ_ONLY" ? "Pengerjaan Butir Soal Kuis & Listening Comprehension." : "");

    if (!id || !title || (!finalCaseStory && taskType !== "QUIZ_ONLY")) {
      return NextResponse.json(
        { error: "ID dan Judul misi wajib diisi." },
        { status: 400 }
      );
    }

    const vocabList = Array.isArray(targetVocabularies)
      ? targetVocabularies
      : typeof targetVocabularies === "string"
      ? targetVocabularies.split(",").map((v: string) => v.trim()).filter(Boolean)
      : [];

    await query(
      `UPDATE quests SET 
        title = ?,
        task_type = COALESCE(?, task_type),
        room_code = ?,
        difficulty_level = ?,
        case_study_story = ?,
        npc_name = ?,
        npc_persona = ?,
        required_object_hint = ?,
        mission_objectives = ?,
        target_vocabularies = ?,
        quiz_questions = ?
      WHERE id = ?`,
      [
        title,
        taskType || null,
        roomCode?.trim().toUpperCase(),
        difficultyLevel,
        finalCaseStory || "Tugas kuis dan latihan bahasa Inggris.",
        npcName,
        npcPersona,
        requiredObjectHint,
        JSON.stringify(missionObjectives),
        JSON.stringify(vocabList),
        JSON.stringify(quizQuestions),
        id,
      ]
    );

    return NextResponse.json({
      success: true,
      message: `Room kelas [${roomCode}] berhasil diperbarui.`,
    });
  } catch (err: any) {
    console.error("Update room error:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui room kelas.", details: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let id = searchParams.get("id");

    if (!id) {
      try {
        const body = await req.json();
        id = body?.id;
      } catch {}
    }

    if (!id) {
      return NextResponse.json({ error: "ID room kelas wajib disertakan." }, { status: 400 });
    }

    // Ambil info room sebelum dihapus untuk bersihkan speaking_sessions jika ada
    const existing = await query<any[]>(`SELECT id, room_code FROM quests WHERE id = ? LIMIT 1`, [id]);
    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: "Room kelas tidak ditemukan." }, { status: 404 });
    }

    const roomCode = existing[0].room_code;

    // Bersihkan sesi yang terkait dengan room/PIN ini jika ada
    if (roomCode) {
      await query(`DELETE FROM speaking_sessions WHERE quest_id = ? OR class_code = ?`, [id, roomCode]);
    } else {
      await query(`DELETE FROM speaking_sessions WHERE quest_id = ?`, [id]);
    }

    // Hapus dari quests (submissions akan terhapus otomatis via ON DELETE CASCADE)
    await query(`DELETE FROM quests WHERE id = ?`, [id]);

    return NextResponse.json({
      success: true,
      message: `Room kelas [PIN: ${roomCode || id}] berhasil dihapus beserta data sesinya.`,
    });
  } catch (err: any) {
    console.error("Delete room error:", err);
    return NextResponse.json(
      { error: "Gagal menghapus room kelas.", details: err.message },
      { status: 500 }
    );
  }
}
