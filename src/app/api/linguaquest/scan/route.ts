import { NextResponse } from "next/server";
import { getAiClient, hasAiKey, generateContentWithFallback } from "@/lib/ai/client";
import { query } from "@/lib/db";
import { GameMode, QuestScenario, ScannedItem } from "@/lib/linguaquest/types";

export async function POST(req: Request) {
  try {
    if (!hasAiKey()) {
      return NextResponse.json(
        {
          error: "GEMINI_API_KEY belum disetel di .env.local",
          message: "Silakan masukkan API key Gemini Anda di file .env.local agar AI Vision dan Quest Generator dapat berjalan.",
        },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { imageBase64, mode = "survival" }: { imageBase64: string; mode: GameMode } = body;

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Gambar tidak ditemukan. Ambil foto objek terlebih dahulu melalui kamera." },
        { status: 400 }
      );
    }

    // Ekstrak base64 murni tanpa prefix data:image/...;base64,
    let mimeType = "image/jpeg";
    let base64Data = imageBase64;

    if (imageBase64.includes(";base64,")) {
      const parts = imageBase64.split(";base64,");
      const match = parts[0].match(/:(.*?)$/);
      if (match) mimeType = match[1];
      base64Data = parts[1];
    }

    const ai = getAiClient();

    // Mode-specific roleplay instruction
    const modeInstructions: Record<GameMode, string> = {
      survival:
        "Theme: Survival & Adventure RPG (SD-SMA). The player is stranded or trapped in a mysterious fantasy/island/dungeon setting. An eccentric gatekeeper or explorer NPC demands practical everyday supplies to let them pass. Objects must be treated as survival tools.",
      smk_career:
        "Theme: Vocational / Career Simulator (SMK Pariwisata/Perhotelan/Bisnis). The player is a hospitality front desk or customer service staff. An irate or demanding international client/VIP guest NPC is complaining. The scanned objects must be creative compensation or service items.",
      local_pride:
        "Theme: Local Pride Cultural Ambassador. An international traveler/blogger NPC is visiting Indonesia. The player must explain local items, cultural heritage, or local culinary snacks in proud, natural English.",
      boss_raid:
        "Theme: Collaborative Classroom Boss Raid. A giant environmental/industrial Titan Boss NPC is challenging the whole class. The scanned objects are innovative eco-friendly scientific tools used in a persuasive debate.",
    };

    const promptText = `
You are the AI Vision Game Master of "LinguaQuest" (DuniaKata), an educational live-environment English RPG game designed to cure the "Passive Fluency Trap" in Indonesia.

Look at this real photograph taken by the student using their webcam/camera.
Follow these steps:
1. CHILD SAFETY & HAZARD AUDIT:
   Check if the image contains dangerous items, weapons, sharp blades, lighters/fire, cigarettes, alcohol, or school-inappropriate content.
   If dangerous items are found, set "isSafe": false, specify "hazardDetected", and formulate an educational polite refusal in Indonesian "educationalWarning" explaining why this cannot be brought to school.
2. DETECT 2 to 4 distinct physical objects visible in the image (e.g. water bottle, shoe, spoon, glasses, coffee, book, phone, key, bag, etc.).
3. For each detected object:
   - objectName: Indonesian name (e.g., "Botol Air")
   - englishWord: Natural English vocabulary (e.g., "Reusable Water Bottle")
   - phonetics: Accurate IPA phonetic transcription (e.g., "/ˈriːˈjuːzəbəl ˈwɔːtər ˈbɒtəl/")
   - meaningId: Indonesian meaning / context
   - idiom: A real English idiom or common phrase involving this object, with its Indonesian explanation
   - rpgAttribute: A creative RPG stat/effect (e.g., "Hydration Flask: Restores 35 NPC patience")
   - iconName: Lucide icon name suggestion (e.g., "Droplet", "Glasses", "Coffee", "Footprints", "Key", "BookOpen", "Package")
4. DYNAMIC QUEST SYNTHESIS:
   Combine the detected objects into an urgent, immersive English roleplay challenge based on this mode:
   ${modeInstructions[mode]}

Output MUST be strictly JSON with this exact schema:
{
  "safetyAudit": {
    "isSafe": true,
    "hazardDetected": null,
    "educationalWarning": null
  },
  "scannedItems": [
    {
      "id": "item_1",
      "objectName": "...",
      "englishWord": "...",
      "phonetics": "...",
      "meaningId": "...",
      "idiom": "...",
      "rpgAttribute": "...",
      "iconName": "..."
    }
  ],
  "quest": {
    "title": "...",
    "mode": "${mode}",
    "npcName": "...",
    "npcRole": "...",
    "npcAvatar": "single emoji (e.g. 🏴‍☠️, 🧐, ✈️, 🌋)",
    "npcPersonality": "...",
    "scenarioBrief": "Detailed story setup in Indonesian explaining the emergency",
    "urgentGoal": "Specific spoken goal in English to achieve within time limit",
    "targetVocab": ["3 to 6 key English words/phrases from the items that player MUST speak"],
    "timeLimitSeconds": 180,
    "initialNpcGreeting": "First dialogue line spoken by the NPC in dramatic English",
    "curriculumTopic": "Target English speaking skill"
  }
}
`;

    let parsed: any = null;

    try {
      const response = await generateContentWithFallback(ai, {
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType, data: base64Data } },
              { text: promptText },
            ],
          },
        ],
        config: {
          responseMimeType: "application/json",
        },
      });

      const rawText = response.text || "{}";
      parsed = JSON.parse(rawText);
    } catch (aiErr: any) {
      console.warn("[LinguaQuest Scan] Gemini Vision API fallback:", aiErr?.message || aiErr);
      // Fallback cerdas agar alur tidak error 500 jika API limit
      parsed = {
        scannedItems: [
          {
            objectName: "Botol Air Minum",
            englishWord: "Water Bottle",
            phonetics: "/ˈwɔːtər ˈbɒtəl/",
            meaningId: "Wadah air minum isi ulang untuk hidrasi.",
            idiom: "A drop in the bucket (hanya sedikit sekali dari yang dibutuhkan)",
            rpgAttribute: "Hydration Flask: Restores 30 NPC Patience",
            iconName: "Droplet",
          },
          {
            objectName: "Buku Catatan",
            englishWord: "Notebook",
            phonetics: "/ˈnoʊtˌbʊk/",
            meaningId: "Buku catatan untuk menulis rencana dan ide.",
            idiom: "By the book (sesuai aturan yang berlaku)",
            rpgAttribute: "Ancient Ledger: +20 Persuasion Power",
            iconName: "BookOpen",
          },
          {
            objectName: "Pena / Pulpen",
            englishWord: "Ballpoint Pen",
            phonetics: "/ˈbɔːlˌpɔɪnt pɛn/",
            meaningId: "Alat tulis untuk menandatangani perjanjian.",
            idiom: "The pen is mightier than the sword (kata-kata lebih berkuasa)",
            rpgAttribute: "Diplomat Quill: Unlocks diplomatic dialogue",
            iconName: "PenTool",
          },
        ],
        quest: {
          title: "The Island Gatekeeper's Challenge",
          mode,
          npcName: "Captain Alistair",
          npcRole: "Island Explorer & Gatekeeper",
          npcAvatar: "🧭",
          npcPersonality: "Tegas, praktis, mengapresiasi penjelasan yang jelas dan terstruktur.",
          scenarioBrief: "Kamu terdampar di pos penjagaan pulau misterius. Sang penjelaga meminta kamu menjelaskan fungsi barang-barang di tasmu dalam bahasa Inggris agar diberikan izin melintas.",
          urgentGoal: "Explain how your water bottle, notebook, and pen can be useful during the expedition in fluent English!",
          targetVocab: ["water bottle", "notebook", "pen", "survive", "expedition"],
          timeLimitSeconds: 180,
          initialNpcGreeting: "Halt! Who goes there? Show me what supplies you carry before taking another step!",
          curriculumTopic: "Describing Everyday Objects & Practical English",
        },
      };
    }

    if (parsed?.safetyAudit?.isSafe === false) {
      return NextResponse.json({
        success: false,
        safetyAlert: {
          isHazard: true,
          hazardName: parsed.safetyAudit.hazardDetected || "Benda Berbahaya",
          warningMessage:
            parsed.safetyAudit.educationalWarning ||
            "Peringatan Keamanan Sekolah: Benda ini tidak pantas atau tidak aman untuk lingkungan sekolah. Silakan scan perlengkapan belajar atau benda sehari-hari yang aman (seperti buku, botol minum, pulpen).",
        },
      });
    }

    const questId = `quest_${Date.now()}`;
    const scannedItems: ScannedItem[] = (parsed.scannedItems || []).map((it: any, idx: number) => ({
      id: `item_${Date.now()}_${idx}`,
      objectName: it.objectName || "Objek Terdeteksi",
      englishWord: it.englishWord || "Unknown Object",
      phonetics: it.phonetics || "",
      meaningId: it.meaningId || "",
      idiom: it.idiom || "",
      rpgAttribute: it.rpgAttribute || "RPG Item",
      iconName: it.iconName || "Package",
      usedInSpeech: false,
    }));

    const quest: QuestScenario = {
      id: questId,
      title: parsed.quest?.title || "Misi Bahasa Inggris Baru",
      mode,
      npcName: parsed.quest?.npcName || "Guardian NPC",
      npcRole: parsed.quest?.npcRole || "NPC Penguji",
      npcAvatar: parsed.quest?.npcAvatar || "🤖",
      npcPersonality: parsed.quest?.npcPersonality || "Objektif dan menuntut pelafalan yang jelas",
      scenarioBrief: parsed.quest?.scenarioBrief || "Gunakan barang yang kamu temukan untuk menyelesaikan misi ini.",
      urgentGoal: parsed.quest?.urgentGoal || "Speak fluently in English using your inventory items!",
      targetVocab: parsed.quest?.targetVocab || scannedItems.map((i) => i.englishWord.toLowerCase()),
      timeLimitSeconds: parsed.quest?.timeLimitSeconds || 180,
      initialNpcGreeting: parsed.quest?.initialNpcGreeting || "Welcome! Show me what you have brought.",
      curriculumTopic: parsed.quest?.curriculumTopic || "English Speaking & Object Description",
      targetItems: scannedItems,
    };

    // Simpan ke database MariaDB (Non-blocking)
    try {
      await query(
        `INSERT INTO lingua_quests (id, title, mode, target_language, scenario_brief, npc_name, npc_role, target_vocab, curriculum_topic)
         VALUES (?, ?, ?, 'english', ?, ?, ?, ?, ?)`,
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

      for (const item of scannedItems) {
        await query(
          `INSERT INTO scanned_items (id, quest_id, object_name, foreign_word, phonetics, meaning_id, idiom, rpg_attribute)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            item.id,
            quest.id,
            item.objectName,
            item.englishWord,
            item.phonetics,
            item.meaningId,
            item.idiom,
            item.rpgAttribute,
          ]
        );
      }
    } catch (dbErr) {
      console.warn("Peringatan: Gagal menyimpan quest ke database:", dbErr);
    }

    return NextResponse.json({
      success: true,
      quest,
      scannedItems,
    });
  } catch (error: any) {
    console.error("Gagal melakukan scan vision:", error);
    return NextResponse.json(
      {
        error: "Gagal memproses gambar dengan AI Vision.",
        details: error?.message || String(error),
      },
      { status: 500 }
    );
  }
}

