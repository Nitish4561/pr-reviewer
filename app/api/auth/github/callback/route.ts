import { NextResponse } from "next/server";
import { handleGitHubLogin, createSession } from "@/lib/auth-middleware";
import { kvdb } from "@/lib/db-kv";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const installationId = searchParams.get("installation_id");
  const setupAction = searchParams.get("setup_action");

  console.log("========================================");
  console.log("🔗 OAuth Callback received");
  console.log("   Timestamp:", new Date().toISOString());
  console.log("   Code:", code ? "✓ present" : "✗ missing");
  console.log("   Installation ID:", installationId || "none");
  console.log("   Setup Action:", setupAction || "none");
  console.log("========================================");

  // If this is an installation callback (has installation_id but no OAuth flow needed)
  // Redirect directly to dashboard - user is already authenticated from installation flow
  if (installationId && setupAction) {
    console.log("   Detected installation callback, redirecting to dashboard");
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4002";
    return NextResponse.redirect(`${baseUrl}/dashboard?installation=success`);
  }

  if (!code) {
    console.error("❌ Missing OAuth code parameter");
    return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
  }

  try {
    console.log("📡 Step 1: Exchanging OAuth code for access token...");
    // Step 1: exchange code for access token
    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: { Accept: "application/json" },
        body: new URLSearchParams({
          client_id: process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID!,
          client_secret: process.env.GITHUB_CLIENT_SECRET!,
          code,
        }),
      }
    );

    const tokenData = await tokenRes.json() as { access_token?: string; error?: string };
    
    if (!tokenData.access_token) {
      console.error("❌ Failed to get access token:", tokenData);
      throw new Error(`GitHub OAuth failed: ${tokenData.error || 'Unknown error'}`);
    }
    
    console.log("✅ Access token received");

    console.log("👤 Step 2: Fetching user data from GitHub...");
    // Step 2: fetch user from GitHub
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    const githubUser = await userRes.json();
    console.log("✅ GitHub user data received:", {
      id: githubUser.id,
      login: githubUser.login,
      email: githubUser.email || '(not public)',
    });

    // Fetch user email if not public
    if (!githubUser.email) {
      console.log("📧 Email not public, fetching from emails API...");
      const emailRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
        },
      });
      const emails = await emailRes.json();
      const primaryEmail = emails.find((e: any) => e.primary);
      githubUser.email = primaryEmail?.email;
      console.log("✅ Primary email found:", githubUser.email);
    }

    const userEmail = githubUser.email || `${githubUser.login}@github.user`;
    console.log("📋 Final user email:", userEmail);

    // Step 3: Check if user is approved (using Redis/KV)
    console.log(`🔍 Step 3: Checking if user is whitelisted: ${userEmail}`);
    const isApproved = await kvdb.whitelist.isWhitelistedAsync(userEmail);
    console.log(`   Whitelist check result: ${isApproved ? '✅ APPROVED' : '❌ NOT APPROVED'}`);

    if (!isApproved) {
      console.warn(`⚠️ Unapproved user tried to login: ${userEmail}`);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4002";
      return NextResponse.redirect(`${baseUrl}?error=not_approved&email=${encodeURIComponent(userEmail)}`);
    }

    // Step 4: Create or update user and create session
    console.log(`👤 Step 4: Creating/updating user in Redis: ${userEmail}`);
    const user = await handleGitHubLogin({
      id: githubUser.id.toString(),
      login: githubUser.login,
      email: userEmail,
    });
    console.log(`✅ User ready:`, {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
    });

    console.log(`🍪 Step 5: Creating session cookie for user: ${user.email}`);
    await createSession(user);
    console.log(`✅ Session created successfully`);

    console.log(`🎉 User logged in successfully: ${user.email} (${user.role})`);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4002";
    
    // After successful OAuth, redirect to dashboard
    console.log(`🔗 Redirecting user to dashboard: ${baseUrl}/dashboard`);
    console.log("========================================\n");
    
    const response = NextResponse.redirect(`${baseUrl}/dashboard`);
    
    return response;
    
  } catch (err: any) {
    console.error("========================================");
    console.error("❌ GitHub OAuth error:", err);
    console.error("   Error name:", err.name);
    console.error("   Error message:", err.message);
    console.error("   Error stack:", err.stack);
    console.error("========================================\n");
    
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4002";
    return NextResponse.redirect(`${baseUrl}?error=auth_failed&message=${encodeURIComponent(err.message)}`);
  }
}

