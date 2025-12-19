import OpenAI from "openai";
import { REVIEW_PROMPT } from "./prompt.js";
import { REVIEW_SCHEMA } from "./schema.js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function runReview(diff) {
  const response = await client.responses.create({
    model: "o3-mini-high",
    response_format: { type: "json_object" },
    input: [
      {
        role: "system",
        content: REVIEW_PROMPT,
      },
      {
        role: "user",
        content: `Review the following git diff:\n\n${diff}`,
      },
    ],
  });

  const output = JSON.parse(response.output_text);
  return output;
}
