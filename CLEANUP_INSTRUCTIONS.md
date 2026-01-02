# Clean Up Orphaned Installation Data

## The Problem

You have **installation data in Redis** (ID: 102254596) but the app is **NOT installed on GitHub**.

This happened because:
1. The app was previously installed for testing
2. It was deleted from GitHub **before** the uninstall webhook handler was added
3. The data is now stuck in Redis

---

## The Solution

I've created a cleanup endpoint to remove this orphaned data.

---

## Steps to Fix

### Option 1: Clean Up via API (Recommended)

#### Step 1: Deploy the Changes
```bash
git push origin main
```

Wait for Vercel to deploy (takes ~1 minute).

#### Step 2: Clean Up All Installations

Open your browser and go to this URL (or use curl):

```
POST https://nirikshan-ai-two.vercel.app/api/installations/cleanup
```

**Using curl:**
```bash
curl -X POST https://nirikshan-ai-two.vercel.app/api/installations/cleanup
```

**Or visit this URL in Postman/Insomnia:**
- Method: POST
- URL: `https://nirikshan-ai-two.vercel.app/api/installations/cleanup`

**Response:**
```json
{
  "success": true,
  "message": "Deleted 1 installation(s)",
  "deletedCount": 1
}
```

#### Step 3: Verify It's Gone

Go to:
```
https://nirikshan-ai-two.vercel.app/api/installations/debug
```

**Expected response:**
```json
{
  "success": true,
  "totalInstallations": 0,
  "activeInstallations": 0,
  "installations": []
}
```

#### Step 4: Check Dashboard

Go to:
```
https://nirikshan-ai-two.vercel.app/dashboard
```

**Should now show:**
- Button: "Install NirikshanAI" ✅
- Debug: `isInstalled = false` ✅

---

### Option 2: Clean Up Specific Installation

If you only want to delete installation ID 102254596:

```bash
curl -X POST https://nirikshan-ai-two.vercel.app/api/installations/cleanup \
  -H "Content-Type: application/json" \
  -d '{"installationId": "102254596"}'
```

---

### Option 3: Preview Before Cleaning (Dry Run)

To see what will be deleted without actually deleting:

```
GET https://nirikshan-ai-two.vercel.app/api/installations/cleanup
```

Visit this URL in your browser or:
```bash
curl https://nirikshan-ai-two.vercel.app/api/installations/cleanup
```

---

## Testing the Full Flow After Cleanup

### 1. Verify Clean State
- Dashboard shows: "Install NirikshanAI"
- Debug shows: `isInstalled = false`
- Debug endpoint shows: `totalInstallations: 0`

### 2. Install Fresh
1. Click "Install NirikshanAI" on dashboard
2. Select a repository on GitHub
3. Click "Install"
4. Check Vercel logs for: "📦 INSTALLATION WEBHOOK RECEIVED"

### 3. Verify Installation
- Dashboard should show: "Uninstall NirikshanAI"
- Debug shows: `isInstalled = true`
- Debug endpoint shows: `totalInstallations: 1`

### 4. Test Uninstall
1. Go to: https://github.com/settings/installations
2. Find NirikshanAI
3. Click "Uninstall"
4. Check Vercel logs for: "🗑️ INSTALLATION DELETED WEBHOOK RECEIVED"

### 5. Verify Uninstallation
- Dashboard should show: "Install NirikshanAI"
- Debug shows: `isInstalled = false`
- Debug endpoint shows: `totalInstallations: 0`

---

## Endpoints Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/installations/debug` | GET | See all installations in Redis |
| `/api/installations/cleanup` | GET | Preview what will be deleted |
| `/api/installations/cleanup` | POST | Delete all installations |
| `/api/installations/cleanup` | POST + body | Delete specific installation |

---

## Quick Command Reference

### Check what's in Redis:
```bash
curl https://nirikshan-ai-two.vercel.app/api/installations/debug
```

### Clean up all installations:
```bash
curl -X POST https://nirikshan-ai-two.vercel.app/api/installations/cleanup
```

### Clean up specific installation:
```bash
curl -X POST https://nirikshan-ai-two.vercel.app/api/installations/cleanup \
  -H "Content-Type: application/json" \
  -d '{"installationId": "102254596"}'
```

---

## What Happens Next

After cleanup:

1. ✅ **Dashboard will correctly show "Install NirikshanAI"**
2. ✅ **You can install the app fresh**
3. ✅ **Installation will be saved to Redis via webhook**
4. ✅ **Dashboard will update to "Uninstall NirikshanAI"**
5. ✅ **Uninstalling will trigger webhook and clean up Redis**
6. ✅ **Dashboard will update back to "Install NirikshanAI"**

The full install → uninstall → reinstall cycle will work perfectly! 🎉

---

## Troubleshooting

### Still showing "Uninstall" after cleanup?

1. **Hard refresh the dashboard:** Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
2. **Check debug endpoint** to verify data is actually gone
3. **Clear browser cache** and reload

### Can't access cleanup endpoint?

Make sure you've deployed the latest code:
```bash
git push origin main
```

Then wait ~1 minute for Vercel to deploy.

---

## Why This Happened

**Timeline:**
1. You installed NirikshanAI for testing
2. Installation was saved to Redis (ID: 102254596)
3. You uninstalled from GitHub **before** the uninstall webhook handler existed
4. The webhook handler wasn't there to clean up Redis
5. Data remained in Redis even though app was uninstalled

**The Fix:**
- Added uninstall webhook handler (prevents future issues)
- Created cleanup endpoint (fixes current issue)
- Now the full lifecycle works correctly

---

## One-Time Cleanup Only

**Note:** After running the cleanup endpoint **once**, you won't need it again. The uninstall webhook handler will automatically clean up Redis whenever users uninstall the app in the future.

This is just to clean up the **orphaned data from before the fix was deployed**.

