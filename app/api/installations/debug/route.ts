import { NextResponse } from "next/server";
import { kvdb } from "@/lib/db-kv";

/**
 * Debug endpoint to see all installations in the database
 * GET /api/installations/debug
 */
export async function GET() {
  try {
    console.log("🔍 DEBUG: Fetching all installations from database...");
    
    const allInstallations = await kvdb.installation.getAll();
    
    console.log(`   Found ${allInstallations.length} total installation(s) in database`);
    
    allInstallations.forEach((inst, idx) => {
      console.log(`   Installation ${idx + 1}:`, {
        installationId: inst.installationId,
        accountLogin: inst.accountLogin,
        repoIds: inst.repoIds,
        repoCount: inst.repoIds?.length || 0,
        hasOpenAIKey: !!inst.openaiKey,
        updatedAt: inst.updatedAt
      });
    });
    
    // Find active installation (has repos)
    const activeInstallations = allInstallations.filter(
      inst => inst.repoIds && inst.repoIds.length > 0
    );
    
    console.log(`   Active installations (with repos): ${activeInstallations.length}`);
    
    return NextResponse.json({
      success: true,
      totalInstallations: allInstallations.length,
      activeInstallations: activeInstallations.length,
      installations: allInstallations.map(inst => ({
        installationId: inst.installationId,
        accountLogin: inst.accountLogin,
        repoCount: inst.repoIds?.length || 0,
        hasRepos: !!(inst.repoIds && inst.repoIds.length > 0),
        updatedAt: inst.updatedAt
      }))
    });
  } catch (error: any) {
    console.error("❌ Debug endpoint error:", error);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}

