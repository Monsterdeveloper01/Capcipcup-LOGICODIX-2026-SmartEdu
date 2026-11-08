import { NextResponse } from "next/server";
import { getAiClient, hasAiKey } from "@/lib/ai/client";
import { QuestScenario, RoleplayTurnMessage } from "@/lib/linguaquest/types";

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
      studentSpeech,
      messagesHistory = [],
      currentRapport = 20,
    }: {
      quest: QuestScenario;
      studentSpeech: string;
      messagesHistory: RoleplayTurnMessage[];
      currentRapport: number;
    } = body;

    if (!studentSpeech || !studentSpeech.trim()) {
      return NextResponse.json(
        { error: "Suara siswa tidak terdeteksi. Silakan coba bicara kembali." },
        { status: 400 }
      );
    }

    const ai = getAiClient();

    const historyFormatted = messagesHistory
      .slice(-6)
      .map((m) => `${m.sender.toUpperCase()}: ${m.text}`)
      .join("\n");

    const promptText = `
You are the AI Game Engine for "LinguaQuest", an English Speaking RPG designed to help Indonesian students overcome the "Passive Fluency Trap".

QUEST DETAILS:
- Title: ${quest.title}
- Mode: ${quest.mode}
- NPC Name: ${quest.npcName} (${quest.npcRole})
- NPC Personality: ${quest.npcPersonality}
- Scenario: ${quest.scenarioBrief}
- Urgent Goal: ${quest.urgentGoal}
- Target Items: ${quest.targetItems.map((i) => `${i.englishWord} (${i.objectName})`).join(", ")}
- Target Vocabulary: ${quest.targetVocab.join(", ")}
- Current NPC Rapport/Trust Meter: ${currentRapport}/100

CONVERSATION HISTORY SO FAR:
${historyFormatted}

LATEST STUDENT SPOKEN SENTENCE:
"${studentSpeech}"

YOUR TASK:
1. Act 100% in-character as ${quest.npcName}. Respond to the student in natural spoken English (2 to 4 sentences). Be expressive and react directly to whatever items or arguments the student presented.
2. Evaluate the student's spoken line:
   - Identify which target items or target vocab were actually used in the sentence: "usedItems" (list of strings).
   - Evaluate progress and calculate "rapportChange" (-15 to +30). Reward clear pronunciation, politeness, and integration of the scanned items.
   - If the student used code-switching (mixing Indonesian words, e.g. "apa ya...", "maksudnya...") or spoke with hesitation, provide "hint" (Bisikan AI: a short, polite English sentence starter they can say next).
   - Provide "upgrade": A native-like, natural English phrasing of what the student tried to say (Native-like Upgrade).
   - Determine "isQuestCompleted": true if the NPC is fully persuaded (new rapport >= 80) or if the mission objective is achieved.

OUTPUT MUST BE STRICTLY JSON:
{
  "npcReply": "...",
  "usedItems": ["..."],
  "rapportChange": 20,
  "hint": "Optional gentle floating hint in English/Indonesian to help if they struggle, or null",
  "upgrade": "Polite/natural native-like phrasing of what the student said",
  "isQuestCompleted": false
}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: promptText,
      config: {
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text || "{}";
    const parsed = JSON.parse(rawText);

    const rapportChange = typeof parsed.rapportChange === "number" ? parsed.rapportChange : 15;
    const newRapport = Math.min(Math.max(currentRapport + rapportChange, 0), 100);

    const npcMessage: RoleplayTurnMessage = {
      id: `msg_${Date.now()}`,
      sender: "npc",
      text: parsed.npcReply || "I hear your words, traveller. Tell me more.",
      timestamp: Date.now(),
      hint: parsed.hint || undefined,
      upgrade: parsed.upgrade || undefined,
      usedItems: Array.isArray(parsed.usedItems) ? parsed.usedItems : [],
      rapportChange,
    };

    return NextResponse.json({
      success: true,
      npcMessage,
      newRapport,
      usedItems: parsed.usedItems || [],
      isQuestCompleted: Boolean(parsed.isQuestCompleted || newRapport >= 80),
    });
  } catch (error: any) {
    console.error("Gagal memproses turn roleplay:", error);
    return NextResponse.json(
      { error: "Gagal berinteraksi dengan karakter NPC AI.", details: error?.message },
      { status: 500 }
    );
  }
}
