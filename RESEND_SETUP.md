# 📧 Resend Email Setup Guide

Your app now sends automatic approval emails! Here's how to set it up:

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Resend Account

1. Go to [resend.com](https://resend.com)
2. Sign up (free for 3,000 emails/month)
3. Verify your email

### Step 2: Get API Key

1. In Resend dashboard, go to **API Keys**
2. Click **"Create API Key"**
3. Name it: "NirikshanAI Production"
4. Copy the API key (starts with `re_...`)

### Step 3: Add to Environment Variables

Add to your `.env.local`:

```bash
# Resend API Key
RESEND_API_KEY=re_your_actual_api_key_here

# Email From Address (use your domain or resend's test domain)
EMAIL_FROM=NirikshanAI <onboarding@resend.dev>

# Base URL (your app's URL)
NEXT_PUBLIC_BASE_URL=https://your-domain.com
```

### Step 4: Verify Domain (Optional - For Production)

**For Testing:** Use `onboarding@resend.dev` (works immediately)

**For Production:**
1. In Resend, go to **Domains**
2. Click **"Add Domain"**
3. Add your domain (e.g., `yourdomain.com`)
4. Add the DNS records Resend provides
5. Wait for verification (usually 5-10 minutes)
6. Update `EMAIL_FROM` to: `NirikshanAI <noreply@yourdomain.com>`

### Step 5: Restart Server

```bash
# Stop server (Ctrl+C)
npm run dev
```

---

## ✅ Test Email Sending

1. Go to admin dashboard
2. Approve a test request
3. Check the terminal logs for: `✅ Email sent successfully`
4. Check the user's inbox!

---

## 🎨 Email Template Features

The approval email includes:
- ✅ Beautiful HTML design with gradients
- ✅ Direct installation link button
- ✅ Dashboard access button
- ✅ Feature highlights
- ✅ Privacy information
- ✅ Mobile responsive

---

## 🔧 Configuration Options

### Change Email Sender Name

```bash
EMAIL_FROM=Your App Name <noreply@yourdomain.com>
```

### Use Different Base URL

For development:
```bash
NEXT_PUBLIC_BASE_URL=http://localhost:4002
```

For production:
```bash
NEXT_PUBLIC_BASE_URL=https://nirikshanai.com
```

For ngrok:
```bash
NEXT_PUBLIC_BASE_URL=https://your-subdomain.ngrok-free.dev
```

---

## 📊 Free Tier Limits

Resend free tier includes:
- ✅ 3,000 emails per month
- ✅ 100 emails per day
- ✅ All API features
- ✅ Email logs
- ✅ 1 custom domain

Perfect for private beta! 🎉

---

## 🐛 Troubleshooting

### Error: "Invalid API key"
- Check your `.env.local` has correct `RESEND_API_KEY`
- Make sure it starts with `re_`
- Restart the server

### Error: "From address not verified"
- Use `onboarding@resend.dev` for testing
- Or add and verify your custom domain

### Emails not sending
- Check terminal logs for errors
- Verify API key is correct
- Check Resend dashboard → Logs

### User not receiving emails
- Check spam folder
- Verify email address is correct
- Check Resend dashboard → Logs → Email status

---

## 🎯 Next Steps

Once set up:
1. ✅ Make GitHub App public (GitHub settings)
2. ✅ Test full flow:
   - User requests access
   - You approve
   - They receive email
   - They install app
   - PR review works!

---

## 📚 Resources

- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference/emails/send-email)
- [Domain Verification Guide](https://resend.com/docs/dashboard/domains/introduction)

---

Your email system is ready! 🚀

