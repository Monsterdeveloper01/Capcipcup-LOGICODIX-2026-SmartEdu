import { NextResponse } from "next/server";
import { getAiClient, hasAiKey } from "@/lib/ai/client";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      quest,
      studentSpeech,
      messagesHistory = [],
      pythonMetrics = {},
    } = body;

    if (!studentSpeech || !quest) {
      return NextResponse.json({ error: "Missing speech or quest data." }, { status: 400 });
    }

    const { wpm = 95, matched_vocabularies = [], filler_count = 0 } = pythonMetrics;

    let roleplayResult: any = null;

    if (hasAiKey()) {
      const aiClient = getAiClient();
      if (aiClient) {
        const prompt = `You are playing the role of NPC "${quest.npc_name || quest.npcName}" with persona: "${quest.npc_persona || quest.npcPersona}".
The student is participating in a live speaking roleplay scenario:
- Scenario: "${quest.case_study_story || quest.scenario_brief || quest.scenarioBrief}"
- Mission Objectives: ${JSON.stringify(quest.mission_objectives || quest.targetVocab || [])}
- Target Vocabularies: ${JSON.stringify(quest.target_vocabularies || quest.targetVocab || [])}

The student just said in English:
"${studentSpeech}"

Python real-time speech telemetry:
- Words Per Minute: ${wpm}
- Matched Target Vocabs: ${matched_vocabularies.join(", ") || "None"}
- Filler words count: ${filler_count}

Task:
Respond authentically as the NPC. Encourage the student, react to the physical object they mentioned, evaluate which objectives they fulfilled, and provide a constructive grammar tip.

Return STRICTLY a JSON object matching this schema:
{
  "npc_reply": "1-2 sentences conversational reply in English maintaining persona",
  "completed_objective_indices": [0],
  "live_hint_id": "One helpful sentence in Indonesian/English suggesting what to say next",
  "grammar_tip_on_last_turn": "Brief positive feedback or native phrasing upgrade",
  "is_mission_complete": false
}`;

        try {
          const response = await aiClient.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
              responseMimeType: "application/json",
            },
          });

          const rawText = response.text || "{}";
          roleplayResult = JSON.parse(rawText);
        } catch (err) {
          console.warn("Gemini roleplay fallback:", err);
        }
      }
    }

    // High quality deterministic fallback
    if (!roleplayResult) {
      const isComplete = messagesHistory.length >= 3;
      roleplayResult = {
        npc_reply: `I appreciate your perspective! You highlighted the product's benefits clearly. How would you convince customers that this is durable enough for everyday use?`,
        completed_objective_indices: [0],
        live_hint_id: "Jelaskan ketahanan fisiknya, misalnya 'It withstands accidental drops'!",
        grammar_tip_on_last_turn: "Pengucapanmu lancar! Gunakan transisi seperti 'Furthermore' untuk memperkuat argumen.",
        is_mission_complete: isComplete,
      };
    }

    return NextResponse.json({
      success: true,
      ...roleplayResult,
    });
  } catch (err: any) {
    console.error("Roleplay chat error:", err);
    return NextResponse.json({ error: "Gagal memproses roleplay chat.", details: err.message }, { status: 500 });
  }
}

