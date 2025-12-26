import { getPullRequest, getPullRequestDiff, postReviewComment, postFileComment, applyLabels } from "./github.js";
import { runReview, FALLBACK_REVIEW } from "./llm.js";
import { shouldSkipByTitle, shouldSkipFile } from "./utils.js";

async function main() {

  const pr = await getPullRequest();

  if (shouldSkipByTitle(pr.title)) {
    return;
  }

  const diff = await getPullRequestDiff();
  if (!diff || diff.length < 50) {
    return;
  }

  const review = await runReview(diff) ?? FALLBACK_REVIEW;

  // --- PR-level comment ---
  const body = `
## 🤖 AI PR Review

**Summary**
${review.summary}

**Quality Score:** ${review.quality_score ?? "N/A"}/10  
**Should Block Merge:** ${review.should_block_merge ? "❌ Yes" : "✅ No"}

### ⚠️ Issues
${
  review.issues.length
    ? review.issues.map(i => `- **[${i.severity}]** ${i.description}`).join("\n")
    : "_No issues found._"
}

### 👍 Positives
${
  review.positive_notes.length
    ? review.positive_notes.map(p => `- ${p}`).join("\n")
    : "_No positives mentioned._"
}
`;

  await postReviewComment(body);

  // --- File-level comments ---
  for (const issue of review.issues) {
    if (!issue.file || shouldSkipFile(issue.file)) continue;

    await postFileComment({
      path: issue.file,
      body: `⚠️ **${issue.severity.toUpperCase()}**\n${issue.description}\n👉 ${issue.suggestion}`
    });
  }

  // --- Labels ---
  await applyLabels(review);
}

main().catch(err => {
  process.exit(1);
});
