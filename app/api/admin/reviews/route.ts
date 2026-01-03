import { NextResponse } from "next/server";
import {
  requireAdmin,
  unauthorizedResponse,
  successResponse,
} from "@/lib/auth-middleware";
import { kvdb } from "@/lib/db-kv";

/**
 * GET /api/admin/reviews
 * Get all PR reviews (admin only)
 */
export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    // For admin, pass empty string to get all reviews
    const reviews = await kvdb.prReview.getByUser("", limit);
    const stats = await kvdb.prReview.getStats("");

    return successResponse({ reviews, stats });
  } catch (err: any) {
    return unauthorizedResponse(err.message);
  }
}

