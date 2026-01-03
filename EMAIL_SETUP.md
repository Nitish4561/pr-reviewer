# Email Notifications Setup Guide

## Overview

Email notifications have been implemented using **Resend** for the following events:
1. **Admin notification** when a new access request is submitted
2. **User approval notification** when access is approved
3. **User rejection notification** when access is rejected

## Setup Instructions

### 1. Create a Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up for a free account
3. Verify your email

### 2. Get Your API Key

1. Navigate to **API Keys** in the Resend dashboard
2. Click **Create API Key**
3. Copy the API key (starts with `re_`)

### 3. Configure Domain (Important!)

**Option A: For Testing (Quick Start)**
- Use the default sender: `onboarding@resend.dev`
- No domain verification needed
- Limited to 100 emails/day
- Set: `RESEND_FROM_EMAIL=onboarding@resend.dev`

**Option B: For Production (Recommended)**
1. Go to **Domains** in Resend dashboard
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add the DNS records shown:
   - MX record
   - TXT record (SPF)
   - TXT record (DKIM)
5. Wait for verification (usually 5-10 minutes)
6. Use your verified domain: `noreply@yourdomain.com`

### 4. Add Environment Variables to Vercel

```bash
# Required
RESEND_API_KEY=re_your_actual_api_key_here
RESEND_FROM_EMAIL=onboarding@resend.dev  # or your verified domain

# Already configured
ADMIN_EMAILS=your@email.com,admin2@email.com
NEXT_PUBLIC_BASE_URL=https://your-app.vercel.app
```

**Steps in Vercel:**
1. Go to your project in Vercel
2. Click **Settings** → **Environment Variables**
3. Add:
   - `RESEND_API_KEY` = `re_...` (your API key)
   - `RESEND_FROM_EMAIL` = `onboarding@resend.dev` (or your domain)
4. Click **Save**
5. **Redeploy** your application

### 5. Test the Setup

**Test Admin Notification:**
1. Go to your app homepage
2. Click **Request Beta Access**
3. Fill out the form
4. Submit
5. Check admin email inbox (from `ADMIN_EMAILS`)

**Test Approval Notification:**
1. Login as admin
2. Approve a pending request
3. Check the user's email inbox

## Email Templates

### 1. Admin Notification
**Subject:** 🔔 New Access Request - NirikshanAI
**Content:**
- User name, email, GitHub username
- Optional message
- Link to admin dashboard

### 2. Approval Email
**Subject:** ✅ Access Approved - Welcome to NirikshanAI!
**Content:**
- Welcome message
- Next steps guide:
  1. Sign in with GitHub
  2. Install GitHub App
  3. Add OpenAI key
  4. Start reviewing
- Link to dashboard

### 3. Rejection Email
**Subject:** Access Request Update - NirikshanAI
**Content:**
- Polite rejection message
- Reason categories
- Link to homepage

## Resend + Vercel Compatibility

**Yes, Resend works perfectly with Vercel!** In fact:
- ✅ Resend is built specifically for modern frameworks like Next.js
- ✅ Works seamlessly with Vercel's serverless functions
- ✅ Official integration in Vercel marketplace
- ✅ Used by thousands of Next.js apps on Vercel

The confusion might be about **domain verification**, not compatibility.

## Free Tier Limits

**Resend Free Plan:**
- 100 emails/day
- 3,000 emails/month
- 1 domain verification
- Perfect for demos and small projects

**For Production:**
- Upgrade to Pro ($20/month for 50,000 emails)

## Troubleshooting

### Issue: Emails not sending

**Check:**
1. Is `RESEND_API_KEY` set in Vercel?
2. Is `RESEND_FROM_EMAIL` configured?
3. Check Vercel logs for error messages
4. Verify API key is active in Resend dashboard

### Issue: Emails going to spam

**Solutions:**
1. Use a verified custom domain (not resend.dev)
2. Add SPF and DKIM records properly
3. Warm up your domain (send gradually increasing volumes)

### Issue: "Domain not verified"

**Solution:**
- Check DNS records are added correctly
- Wait 10-15 minutes for DNS propagation
- Use `onboarding@resend.dev` for testing

## Testing Locally

```bash
# Add to .env.local
RESEND_API_KEY=re_your_key
RESEND_FROM_EMAIL=onboarding@resend.dev
ADMIN_EMAILS=your@email.com
NEXT_PUBLIC_BASE_URL=http://localhost:4002

# Run locally
npm run dev

# Test access request
# Check terminal logs and email inbox
```

## Email Logs

**View in Resend Dashboard:**
1. Go to [resend.com/emails](https://resend.com/emails)
2. See all sent emails
3. Check delivery status
4. View email content

## Security Notes

- ✅ API key is server-side only (not exposed to client)
- ✅ Emails sent from server routes only
- ✅ No user input directly in subject/from fields
- ✅ HTML sanitized and escaped
- ✅ Rate limiting via Resend

## Support

**Resend Docs:**
- [Getting Started](https://resend.com/docs/introduction)
- [Next.js Guide](https://resend.com/docs/send-with-nextjs)
- [Domain Setup](https://resend.com/docs/dashboard/domains/introduction)

**Need Help?**
- [Resend Discord](https://resend.com/discord)
- [Resend Support](https://resend.com/support)

