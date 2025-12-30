# 🚀 Final Setup Checklist - Get PR Reviews Working

Follow these steps **in order** to get everything working:

---

## ✅ Step 1: Push Latest Code

```bash
cd /Users/nitishkalra/Desktop/pr-reviewer
git add .
git commit -m "Add Redis persistence for installation and whitelist"
git push
```

---

## ✅ Step 2: Wait for Vercel Deploy

- Go to Vercel dashboard
- Wait until status shows "Ready" (1-2 minutes)
- Check that deployment succeeded

---

## ✅ Step 3: Whitelist Yourself

**Option A - Through Admin Dashboard:**
1. Go to: `https://nirikshan-ai-two.vercel.app/admin`
2. Enter your email: `nitish4561kalra@gmail.com`
3. If you have a pending request, approve it
4. If not, go to landing page and submit a request first

**Option B - Quick Command (run in browser console):**
```javascript
// Request access
fetch('https://nirikshan-ai-two.vercel.app/api/access-request', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Nitish Kalra',
    email: 'nitish4561kalra@gmail.com'
  })
}).then(r => r.json()).then(console.log);

// Then approve yourself in /admin
```

---

## ✅ Step 4: Add OpenAI API Key

1. Go to: `https://nirikshan-ai-two.vercel.app/settings`
2. You should see: "Nitish4561, 1 repository, Installation ID: 101884250"
3. Enter your OpenAI API key (starts with `sk-proj-...`)
4. Click "Save OpenAI Key"
5. You should see: "✅ Saved successfully!"
6. **Wait 2 seconds**, then **refresh the page**
7. Badge should change from "⚠️ No key" to "✅ Key configured"

---

## ✅ Step 5: Test PR Review

1. Go to your repository: `https://github.com/Nitish4561/portfolio-copy`
2. Create a new Pull Request, OR
3. Update an existing PR (push a new commit)
4. Wait 10-30 seconds
5. Check the PR for AI review comments! 🤖

---

## 🔍 Debugging If It Doesn't Work

### Check 1: Is Installation Saved?
Visit: `https://nirikshan-ai-two.vercel.app/api/debug-installation`

Should show:
```json
{
  "installations": {
    "count": 1,
    "ids": ["101884250"],
    "firstInstallation": {
      "installationId": 101884250,
      "accountLogin": "Nitish4561",
      "openaiKey": "sk-proj-..." // ✅ Should have your key
    }
  }
}
```

### Check 2: Are You Whitelisted?
Check Vercel Runtime Logs when creating a PR. Should see:
```
🔍 Whitelist check for Nitish4561 (nitish4561kalra@gmail.com): ✅ APPROVED
```

Not this:
```
🔍 Whitelist check for Nitish4561: ❌ DENIED
```

### Check 3: Vercel Logs
When you create a PR, check Vercel → Logs tab for:
- ✅ `"Webhook received"`
- ✅ `"Installation found"`
- ✅ `"Whitelist check: APPROVED"`
- ✅ `"Running PR review"`

---

## 📋 Quick Verification Checklist

Before creating a PR, verify:

- [ ] Code is pushed to GitHub
- [ ] Vercel shows "Ready" status
- [ ] `/api/debug-installation` shows your installation with OpenAI key
- [ ] You approved yourself in `/admin`
- [ ] Settings page shows "✅ Key configured" badge
- [ ] GitHub App is public (in GitHub settings)

---

## 🎯 Expected Result

When you create or update a PR, within 30 seconds you should see:

1. **AI Review Summary Comment** with all issues found
2. **Inline Comments** on specific lines with suggestions
3. **Label Applied** (`ai-clean` or `ai-needs-attention`)

---

## ⚠️ Common Issues

### "No active installation found"
→ Run the manual debug endpoint to add installation

### "⚠️ No key" badge persists
→ Refresh page after saving key
→ Check `/api/debug-installation` - key should be in Redis

### "🔒 Beta Access Required" comment on PR
→ You're not whitelisted - approve yourself in `/admin`

### No AI comments on PR
→ Check Vercel Runtime Logs for errors
→ Verify OpenAI key is valid and has credits
→ Make sure PR has actual code changes (not just README)

---

## 🔥 Nuclear Option (If Nothing Works)

If completely stuck:

1. **Clear everything:**
   ```javascript
   fetch('https://nirikshan-ai-two.vercel.app/api/debug-installation/clear', {
     method: 'DELETE'
   }).then(r => r.json()).then(console.log);
   ```

2. **Uninstall GitHub App completely**

3. **Push latest code to GitHub**

4. **Wait for Vercel deploy**

5. **Reinstall app fresh**

6. **Whitelist yourself**

7. **Add OpenAI key**

8. **Create PR**

---

## ✨ Success!

When it works, you'll see AI comments like:

> 🔴 **MEDIUM**
> 
> Potential performance issue with multiple calls to new Date().getFullYear()
> 
> **💡 Suggestion:**
> Store the result in a variable and reuse it

---

**Start with Step 1 and follow in order!** Good luck! 🚀

