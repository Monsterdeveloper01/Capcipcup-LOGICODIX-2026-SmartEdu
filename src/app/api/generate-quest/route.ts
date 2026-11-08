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
      learningObjective = "",
      taskType = "HYBRID", // 'HYBRID' | 'SPEAKING_ONLY' | 'QUIZ_ONLY'
      questionCount = 3,
      includeListening = true,
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
    const parsedQuestionCount = Math.min(Math.max(parseInt(questionCount, 10) || 3, 1), 10);

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
        const objectiveInstruction = learningObjective.trim()
          ? `TEACHER'S LEARNING OBJECTIVE (TUJUAN / CAPAIAN PEMBELAJARAN):
"${learningObjective.trim()}"
IMPORTANT: The entire mission title, situation, and/or questions MUST be designed directly to fulfill and evaluate this learning objective!`
          : `Educational Topic: ${topic}`;

        const isListeningOnly = taskType === "LISTENING_ONLY";
        const isQuizOnly = taskType === "QUIZ_ONLY";
        const isSpeakingOnly = taskType === "SPEAKING_ONLY";

        let taskTypeInstruction = "";
        if (isQuizOnly) {
          taskTypeInstruction = `TASK TYPE: QUIZ ONLY (MURNI PILIHAN GANDA TERTULIS TANPA AUDIO LISTENING).
Create exactly ${parsedQuestionCount} multiple-choice questions testing conceptual English comprehension. All questions MUST have "type": "multiple_choice" and "audio_script": null.
Set case_study_story to a concise background paragraph describing the topic context.`;
        } else if (isListeningOnly) {
          taskTypeInstruction = `TASK TYPE: LISTENING QUIZ ONLY (SOAL DENGAN AUDIO SUARA TTS).
Create exactly ${parsedQuestionCount} questions. All or most questions MUST have "type": "listening" with an authentic English spoken dialogue/announcement in "audio_script" (20-35 words) so students can listen before answering.
Set case_study_story to a concise background paragraph describing the topic context.`;
        } else if (isSpeakingOnly) {
          taskTypeInstruction = `TASK TYPE: SPEAKING ROLEPLAY ONLY.
Focus deeply on creating an authentic real-world emergency/speaking challenge with an NPC Examiner, scenario brief, physical desk objects, and target vocabularies.
Set "quiz_questions" to an empty array [].`;
        } else {
          taskTypeInstruction = `TASK TYPE: HYBRID (SPEAKING ROLEPLAY + KUIS & LISTENING).
Create both an authentic speaking scenario with an NPC, physical desk items, target vocabularies, AND exactly ${parsedQuestionCount} multiple-choice quiz questions. ${
            includeListening
              ? `At least 1-2 questions MUST be type "listening" with an authentic English spoken dialogue in "audio_script".`
              : `All questions can be standard multiple_choice.`
          }`;
        }

        const prompt = `You are an elite educational game designer and psychometric assessment expert for LinguaQuest (Indonesian Vocational/High School English Learning).

${objectiveInstruction}
- Mode: ${mode}
- Target CEFR Difficulty: ${difficultyLevel}
- Physical Objects in Room/Desk: ${detected_labels.join(", ")}
${taskTypeInstruction}

CRITICAL PSYCHOMETRIC RULES FOR ALL QUESTIONS:
1. ZERO LENGTH BIAS: NEVER make the correct answer noticeably longer than incorrect options. Indonesian students will cheat by picking the longest answer.
2. PARALLEL LENGTHS: In each question, all 4 options (A, B, C, D) must have similar length (within ±3 words) and parallel grammatical structures.
3. TRICKY SHORT ANSWERS: In at least 1 question, make the CORRECT answer concise and punchy (5-7 words), while making wrong options verbose (10-14 words).
4. VARY CORRECT INDEX: Distribute correctIndex across 0, 1, 2, 3.
5. LISTENING QUESTION SPECIFICATION:
   For questions with "type": "listening", provide an "audio_script" string in English (e.g., 20-35 words spoken announcement, dialog, or phone call). Students will listen to this text spoken via Text-To-Speech audio before answering.

Return STRICTLY a JSON object matching this schema:
{
  "title": "Short punchy mission title in Indonesian/English",
  "case_study_story": "2-3 sentences real-world scenario (or topic context)",
  "npc_name": "Name and role of NPC (e.g., Ms. Clara, International Partner)",
  "npc_persona": "Personality traits, critical thinking style",
  "required_object_hint": "Clear hint about physical objects (e.g. Botol minum / buku catatan di meja)",
  "mission_objectives": [
    "Objective 1 in English/Indonesian",
    "Objective 2 in English/Indonesian",
    "Objective 3 in English/Indonesian"
  ],
  "target_vocabularies": ["word1", "word2", "word3", "word4", "word5"],
  "quiz_questions": [
    ${
      taskType !== "SPEAKING_ONLY"
        ? `{
      "type": "listening",
      "audio_script": "Good morning, Front Desk. May I help you confirm your reservation for the executive suite this weekend?",
      "question": "What is the staff member offering to help with?",
      "options": ["Confirming a flight ticket", "Confirming an executive suite", "Arranging a tour guide", "Canceling a dinner reservation"],
      "correctIndex": 1,
      "explanation": "The speaker explicitly mentions confirming the reservation for the executive suite."
    }`
        : ""
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
      const fallbackQuestions = [
        {
          type: "listening",
          audio_script: "Excuse me, I'm looking for an eco-friendly tumbler that can keep drinks cold for at least twelve hours.",
          question: "What specific requirement does the customer have for the tumbler?",
          options: [
            "It must be made of plastic",
            "It keeps drinks cold for 12 hours",
            "It comes with free hot coffee",
            "It has a discounted price tag"
          ],
          correctIndex: 1,
          explanation: "The customer states 'keep drinks cold for at least twelve hours'.",
        },
        {
          type: "multiple_choice",
          audio_script: null,
          question: "Manakah kata sifat yang paling tepat untuk mendeskripsikan produk yang kuat dan tahan lama?",
          options: ["Fragile", "Durable", "Hazardous", "Temporary"],
          correctIndex: 1,
          explanation: "'Durable' berarti tahan lama dan tidak mudah rusak.",
        },
        {
          type: "multiple_choice",
          audio_script: null,
          question: "What is the most effective opening hook for a professional 30-second elevator pitch?",
          options: [
            "I would like to respectfully present our forty-page market analysis report.",
            "We cut cafe delivery costs by 40%.",
            "I have always dreamed of working at your prestigious company.",
            "You should read our detailed technical manual regarding hospitality amenities."
          ],
          correctIndex: 1,
          explanation: "'We cut cafe delivery costs by 40%' is a punchy, value-first opening statement.",
        },
        {
          type: "listening",
          audio_script: "Thank you for calling customer care. All our representatives are currently assisting other callers. Please stay on the line.",
          question: "What are callers requested to do according to the recorded message?",
          options: [
            "Hang up immediately",
            "Stay on the line",
            "Leave a text message",
            "Visit the nearest branch"
          ],
          correctIndex: 1,
          explanation: "The automated voice asks the caller to 'Please stay on the line'.",
        },
        {
          type: "multiple_choice",
          audio_script: null,
          question: "When negotiating with an international partner, which phrase demonstrates polite firmness?",
          options: [
            "We can consider that with adjusted volume.",
            "That is completely unacceptable to us.",
            "You must agree to our previous terms.",
            "We will never compromise our position."
          ],
          correctIndex: 0,
          explanation: "'We can consider that with adjusted volume' is constructive yet firm.",
        },
      ];

      const activeQuestions =
        taskType === "SPEAKING_ONLY"
          ? []
          : fallbackQuestions.slice(0, parsedQuestionCount);

      generatedQuestData = {
        title: topic ? `Misi: ${topic}` : "Misi Komunikasi Profesional & Kuis",
        case_study_story: learningObjective
          ? `Tujuan: ${learningObjective}. Hadapi situasi studi kasus nyata di dunia kerja dan berikan solusi yang tepat.`
          : `Kamu sedang mempresentasikan solusi inovatif menggunakan objek di sekitarmu (${detected_labels.join(", ")}) kepada perwakilan mitra global.`,
        npc_name: "Ms. Clara (International Partner)",
        npc_persona: "Profesional, antusias terhadap inovasi, apresiatif terhadap ide baru.",
        required_object_hint: `Gunakan benda ${detected_labels[0] || "botol"} di mejamu sebagai prototipe nyata saat berbicara!`,
        mission_objectives: [
          `Gunakan minimal 2 kosakata wajib saat menjelaskan manfaat objek`,
          "Jawab pertanyaan NPC tentang solusi praktis di kehidupan sehari-hari",
          "Tutup dengan ungkapan penutup yang sopan dan profesional",
        ],
        target_vocabularies: ["durable", "sustainable", "innovative", "solution", "effective"],
        quiz_questions: activeQuestions,
      };
    }

    // Normalize quiz questions format
    if (generatedQuestData.quiz_questions && Array.isArray(generatedQuestData.quiz_questions)) {
      generatedQuestData.quiz_questions = generatedQuestData.quiz_questions.map((q: any) => ({
        type: q.type === "listening" || q.audio_script || q.audioScript ? "listening" : "multiple_choice",
        audioScript: q.audioScript || q.audio_script || null,
        question: q.question,
        options: Array.isArray(q.options) ? q.options : ["Option A", "Option B", "Option C", "Option D"],
        correctIndex: typeof q.correctIndex === "number" ? q.correctIndex : 0,
        explanation: q.explanation || "Jawaban terverifikasi CEFR.",
      }));
    } else {
      generatedQuestData.quiz_questions = [];
    }

    // If request was just to generate draft (for builder preview)
    if (generateOnly) {
      return NextResponse.json({
        success: true,
        draft: {
          ...generatedQuestData,
          taskType,
        },
        quest: {
          ...generatedQuestData,
          taskType,
        },
      });
    }

    // Persist to MariaDB table `quests`
    await query(
      `INSERT INTO quests (
        id, mode, task_type, room_code, creator_name, title, target_language, difficulty_level,
        case_study_story, npc_name, npc_persona, required_object_hint,
        mission_objectives, target_vocabularies, quiz_questions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        questId,
        mode,
        taskType,
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
        taskType,
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
