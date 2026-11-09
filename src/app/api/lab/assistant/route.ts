import { NextResponse } from "next/server";
import { getAiClient, hasAiKey, generateContentWithFallback } from "@/lib/ai/client";

export async function POST(req: Request) {
  try {
    const { question, activeChemicals, currentStep } = await req.json();

    if (!question || !question.trim()) {
      return NextResponse.json({ error: "Pertanyaan tidak boleh kosong" }, { status: 400 });
    }

    if (!hasAiKey()) {
      return NextResponse.json({
        success: true,
        answer: "Halo! Saya Asisten Lab Virtualmu. Zat kimia di mejamu dapat bereaksi jika memiliki sifat komplementer (seperti asam bertemu basa membentuk garam netral). Pastikan kamu mendekatkan bejana untuk menuangkannya!",
      });
    }

    const ai = getAiClient();
    const prompt = `Anda adalah "Kak Lab-AI", asisten laboratorium sains virtual yang ramah, antusias, dan cerdas untuk siswa sekolah (SD/SMP/SMA).
Siswa sedang berada di meja praktikum kimia 3D.
Zat yang tersedia di meja siswa: ${JSON.stringify(activeChemicals || [])}
Status praktikum siswa saat ini: "${currentStep || "sedang bereksperimen"}"

Pertanyaan siswa:
"${question}"

INSTRUKSI JAWABAN:
1. Jawab dengan ramah, komunikatif, dan langsung ke inti konsep sainsnya (maksimal 2-3 paragraf singkat).
2. Jika siswa bertanya tentang bahaya di dunia nyata, berikan edukasi keselamatan lab (K3) dengan bijak.
3. Gunakan bahasa Indonesia yang mudah dicerna siswa tanpa rumus stoikiometri yang terlalu rumit, tetapi tetap akurat secara ilmiah.`;

    const res = await generateContentWithFallback(ai, { contents: prompt });

    return NextResponse.json({
      success: true,
      answer: res.text || "Tidak ada respon dari AI.",
    });
  } catch (err: any) {
    console.error("Lab assistant AI error:", err);
    return NextResponse.json({
      success: true,
      answer: "Reaksi kimia terjadi ketika molekul saling bertukar ikatan. Coba dekatkan bejana reagen ke bejana lainnya untuk mengamati perubahan warnanya!",
    });
  }
}
