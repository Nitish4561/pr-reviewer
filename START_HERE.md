# 🚀 START HERE - Your Multi-Agent PR Reviewer

## ✅ What Just Happened?

Your PR reviewer now has a **multi-agent system** with:

✅ **Intent Agent** - Understands what changed and why  
✅ **Code Quality Agent** - Reviews code for bugs and issues  
✅ **Agent Orchestrator** - Coordinates everything  

---

## 🏃 Quick Start (3 Steps)

### Step 1: Start the Server (30 seconds)

```bash
# Make sure you're in the project directory
cd /Users/nitishkalra/Desktop/pr-reviewer

# Start development server
npm run dev
```

**Expected output:**
```
> pr-reviewer@1.0.0 dev
> next dev -p 4002

   ▲ Next.js 16.1.1
   - Local:        http://localhost:4002
   - Ready in 2.3s
```

✅ Server is running!

---

### Step 2: Verify Environment (1 minute)

Check that `.env.local` exists and has:

```bash
# Quick check
cat .env.local | grep OPENAI_API_KEY
cat .env.local | grep GITHUB_APP_ID
```

If missing, copy from Vercel or see [`ENV_SETUP.md`](ENV_SETUP.md).

✅ Environment configured!

---

### Step 3: Test with a PR (2 minutes)

1. Go to a GitHub repo where your app is installed
2. Create a new branch:
   ```bash
   git checkout -b test-multi-agent
   ```

3. Make a small change:
   ```bash
   echo "// Test change" >> some-file.js
   git add .
   git commit -m "test: Test multi-agent review"
   git push origin test-multi-agent
   ```

4. Open a Pull Request on GitHub

5. Watch your terminal! You'll see:
   ```
   ====================================================================
   🤖 MULTI-AGENT PR REVIEW SYSTEM
   ====================================================================
   📍 Repository: yourname/yourrepo
   🔢 PR Number: #123
   📂 Files Changed: 1
   ====================================================================

   Running: Intent Agent
   --------------------------------------------------------------------
   🎯 Intent Agent: Analyzing PR intent...
      ✅ Intent analysis complete
      📝 Summary: Test change for multi-agent review
      🎯 Intent: Testing the new review system
      📊 Change type: chore

   Running: Code Quality Agent
   --------------------------------------------------------------------
   🔍 Code Quality Agent: Reviewing 1 file(s)...
      📄 Reviewing: some-file.js
      ✅ No issues found
   ```

6. Check your PR - you'll see a comprehensive review! 🎉

✅ System working!

---

## 📚 What to Read Next

### If you have 5 minutes:
👉 **[QUICKSTART.md](reviewer/agents/QUICKSTART.md)** - Quick overview

### If you have 15 minutes:
👉 **[EXAMPLES.md](reviewer/agents/EXAMPLES.md)** - See example outputs  
👉 **[MIGRATION_GUIDE.md](MIGRATION_GUIDE.md)** - Understand changes

### If you have 30 minutes:
👉 **[MULTI_AGENT_SYSTEM.md](MULTI_AGENT_SYSTEM.md)** - Deep dive  
👉 **[reviewer/agents/README.md](reviewer/agents/README.md)** - Build agents

---

## 🎯 Your Multi-Agent Architecture

```
PR Event
 ├── 🎯 Intent Agent (What & Why) ✅ DONE
 ├── 🔍 Code Quality Agent        ✅ DONE
 ├── 🏗️ Architecture Agent        🚧 TODO
 ├── ⚡ Risk Agent                🚧 TODO
 ├── 🧠 Learning Agent            🚧 TODO
 └── 📊 Summary Agent             🚧 TODO
```

**You built the foundation. 4 more agents are ready to add!**

---

## 💡 Quick Tips

### 1. Check Logs
Terminal shows what agents are thinking:
```bash
🎯 Intent Agent: Analyzing PR intent...
   📝 Summary: Add OAuth authentication
   🔴 Risk Level: high
```

### 2. Write Good PR Descriptions
Agents work better with context:

**Good:**
```
Title: Add OAuth 2.0 authentication
Description: Replace custom auth to improve security
```

**Bad:**
```
Title: Update auth
Description: (empty)
```

### 3. Iterate on Agents
Agent prompts are customizable:
- `reviewer/agents/intent-agent.js` - Modify intent analysis
- `reviewer/agents/code-quality-agent.js` - Adjust quality checks

---

## 🐛 Troubleshooting

### Problem: Server won't start

```bash
# Check if port 4002 is in use
lsof -i :4002

# Kill existing process if needed
kill -9 <PID>

# Try again
npm run dev
```

---

### Problem: "Missing OpenAI API key"

```bash
# Check .env.local exists
ls -la .env.local

# Verify it has the key
cat .env.local | grep OPENAI_API_KEY

# If missing, add it:
echo "OPENAI_API_KEY=sk-proj-your-key" >> .env.local

# Restart server
# Press Ctrl+C then run: npm run dev
```

---

### Problem: "Agent failed to analyze"

**Check terminal logs:**
```bash
# Look for error messages like:
❌ Intent Agent failed: API error 401
```

**Common causes:**
- Invalid OpenAI API key
- Insufficient API credits
- Rate limit exceeded

**Solution:**
1. Verify key at https://platform.openai.com/api-keys
2. Check usage at https://platform.openai.com/usage
3. Wait a minute and try again

---

### Problem: "No review posted to PR"

**Check:**
1. GitHub App has "Pull requests: Read & Write" permission
2. Webhook is connected (check GitHub App settings)
3. Terminal shows the review completing
4. No errors in logs

**Debug:**
```bash
# Check webhook deliveries in GitHub:
# Settings → Developer settings → GitHub Apps → Your App → Advanced
```

---

## 🎓 Learn More

### Documentation Index

| File | What It Covers | Time |
|------|---------------|------|
| [`QUICKSTART.md`](reviewer/agents/QUICKSTART.md) | Quick overview | 5 min |
| [`EXAMPLES.md`](reviewer/agents/EXAMPLES.md) | Example outputs | 10 min |
| [`MIGRATION_GUIDE.md`](MIGRATION_GUIDE.md) | What changed | 15 min |
| [`MULTI_AGENT_SYSTEM.md`](MULTI_AGENT_SYSTEM.md) | Architecture | 30 min |
| [`reviewer/agents/README.md`](reviewer/agents/README.md) | Build agents | 30 min |
| [`ARCHITECTURE.md`](reviewer/agents/ARCHITECTURE.md) | Visual guide | 20 min |

---

## ✨ What Makes This Special

### Before: Single Agent
```
Review Code → Find Issues → Done
```
Simple but limited.

### After: Multi-Agent
```
Understand Intent → Review Quality → (More agents coming) → Done
```
Deep, comprehensive analysis.

**Key Difference:** The system now *understands* your PRs before reviewing them!

---

## 🚀 Next Steps

### This Week
1. ✅ Test with various PR types
2. ✅ Review agent outputs
3. ✅ Deploy to production (or keep local)

### This Month
1. Add **Architecture Agent** (validates repo rules)
2. Add **Risk Agent** (assesses deployment risk)
3. Customize prompts for your team

### This Quarter
1. Add **Learning Agent** (learns from feedback)
2. Build analytics dashboard
3. Share with other teams

---

## 📞 Need Help?

### Can't find something?
All documentation is in these files:
```bash
# List all docs
ls -1 *.md reviewer/agents/*.md
```

### Something not working?
1. Check terminal logs (detailed errors there)
2. Read [`MIGRATION_GUIDE.md`](MIGRATION_GUIDE.md#troubleshooting)
3. Try with a simple test PR first

### Want to add an agent?
1. Copy [`reviewer/agents/_template-agent.js`](reviewer/agents/_template-agent.js)
2. Follow guide in [`reviewer/agents/README.md`](reviewer/agents/README.md)
3. Test locally before deploying

---

## 🎉 You're Ready!

Your multi-agent PR review system is complete and ready to use.

**Right now:**
```bash
npm run dev
```

**Then:**
1. Create a test PR
2. Watch the agents work
3. See comprehensive review

---

## 📖 Documentation Quick Access

```bash
# Quick start guide (5 min)
cat reviewer/agents/QUICKSTART.md

# See example outputs (10 min)
cat reviewer/agents/EXAMPLES.md

# Understand architecture (20 min)
cat reviewer/agents/ARCHITECTURE.md

# Build new agents (30 min)
cat reviewer/agents/README.md
```

---

**Built with ❤️ for intelligent code reviews**

*Questions? Everything is documented in the files above!*

---

## ⚡ TL;DR

```bash
# 1. Start server
npm run dev

# 2. Create test PR in your GitHub repo

# 3. Watch terminal for agent execution

# 4. Check PR for comprehensive review

# Done! 🎉
```

**That's it! Your multi-agent system is working.**

