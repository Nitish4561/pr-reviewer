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
  console.log(`💬 Posting review summary to PR #${pull_number}`);
  console.log(`   Summary length: ${body.length} characters`);
  
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: pull_number,
    body,
  });
  
  console.log(`   ✅ Summary posted successfully`);
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
  console.log(`🏷️  Applying labels to PR #${pull_number}`);
  console.log(`   Has high severity: ${hasHighSeverity}`);
  
  // Remove old AI labels first to avoid stale labels
  const aiLabels = ["ai-critical", "ai-reviewed"];
  
  try {
    // Get current labels
    console.log(`   Fetching current labels...`);
    const { data: issue } = await octokit.issues.get({
      owner,
      repo,
      issue_number: pull_number,
    });
    
    const currentLabels = issue.labels.map(l => typeof l === 'string' ? l : l.name);
    console.log(`   Current labels: ${currentLabels.join(', ') || 'none'}`);
    
    // Remove any existing AI labels
    for (const label of issue.labels) {
      const labelName = typeof label === 'string' ? label : label.name;
      if (aiLabels.includes(labelName)) {
        console.log(`   Removing label: ${labelName}`);
        await octokit.issues.removeLabel({
          owner,
          repo,
          issue_number: pull_number,
          name: labelName,
        });
        console.log(`   ✅ Removed: ${labelName}`);
      }
    }
  } catch (err) {
    console.warn("⚠️ Could not remove old labels:", err.message);
  }

  // Add the new label
  const labels = hasHighSeverity
    ? ["ai-critical"]
    : ["ai-reviewed"];

  console.log(`   Adding label: ${labels[0]}`);
  await octokit.issues.addLabels({
    owner,
    repo,
    issue_number: pull_number,
    labels,
  });
  console.log(`   ✅ Label applied: ${labels[0]}`);
}
