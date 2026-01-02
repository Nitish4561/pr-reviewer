# Revoke Access Fix

## Issue
When revoking a user's access, they were removed from the whitelist but their access request remained in the "Approved Users" list.

## Root Cause
The `revoke-access` endpoint only removed users from the whitelist but didn't delete their access request from Redis.

## Solution
Updated the revoke access flow to:

1. **Remove from whitelist** - User can no longer sign in
2. **Delete access request** - Remove from approved users list

### Changes Made

#### 1. Added `delete` method to `kvdb.accessRequest`
```typescript
async delete(id: string) {
  // Deletes:
  // - access_request:{id} (the request data)
  // - access_request_email:{email} (email mapping)
  // - Removes from access_requests:all set
}
```

#### 2. Updated `/api/admin/revoke-access`
```typescript
// Step 1: Remove from whitelist
await kvdb.whitelist.remove(email);

// Step 2: Delete their access request
const accessRequest = await kvdb.accessRequest.findByEmail(email);
if (accessRequest) {
  await kvdb.accessRequest.delete(accessRequest.id);
}
```

## Result
Now when admin clicks "Revoke Access":
- ✅ User removed from whitelist
- ✅ User removed from approved users list
- ✅ User cannot sign in
- ✅ User can request access again

## Testing Steps

### 1. Approve a User
- Go to `/admin`
- Approve a pending request
- Verify user appears in "Approved Users" tab
- Verify user appears in "Whitelisted Users" section

### 2. Revoke Access
- Click "Revoke Access" button in "Whitelisted Users"
- Refresh the page

### 3. Verify Complete Removal
- User should NOT appear in "Whitelisted Users"
- User should NOT appear in "Approved Users" tab
- If user tries to sign in, should get "access pending approval" error

### 4. Re-Request Access
- User can request access again
- New request should appear in admin dashboard
