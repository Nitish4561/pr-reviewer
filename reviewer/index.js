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
  applyLabels,
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

  // 1️⃣ Fetch PR + files
  const pr = await getPullRequest({ octokit, owner, repo, pull_number });
  const files = await getPullRequestFiles({ octokit, owner, repo, pull_number });
  const commit_id = pr.head.sha;

  if (!files.length) {
    return;
  }

  // 2️⃣ Review files individually
  const summaryIssues = [];
  let hasHighSeverity = false;

  for (const file of files) {
    if (!file.patch) continue; // binary / deleted

    const review = await runReview(file.patch, key); // pass OpenAI key

    if (!review?.issues?.length) {
      continue;
    }

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

  // 3️⃣ Final PR summary
  let summaryBody;
  if (summaryIssues.length === 0) {
    summaryBody = `🤖 **AI PR Review**

✅ No issues found across changed files.`;
  } else {
    summaryBody = `## 🤖 AI PR Review Summary\n\n`;
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

    summaryBody += `---\n`;
    summaryBody += `⚙️ Reviewed automatically by **NirikshanAI**`;
  }

  await createReviewSummary({
    octokit,
    owner,
    repo,
    pull_number,
    body: summaryBody,
  });

  // 4️⃣ Apply labels
  await applyLabels({ octokit, owner, repo, pull_number, hasHighSeverity });
}
