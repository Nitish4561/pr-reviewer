import { NextResponse } from "next/server";
import { handleGitHubLogin, createSession } from "@/lib/auth-middleware";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
  }

  try {
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

    const { access_token } = await tokenRes.json() as { access_token: string };

    // Step 2: fetch user from GitHub
    const userRes = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const githubUser = await userRes.json();

    // Fetch user email if not public
    if (!githubUser.email) {
      const emailRes = await fetch("https://api.github.com/user/emails", {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      const emails = await emailRes.json();
      const primaryEmail = emails.find((e: any) => e.primary);
      githubUser.email = primaryEmail?.email;
    }

    const userEmail = githubUser.email || `${githubUser.login}@github.user`;

    // Step 3: Check if user is approved
    const isApproved = await db.whitelist.isWhitelistedAsync(userEmail);

    if (!isApproved) {
      console.warn(`⚠️ Unapproved user tried to login: ${userEmail}`);
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4002";
      return NextResponse.redirect(`${baseUrl}?error=not_approved&email=${encodeURIComponent(userEmail)}`);
    }

    // Step 4: Create or update user and create session
    const user = await handleGitHubLogin({
      id: githubUser.id.toString(),
      login: githubUser.login,
      email: userEmail,
    });

    await createSession(user);

    console.log(`✅ User logged in: ${user.email} (${user.role})`);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4002";
    const appSlug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG || "nirikshanai";
    
    // All approved users go to GitHub App installation page
    const githubAppUrl = `https://github.com/apps/${appSlug}/installations/new`;
    
    console.log(`🔗 Redirecting user to GitHub App installation: ${githubAppUrl}`);
    return NextResponse.redirect(githubAppUrl);
    
  } catch (err: any) {
    console.error("GitHub OAuth error:", err);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4002";
    return NextResponse.redirect(`${baseUrl}?error=auth_failed`);
  }
}

