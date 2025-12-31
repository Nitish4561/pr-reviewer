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
  console.log(`🔍 Fetching PR #${pull_number} details...`);
  const pr = await getPullRequest({ octokit, owner, repo, pull_number });
  const files = await getPullRequestFiles({ octokit, owner, repo, pull_number });
  const commit_id = pr.head.sha;

  console.log(`📂 Files changed: ${files.length}`);
  
  if (!files.length) {
    console.log(`⚠️ No files to review - skipping`);
    return;
  }

  // 2️⃣ Review files individually
  console.log(`🤖 Starting AI review of ${files.length} files...`);
  const summaryIssues = [];
  let hasHighSeverity = false;

  for (const file of files) {
    if (!file.patch) {
      console.log(`   ⏭️  Skipping ${file.filename} (no patch - binary/deleted)`);
      continue; // binary / deleted
    }

    console.log(`   🔎 Reviewing: ${file.filename}`);
    const review = await runReview(file.patch, key); // pass OpenAI key

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

  // 3️⃣ Final PR summary
  console.log(`📊 Creating review summary...`);
  console.log(`   Total issues found: ${summaryIssues.length}`);
  console.log(`   Has high severity: ${hasHighSeverity}`);
  
  let summaryBody;
  if (summaryIssues.length === 0) {
    console.log(`   ✅ No issues found - posting positive summary`);
    summaryBody = `## 🤖 AI PR Review Summary

✅ **All Clear!** No issues found across changed files.

---
⚙️ Reviewed automatically by **NirikshanAI**`;
  } else {
    console.log(`   ⚠️ Issues found - posting detailed summary`);
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

  try {
    await createReviewSummary({
      octokit,
      owner,
      repo,
      pull_number,
      body: summaryBody,
    });
  } catch (err) {
    console.error("❌ Failed to post review summary:", err.message);
    throw err;
  }

  // 4️⃣ Apply labels
  try {
    await applyLabels({ octokit, owner, repo, pull_number, hasHighSeverity });
  } catch (err) {
    console.error("❌ Failed to apply labels:", err.message);
    throw err;
  }
}
