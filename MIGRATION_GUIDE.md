# Migration to Multi-Agent System

## ✅ What Was Done

Your PR reviewer has been successfully upgraded from a single-agent to a multi-agent system!

### New Files Created
```
reviewer/agents/
  ├── base-agent.js          # Base class for all agents
  ├── intent-agent.js        # NEW: Analyzes what changed & why
  ├── code-quality-agent.js  # REFACTORED: Original review logic
  ├── orchestrator.js        # Coordinates all agents
  ├── index.js               # Agent exports
  ├── README.md              # Agent documentation
  └── _template-agent.js     # Template for new agents
```

### Modified Files
```
reviewer/index.js            # Updated to use multi-agent orchestrator
```

### Documentation Added
```
MULTI_AGENT_SYSTEM.md        # Complete system overview
reviewer/agents/README.md    # Agent development guide
MIGRATION_GUIDE.md          # This file
```

---

## 🚀 Getting Started

### 1. Test Locally

```bash
# Install dependencies (if needed)
npm install

# Start development server
npm run dev
```

The server will start on port 4002: http://localhost:4002

### 2. Make a Test PR

Create a PR in your connected GitHub repository. The new multi-agent system will:

1. **Intent Agent** analyzes what changed and why
2. **Code Quality Agent** reviews code for bugs and issues
3. **Orchestrator** combines insights and posts comprehensive review

### 3. Check the Results

Look for these sections in the PR review:

```markdown
# Multi-Agent PR Review

## 🎯 Intent Analysis
- What this PR is trying to achieve
- Business goal and technical approach
- Risk level and affected areas

## 🔍 Code Quality Review
- Specific issues found
- Inline comments on problematic lines
- Actionable suggestions
```

---

## 🔧 Configuration (Optional)

### Enable/Disable Agents

Add to `.env.local`:

```bash
# Agent Configuration (optional - all enabled by default)
ENABLE_INTENT_AGENT=true
ENABLE_CODE_QUALITY_AGENT=true

# Model Selection (optional - uses sensible defaults)
INTENT_AGENT_MODEL=gpt-4o          # More powerful for understanding intent
CODE_QUALITY_MODEL=gpt-4o-mini     # Faster for quality checks
```

### No Changes Required

The system works out of the box with your existing:
- ✅ GitHub App configuration
- ✅ OpenAI API key
- ✅ Webhook setup
- ✅ Database storage
- ✅ Authentication

---

## 📊 Comparison

### Before: Single Agent
```
Review PR → Find Issues → Post Comments → Done
```

**Output:**
- Simple issue list
- No context about intent
- One-dimensional analysis

### After: Multi-Agent System
```
Review PR → Intent Agent → Code Quality Agent → Orchestrate → Post Comprehensive Review
```

**Output:**
- Understanding of what changed and why
- Context-aware code quality review
- Risk assessment
- Actionable insights
- Ready for 4 more specialized agents

---

## 🎯 Next Steps

### Immediate
1. ✅ Test the system with a PR
2. ✅ Review the multi-agent output
3. ✅ Compare with previous reviews

### Short Term (Optional)
1. Add **Architecture Agent** to validate repo rules
2. Add **Risk Agent** for deployment risk assessment
3. Customize agent prompts for your team's needs

### Long Term
1. Add **Learning Agent** for continuous improvement
2. Add **Summary Agent** for stakeholder communication
3. Build custom agents for your specific needs

---

## 🔍 Monitoring

### Check Agent Logs

When a PR is reviewed, you'll see detailed logs:

```
====================================================================
🤖 MULTI-AGENT PR REVIEW SYSTEM
====================================================================
📍 Repository: owner/repo
🔢 PR Number: #123
📝 PR Title: Add OAuth authentication
📂 Files Changed: 5
====================================================================

Running: Intent Agent
--------------------------------------------------------------------
🎯 Intent Agent: Analyzing PR intent...
   ✅ Intent analysis complete
   📝 Summary: Refactor authentication system
   🎯 Intent: Add OAuth 2.0 support
   📊 Change type: feature

Running: Code Quality Agent
--------------------------------------------------------------------
🔍 Code Quality Agent: Reviewing 5 file(s)...
   📄 Reviewing: auth.js
   ⚠️  Found 2 issue(s)
   📄 Reviewing: api/login.js
   ✅ No issues found
   📊 Total issues found: 2

====================================================================
✅ MULTI-AGENT REVIEW COMPLETE
====================================================================
```

### Review Metrics

Track these in your terminal logs:
- Agent execution time
- Issues found per agent
- Risk levels identified
- Change type distribution

---

## 🐛 Troubleshooting

### Issue: "Agent failed to analyze"

**Solution:**
- Check OpenAI API key is valid
- Ensure sufficient OpenAI API credits
- Review error logs in terminal

### Issue: "No review posted"

**Solution:**
- Check GitHub App permissions (write access to PRs)
- Verify webhook is connected
- Check terminal logs for errors

### Issue: "Intent Agent takes too long"

**Solution:**
- Intent Agent uses GPT-4o for deep analysis (takes 5-10 seconds)
- This is normal for comprehensive understanding
- For faster reviews, switch to gpt-4o-mini in config (less accurate)

---

## 🔄 Rollback (If Needed)

If you need to revert to the old system temporarily:

### Option 1: Keep Multi-Agent, Disable Intent Agent

```bash
# In .env.local
ENABLE_INTENT_AGENT=false
```

This will use only Code Quality Agent (same as before).

### Option 2: Full Rollback

```bash
# Backup current files
mv reviewer/index.js reviewer/index-multiagent.js

# Restore from git history (if available)
git checkout HEAD~1 reviewer/index.js
```

**Note:** We recommend keeping the multi-agent system as it provides better reviews.

---

## 📚 Learning Resources

### Understanding the System
1. Read `MULTI_AGENT_SYSTEM.md` for architecture overview
2. Review `reviewer/agents/README.md` for agent details
3. Check `_template-agent.js` to see how agents work

### Adding New Agents
1. Copy `_template-agent.js` as a starting point
2. Follow the guide in `reviewer/agents/README.md`
3. Test with a PR before deploying

### Customizing Behavior
1. Modify agent prompts in their respective files
2. Adjust temperature for more/less creative responses
3. Change models for speed vs accuracy tradeoff

---

## ✨ Benefits You'll See

### Immediate
- ✅ **Better Context:** Understand why changes were made
- ✅ **Smarter Reviews:** Code quality aware of intent
- ✅ **Risk Assessment:** Know the impact level
- ✅ **Cleaner Output:** Well-structured review comments

### Over Time
- ✅ **Extensible:** Add new agents easily
- ✅ **Customizable:** Tailor to your team's needs
- ✅ **Learning:** Future agents will adapt to your patterns
- ✅ **Comprehensive:** Cover all aspects of PR review

---

## 🤝 Support

### Questions?
- Check documentation: `MULTI_AGENT_SYSTEM.md`
- Review agent README: `reviewer/agents/README.md`
- Examine template: `reviewer/agents/_template-agent.js`

### Found a Bug?
- Check terminal logs for errors
- Verify configuration in `.env.local`
- Test with a simple PR first

### Want to Contribute?
- Create a new agent using the template
- Improve existing agent prompts
- Add tests for agents
- Share your custom agents!

---

## 🎉 You're All Set!

Your multi-agent PR review system is ready to use. Create a PR and watch the magic happen!

**Key Takeaway:** You now have a foundation for a sophisticated, extensible PR review system that can grow with your needs.

---

**Next Step:** Open http://localhost:4002 and create a test PR!

