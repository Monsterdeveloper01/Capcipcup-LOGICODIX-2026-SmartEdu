import { NextResponse } from "next/server";
import { chatWithTutor, ChatMessage } from "@/lib/ai/gemini";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, subject, mode } = body as {
      messages: ChatMessage[];
      subject?: string;
      mode?: "explain" | "quiz" | "visualize" | "story";
    };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: "Parameter 'messages' array wajib disertakan." },
        { status: 400 }
      );
    }

    const reply = await chatWithTutor({ messages, subject, mode });

    return NextResponse.json({
      success: true,
      reply,
    });
  } catch (error: any) {
    console.error("AI Tutor API Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Terjadi kesalahan saat memproses jawaban AI.",
      },
      { status: 500 }
    );
  }
}
