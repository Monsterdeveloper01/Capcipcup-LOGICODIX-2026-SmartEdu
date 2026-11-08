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
      generateOnly = false,
      customCase,
      customQuiz,
    } = body;

    let finalRoomCode = null;
    if (mode === "ROOM") {
      finalRoomCode = roomCode || Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    const questId = `quest_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // If customCase and customQuiz are provided and not generating draft
    let generatedQuestData: any = null;

    if (customCase && customQuiz && !generateOnly) {
      generatedQuestData = {
        title: customCase.title || `Misi Kasus: ${topic}`,
        case_study_story: customCase.case_study_story || `Skenario studi kasus mengenai ${topic}.`,
        npc_name: customCase.npc_name || "Mr. Alex (Examiner)",
        npc_persona: customCase.npc_persona || "Kritis, profesional, apresiatif.",
        required_object_hint: customCase.required_object_hint || `Gunakan objek fisik di mejamu!`,
        mission_objectives: customCase.mission_objectives || [
          "Jelaskan ide utamamu dalam Bahasa Inggris",
          "Gunakan kosakata yang relevan",
        ],
        target_vocabularies: customCase.target_vocabularies || ["sustainable", "solution"],
        quiz_questions: customQuiz,
      };
    } else if (hasAiKey()) {
      const aiClient = getAiClient();
      if (aiClient) {
        const prompt = `You are an elite educational game designer and psychometric test assessment expert for LinguaQuest, a real-world case-study RPG for Indonesian students learning ${targetLanguage}.
Create an engaging emergency case-study roleplay mission and 3 multiple-choice pre-quiz questions based on:
- Mode: ${mode}
- Educational Topic: ${topic}
- Physical Objects in Room/Desk: ${detected_labels.join(", ")}
- Target Difficulty: ${difficultyLevel} CEFR

CRITICAL TEST-DESIGN RULES (PREVENT "LONGEST OPTION IS ALWAYS CORRECT" CHEAT):
1. ZERO LENGTH BIAS (STRICT RULE): NEVER make the correct answer noticeably longer or more detailed than the incorrect distractors! Indonesian students will exploit this flaw by guessing "the longest option is always correct".
2. BALANCED PARALLEL LENGTHS: In each question, all 4 options (A, B, C, D) MUST have nearly identical word count (within ±2 words) and parallel grammatical structure.
3. TRICKY SHORT CORRECT ANSWERS: In at least 1-2 questions, deliberately make the CORRECT answer concise, punchy, and SHORTER than the distractors (e.g. 5-7 words), while making the INCORRECT distractors verbose, wordy, flowery, or overly complicated (10-14 words) but conceptually flawed! This completely foils students trying to guess the longest option.
4. PLAUSIBLE DISTRACTORS: All distractors must sound realistic, professional, and intelligent—never silly 2-word jokes or obvious caricatures.
5. VARY CORRECT INDEX: Distribute correctIndex across 0, 1, 2, 3 (do NOT always put it at 0 or 2).

EXAMPLE OF GOOD QUESTION DESIGN (Short punchy correct answer, long deceptive distractors):
{
  "question": "What is the most effective opening hook for a professional 30-second elevator pitch?",
  "options": [
    "I would like to respectfully present our forty-page market analysis report regarding youth habits.",
    "We cut cafe delivery costs by 40%.",
    "I have always dreamed of working at your prestigious international company since my university days.",
    "You should listen to my detailed technical specifications regarding our startup software architecture."
  ],
  "correctIndex": 1,
  "explanation": "'We cut cafe delivery costs by 40%' is a punchy, value-first opening statement that respects the listener's time."
}

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
      "options": ["Option A (similar length)", "Option B (similar length)", "Option C (similar length)", "Option D (similar length)"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct"
    },
    {
      "question": "Second multiple-choice professional speaking question (Short correct answer, longer distractors)",
      "options": ["Long deceptive distractor A", "Short punchy correct answer B", "Long deceptive distractor C", "Long deceptive distractor D"],
      "correctIndex": 1,
      "explanation": "Why this answer is correct"
    },
    {
      "question": "Third multiple-choice vocabulary context question",
      "options": ["Option A (balanced length)", "Option B (balanced length)", "Option C (balanced length)", "Option D (balanced length)"],
      "correctIndex": 2,
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

    // High quality deterministic fallback (Strictly adheres to Anti-Length Bias)
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
            options: ["Fragile", "Durable", "Hazardous", "Temporary"],
            correctIndex: 1,
            explanation: "'Durable' berarti tahan lama dan kokoh.",
          },
          {
            question: "What is the most effective opening hook for a professional 30-second elevator pitch?",
            options: [
              "I would like to respectfully present our forty-page market analysis report.",
              "We cut cafe delivery costs by 40%.",
              "I have always dreamed of working at your prestigious international company.",
              "You should read our detailed technical manual regarding hospitality amenities."
            ],
            correctIndex: 1,
            explanation: "'We cut cafe delivery costs by 40%' is a punchy, value-first opening statement.",
          },
          {
            question: "When a client asks for a quick price discount, what is the best professional response?",
            options: [
              "We cannot change our prices, take it or leave it.",
              "I can offer a 5% discount for bulk orders.",
              "Our company policy is extremely strict regarding financial discounts and margins.",
              "You should ask someone else who has authority over financial budget decisions."
            ],
            correctIndex: 1,
            explanation: "Offering a conditional discount tied to bulk volume protects margins while being constructive.",
          },
        ],
      };
    }

    // If request was just to generate draft (for builder preview)
    if (generateOnly) {
      return NextResponse.json({
        success: true,
        draft: generatedQuestData,
        quest: generatedQuestData,
      });
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

