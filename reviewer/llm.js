import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const FALLBACK_REVIEW = {
  summary: "AI review failed due to invalid response",
  quality_score: 7,
  should_block_merge: false,
  issues: [
    {
      severity: "low",
      description: "AI review could not be generated",
      suggestion: "Check workflow logs for LLM errors"
    }
  ],
  positive_notes: []
};

export async function runReview(diff) {
  if (!diff) return FALLBACK_REVIEW;

  const prompt = `
You are a senior code reviewer.
Return ONLY one valid JSON object with the following fields:

summary (string)
quality_score (number 1-10)
should_block_merge (boolean)
issues (array with severity, description, suggestion, optional file)
positive_notes (array)

Git diff:
\`\`\`diff
${diff}
\`\`\`
`;

  try {
    const res = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt
    });

    const text = res.output_text;
    if (!text) return FALLBACK_REVIEW;

    return JSON.parse(text);
  } catch (err) {
    console.warn("⚠️ LLM review failed:", err.message);
    return FALLBACK_REVIEW;
  }
}
