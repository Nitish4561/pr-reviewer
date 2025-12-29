# 🚀 Quick Start: Private Beta Access Control

## ✅ What's Been Built

Your NirikshanAI now has a complete private beta access control system with:

1. ✨ **Landing Page** - Request access form
2. 🎯 **Admin Dashboard** - Review and approve requests  
3. 🔒 **Whitelist System** - Control who can use your app
4. 📊 **Complete Analytics** - Track requests and approvals

---

## 🏃 Quick Setup (3 Steps)

### Step 1: Add Your Admin Email

Edit `.env.local` and add:

```bash
ADMIN_EMAILS=your-email@example.com
```

Then restart the server:
```bash
# Press Ctrl+C to stop, then:
npm run dev
```

### Step 2: Test the System

**As a User:**
1. Visit: `http://localhost:4002/`
2. Click "Request Beta Access"
3. Fill out the form
4. Submit

**As Admin (You):**
1. Visit: `http://localhost:4002/admin`
2. Enter your admin email
3. See the pending request
4. Click "Approve"

**Result:** User is now whitelisted! ✅

### Step 3: Share Your App

Send this to beta testers:

> **Want to try NirikshanAI?**
> 
> 1. Request access: `http://your-domain.com`
> 2. I'll approve you within 24 hours
> 3. Install the GitHub App when approved
> 
> It's a private beta, so access is limited right now!

---

## 📋 Pages Overview

| URL | What It Does | Who Can Access |
|-----|-------------|----------------|
| `/` | Landing page with request form | Everyone |
| `/admin` | Manage access requests | Admins only |
| `/dashboard` | App settings & stats | Approved users |
| `/settings` | Configure OpenAI key | Approved users |

---

## 🎯 Admin Workflow

```
New Request → Review in /admin → Approve → User Whitelisted → Send Link
```

### When Someone Requests Access:

1. Go to `http://localhost:4002/admin`
2. Enter your admin email
3. See their request with details
4. Click "Approve" or "Reject"
5. If approved, manually send them:
   - GitHub App install link
   - Dashboard link

### Email Template for Approved Users:

```
Subject: Welcome to NirikshanAI Beta!

Hi [NAME],

You're in! Here's what to do next:

1. Install the GitHub App: https://github.com/apps/YOUR-APP-SLUG
2. Go to dashboard: http://your-domain.com/dashboard
3. Add your OpenAI API key
4. Open a PR in your repo

NirikshanAI will automatically review it!

Questions? Just reply to this email.

Best,
[Your Name]
```

---

## 🔧 Configuration Reference

### Environment Variables

Add these to `.env.local`:

```bash
# Required for access control
ADMIN_EMAILS=your-email@example.com,another-admin@example.com

# Required for app to work
GITHUB_APP_ID=your_app_id
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----..."
NEXT_PUBLIC_GITHUB_APP_SLUG=your-app-slug
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# Optional
OPENAI_API_KEY=sk-proj-...
```

---

## 📊 Features

### Landing Page Features:
- ✅ "Request Beta Access" button
- ✅ Inline form (no page navigation)
- ✅ Private Beta badge
- ✅ Form validation
- ✅ Success/error messages
- ✅ Link to admin dashboard

### Admin Dashboard Features:
- ✅ View all requests (pending/approved/rejected)
- ✅ Filter by status
- ✅ One-click approve/reject
- ✅ See statistics
- ✅ User details (name, email, GitHub, message)
- ✅ Timestamps for everything
- ✅ Refresh button

### Whitelist System:
- ✅ Automatic whitelisting on approval
- ✅ Admin emails auto-whitelisted
- ✅ Check access API endpoint
- ✅ Persistent across sessions (until server restart)

---

## 🧪 Testing Checklist

- [ ] Visit landing page
- [ ] Submit access request
- [ ] Check admin dashboard
- [ ] Approve the request
- [ ] Verify user is whitelisted
- [ ] Test with different email
- [ ] Try rejecting a request
- [ ] Check filter tabs work

---

## 🐛 Common Issues

### "Can't access admin dashboard"
→ Add your email to `ADMIN_EMAILS` in `.env.local` and restart server

### "Requests disappear after restart"
→ Current system uses in-memory storage. For production, add a database.

### "User approved but can't install"
→ GitHub Apps can't be blocked. Whitelist check happens when PRs are opened.

---

## 🚀 Next Steps (Optional)

1. **Add Email Notifications**
   - Integrate SendGrid or Resend
   - Auto-send emails when users are approved
   - Include installation link in email

2. **Add Real Database**
   - Replace in-memory storage
   - Use PostgreSQL + Prisma
   - Persist data across restarts

3. **Improve Admin Auth**
   - Add GitHub OAuth
   - Session-based authentication
   - Secure admin routes

4. **Analytics Dashboard**
   - Track approval rates
   - Monitor active users
   - Usage statistics

---

## 📚 Documentation

- **Full Guide:** `ACCESS_CONTROL_GUIDE.md`
- **Environment Setup:** `ENV_SETUP.md`
- **Email Template:** `email-templates/access-approved.md`

---

## ✨ Your App is Ready!

Your private beta system is now live and ready to use!

**Try it now:**
1. Visit: http://localhost:4002/
2. Admin: http://localhost:4002/admin
3. Dashboard: http://localhost:4002/dashboard

Happy beta testing! 🎉

