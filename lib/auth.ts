import { cookies } from "next/headers";

interface User {
  githubId: string;
  login: string;
}

/**
 * Get the current session user from cookies
 * @returns User object or null if not authenticated
 */
export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get("session");

  if (!sessionCookie) {
    return null;
  }

  // TODO: Implement proper session validation
  // For now, returning null (needs database lookup)
  return null;
}

/**
 * Create a session for a user
 * @param user - The user to create a session for
 */
export async function createSession(user: User): Promise<void> {
  const cookieStore = await cookies();
  
  // TODO: Implement proper session creation with JWT or session storage
  cookieStore.set("session", JSON.stringify(user), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7, // 1 week
  });
}

/**
 * Destroy the current session
 */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete("session");
}

