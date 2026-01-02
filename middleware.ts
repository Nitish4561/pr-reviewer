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
  const { pathname } = request.nextUrl;

  // Get session from cookie
  const sessionCookie = request.cookies.get("nirikshan_session");

  // Check if route needs authentication
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Only block dashboard/settings if no OAuth session
  // /admin has its own email-based auth system
  if (!sessionCookie && isProtectedRoute) {
    const url = new URL("/", request.url);
    url.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
// NOTE: Removed /admin from matcher - it has its own auth
export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*"],
};

