import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "Missing code parameter" }, { status: 400 });
  }

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

  // Step 2: fetch user
  const userRes = await fetch("https://api.github.com/user", {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  const user = await userRes.json();

  // Step 3: save user (DB later)
  // user.id, user.login, access_token

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4002";
  return NextResponse.redirect(`${baseUrl}/settings`);
}

