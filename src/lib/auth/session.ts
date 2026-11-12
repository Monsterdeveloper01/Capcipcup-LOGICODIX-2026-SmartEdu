import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { AuthUser } from "./types";

/**
 * Mendapatkan data session user yang sedang login dari cookie 'lq_session_user'
 * dan memvalidasi langsung ke tabel database users.
 */
export async function getServerSessionUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("lq_session_user");

    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(sessionCookie.value);
    } catch {
      return null;
    }

    if (!parsed?.id) {
      return null;
    }

    const rows = await query<any[]>(
      `SELECT id, name, username, email, role, avatar_url as avatarUrl, xp, level, streak_days as streakDays, has_completed_tutorial as hasCompletedTutorial 
       FROM users 
       WHERE id = ? 
       LIMIT 1`,
      [parsed.id]
    );

    if (!rows || rows.length === 0) {
      return null;
    }

    const dbUser = rows[0];
    return {
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
  } catch (err) {
    console.warn("getServerSessionUser error:", err);
    return null;
  }
}

export type AuthGuardResult =
  | { success: true; user: AuthUser; error?: undefined; status?: undefined }
  | { success: false; user?: undefined; error: string; status: number };

/**
 * Guard Helper: Memastikan pengguna sudah login.
 */
export async function requireAuth(): Promise<AuthGuardResult> {
  const user = await getServerSessionUser();
  if (!user) {
    return { success: false, error: "Autentikasi diperlukan. Silakan login terlebih dahulu.", status: 401 };
  }
  return { success: true, user };
}

/**
 * Guard Helper: Memastikan pengguna memiliki role Guru ('teacher', 'admin', atau 'superadmin').
 * Siswa ('student') akan ditolak dengan status 403 Forbidden.
 */
export async function requireTeacher(): Promise<AuthGuardResult> {
  const user = await getServerSessionUser();
  if (!user) {
    return { success: false, error: "Autentikasi diperlukan. Silakan login sebagai Guru.", status: 401 };
  }

  const isTeacherRole = user.role === "teacher" || user.role === "admin" || user.role === "superadmin";
  if (!isTeacherRole) {
    return {
      success: false,
      error: "Akses ditolak: Fitur ini khusus untuk akun Guru. Siswa tidak diizinkan merancang atau memodifikasi tugas praktikum.",
      status: 403,
    };
  }

  return { success: true, user };
}
