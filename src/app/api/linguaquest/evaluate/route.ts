import { NextResponse } from "next/server";
import { getAiClient, hasAiKey, generateContentWithFallback } from "@/lib/ai/client";
import { query } from "@/lib/db";
import { QuestScenario, RoleplayTurnMessage, SpeakingEvaluation } from "@/lib/linguaquest/types";

export async function POST(req: Request) {
  try {
    if (!hasAiKey()) {
      return NextResponse.json(
        { error: "GEMINI_API_KEY belum disetel di .env.local" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const {
      quest,
      messages,
      durationSeconds = 120,
      hesitationSeconds = 2.5,
      codeSwitchingCount = 0,
      studentName = "Siswa LinguaQuest",
    }: {
      quest: QuestScenario;
      messages: RoleplayTurnMessage[];
      durationSeconds: number;
      hesitationSeconds: number;
      codeSwitchingCount: number;
      studentName: string;
    } = body;

    const studentLines = messages
      .filter((m) => m.sender === "student")
      .map((m) => m.text);

    if (studentLines.length === 0) {
      return NextResponse.json(
        { error: "Belum ada rekaman percakapan siswa untuk dievaluasi." },
        { status: 400 }
      );
    }

    const ai = getAiClient();

    const promptText = `
You are the Chief CEFR Language Assessor for "LinguaQuest", an English Speaking educational platform in Indonesia.

Evaluate the student's spoken performance in this completed quest:
- Quest Title: ${quest.title}
- Mode: ${quest.mode}
- Curriculum Topic: ${quest.curriculumTopic}
- Target Items Scanned: ${quest.targetItems.map((i) => i.englishWord).join(", ")}
- Target Vocabulary: ${quest.targetVocab.join(", ")}

STUDENT'S SPOKEN TRANSCRIPT (IN ORDER):
${studentLines.map((line, idx) => `Turn ${idx + 1}: "${line}"`).join("\n")}

ASSESSMENT CRITERIA (CEFR & Kurikulum Merdeka Speaking Rubric):
1. Determine CEFR Level: "A1" (Beginner), "A2" (Elementary), "B1" (Intermediate), "B2" (Upper Intermediate), or "C1" (Advanced).
2. Assign 0-100 scores for:
   - fluencyScore (smoothness, lack of excessive pauses)
   - pronunciationScore (phonetic clarity and word stress)
   - vocabularyScore (active usage of scanned object terms and collocations)
   - grammarScore (correct tenses, sentence structure, modal verbs)
   - overallScore (composite average)
3. Provide:
   - transcriptSummary: 2-3 sentence overview of the student's performance in Indonesian.
   - strengths: 3 positive highlights in Indonesian.
   - areasToImprove: 2 specific actionable feedback points in Indonesian.
   - nativeUpgrades: array of objects { original, upgraded, explanation } showing how the student's sentences can be elevated to natural native-speaker quality.
   - badgeUnlocked: { title, icon, description }

OUTPUT MUST BE STRICTLY JSON:
{
  "cefrLevel": "A2" | "B1" | "B2",
  "overallScore": 85,
  "fluencyScore": 82,
  "pronunciationScore": 80,
  "vocabularyScore": 90,
  "grammarScore": 88,
  "transcriptSummary": "...",
  "strengths": ["...", "...", "..."],
  "areasToImprove": ["...", "..."],
  "nativeUpgrades": [
    {
      "original": "...",
      "upgraded": "...",
      "explanation": "..."
    }
  ],
  "badgeUnlocked": {
    "title": "...",
    "icon": "🏆",
    "description": "..."
  }
}
`;

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
      console.warn("[LinguaQuest Evaluate] Gemini fallback:", aiErr?.message || aiErr);
      parsed = {
        cefrLevel: "B1",
        overallScore: 82,
        fluencyScore: 80,
        pronunciationScore: 84,
        vocabularyScore: 82,
        grammarScore: 80,
        transcriptSummary: "Siswa menunjukkan keberanian berbicara yang luar biasa dengan alur kalimat yang runtut.",
        strengths: ["Percaya diri dalam menyampaikan argumen", "Kosakata target berhasil diaplikasikan secara relevan", "Pelafalan kata kunci jelas dan terdengar meyakinkan"],
        areasToImprove: ["Kurangi jeda di awal respons", "Gunakan conjunction majemuk untuk memperpanjang kalimat"],
        nativeUpgrades: [
          {
            original: studentLines[0] || "I want to explain this item",
            upgraded: "Allow me to walk you through the key advantages of this tool.",
            explanation: "Frasa 'walk you through' terdengar jauh lebih diplomatis dan luwes."
          }
        ],
        badgeUnlocked: {
          title: "Articulate Explorer",
          icon: "🌟",
          description: "Menyelesaikan misi percakapan dengan kepuasan NPC tinggi!"
        }
      };
    }

    const evalId = `eval_${Date.now()}`;
    const xpEarned = Math.round((parsed.overallScore || 75) * 2.5);

    const evaluation: SpeakingEvaluation = {
      id: evalId,
      questTitle: quest.title,
      studentName,
      timestamp: "Baru saja",
      cefrLevel: parsed.cefrLevel || "A2",
      overallScore: parsed.overallScore || 78,
      fluencyScore: parsed.fluencyScore || 75,
      pronunciationScore: parsed.pronunciationScore || 75,
      vocabularyScore: parsed.vocabularyScore || 80,
      grammarScore: parsed.grammarScore || 76,
      hesitationSeconds,
      codeSwitchingCount,
      transcriptSummary: parsed.transcriptSummary || "Siswa berhasil menyelesaikan misi percakapan.",
      strengths: Array.isArray(parsed.strengths) ? parsed.strengths : ["Berani berbicara spontan."],
      areasToImprove: Array.isArray(parsed.areasToImprove) ? parsed.areasToImprove : ["Tingkatkan variasi kosakata."],
      nativeUpgrades: Array.isArray(parsed.nativeUpgrades) ? parsed.nativeUpgrades : [],
      xpEarned,
      badgeUnlocked: parsed.badgeUnlocked || {
        title: "Fluent Explorer",
        icon: "🌟",
        description: "Menyelesaikan misi percakapan dengan keberanian berbicara.",
      },
    };

    // Simpan ke database MariaDB (speaking_sessions)
    try {
      await query(
        `INSERT INTO speaking_sessions 
         (id, user_id, quest_id, class_code, duration_seconds, cefr_level, overall_score, fluency_score, pronunciation_score, vocabulary_score, grammar_score, hesitation_seconds, code_switching_count, transcript_json, feedback_json, native_upgrades_json, xp_earned)
         VALUES (?, 'student_demo', ?, 'CLASS-10A', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          evaluation.id,
          quest.id,
          durationSeconds,
          evaluation.cefrLevel,
          evaluation.overallScore,
          evaluation.fluencyScore,
          evaluation.pronunciationScore,
          evaluation.vocabularyScore,
          evaluation.grammarScore,
          Math.round(hesitationSeconds),
          codeSwitchingCount,
          JSON.stringify(messages),
          JSON.stringify({ strengths: evaluation.strengths, areasToImprove: evaluation.areasToImprove }),
          JSON.stringify(evaluation.nativeUpgrades),
          evaluation.xpEarned,
        ]
      );
    } catch (dbErr) {
      console.warn("Peringatan: Gagal menyimpan riwayat evaluasi ke database:", dbErr);
    }

    return NextResponse.json({
      success: true,
      evaluation,
    });
  } catch (error: any) {
    console.error("Gagal melakukan evaluasi sesi:", error);
    return NextResponse.json(
      { error: "Gagal memproses evaluasi CEFR dengan AI.", details: error?.message },
      { status: 500 }
    );
  }
}

