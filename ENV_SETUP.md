# Environment Variables Setup

To fix the "client_id=undefined" error, you need to create a `.env.local` file in the project root.

## Create `.env.local` file

Create a file named `.env.local` in `/Users/nitishkalra/Desktop/pr-reviewer/` with the following content:

```bash
# GitHub App Configuration
GITHUB_APP_ID=your_app_id_here
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----
Your private key here (keep the line breaks)
-----END RSA PRIVATE KEY-----"

# GitHub OAuth (for user login - REQUIRED for login button)
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_oauth_client_id_here
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret_here

# Webhook Secret
GITHUB_WEBHOOK_SECRET=your_webhook_secret_here

# OpenAI API Key (optional - can be set per installation via /settings page)
OPENAI_API_KEY=sk-proj-your-openai-key-here
```

## Where to find these values:

### 1. GitHub App Credentials
Go to your GitHub App settings:
- **GITHUB_APP_ID**: Found in "About" section of your GitHub App
- **GITHUB_PRIVATE_KEY**: Generate from "Private keys" section

### 2. GitHub OAuth (for login)
You need to create a GitHub OAuth App (separate from GitHub App):
1. Go to https://github.com/settings/developers
2. Click "OAuth Apps" → "New OAuth App"
3. Set:
   - Homepage URL: `http://localhost:4002` (or your domain)
   - Callback URL: `http://localhost:4002/api/auth/github/callback`
4. Copy the **Client ID** → `NEXT_PUBLIC_GITHUB_CLIENT_ID`
5. Generate **Client Secret** → `GITHUB_CLIENT_SECRET`

### 3. Webhook Secret
- Found in your GitHub App → Webhook section

## After creating the file:

1. **Restart your Next.js server** (environment variables only load on start)
2. Refresh the browser
3. The login button should now work!

## Note:
The `NEXT_PUBLIC_` prefix is required for environment variables that need to be accessible in the browser (client-side). Without it, the variable will be `undefined` in the browser.

