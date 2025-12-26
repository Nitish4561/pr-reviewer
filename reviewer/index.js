import { getPullRequestDiff, postReviewComment } from "./github.js";
import { runReview } from "./llm.js";
console.log("🚀 Reviewer started");

async function main() {
  console.log("🚀 Reviewer started");

  const diff = await getPullRequestDiff();
  console.log("📄 Diff length:", diff?.length);

  if (!diff || diff.length < 50) {
    await postReviewComment("⚠️ PR diff too small to review.");
    return;
  }

  const review = await runReview(diff);
  console.log("🤖 LLM raw output:", JSON.stringify(review, null, 2));

  const body = `
## 🤖 AI PR Review

**Summary**  
${review.summary}

**Issues:**  
${review.issues.length > 0 ? review.issues.map(i => `- ${i.description}`).join("\n") : "_No issues found._"}
`;

  await postReviewComment(body);
  console.log("✅ postReviewComment finished");
}

main().catch(err => {
  console.error("❌ Reviewer crashed:", err);
  process.exit(1);
});

