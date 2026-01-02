import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Middleware for Route Protection
 * Runs on edge before page renders
 * 
 * NOTE: /admin has its own email-based auth, so we don't block it here
 */

// Define protected routes (only dashboard and settings need OAuth)
const protectedRoutes = ["/dashboard", "/settings"];

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  // Get session from cookie
  const sessionCookie = request.cookies.get("nirikshan_session");

  // Check if route needs authentication
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if this is an installation callback with success parameter
  const isInstallationSuccess = searchParams.get("installation") === "success";

  console.log(`🔒 Middleware check for: ${pathname}`);
  console.log(`   Protected route: ${isProtectedRoute}`);
  console.log(`   Has session cookie: ${!!sessionCookie}`);
  console.log(`   Installation success: ${isInstallationSuccess}`);

  // Allow dashboard access without session if installation just succeeded
  // This handles the case where session expired during GitHub App installation
  if (!sessionCookie && isProtectedRoute && isInstallationSuccess) {
    console.log(`📦 Installation success detected, redirecting to homepage with message`);
    const url = new URL("/", request.url);
    url.searchParams.set("installation", "success");
    return NextResponse.redirect(url);
  }

  // Only block dashboard/settings if no OAuth session
  // /admin has its own email-based auth system
  if (!sessionCookie && isProtectedRoute) {
    console.log(`⚠️ No session found, redirecting to home with unauthorized error`);
    const url = new URL("/", request.url);
    url.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(url);
  }

  console.log(`✅ Access granted to: ${pathname}`);
  return NextResponse.next();
}

// Configure which routes to run middleware on
// NOTE: Removed /admin from matcher - it has its own auth
export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};

