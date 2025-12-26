import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const FALLBACK_REVIEW = {
  summary: "AI review failed due to invalid response",
  quality_score: null,
  should_block_merge: false,
  issues: [
    {
      severity: "low",
      description: "AI review could not be generated",
      suggestion: "Check workflow logs for LLM errors",
    },
  ],
  positive_notes: [],
};

export async function runReview(diff) {
  if (!diff) {
    console.warn("⚠️ No diff provided to runReview");
    return FALLBACK_REVIEW;
  }

  const prompt = `
You are a senior code reviewer.

Analyze the following git diff and return ONLY a valid JSON object
with the following fields:

- summary
- quality_score (1–10)
- should_block_merge (boolean)
- issues (array of { severity, description, suggestion })
- positive_notes (array of strings)

⚠️ IMPORTANT:
- Return ONLY JSON
- No markdown
- No explanations
- No text outside JSON

Git diff:
${diff}
`;

  try {
    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
    });

    const raw = response.choices?.[0]?.message?.content;

    if (!raw) {
      console.warn("⚠️ Empty LLM response");
      return FALLBACK_REVIEW;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (err) {
      console.warn("⚠️ JSON parse failed:", err.message);
      return FALLBACK_REVIEW;
    }

    return {
      summary: parsed.summary ?? FALLBACK_REVIEW.summary,
      quality_score:
        Number.isFinite(parsed.quality_score)
          ? parsed.quality_score
          : FALLBACK_REVIEW.quality_score,
      should_block_merge:
        typeof parsed.should_block_merge === "boolean"
          ? parsed.should_block_merge
          : FALLBACK_REVIEW.should_block_merge,
      issues: Array.isArray(parsed.issues)
        ? parsed.issues
        : FALLBACK_REVIEW.issues,
      positive_notes: Array.isArray(parsed.positive_notes)
        ? parsed.positive_notes
        : FALLBACK_REVIEW.positive_notes,
    };
  } catch (err) {
    console.error("❌ runReview failed:", err.message);
    return FALLBACK_REVIEW;
  }
}
