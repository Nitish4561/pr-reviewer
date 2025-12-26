// import OpenAI from "openai";
// import { REVIEW_PROMPT } from "./prompt.js";

// const client = new OpenAI({
//   apiKey: process.env.OPENAI_API_KEY,
// });

// export async function runReview(diff) {
//   const response = await client.responses.create({
//     model: "gpt-4.1-mini",
//     input: [
//       {
//         role: "system",
//         content: REVIEW_PROMPT,
//       },
//       {
//         role: "user",
//         content: `Review the following git diff and return ONLY valid JSON:\n\n${diff}`,
//       },
//     ],
//     text: {
//       format: {
//         type: "json_object"
//       }
//     }
//   });

//   return JSON.parse(response.output_text);
// }

import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function runReview(diff) {
  if (!diff) return {};

  // Prompt the AI to generate a structured code review
  const prompt = `
You are a senior code reviewer. Analyze the following git diff and provide a detailed review in JSON format.
Return the following fields:
- summary: A short summary of the PR changes.
- quality_score: Number from 1 to 10 indicating code quality.
- should_block_merge: true if there are major issues, false otherwise.
- issues: List of detected issues with fields: severity, description, suggestion.
- positive_notes: List of positive aspects.

Here is the diff:
\`\`\`diff
${diff}
\`\`\`
`;

  try {
    const response = await client.responses.create({
      model: "gpt-4.1-mini", // Use a valid model
      input: prompt,
      text: { format: "json_object" } // Structured JSON output
    });

    const review = response.output_parsed ?? {};
    // fallback for safety
    return {
      summary: review.summary ?? "No summary provided.",
      quality_score: Number.isFinite(review.quality_score) ? review.quality_score : 7,
      should_block_merge: review.should_block_merge ?? false,
      issues: Array.isArray(review.issues) ? review.issues : [],
      positive_notes: Array.isArray(review.positive_notes) ? review.positive_notes : []
    };
  } catch (err) {
    console.error("❌ runReview failed:", err);
    return {
      summary: "Failed to generate AI review",
      quality_score: 7,
      should_block_merge: false,
      issues: [],
      positive_notes: []
    };
  }
}
