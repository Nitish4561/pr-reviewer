# NirikshanAI - Multi-Agent PR Reviewer

An intelligent, multi-agent AI system that automatically reviews pull requests with deep understanding and comprehensive analysis.

**🆕 Now with Multi-Agent Architecture!**

---

## 🌟 What's New - Multi-Agent System

Your PR reviewer has evolved from a single AI to a **coordinated team of specialized agents**:

```
PR Event
 ├── 🎯 Intent Agent (What changed & why) ✅
 ├── 🔍 Code Quality Agent (Bugs & issues) ✅
 ├── 🏗️ Architecture Agent (Repo rules) 🚧 Coming Soon
 ├── ⚡ Risk Agent (Blast radius) 🚧 Coming Soon
 ├── 🧠 Learning Agent (Feedback loop) 🚧 Coming Soon
 └── 📊 Summary Agent (Human-readable) 🚧 Coming Soon
```

### Key Improvements

- ✅ **Understands Intent** - Knows *why* changes were made, not just *what* changed
- ✅ **Context-Aware Reviews** - Uses intent to provide smarter feedback
- ✅ **Risk Assessment** - Automatically evaluates deployment risk (Low/Medium/High)
- ✅ **Change Classification** - Identifies feature/bugfix/refactor/hotfix automatically
- ✅ **Extensible Architecture** - Easy to add new specialized agents
- ✅ **Better Insights** - Multiple specialized agents = deeper analysis

---

## 🚀 Features

### Intent Agent 🎯
- Analyzes PR title, description, and diffs
- Identifies business goals and technical approach
- Assesses risk level and scope
- Provides architectural impact analysis
- Classifies change types

### Code Quality Agent 🔍
- Reviews code for bugs and logic errors
- Detects security vulnerabilities
- Identifies performance issues
- Checks error handling
- Validates code maintainability
- Posts inline comments with suggestions

### System Features
- 📝 Comprehensive PR reviews with multi-agent insights
- 🏷 Intelligent label application based on risk and type
- 💬 Inline comments on specific code issues
- ✅ GitHub commit status integration
- 🎨 Beautiful, structured markdown output
- ⚡ Graceful failure handling per agent

---

## 🏃 Quick Start

### Option 1: Local Development (Recommended)

```bash
# 1. Install dependencies
npm install

# 2. Set up environment variables (see ENV_SETUP.md)
cp .env.local.example .env.local
# Edit .env.local with your credentials

# 3. Start development server
npm run dev
```

Server runs on: http://localhost:4002

**📚 Detailed Guides:**
- **Quick Start:** [`MIGRATION_GUIDE.md`](MIGRATION_GUIDE.md)
- **Environment Setup:** [`ENV_SETUP.md`](ENV_SETUP.md)
- **Multi-Agent Docs:** [`MULTI_AGENT_SYSTEM.md`](MULTI_AGENT_SYSTEM.md)

### Option 2: Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

---

## 📋 Required Configuration

### Environment Variables

Create `.env.local` with:

```bash
# GitHub App
GITHUB_APP_ID=your_app_id
GITHUB_PRIVATE_KEY="your_private_key"
NEXT_PUBLIC_GITHUB_APP_SLUG=your-app-slug

# GitHub OAuth
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_secret

# OpenAI
OPENAI_API_KEY=sk-proj-your-key

# Admin (for access control)
ADMIN_EMAILS=your-email@example.com

# Optional: Customize agents
INTENT_AGENT_MODEL=gpt-4o          # or gpt-4o-mini for faster reviews
CODE_QUALITY_MODEL=gpt-4o-mini
```

See [`ENV_SETUP.md`](ENV_SETUP.md) for detailed setup instructions.

---

## 💻 Usage

### 1. Install GitHub App

Install your GitHub App on repositories you want to review.

### 2. Open a Pull Request

The multi-agent system automatically reviews PRs:

```
PR Opened
    ↓
🎯 Intent Agent analyzes what changed and why
    ↓
🔍 Code Quality Agent reviews code with context
    ↓
📝 Comprehensive review posted
    ↓
🏷️ Smart labels applied
    ↓
✅ Commit status updated
```

### 3. Review the Output

You'll get a comprehensive review like this:

```markdown
# 🤖 Multi-Agent PR Review

## 🎯 Intent Analysis
This PR implements OAuth 2.0 authentication...
- Change Type: FEATURE
- Risk Level: MEDIUM
- Business Goal: Improve security and enable SSO

## 🔍 Code Quality Review
Found 2 issues across 1 file:

🔴 HIGH (auth.js:42)
Missing token expiration check...
💡 Suggestion: Add token.expiresAt validation
```

### 4. See Example Reviews

Check [`reviewer/agents/EXAMPLES.md`](reviewer/agents/EXAMPLES.md) for real examples.

---

## 🎨 Customization

### Add New Agents

The system is designed for easy extension:

```bash
# 1. Copy the template
cp reviewer/agents/_template-agent.js reviewer/agents/my-agent.js

# 2. Implement your agent
# See reviewer/agents/README.md for guide

# 3. Add to orchestrator
# Import and add to agents array

# 4. Test with a PR
```

### Customize Existing Agents

Edit agent files directly:
- `reviewer/agents/intent-agent.js` - Modify intent analysis
- `reviewer/agents/code-quality-agent.js` - Adjust quality checks

### Configure Agent Behavior

```bash
# In .env.local
ENABLE_INTENT_AGENT=true
ENABLE_CODE_QUALITY_AGENT=true
INTENT_AGENT_MODEL=gpt-4o
INTENT_AGENT_TEMP=0.2
```

---

## 🛡️ Robust Design

### Graceful Failure Handling

Each agent fails independently without affecting others:

```javascript
Intent Agent fails ❌
    ↓
Code Quality Agent continues ✅
    ↓
Review still posted with partial results
```

### Fallback Behavior

If an agent fails:
- Uses fallback analysis
- Logs detailed error information
- Continues with other agents
- Posts what's available

---

## 📚 Documentation

### Getting Started
- [`QUICKSTART.md`](reviewer/agents/QUICKSTART.md) - 5-minute quick start
- [`MIGRATION_GUIDE.md`](MIGRATION_GUIDE.md) - Migration from old system
- [`ENV_SETUP.md`](ENV_SETUP.md) - Environment configuration

### Multi-Agent System
- [`MULTI_AGENT_SYSTEM.md`](MULTI_AGENT_SYSTEM.md) - Complete architecture overview
- [`reviewer/agents/README.md`](reviewer/agents/README.md) - Agent development guide
- [`reviewer/agents/EXAMPLES.md`](reviewer/agents/EXAMPLES.md) - Example outputs

### Implementation Details
- [`reviewer/agents/_template-agent.js`](reviewer/agents/_template-agent.js) - Agent template
- [`reviewer/agents/base-agent.js`](reviewer/agents/base-agent.js) - Base agent class
- [`reviewer/agents/orchestrator.js`](reviewer/agents/orchestrator.js) - Orchestration logic

---

## 🎯 Roadmap

### ✅ Phase 1: Foundation (Complete)
- [x] Base agent infrastructure
- [x] Intent Agent
- [x] Code Quality Agent
- [x] Agent orchestration
- [x] Comprehensive documentation

### 🚧 Phase 2: Advanced Agents (Coming Soon)
- [ ] Architecture Agent - Validate repo rules
- [ ] Risk Agent - Assess deployment risk
- [ ] Learning Agent - Improve over time
- [ ] Summary Agent - Executive summaries

### 🔮 Phase 3: Optimization (Future)
- [ ] Parallel agent execution
- [ ] Result caching
- [ ] Custom agent plugins
- [ ] Web dashboard
- [ ] Analytics and insights

---

## 🤝 Contributing

### Adding a New Agent

1. Read [`reviewer/agents/README.md`](reviewer/agents/README.md)
2. Copy [`_template-agent.js`](reviewer/agents/_template-agent.js)
3. Implement your agent logic
4. Add to orchestrator
5. Test with real PRs
6. Document your agent
7. Submit a PR!

### Improving Existing Agents

- Enhance prompts for better accuracy
- Add more context awareness
- Improve error handling
- Add new output formats

---

## 📊 Performance

| Metric | Value |
|--------|-------|
| Average Review Time | 10-20 seconds |
| Token Usage per PR | ~5-7K tokens |
| Cost per Review | ~$0.02 |
| Agents Active | 2 (Intent + Code Quality) |
| Success Rate | >95% |

For a typical 3-5 file PR.

---

## 🐛 Troubleshooting

### Common Issues

**"Agent failed to analyze"**
- Check OpenAI API key
- Verify API credits
- Review error logs

**"No review posted"**
- Check GitHub App permissions
- Verify webhook connection
- Inspect terminal logs

**"Reviews are slow"**
- Intent Agent uses GPT-4o (5-10s)
- This is normal for quality analysis
- Switch to gpt-4o-mini for speed (less accurate)

See detailed troubleshooting in [`MIGRATION_GUIDE.md`](MIGRATION_GUIDE.md).

---

## 📞 Support

### Documentation
- Start here: [`QUICKSTART.md`](reviewer/agents/QUICKSTART.md)
- Architecture: [`MULTI_AGENT_SYSTEM.md`](MULTI_AGENT_SYSTEM.md)
- Examples: [`reviewer/agents/EXAMPLES.md`](reviewer/agents/EXAMPLES.md)

### Community
- Open an issue for bugs
- Submit PRs for improvements
- Share your custom agents!

---

## 📄 License

Internal tool for your organization's use.

---

## 🎉 What Makes This Special

### Before: Single Agent
```
Review Code → Find Issues → Done
```

Simple, but limited understanding.

### After: Multi-Agent System
```
Understand Intent → Review Quality → Assess Risk → Comprehensive Insights
```

Deep analysis with multiple specialized perspectives.

---

**Built with ❤️ for better code reviews**

*Start with [`QUICKSTART.md`](reviewer/agents/QUICKSTART.md) to see it in action!*
