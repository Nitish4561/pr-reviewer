# 🤖 Multi-Agent PR Review System

## Overview

Your PR reviewer has been transformed from a single-agent system into a **multi-agent architecture** that provides deeper, more comprehensive code reviews.

## What's New

### 🎯 Intent Agent (NEW)
Understands **what changed and why** before reviewing code quality.

**Analyzes:**
- Business goal and technical intent
- Change type classification (feature, bugfix, refactor, etc.)
- Scope and blast radius
- Risk level assessment
- Architectural implications

**Output:**
```
🎯 Intent Analysis
- Intent: "Refactor authentication to use OAuth 2.0"
- Business Goal: "Improve security and user experience"
- Change Type: REFACTOR
- Risk Level: MEDIUM
- Affected Areas: authentication, API, database
```

---

### 🔍 Code Quality Agent (REFACTORED)
The original review logic, now as a specialized agent.

**Analyzes:**
- Bugs and logic errors
- Security vulnerabilities
- Performance issues
- Missing error handling
- Code maintainability

**Output:**
```
🔍 Code Quality Review
- 3 issues found across 2 files
- Severity levels: 1 high, 2 medium
- All issues have actionable suggestions
```

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    PR EVENT TRIGGERED                    │
└──────────────────┬──────────────────────────────────────┘
                   │
                   ▼
         ┌─────────────────────┐
         │  Agent Orchestrator  │
         └─────────┬───────────┘
                   │
        ┌──────────┴──────────────────────┐
        │                                  │
        ▼                                  ▼
┌───────────────┐                 ┌──────────────────┐
│ Intent Agent  │───────────────▶ │ Code Quality     │
│ (What & Why)  │   Provides      │ Agent            │
└───────────────┘   Context       │ (Bugs & Issues)  │
                                  └──────────────────┘
                                           │
                    ┌──────────────────────┴─────────┐
                    │                                │
                    ▼                                ▼
            ┌──────────────┐              ┌─────────────────┐
            │   GitHub     │              │   Database      │
            │   Comments   │              │   Storage       │
            └──────────────┘              └─────────────────┘
```

---

## Future Agents (Ready to Add)

### 3️⃣ Architecture Agent (TODO)
- Validates against repo rules and patterns
- Checks architectural compliance
- Detects breaking changes

### 4️⃣ Risk Agent (TODO)
- Assesses deployment risk
- Maps blast radius
- Suggests mitigation strategies

### 5️⃣ Learning Agent (TODO)
- Learns from past reviews
- Adapts to team preferences
- Reduces false positives

### 6️⃣ Summary Agent (TODO)
- Creates executive summary
- Highlights key decisions
- Provides actionable recommendations

---

## How It Works

### 1. Sequential Execution
Agents run one after another, each building on previous insights:

```javascript
1. Intent Agent analyzes → Provides context
2. Code Quality Agent uses intent → Provides detailed issues
3. Future agents use all previous results → Add more insights
4. Orchestrator combines all → Creates comprehensive review
```

### 2. Context Sharing
Each agent can access results from previous agents:

```javascript
async analyze(context, apiKey) {
  // Access previous agent results
  const intentAnalysis = context.intentAnalysis;
  const codeQuality = context.codeQualityAnalysis;
  
  // Use this context to provide better insights
  // ...
}
```

### 3. Graceful Failure
If one agent fails, others continue:

```javascript
try {
  const result = await agent.analyze(context, apiKey);
} catch (error) {
  console.error(`Agent failed: ${error}`);
  // Other agents continue
}
```

---

## Enhanced PR Review Output

### Before (Single Agent)
```
## PR Review Summary
- Found 5 issues in 3 files
- 2 high severity issues
```

### After (Multi-Agent)
```
# Multi-Agent PR Review

## 🎯 Intent Analysis
Summary: This PR refactors the authentication system to use OAuth 2.0...
- Change Type: REFACTOR
- Risk Level: MEDIUM
- Business Goal: Improve security and user experience
- Key Changes:
  - Replaced custom auth with OAuth 2.0
  - Updated database schema
  - Modified API endpoints

## 🔍 Code Quality Review
Found 3 issues across 2 files:

🔴 HIGH (auth.js:42)
Issue: Missing error handling for OAuth token refresh
Suggestion: Add try-catch with exponential backoff

🟡 MEDIUM (api/login.js:15)
Issue: Hardcoded redirect URL
Suggestion: Move to environment variable
```

---

## File Structure

```
reviewer/
├── index.js                    # Main entry (updated)
├── agents/
│   ├── README.md              # Agent documentation
│   ├── index.js               # Agent exports
│   ├── base-agent.js          # Base class for all agents
│   ├── intent-agent.js        # Intent Agent ✅
│   ├── code-quality-agent.js  # Code Quality Agent ✅
│   ├── orchestrator.js        # Coordinates all agents
│   └── _template-agent.js     # Template for new agents
├── github.js                   # GitHub API helpers
├── llm.js                      # (Legacy - can be removed)
└── prompt.js                   # (Legacy - can be removed)
```

---

## Configuration

### Environment Variables

```bash
# Enable/disable specific agents
ENABLE_INTENT_AGENT=true
ENABLE_CODE_QUALITY_AGENT=true

# Model selection (optional)
INTENT_AGENT_MODEL=gpt-4o          # More powerful for intent
CODE_QUALITY_MODEL=gpt-4o-mini     # Faster for quality checks

# Temperature settings (optional)
INTENT_AGENT_TEMP=0.2
CODE_QUALITY_TEMP=0.1
```

---

## Testing Locally

### 1. Run Development Server
```bash
npm run dev
```

### 2. Open a Test PR
Create a PR in your connected GitHub repository

### 3. Check Logs
Watch the terminal for agent execution:
```
🤖 MULTI-AGENT PR REVIEW SYSTEM
====================================================================
🎯 Intent Agent: Analyzing PR intent...
   ✅ Intent analysis complete
   📝 Summary: Refactoring authentication system
   🎯 Intent: Replace custom auth with OAuth 2.0
   📊 Change type: refactor

🔍 Code Quality Agent: Reviewing 3 file(s)...
   📄 Reviewing: auth.js
   ⚠️  Found 2 issue(s)
   ✅ Total issues found: 2
====================================================================
```

### 4. View PR Comment
Check the PR for a comprehensive multi-agent review

---

## Adding New Agents

### Quick Start

1. **Copy the template:**
```bash
cp reviewer/agents/_template-agent.js reviewer/agents/my-agent.js
```

2. **Implement your agent:**
```javascript
export class MyAgent extends BaseAgent {
  constructor() {
    super("My Agent", "What it does");
  }

  async analyze(context, apiKey) {
    // Your analysis logic
    const result = await this.callLLM(systemPrompt, userPrompt, apiKey);
    return result;
  }
}
```

3. **Add to orchestrator:**
```javascript
// In orchestrator.js
import { MyAgent } from "./my-agent.js";

this.agents = [
  new IntentAgent(),
  new CodeQualityAgent(),
  new MyAgent(), // Add here
];
```

4. **Test it:**
```bash
npm run dev
# Open a test PR
```

See `reviewer/agents/README.md` for detailed instructions.

---

## Performance

### Current System
- **Sequential Execution:** Agents run one after another
- **Average Review Time:** 10-15 seconds for 3-5 files
- **Token Usage:** ~8K tokens per review (depends on PR size)

### Optimizations (Future)
- Parallel execution for independent agents
- Result caching for unchanged files
- Incremental reviews for large PRs
- Smart agent selection based on PR type

---

## Migration Notes

### What Changed
- ✅ Old single-agent logic → Code Quality Agent
- ✅ New Intent Agent added
- ✅ Agent orchestrator coordinates everything
- ✅ Enhanced PR comments with multi-agent insights

### What Stayed the Same
- ✅ GitHub webhook integration (no changes needed)
- ✅ API endpoints (no changes needed)
- ✅ Database storage (enhanced with new fields)
- ✅ User authentication (no changes needed)

### Legacy Files (Can Be Removed)
- `reviewer/llm.js` - Replaced by `agents/base-agent.js`
- `reviewer/prompt.js` - Replaced by agent-specific prompts

---

## Benefits

### For Developers
✅ **Understand Intent:** Know *why* changes were made, not just *what* changed  
✅ **Context-Aware Reviews:** Agents use intent to provide better feedback  
✅ **Comprehensive Analysis:** Multiple specialized agents = deeper insights  
✅ **Actionable Feedback:** Every issue comes with specific suggestions

### For Teams
✅ **Consistent Reviews:** Same quality across all PRs  
✅ **Knowledge Sharing:** Intent analysis helps onboard new team members  
✅ **Risk Assessment:** Understand impact before merging  
✅ **Learning Loop:** Future agents will learn team preferences

### For Organizations
✅ **Code Quality:** Catch more issues earlier  
✅ **Developer Velocity:** Faster reviews without sacrificing quality  
✅ **Architecture Compliance:** Enforce standards automatically  
✅ **Audit Trail:** Complete analysis history for every PR

---

## Roadmap

- [x] Phase 1: Base infrastructure
- [x] Phase 2: Intent Agent
- [x] Phase 3: Code Quality Agent
- [ ] Phase 4: Architecture Agent
- [ ] Phase 5: Risk Agent
- [ ] Phase 6: Learning Agent
- [ ] Phase 7: Summary Agent
- [ ] Phase 8: Parallel execution
- [ ] Phase 9: Custom agent plugins
- [ ] Phase 10: Web dashboard

---

## Support

### Documentation
- **Agent Guide:** `reviewer/agents/README.md`
- **Template:** `reviewer/agents/_template-agent.js`
- **Architecture:** This file

### Examples
Check PRs in your repository to see multi-agent reviews in action.

### Contributing
Want to add a new agent? Follow the template and submit a PR!

---

**Built with ❤️ for better code reviews**

