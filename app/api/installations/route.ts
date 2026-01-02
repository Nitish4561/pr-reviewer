import { NextResponse } from "next/server";
import { kvdb } from "@/lib/db-kv";

export async function GET() {
  console.log("🔍 Checking for installations...");
  
  const installations = await kvdb.installation.getAll();
  
  console.log(`   Found ${installations.length} installation(s)`);

  // Find the most recent installation with repositories
  const activeInstallation = installations
    .filter(inst => inst.repoIds && inst.repoIds.length > 0)
    .sort((a, b) => b.installationId - a.installationId)[0];

  if (!activeInstallation) {
    console.log("   ❌ No active installation found");
    return NextResponse.json({ 
      installed: false,
      installation: null,
      error: "No active installation found"
    });
  }

  console.log(`   ✅ Active installation found: ${activeInstallation.installationId}`);
  
  return NextResponse.json({ 
    installed: true,
    installation: {
      installationId: activeInstallation.installationId,
      accountLogin: activeInstallation.accountLogin,
      repoCount: activeInstallation.repoIds.length,
      hasOpenAIKey: !!activeInstallation.openaiKey,
    }
  });
}

