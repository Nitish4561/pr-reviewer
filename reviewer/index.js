import { getPullRequestDiff, postReviewComment, applyLabels } from "./github.js";
import { runReview } from "./llm.js";

async function main() {
  console.log("🚀 Reviewer started");

  const diff = await getPullRequestDiff();
  if (!diff || diff.length < 50) {
    console.log("PR diff too small, skipping review.");
    return;
  }

  const review = await runReview(diff);

  // --- Label decision logic ---
  const labels = ["ai-reviewed"];

  if (
    review.summary?.toLowerCase().includes("failed") ||
    review.quality_score === 0
  ) {
    labels.push("ai-failed");
  } else if (review.quality_score >= 8 && review.issues.length === 0) {
    labels.push("ai-clean");
  } else {
    labels.push("ai-needs-attention");
  }

  await applyLabels(labels);

  // --- Comment body (unchanged) ---
  const body = `
## 🤖 AI PR Review

**Summary**
${review.summary}

**Quality Score:** ${review.quality_score ?? "N/A"}/10  
**Should Block Merge:** ${review.should_block_merge ? "❌ Yes" : "✅ No"}

### ⚠️ Issues
${
  review.issues.length > 0
    ? review.issues
        .map(
          i =>
            `- **[${i.severity}]** ${i.description}\n  👉 ${i.suggestion}`
        )
        .join("\n")
    : "_No issues found._"
}

### 👍 Positives
${
  review.positive_notes.length > 0
    ? review.positive_notes.map(p => `- ${p}`).join("\n")
    : "_No positives mentioned._"
}
`;

  await postReviewComment(body);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
