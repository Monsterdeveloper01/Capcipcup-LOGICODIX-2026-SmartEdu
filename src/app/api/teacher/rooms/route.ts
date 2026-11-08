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
