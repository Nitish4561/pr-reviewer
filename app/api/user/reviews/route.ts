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
    console.log(`   GitHub username: ${session.githubUsername}`);

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "10");

    // Get all installations to find THIS user's installation
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

    // Find the installation that matches THIS user's GitHub username
    const userInstallation = installations.find((inst: any) => 
      inst.accountLogin === session.githubUsername
    );

    if (!userInstallation) {
      console.log(`   No installation found for ${session.githubUsername}, returning empty reviews`);
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

    // Use THIS user's account login as the reviewer identifier
    const reviewedBy = userInstallation.accountLogin;
    console.log(`   Fetching reviews for: ${reviewedBy} (matched installation)`);

    const reviews = await kvdb.prReview.getByUser(reviewedBy, limit);
    const stats = await kvdb.prReview.getStats(reviewedBy);

    console.log(`   Found ${reviews.length} review(s) for ${reviewedBy}`);

    return NextResponse.json({ reviews, stats });
  } catch (err: any) {
    console.error("❌ Failed to fetch reviews:", err);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

