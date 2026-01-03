import { NextResponse } from "next/server";
import {
  requireAdmin,
  unauthorizedResponse,
  successResponse,
} from "@/lib/auth-middleware";
import { kvdb } from "@/lib/db-kv";

/**
 * GET /api/admin/users
 * Get all users (admin only)
 */
export async function GET() {
  try {
    await requireAdmin();

    const users = await kvdb.user.getAll();

    return successResponse({
      users: users.map((u: any) => ({
        id: u.id,
        email: u.email,
        githubUsername: u.githubUsername,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      })),
    });
  } catch (err: any) {
    return unauthorizedResponse(err.message);
  }
}

/**
 * POST /api/admin/users
 * Create a new user manually (admin only)
 */
export async function POST(req: Request) {
  try {
    await requireAdmin();

    const body = await req.json();
    const { email, githubUsername, role } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existing = await kvdb.user.findByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    const user = await kvdb.user.create({
      email,
      githubUsername,
      role: role || "user",
    });

    return successResponse({ user });
  } catch (err: any) {
    return unauthorizedResponse(err.message);
  }
}

