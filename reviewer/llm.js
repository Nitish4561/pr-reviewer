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
      suggestion: "Check workflow logs for LLM response and parsing errors"
    }
  ],
  positive_notes: []
};


export async function runReview(diff) {
  if (!diff) return FALLBACK_REVIEW;

  const prompt = `
You are a senior code reviewer.

You MUST respond with ONLY a valid JSON object.
Do NOT include markdown, comments, or explanations.
Do NOT wrap the JSON in backticks.

The JSON must have exactly this shape:

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


  try {
    const res = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt
    });

    const text = res.output_text;
    console.log("🤖 Raw LLM output:", text);
    if (!text) return FALLBACK_REVIEW;

    return JSON.parse(text);
  } catch (err) {
    console.warn("⚠️ LLM review failed:", err.message);
    return FALLBACK_REVIEW;
  }
}
