import { NextResponse } from "next/server";
import { kvdb } from "@/lib/db-kv";
import { sendAccessApprovedEmail, sendAccessRejectedEmail } from "@/lib/email";

/**
 * Check if email is an admin
 */
function isAdmin(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim().toLowerCase());
  return adminEmails.includes(email.toLowerCase());
}

/**
 * PATCH - Approve or reject access request (admin only)
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { status, reviewedBy } = await req.json();
    const { id: requestId } = await params;

    console.log("Updating request:", requestId, "to status:", status);

    if (!status || !reviewedBy) {
      return NextResponse.json(
        { error: "Status and reviewedBy are required" },
        { status: 400 }
      );
    }

    if (status !== "approved" && status !== "rejected") {
      return NextResponse.json(
        { error: "Status must be 'approved' or 'rejected'" },
        { status: 400 }
      );
    }

    // Verify reviewedBy is an admin
    if (!isAdmin(reviewedBy)) {
      console.warn(`⚠️ Unauthorized approval attempt by: ${reviewedBy}`);
      return NextResponse.json(
        { error: "Unauthorized - You are not an admin" },
        { status: 403 }
      );
    }

    console.log(`✅ Admin action by: ${reviewedBy}`);

    // Update request status in KV database
    const updated = await kvdb.accessRequest.updateStatus({
      id: requestId,
      status,
      reviewedBy,
    });

    // Send email notification to user (AWAIT to catch errors)
    let emailResult = null;
    try {
      if (status === "approved") {
        console.log(`📧 Attempting to send approval email to: ${updated.email}`);
        emailResult = await sendAccessApprovedEmail({
          name: updated.name,
          email: updated.email,
          githubUsername: updated.githubUsername || "user",
        });
        console.log(`✅ Approval email result:`, emailResult);
      } else if (status === "rejected") {
        console.log(`📧 Attempting to send rejection email to: ${updated.email}`);
        emailResult = await sendAccessRejectedEmail({
          name: updated.name,
          email: updated.email,
          githubUsername: updated.githubUsername || "user",
        });
        console.log(`✅ Rejection email result:`, emailResult);
      }
    } catch (emailError: any) {
      console.error('❌ Email sending error:', emailError);
      console.error('   Error message:', emailError.message);
      console.error('   Error stack:', emailError.stack);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      request: updated,
      emailSent: emailResult?.success || false,
      emailError: emailResult?.success ? null : (emailResult?.error || 'Unknown error'),
    });
  } catch (error: any) {
    console.error("Error updating access request:", error);
    
    // If request not found, return a more helpful error
    if (error.message === "Access request not found") {
      return NextResponse.json(
        { 
          error: "This request was not found. It may have been deleted or the server was restarted. Please refresh the page and try again." 
        },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || "Failed to update request" },
      { status: 500 }
    );
  }
}

