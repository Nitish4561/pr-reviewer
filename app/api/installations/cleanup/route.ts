import { NextResponse } from "next/server";
import { kvdb } from "@/lib/db-kv";

/**
 * POST /api/installations/cleanup
 * 
 * Manually clean up installation data from Redis.
 * This is useful when installations were deleted from GitHub
 * before the uninstall webhook handler was added.
 * 
 * Optional: Provide installationId to delete specific installation
 * No params: Clears ALL installations
 */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { installationId } = body;

    console.log("🧹 Cleanup endpoint called");
    
    if (installationId) {
      // Delete specific installation
      console.log(`🗑️  Deleting installation ${installationId}...`);
      await kvdb.installation.delete(installationId);
      
      return NextResponse.json({
        success: true,
        message: `Installation ${installationId} deleted`,
        deletedCount: 1
      });
    } else {
      // Delete ALL installations
      console.log("🗑️  Deleting ALL installations...");
      
      const allInstallations = await kvdb.installation.getAll();
      console.log(`   Found ${allInstallations.length} installation(s) to delete`);
      
      let deletedCount = 0;
      for (const inst of allInstallations) {
        await kvdb.installation.delete(inst.installationId);
        deletedCount++;
        console.log(`   ✅ Deleted installation ${inst.installationId}`);
      }
      
      return NextResponse.json({
        success: true,
        message: `Deleted ${deletedCount} installation(s)`,
        deletedCount
      });
    }
  } catch (error: any) {
    console.error("❌ Cleanup error:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

/**
 * GET /api/installations/cleanup
 * Show what would be deleted (dry run)
 */
export async function GET() {
  try {
    const allInstallations = await kvdb.installation.getAll();
    
    return NextResponse.json({
      success: true,
      message: `Found ${allInstallations.length} installation(s) that can be cleaned up`,
      installations: allInstallations.map(inst => ({
        installationId: inst.installationId,
        accountLogin: inst.accountLogin,
        repoCount: inst.repoIds?.length || 0
      }))
    });
  } catch (error: any) {
    console.error("❌ Cleanup preview error:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

