import { NextResponse } from "next/server";
import {
  requireAdmin,
  unauthorizedResponse,
  successResponse,
} from "@/lib/auth-middleware";
import { prReviewDb } from "@/lib/db-enhanced";

/**
 * GET /api/admin/reviews
 * Get all PR reviews (admin only)
 */
export async function GET(req: Request) {
  try {
    await requireAdmin();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    const reviews = await prReviewDb.getAll(limit);
    const stats = await prReviewDb.getStats();

    return successResponse({ reviews, stats });
  } catch (err: any) {
    return unauthorizedResponse(err.message);
  }
}

