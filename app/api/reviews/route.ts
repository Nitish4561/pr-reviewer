import { NextResponse } from "next/server";
import { getInstallationOctokit } from "@/lib/github";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const installationIdParam = searchParams.get("installationId");

    if (!installationIdParam) {
      return NextResponse.json(
        { error: "Installation ID required" },
        { status: 400 }
      );
    }

    const installationId = parseInt(installationIdParam);

    // Get installation from database
    const installation = await db.installation.findUnique({
      where: { installationId },
    });

    if (!installation) {
      return NextResponse.json(
        { error: "Installation not found" },
        { status: 404 }
      );
    }

    // Get GitHub client
    const octokit = await getInstallationOctokit(installationId);

    // Get repositories for this installation
    const { data: reposData } = await octokit.rest.apps.listReposAccessibleToInstallation();
    
    // Search through repos to find the last review comment
    let lastReview = null;

    for (const repo of reposData.repositories.slice(0, 5)) { // Check up to 5 repos
      try {
        // Get recent PRs
        const { data: prs } = await octokit.rest.pulls.list({
          owner: repo.owner.login,
          repo: repo.name,
          state: "all",
          sort: "updated",
          direction: "desc",
          per_page: 10,
        });

        // Look for PRs with bot comments
        for (const pr of prs) {
          const { data: comments } = await octokit.rest.issues.listComments({
            owner: repo.owner.login,
            repo: repo.name,
            issue_number: pr.number,
            per_page: 50,
          });

          // Find bot review comments (look for comments with "AI PR Review" and from a bot)
          const botComments = comments.filter(
            (c) => c.user?.type === "Bot" && c.body?.includes("AI PR Review")
          );

          if (botComments.length > 0) {
            const latestComment = botComments[botComments.length - 1];
            
            lastReview = {
              prNumber: pr.number,
              prTitle: pr.title,
              prUrl: pr.html_url,
              repoName: `${repo.owner.login}/${repo.name}`,
              reviewedAt: latestComment.created_at,
              commentUrl: latestComment.html_url,
            };
            break;
          }
        }

        if (lastReview) break;
      } catch (err) {
        console.error(`Error checking repo ${repo.full_name}:`, err);
        continue;
      }
    }

    return NextResponse.json({ lastReview });
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

