import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";
import { AuthUser } from "@/lib/auth/types";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, username, email, password, role = "student" } = body;

    const cleanName = (name || "").trim();
    const cleanUser = (username || "").trim().toLowerCase();
    const cleanEmail = (email || "").trim().toLowerCase();
    const cleanPass = (password || "").trim();
    const effectiveRole = role === "teacher" ? "teacher" : "student";

    if (!cleanName || !cleanUser || !cleanEmail || !cleanPass) {
      return NextResponse.json(
        { error: "Nama lengkap, username, email, dan kata sandi wajib diisi." },
        { status: 400 }
      );
    }

    if (cleanPass.length < 6) {
      return NextResponse.json(
        { error: "Kata sandi minimal harus 6 karakter." },
        { status: 400 }
      );
    }

    // Cek apakah username atau email sudah digunakan
    const existing = await query<any[]>(
      "SELECT id, username, email FROM users WHERE username = ? OR email = ? LIMIT 1",
      [cleanUser, cleanEmail]
    );

    if (existing && existing.length > 0) {
      const match = existing[0];
      if (match.username.toLowerCase() === cleanUser) {
        return NextResponse.json(
          { error: `Username '${cleanUser}' sudah digunakan. Silakan pilih username lain.` },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: `Email '${cleanEmail}' sudah terdaftar. Silakan gunakan email lain atau langsung masuk.` },
        { status: 400 }
      );
    }

    const userId = `usr_${effectiveRole}_${Date.now()}`;
    const passwordHash = await bcrypt.hash(cleanPass, 10);

    await query(
      `INSERT INTO users (id, name, username, email, password, role, xp, level, streak_days)
       VALUES (?, ?, ?, ?, ?, ?, 100, 1, 1)`,
      [userId, cleanName, cleanUser, cleanEmail, passwordHash, effectiveRole]
    );

    const user: AuthUser = {
      id: userId,
      name: cleanName,
      username: cleanUser,
      email: cleanEmail,
      role: effectiveRole,
      avatarUrl: effectiveRole === "teacher" ? "👨‍🏫" : "🧑‍🎓",
      xp: 100,
      level: 1,
      streakDays: 1,
    };

    const response = NextResponse.json({
      success: true,
      message: `Pendaftaran berhasil! Selamat datang di Capcipcup SmartEdu, ${user.name}.`,
      user,
    });

    // Set auth cookie
    response.cookies.set("lq_session_user", JSON.stringify(user), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (err: any) {
    console.error("Register route error:", err);
    return NextResponse.json(
      { error: "Terjadi kesalahan server saat mendaftar akun baru.", details: err.message },
      { status: 500 }
    );
  }
}

