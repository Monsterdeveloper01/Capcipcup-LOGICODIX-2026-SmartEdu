import { NextResponse } from "next/server";
import { generateQuizQuestions } from "@/lib/ai/gemini";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { topic = "Pendidikan Umum", count = 3 } = body as {
      topic?: string;
      count?: number;
    };

    const questions = await generateQuizQuestions(topic, count);

    return NextResponse.json({
      success: true,
      topic,
      count: questions.length,
      questions,
    });
  } catch (error: any) {
    console.error("AI Quiz Generator API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Gagal membuat kuis otomatis.",
      },
      { status: 500 }
    );
  }
}
