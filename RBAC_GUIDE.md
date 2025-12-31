# 🔐 Role-Based Access Control (RBAC) Guide

## Overview

NirikshanAI now includes a comprehensive Role-Based Access Control system with admin capabilities, user management, and PR review tracking.

---

## 🎭 User Roles

### Admin Role
- **Full system access**
- Manage all users
- Promote users to admin
- Suspend/reactivate users
- View all PR reviews
- Access admin dashboard

### User Role
- **Standard access**
- View their own dashboard
- Configure OpenAI API key
- View their PR review history
- Cannot access admin features

---

## 🚀 Features

### 1. **First User Auto-Admin**
- The first user to sign up is automatically made an admin
- Ensures someone can manage the system from day one

### 2. **GitHub OAuth Integration**
- Sign in with GitHub
- Automatic user creation on first login
- Session management with secure cookies

### 3. **Admin Dashboard**
- **User Management** (`/admin/users`)
  - View all users
  - Promote/demote admin roles
  - Suspend/reactivate accounts
  - Filter by role and status
  - View user stats (total, admins, users, suspended)

- **Access Requests** (`/admin`)
  - Approve/reject access requests
  - View whitelist
  - Legacy access control management

### 4. **User Dashboard**
- **Recent PR Reviews** (`/dashboard`)
  - Last 10 PR reviews
  - Stats: total reviews, clean PRs, critical issues
  - Direct links to GitHub PRs
  - Issue severity indicators

### 5. **Route Protection**
- Middleware-based authentication
- Protected routes:
  - `/dashboard/*` - Requires authentication
  - `/settings/*` - Requires authentication
  - `/admin/*` - Requires admin role
- Auto-redirect to home if unauthorized

### 6. **PR Review History**
- Every PR review is saved to database
- Tracks:
  - Owner/repo/PR number
  - Issues found and severity
  - Review timestamp
  - Reviewer username
- Accessible via user dashboard

---

## 📁 New File Structure

```
lib/
├── db-enhanced.ts          # Enhanced database with roles & PR tracking
├── auth-middleware.ts      # Auth/authz middleware
└── auth.ts                 # Legacy auth (still used in some places)

app/
├── middleware.ts           # Next.js middleware for route protection
├── api/
│   ├── auth/
│   │   ├── me/route.ts           # Get current user
│   │   ├── logout/route.ts       # Logout endpoint
│   │   └── github/
│   │       └── callback/route.ts # Updated with auto-admin
│   ├── admin/
│   │   ├── users/
│   │   │   ├── route.ts          # List/create users
│   │   │   └── [userId]/route.ts # Update/suspend user
│   │   └── reviews/route.ts      # All PR reviews
│   └── user/
│       └── reviews/route.ts      # User's PR reviews
└── admin/
    ├── page.tsx              # Access control dashboard
    └── users/
        └── page.tsx          # User management page
```

---

## 🛠️ API Endpoints

### Authentication
```
GET  /api/auth/me          # Get current user
GET  /api/auth/github      # Start GitHub OAuth
GET  /api/auth/github/callback  # OAuth callback
GET  /api/auth/logout      # Logout
```

### Admin Endpoints (Admin Only)
```
GET    /api/admin/users              # List all users
POST   /api/admin/users              # Create user manually
PATCH  /api/admin/users/[userId]     # Update role/status
DELETE /api/admin/users/[userId]     # Suspend user
GET    /api/admin/reviews            # View all reviews
```

### User Endpoints (Authenticated)
```
GET  /api/user/reviews     # Get user's PR reviews
POST /api/user/settings    # Update settings
```

---

## 🔄 User Management Workflow

### 1. User Signs Up
```javascript
// First user becomes admin automatically
const isFirstUser = (await userDb.getAll()).length === 0;
const role = isFirstUser ? "admin" : "user";
```

### 2. Admin Promotes User
```bash
PATCH /api/admin/users/{userId}
Body: { "role": "admin" }
```

### 3. Admin Suspends User
```bash
DELETE /api/admin/users/{userId}
# OR
PATCH /api/admin/users/{userId}
Body: { "status": "suspended" }
```

### 4. Admin Reactivates User
```bash
PATCH /api/admin/users/{userId}
Body: { "status": "active" }
```

---

## 📊 Database Schema

### User Model
```typescript
interface User {
  id: string;                // GitHub ID or email
  email: string;
  githubUsername?: string;
  githubId?: string;
  role: "admin" | "user";
  status: "active" | "suspended";
  openaiKey?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}
```

### PR Review Model
```typescript
interface PRReview {
  id: string;
  owner: string;
  repo: string;
  prNumber: number;
  prTitle: string;
  reviewedBy: string;
  issuesFound: number;
  hasHighSeverity: boolean;
  summary: string;
  reviewedAt: string;
  installationId: number;
}
```

---

## 🔒 Security Features

### Session Management
- Secure HTTP-only cookies
- 30-day session expiration
- Session validation on every request

### Authorization Checks
```typescript
// Require authentication
const user = await requireAuth();

// Require admin
const admin = await requireAdmin();

// Check resource access
const canAccess = await canAccessResource(userId);
```

### Middleware Protection
- Runs on edge before page load
- Checks session validity
- Validates role for admin routes
- Auto-redirects unauthorized users

---

## 📈 Usage Examples

### Check Current User (Client)
```typescript
const res = await fetch("/api/auth/me");
const { authenticated, user } = await res.json();

if (authenticated) {
  console.log(`Logged in as ${user.email} (${user.role})`);
}
```

### Fetch User's Reviews
```typescript
const res = await fetch("/api/user/reviews?limit=10");
const { reviews, stats } = await res.json();

console.log(`Total reviews: ${stats.totalReviews}`);
console.log(`Clean PRs: ${stats.cleanPRs}`);
```

### Admin: Get All Users
```typescript
const res = await fetch("/api/admin/users");
const { users } = await res.json();

const admins = users.filter(u => u.role === "admin");
console.log(`${admins.length} admins found`);
```

---

## 🎨 UI Components

### Home Page
- Auto-detects logged-in users
- Shows user role and quick links
- "Sign in with GitHub" button
- Admin/Dashboard links based on role

### User Dashboard
- Stats cards (reviews, clean PRs, critical issues)
- Recent PR reviews list
- OpenAI key configuration
- Instructions

### Admin Dashboard
- User management interface
- Role promotion/demotion
- User suspension
- Stats overview
- Filter by role/status

---

## ⚙️ Configuration

### Environment Variables
```bash
# Required for auth
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app

# Redis for persistent storage
KV_REST_API_URL=your_redis_url
KV_REST_API_TOKEN=your_redis_token

# Optional: Legacy admin emails (still works)
ADMIN_EMAILS=admin@example.com,admin2@example.com
```

### First-Time Setup
1. Deploy the app
2. Sign in with GitHub (becomes admin)
3. Configure OpenAI API key
4. Install GitHub App on repositories
5. Invite other users

---

## 🔄 Migration from Old System

The new RBAC system is **backward compatible** with:
- Existing whitelist system (`/admin` page)
- Installation management
- Access requests
- OpenAI key storage

Users from the old system will be migrated automatically on first login.

---

## 🐛 Troubleshooting

### User Can't Access Dashboard
- Check if session cookie exists
- Verify user status is "active"
- Check browser console for errors

### Admin Routes Not Working
- Verify user role is "admin"
- Check middleware is running
- Clear cookies and re-login

### Reviews Not Showing
- Confirm reviews exist in database
- Check user's `githubUsername` matches PR reviewer
- Verify Redis connection

---

## 🚀 Future Enhancements

- [ ] Team-based access control
- [ ] Custom roles (reviewer, viewer, etc.)
- [ ] Audit logs for admin actions
- [ ] Email notifications
- [ ] 2FA authentication
- [ ] API rate limiting per user
- [ ] User invitations system

---

## 📝 Summary

The RBAC system provides:
✅ Secure authentication with GitHub OAuth
✅ Role-based access (admin/user)
✅ User management dashboard
✅ PR review history tracking
✅ Route protection with middleware
✅ First-user auto-admin
✅ Session management
✅ Backward compatibility

All routes and APIs are protected, and the system scales with Redis persistence.

