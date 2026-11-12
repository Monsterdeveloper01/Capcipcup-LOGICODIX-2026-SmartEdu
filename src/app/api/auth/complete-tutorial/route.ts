import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { query } from "@/lib/db";
import { getServerSessionUser } from "@/lib/auth/session";

export async function POST() {
  try {
    const user = await getServerSessionUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Update database permanently for this user account
    await query("UPDATE users SET has_completed_tutorial = 1 WHERE id = ?", [user.id]);

    // Update session cookie
    const cookieStore = await cookies();
    const updatedUser = {
      ...user,
      hasCompletedTutorial: true,
    };

    const res = NextResponse.json({
      success: true,
      message: "Status tutorial berhasil disimpan ke akun database.",
      user: updatedUser,
    });

    res.cookies.set("lq_session_user", JSON.stringify(updatedUser), {
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
      path: "/",
    });

    return res;
  } catch (error: any) {
    console.error("complete-tutorial error:", error);
    return NextResponse.json(
      { error: "Gagal menyimpan status tutorial ke database" },
      { status: 500 }
    );
  }
}

