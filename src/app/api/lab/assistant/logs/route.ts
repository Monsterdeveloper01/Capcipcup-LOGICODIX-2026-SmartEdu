import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { requireTeacher } from "@/lib/auth/session";

export async function GET(req: Request) {
  try {
    const auth = await requireTeacher();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const { searchParams } = new URL(req.url);
    const roomCode = searchParams.get("roomCode");
    const taskId = searchParams.get("taskId");
    const studentName = searchParams.get("studentName");

    let sql = `
      SELECT 
        id, 
        user_id as userId, 
        student_name as studentName, 
        room_code as roomCode, 
        task_id as taskId, 
        task_title as taskTitle, 
        prompt as question, 
        response as answer, 
        active_chemicals as activeChemicals, 
        active_reaction as activeReaction, 
        created_at as createdAt 
      FROM ai_interactions 
      WHERE feature_type = 'lab_assistant'
    `;
    const params: any[] = [];

    if (roomCode) {
      sql += " AND UPPER(TRIM(room_code)) = ?";
      params.push(roomCode.trim().toUpperCase());
    }

    if (taskId) {
      sql += " AND task_id = ?";
      params.push(taskId);
    }

    if (studentName) {
      sql += " AND LOWER(TRIM(student_name)) = ?";
      params.push(studentName.trim().toLowerCase());
    }

    sql += " ORDER BY created_at DESC LIMIT 200";

    const rows = await query<any[]>(sql, params);

    // Compute diagnostic pedagogical analytics
    const totalConsultations = rows.length;
    const uniqueStudents = Array.from(new Set(rows.map((r) => r.studentName || "Siswa")));

    // Keyword topic distribution analysis
    const topicKeywords: { [key: string]: string[] } = {
      "Termokimia & Perubahan Suhu": ["suhu", "panas", "dingin", "kalor", "eksoterm", "endoterm"],
      "Reaksi Asam & Basa": ["asam", "basa", "ph", "cuka", "soda", "hcl", "naoh", "netral"],
      "K3 & Keselamatan Kerja": ["bahaya", "k3", "aman", "sarung", "tumpah", "racun", "meledak"],
      "Perubahan Fisik & Endapan": ["endapan", "warna", "gas", "buih", "gelembung", "keruh", "busa"],
      "Mekanisme & Stoikiometri": ["mengapa", "kenapa", "reaksi", "molekul", "rumus", "persamaan", "koefisien"],
    };

    const topicCounts: { [key: string]: number } = {};
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      topicCounts[topic] = 0;
      for (const r of rows) {
        const text = `${r.question || ""} ${r.answer || ""}`.toLowerCase();
        if (keywords.some((kw) => text.includes(kw))) {
          topicCounts[topic]++;
        }
      }
    }

    const parsedLogs = rows.map((r) => {
      let chems = [];
      let rx = null;
      try {
        if (r.activeChemicals) chems = JSON.parse(r.activeChemicals);
      } catch {}
      try {
        if (r.activeReaction) rx = JSON.parse(r.activeReaction);
      } catch {}

      return {
        id: r.id,
        userId: r.userId,
        studentName: r.studentName || "Siswa",
        roomCode: r.roomCode,
        taskId: r.taskId,
        taskTitle: r.taskTitle || "Praktikum Sains",
        question: r.question,
        answer: r.answer,
        activeChemicals: Array.isArray(chems) ? chems : [],
        activeReaction: rx,
        createdAt: r.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      logs: parsedLogs,
      summary: {
        totalConsultations,
        uniqueStudentsCount: uniqueStudents.length,
        uniqueStudents,
        topicBreakdown: topicCounts,
      },
    });
  } catch (err: any) {
    console.error("GET assistant logs error:", err);
    return NextResponse.json({ error: err.message || "Gagal memuat log tanya jawab AI" }, { status: 500 });
  }
}
