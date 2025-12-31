import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth-middleware";

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
export async function GET() {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        githubUsername: user.githubUsername,
        role: user.role,
        status: user.status,
      },
    });
  } catch (err) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}

