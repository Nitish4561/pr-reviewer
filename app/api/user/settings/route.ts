import { NextResponse } from "next/server";
import { requireAuth, unauthorizedResponse, successResponse } from "@/lib/auth-middleware";
import { userDb } from "@/lib/db-enhanced";

export async function POST(req: Request) {
  try {
    // Use new RBAC auth system
    const user = await requireAuth();

    const { openaiKey } = await req.json();

    if (!openaiKey || !openaiKey.startsWith("sk-")) {
      return NextResponse.json(
        { error: "Invalid OpenAI key" },
        { status: 400 }
      );
    }

    // Save OpenAI key to user profile
    await userDb.update(user.id, { openaiKey });

    console.log(`✅ OpenAI key saved for user: ${user.email}`);

    return successResponse({ success: true });
  } catch (err: any) {
    console.error("Failed to save OpenAI key:", err);
    return unauthorizedResponse(err.message);
  }
}
