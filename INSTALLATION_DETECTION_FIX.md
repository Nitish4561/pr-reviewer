# Installation Detection Fix

## Issue
Dashboard shows **"Uninstall NirikshanAI"** button even when the GitHub App is **not installed**.

## Root Causes Found

### 1. **Webhook Using Wrong Database** (Critical)
The webhook handler was using `db` (in-memory) instead of `kvdb` (Redis) to save installations.

**Impact:**
- In serverless environments, webhook data was lost
- Installation API couldn't find any installations
- But old test data might still be in Redis from previous tests

### 2. **No Uninstall Handler** (Critical)
There was no webhook handler for when users uninstall the GitHub App.

**Impact:**
- When users uninstalled the app, the data stayed in Redis
- Dashboard still thought the app was installed
- "Uninstall" button showed instead of "Install"

### 3. **Incorrect Status Check** (Previously Fixed)
Dashboard was checking `!!data.installation` instead of explicit `installed` field.

---

## Fixes Applied

### 1. **Webhook Now Uses Redis (kvdb)**

**File:** `app/api/webhook/github/route.ts`

```typescript
// Before: ❌
import { db } from "@/lib/db";
await db.installation.saveInstallation({...});

// After: ✅
import { kvdb } from "@/lib/db-kv";
await kvdb.installation.saveInstallation({...});
```

### 2. **Added Uninstall Event Handler**

**New Code:**
```typescript
if (event === "installation" && payload.action === "deleted") {
  console.log("🗑️  INSTALLATION DELETED");
  await kvdb.installation.delete(installationId);
  return NextResponse.json({ ok: true });
}
```

### 3. **Added Delete Method to kvdb.installation**

**File:** `lib/db-kv.ts`

```typescript
async delete(installationId: number | string) {
  const redis = await getRedisClient();
  
  // Delete installation data
  await redis.del(`installation:${installationId}`);
  
  // Remove from installations set
  await redis.sRem("installations:all", installationId.toString());
}
```

### 4. **Added Debug Endpoint**

**New Endpoint:** `GET /api/installations/debug`

Shows:
- All installations in Redis
- Active installations (with repos)
- Installation details for debugging

### 5. **Added Client-Side Debug Display**

Dashboard now shows:
```
Debug: isInstalled = true/false
```

---

## How to Debug After Deployment

### Step 1: Check What's in Redis

Go to: `https://nirikshan-ai-two.vercel.app/api/installations/debug`

You'll see:
```json
{
  "success": true,
  "totalInstallations": 1,
  "activeInstallations": 1,
  "installations": [
    {
      "installationId": 102253979,
      "accountLogin": "nitishkalra-AI",
      "repoCount": 1,
      "hasRepos": true,
      "updatedAt": "2026-01-02T..."
    }
  ]
}
```

**What to look for:**
- `totalInstallations`: Should be 0 if app not installed
- `activeInstallations`: Should be 0 if app not installed
- `hasRepos: true`: Means installation has repositories (is active)

### Step 2: Check Dashboard Debug Info

Go to: `https://nirikshan-ai-two.vercel.app/dashboard`

Look at the GitHub App section, you'll see:
```
Debug: isInstalled = true/false
```

### Step 3: If Showing Wrong Status

#### Scenario A: Old Test Data in Redis

**Problem:** You see installations in the debug endpoint from old tests

**Solution:** Clear old installations manually

**Option 1: Uninstall via GitHub**
1. Go to https://github.com/settings/installations
2. Click on your app
3. Click "Uninstall"
4. This triggers the webhook and deletes from Redis

**Option 2: Clear Redis** (if you have access)
```bash
# Connect to your Redis and run:
KEYS installation:*
# Delete each one if they're old
```

#### Scenario B: Fresh Install Not Detected

**Problem:** You just installed but still shows "Install" button

**Checklist:**
1. Check Vercel logs for installation webhook
2. Look for: "📦 INSTALLATION WEBHOOK RECEIVED"
3. Check if it shows: "✅ Installation saved to Redis"
4. Refresh the dashboard page

#### Scenario C: Uninstall Not Detected

**Problem:** You uninstalled but still shows "Uninstall" button

**Checklist:**
1. Make sure GitHub App webhook is configured
2. Check Vercel logs for: "🗑️  INSTALLATION DELETED WEBHOOK RECEIVED"
3. Check debug endpoint to verify it's gone
4. Refresh the dashboard page

---

## Testing After Deployment

### Test 1: Fresh Installation

1. **Go to dashboard**
   - Should see: "Install NirikshanAI"
   - Debug: `isInstalled = false`

2. **Click "Install NirikshanAI"**
   - Opens GitHub
   - Select repositories
   - Click Install

3. **Check Vercel Logs**
   ```
   📦 INSTALLATION WEBHOOK RECEIVED
   Installation ID: XXX
   💾 Saving installation to database...
   ✅ Installation saved to Redis
   ```

4. **Return to dashboard**
   - Should see: "Uninstall NirikshanAI"
   - Debug: `isInstalled = true`

### Test 2: Uninstallation

1. **Dashboard shows "Uninstall NirikshanAI"**
   - Debug: `isInstalled = true`

2. **Go to GitHub settings**
   - https://github.com/settings/installations
   - Click on NirikshanAI
   - Click "Uninstall"

3. **Check Vercel Logs**
   ```
   🗑️  INSTALLATION DELETED WEBHOOK RECEIVED
   Installation ID: XXX
   🗑️  Deleting installation from Redis...
   ✅ Installation deleted from Redis
   ```

4. **Go back to dashboard**
   - Should see: "Install NirikshanAI"
   - Debug: `isInstalled = false`

5. **Verify with debug endpoint**
   - Should show: `totalInstallations: 0`

---

## Webhook Events Handled

### Installation Events

| Event | Action | Handler | What it does |
|-------|--------|---------|--------------|
| `installation` | `created` | ✅ Implemented | Saves installation to Redis |
| `installation` | `deleted` | ✅ **NEW** | Removes installation from Redis |
| `pull_request` | `opened/sync` | ✅ Implemented | Triggers PR review |

---

## Vercel Logs to Monitor

### Successful Installation Flow:
```
📦 INSTALLATION WEBHOOK RECEIVED
   Account: nitishkalra-AI
   Installation ID: 102253979
📦 Repositories (1):
   - nitishkalra-AI/test-app (ID: 1125641733)
💾 Saving installation to database...
✅ Installation saved to Redis: 102253979
✅ Installation saved successfully
```

### Successful Uninstallation Flow:
```
🗑️  INSTALLATION DELETED WEBHOOK RECEIVED
   Account: nitishkalra-AI
   Installation ID: 102253979
💾 Removing installation from database...
🗑️  Deleting installation from Redis...
✅ Installation deleted from Redis
✅ Installation removed successfully
```

### Dashboard Check:
```
🔍 Checking installation status...
🔍 Checking for installations...
   Found 1 installation(s)
   ✅ Active installation found: 102253979
   Installation data: { installed: true, installation: {...} }
   Is installed: true
```

---

## If Still Having Issues

### 1. Check Debug Endpoint
Go to `/api/installations/debug` and see what's actually in Redis.

### 2. Clear Old Data
If you see old installations, uninstall them via GitHub settings.

### 3. Check Webhooks
Go to your GitHub App settings and verify webhooks are:
- **URL:** `https://nirikshan-ai-two.vercel.app/api/webhook/github`
- **Events:** Installation, Pull Request

### 4. Check Environment Variables
Make sure these are set in Vercel:
- `REDIS_URL` or `KV_REST_API_URL` + `KV_REST_API_TOKEN`
- `GITHUB_WEBHOOK_SECRET` (optional, but recommended)
- `NEXT_PUBLIC_GITHUB_APP_SLUG`: nirikshanai

---

## Files Changed

1. **`app/api/webhook/github/route.ts`**
   - Changed `db` → `kvdb`
   - Added uninstall handler

2. **`lib/db-kv.ts`**
   - Added `delete()` method to `installation`

3. **`app/api/installations/debug/route.ts`** (NEW)
   - Debug endpoint to inspect Redis data

4. **`app/dashboard/page.tsx`**
   - Added debug display

---

## Quick Fix Summary

The main issue was **old installation data staying in Redis** after uninstalling because:

1. ✅ **Fixed:** Webhook now uses `kvdb` (Redis) instead of `db` (in-memory)
2. ✅ **Fixed:** Added handler for `installation.deleted` events
3. ✅ **Fixed:** Created `delete()` method to remove installations
4. ✅ **Added:** Debug endpoint to inspect what's in Redis

**After deploying, if you still see "Uninstall" when app isn't installed:**
1. Check `/api/installations/debug`
2. Uninstall any old installations via GitHub settings
3. Refresh dashboard

The debug information will help you identify exactly what's wrong! 🔍

