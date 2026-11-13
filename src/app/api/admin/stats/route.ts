import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hasAiKey } from "@/lib/ai/client";
import { requireSuperAdmin } from "@/lib/auth/session";

export async function GET() {
  try {
    const auth = await requireSuperAdmin();
    if (!auth.success) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const [totalUsersRows] = await query<any[]>("SELECT COUNT(*) as cnt FROM users");
    const [studentsRows] = await query<any[]>("SELECT COUNT(*) as cnt FROM users WHERE role = 'student'");
    const [teachersRows] = await query<any[]>("SELECT COUNT(*) as cnt FROM users WHERE role = 'teacher'");
    const [classroomsRows] = await query<any[]>("SELECT COUNT(*) as cnt FROM classrooms");
    const [tasksRows] = await query<any[]>("SELECT COUNT(*) as cnt FROM lab_tasks");
    const [submissionsRows] = await query<any[]>("SELECT COUNT(*) as cnt, AVG(quiz_score) as avgScore FROM lab_submissions");

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers: totalUsersRows?.cnt || 0,
        totalStudents: studentsRows?.cnt || 0,
        totalTeachers: teachersRows?.cnt || 0,
        totalClassrooms: classroomsRows?.cnt || 0,
        totalLabTasks: tasksRows?.cnt || 0,
        totalSubmissions: submissionsRows?.cnt || 0,
        avgQuizScore: Math.round(submissionsRows?.avgScore || 0),
        databaseStatus: "CONNECTED (MariaDB Local 127.0.0.1:3306)",
        geminiAiStatus: hasAiKey() ? "CONFIGURED & ACTIVE" : "PENDING (GEMINI_API_KEY belum disetel)",
      },
    });
  } catch (err: any) {
    console.error("Admin stats error:", err);
    return NextResponse.json({ error: "Gagal mengambil statistik admin.", details: err.message }, { status: 500 });
  }
}
