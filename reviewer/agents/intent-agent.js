/**
 * Intent Agent
 * Analyzes PR to understand: What changed and WHY?
 * 
 * This agent:
 * - Examines PR title, description, and diffs
 * - Identifies the business goal/feature being implemented
 * - Determines the scope and impact of changes
 * - Provides context for other agents
 */

import { BaseAgent } from "./base-agent.js";

export class IntentAgent extends BaseAgent {
  constructor() {
    super("Intent Agent", "Analyzes what changed and why");
    this.model = "gpt-4o"; // Use more powerful model for intent understanding
  }

  /**
   * Analyze PR intent
   * @param {Object} context - { pr, files, combinedDiff }
   * @param {string} apiKey - OpenAI API key
   * @returns {Object} Intent analysis
   */
  async analyze(context, apiKey) {
    const { pr, files, combinedDiff } = context;

    console.log(`🎯 ${this.name}: Analyzing PR intent...`);

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(pr, files, combinedDiff);

    try {
      const result = await this.callLLM(systemPrompt, userPrompt, apiKey, {
        temperature: 0.2,
        max_tokens: 1500,
        model: this.model,
      });

      console.log(`   ✅ Intent analysis complete`);
      console.log(`   📝 Summary: ${result.summary}`);
      console.log(`   🎯 Intent: ${result.intent}`);
      console.log(`   📊 Change type: ${result.changeType}`);

      return result;
    } catch (error) {
      console.error(`   ❌ Intent Agent failed:`, error.message);
      return this.getFallbackResult(pr, files);
    }
  }

  buildSystemPrompt() {
    return `You are an expert software architect analyzing a Pull Request.

Your ONLY job is to understand INTENT - what the developer is trying to achieve and why.

You will receive:
- PR title and description
- List of changed files
- Git diffs showing actual code changes

ANALYZE AND ANSWER:
1. **What is the primary goal?** (feature, bugfix, refactor, etc.)
2. **What business problem is this solving?**
3. **What technical changes were made to achieve this?**
4. **What is the scope/blast radius?** (single file, module, system-wide)
5. **Are there any architectural implications?**

OUTPUT FORMAT (JSON only):
{
  "intent": "One-sentence description of what this PR is trying to accomplish",
  "businessGoal": "Why this change is needed from a product/user perspective",
  "changeType": "feature|bugfix|refactor|hotfix|enhancement|chore",
  "scope": "isolated|module|system-wide",
  "keyChanges": [
    "Bullet point of major technical change",
    "Another key change"
  ],
  "affectedAreas": [
    "authentication",
    "database",
    "API endpoints"
  ],
  "riskLevel": "low|medium|high",
  "architecturalImpact": "Description of any architectural changes or implications, or 'None' if isolated change",
  "summary": "2-3 sentence human-readable summary of this PR's intent"
}

BE SPECIFIC AND INSIGHTFUL. Think like a tech lead reviewing the PR.`;
  }

  buildUserPrompt(pr, files, combinedDiff) {
    const fileList = files
      .map(f => `  - ${f.filename} (${f.status}, +${f.additions}/-${f.deletions})`)
      .join('\n');

    // Truncate diff if too long (keep first 8000 chars for context)
    const truncatedDiff = combinedDiff.length > 8000 
      ? combinedDiff.substring(0, 8000) + '\n\n... (diff truncated for analysis) ...'
      : combinedDiff;

    return `# Pull Request to Analyze

## PR Metadata
**Title:** ${pr.title || 'Untitled'}
**Description:** 
${pr.body || 'No description provided'}

**Author:** ${pr.user?.login || 'unknown'}
**Branch:** ${pr.head?.ref || 'unknown'} → ${pr.base?.ref || 'main'}

## Files Changed (${files.length} files)
${fileList}

## Code Changes
\`\`\`diff
${truncatedDiff}
\`\`\`

---

Analyze this PR and tell me: **What is this PR trying to achieve and why?**

Return ONLY JSON.`;
  }

  getFallbackResult(pr, files) {
    // Fallback when LLM fails
    return {
      intent: pr.title || "Unknown changes",
      businessGoal: "Unable to determine - LLM analysis failed",
      changeType: this.inferChangeType(pr.title),
      scope: files.length > 5 ? "system-wide" : "isolated",
      keyChanges: [`Modified ${files.length} file(s)`],
      affectedAreas: this.inferAffectedAreas(files),
      riskLevel: "medium",
      architecturalImpact: "Unknown",
      summary: `PR modifies ${files.length} file(s). Manual review required.`,
    };
  }

  inferChangeType(title = "") {
    const lower = title.toLowerCase();
    if (lower.includes("fix") || lower.includes("bug")) return "bugfix";
    if (lower.includes("feat") || lower.includes("add")) return "feature";
    if (lower.includes("refactor")) return "refactor";
    if (lower.includes("hotfix")) return "hotfix";
    if (lower.includes("chore")) return "chore";
    return "enhancement";
  }

  inferAffectedAreas(files) {
    const areas = new Set();
    files.forEach(f => {
      const path = f.filename.toLowerCase();
      if (path.includes("auth")) areas.add("authentication");
      if (path.includes("api") || path.includes("route")) areas.add("API");
      if (path.includes("db") || path.includes("database")) areas.add("database");
      if (path.includes("component") || path.includes("ui")) areas.add("UI");
      if (path.includes("test")) areas.add("tests");
    });
    return Array.from(areas);
  }

  /**
   * Format intent results as markdown
   */
  format(results) {
    const riskEmoji = {
      low: "🟢",
      medium: "🟡",
      high: "🔴",
    }[results.riskLevel] || "⚪";

    const typeEmoji = {
      feature: "✨",
      bugfix: "🐛",
      refactor: "♻️",
      hotfix: "🚨",
      enhancement: "⚡",
      chore: "🔧",
    }[results.changeType] || "📝";

    return `## 🎯 Intent Analysis

${results.summary}

### ${typeEmoji} Change Type
**${results.changeType.toUpperCase()}**

### 📌 Primary Intent
${results.intent}

### 💡 Business Goal
${results.businessGoal}

### 🔍 Key Changes
${results.keyChanges.map(c => `- ${c}`).join('\n')}

### 📦 Affected Areas
${results.affectedAreas.map(a => `\`${a}\``).join(', ') || 'None specified'}

### ${riskEmoji} Risk Level
**${results.riskLevel.toUpperCase()}**

### 🏗️ Architectural Impact
${results.architecturalImpact}`;
  }
}

