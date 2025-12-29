import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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

    return NextResponse.json({
      success: true,
      request: updated,
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

