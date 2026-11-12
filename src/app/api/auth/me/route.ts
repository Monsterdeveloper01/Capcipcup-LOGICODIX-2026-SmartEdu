import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { AuthUser } from "@/lib/auth/types";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("lq_session_user");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    let parsed: any;
    try {
      parsed = JSON.parse(sessionCookie.value);
    } catch {
      return NextResponse.json({ authenticated: false, user: null });
    }

    if (!parsed?.id) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    // Refresh from DB
    const users = await query<any[]>(
      `SELECT id, name, username, email, role, avatar_url as avatarUrl, xp, level, streak_days as streakDays, has_completed_tutorial as hasCompletedTutorial
       FROM users 
       WHERE id = ? 
       LIMIT 1`,
      [parsed.id]
    );

    if (!users || users.length === 0) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const dbUser = users[0];
    const user: AuthUser = {
      id: dbUser.id,
      name: dbUser.name,
      username: dbUser.username,
      email: dbUser.email,
      role: dbUser.role,
      avatarUrl: dbUser.avatarUrl || "👤",
      xp: dbUser.xp || 0,
      level: dbUser.level || 1,
      streakDays: dbUser.streakDays || 1,
      hasCompletedTutorial: Boolean(dbUser.hasCompletedTutorial),
    };

    return NextResponse.json({ authenticated: true, user });
  } catch (err: any) {
    console.error("Auth me error:", err);
    return NextResponse.json({ authenticated: false, user: null });
  }
}

