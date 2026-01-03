import { NextResponse } from "next/server";
import { kvdb } from "@/lib/db-kv";
import { sendAdminAccessRequestNotification } from "@/lib/email";

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

    // Check if already requested (using KV)
    const existing = await kvdb.accessRequest.findByEmail(email);
    if (existing) {
      if (existing.status === "approved") {
        return NextResponse.json(
          { error: "You already have access! Check your email for the installation link." },
          { status: 400 }
        );
      }
      if (existing.status === "pending") {
        return NextResponse.json(
          { error: "Your request is already pending review. Please wait for approval." },
          { status: 400 }
        );
      }
    }

    // Create access request (saves to Redis via KV)
    const request = await kvdb.accessRequest.create({
      name,
      email,
      githubUsername,
      message,
    });

    // Send email notification to admins (AWAIT to catch errors)
    let emailResult = null;
    try {
      console.log(`📧 Attempting to send admin notification...`);
      emailResult = await sendAdminAccessRequestNotification({
        name,
        email,
        githubUsername,
        message,
      });
      console.log(`✅ Admin email result:`, emailResult);
    } catch (emailError: any) {
      console.error('❌ Error sending admin notification:', emailError);
      console.error('   Error message:', emailError.message);
      console.error('   Error stack:', emailError.stack);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Access request submitted! We'll review it shortly.",
      requestId: request.id,
      emailSent: emailResult?.success || false,
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

    // Fetch from KV database (persisted in Redis)
    const requests = await kvdb.accessRequest.findAll();
    const whitelist = await kvdb.whitelist.findAll();

    console.log(`📊 Found ${requests.length} requests and ${whitelist.length} whitelisted users`);

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

