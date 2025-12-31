/**
 * GitHub helpers for NirikshanAI
 * Works with GitHub App installation tokens
 */

import { Octokit } from "@octokit/rest";

/* ----------------------------------------
   Pull Request helpers
----------------------------------------- */

export async function getPullRequest({ octokit, owner, repo, pull_number }) {
  const { data } = await octokit.pulls.get({
    owner,
    repo,
    pull_number,
  });
  return data;
}

export async function getPullRequestFiles({ octokit, owner, repo, pull_number }) {
  const { data } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number,
    per_page: 100,
  });
  return data;
}

/* ----------------------------------------
   Inline Review Comment (IMPORTANT)
----------------------------------------- */

/**
 * Create an inline review comment
 * This is the ONLY correct way to do it
 */
export async function createReviewComment({
  octokit,
  owner,
  repo,
  pull_number,
  commit_id,
  path,
  line,
  body,
}) {
  try {
    await octokit.pulls.createReviewComment({
      owner,
      repo,
      pull_number,
      commit_id,
      path,
      line,
      side: "RIGHT", // required
      body,
    });
  } catch (err) {
    console.error("❌ Inline comment failed");
    console.error({
      owner,
      repo,
      pull_number,
      path,
      line,
      error: err.message,
    });
  }
}

/* ----------------------------------------
   PR-level comment (summary)
----------------------------------------- */

export async function createReviewSummary({
  octokit,
  owner,
  repo,
  pull_number,
  body,
}) {
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: pull_number,
    body,
  });
}

/* ----------------------------------------
   Labels (optional)
----------------------------------------- */

export async function applyLabels({
  octokit,
  owner,
  repo,
  pull_number,
  hasHighSeverity,
}) {
  // Remove old AI labels first to avoid stale labels
  const aiLabels = ["ai-critical", "ai-reviewed"];
  
  try {
    // Get current labels
    const { data: issue } = await octokit.issues.get({
      owner,
      repo,
      issue_number: pull_number,
    });
    
    // Remove any existing AI labels
    for (const label of issue.labels) {
      const labelName = typeof label === 'string' ? label : label.name;
      if (aiLabels.includes(labelName)) {
        await octokit.issues.removeLabel({
          owner,
          repo,
          issue_number: pull_number,
          name: labelName,
        });
      }
    }
  } catch (err) {
    console.warn("⚠️ Could not remove old labels:", err.message);
  }

  // Add the new label
  const labels = hasHighSeverity
    ? ["ai-critical"]
    : ["ai-reviewed"];

  await octokit.issues.addLabels({
    owner,
    repo,
    issue_number: pull_number,
    labels,
  });
}
