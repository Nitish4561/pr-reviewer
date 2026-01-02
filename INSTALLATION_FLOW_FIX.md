# GitHub App Installation Flow Fix

## Issue
After users clicked "Install on Repositories" from the dashboard and installed the GitHub App, they were redirected to an error page showing "GitHub authentication failed" instead of back to the dashboard.

## Root Cause
The GitHub App didn't have a proper callback URL configured to handle the redirect after installation.

## Solution

### 1. Created Installation Callback Route
New endpoint: `/api/installations/callback`

This handles the redirect from GitHub after app installation with query parameters:
- `installation_id`: The GitHub installation ID
- `setup_action`: Action type (install, update, etc.)

### 2. Updated Dashboard
Added features:
- ✅ Success message after installation
- ✅ Check if app is installed
- ✅ Show "Install on Repositories" button if not installed
- ✅ Show "Manage Installation" button if already installed
- ✅ Welcome message for new users

### 3. GitHub App Configuration Required

**IMPORTANT:** You need to update your GitHub App settings:

#### Setup URL (Required)
Go to your GitHub App settings and set:
- **Setup URL**: `https://nirikshan-ai-two.vercel.app/api/installations/callback`

This tells GitHub where to redirect users after they install the app.

#### How to Update:
1. Go to: https://github.com/settings/apps
2. Click on your app (NirikshanAI)
3. Scroll to "Setup URL"
4. Set: `https://nirikshan-ai-two.vercel.app/api/installations/callback`
5. **Check** "Redirect on update"
6. Save changes

---

## User Flow After Fix

### Complete Installation Flow:

```
User Dashboard
   ↓
Click "Install on Repositories" (Black CTA)
   ↓
GitHub App Installation Page
   ↓
Select Repositories & Install
   ↓
GitHub redirects to: /api/installations/callback
   ↓
Callback redirects to: /dashboard?installation=success
   ↓
Dashboard shows success message 🎉
   ↓
Black CTA changes to "Manage Installation"
```

---

## Dashboard Button States

### Before Installation:
```
┌─────────────────────────────────┐
│ 🔗 GitHub App                   │
│ Install NirikshanAI...          │
│                                 │
│ [Install on Repositories] ← Black CTA
│ [View All Installations]        │
└─────────────────────────────────┘
```

### After Installation:
```
┌─────────────────────────────────┐
│ 🔗 GitHub App                   │
│ NirikshanAI is installed...     │
│                                 │
│ [Manage Installation]    ← Black CTA (changed)
│ [View All Installations]        │
└─────────────────────────────────┘
```

---

## Testing Steps

### 1. Configure GitHub App Setup URL
- Set Setup URL in GitHub App settings
- Enable "Redirect on update"

### 2. Deploy Changes
```bash
git push origin main
```

### 3. Test Installation Flow
1. Go to dashboard
2. Click "Install on Repositories"
3. Select a repository
4. Click Install
5. **Should redirect to dashboard with success message** ✅

### 4. Verify Button Change
- After installation, the black CTA should show "Manage Installation"
- Click it to verify it goes to GitHub settings

---

## Error Logs to Monitor

Look for these logs in Vercel after installation:
```
📦 GitHub App Setup Callback
   Installation ID: XXX
   Setup Action: install
✅ Redirecting to dashboard after successful installation
```

---

## Files Changed

1. **`app/api/installations/callback/route.ts`** (NEW)
   - Handles GitHub redirect after installation
   
2. **`app/dashboard/page.tsx`**
   - Added `isInstalled` state
   - Added `installationSuccess` message
   - Dynamic button based on installation status
   - Check installation on mount

3. **`app/api/auth/github/callback/route.ts`** (Previous fix)
   - OAuth redirect to dashboard (not GitHub App page)

---

## Environment Variables Required

Make sure these are set in Vercel:
- `NEXT_PUBLIC_BASE_URL`: https://nirikshan-ai-two.vercel.app
- `NEXT_PUBLIC_GITHUB_APP_SLUG`: nirikshanai (or your app slug)

---

## Success Criteria

✅ User signs in with GitHub → Goes to dashboard  
✅ User clicks "Install on Repositories" → Goes to GitHub  
✅ User installs app → Returns to dashboard with success message  
✅ Black CTA changes to "Manage Installation"  
✅ No "authentication failed" errors  

