# Multi-Agent Architecture

Visual guide to understanding how the multi-agent system works.

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        GITHUB WEBHOOK                            │
│                     (PR opened/updated)                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  WEBHOOK HANDLER                                 │
│                  (app/api/webhook/github/route.ts)               │
│                                                                  │
│  1. Verify webhook signature                                    │
│  2. Extract PR details                                          │
│  3. Fetch OpenAI key from storage                               │
│  4. Call reviewer service                                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  PR REVIEW SERVICE                               │
│                  (reviewer/index.js)                             │
│                                                                  │
│  1. Fetch PR metadata from GitHub                               │
│  2. Get list of changed files                                   │
│  3. Initialize Agent Orchestrator                               │
│  4. Run multi-agent review                                      │
│  5. Post results to GitHub                                      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              AGENT ORCHESTRATOR                                  │
│              (reviewer/agents/orchestrator.js)                   │
│                                                                  │
│  ┌────────────────────────────────────────┐                    │
│  │  Agent Pipeline (Sequential)           │                    │
│  │                                         │                    │
│  │  1. Intent Agent                       │                    │
│  │  2. Code Quality Agent                 │                    │
│  │  3. (Future: Architecture Agent)       │                    │
│  │  4. (Future: Risk Agent)               │                    │
│  │  5. (Future: Learning Agent)           │                    │
│  │  6. (Future: Summary Agent)            │                    │
│  └────────────────────────────────────────┘                    │
│                                                                  │
│  • Runs agents sequentially                                     │
│  • Passes context between agents                                │
│  • Combines results into markdown                               │
│  • Handles agent failures gracefully                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
         ┌───────────────┴───────────────┐
         │                               │
         ▼                               ▼
┌──────────────────┐           ┌──────────────────┐
│  INTENT AGENT    │           │ CODE QUALITY     │
│                  │           │ AGENT            │
│ 1. Read PR data  │           │ 1. Get files     │
│ 2. Build prompt  │           │ 2. Use intent    │
│ 3. Call GPT-4o   │           │    context       │
│ 4. Parse JSON    │           │ 3. Review each   │
│ 5. Return:       │           │ 4. Find issues   │
│    • Intent      │───────────▶│ 5. Return:       │
│    • Risk level  │  Context   │    • Issues      │
│    • Change type │           │    • Suggestions │
└──────────────────┘           └──────────────────┘
         │                               │
         └───────────────┬───────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│              RESULT AGGREGATION                                  │
│              (orchestrator.js)                                   │
│                                                                  │
│  Combine all agent results:                                     │
│  • Intent analysis → Markdown section                           │
│  • Code quality issues → Inline comments                        │
│  • Risk assessment → Labels & status                            │
│  • Change type → Smart labeling                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  GITHUB OUTPUT                                   │
│                  (reviewer/github.js)                            │
│                                                                  │
│  1. Post PR review comment (markdown)                           │
│  2. Create inline comments on issues                            │
│  3. Apply smart labels                                          │
│  4. Set commit status                                           │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                  GITHUB PR PAGE                                  │
│                                                                  │
│  Developer sees:                                                │
│  • 🎯 Intent Analysis                                           │
│  • 🔍 Code Quality Review                                       │
│  • 💬 Inline comments on issues                                 │
│  • 🏷️ Smart labels (feature, high-risk, etc.)                  │
│  • ✅ Commit status (success/failure)                           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Agent Execution Flow

### Sequential Pipeline

```
PR Event
    │
    ▼
┌─────────────────────────────────────┐
│  ORCHESTRATOR STARTS                │
│  • Fetch PR data                    │
│  • Build combined diff               │
│  • Prepare context                  │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  AGENT 1: INTENT AGENT              │
│                                     │
│  Input:                             │
│  • PR title                         │
│  • PR description                   │
│  • File list                        │
│  • Combined diff                    │
│                                     │
│  Processing:                        │
│  • Build system prompt              │
│  • Build user prompt                │
│  • Call OpenAI GPT-4o               │
│  • Parse JSON response              │
│                                     │
│  Output:                            │
│  • intent: string                   │
│  • businessGoal: string             │
│  • changeType: enum                 │
│  • riskLevel: enum                  │
│  • keyChanges: array                │
│  • affectedAreas: array             │
│  • architecturalImpact: string      │
└────────────┬────────────────────────┘
             │
             ▼ Intent results added to context
             │
┌─────────────────────────────────────┐
│  AGENT 2: CODE QUALITY AGENT        │
│                                     │
│  Input:                             │
│  • Files with patches               │
│  • Intent analysis (from Agent 1) ◀─── Context sharing!
│                                     │
│  Processing:                        │
│  FOR EACH file:                     │
│    • Build context-aware prompt     │
│    • Include intent context         │
│    • Call OpenAI GPT-4o-mini        │
│    • Parse issues                   │
│    • Validate line numbers          │
│                                     │
│  Output:                            │
│  • fileReviews: array               │
│    ├─ filename                      │
│    └─ issues: array                 │
│       ├─ severity                   │
│       ├─ line                       │
│       ├─ description                │
│       └─ suggestion                 │
│  • totalIssues: number              │
│  • hasHighSeverity: boolean         │
└────────────┬────────────────────────┘
             │
             ▼ All results collected
             │
┌─────────────────────────────────────┐
│  ORCHESTRATOR COMBINES              │
│                                     │
│  1. Format Intent Agent results     │
│  2. Format Code Quality results     │
│  3. Build inline comments           │
│  4. Create combined markdown        │
│  5. Extract summary metrics         │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  POST TO GITHUB                     │
│                                     │
│  1. Review comment (markdown)       │
│  2. Inline comments (issues)        │
│  3. Labels (risk, type)             │
│  4. Commit status (pass/fail)       │
└─────────────────────────────────────┘
```

---

## 🧩 Component Interactions

### Base Agent Class

```
┌────────────────────────────────────────┐
│         BaseAgent                      │
│         (base-agent.js)                │
│                                        │
│  Properties:                           │
│  • name: string                        │
│  • description: string                 │
│  • model: string                       │
│                                        │
│  Methods:                              │
│  • callLLM(system, user, key, opts)   │
│  • analyze(context, key) [abstract]   │
│  • format(results) [abstract]         │
└────────────────────────────────────────┘
                    ▲
                    │ extends
        ┌───────────┴───────────┐
        │                       │
┌───────────────┐      ┌────────────────┐
│ Intent Agent  │      │ Code Quality   │
│               │      │ Agent          │
│ Implements:   │      │                │
│ • analyze()   │      │ Implements:    │
│ • format()    │      │ • analyze()    │
│               │      │ • format()     │
└───────────────┘      └────────────────┘
```

### Context Flow

```
┌─────────────────────────────────────────────────────┐
│  Initial Context (from orchestrator)                │
│                                                     │
│  {                                                  │
│    pr: { title, body, user, ... },                 │
│    files: [...],                                   │
│    combinedDiff: "...",                            │
│    octokit: GitHubClient,                          │
│    owner: "username",                              │
│    repo: "reponame",                               │
│    pull_number: 123                                │
│  }                                                  │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  After Intent Agent                                 │
│                                                     │
│  context.intentAnalysis = {                        │
│    intent: "Add OAuth 2.0 authentication",        │
│    businessGoal: "Improve security",              │
│    changeType: "feature",                         │
│    riskLevel: "high",                             │
│    keyChanges: [...],                             │
│    affectedAreas: ["auth", "API"]                 │
│  }                                                  │
└──────────────────┬──────────────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────────────┐
│  After Code Quality Agent                           │
│                                                     │
│  context.codeQualityAnalysis = {                   │
│    fileReviews: [...],                             │
│    totalIssues: 3,                                 │
│    hasHighSeverity: true                           │
│  }                                                  │
└─────────────────────────────────────────────────────┘
                   │
                   ▼
              Future agents can
              access all previous
              results!
```

---

## 🔌 Extension Points

### Adding a New Agent

```
┌─────────────────────────────────────────┐
│  1. Create Agent Class                  │
│     (extends BaseAgent)                 │
│                                         │
│  class ArchitectureAgent {              │
│    async analyze(context, apiKey) {     │
│      // Access previous results         │
│      const intent = context             │
│        .intentAnalysis;                 │
│                                         │
│      // Your analysis logic             │
│      ...                                │
│                                         │
│      return results;                    │
│    }                                    │
│  }                                      │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  2. Add to Orchestrator                 │
│                                         │
│  this.agents = [                        │
│    new IntentAgent(),                   │
│    new CodeQualityAgent(),              │
│    new ArchitectureAgent(), ← Add here  │
│  ];                                     │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  3. Add Formatting                      │
│                                         │
│  if (results.architectureAgent) {       │
│    markdown += agent.format(            │
│      results.architectureAgent          │
│    );                                   │
│  }                                      │
└─────────────────────────────────────────┘
             │
             ▼
          Done! ✅
```

---

## 📊 Data Flow Diagram

```
┌──────────┐
│ GitHub   │
│ Webhook  │
└────┬─────┘
     │ PR data
     ▼
┌──────────┐     ┌─────────────┐
│ Webhook  │────▶│ Get OpenAI  │
│ Handler  │     │ Key         │
└────┬─────┘     └─────────────┘
     │ PR + Key
     ▼
┌──────────────────┐
│ Review Service   │
│ (index.js)       │
└────┬─────────────┘
     │ PR metadata + files
     ▼
┌──────────────────┐
│ Orchestrator     │
│                  │
│  ┌─────────────┐ │
│  │ Intent      │ │
│  │ Agent       │ │
│  └──────┬──────┘ │
│         │        │
│    Intent data   │
│         │        │
│  ┌──────▼──────┐ │
│  │ Code        │ │
│  │ Quality     │ │
│  │ Agent       │ │
│  └──────┬──────┘ │
│         │        │
│    Issue data    │
│         │        │
└─────────┼────────┘
          │
    Combined results
          │
          ▼
┌──────────────────┐
│ GitHub Service   │
│ (github.js)      │
│                  │
│ • Comments       │
│ • Labels         │
│ • Status         │
└──────────────────┘
          │
          ▼
┌──────────────────┐
│ GitHub PR        │
│ (User sees)      │
└──────────────────┘
```

---

## 🎯 Agent Responsibility Map

```
┌─────────────────────────────────────────────────────┐
│  INTENT AGENT 🎯                                    │
│                                                     │
│  Responsible for:                                   │
│  ✓ Understanding PR intent                         │
│  ✓ Identifying business goals                      │
│  ✓ Assessing risk level                            │
│  ✓ Classifying change type                         │
│  ✓ Mapping affected areas                          │
│  ✓ Evaluating architectural impact                 │
│                                                     │
│  NOT responsible for:                               │
│  ✗ Finding bugs                                    │
│  ✗ Reviewing code quality                          │
│  ✗ Checking syntax                                 │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  CODE QUALITY AGENT 🔍                              │
│                                                     │
│  Responsible for:                                   │
│  ✓ Finding bugs and logic errors                   │
│  ✓ Detecting security issues                       │
│  ✓ Identifying performance problems                │
│  ✓ Checking error handling                         │
│  ✓ Validating best practices                       │
│  ✓ Providing actionable suggestions                │
│                                                     │
│  NOT responsible for:                               │
│  ✗ Understanding intent                            │
│  ✗ Assessing business goals                        │
│  ✗ High-level architecture                         │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  ORCHESTRATOR 🎭                                    │
│                                                     │
│  Responsible for:                                   │
│  ✓ Running agents in sequence                      │
│  ✓ Passing context between agents                  │
│  ✓ Combining results                               │
│  ✓ Handling agent failures                         │
│  ✓ Formatting output                               │
│  ✓ Coordinating GitHub interactions                │
│                                                     │
│  NOT responsible for:                               │
│  ✗ Actual analysis                                 │
│  ✗ LLM calls (agents do this)                      │
│  ✗ Business logic                                  │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 Security & Error Handling

```
┌────────────────────────────────────────┐
│  Agent Execution (with error handling) │
└────────────────┬───────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │ Try Agent 1   │
         └───┬───────┬───┘
             │       │
          Success  Failure
             │       │
             │       ▼
             │   ┌─────────────────┐
             │   │ Log error       │
             │   │ Use fallback    │
             │   │ Continue anyway │
             │   └────────┬────────┘
             │            │
             └────────┬───┘
                      │
                      ▼
              ┌───────────────┐
              │ Try Agent 2   │
              └───┬───────┬───┘
                  │       │
               Success  Failure
                  │       │
                  ▼       ▼
         
         All results collected
         (even if some failed)
                  │
                  ▼
         ┌─────────────────┐
         │ Post what we    │
         │ have to GitHub  │
         └─────────────────┘
```

**Key Principle:** One agent failure doesn't stop the review!

---

## 🚀 Future Architecture

### Planned: Parallel Execution

```
Current (Sequential):
Intent → Code Quality → Done
  5s       5s          = 10s total

Future (Parallel):
           ┌→ Architecture Agent (5s) ┐
           │                          │
Intent → ──┼→ Code Quality Agent (5s) ├→ Combine → Done
  5s       │                          │            = 8s total
           └→ Risk Agent (4s) ────────┘
```

### Planned: Smart Agent Selection

```
PR Type Detection
        │
        ├─ Simple bugfix → Skip Architecture Agent
        ├─ Major refactor → Run all agents
        ├─ Documentation → Skip Code Quality
        └─ Hotfix → Fast-track with Risk Agent only
```

---

**Visual guide complete! See code for implementation details.**

