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

    // Send email notification to user (non-blocking)
    if (status === "approved") {
      sendAccessApprovedEmail({
        name: updated.name,
        email: updated.email,
        githubUsername: updated.githubUsername || "user",
      }).then(result => {
        if (result.success) {
          console.log(`✅ Approval email sent to ${updated.email}`);
        } else {
          console.warn('⚠️ Failed to send approval email:', result.error || result.message);
        }
      }).catch(err => {
        console.error('❌ Error sending approval email:', err);
      });
    } else if (status === "rejected") {
      sendAccessRejectedEmail({
        name: updated.name,
        email: updated.email,
        githubUsername: updated.githubUsername || "user",
      }).then(result => {
        if (result.success) {
          console.log(`✅ Rejection email sent to ${updated.email}`);
        } else {
          console.warn('⚠️ Failed to send rejection email:', result.error || result.message);
        }
      }).catch(err => {
        console.error('❌ Error sending rejection email:', err);
      });
    }

    return NextResponse.json({
      success: true,
      request: updated,
      emailSent: true,
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

