import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const installations = await db.installation.getAll();

  // Find the most recent installation with repositories
  const activeInstallation = installations
    .filter(inst => inst.repoIds.length > 0)
    .sort((a, b) => b.installationId - a.installationId)[0];

  if (!activeInstallation) {
    return NextResponse.json({ 
      installation: null,
      error: "No active installation found"
    });
  }

  return NextResponse.json({ 
    installation: {
      installationId: activeInstallation.installationId,
      accountLogin: activeInstallation.accountLogin,
      repoCount: activeInstallation.repoIds.length,
      hasOpenAIKey: !!activeInstallation.openaiKey,
    }
  });
}

