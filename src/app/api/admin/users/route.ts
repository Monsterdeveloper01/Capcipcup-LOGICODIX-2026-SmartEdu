import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const users = await query<any[]>(
      `SELECT u.id, u.name, u.username, u.email, u.role, u.avatar_url as avatarUrl, 
              u.xp, u.level, u.streak_days as streakDays, u.last_active_at as lastActiveAt, 
              u.created_at as createdAt,
              (SELECT COUNT(*) FROM speaking_sessions s WHERE s.user_id = u.id) as sessionsCount
       FROM users u 
       ORDER BY u.created_at DESC`
    );

    return NextResponse.json({ success: true, users: users || [] });
  } catch (err: any) {
    console.error("Admin fetch users error:", err);
    return NextResponse.json({ error: "Gagal mengambil data user.", details: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, id, name, username, email, password, role, xp } = body;

    if (action === "create") {
      if (!name || !username || !email || !password || !role) {
        return NextResponse.json({ error: "Semua kolom wajib diisi." }, { status: 400 });
      }

      const newId = `usr_${role}_${Date.now()}`;
      const hashedPassword = await bcrypt.hash(password.trim(), 10);

      await query(
        `INSERT INTO users (id, name, username, email, password, role, avatar_url, xp, level, streak_days)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [newId, name, username, email, hashedPassword, role, role === "teacher" ? "👨‍🏫" : role === "superadmin" ? "⚡" : "🎒", xp || 100, 1, 1]
      );

      return NextResponse.json({ success: true, message: `User ${username} berhasil dibuat.` });
    }

    if (action === "update_role") {
      if (!id || !role) {
        return NextResponse.json({ error: "ID dan role wajib disertakan." }, { status: 400 });
      }

      await query(`UPDATE users SET role = ? WHERE id = ?`, [role, id]);
      return NextResponse.json({ success: true, message: `Role user berhasil diubah menjadi ${role}.` });
    }

    if (action === "delete") {
      if (!id) {
        return NextResponse.json({ error: "ID user wajib disertakan." }, { status: 400 });
      }

      await query(`DELETE FROM users WHERE id = ?`, [id]);
      return NextResponse.json({ success: true, message: `User berhasil dihapus.` });
    }

    return NextResponse.json({ error: "Action tidak dikenali." }, { status: 400 });
  } catch (err: any) {
    console.error("Admin user action error:", err);
    return NextResponse.json({ error: "Gagal memproses aksi user.", details: err.message }, { status: 500 });
  }
}

