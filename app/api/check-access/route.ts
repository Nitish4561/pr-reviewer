import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Check if a user has access (is whitelisted)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const isWhitelisted = db.whitelist.isWhitelisted(email);
    const request = db.accessRequest.findByEmail(email);

    return NextResponse.json({
      hasAccess: isWhitelisted,
      requestStatus: request?.status || null,
      message: isWhitelisted 
        ? "You have access! You can install the GitHub App." 
        : request?.status === "pending"
        ? "Your access request is pending review."
        : request?.status === "rejected"
        ? "Your access request was not approved."
        : "You need to request access first.",
    });
  } catch (error: any) {
    console.error("Error checking access:", error);
    return NextResponse.json(
      { error: error.message || "Failed to check access" },
      { status: 500 }
    );
  }
}

