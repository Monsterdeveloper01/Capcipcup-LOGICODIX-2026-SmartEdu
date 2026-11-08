import { NextResponse } from "next/server";
import { getAiClient, hasAiKey, generateContentWithFallback } from "@/lib/ai/client";
import { query } from "@/lib/db";
import { QuestScenario, TeacherCurriculumQuestInput } from "@/lib/linguaquest/types";

export async function POST(req: Request) {
  try {
    if (!hasAiKey()) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY belum disetel di .env.local" },
        { status: 500 }
      );
    }

    const body: TeacherCurriculumQuestInput = await req.json();
    const { gradeLevel, subjectTopic, requiredVocabulary } = body;

    if (!subjectTopic || !subjectTopic.trim()) {
      return NextResponse.json(
        { error: "Topik materi kurikulum tidak boleh kosong." },
        { status: 400 }
      );
    }

    const ai = getAiClient();

    const promptText = `
You are the "AI Classroom Game Master & Co-Pilot" for English teachers in Indonesia.
The teacher is using Kurikulum Merdeka and wants to transform a textbook/curriculum topic into an interactive live-environment camera RPG mission for their students in 10 seconds.

TEACHER'S LESSON INPUT:
- Grade Level: ${gradeLevel || "Umum / Menengah"}
- Topic / CP: ${subjectTopic}
- Required Target Vocabulary to Lock: ${requiredVocabulary || "Auto-generate 4-5 relevant industry/everyday English terms"}

YOUR TASK:
Create a dynamic English quest where students must find 2-3 real physical objects in their room or classroom, scan them, and speak with an NPC to solve a problem.

OUTPUT MUST BE STRICTLY JSON:
{
  "title": "Engaging Quest Title in English",
  "mode": "survival" | "smk_career" | "local_pride" | "boss_raid",
  "npcName": "Character Name",
  "npcRole": "Role / Profession",
  "npcAvatar": "single emoji (e.g. 👨‍🍳, 🧐, 🏨, 🧭, 👔)",
  "npcPersonality": "Brief character demeanor",
  "scenarioBrief": "Story background in Indonesian explaining why the student must speak to this NPC",
  "urgentGoal": "Specific spoken goal in English to achieve within time limit",
  "targetVocab": ["4 to 6 mandatory English words the teacher locked or recommended"],
  "suggestedObjectsToScan": ["3 common physical items students should find and scan around them"],
  "timeLimitSeconds": 180,
  "initialNpcGreeting": "First dialogue line spoken by the NPC in dramatic English",
  "curriculumTopic": "${subjectTopic}"
}
`;

    const lockedVocabs = requiredVocabulary
      ? requiredVocabulary.split(",").map((v) => v.trim()).filter(Boolean)
      : [];

    let parsed: any = null;

    try {
      const response = await generateContentWithFallback(ai, {
        contents: promptText,
        config: {
          responseMimeType: "application/json",
        },
      });

      const rawText = response.text || "{}";
      parsed = JSON.parse(rawText);
    } catch (aiErr: any) {
      console.warn("[Teacher Quest Gen] Gemini fallback:", aiErr?.message || aiErr);
      parsed = {
        title: `Curriculum Mission: ${subjectTopic}`,
        mode: "smk_career",
        npcName: "Mr. Harrison",
        npcRole: "International Guest Relations",
        npcAvatar: "👔",
        npcPersonality: "Detail-oriented, appreciative of polite and structured explanations.",
        scenarioBrief: `Sebagai bagian dari materi ${subjectTopic}, siswa ditugaskan mempraktikkan kemampuan berbicara bahasa Inggris secara profesional kepada mitra luar negeri.`,
        urgentGoal: `Persuade Mr. Harrison using target vocabulary: ${lockedVocabs.join(", ") || "provide, recommend, solution"}!`,
        targetVocab: lockedVocabs.length > 0 ? lockedVocabs : ["provide", "recommend", "effective", "solution"],
        suggestedObjectsToScan: ["Notebook / Buku", "Water Bottle / Minuman", "Pen / Alat Tulis"],
        timeLimitSeconds: 180,
        initialNpcGreeting: `Good day! I am evaluating candidates for this international project. Could you present your solution?`,
        curriculumTopic: subjectTopic,
      };
    }

    const questId = `quest_t_${Date.now()}`;
    const quest: QuestScenario = {
      id: questId,
      title: parsed.title || "Custom Teacher Quest",
      mode: parsed.mode || "smk_career",
      npcName: parsed.npcName || "Classroom Evaluator",
      npcRole: parsed.npcRole || "NPC Penguji",
      npcAvatar: parsed.npcAvatar || "🧑‍🏫",
      npcPersonality: parsed.npcPersonality || "Menilai ketepatan penggunaan kosakata target",
      scenarioBrief: parsed.scenarioBrief || "Selesaikan misi berbicara bahasa Inggris sesuai arahan guru.",
      urgentGoal: parsed.urgentGoal || "Use all locked target vocabulary words in your spoken response!",
      targetVocab: Array.isArray(parsed.targetVocab) ? parsed.targetVocab : ["speak", "explain", "present"],
      timeLimitSeconds: parsed.timeLimitSeconds || 180,
      initialNpcGreeting: parsed.initialNpcGreeting || "Hello! Show me your presentation.",
      curriculumTopic: `${gradeLevel} - ${subjectTopic}`,
      targetItems: [], // Akan diisi saat siswa scan benda nyata mereka
    };

    // Simpan ke database MariaDB
    try {
      await query(
        `INSERT INTO lingua_quests (id, title, mode, target_language, scenario_brief, npc_name, npc_role, target_vocab, curriculum_topic, class_code)
         VALUES (?, ?, ?, 'english', ?, ?, ?, ?, ?, 'CLASS-10A')`,
        [
          quest.id,
          quest.title,
          quest.mode,
          quest.scenarioBrief,
          quest.npcName,
          quest.npcRole,
          JSON.stringify(quest.targetVocab),
          quest.curriculumTopic,
        ]
      );
    } catch (dbErr) {
      console.warn("Peringatan: Gagal menyimpan quest guru ke database:", dbErr);
    }

    return NextResponse.json({
      success: true,
      quest,
      suggestedObjectsToScan: parsed.suggestedObjectsToScan || ["Benda di meja", "Buku", "Botol"],
    });
  } catch (error: any) {
    console.error("Gagal generate quest kurikulum:", error);
    return NextResponse.json(
      { error: "Gagal membuat quest kurikulum dengan AI.", details: error?.message },
      { status: 500 }
    );
  }
}

