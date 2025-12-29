# 🔒 Private Beta Access Control System

Your NirikshanAI app now has a complete private beta access control system!

## ✨ What's New

### 1. **Landing Page with Request Form** (`/`)
   - Users see a "Request Beta Access" button
   - Form collects: Name, Email, GitHub Username (optional), Message
   - Shows "Private Beta" badge
   - Link to admin dashboard at the bottom

### 2. **Admin Dashboard** (`/admin`)
   - View all access requests (pending, approved, rejected)
   - Approve or reject requests with one click
   - See statistics (pending count, approved count, whitelisted users)
   - Filter requests by status
   - Real-time refresh

### 3. **Whitelist System**
   - Users are automatically whitelisted when approved
   - Whitelist check on installation events
   - API endpoint to check access status

### 4. **Complete Workflow**
   ```
   User Requests Access → Admin Reviews → Approved → Whitelisted → Can Install
   ```

---

## 🚀 How to Use

### As Admin:

1. **Access Admin Dashboard:**
   - Go to `http://localhost:4002/admin`
   - Enter your admin email
   - Click "Access Dashboard"

2. **Review Requests:**
   - See all pending requests
   - Click "Approve" to whitelist the user
   - Click "Reject" to decline access

3. **Send Installation Link:**
   - After approving, manually send the user:
     - GitHub App installation link: `https://github.com/apps/YOUR-APP-SLUG`
     - Dashboard link: `http://localhost:4002/dashboard`
   - (Or use the email template in `email-templates/access-approved.md`)

### As User Requesting Access:

1. Visit the homepage
2. Click "Request Beta Access"
3. Fill out the form
4. Wait for approval
5. Receive installation link (from admin)
6. Install the GitHub App
7. Go to dashboard and add OpenAI key

---

## 🔧 Configuration

### Set Admin Emails

Add this to your `.env.local`:

```bash
# Comma-separated list of admin emails
ADMIN_EMAILS=your-email@example.com,another-admin@example.com
```

Admins are automatically whitelisted and can access the admin dashboard.

### Set GitHub App Slug

```bash
# Your GitHub App slug (from the app URL)
NEXT_PUBLIC_GITHUB_APP_SLUG=your-app-slug
```

---

## 📊 Database Schema

The system uses in-memory storage with these new models:

### AccessRequest
```typescript
{
  id: string;
  name: string;
  email: string;
  githubUsername?: string;
  message?: string;
  status: "pending" | "approved" | "rejected";
  requestedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}
```

### WhitelistedUser
```typescript
{
  email: string;
  githubUsername?: string;
  addedAt: string;
  addedBy: string;
}
```

---

## 🔗 API Endpoints

### POST `/api/access-request`
Request beta access
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "githubUsername": "johndoe",
  "message": "Want to try for my team"
}
```

### GET `/api/access-request?adminEmail=admin@example.com`
Get all requests (admin only)

### PATCH `/api/access-request/:id`
Approve/reject request
```json
{
  "status": "approved",
  "reviewedBy": "admin@example.com"
}
```

### GET `/api/check-access?email=user@example.com`
Check if user has access

---

## 📝 Routes

| Route | Description | Access |
|-------|-------------|--------|
| `/` | Landing page with request form | Public |
| `/dashboard` | Main dashboard | Whitelisted users |
| `/settings` | Settings page | Whitelisted users |
| `/admin` | Access control admin panel | Admins only |

---

## 🎯 Next Steps

### Optional Enhancements:

1. **Email Notifications:**
   - Send automatic emails when requests are approved
   - Use the template in `email-templates/access-approved.md`
   - Integrate with SendGrid, Resend, or similar

2. **Persistent Database:**
   - Replace in-memory storage with PostgreSQL/MongoDB
   - Use Prisma or similar ORM

3. **Better Admin Auth:**
   - Add GitHub OAuth for admin login
   - Use sessions/JWT for security

4. **Installation Check:**
   - Prevent non-whitelisted users from completing installation
   - Show error message on GitHub App install page

---

## 🧪 Testing

### Test the Flow:

1. **Request Access:**
   ```
   Visit: http://localhost:4002/
   Click: "Request Beta Access"
   Fill form and submit
   ```

2. **Admin Review:**
   ```
   Visit: http://localhost:4002/admin
   Enter admin email
   See pending request
   Click "Approve"
   ```

3. **Check Whitelist:**
   ```
   curl http://localhost:4002/api/check-access?email=test@example.com
   ```

---

## 🐛 Troubleshooting

### Issue: Can't access admin dashboard
- Make sure you added your email to `ADMIN_EMAILS` in `.env.local`
- Restart the dev server after changing env variables

### Issue: Users can still install without approval
- GitHub Apps can't be blocked at installation time
- Whitelist check happens when webhooks fire
- Non-whitelisted users won't get PR reviews

### Issue: Data lost on server restart
- Current system uses in-memory storage
- Data resets when server restarts
- Implement persistent database for production

---

## 📧 Email Template

Use this template when manually notifying approved users:

**Subject:** Welcome to NirikshanAI Beta! 🎉

```
Hi [NAME],

Great news! Your request for NirikshanAI beta access has been approved.

Next Steps:
1. Install the GitHub App: https://github.com/apps/YOUR-APP-SLUG
2. Add your OpenAI API key: http://localhost:4002/dashboard
3. Open or update a Pull Request in your repo

That's it! NirikshanAI will automatically review your PRs.

Best,
Nitish
```

---

## 🎉 You're All Set!

Your private beta access control system is now live!

**Quick Links:**
- Landing Page: http://localhost:4002/
- Admin Dashboard: http://localhost:4002/admin
- User Dashboard: http://localhost:4002/dashboard

Enjoy managing your beta users! 🚀

