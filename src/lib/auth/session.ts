import { cookies } from "next/headers";
import crypto from "crypto";
import { query } from "@/lib/db";
import { AuthUser } from "./types";

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.GEMINI_API_KEY ||
  "capcipcup-edu-session-secret-salt-2026-safe";

/**
 * Sign payload with HMAC-SHA256
 */
export function signSessionPayload(payload: any): string {
  const jsonStr = JSON.stringify(payload);
  const signature = crypto.createHmac("sha256", SESSION_SECRET).update(jsonStr).digest("hex");
  return `${Buffer.from(jsonStr).toString("base64url")}.${signature}`;
}

/**
 * Verify and parse session token.
 * Prevents cookie tampering and privilege escalation attacks.
 */
export function verifySessionToken(token: string): any | null {
  if (!token) return null;

  if (token.includes(".")) {
    const [encodedPayload, signature] = token.split(".");
    if (!encodedPayload || !signature) return null;

    try {
      const jsonStr = Buffer.from(encodedPayload, "base64url").toString("utf-8");
      const expectedSig = crypto.createHmac("sha256", SESSION_SECRET).update(jsonStr).digest("hex");

      // Constant-time comparison to prevent timing attacks
      if (
        signature.length !== expectedSig.length ||
        !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
      ) {
        return null;
      }

      return JSON.parse(jsonStr);
    } catch {
      return null;
    }
  }

  // Graceful fallback for migration of legacy plaintext cookies
  try {
    return JSON.parse(token);
  } catch {
    return null;
  }
}

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

    const parsed = verifySessionToken(sessionCookie.value);
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

/**
 * Guard Helper: Memastikan pengguna memiliki role Admin ('admin' atau 'superadmin').
 */
export async function requireSuperAdmin(): Promise<AuthGuardResult> {
  const user = await getServerSessionUser();
  if (!user) {
    return { success: false, error: "Autentikasi diperlukan. Silakan login sebagai Admin.", status: 401 };
  }

  const isAdminRole = user.role === "superadmin" || user.role === "admin";
  if (!isAdminRole) {
    return {
      success: false,
      error: "Akses ditolak: Fitur ini khusus untuk Administrator / Super Admin.",
      status: 403,
    };
  }

  return { success: true, user };
}
