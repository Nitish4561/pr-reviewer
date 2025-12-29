/**
 * reviewer/llm.js
 *
 * Handles AI review using OpenAI API
 */

import { buildReviewPrompt } from "./prompt.js";

/**
 * Run AI review on a diff
 * @param {string} diff - Git diff patch
 * @param {string} openaiApiKey - OpenAI API key
 * @returns {Object} review results with issues array
 */
export async function runReview(diff, openaiApiKey) {
  const key = openaiApiKey || process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OpenAI API key not provided to runReview");

  if (!diff || diff.length < 20) {
    return { issues: [] };
  }

  const prompt = buildReviewPrompt(diff);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a code review AI. You ONLY output valid JSON. Never use markdown formatting or explanatory text. Your entire response must be parseable JSON with an 'issues' array where each issue has: severity, line (number), description, and suggestion fields."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.1,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error(`OpenAI API error: ${response.status} - ${text}`);
    return { issues: [] };
  }

  const data = await response.json();

  // Extract and parse JSON from AI response
  try {
    let content = data.choices[0].message.content;
    
    // Log raw response for debugging
    console.log("📥 Raw AI response:", content.substring(0, 200));
    
    // Clean up response if needed
    content = content.trim();
    
    // Remove markdown code blocks if present
    if (content.startsWith("```")) {
      content = content.replace(/```json?\n?/g, "").replace(/```\n?$/g, "");
    }
    
    const review = JSON.parse(content);
    
    // Validate that we have issues array
    if (!review.issues || !Array.isArray(review.issues)) {
      console.warn("⚠️ AI response missing issues array");
      console.log("Response was:", review);
      return { issues: [] };
    }

    // Filter out issues without line numbers and log them
    const validIssues = review.issues.filter(issue => {
      if (typeof issue.line !== 'number' || !issue.description || !issue.suggestion) {
        console.warn("⚠️ Skipping issue without required fields:", {
          hasLine: !!issue.line,
          lineType: typeof issue.line,
          hasDesc: !!issue.description,
          hasSugg: !!issue.suggestion
        });
        return false;
      }
      return true;
    });

    console.log(`✅ Found ${validIssues.length} valid issues with line numbers`);
    
    if (validIssues.length > 0) {
      console.log("First issue example:", JSON.stringify(validIssues[0], null, 2));
    }
    
    return { issues: validIssues };
  } catch (err) {
    console.error("⚠️ Failed to parse AI response:", err.message);
    console.error("Response content:", data.choices[0]?.message?.content);
    return { issues: [] };
  }
}
