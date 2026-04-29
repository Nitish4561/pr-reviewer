# 🚀 Multi-Agent System Quick Start

Get your multi-agent PR reviewer up and running in 5 minutes.

---

## ✅ System Status

Your PR reviewer now has:
- ✅ **Intent Agent** - Understands what changed and why
- ✅ **Code Quality Agent** - Reviews for bugs and issues
- ✅ **Agent Orchestrator** - Coordinates everything
- 🚧 **4 More Agents** - Ready to add when needed

---

## 🏃 Quick Test (5 Steps)

### 1. Start Local Server

```bash
npm run dev
```

Server starts on: http://localhost:4002

### 2. Verify Environment

Make sure `.env.local` has:

```bash
# Required
GITHUB_APP_ID=your_app_id
GITHUB_PRIVATE_KEY="your_private_key"
OPENAI_API_KEY=sk-proj-your-key
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_secret

# For local testing
NEXT_PUBLIC_BASE_URL=http://localhost:4002
```

### 3. Create Test PR

In your connected GitHub repo:
1. Make a simple code change
2. Commit and push
3. Open a Pull Request

### 4. Watch the Magic ✨

Terminal output:
```
====================================================================
🤖 MULTI-AGENT PR REVIEW SYSTEM
====================================================================
📍 Repository: yourname/yourrepo
🔢 PR Number: #123
📝 PR Title: Add user authentication
📂 Files Changed: 3
====================================================================

Running: Intent Agent
--------------------------------------------------------------------
🎯 Intent Agent: Analyzing PR intent...
   ✅ Intent analysis complete
   📝 Summary: Add JWT-based authentication
   🎯 Intent: Implement secure user authentication
   📊 Change type: feature
   🔴 Risk Level: high

Running: Code Quality Agent
--------------------------------------------------------------------
🔍 Code Quality Agent: Reviewing 3 file(s)...
   📄 Reviewing: auth.js
   ⚠️  Found 2 issue(s)
   ✅ Total issues found: 2

====================================================================
✅ MULTI-AGENT REVIEW COMPLETE
====================================================================
```

### 5. Check PR Comment

Your PR will have a comprehensive review:

```markdown
# 🤖 Multi-Agent PR Review

## 🎯 Intent Analysis
This PR implements JWT-based authentication...
- Change Type: FEATURE
- Risk Level: HIGH
- Business Goal: Secure user access

## 🔍 Code Quality Review
Found 2 issues across 1 file:

🔴 HIGH (auth.js:42)
Missing token expiration validation...
```

---

## 🎯 What Each Agent Does

### Intent Agent 🎯

**Input:** PR title, description, diffs  
**Output:** What changed and why  

**Example:**
```json
{
  "intent": "Add real-time notifications using WebSocket",
  "businessGoal": "Improve UX and reduce server costs",
  "changeType": "feature",
  "riskLevel": "medium",
  "keyChanges": [
    "Implemented WebSocket server",
    "Added real-time UI updates"
  ]
}
```

---

### Code Quality Agent 🔍

**Input:** File diffs + Intent context  
**Output:** Bugs, issues, suggestions  

**Example:**
```json
{
  "issues": [
    {
      "severity": "high",
      "line": 42,
      "description": "Missing authentication check",
      "suggestion": "Add JWT validation before connection"
    }
  ]
}
```

---

## 🔧 Configuration (Optional)

### Disable Intent Agent Temporarily

```bash
# In .env.local
ENABLE_INTENT_AGENT=false
```

System will work with just Code Quality Agent (like before).

### Use Different Models

```bash
# Use faster model for intent (less accurate)
INTENT_AGENT_MODEL=gpt-4o-mini

# Use better model for code quality (slower)
CODE_QUALITY_MODEL=gpt-4o
```

### Adjust Temperature

```bash
# More deterministic (recommended for code review)
INTENT_AGENT_TEMP=0.1
CODE_QUALITY_TEMP=0.1

# More creative (not recommended)
INTENT_AGENT_TEMP=0.5
CODE_QUALITY_TEMP=0.5
```

---

## 🐛 Troubleshooting

### Problem: "Agent failed to analyze"

**Cause:** OpenAI API issue  

**Solution:**
```bash
# Check API key
echo $OPENAI_API_KEY

# Check credits at platform.openai.com
# Verify key has GPT-4 access
```

---

### Problem: "No review posted to PR"

**Cause:** GitHub permissions  

**Solution:**
1. Check GitHub App has "Pull requests: Read & Write"
2. Verify webhook is connected
3. Check logs for errors

---

### Problem: "Intent Agent is slow"

**Cause:** Using gpt-4o (more powerful but slower)  

**Not actually a problem!**
- Intent analysis takes 5-10 seconds
- This is normal for deep understanding
- Worth it for better context

**If you need faster:**
```bash
INTENT_AGENT_MODEL=gpt-4o-mini  # Less accurate but faster
```

---

## 📊 Expected Performance

| Agent | Time | Tokens | Cost |
|-------|------|--------|------|
| Intent Agent | 5-10s | ~3K | $0.01 |
| Code Quality | 3-5s per file | ~2K | $0.005 |
| **Total** | **10-20s** | **~5-7K** | **~$0.02** |

For a typical 3-5 file PR.

---

## 🎓 Learning Resources

### Quick Reads (5 minutes)
- `EXAMPLES.md` - See example outputs
- This file - Quick start guide

### Deep Dives (15 minutes)
- `README.md` - Agent architecture
- `MULTI_AGENT_SYSTEM.md` - Complete overview

### Implementation (30 minutes)
- `_template-agent.js` - Create new agents
- `base-agent.js` - Understand base class

---

## 🚀 Next Steps

### Immediate
1. ✅ Test with a simple PR
2. ✅ Review the output
3. ✅ Compare with previous reviews

### This Week
1. Test with various PR types (features, bugfixes, refactors)
2. Tune agent prompts if needed
3. Deploy to production

### This Month
1. Add Architecture Agent (validates repo rules)
2. Add Risk Agent (assesses deployment risk)
3. Customize for your team's workflow

---

## 💡 Pro Tips

### 1. Write Good PR Descriptions

Intent Agent works better with context:

**Bad:**
```
Title: Update auth
Description: (empty)
```

**Good:**
```
Title: Migrate authentication to OAuth 2.0
Description: 
Replace custom auth with OAuth 2.0 to improve security 
and enable SSO for enterprise customers.
```

### 2. Check Agent Logs

Terminal logs show what agents are thinking:
```bash
🎯 Intent Agent: Analyzing PR intent...
   📝 Summary: Refactor authentication system
   🎯 Intent: Replace custom auth with OAuth 2.0
```

### 3. Use Labels Effectively

Agents set intelligent labels:
- `🔴 high-priority` - Critical issues found
- `✨ feature` - New feature PR
- `🐛 bug` - Bug fix PR

### 4. Trust the Risk Assessment

Intent Agent assesses risk level:
- **LOW**: Safe to merge
- **MEDIUM**: Review carefully
- **HIGH**: Extra caution needed

---

## 🎉 You're Ready!

Your multi-agent PR review system is set up and ready to use.

### Quick Command Reference

```bash
# Start server
npm run dev

# View logs
# Terminal shows agent execution in real-time

# Test
# Create a PR in your GitHub repo
```

### Need Help?

- **Examples:** See `EXAMPLES.md`
- **Architecture:** Read `README.md`
- **Issues:** Check logs in terminal

---

**Happy reviewing! 🚀**

*The system learns and improves with each review.*

