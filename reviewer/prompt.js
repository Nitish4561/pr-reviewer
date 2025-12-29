// export const REVIEW_PROMPT = `
// You are an expert senior software engineer acting as an automated GitHub PR reviewer.

// Rules:
// - Be concise and practical
// - Do not hallucinate missing context
// - Focus on code quality, bugs, performance, security
// - Prefer actionable suggestions

// Return ONLY valid JSON matching the provided schema.
// `;
/**
 * Build the AI review prompt for a given diff.
 * 
 * @param {string} diff - The git diff to review
 * @returns {string} The formatted prompt
 */
export function buildReviewPrompt(diff) {
    return `You are a code reviewer. Analyze this git diff and find specific issues.

STRICT RULES:
1. Return ONLY a JSON object, no markdown, no explanations
2. Every issue MUST have an exact line number
3. Find multiple issues per file if they exist
4. Be specific about which line has the problem

LINE NUMBER CALCULATION:
- Find hunk header: @@ -10,5 +15,8 @@ means new content starts at line 15
- Count forward from that number:
  - Lines starting with "+" are new lines (count these)
  - Lines starting with " " (space) are context (count these)
  - Lines starting with "-" are deleted (don't count)

EXAMPLE:
@@ -1,3 +1,5 @@
 import React from 'react'    // Line 1
 
+export function Foo() {       // Line 3 (new line)
+  return <div></div>          // Line 4 (new line)
+}
 export function Bar() {       // Line 5

FIND THESE ISSUES:
- Duplicated code blocks
- Bugs or logic errors  
- Missing error handling
- Security problems
- Performance issues

JSON FORMAT (required):
{
  "issues": [
    {
      "severity": "high",
      "line": 23,
      "description": "Duplicate <div> block repeated 6 times",
      "suggestion": "Use Array.from({ length: 6 }, ...) to generate elements"
    }
  ]
}

If no issues found, return: {"issues": []}

DIFF:
${diff}

RESPOND WITH JSON ONLY:`;
  }
  