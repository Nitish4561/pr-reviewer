/**
 * Template Agent
 * Copy this file to create new agents
 * 
 * INSTRUCTIONS:
 * 1. Copy this file: cp _template-agent.js my-agent.js
 * 2. Replace "Template" with your agent name throughout
 * 3. Implement the analyze() method
 * 4. Customize buildSystemPrompt() and buildUserPrompt()
 * 5. Add formatting in format() method
 * 6. Export from agents/index.js
 * 7. Add to orchestrator.js agents array
 */

import { BaseAgent } from "./base-agent.js";

export class TemplateAgent extends BaseAgent {
  constructor() {
    super(
      "Template Agent",  // Display name
      "Brief description of what this agent does"  // Description
    );
    
    // Optional: Override default model
    // this.model = "gpt-4o"; // Use gpt-4o for complex reasoning
    // this.model = "gpt-4o-mini"; // Use mini for simple tasks (default)
  }

  /**
   * Main analysis method
   * @param {Object} context - PR context with previous agent results
   * @param {string} apiKey - OpenAI API key
   * @returns {Object} Analysis results
   */
  async analyze(context, apiKey) {
    console.log(`🔍 ${this.name}: Starting analysis...`);

    // Extract context
    const { pr, files, combinedDiff } = context;
    
    // Access previous agent results
    const intentAnalysis = context.intentAnalysis;
    const codeQualityAnalysis = context.codeQualityAnalysis;

    // Build prompts
    const systemPrompt = this.buildSystemPrompt(intentAnalysis);
    const userPrompt = this.buildUserPrompt(pr, files, combinedDiff);

    try {
      // Call LLM with custom options
      const result = await this.callLLM(
        systemPrompt,
        userPrompt,
        apiKey,
        {
          temperature: 0.1,      // 0.0 = deterministic, 1.0 = creative
          max_tokens: 2000,       // Response length limit
          model: this.model,      // Model to use
        }
      );

      console.log(`   ✅ ${this.name} analysis complete`);
      
      // Log key findings
      if (result.summary) {
        console.log(`   📝 Summary: ${result.summary}`);
      }

      return result;
    } catch (error) {
      console.error(`   ❌ ${this.name} failed:`, error.message);
      
      // Return fallback result
      return this.getFallbackResult(pr, files);
    }
  }

  /**
   * Build system prompt (instructions for the AI)
   */
  buildSystemPrompt(intentAnalysis) {
    // Optional: Use intent analysis to contextualize your agent
    const intentContext = intentAnalysis
      ? `\n\nPR CONTEXT:\nIntent: ${intentAnalysis.intent}\nChange Type: ${intentAnalysis.changeType}\nRisk Level: ${intentAnalysis.riskLevel}\n`
      : '';

    return `You are an expert AI agent specialized in [YOUR SPECIALTY].

${intentContext}

YOUR TASK:
[Describe what this agent should analyze]

ANALYZE FOR:
1. [First thing to check]
2. [Second thing to check]
3. [Third thing to check]

OUTPUT RULES:
1. Return ONLY valid JSON
2. Be specific and actionable
3. Focus on high-impact insights
4. Provide concrete examples

JSON FORMAT:
{
  "summary": "Brief overview of your findings",
  "findings": [
    {
      "type": "issue|insight|recommendation",
      "severity": "low|medium|high|critical",
      "title": "Short title",
      "description": "Detailed explanation",
      "suggestion": "Actionable next step"
    }
  ],
  "metrics": {
    "customMetric1": 0,
    "customMetric2": "value"
  }
}

Return JSON only.`;
  }

  /**
   * Build user prompt (the actual content to analyze)
   */
  buildUserPrompt(pr, files, combinedDiff) {
    const fileList = files
      .map(f => `  - ${f.filename} (+${f.additions}/-${f.deletions})`)
      .join('\n');

    // Truncate diff if too long
    const truncatedDiff = combinedDiff.length > 6000
      ? combinedDiff.substring(0, 6000) + '\n\n... (truncated) ...'
      : combinedDiff;

    return `# Pull Request Analysis

## PR Details
**Title:** ${pr.title || 'Untitled'}
**Description:**
${pr.body || 'No description'}

## Files Changed (${files.length})
${fileList}

## Code Changes
\`\`\`diff
${truncatedDiff}
\`\`\`

---

[Your specific question or instruction for this agent]

Return JSON only.`;
  }

  /**
   * Fallback result when LLM fails
   */
  getFallbackResult(pr, files) {
    return {
      summary: "Analysis failed - manual review required",
      findings: [],
      metrics: {},
      error: true,
    };
  }

  /**
   * Format results as markdown for PR comment
   */
  format(results) {
    if (results.error) {
      return `## ⚠️ ${this.name}\n\nAnalysis failed. Please review manually.`;
    }

    let markdown = `## 🎯 ${this.name}\n\n`;
    markdown += `${results.summary}\n\n`;

    if (results.findings && results.findings.length > 0) {
      markdown += `### Findings\n\n`;
      
      for (const finding of results.findings) {
        const emoji = {
          critical: "🚨",
          high: "🔴",
          medium: "🟡",
          low: "🔵",
        }[finding.severity] || "ℹ️";

        markdown += `${emoji} **${finding.title}**\n`;
        markdown += `${finding.description}\n`;
        
        if (finding.suggestion) {
          markdown += `💡 *Suggestion:* ${finding.suggestion}\n`;
        }
        
        markdown += `\n`;
      }
    }

    if (results.metrics) {
      markdown += `### Metrics\n\n`;
      for (const [key, value] of Object.entries(results.metrics)) {
        markdown += `- **${key}:** ${value}\n`;
      }
    }

    return markdown;
  }
}

