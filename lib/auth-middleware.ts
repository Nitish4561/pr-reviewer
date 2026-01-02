import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { userDb, type User } from "./db-enhanced";

/**
 * Enhanced Authentication & Authorization Middleware
 */

// ============================================
// Session Management
// ============================================

export interface SessionData {
  userId: string;
  email: string;
  role: "admin" | "user";
  githubUsername?: string;
}

/**
 * Get current session user from cookies
 */
export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("nirikshan_session");

  if (!sessionCookie?.value) {
    return null;
  }

  try {
    const session = JSON.parse(sessionCookie.value) as SessionData;
    
    // Validate session by checking if user still exists and is active
    const user = await userDb.findById(session.userId);
    
    if (!user || user.status !== "active") {
      return null;
    }

    return session;
  } catch (err) {
    console.error("Invalid session cookie:", err);
    return null;
  }
}

/**
 * Get current user from session
 */
export async function getCurrentUser(): Promise<User | null> {
  const session = await getSession();
  if (!session) return null;

  return userDb.findById(session.userId);
}

/**
 * Create a new session for a user
 */
export async function createSession(user: User): Promise<void> {
  const cookieStore = await cookies();

  const sessionData: SessionData = {
    userId: user.id,
    email: user.email,
    role: user.role,
    githubUsername: user.githubUsername,
  };

  cookieStore.set("nirikshan_session", JSON.stringify(sessionData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    path: "/",
  });

  // Update last login
  await userDb.updateLastLogin(user.id);
}

/**
 * Destroy current session
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("nirikshan_session");
}

// ============================================
// Authorization Checks
// ============================================

/**
 * Check if current user is admin
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getSession();
  return session?.role === "admin";
}

/**
 * Check if current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session;
}

/**
 * Check if user has access to a specific resource
 */
export async function canAccessResource(
  userId: string
): Promise<boolean> {
  const session = await getSession();
  if (!session) return false;

  // Admins can access everything
  if (session.role === "admin") return true;

  // Users can access their own resources
  return session.userId === userId;
}

// ============================================
// API Route Protection
// ============================================

/**
 * Require authentication for API routes
 */
export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error("Unauthorized");
  }

  if (user.status !== "active") {
    throw new Error("Account suspended");
  }

  return user;
}

/**
 * Require admin role for API routes
 */
export async function requireAdmin(): Promise<User> {
  const user = await requireAuth();

  if (user.role !== "admin") {
    throw new Error("Admin access required");
  }

  return user;
}

/**
 * API Response helpers
 */
export function unauthorizedResponse(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbiddenResponse(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function successResponse(data: any) {
  return NextResponse.json(data);
}

// ============================================
// Login Helper (GitHub OAuth)
// ============================================

/**
 * Handle user login/signup via GitHub
 */
export async function handleGitHubLogin(githubUser: {
  id: string;
  login: string;
  email?: string;
}): Promise<User> {
  const email = githubUser.email || `${githubUser.login}@github.user`;

  // Check if user exists
  let user = await userDb.findByEmail(email);

  if (!user) {
    // Check if this email is in the admin list
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase());
    const isAdmin = adminEmails.includes(email.toLowerCase());

    user = await userDb.create({
      email,
      githubId: githubUser.id,
      githubUsername: githubUser.login,
      role: isAdmin ? "admin" : "user",
    });

    console.log(
      `✅ New user created: ${email} (${isAdmin ? "ADMIN" : "USER"})`
    );
  } else {
    // Update existing user
    user = await userDb.update(user.id, {
      githubUsername: githubUser.login,
      githubId: githubUser.id,
    });
  }

  return user;
}

