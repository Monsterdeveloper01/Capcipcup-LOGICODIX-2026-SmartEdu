import { NextResponse } from "next/server";
import { getAiClient, hasAiKey, generateContentWithFallback } from "@/lib/ai/client";
import { query } from "@/lib/db";
import { ClassMisconceptionItem, SpeakingEvaluation } from "@/lib/linguaquest/types";

export async function GET() {
  try {
    // 1. Ambil data asli dari tabel speaking_sessions di MariaDB
    let dbSessions: any[] = [];
    try {
      dbSessions = await query(
        `SELECT s.*, q.title as quest_title 
         FROM speaking_sessions s 
         LEFT JOIN lingua_quests q ON s.quest_id = q.id 
         ORDER BY s.created_at DESC LIMIT 15`
      );
    } catch (err) {
      console.warn("Peringatan: Gagal query database speaking_sessions:", err);
    }

    // Transformasi data database ke format SpeakingEvaluation
    const evaluations: SpeakingEvaluation[] = dbSessions.map((row) => {
      const feedback = typeof row.feedback_json === "string" ? JSON.parse(row.feedback_json) : row.feedback_json || {};
      const nativeUpgrades = typeof row.native_upgrades_json === "string" ? JSON.parse(row.native_upgrades_json) : row.native_upgrades_json || [];

      return {
        id: row.id,
        questTitle: row.quest_title || "Latihan Berbicara Bahasa Inggris",
        studentName: row.user_id === "student_demo" ? "Siswa Praktik (Live)" : `Siswa ${row.user_id}`,
        timestamp: new Date(row.created_at).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
        cefrLevel: row.cefr_level || "A2",
        overallScore: row.overall_score || 75,
        fluencyScore: row.fluency_score || 75,
        pronunciationScore: row.pronunciation_score || 75,
        vocabularyScore: row.vocabulary_score || 75,
        grammarScore: row.grammar_score || 75,
        hesitationSeconds: row.hesitation_seconds || 2,
        codeSwitchingCount: row.code_switching_count || 0,
        transcriptSummary: "Sesi percakapan real-time tersimpan di database.",
        strengths: feedback.strengths || ["Aktif merespons tantangan berbicara."],
        areasToImprove: feedback.areasToImprove || ["Latih pelafalan kata target."],
        nativeUpgrades: Array.isArray(nativeUpgrades) ? nativeUpgrades : [],
        xpEarned: row.xp_earned || 150,
      };
    });

    // 2. Hitung statistik agregat kelas
    const totalCount = evaluations.length;
    const avgScore = totalCount > 0 ? Math.round(evaluations.reduce((acc, s) => acc + s.overallScore, 0) / totalCount) : 80;
    const avgFluency = totalCount > 0 ? Math.round(evaluations.reduce((acc, s) => acc + s.fluencyScore, 0) / totalCount) : 78;
    const avgPronunciation = totalCount > 0 ? Math.round(evaluations.reduce((acc, s) => acc + s.pronunciationScore, 0) / totalCount) : 75;
    const avgVocabulary = totalCount > 0 ? Math.round(evaluations.reduce((acc, s) => acc + s.vocabularyScore, 0) / totalCount) : 82;
    const avgGrammar = totalCount > 0 ? Math.round(evaluations.reduce((acc, s) => acc + s.grammarScore, 0) / totalCount) : 76;
    const avgHesitation = totalCount > 0 ? (evaluations.reduce((acc, s) => acc + s.hesitationSeconds, 0) / totalCount).toFixed(1) : "2.4";

    // 3. Analisis Misconception Heatmap Kelas menggunakan Gemini AI jika token tersedia
    let misconceptions: ClassMisconceptionItem[] = [];
    let warmUpQuiz = null;

    if (hasAiKey()) {
      try {
        const ai = getAiClient();
        const summaryForAi = evaluations.slice(0, 5).map((e) => ({
          score: e.overallScore,
          cefr: e.cefrLevel,
          areasToImprove: e.areasToImprove,
          nativeUpgrades: e.nativeUpgrades.map((u) => ({ original: u.original, upgraded: u.upgraded })),
        }));

        const promptText = `
You are the AI Learning Analytics Specialist for an Indonesian English Classroom (Kurikulum Merdeka).
Analyze these recent student speaking sessions from the database:
${JSON.stringify(summaryForAi)}

Generate:
1. 3 to 4 specific "Class Misconceptions" that Indonesian students commonly struggle with based on these trends (e.g. Pronunciation silables, Past Tense omission, Code-switching hesitation, Vocabulary depth).
2. A "5-Minute Warm-Up Quiz" that the teacher can project on the classroom screen to fix these common mistakes.

OUTPUT MUST BE STRICTLY JSON:
{
  "misconceptions": [
    {
      "id": "misc_1",
      "category": "Pronunciation" | "Grammar" | "Vocabulary" | "Fluency",
      "errorDescription": "Deskripsi kesalahan umum dalam bahasa Indonesia",
      "affectedPercentage": 65,
      "exampleMistake": "Contoh kalimat keliru yang diucapkan siswa",
      "correctForm": "Bentuk yang benar dalam bahasa Inggris",
      "recommendedWarmup": "Aktivitas 2-3 menit yang bisa dilakukan guru di kelas"
    }
  ],
  "warmUpQuiz": {
    "title": "5-Minute Morning Speaking Drill",
    "drillType": "Echo Speaking / Rapid Fire",
    "questions": [
      {
        "prompt": "Say this correctly without extra syllables: ...",
        "targetAnswer": "..."
      }
    ]
  }
}
`;

        const response = await generateContentWithFallback(ai, {
          contents: promptText,
          config: {
            responseMimeType: "application/json",
          },
        });

        const parsed = JSON.parse(response.text || "{}");
        misconceptions = parsed.misconceptions || [];
        warmUpQuiz = parsed.warmUpQuiz || null;
      } catch (aiErr) {
        console.warn("Gagal generate heatmap AI dinamis:", aiErr);
      }
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalSessions: totalCount,
        avgScore,
        avgFluency,
        avgPronunciation,
        avgVocabulary,
        avgGrammar,
        avgHesitationSeconds: avgHesitation,
      },
      evaluations,
      misconceptions,
      warmUpQuiz,
    });
  } catch (error: any) {
    console.error("Gagal mengambil data heatmap guru:", error);
    return NextResponse.json(
      { error: "Gagal mengambil data analitik kelas.", details: error?.message },
      { status: 500 }
    );
  }
}

