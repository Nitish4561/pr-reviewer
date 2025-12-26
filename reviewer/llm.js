import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Runs AI review on a git diff and returns structured review data
 * @param {string} diff - Git diff from the PR
 * @returns {Object} review with summary, quality_score, should_block_merge, issues, positive_notes
 */
export async function runReview(diff) {
  if (!diff) return {};

  const prompt = `
You are a senior code reviewer. Analyze the following git diff and provide a JSON review.
Return the following fields exactly:
- summary: short summary of the PR changes
- quality_score: number from 1 to 10 indicating overall code quality
- should_block_merge: true if there are major issues, false otherwise
- issues: array of objects with keys severity (low/medium/high), description, suggestion
- positive_notes: array of positive aspects

Git diff:
\`\`\`diff
${diff}
\`\`\`
`;
console.log("📦 Diff length:", diff?.length);
console.log("📦 Prompt:", prompt.substring(0, 500), "...");

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0
    });
    
    const review = JSON.parse(response.choices[0].message.content);
    

    return {
      summary: review.summary ?? "No summary provided",
      quality_score: Number.isFinite(review.quality_score) ? review.quality_score : 7,
      should_block_merge: review.should_block_merge ?? false,
      issues: Array.isArray(review.issues) ? review.issues : [],
      positive_notes: Array.isArray(review.positive_notes) ? review.positive_notes : []
    };
  } catch (err) {
    console.error("❌ runReview failed:", err);
    console.error("❌ runReview failed:", err.response?.data ?? err.message);

    return {
      summary: "Failed to generate AI review",
      quality_score: 7,
      should_block_merge: false,
      issues: [],
      positive_notes: []
    };
  }
}
