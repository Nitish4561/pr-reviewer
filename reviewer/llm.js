import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

const REVIEW_SCHEMA = {
  name: "pr_review",
  schema: {
    type: "object",
    required: [
      "summary",
      "quality_score",
      "should_block_merge",
      "issues",
      "positive_notes"
    ],
    properties: {
      summary: { type: "string" },
      quality_score: { type: "number", minimum: 0, maximum: 10 },
      should_block_merge: { type: "boolean" },
      issues: {
        type: "array",
        items: {
          type: "object",
          required: ["severity", "description", "suggestion"],
          properties: {
            severity: {
              type: "string",
              enum: ["low", "medium", "high"]
            },
            description: { type: "string" },
            suggestion: { type: "string" }
          }
        }
      },
      positive_notes: {
        type: "array",
        items: { type: "string" }
      }
    }
  }
};

export const FALLBACK_REVIEW = {
  summary: "AI review failed due to invalid response",
  quality_score: 0,
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
  if (!diff || diff.length < 50) return FALLBACK_REVIEW;

  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: `
You are a senior software engineer performing a PR review.
Analyze the following git diff and return a structured review.

Return ONLY valid JSON matching the schema.

Git diff:
\`\`\`diff
${diff}
\`\`\`
      `,
      text: {
        format: {
          type: "json_schema",
          schema: REVIEW_SCHEMA
        }
      }
    });

    if (!response.output_parsed) {
      console.warn("⚠️ No parsed output from model");
      return FALLBACK_REVIEW;
    }

    return response.output_parsed;
  } catch (err) {
    console.error("❌ runReview failed:", err.message);
    return FALLBACK_REVIEW;
  }
}
