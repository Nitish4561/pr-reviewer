import { NextResponse } from "next/server";
import { cookies } from "next/headers";

/**
 * POST /api/auth/logout
 * Clear session and logout user
 */
export async function POST() {
  try {
    const cookieStore = await cookies();
    
    // Clear all possible session cookies
    cookieStore.delete("session");
    cookieStore.delete("nirikshan_session");
    
    console.log("✅ Session cookies cleared");
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Logout failed" }, { status: 500 });
  }
}