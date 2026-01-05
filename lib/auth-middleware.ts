import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { kvdb } from "./db-kv";

/**
 * Enhanced Authentication & Authorization Middleware
 */

// ============================================
// Session Management
// ============================================

export interface User {
  id: string;
  email: string;
  githubUsername?: string;
  githubId?: string;
  avatarUrl?: string;
  role: "admin" | "user";
  status: "active" | "suspended";
  openaiKey?: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

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
    const user = await kvdb.user.findById(session.userId);
    
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

  return kvdb.user.findById(session.userId);
}

/**
 * Create a new session for a user
 */
export async function createSession(user: User): Promise<void> {
  try {
    const cookieStore = await cookies();

    const sessionData: SessionData = {
      userId: user.id,
      email: user.email,
      role: user.role,
      githubUsername: user.githubUsername,
    };

    console.log(`🍪 Setting session cookie for user: ${user.email}`);
    
    cookieStore.set("nirikshan_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: "/",
    });

    console.log(`✅ Session cookie set successfully`);

    // Update last login (non-blocking, don't await to avoid delays)
    kvdb.user.updateLastLogin(user.id).catch((err) => {
      console.error("Failed to update last login:", err);
    });
  } catch (error) {
    console.error("❌ Error creating session:", error);
    throw error;
  }
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
  avatar_url?: string;
}): Promise<User> {
  const email = githubUser.email || `${githubUser.login}@github.user`;

  console.log(`👤 Looking up user: ${email}`);

  // Check if user exists
  let user = await kvdb.user.findByEmail(email);

  if (!user) {
    // Check if this email is in the admin list
    const adminEmails = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase());
    const isAdmin = adminEmails.includes(email.toLowerCase());

    console.log(`🆕 Creating new user: ${email} (${isAdmin ? "ADMIN" : "USER"})`);

    user = await kvdb.user.create({
      email,
      githubId: githubUser.id,
      githubUsername: githubUser.login,
      avatarUrl: githubUser.avatar_url,
      role: isAdmin ? "admin" : "user",
    });

    console.log(
      `✅ New user created: ${email} (${isAdmin ? "ADMIN" : "USER"})`
    );
  } else {
    console.log(`♻️  Updating existing user: ${email}`);
    // Update existing user
    user = await kvdb.user.update(user.id, {
      githubUsername: githubUser.login,
      githubId: githubUser.id,
      avatarUrl: githubUser.avatar_url,
    });
    console.log(`✅ User updated: ${email}`);
  }

  return user;
}

