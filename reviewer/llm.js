import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export const REVIEW_SCHEMA = {
  schema: {
    type: "object",
    additionalProperties: false,  // ✅ REQUIRED
    properties: {
      summary: { type: "string" },
      quality_score: { type: "number" },
      should_block_merge: { type: "boolean" },
      issues: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false, // ✅ REQUIRED for nested objects
          properties: {
            severity: { type: "string", enum: ["low", "medium", "high"] },
            description: { type: "string" },
            suggestion: { type: "string" }
          },
          required: ["severity", "description", "suggestion"]
        }
      },
      positive_notes: {
        type: "array",
        items: { type: "string" }
      }
    },
    required: ["summary", "quality_score", "should_block_merge", "issues", "positive_notes"]
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
You are a senior software engineer and code reviewer.
Analyze the following git diff and provide a detailed review.

Rules:
- Be concise and precise.
- Output must match the JSON schema named 'pr_review'.
- Provide actionable feedback.
- Highlight positives as well as issues.
- Only include the fields defined in the schema: summary, quality_score, should_block_merge, issues, positive_notes.


Git diff:
\`\`\`diff
${diff}
\`\`\`
      `,
      text: {
        format: {
          type: "json_schema",
          name: "pr_review",
          schema: REVIEW_SCHEMA.schema
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
