import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const owner = process.env.REPO_OWNER;
const repo = process.env.REPO_NAME;
const pull_number = Number(process.env.PR_NUMBER);

/**
 * Fetch the pull request diff
 */
export async function getPullRequestDiff() {
  try {
    const res = await octokit.request(
      "GET /repos/{owner}/{repo}/pulls/{pull_number}",
      {
        owner,
        repo,
        pull_number,
        headers: { accept: "application/vnd.github.v3.diff" },
      }
    );
    return res.data; // Git diff as string
  } catch (err) {
    console.error("❌ Failed to fetch PR diff:", err);
    return null;
  }
}

/**
 * Post a comment to the pull request
 * @param {string} body - Comment content
 */
export async function postReviewComment(body) {
  try {
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: pull_number,
      body,
    });
    console.log("✅ Comment posted successfully");
  } catch (err) {
    console.error("❌ Failed to post PR comment:", err);
  }
}

/**
 * Apply labels based on AI review
 * @param {Object} review - Review object returned by runReview()
 */
export async function applyLabels(review) {
  if (!review) return;

  const labels = [];

  // Example rules
  if (review.summary?.toLowerCase().includes("failed") || review.quality_score === 0) {
    labels.push("ai-failed");
  } else if (review.issues?.length > 0) {
    labels.push("ai-needs-attention");
  } else {
    labels.push("ai-clean");
  }

  if (labels.length === 0) return;

  try {
    await octokit.rest.issues.addLabels({
      owner,
      repo,
      issue_number: pull_number,
      labels,
    });
    console.log("✅ Labels applied:", labels.join(", "));
  } catch (err) {
    console.error("❌ Failed to apply labels:", err);
  }
}
