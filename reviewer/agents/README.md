# Multi-Agent PR Review System

## Architecture Overview

```
PR Event
 ├── Intent Agent (What changed & why) ✅ IMPLEMENTED
 ├── Code Quality Agent (Bugs & quality) ✅ IMPLEMENTED
 ├── Architecture Agent (Repo rules) 🚧 TODO
 ├── Risk Agent (Blast radius) 🚧 TODO
 ├── Learning Agent (Feedback loop) 🚧 TODO
 └── Summary Agent (Human-readable) 🚧 TODO
```

## Current Agents

### 1. Intent Agent ✅
**Purpose:** Understands what changed and why

**Analyzes:**
- PR title, description, and diff
- Business goal behind the changes
- Technical implementation approach
- Change scope (isolated, module-wide, system-wide)
- Risk level assessment

**Output:**
- Intent summary
- Business goal explanation
- Change type classification (feature, bugfix, refactor, etc.)
- Affected areas
- Architectural impact analysis

**File:** `intent-agent.js`

---

### 2. Code Quality Agent ✅
**Purpose:** Reviews code for bugs, quality issues, and best practices

**Analyzes:**
- Logic errors and bugs
- Security vulnerabilities
- Performance issues
- Missing error handling
- Code maintainability
- Best practice violations

**Output:**
- File-by-file issue list
- Inline comments with severity levels
- Actionable suggestions
- Overall quality assessment

**File:** `code-quality-agent.js`

---

## Future Agents (Ready to Implement)

### 3. Architecture Agent 🚧
**Purpose:** Validates changes against repository rules and architecture patterns

**Should Analyze:**
- Compliance with repo CONTRIBUTING.md
- Adherence to architectural patterns
- Module boundaries and dependencies
- API contract compatibility
- Design pattern usage
- File/folder structure conventions

**Output:**
- Architecture compliance score
- Pattern violations
- Dependency issues
- Breaking changes detected

**File to create:** `architecture-agent.js`

---

### 4. Risk Agent 🚧
**Purpose:** Assesses blast radius and deployment risk

**Should Analyze:**
- Affected user flows
- Database migration risks
- API breaking changes
- Third-party integration impacts
- Performance implications
- Rollback complexity

**Output:**
- Risk score (1-10)
- Blast radius map
- Mitigation recommendations
- Deployment checklist

**File to create:** `risk-agent.js`

---

### 5. Learning Agent 🚧
**Purpose:** Learns from feedback and improves over time

**Should Analyze:**
- Previous PR reviews for this repo
- Developer feedback on past reviews
- False positive/negative patterns
- Repo-specific conventions
- Team preferences

**Output:**
- Personalized insights
- Confidence scores
- Learning improvements
- Pattern recognition

**File to create:** `learning-agent.js`

---

### 6. Summary Agent 🚧
**Purpose:** Creates comprehensive, human-readable summary for stakeholders

**Should Analyze:**
- All other agent outputs
- PR complexity metrics
- Review highlights
- Key decisions made

**Output:**
- Executive summary
- Technical deep-dive
- Review highlights
- Recommended actions

**File to create:** `summary-agent.js`

---

## How to Add a New Agent

### Step 1: Create Agent Class

```javascript
import { BaseAgent } from "./base-agent.js";

export class MyNewAgent extends BaseAgent {
  constructor() {
    super("My New Agent", "Agent description");
  }

  async analyze(context, apiKey) {
    // Access data from previous agents
    const intentAnalysis = context.intentAnalysis;
    const codeQuality = context.codeQualityAnalysis;

    // Build prompts
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(context);

    // Call LLM
    const result = await this.callLLM(
      systemPrompt,
      userPrompt,
      apiKey,
      { temperature: 0.1, max_tokens: 2000 }
    );

    return result;
  }

  buildSystemPrompt() {
    return `You are a specialized agent that does X...`;
  }

  buildUserPrompt(context) {
    return `Analyze this PR: ${context.pr.title}...`;
  }

  format(results) {
    return `## My Agent Results\n\n${results.summary}`;
  }
}
```

### Step 2: Add to Orchestrator

In `orchestrator.js`:

```javascript
import { MyNewAgent } from "./my-new-agent.js";

export class AgentOrchestrator {
  constructor() {
    this.agents = [
      new IntentAgent(),
      new CodeQualityAgent(),
      new MyNewAgent(), // Add here
    ];
  }
}
```

### Step 3: Export from index

In `agents/index.js`:

```javascript
export { MyNewAgent } from "./my-new-agent.js";
```

### Step 4: Add Formatting to Orchestrator

In `orchestrator.js`, update `buildCombinedMarkdown()`:

```javascript
if (agentResults.myNewAgent && !agentResults.myNewAgent.error) {
  const agent = new MyNewAgent();
  markdown += agent.format(agentResults.myNewAgent);
  markdown += `\n\n---\n\n`;
}
```

---

## Agent Communication Flow

```
1. Orchestrator prepares context (PR, files, diffs)
2. Intent Agent analyzes → adds intentAnalysis to context
3. Code Quality Agent uses intentAnalysis → adds codeQualityAnalysis
4. Future agents can access all previous results
5. Orchestrator combines all results into markdown
6. Main reviewer posts comments and summary
```

---

## Testing Your Agent

```bash
# Run the reviewer locally
npm run dev

# Open a test PR in your connected repo
# Check the PR comments and summary

# View agent logs in terminal
# Look for: "Running: Your Agent Name"
```

---

## Agent Design Principles

1. **Single Responsibility:** Each agent has ONE clear purpose
2. **Context Aware:** Agents can use results from previous agents
3. **Fail Gracefully:** If an agent fails, others continue
4. **Actionable Output:** Always provide specific, actionable insights
5. **JSON Structured:** Use structured JSON for programmatic access
6. **Markdown Friendly:** Format method returns human-readable markdown

---

## Performance Considerations

- **Sequential Execution:** Agents run one after another (allows context sharing)
- **Parallel Possible:** Independent agents could run in parallel (future optimization)
- **Token Limits:** Keep prompts under 8K tokens for cost efficiency
- **Model Selection:** Use gpt-4o for complex reasoning, gpt-4o-mini for simple tasks
- **Caching:** Consider caching results for unchanged files (future feature)

---

## Configuration

Agents can be configured via environment variables:

```bash
# Model selection
INTENT_AGENT_MODEL=gpt-4o
CODE_QUALITY_MODEL=gpt-4o-mini

# Temperature settings
INTENT_AGENT_TEMP=0.2
CODE_QUALITY_TEMP=0.1

# Enable/disable agents
ENABLE_INTENT_AGENT=true
ENABLE_ARCHITECTURE_AGENT=false
```

---

## Roadmap

- [x] Base agent infrastructure
- [x] Intent Agent
- [x] Code Quality Agent
- [ ] Architecture Agent
- [ ] Risk Agent
- [ ] Learning Agent
- [ ] Summary Agent
- [ ] Parallel execution optimization
- [ ] Agent configuration system
- [ ] Custom agent plugins
- [ ] Web dashboard for agent insights

---

## Contributing

To contribute a new agent:

1. Follow the "How to Add a New Agent" guide above
2. Ensure your agent has comprehensive error handling
3. Add tests for your agent
4. Document the agent in this README
5. Submit a PR with examples of your agent in action

---

**Built with ❤️ for better PR reviews**

