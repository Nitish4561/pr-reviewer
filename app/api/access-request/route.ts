import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST - Request beta access
 */
export async function POST(req: Request) {
  try {
    const { name, email, githubUsername, message } = await req.json();

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    // Check if already requested
    const existing = db.accessRequest.findByEmail(email);
    if (existing) {
      if (existing.status === "approved") {
        return NextResponse.json(
          { error: "You already have access! Check your email for the installation link." },
          { status: 400 }
        );
      }
      if (existing.status === "pending") {
        // Check if request is older than 5 minutes (likely stale after server restart)
        const requestAge = Date.now() - new Date(existing.requestedAt).getTime();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (requestAge > fiveMinutes) {
          console.log(`♻️ Allowing re-request for ${email} (old request was ${Math.round(requestAge / 1000)}s ago)`);
          // Allow re-requesting - old one is likely stale
        } else {
          return NextResponse.json(
            { error: "Your request is already pending review. Please wait for approval." },
            { status: 400 }
          );
        }
      }
    }

    // Create access request
    const request = await db.accessRequest.create({
      name,
      email,
      githubUsername,
      message,
    });

    return NextResponse.json({
      success: true,
      message: "Access request submitted! We'll review it shortly.",
      requestId: request.id,
    });
  } catch (error: any) {
    console.error("Error creating access request:", error);
    return NextResponse.json(
      { error: error.message || "Failed to submit request" },
      { status: 500 }
    );
  }
}

/**
 * Check if email is an admin
 */
function isAdmin(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

/**
 * GET - Get all access requests (admin only)
 */
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminEmail = searchParams.get("adminEmail");

    // Verify admin email against ADMIN_EMAILS env var
    if (!adminEmail) {
      return NextResponse.json(
        { error: "Unauthorized - Email required" },
        { status: 401 }
      );
    }

    if (!isAdmin(adminEmail)) {
      console.warn(`⚠️ Unauthorized access attempt by: ${adminEmail}`);
      return NextResponse.json(
        { error: "Unauthorized - You are not an admin" },
        { status: 403 }
      );
    }

    console.log(`✅ Admin access granted to: ${adminEmail}`);

    const requests = db.accessRequest.findAll();
    const whitelist = db.whitelist.findAll();

    return NextResponse.json({
      requests,
      whitelist,
    });
  } catch (error: any) {
    console.error("Error fetching access requests:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

