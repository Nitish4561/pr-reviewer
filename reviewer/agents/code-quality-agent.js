/**
 * Code Quality Agent
 * Reviews code for bugs, quality issues, and best practices
 * 
 * This is the refactored version of the original review logic
 */

import { BaseAgent } from "./base-agent.js";

export class CodeQualityAgent extends BaseAgent {
  constructor() {
    super("Code Quality Agent", "Reviews code for bugs and quality issues");
  }

  /**
   * Analyze code quality for each file
   * @param {Object} context - { files, intentAnalysis }
   * @param {string} apiKey - OpenAI API key
   * @returns {Object} Code quality analysis with inline issues
   */
  async analyze(context, apiKey) {
    const { files, intentAnalysis } = context;

    console.log(`🔍 ${this.name}: Reviewing ${files.length} file(s)...`);

    const fileReviews = [];
    let totalIssues = 0;
    let hasHighSeverity = false;

    for (const file of files) {
      if (!file.patch) {
        console.log(`   ⏭️  Skipping ${file.filename} (no patch)`);
        continue;
      }

      console.log(`   📄 Reviewing: ${file.filename}`);

      try {
        const review = await this.reviewFile(file, intentAnalysis, apiKey);
        
        if (review.issues.length > 0) {
          console.log(`   ⚠️  Found ${review.issues.length} issue(s)`);
          totalIssues += review.issues.length;
          
          // Check for high severity
          if (review.issues.some(i => i.severity === "high" || i.severity === "blocker")) {
            hasHighSeverity = true;
          }
        } else {
          console.log(`   ✅ No issues found`);
        }

        fileReviews.push({
          filename: file.filename,
          issues: review.issues,
          summary: review.summary,
        });
      } catch (error) {
        console.error(`   ❌ Failed to review ${file.filename}:`, error.message);
        fileReviews.push({
          filename: file.filename,
          issues: [],
          summary: "Review failed",
          error: error.message,
        });
      }
    }

    console.log(`   📊 Total issues found: ${totalIssues}`);

    return {
      fileReviews,
      totalIssues,
      hasHighSeverity,
      summary: this.createSummary(fileReviews, totalIssues, hasHighSeverity),
    };
  }

  /**
   * Review a single file
   */
  async reviewFile(file, intentAnalysis, apiKey) {
    const systemPrompt = this.buildSystemPrompt(intentAnalysis);
    const userPrompt = this.buildUserPrompt(file);

    const result = await this.callLLM(systemPrompt, userPrompt, apiKey, {
      temperature: 0.1,
      max_tokens: 2000,
    });

    // Validate and filter issues
    const validIssues = (result.issues || []).filter(issue => {
      if (typeof issue.line !== 'number' || !issue.description || !issue.suggestion) {
        console.warn(`   ⚠️ Skipping invalid issue:`, issue);
        return false;
      }
      return true;
    });

    return {
      issues: validIssues,
      summary: result.summary || "No summary provided",
    };
  }

  buildSystemPrompt(intentAnalysis) {
    const intentContext = intentAnalysis 
      ? `\n\nPR INTENT CONTEXT:\n${intentAnalysis.summary}\nChange Type: ${intentAnalysis.changeType}\nRisk Level: ${intentAnalysis.riskLevel}\n`
      : '';

    return `You are a senior software engineer performing a code quality review.${intentContext}

Your goal is to find REAL issues that matter:
- Bugs and logic errors
- Security vulnerabilities
- Performance problems
- Missing error handling
- Code that will be hard to maintain

DO NOT flag:
- Minor style issues (unless they harm readability)
- Nitpicks that don't affect functionality
- Personal preferences

RULES:
1. Return ONLY valid JSON
2. Every issue MUST have an exact line number
3. Focus on HIGH-IMPACT issues
4. Be specific and actionable
5. Consider the PR intent when evaluating changes

LINE NUMBER CALCULATION:
- Use git diff hunk headers (@@ -a,b +c,d @@)
- Count "+" (new) and " " (context) lines
- Ignore "-" (deleted) lines

SEVERITY LEVELS:
- blocker: Critical bug, security issue, or data loss risk
- high: Significant bug or serious design flaw
- medium: Notable issue but workarounds exist
- low: Minor improvement opportunity

JSON FORMAT:
{
  "summary": "Brief assessment of this file's quality",
  "issues": [
    {
      "severity": "high",
      "line": 42,
      "description": "Clear explanation of the problem",
      "suggestion": "Specific fix or improvement"
    }
  ]
}

If no issues found: return {"summary": "Code looks good", "issues": []}`;
  }

  buildUserPrompt(file) {
    return `Review this file for code quality issues.

**File:** ${file.filename}
**Status:** ${file.status}
**Changes:** +${file.additions} -${file.deletions}

**Diff:**
\`\`\`diff
${file.patch}
\`\`\`

Find real issues that matter. Return JSON only.`;
  }

  createSummary(fileReviews, totalIssues, hasHighSeverity) {
    if (totalIssues === 0) {
      return "All files reviewed - no significant issues found.";
    }

    const filesWithIssues = fileReviews.filter(f => f.issues.length > 0).length;
    const severity = hasHighSeverity ? "including critical issues" : "minor issues";

    return `Found ${totalIssues} issue(s) across ${filesWithIssues} file(s), ${severity}.`;
  }

  /**
   * Format as markdown
   */
  format(results) {
    if (results.totalIssues === 0) {
      return `## ✅ Code Quality Review

${results.summary}

All files have been reviewed and no significant issues were found.`;
    }

    let markdown = `## 🔍 Code Quality Review\n\n${results.summary}\n\n`;

    // Group issues by file
    for (const fileReview of results.fileReviews) {
      if (fileReview.issues.length === 0) continue;

      markdown += `### 📄 ${fileReview.filename}\n\n`;
      
      for (const issue of fileReview.issues) {
        const severityEmoji = {
          blocker: "🚨",
          high: "🔴",
          medium: "🟡",
          low: "🔵",
        }[issue.severity] || "⚪";

        markdown += `${severityEmoji} **${issue.severity.toUpperCase()}** (Line ${issue.line})\n`;
        markdown += `**Issue:** ${issue.description}\n`;
        markdown += `**Suggestion:** ${issue.suggestion}\n\n`;
      }
    }

    return markdown;
  }
}

