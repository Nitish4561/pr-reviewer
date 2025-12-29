import { NextResponse } from "next/server";

export async function GET() {
  const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
  
  if (!clientId) {
    return NextResponse.json({ error: "GitHub Client ID not configured" }, { status: 500 });
  }

  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user:email`;
  
  return NextResponse.redirect(githubAuthUrl);
}

