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
  
  console.log("📦 GitHub App Setup Callback");
  console.log("   Installation ID:", installationId);
  console.log("   Setup Action:", setupAction);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4002";

  // Redirect back to dashboard with success message
  if (setupAction === "install" && installationId) {
    console.log(`✅ Redirecting to dashboard after successful installation`);
    return NextResponse.redirect(`${baseUrl}/dashboard?installation=success`);
  }

  // For updates or other actions, also redirect to dashboard
  console.log(`✅ Redirecting to dashboard`);
  return NextResponse.redirect(`${baseUrl}/dashboard`);
}

