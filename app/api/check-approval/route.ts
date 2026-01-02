import { NextResponse } from "next/server";
import { kvdb } from "@/lib/db-kv";

/**
 * GET /api/check-approval?email=user@example.com
 * Check if a user's access request has been approved
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

    // Check if user is whitelisted (using KV)
    const isApproved = await kvdb.whitelist.isWhitelistedAsync(email);

    if (isApproved) {
      return NextResponse.json({
        approved: true,
        status: "approved",
        message: "Your access has been approved! Sign in with GitHub to continue.",
      });
    }

    // Check if there's a pending request (using KV)
    const request = await kvdb.accessRequest.findByEmail(email);

    if (request) {
      return NextResponse.json({
        approved: false,
        status: request.status,
        message:
          request.status === "pending"
            ? "Your request is pending admin approval."
            : request.status === "rejected"
            ? "Your access request was rejected."
            : "Unknown status",
        requestedAt: request.requestedAt,
      });
    }

    // No request found
    return NextResponse.json({
      approved: false,
      status: "not_found",
      message: "No access request found for this email.",
    });
  } catch (error: any) {
    console.error("Error checking approval:", error);
    return NextResponse.json(
      { error: "Failed to check approval status" },
      { status: 500 }
    );
  }
}

