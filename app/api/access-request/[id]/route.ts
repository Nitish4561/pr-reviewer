import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendApprovalEmail } from "@/lib/email";

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

    // TODO: Add proper admin authentication
    // For now, we trust the reviewedBy email

    // Check if request exists
    const allRequests = db.accessRequest.findAll();
    console.log("All requests in DB:", allRequests.map(r => ({ id: r.id, email: r.email })));

    const updated = await db.accessRequest.updateStatus({
      id: requestId,
      status,
      reviewedBy,
    });

    // Send approval email if status is approved
    if (status === "approved") {
      try {
        const appSlug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG || "nirikshanai";
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4002";
        
        await sendApprovalEmail({
          to: updated.email,
          name: updated.name,
          installationLink: `https://github.com/apps/${appSlug}/installations/new`,
          dashboardLink: `${baseUrl}/dashboard`,
        });
        
        console.log(`✅ Approval email sent to ${updated.email}`);
      } catch (emailError) {
        console.error("Failed to send approval email:", emailError);
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      request: updated,
      emailSent: status === "approved",
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

