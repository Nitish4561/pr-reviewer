/**
 * reviewer/index.js
 *
 * Pure callable service for PR review.
 * Called from webhook after PR event.
 */

import { runReview } from "./llm.js";
import {
  getPullRequest,
  getPullRequestFiles,
  createReviewComment,
  createReviewSummary,
  createReviewStartedComment,
  applyLabels,
  setCommitStatus,
} from "./github.js";

/**
 * Run AI PR Review
 */
export async function runPRReview({
  octokit,
  owner,
  repo,
  pull_number,
  openaiApiKey, // pass OpenAI key here
}) {
  if (!octokit || !owner || !repo || !pull_number) {
    throw new Error("Missing required PR review parameters");
  }

  const key = openaiApiKey || process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OpenAI API key");

  // 📣 Let watchers know the review has started (non-blocking).
  // We keep the comment id so we can later UPDATE this same comment with the
  // final summary — giving the PR a single comment that morphs from
  // "reviewing..." → final summary instead of two separate comments.
  const startedCommentId = await createReviewStartedComment({
    octokit,
    owner,
    repo,
    pull_number,
  });

  // 1️⃣ Fetch PR + files
  console.log(`🔍 Fetching PR #${pull_number} details...`);
  const pr = await getPullRequest({ octokit, owner, repo, pull_number });
  const files = await getPullRequestFiles({ octokit, owner, repo, pull_number });
  const commit_id = pr.head.sha;

  console.log(`📂 Files changed: ${files.length}`);

  // 🔄 Set status to PENDING at the start
  await setCommitStatus({
    octokit,
    owner,
    repo,
    sha: commit_id,
    state: "pending",
    description: `Reviewing ${files.length} file(s)...`,
  });

  // 2️⃣ Review files individually
  const summaryIssues = [];
  let hasHighSeverity = false;
  let sequenceDiagram = null;

  if (files.length > 0) {
    console.log(`🤖 Starting AI review of ${files.length} files...`);

  for (const file of files) {
      if (!file.patch) {
        console.log(`   ⏭️  Skipping ${file.filename} (no patch - binary/deleted)`);
        continue; // binary / deleted
      }

      console.log(`   🔎 Reviewing: ${file.filename}`);
    const review = await runReview(file.patch, key); // pass OpenAI key

    // Capture sequence diagram from first file that provides one
    if (review?.sequenceDiagram && !sequenceDiagram) {
      sequenceDiagram = review.sequenceDiagram;
      console.log(`   📊 Sequence diagram generated`);
    }

    if (!review?.issues?.length) {
        console.log(`   ✅ No issues found in ${file.filename}`);
      continue;
    }
      
      console.log(`   ⚠️  Found ${review.issues.length} issues in ${file.filename}`);

    for (const issue of review.issues) {
      if (!issue.line) {
        console.warn(`   ⚠️ Skipping issue without line number`);
        continue;
      }

      if (issue.severity === "high") hasHighSeverity = true;

      // Post inline comment
      await createReviewComment({
        octokit,
        owner,
        repo,
        pull_number,
        commit_id,
        path: file.filename,
        line: issue.line,
        body: `**🔴 ${issue.severity.toUpperCase()}**

${issue.description}

**💡 Suggestion:**
${issue.suggestion}`,
      });

      summaryIssues.push({
        file: file.filename,
        line: issue.line,
        title: issue.description,
        severity: issue.severity || "medium",
      });
    }
    }
  } else {
    console.log(`⚠️ No files changed in this PR update - will post clean review summary`);
  }

  // 3️⃣ Final PR summary
  console.log(`📊 Creating review summary...`);
  console.log(`   Total issues found: ${summaryIssues.length}`);
  console.log(`   Has high severity: ${hasHighSeverity}`);
  
  let summaryBody;
  if (summaryIssues.length === 0) {
    console.log(`   ✅ No issues found - posting positive summary`);
    summaryBody = `## 🤖 NirikshanAI PR Review Summary

✅ **All Clear!** No issues found across changed files.`;
    
    // Add sequence diagram if available
    if (sequenceDiagram) {
      summaryBody += `\n\n## 🔄 System Flow\n\n\`\`\`mermaid\n${sequenceDiagram}\n\`\`\``;
    }
    
    summaryBody += `\n\n---\n⚙️ Reviewed automatically by **NirikshanAI**`;
  } else {
    console.log(`   ⚠️ Issues found - posting detailed summary`);
    summaryBody = `## 🤖 NirikshanAI PR Review Summary\n\n`;
    const grouped = {};
    for (const issue of summaryIssues) {
      grouped[issue.file] = grouped[issue.file] || [];
      grouped[issue.file].push(issue);
    }

    for (const file in grouped) {
      summaryBody += `### 📄 ${file}\n`;
      grouped[file].forEach((i) => {
        summaryBody += `- **${i.severity.toUpperCase()}** (Line ${i.line}) — ${i.title}\n`;
      });
      summaryBody += "\n";
    }

    // Add sequence diagram if available
    if (sequenceDiagram) {
      summaryBody += `## 🔄 System Flow\n\n\`\`\`mermaid\n${sequenceDiagram}\n\`\`\`\n\n`;
    }

    summaryBody += `---\n`;
    summaryBody += `⚙️ Reviewed automatically by **NirikshanAI**`;
  }

  try {
  await createReviewSummary({
    octokit,
    owner,
    repo,
    pull_number,
    body: summaryBody,
    comment_id: startedCommentId, // update the "reviewing..." comment in place when available
  });
  } catch (err) {
    console.error("❌ Failed to post review summary:", err.message);
    throw err;
  }

  // 4️⃣ Apply labels
  try {
    const hasIssues = summaryIssues.length > 0;
    await applyLabels({ octokit, owner, repo, pull_number, hasHighSeverity, hasIssues });
  } catch (err) {
    console.error("❌ Failed to apply labels:", err.message);
    throw err;
  }

  // 5️⃣ Set final commit status based on results
  const hasIssues = summaryIssues.length > 0;
  let statusState;
  let statusDescription;

  if (!hasIssues) {
    statusState = "success";
    statusDescription = "✅ All clear! No issues found.";
  } else if (hasHighSeverity) {
    statusState = "failure";
    statusDescription = `❌ Found ${summaryIssues.length} issue(s) including critical ones`;
  } else {
    statusState = "success";
    statusDescription = `⚠️ Found ${summaryIssues.length} minor issue(s)`;
  }

  await setCommitStatus({
    octokit,
    owner,
    repo,
    sha: commit_id,
    state: statusState,
    description: statusDescription,
  });

  // 6️⃣ Return review results for database storage
  return {
    issuesFound: summaryIssues.length,
    hasHighSeverity,
    prTitle: pr.title || "Untitled PR",
  };
}
