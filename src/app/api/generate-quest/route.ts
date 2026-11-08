import { NextResponse } from "next/server";
import { getAiClient, hasAiKey, generateContentWithFallback } from "@/lib/ai/client";
import { query } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      mode = "ROOM", // 'ROOM' or 'SOLO'
      roomCode,
      creatorName = "Guru Pengajar",
      topic = "Eco-Friendly Product Presentation",
      detected_labels = ["bottle", "book"],
      targetLanguage = "English",
      difficultyLevel = "B1",
    } = body;

    let finalRoomCode = null;
    if (mode === "ROOM") {
      finalRoomCode = roomCode || Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    const questId = `quest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // If Gemini API is available, generate dynamic content using text-only prompt (Saving ~75% tokens!)
    let generatedQuestData: any = null;

    if (hasAiKey()) {
      const aiClient = getAiClient();
      if (aiClient) {
        const prompt = `You are an elite educational game designer for LinguaQuest, a real-world case-study RPG for Indonesian students learning ${targetLanguage}.
Create an engaging emergency case-study roleplay mission and a 2-question pre-quiz based on:
- Mode: ${mode}
- Educational Topic: ${topic}
- Physical Objects in Room/Desk: ${detected_labels.join(", ")}
- Target Difficulty: ${difficultyLevel} CEFR

Return STRICTLY a JSON object matching this schema:
{
  "title": "Short punchy mission title in Indonesian/English",
  "case_study_story": "2-3 sentences placing the student in an authentic real-world emergency or business scenario requiring these objects",
  "npc_name": "Name and role of NPC (e.g., Ms. Clara, Green Investor)",
  "npc_persona": "Personality traits, critical thinking style",
  "required_object_hint": "Clear hint about which physical objects to hold and scan",
  "mission_objectives": [
    "Objective 1: Explain product benefit using 2 English adjectives",
    "Objective 2: Answer NPC inquiry about affordability for Indonesian students",
    "Objective 3: Propose a polite collaboration call-to-action"
  ],
  "target_vocabularies": ["word1", "word2", "word3", "word4", "word5"],
  "quiz_questions": [
    {
      "question": "Clear multiple-choice conceptual question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 1,
      "explanation": "Why this answer is correct"
    },
    {
      "question": "Second multiple-choice professional speaking question",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct"
    }
  ]
}`;

        try {
          const ai = getAiClient();
          const response = await generateContentWithFallback(ai, {
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            },
          });

          const rawText = response.text || "{}";
          generatedQuestData = JSON.parse(rawText);
        } catch (err) {
          console.warn("Gemini generation fallback:", err);
        }
      }
    }

    // High quality deterministic fallback
    if (!generatedQuestData) {
      generatedQuestData = {
        title: `Misi Kasus: ${topic}`,
        case_study_story: `Kamu sedang mempresentasikan solusi inovatif menggunakan objek di sekitarmu (${detected_labels.join(", ")}) kepada perwakilan mitra global.`,
        npc_name: "Ms. Clara (International Partner)",
        npc_persona: "Profesional, antusias terhadap inovasi ramah lingkungan, apresiatif terhadap ide baru.",
        required_object_hint: `Gunakan benda ${detected_labels[0] || "botol"} di mejamu sebagai prototipe nyata saat berbicara!`,
        mission_objectives: [
          `Gunakan minimal 2 kosakata wajib (${detected_labels[0] || "durable"}) saat menjelaskan manfaat objek`,
          "Jawab pertanyaan NPC tentang solusi praktis di kehidupan sehari-hari",
          "Tutup dengan ungkapan penutup yang sopan dan profesional",
        ],
        target_vocabularies: ["durable", "sustainable", "innovative", "solution", "effective"],
        quiz_questions: [
          {
            question: "Manakah kata sifat yang paling tepat untuk mendeskripsikan produk yang kuat dan tidak mudah rusak?",
            options: ["Fragile", "Durable", "Temporary", "Hazardous"],
            correctIndex: 1,
            explanation: "'Durable' berarti tahan lama dan kokoh.",
          },
          {
            question: "Ungkapan pembuka yang paling santun dan profesional untuk memulai presentasi adalah...",
            options: [
              "Good morning, thank you for your time today.",
              "Hey, look at this right now!",
              "Why are you staring at me?",
              "Give me money immediately."
            ],
            correctIndex: 0,
            explanation: "'Good morning, thank you for your time today' adalah etika standar komunikasi bisnis internasional.",
          },
        ],
      };
    }

    // Persist to MariaDB table `quests`
    await query(
      `INSERT INTO quests (id, mode, room_code, creator_name, title, target_language, difficulty_level, case_study_story, npc_name, npc_persona, required_object_hint, mission_objectives, target_vocabularies, quiz_questions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        questId,
        mode,
        finalRoomCode,
        creatorName,
        generatedQuestData.title,
        targetLanguage,
        difficultyLevel,
        generatedQuestData.case_study_story,
        generatedQuestData.npc_name,
        generatedQuestData.npc_persona,
        generatedQuestData.required_object_hint,
        JSON.stringify(generatedQuestData.mission_objectives),
        JSON.stringify(generatedQuestData.target_vocabularies),
        JSON.stringify(generatedQuestData.quiz_questions),
      ]
    );

    return NextResponse.json({
      success: true,
      quest: {
        id: questId,
        mode,
        room_code: finalRoomCode,
        creator_name: creatorName,
        title: generatedQuestData.title,
        target_language: targetLanguage,
        difficulty_level: difficultyLevel,
        case_study_story: generatedQuestData.case_study_story,
        npc_name: generatedQuestData.npc_name,
        npc_persona: generatedQuestData.npc_persona,
        required_object_hint: generatedQuestData.required_object_hint,
        mission_objectives: generatedQuestData.mission_objectives,
        target_vocabularies: generatedQuestData.target_vocabularies,
        quiz_questions: generatedQuestData.quiz_questions,
      },
    });
  } catch (err: any) {
    console.error("Generate quest route error:", err);
    return NextResponse.json({ error: "Gagal membuat quest.", details: err.message }, { status: 500 });
  }
}

