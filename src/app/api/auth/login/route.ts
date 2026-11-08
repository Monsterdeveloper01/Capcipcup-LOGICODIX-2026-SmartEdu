import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { AuthUser } from "@/lib/auth/types";

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username dan password wajib diisi." },
        { status: 400 }
      );
    }

    const cleanUser = username.trim();
    const cleanPass = password.trim();

    const users = await query<any[]>(
      `SELECT id, name, username, email, role, avatar_url as avatarUrl, xp, level, streak_days as streakDays 
       FROM users 
       WHERE (username = ? OR email = ?) AND password = ? 
       LIMIT 1`,
      [cleanUser, cleanUser, cleanPass]
    );

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: "Kredensial tidak valid. Silakan periksa username dan password Anda." },
        { status: 401 }
      );
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
    };

    // Update last_active_at
    await query(`UPDATE users SET last_active_at = NOW() WHERE id = ?`, [user.id]).catch(() => {});

    const response = NextResponse.json({
      success: true,
      message: `Login berhasil sebagai ${user.name} (${user.role})`,
      user,
    });

    // Set cookie
    response.cookies.set("lq_session_user", JSON.stringify(user), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Login route error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat login.", details: err.message },
      { status: 500 }
    );
  }
}

