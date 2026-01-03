import { NextResponse } from "next/server";
import {
  requireAdmin,
  unauthorizedResponse,
  successResponse,
} from "@/lib/auth-middleware";
import { kvdb } from "@/lib/db-kv";

/**
 * PATCH /api/admin/users/[userId]
 * Update user role or status (admin only)
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { userId } = await params;
    const body = await req.json();
    const { role, status } = body;

    // Find the user
    const user = await kvdb.user.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent self-demotion
    if (userId === admin.id && role && role !== "admin") {
      return NextResponse.json(
        { error: "Cannot change your own admin role" },
        { status: 400 }
      );
    }

    // Update role or status
    const updates: any = {};
    if (role) updates.role = role;
    if (status) updates.status = status;

    const updated = await kvdb.user.update(userId, updates);

    console.log(`✅ Admin ${admin.email} updated user ${user.email}:`, updates);

    return successResponse({ user: updated });
  } catch (err: any) {
    return unauthorizedResponse(err.message);
  }
}

/**
 * DELETE /api/admin/users/[userId]
 * Suspend a user (admin only)
 */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const admin = await requireAdmin();
    const { userId } = await params;

    // Find the user
    const user = await kvdb.user.findById(userId);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Prevent self-deletion
    if (userId === admin.id) {
      return NextResponse.json(
        { error: "Cannot suspend yourself" },
        { status: 400 }
      );
    }

    // Suspend the user
    const updated = await kvdb.user.update(userId, { status: "suspended" });

    console.log(`✅ Admin ${admin.email} suspended user ${user.email}`);

    return successResponse({ user: updated });
  } catch (err: any) {
    return unauthorizedResponse(err.message);
  }
}

