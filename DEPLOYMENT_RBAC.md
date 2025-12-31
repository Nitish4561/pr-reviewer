# 🚀 RBAC System Deployment Checklist

## Pre-Deployment

### 1. **Environment Variables**
Ensure these are set in your deployment platform (Vercel):

```bash
# GitHub OAuth (Required)
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_client_id
GITHUB_CLIENT_SECRET=your_client_secret
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app

# Redis/KV for persistence (Required)
KV_REST_API_URL=your_redis_url
KV_REST_API_TOKEN=your_redis_token

# GitHub App (Required for PR reviews)
GITHUB_APP_ID=your_app_id
GITHUB_PRIVATE_KEY=your_private_key
GITHUB_WEBHOOK_SECRET=your_webhook_secret

# OpenAI (Optional - users can provide their own)
OPENAI_API_KEY=your_openai_key
```

### 2. **GitHub OAuth App Setup**
1. Go to https://github.com/settings/developers
2. Create a new OAuth App
3. Set Authorization callback URL: `https://your-app.vercel.app/api/auth/github/callback`
4. Copy Client ID and Secret to environment variables

### 3. **Redis/KV Setup**
- If using Vercel: Enable Vercel KV in your project
- If using external Redis: Set `KV_REST_API_URL` and `KV_REST_API_TOKEN`

---

## Deployment Steps

### 1. **Commit All Changes**
```bash
git add .
git commit -m "Add RBAC system with admin dashboard and PR review tracking"
git push
```

### 2. **Deploy to Vercel**
```bash
# Vercel will auto-deploy on push
# Or manually trigger:
vercel --prod
```

### 3. **Verify Deployment**
- Visit your app URL
- Check that home page loads
- Click "Sign in with GitHub"
- Verify OAuth flow works

---

## Post-Deployment

### 1. **Create First Admin**
1. Visit your app
2. Click "Sign in with GitHub"
3. You'll automatically become the first admin
4. Verify you see "Admin Dashboard" button

### 2. **Test Admin Features**
1. Go to `/admin/users`
2. Verify you can see user list
3. Test creating a new user (optional)

### 3. **Test User Dashboard**
1. Go to `/dashboard`
2. Verify dashboard loads
3. Check that review history appears (after first PR review)

### 4. **Test PR Review**
1. Create a test PR in a repository with the GitHub App installed
2. Wait for NirikshanAI to review it
3. Check dashboard for new review entry

---

## Verification Tests

### ✅ Authentication
- [ ] GitHub OAuth login works
- [ ] Session persists across page reloads
- [ ] Logout works correctly
- [ ] Unauthorized users redirected from protected routes

### ✅ Authorization
- [ ] Admin can access `/admin`
- [ ] Regular user cannot access `/admin`
- [ ] Users can access `/dashboard`
- [ ] Unauthenticated users redirected to home

### ✅ User Management
- [ ] Admin can view all users
- [ ] Admin can promote users to admin
- [ ] Admin can suspend users
- [ ] Suspended users cannot login
- [ ] Self-suspension is blocked

### ✅ PR Review Tracking
- [ ] Reviews are saved to database
- [ ] Users see their reviews on dashboard
- [ ] Stats are calculated correctly
- [ ] Direct links to GitHub PRs work

### ✅ Database Persistence
- [ ] Users persist in Redis/KV
- [ ] Reviews persist in Redis/KV
- [ ] Sessions survive deployments
- [ ] No data loss on redeploy

---

## Troubleshooting

### OAuth Redirect Error
**Issue:** "Redirect URI mismatch"
**Fix:** Update GitHub OAuth app callback URL to match your deployment URL

### Users Not Persisting
**Issue:** Users disappear after page reload
**Fix:** Verify Redis/KV environment variables are set correctly

### Admin Routes 403
**Issue:** Admin can't access admin routes
**Fix:** Check user role in database, promote to admin if needed

### Reviews Not Showing
**Issue:** Dashboard shows no reviews
**Fix:** 
1. Verify webhook is triggered
2. Check Vercel logs for review save errors
3. Ensure `reviewedBy` matches `githubUsername`

### Middleware Redirect Loop
**Issue:** Page keeps redirecting
**Fix:** Clear cookies, ensure middleware.ts matcher is correct

---

## Rollback Plan

If something goes wrong:

### 1. **Immediate Rollback**
```bash
# Revert to previous deployment in Vercel dashboard
# Or via CLI:
vercel rollback
```

### 2. **Partial Rollback**
If only certain features are broken:
- Disable admin routes in `middleware.ts`
- Comment out PR review saving in webhook
- Fall back to old auth system

### 3. **Database Recovery**
- Redis/KV data persists across deployments
- No data migration needed for rollback
- Old system is backward compatible

---

## Monitoring

### Key Metrics to Watch
1. **User Growth**
   - Track signups via `/api/admin/users`
   - Monitor first-time logins

2. **PR Reviews**
   - Track review count via `/api/admin/reviews`
   - Monitor review success rate

3. **Auth Issues**
   - Watch for 401/403 errors in logs
   - Monitor session expiration

4. **Database Health**
   - Check Redis connection
   - Monitor KV storage usage

---

## Next Steps After Deployment

### 1. **Invite Users**
- Share app URL with team
- First user becomes admin automatically
- Admins can promote other users

### 2. **Configure Repositories**
- Install GitHub App on repositories
- Each user adds their OpenAI key
- Test PR reviews

### 3. **Monitor & Iterate**
- Check review quality
- Gather user feedback
- Adjust admin policies

---

## Support

If you encounter issues:

1. **Check Vercel Logs**
   ```bash
   vercel logs
   ```

2. **Check Redis Connection**
   - Test with `/api/test-redis` endpoint

3. **Verify Environment Variables**
   ```bash
   vercel env ls
   ```

4. **Review RBAC Guide**
   - See `RBAC_GUIDE.md` for detailed documentation

---

## Success Criteria

✅ First admin created successfully
✅ GitHub OAuth working
✅ Users can sign up and login
✅ Admin dashboard accessible
✅ User dashboard shows reviews
✅ PR reviews are saved
✅ Route protection working
✅ No authentication errors

---

## 🎉 You're Ready!

The RBAC system is deployed and ready to use. Your first login will make you an admin, and you can start managing users and reviewing PRs immediately.

**Have questions?** Check `RBAC_GUIDE.md` for detailed usage instructions.

