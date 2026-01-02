import { NextResponse } from "next/server";

/**
 * GET /api/installations/callback
 * 
 * This endpoint handles the redirect after a user installs the GitHub App.
 * GitHub redirects here with: ?installation_id=XXX&setup_action=install
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  
  const installationId = searchParams.get("installation_id");
  const setupAction = searchParams.get("setup_action");
  const code = searchParams.get("code"); // GitHub might also send OAuth code
  
  console.log("📦 GitHub App Setup Callback");
  console.log("   Installation ID:", installationId);
  console.log("   Setup Action:", setupAction);
  console.log("   Code:", code ? "present" : "not present");

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4002";

  // If GitHub sent an OAuth code, this is part of the OAuth flow
  // Redirect to OAuth callback to handle it properly
  if (code && !installationId) {
    console.log("   Detected OAuth flow, redirecting to OAuth callback");
    return NextResponse.redirect(`${baseUrl}/api/auth/github/callback?code=${code}`);
  }

  // Redirect back to homepage with success message
  // Users can then sign in and go to dashboard
  if (setupAction === "install" && installationId) {
    console.log(`✅ Redirecting to homepage after successful installation`);
    return NextResponse.redirect(`${baseUrl}/?installation=success`);
  }

  // For updates or other actions, also redirect to homepage
  console.log(`✅ Redirecting to homepage`);
  return NextResponse.redirect(`${baseUrl}/`);
}

