import { getPullRequestDiff, postReviewComment } from "./github.js";
import { runReview } from "./llm.js";

async function main() {
  const diff = await getPullRequestDiff();

  if (!diff || diff.length < 50) {
    console.log("PR diff too small, skipping review.");
    return;
  }

  const review = await runReview(diff);

  const body = `
## 🤖 AI PR Review

**Summary**
${review.summary}

**Quality Score:** ${review.quality_score}/10  
**Should Block Merge:** ${review.should_block_merge ? "❌ Yes" : "✅ No"}

### ⚠️ Issues
${review.issues.map(
  i => `- **[${i.severity}]** ${i.description}\n  👉 ${i.suggestion}`
).join("\n")}

### 👍 Positives
${review.positive_notes.map(p => `- ${p}`).join("\n")}
`;

  await postReviewComment(body);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
