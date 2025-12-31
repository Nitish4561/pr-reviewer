import { NextResponse } from "next/server";
import { handleGitHubLogin, createSession } from "@/lib/auth-middleware";

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

    // Step 3: Create or update user and create session
    const user = await handleGitHubLogin({
      id: githubUser.id.toString(),
      login: githubUser.login,
      email: githubUser.email,
    });

    await createSession(user);

    console.log(`✅ User logged in: ${user.email} (${user.role})`);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4002";
    
    // Redirect based on role
    const redirectPath = user.role === "admin" ? "/admin" : "/dashboard";
    return NextResponse.redirect(`${baseUrl}${redirectPath}`);
    
  } catch (err: any) {
    console.error("GitHub OAuth error:", err);
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4002";
    return NextResponse.redirect(`${baseUrl}?error=auth_failed`);
  }
}

