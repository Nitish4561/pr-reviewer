import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js Middleware for Route Protection
 * Runs on edge before page renders
 */

// Define protected routes
const protectedRoutes = ["/dashboard", "/settings"];
const adminRoutes = ["/admin"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Get session from cookie
  const sessionCookie = request.cookies.get("nirikshan_session");

  // Check if route needs authentication
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAdminRoute = adminRoutes.some((route) => pathname.startsWith(route));

  // If no session and trying to access protected route
  if (!sessionCookie && (isProtectedRoute || isAdminRoute)) {
    const url = new URL("/", request.url);
    url.searchParams.set("error", "unauthorized");
    return NextResponse.redirect(url);
  }

  // Check admin access
  if (sessionCookie && isAdminRoute) {
    try {
      const session = JSON.parse(sessionCookie.value);

      // Only admins can access admin routes
      if (session.role !== "admin") {
        const url = new URL("/dashboard", request.url);
        return NextResponse.redirect(url);
      }
    } catch (err) {
      // Invalid session cookie
      const url = new URL("/", request.url);
      url.searchParams.set("error", "invalid_session");
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

// Configure which routes to run middleware on
export const config = {
  matcher: ["/dashboard/:path*", "/settings/:path*", "/admin/:path*"],
};

