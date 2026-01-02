# 🔄 OAuth Flow Fix - Redirect to GitHub App Installation

## What Was Fixed

After users sign in with GitHub OAuth (post-approval), they are now redirected to the **GitHub App installation page** instead of the dashboard.

---

## 🎯 New User Flow

```
1. User requests access (/)
   ↓
2. Admin approves (/admin)
   ↓
3. User clicks "Sign in with GitHub"
   ↓
4. GitHub OAuth flow
   ↓
5. User redirected to: https://github.com/apps/nirikshanai/installations/new
   ↓
6. User installs app on repositories
   ↓
7. User can then go to /dashboard to configure
```

---

## ⚙️ Environment Variable Required

Add this to Vercel:

```bash
NEXT_PUBLIC_GITHUB_APP_SLUG=nirikshanai
```

This is the slug from your GitHub App URL:
```
https://github.com/apps/nirikshanai
                           ^^^^^^^^^
                           This part
```

---

## 📋 Complete Environment Variables Checklist

Make sure these are all set in Vercel:

```bash
# Admin Access
ADMIN_EMAILS=nitish4561kalra@gmail.com

# GitHub OAuth (for user login)
NEXT_PUBLIC_GITHUB_CLIENT_ID=0v23i14XByGtsnQZtIws
GITHUB_CLIENT_SECRET=your_secret

# GitHub App (for PR reviews)
GITHUB_APP_ID=your_app_id
GITHUB_PRIVATE_KEY=your_private_key
GITHUB_WEBHOOK_SECRET=your_webhook_secret
NEXT_PUBLIC_GITHUB_APP_SLUG=nirikshanai  ← ADD THIS!

# Base URL
NEXT_PUBLIC_BASE_URL=https://nirikshan-ai-two.vercel.app

# Redis (already configured ✅)
REDIS_URL=your_redis_url
```

---

## 🧪 Testing the New Flow

### Test Complete User Journey:

1. **Request Access:**
   - Visit `/`
   - Click "Request Beta Access"
   - Submit form

2. **Admin Approval:**
   - Visit `/admin`
   - Login as admin
   - Approve the request

3. **User Login:**
   - Visit `/`
   - Click "Check my approval status"
   - Enter email
   - See "Approved!" message
   - Click green "Sign in with GitHub" button

4. **OAuth Flow:**
   - Authorize the OAuth app
   - **Should redirect to:** `https://github.com/apps/nirikshanai/installations/new`
   - **NOT to:** `/admin` or `/dashboard`

5. **Install GitHub App:**
   - Select repositories
   - Click "Install"
   - User is ready to use NirikshanAI!

6. **Access Dashboard (Optional):**
   - User can visit `/dashboard` anytime
   - Configure OpenAI key
   - View PR review history

---

## 🎯 Redirect Logic

```typescript
// After OAuth callback:
if (user.role === "admin") {
  → Redirect to /admin
} else {
  → Redirect to GitHub App installation page
}
```

This ensures:
- ✅ Admins go to admin dashboard
- ✅ Regular users go to app installation
- ✅ No confusion about next steps

---

## 💡 User Dashboard Access

Users can always access their dashboard by:
1. Visiting `/dashboard` directly
2. Clicking links from the homepage (if signed in)
3. After installing the app

The dashboard is protected - only logged-in users can access it.

---

## 🚀 Deploy

1. Add `NEXT_PUBLIC_GITHUB_APP_SLUG` to Vercel
2. Push the code
3. Test the flow!

This creates a smooth onboarding experience where users are guided directly to app installation after approval. 🎉

