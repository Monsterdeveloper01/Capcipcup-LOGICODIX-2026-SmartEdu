import { NextResponse } from "next/server";
import { testDbConnection } from "@/lib/db";
import { getServerSessionUser } from "@/lib/auth/session";

export async function GET() {
  const user = await getServerSessionUser();
  const result = await testDbConnection();

  // Jika bukan admin, jangan bocorkan rincian host / user / database internal
  if (!user || (user.role !== "superadmin" && user.role !== "admin")) {
    return NextResponse.json({
      success: result.success,
      message: result.message,
      status: result.success ? "READY" : "ERROR",
    }, {
      status: result.success ? 200 : 500,
    });
  }

  return NextResponse.json(result, {
    status: result.success ? 200 : 500,
  });
}

