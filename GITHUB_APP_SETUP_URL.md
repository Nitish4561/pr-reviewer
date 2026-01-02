# GitHub App Setup URL Configuration

## The Issue

After installing the GitHub App, users are redirected to the homepage with "GitHub authentication failed" error, even though the installation webhook successfully saves the installation to Redis.

**Logs show:**
- ✅ Installation webhook received
- ✅ Installation saved to Redis
- ❌ User sees "auth_failed" error

## Root Cause

The GitHub App's **Setup URL** is not configured. When it's missing, GitHub uses the OAuth callback URL for post-installation redirects, which causes authentication errors.

---

## The Solution: Configure Setup URL

### Step 1: Go to GitHub App Settings

1. Visit: https://github.com/settings/apps
2. Click on your app (NirikshanAI)
3. Scroll to **"Post installation"** section

### Step 2: Set the Setup URL

**Setup URL:**
```
https://nirikshan-ai-two.vercel.app/api/installations/callback
```

**Important:**
- ✅ Check the box: **"Redirect on update"**
- This ensures users are redirected after installing OR updating the app

### Step 3: Save Changes

Click "Save changes" at the bottom of the page.

---

## How It Works

### Without Setup URL (Current State - Broken):

```
User clicks "Install NirikshanAI"
   ↓
GitHub App installation page
   ↓
User installs app
   ↓
GitHub redirects to: OAuth callback URL ❌
   (with installation_id parameter)
   ↓
OAuth callback tries to process installation as OAuth flow
   ↓
Fails → redirects to /?error=auth_failed ❌
```

**Webhook still works!** (Installation is saved to Redis)
**But user experience is broken** (User sees error)

### With Setup URL Configured (Fixed):

```
User clicks "Install NirikshanAI"
   ↓
GitHub App installation page
   ↓
User installs app
   ↓
GitHub redirects to: Setup URL ✅
   https://nirikshan-ai-two.vercel.app/api/installations/callback
   ↓
Installation callback redirects to: /?installation=success
   ↓
Homepage shows: "🎉 GitHub App installed successfully!" ✅
```

---

## Fallback Protection

I've also updated the OAuth callback to detect installation parameters and handle them gracefully:

```typescript
// If GitHub sends installation_id + setup_action to OAuth callback
// (happens when Setup URL is not configured)
if (installationId && setupAction) {
  // Redirect to success page instead of trying OAuth flow
  return NextResponse.redirect(`${baseUrl}/?installation=success`);
}
```

This means even if the Setup URL isn't configured, the flow will still work (but it's better to configure it properly).

---

## Testing After Configuration

### 1. Deploy Latest Changes
```bash
git push origin main
```

### 2. Configure Setup URL
- Go to GitHub App settings
- Set Setup URL: `https://nirikshan-ai-two.vercel.app/api/installations/callback`
- Check "Redirect on update"
- Save changes

### 3. Test Installation Flow

#### A. Clean State
```bash
# Remove any test installations
curl -X POST https://nirikshan-ai-two.vercel.app/api/installations/cleanup
```

#### B. Install Fresh
1. Go to dashboard
2. Click "Install NirikshanAI"
3. Select a repository
4. Click "Install"

#### C. Expected Result
- **Redirects to homepage** ✅
- **Shows message:** "🎉 GitHub App installed successfully! Now sign in with GitHub to access your dashboard."
- **No error messages** ✅

#### D. Verify in Logs
Check Vercel logs for:
```
📦 GitHub App Setup Callback
   Installation ID: XXX
   Setup Action: install
✅ Redirecting to homepage after successful installation
```

### 4. Sign In and Verify
1. Click "Sign in with GitHub"
2. Go to dashboard
3. Should show "Uninstall NirikshanAI" ✅

---

## GitHub App Settings Checklist

Make sure these are configured:

### **1. Callback URL (OAuth)**
```
https://nirikshan-ai-two.vercel.app/api/auth/github/callback
```

### **2. Setup URL (Post installation)** ← **THIS IS KEY!**
```
https://nirikshan-ai-two.vercel.app/api/installations/callback
```
☑️ **Redirect on update**

### **3. Webhook URL**
```
https://nirikshan-ai-two.vercel.app/api/webhook/github
```

### **4. Webhook Secret**
Should match your `GITHUB_WEBHOOK_SECRET` environment variable

### **5. Permissions**
- **Repository permissions:**
  - Contents: Read-only (to read PR files)
  - Pull requests: Read & write (to comment on PRs)
  - Metadata: Read-only (required)

- **Organization permissions:** None needed

- **Subscribe to events:**
  - ☑️ Installation
  - ☑️ Pull request

---

## Environment Variables Needed

Make sure these are set in Vercel:

```bash
# GitHub App
NEXT_PUBLIC_GITHUB_APP_SLUG=nirikshanai
GITHUB_APP_ID=your_app_id
GITHUB_PRIVATE_KEY=your_private_key
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# GitHub OAuth
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret

# Base URL
NEXT_PUBLIC_BASE_URL=https://nirikshan-ai-two.vercel.app

# Redis
REDIS_URL=your_redis_url

# Admin
ADMIN_EMAILS=your@email.com
```

---

## Troubleshooting

### Issue: Still seeing "auth_failed" after configuration

**Check:**
1. Did you save the GitHub App settings?
2. Is the Setup URL exactly: `/api/installations/callback`?
3. Did you check "Redirect on update"?
4. Try clearing browser cache

### Issue: Redirect goes to wrong URL

**Check:**
1. `NEXT_PUBLIC_BASE_URL` is set correctly in Vercel
2. No trailing slash in the base URL
3. Setup URL includes full path

### Issue: Installation works but dashboard doesn't show installed

**Check:**
1. Run cleanup endpoint first
2. Verify webhook is saving to Redis (check Vercel logs)
3. Check debug endpoint: `/api/installations/debug`

---

## Summary

**The Fix:**
1. ✅ Configure Setup URL in GitHub App settings
2. ✅ Deploy code with fallback protection
3. ✅ Test installation flow

**Expected Behavior:**
- Install app → Success message on homepage
- Sign in → Dashboard shows "Uninstall NirikshanAI"
- Uninstall → Dashboard shows "Install NirikshanAI"
- Clean, smooth flow with no errors!

**Key Takeaway:** The Setup URL is critical for post-installation redirects. Without it, GitHub uses the OAuth callback which causes authentication errors.

