import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const FALLBACK_REVIEW = {
  summary: "AI review failed due to invalid response",
  quality_score: 0,
  should_block_merge: false,
  issues: [
    {
      severity: "low",
      description: "AI review could not be generated",
      suggestion: "Check workflow logs for LLM response or parsing errors"
    }
  ],
  positive_notes: []
};

const PROMPT = diff => `
You are a senior software engineer performing a pull request review.

You MUST respond with ONLY a valid JSON object.
Do NOT include markdown, explanations, or extra text.
Do NOT wrap the JSON in backticks.

The JSON MUST match this exact schema:

{
  "summary": string,
  "quality_score": number (1-10),
  "should_block_merge": boolean,
  "issues": [
    {
      "severity": "low" | "medium" | "high",
      "description": string,
      "suggestion": string
    }
  ],
  "positive_notes": string[]
}

Git diff:
${diff}
`;

async function callLLM(diff) {
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: PROMPT(diff),
    text: { format: "json_object" }
  });

  if (!response.output_parsed) {
    console.warn("⚠️ Raw LLM output:", response.output_text);
  }

  return response.output_parsed;
}


export async function runReview(diff) {
  if (!diff || typeof diff !== "string") {
    return FALLBACK_REVIEW;
  }

  // Attempt 1
  try {
    const review = await callLLM(diff);
    return normalizeReview(review);
  } catch (err) {
    console.warn("⚠️ AI review failed, retrying once...");
  }

  // Retry once
  try {
    const review = await callLLM(diff);
    return normalizeReview(review);
  } catch (err) {
    console.error("❌ AI review failed after retry");
    return FALLBACK_REVIEW;
  }
}

function normalizeReview(review) {
  if (!review || typeof review !== "object") {
    throw new Error("Invalid AI response");
  }

  return {
    summary: review.summary ?? "No summary provided",
    quality_score:
      Number.isFinite(review.quality_score) ? review.quality_score : 0,
    should_block_merge: Boolean(review.should_block_merge),
    issues: Array.isArray(review.issues) ? review.issues : [],
    positive_notes: Array.isArray(review.positive_notes)
      ? review.positive_notes
      : []
  };
}
