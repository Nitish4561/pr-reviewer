import OpenAI from "openai";
import { REVIEW_PROMPT } from "./prompt.js";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function runReview(diff) {
  const response = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: REVIEW_PROMPT,
      },
      {
        role: "user",
        content: `Review the following git diff and return ONLY valid JSON:\n\n${diff}`,
      },
    ],
    text: {
      format: {
        type: "json_object"
      }
    }
  });

  return JSON.parse(response.output_text);
}
