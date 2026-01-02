# 🎯 Simplified User Flow

## Problem with Current System
- Data not persisting (needs Redis)
- Too complex with OAuth + RBAC
- Users confused about flow

## New Simplified Flow

### 👑 **Admin Flow**
```
1. Admin goes to: /admin
2. Enters admin email (from ADMIN_EMAILS env var)
3. Sees dashboard with:
   - Pending access requests
   - Approved users
   - Ability to approve/reject
```

**No OAuth needed for admin** - just email verification against `ADMIN_EMAILS`

### 👤 **User Flow**
```
1. User goes to: / (landing page)
2. Clicks "Request Access"
3. Fills form:
   - Name
   - Email
   - GitHub username
   - Reason (optional)
4. Submits request
5. Admin approves from /admin
6. User receives approval status
7. User adds OpenAI key
8. User installs GitHub App
9. User starts using PR reviews
```

## Environment Setup

```bash
# .env.local or Vercel
ADMIN_EMAILS=your-email@example.com,another-admin@example.com

# GitHub App (for PR reviews)
GITHUB_APP_ID=your_app_id
GITHUB_PRIVATE_KEY=your_private_key
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# Redis (OPTIONAL - uses in-memory if not set)
KV_REST_API_URL=your_redis_url
KV_REST_API_TOKEN=your_redis_token
```

## Key Changes

1. **Admin access**: Email-based (no OAuth needed)
2. **User signup**: Simple access request form
3. **Approval workflow**: Admin approves → User gets notified
4. **Data persistence**: Works in-memory or with Redis
5. **Clear separation**: /admin vs / (public)

## Implementation

See the updated files:
- `app/admin/page.tsx` - Simple email-based login
- `app/page.tsx` - Clean landing page with request form
- No complex OAuth for admin
- Existing access request system (already works!)

