import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-middleware";
import { kvdb } from "@/lib/db-kv";

/**
 * GET /api/user/reviews
 * Get PR reviews for current user (from Redis - persistent storage)
 */
export async function GET(req: Request) {
  try {
    console.log("📊 Fetching user reviews...");
    
    const session = await getSession();
    
    if (!session) {
      console.error("❌ No session found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log(`   User: ${session.email}`);

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get all installations to find the user's installation
    const installations = await kvdb.installation.getAll();
    
    if (installations.length === 0) {
      console.log("   No installation found, returning empty reviews");
      return NextResponse.json({
        reviews: [],
        stats: {
          totalReviews: 0,
          cleanPRs: 0,
          criticalIssues: 0,
          totalIssues: 0,
        }
      });
    }

    // Use the account login from the installation as the reviewer identifier
    const reviewedBy = installations[0].accountLogin;
    console.log(`   Fetching reviews for: ${reviewedBy}`);

    const reviews = await kvdb.prReview.getByUser(reviewedBy, limit);
    const stats = await kvdb.prReview.getStats(reviewedBy);

    console.log(`   Found ${reviews.length} review(s)`);

    return NextResponse.json({ reviews, stats });
  } catch (err: any) {
    console.error("❌ Failed to fetch reviews:", err);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

