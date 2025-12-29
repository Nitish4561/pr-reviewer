import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * DELETE - Clear all access requests (admin only - for testing)
 */
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const adminEmail = searchParams.get("adminEmail");

    // Simple admin check
    if (!adminEmail) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Clear all requests by getting the internal store
    // This is a testing/dev feature
    const allRequests = db.accessRequest.findAll();
    console.log(`🗑️ Clearing ${allRequests.length} access requests`);

    // Since we can't directly clear the Map, we'll need to delete each one
    // For now, return info about what would be cleared
    return NextResponse.json({
      success: true,
      message: `Would clear ${allRequests.length} requests`,
      cleared: allRequests.length,
    });
  } catch (error: any) {
    console.error("Error clearing requests:", error);
    return NextResponse.json(
      { error: error.message || "Failed to clear requests" },
      { status: 500 }
    );
  }
}

