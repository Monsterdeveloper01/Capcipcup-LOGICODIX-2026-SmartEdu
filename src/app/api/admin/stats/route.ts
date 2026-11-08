import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hasAiKey } from "@/lib/ai/client";

export async function GET() {
  try {
    const [totalUsersRows] = await query<any[]>("SELECT COUNT(*) as cnt FROM users");
    const [studentsRows] = await query<any[]>("SELECT COUNT(*) as cnt FROM users WHERE role = 'student'");
    const [teachersRows] = await query<any[]>("SELECT COUNT(*) as cnt FROM users WHERE role = 'teacher'");
    const [adminsRows] = await query<any[]>("SELECT COUNT(*) as cnt FROM users WHERE role IN ('admin', 'superadmin')");

    const [questsRows] = await query<any[]>("SELECT COUNT(*) as cnt FROM lingua_quests");
    const [scannedItemsRows] = await query<any[]>("SELECT COUNT(*) as cnt FROM scanned_items");
    const [sessionsRows] = await query<any[]>("SELECT COUNT(*) as cnt, AVG(overall_score) as avgScore, AVG(fluency_score) as avgFluency FROM speaking_sessions");

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: totalUsersRows?.cnt || 0,
        totalStudents: studentsRows?.cnt || 0,
        totalTeachers: teachersRows?.cnt || 0,
        totalAdmins: adminsRows?.cnt || 0,
        totalQuests: questsRows?.cnt || 0,
        totalScannedItems: scannedItemsRows?.cnt || 0,
        totalSpeakingSessions: sessionsRows?.cnt || 0,
        avgOverallScore: Math.round(sessionsRows?.avgScore || 0),
        avgFluencyScore: Math.round(sessionsRows?.avgFluency || 0),
        databaseStatus: "CONNECTED (MariaDB 10.11 at 10.80.80.3:3306)",
        geminiVisionStatus: hasAiKey() ? "CONFIGURED & ACTIVE" : "PENDING (GEMINI_API_KEY belum disetel)",
      },
    });
  } catch (err: any) {
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: "Gagal mengambil statistik admin.", details: err.message }, { status: 500 });
  }
}

