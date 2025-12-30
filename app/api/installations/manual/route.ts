import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST - Manually add installation (for debugging)
 * Use this if webhooks aren't working
 */
export async function POST(req: Request) {
  try {
    const { installationId, accountLogin, repositoryIds } = await req.json();

    if (!installationId || !accountLogin) {
      return NextResponse.json(
        { error: "installationId and accountLogin are required" },
        { status: 400 }
      );
    }

    // Save installation
    await db.installation.saveInstallation({
      installationId: parseInt(installationId),
      accountLogin,
      repositories: repositoryIds ? repositoryIds.map((id: number) => ({ id })) : [],
    });

    console.log(`✅ Manually added installation: ${installationId} for ${accountLogin}`);

    return NextResponse.json({
      success: true,
      message: "Installation added successfully",
      installationId,
    });
  } catch (error: any) {
    console.error("Error adding installation:", error);
    return NextResponse.json(
      { error: error.message || "Failed to add installation" },
      { status: 500 }
    );
  }
}

