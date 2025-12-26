// llm.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Fallback review in case AI fails
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

// JSON schema for structured review
const REVIEW_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    quality_score: { type: "number" },
    should_block_merge: { type: "boolean" },
    issues: {
      type: "array",
      items: {
        type: "object",
        properties: {
          severity: { type: "string", enum: ["low", "medium", "high"] },
          description: { type: "string" },
          suggestion: { type: "string" }
        },
        required: ["severity", "description", "suggestion"],
        additionalProperties: false
      }
    },
    positive_notes: {
      type: "array",
      items: { type: "string" }
    }
  },
  required: ["summary", "quality_score", "should_block_merge", "issues", "positive_notes"],
  additionalProperties: false
};

/**
 * Runs AI review on a git diff and returns structured review data
 * @param {string} diff - Git diff from the PR
 * @returns {Object} review
 */
export async function runReview(diff) {
  if (!diff || diff.length < 10) return FALLBACK_REVIEW;

  const prompt = `
You are a senior software engineer reviewing a git PR diff.
Analyze the changes and return a single JSON object matching the provided schema.

Diff:
\`\`\`diff
${diff}
\`\`\`
`;

  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "pr_review",
          schema: REVIEW_SCHEMA
        }
      }
    });

    if (!response.output_parsed) {
      console.warn("⚠️ No parsed output from model. Returning fallback review.");
      console.log("Raw model output:", response.output_text);
      return FALLBACK_REVIEW;
    }

    return response.output_parsed;
  } catch (err) {
    console.error("❌ runReview failed:", err.message ?? err);
    return FALLBACK_REVIEW;
  }
}
