import { getPullRequestDiff, postReviewComment } from "./github.js";
import { runReview } from "./llm.js";
console.log("🚀 Reviewer started");

async function main() {
  const diff = await getPullRequestDiff();
  console.log("📄 Diff length:", diff?.length);
  console.log("🚀 Reviewer started");

  console.log("👉 About to call postReviewComment");
  await postReviewComment("🚀 AI PR Reviewer test comment");
  console.log("✅ postReviewComment finished");
  


  if (!diff || diff.length < 50) {
    console.log("PR diff too small, skipping review.");
    return;
  }

   const review = await runReview(diff);
   console.log("🤖 LLM raw output:", JSON.stringify(review, null, 2));


//   const normalized = {
//     summary: review?.summary ?? "No summary provided.",
//     quality_score: Number.isFinite(review?.quality_score)
//       ? review.quality_score
//       : 7,
//     should_block_merge: Boolean(review?.should_block_merge),
//     issues: Array.isArray(review?.issues) ? review.issues : [],
//     positive_notes: Array.isArray(review?.positive_notes)
//       ? review.positive_notes
//       : []
//   };

//   const body = `
// ## 🤖 AI PR Review

// **Summary**  
// ${normalized.summary}

// **Quality Score:** ${normalized.quality_score}/10  
// **Should Block Merge:** ${
//     normalized.should_block_merge ? "❌ Yes" : "✅ No"
//   }

// ### ⚠️ Issues
// ${
//   normalized.issues.length > 0
//     ? normalized.issues
//         .map(
//           i =>
//             `- **[${i.severity ?? "medium"}]** ${
//               i.description ?? "Issue detected"
//             }\n  👉 ${i.suggestion ?? "Consider improving this"}`
//         )
//         .join("\n")
//     : "_No issues found._"
// }

// ### 👍 Positives
// ${
//   normalized.positive_notes.length > 0
//     ? normalized.positive_notes.map(p => `- ${p}`).join("\n")
//     : "_No positives mentioned._"
// }
// `;

//   await postReviewComment(body);
}
main().catch(err => {
  console.error("❌ Reviewer crashed:", err);
  process.exit(1);
});

