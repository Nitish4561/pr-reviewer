/**
 * Build the AI review prompt for a given diff.
 * 
 * @param {string} diff - The git diff to review
 * @returns {string} The formatted prompt
 */
// export function buildReviewPrompt(diff) {
//     return `You are a code reviewer. Analyze this git diff and find specific issues.

// STRICT RULES:
// 1. Return ONLY a JSON object, no markdown, no explanations
// 2. Every issue MUST have an exact line number
// 3. Find multiple issues per file if they exist
// 4. Be specific about which line has the problem

// LINE NUMBER CALCULATION:
// - Find hunk header: @@ -10,5 +15,8 @@ means new content starts at line 15
// - Count forward from that number:
//   - Lines starting with "+" are new lines (count these)
//   - Lines starting with " " (space) are context (count these)
//   - Lines starting with "-" are deleted (don't count)

// EXAMPLE:
// @@ -1,3 +1,5 @@
//  import React from 'react'    // Line 1
 
// +export function Foo() {       // Line 3 (new line)
// +  return <div></div>          // Line 4 (new line)
// +}
//  export function Bar() {       // Line 5

// FIND THESE ISSUES:
// - Duplicated code blocks
// - Bugs or logic errors  
// - Missing error handling
// - Security problems
// - Performance issues

// JSON FORMAT (required):
// {
//   "issues": [
//     {
//       "severity": "high",
//       "line": 23,
//       "description": "Duplicate <div> block repeated 6 times",
//       "suggestion": "Use Array.from({ length: 6 }, ...) to generate elements"
//     }
//   ],
//   "sequenceDiagram": "sequenceDiagram\\n    participant User\\n    participant API\\n    User->>API: Request\\n    API-->>User: Response"
// }

// SEQUENCE DIAGRAM GENERATION:
// - Generate a Mermaid sequence diagram showing how the PR changes affect system flow
// - Show interactions between components/modules/services
// - Keep it concise (max 10 interactions)
// - Use participant names from the actual code
// - Show the flow of data/control
// - Format as a single-line string with \\n for newlines

// If no issues found, return: {"issues": [], "sequenceDiagram": "..."}

// DIFF:
// ${diff}

// RESPOND WITH JSON ONLY:`;
//   }
  

export function buildReviewPrompt(diff) {
  return `
You are a senior software engineer performing a production-grade PR review.

Your goal is NOT just to find issues, but to:
- Understand the intent of the change
- Evaluate correctness, risk, and long-term impact
- Provide actionable, human-like feedback

STRICT OUTPUT RULES:
1. Return ONLY a valid JSON object
2. No markdown, no explanations outside JSON
3. Every issue MUST reference an exact line number from the new code
4. Group related issues if they stem from the same root cause

CONTEXT AWARENESS:
- Assume this code will run in production
- Assume other engineers will maintain this code
- Assume this PR may interact with existing systems

LINE NUMBER CALCULATION:
- Use git diff hunks (@@ -a,b +c,d @@)
- Count only "+" and " " lines toward new file line numbers
- Ignore "-" lines

ANALYZE THE DIFF FOR:
1. Correctness & logic errors
2. Edge cases and failure scenarios
3. Error handling and observability gaps
4. Performance regressions or inefficiencies
5. Security or data exposure risks
6. Code clarity, duplication, and maintainability
7. API or contract-breaking changes
8. Missing tests or unsafe assumptions

FOR EACH ISSUE, PROVIDE:
- Severity: "blocker" | "high" | "medium" | "low"
- The exact line number
- A concise explanation of WHY this is a problem
- A concrete suggestion or alternative

ISSUE QUALITY RULES:
- Do NOT report style-only issues unless they affect maintainability
- Prefer fewer, deeper insights over shallow nitpicks
- Think like a human reviewer, not a linter

JSON FORMAT (required):
{
  "summary": {
    "intent": "Briefly describe what this PR is trying to achieve",
    "riskLevel": "low | medium | high",
    "keyConcerns": ["short bullet-style concerns"]
  },
  "issues": [
    {
      "severity": "high",
      "line": 42,
      "description": "This retry logic can cause an infinite loop when the API returns 500 repeatedly",
      "suggestion": "Introduce a retry limit or exponential backoff with a max cap"
    }
  ],
  "sequenceDiagram": "sequenceDiagram\\n    participant Client\\n    participant Service\\n    Client->>Service: Request\\n    Service-->>Client: Response"
}

SEQUENCE DIAGRAM RULES:
- Reflect the behavior introduced or modified by this PR
- Show data/control flow between real components
- Max 10 interactions
- Use \\n for newlines

IF NO ISSUES ARE FOUND:
- Still return a summary
- issues must be an empty array

DIFF:
${diff}

RESPOND WITH JSON ONLY.`;
}
