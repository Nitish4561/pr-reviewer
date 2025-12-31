import { NextResponse } from "next/server";
import {
  requireAuth,
  unauthorizedResponse,
  successResponse,
} from "@/lib/auth-middleware";
import { prReviewDb } from "@/lib/db-enhanced";

/**
 * GET /api/user/reviews
 * Get PR reviews for current user
 */
export async function GET(req: Request) {
  try {
    const user = await requireAuth();
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    const reviews = await prReviewDb.getByUser(
      user.githubUsername || user.email,
      limit
    );
    const stats = await prReviewDb.getStats(
      user.githubUsername || user.email
    );

    return successResponse({ reviews, stats });
  } catch (err: any) {
    return unauthorizedResponse(err.message);
  }
}

