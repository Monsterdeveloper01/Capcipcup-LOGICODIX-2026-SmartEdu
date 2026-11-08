import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    // Ambil semua room kelas dari tabel quests
    const rooms = await query<any[]>(
      `SELECT q.id, q.room_code as roomCode, q.creator_name as creatorName, q.title, 
              q.difficulty_level as difficultyLevel, q.case_study_story as caseStudyStory,
              q.npc_name as npcName, q.npc_persona as npcPersona, q.required_object_hint as requiredObjectHint,
              q.mission_objectives as missionObjectives, q.target_vocabularies as targetVocabularies,
              q.quiz_questions as quizQuestions, q.created_at as createdAt,
              (SELECT COUNT(*) FROM submissions s WHERE s.quest_id = q.id) as submissionsCount,
              (SELECT COUNT(*) FROM speaking_sessions sp WHERE sp.class_code = q.room_code) as speakingCount
       FROM quests q
       WHERE q.room_code IS NOT NULL
       ORDER BY q.created_at DESC`
    );

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
      creatorName = "Budi Santoso, S.Pd",
      caseStudyStory,
      npcName = "Mr. Arthur",
      npcPersona = "Examiner & Evaluator",
      requiredObjectHint = "Benda fisik di meja",
      missionObjectives = [],
      targetVocabularies = [],
      quizQuestions = [],
      difficultyLevel = "B1",
      customPin,
    } = body;

    if (!title || !caseStudyStory) {
      return NextResponse.json(
        { error: "Judul misi dan skenario studi kasus wajib diisi." },
        { status: 400 }
      );
    }

    // Generate unique 6-digit PIN if not provided
    const roomCode = customPin?.trim().toUpperCase() || `EDU${Math.floor(100 + Math.random() * 900)}`;
    const newId = `quest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    await query(
      `INSERT INTO quests (
        id, mode, room_code, creator_name, title, target_language, difficulty_level,
        case_study_story, npc_name, npc_persona, required_object_hint,
        mission_objectives, target_vocabularies, quiz_questions
      ) VALUES (?, 'ROOM', ?, ?, ?, 'English', ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId,
        roomCode,
        creatorName,
        title,
        difficultyLevel,
        caseStudyStory,
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
      message: `Room kelas berhasil dibuat dengan PIN ${roomCode}`,
      room: {
        id: newId,
        roomCode,
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

    if (!id || !title || !caseStudyStory) {
      return NextResponse.json(
        { error: "ID, Judul misi, dan skenario studi kasus wajib diisi." },
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
        roomCode?.trim().toUpperCase(),
        difficultyLevel,
        caseStudyStory,
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
