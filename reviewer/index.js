// import { getPullRequestDiff, postReviewComment, applyLabels } from "./github.js";
// import { runReview, FALLBACK_REVIEW } from "./llm.js";

// console.log("🔥 reviewer/index.js LOADED");

// async function main() {
//   console.log("🚀 Reviewer started");

//   // Fetch the PR diff
//   const diff = await getPullRequestDiff();
//   console.log("📄 Diff length:", diff?.length ?? "undefined");

//   // Skip very small diffs
//   if (!diff || diff.length < 10) {
//     console.log("⚠️ PR diff too small, skipping review.");
//     return;
//   }

//   // Run the AI review
//   const review = await runReview(diff);
//   console.log("🤖 AI review completed:", review);

//   // Build the PR comment
//   const commentBody = `
// ## 🤖 AI PR Review

// **Summary:**  
// ${review.summary ?? "No summary provided"}

// **Quality Score:** ${review.quality_score ?? 0}/10  
// **Should Block Merge:** ${review.should_block_merge ? "❌ Yes" : "✅ No"}

// ### ⚠️ Issues
// ${
//   review.issues?.length > 0
//     ? review.issues.map(i => `- [${i.severity}] ${i.description}\n  👉 ${i.suggestion}`).join("\n")
//     : "_No issues found._"
// }

// ### 👍 Positives
// ${
//   review.positive_notes?.length > 0
//     ? review.positive_notes.map(p => `- ${p}`).join("\n")
//     : "_No positives mentioned._"
// }
// `;

//   // Post the comment to GitHub
//   console.log("📝 Posting PR comment...");
//   await postReviewComment(commentBody);
//   console.log("✅ PR comment posted");

//   // Optional: Apply labels based on review
//   if (typeof applyLabels === "function") {
//     console.log("🏷️ Applying labels based on review...");
//     await applyLabels(review);
//     console.log("✅ Labels applied");
//   }
// }

// main().catch(err => {
//   console.error("❌ Reviewer failed:", err);
//   process.exit(1);
// });
// import {
//   getPullRequest,
//   getPullRequestFiles,
//   postInlineComment,
//   postInlineCommentAtLine,
//   postReviewComment,
//   updatePRDescription,
//   applyLabels,
// } from "./github.js";

// import { runReview } from "./llm.js";
// import { generatePRReview } from "./pr-description.js";

// async function main() {
//   const pr = await getPullRequest();
//   const files = await getPullRequestFiles();
//   const commit_id = pr.head.sha;

//   /* ---------- OVERALL PR REVIEW ---------- */

//   const SHOULD_GENERATE_REVIEW =
//     !pr.body || pr.body.includes("<!-- ai-generated -->");

//   let overallReview = null;

//   if (SHOULD_GENERATE_REVIEW) {
//     overallReview = await generatePRReview({
//       title: pr.title,
//       originalBody: pr.body,
//       files,
//     });

//     if (overallReview) {
//       await updatePRDescription(
//         `<!-- ai-generated -->\n${overallReview.summary}`
//       );
//     } else {
//       console.warn("⚠️ Failed to generate overall PR review - review will be skipped");
//     }
//   }


//   let filesWithIssues = 0;
//   let hasHighSeverity = false;
//   let inlinePosted = 0;
//   let inlineFailed = 0;

//   for (const file of files) {
//     if (!file.patch) continue;

//     const review = await runReview(file.patch);

//     if (!review?.issues?.length) continue;

//     filesWithIssues++;

//     if (review.issues.some(i => i.severity === "high")) {
//       hasHighSeverity = true;
//     }

//     for (const issue of review.issues) {
//       const body = `**[${issue.severity.toUpperCase()}]**
// ${issue.description}

// 💡 **Suggestion**
// ${issue.suggestion}`;

//       let success = false;

//       if (issue.line) {
//         success = await postInlineCommentAtLine({
//           body,
//           path: file.filename,
//           commit_id,
//           line: issue.line,
//           patch: file.patch,
//         });
//       }

//       if (!success) {
//         success = await postInlineComment({
//           body,
//           path: file.filename,
//           commit_id,
//           patch: file.patch,
//         });
//       }

//       if (success) {
//         inlinePosted++;
//       } else {
//         inlineFailed++;
//         await postReviewComment(
//           `📁 **${file.filename}**\n\n${body}`
//         );
//       }
//     }
//   }

//   /* ---------- SUMMARY ---------- */

//   let summaryComment = `🤖 **AI PR Review**\n\n`;

//   // Add overall review if available
//   if (overallReview) {
//     summaryComment += `**Summary:**\n${overallReview.summary}\n\n`;
//     summaryComment += `**Quality Score:** ${overallReview.quality_score}/10\n`;
//     summaryComment += `**Should Block Merge:** ${overallReview.should_block_merge ? "❌ Yes" : "✅ No"}\n\n`;
    
//     if (overallReview.positive_notes && overallReview.positive_notes.length > 0) {
//       summaryComment += overallReview.positive_notes.map(note => `- ${note}`).join("\n");
//       summaryComment += "\n\n";
//     }
    
//     summaryComment += "---\n\n";
//   }

//   // Add file-level review summary
//   summaryComment += `${
//     filesWithIssues > 0
//       ? `❌ Found **${filesWithIssues} file(s)** with issues.`
//       : `✅ No issues found across changed files.`
//   }\n\n`;
  
//   summaryComment += `💬 Inline comments posted: **${inlinePosted}**\n`;
//   summaryComment += `⚠️ Fallback comments: **${inlineFailed}**\n`;
  
//   if (hasHighSeverity) {
//     summaryComment += `\n🚨 High severity issues detected.`;
//   }

//   await postReviewComment(summaryComment);

//   await applyLabels(filesWithIssues, hasHighSeverity);

// }

// main().catch(err => {
//   console.error("❌ Reviewer crashed:", err);
//   process.exit(1);
// });
/**
 * reviewer/index.js
 *
 * This is a PURE service.
 * No CLI. No process.exit. No console hacks.
 * Backend (Next.js / webhook) calls runPRReview().
 */

import { runReview } from "./llm.js";
import {
  getPullRequestFiles,
  postInlineCommentAtLine,
  postReviewComment,
} from "./github.js";
import { buildReviewPrompt } from "./prompt.js";

/**
 * Main callable function
 */
export async function runPRReview({
  owner,
  repo,
  pull_number,
  githubToken,
  openaiApiKey,
}) {
  if (!owner || !repo || !pull_number) {
    throw new Error("Missing PR identifiers");
  }

  if (!githubToken) {
    throw new Error("Missing GitHub token");
  }

  if (!openaiApiKey) {
    throw new Error("Missing OpenAI API key");
  }

  console.log(`🔍 Reviewing PR #${pull_number} in ${owner}/${repo}`);

  // 1️⃣ Fetch PR files
  const files = await getPullRequestFiles({
    owner,
    repo,
    pull_number,
    githubToken,
  });

  if (!files.length) {
    console.log("⚠️ No changed files found");
    return;
  }

  const fileReviews = [];
  const summaryIssues = [];

  // 2️⃣ Review each file individually
  for (const file of files) {
    if (!file.patch) continue; // binary or removed files

    const review = await runReview(file.patch);

    if (!review?.issues?.length) continue;

    for (const issue of review.issues) {
      // Skip if LLM didn’t give line info
      if (!issue.line) continue;

      await createReviewComment({
        owner,
        repo,
        pull_number,
        body: `**${issue.title}**\n\n${issue.description}`,
        path: file.filename,
        line: issue.line,
        githubToken,
      });

      summaryIssues.push({
        file: file.filename,
        title: issue.title,
        severity: issue.severity || "medium",
      });
    }

    fileReviews.push({
      file: file.filename,
      issues: review.issues.length,
    });
  }

  // 3️⃣ Post final summary comment
  if (summaryIssues.length > 0) {
    const summaryBody = buildSummaryComment(summaryIssues);
    await createReviewSummary({
      owner,
      repo,
      pull_number,
      body: summaryBody,
      githubToken,
    });
  }

  console.log("✅ PR review completed");
}

/**
 * Builds final PR summary markdown
 */
function buildSummaryComment(issues) {
  const grouped = issues.reduce((acc, issue) => {
    acc[issue.file] = acc[issue.file] || [];
    acc[issue.file].push(issue);
    return acc;
  }, {});

  let body = `## 🤖 PR Review Summary\n\n`;

  for (const file in grouped) {
    body += `### 📄 ${file}\n`;
    grouped[file].forEach((i) => {
      body += `- **${i.title}** _(severity: ${i.severity})_\n`;
    });
    body += `\n`;
  }

  body += `---\n`;
  body += `✅ Reviewed automatically by AI PR Reviewer`;

  return body;
}
