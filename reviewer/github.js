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
   PR-level comment (review started notice)
----------------------------------------- */

/**
 * Posts a comment letting users know NirikshanAI has started reviewing.
 * Non-blocking — failures are logged but never abort the review.
 */
export async function createReviewStartedComment({
  octokit,
  owner,
  repo,
  pull_number,
}) {
  console.log(`💬 Posting "review started" notice to PR #${pull_number}`);

  try {
    const { data } = await octokit.issues.createComment({
      owner,
      repo,
      issue_number: pull_number,
      body:
        `## 👀 NirikshanAI is reviewing this PR...\n\n` +
        `Hold tight — I'm analyzing the changed files and will post inline comments ` +
        `along with a summary shortly.\n\n` +
        `---\n` +
        `⚙️ Powered by **NirikshanAI**`,
    });
    console.log(`   ✅ "Review started" notice posted (comment id: ${data.id})`);
    return data.id;
  } catch (err) {
    console.error(`   ❌ Failed to post "review started" notice:`, err.message);
    return null;
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
  comment_id, // optional: if provided, edit this comment in-place instead of creating a new one
}) {
  console.log(`💬 Posting review summary to PR #${pull_number}`);
  console.log(`   Summary length: ${body.length} characters`);
  console.log(`   Mode: ${comment_id ? `update existing comment #${comment_id}` : "create new comment"}`);

  // If we have a comment_id from the "review started" notice, update it in place
  // so there's a single comment per review run that morphs from "reviewing..." → final summary.
  if (comment_id) {
    try {
      await octokit.issues.updateComment({
        owner,
        repo,
        comment_id,
        body,
      });
      console.log(`   ✅ Summary updated in place on comment #${comment_id}`);
      return;
    } catch (err) {
      // Comment may have been deleted by a user. Fall back to creating a new comment.
      console.warn(
        `   ⚠️ Failed to update comment #${comment_id} (${err.message}). Falling back to a new comment.`
      );
    }
  }

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
  hasIssues,
}) {
  console.log(`🏷️  Applying labels to PR #${pull_number}`);
  console.log(`   Has high severity: ${hasHighSeverity}`);
  console.log(`   Has issues: ${hasIssues}`);
  
  // Remove old AI labels first to avoid stale labels
  const aiLabels = ["ai-critical", "ai-reviewed", "ai-approved"];
  
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

  // Determine which labels to add
  let labels;
  if (!hasIssues) {
    // No issues found - PR is approved!
    labels = ["ai-reviewed", "ai-approved"];
  } else if (hasHighSeverity) {
    // Has critical issues
    labels = ["ai-critical"];
  } else {
    // Has minor issues
    labels = ["ai-reviewed"];
  }

  console.log(`   Adding labels: ${labels.join(', ')}`);
  await octokit.issues.addLabels({
    owner,
    repo,
    issue_number: pull_number,
    labels,
  });
  console.log(`   ✅ Labels applied: ${labels.join(', ')}`);
}

/* ----------------------------------------
   Commit Status (GitHub Checks)
----------------------------------------- */

/**
 * Set commit status - this shows up in GitHub PR checks/actions tab
 */
export async function setCommitStatus({
  octokit,
  owner,
  repo,
  sha,
  state, // 'pending', 'success', 'failure', 'error'
  description,
  context = "NirikshanAI Review",
  target_url = null,
}) {
  console.log(`📊 Setting commit status: ${state} for ${sha.substring(0, 7)}`);
  console.log(`   Context: ${context}`);
  console.log(`   Description: ${description}`);
  
  try {
    await octokit.repos.createCommitStatus({
      owner,
      repo,
      sha,
      state,
      description,
      context,
      ...(target_url && { target_url }),
    });
    console.log(`   ✅ Status set to: ${state}`);
  } catch (err) {
    console.error(`   ❌ Failed to set commit status:`, err.message);
    // Don't throw - status is nice to have but shouldn't break review
  }
}
