import { NextResponse } from "next/server";
import { kvdb } from "@/lib/db-kv";

/**
 * Check if email is an admin
 */
function isAdmin(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

/**
 * POST /api/admin/revoke-access
 * Revoke user access (admin only)
 */
export async function POST(req: Request) {
  try {
    const { email, revokedBy } = await req.json();

    if (!email || !revokedBy) {
      return NextResponse.json(
        { error: "Email and revokedBy are required" },
        { status: 400 }
      );
    }

    // Verify admin
    if (!isAdmin(revokedBy)) {
      console.warn(`⚠️ Unauthorized revoke attempt by: ${revokedBy}`);
      return NextResponse.json(
        { error: "Unauthorized - You are not an admin" },
        { status: 403 }
      );
    }

    console.log(`🔐 Admin ${revokedBy} revoking access for: ${email}`);

    // Remove from whitelist
    await kvdb.whitelist.remove(email);

    console.log(`✅ Access revoked for ${email}`);

    return NextResponse.json({
      success: true,
      message: `Access revoked for ${email}`,
    });
  } catch (error: any) {
    console.error("Error revoking access:", error);
    return NextResponse.json(
      { error: error.message || "Failed to revoke access" },
      { status: 500 }
    );
  }
}

