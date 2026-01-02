import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-middleware";
import { kvdb } from "@/lib/db-kv";

/**
 * GET /api/user/settings
 * Get current OpenAI key status
 */
export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all installations to find the user's installation
    const installations = await kvdb.installation.getAll();

    if (installations.length === 0) {
      return NextResponse.json({
        hasKey: false,
        keyPreview: null
      });
    }

    const installation = installations[0];
    const hasKey = !!installation.openaiKey;
    const keyPreview = hasKey 
      ? `sk-...${installation.openaiKey.slice(-4)}` 
      : null;

    return NextResponse.json({
      hasKey,
      keyPreview
    });
  } catch (err: any) {
    console.error("❌ Failed to get settings:", err);
    return NextResponse.json(
      { error: "Failed to get settings" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/user/settings
 * Save OpenAI key
 */
export async function POST(req: Request) {
  try {
    console.log("📝 Saving OpenAI key...");
    
    // Check if user is authenticated
    const session = await getSession();
    
    if (!session) {
      console.error("❌ No session found");
      return NextResponse.json(
        { error: "Unauthorized - Please sign in" },
        { status: 401 }
      );
    }

    console.log(`   User: ${session.email}`);

    const { openaiKey } = await req.json();

    if (!openaiKey || !openaiKey.startsWith("sk-")) {
      console.error("❌ Invalid OpenAI key format");
      return NextResponse.json(
        { error: "Invalid OpenAI key format" },
        { status: 400 }
      );
    }

    console.log("   Key format: valid ✅");

    // Get all installations to find the user's installation
    const installations = await kvdb.installation.getAll();
    console.log(`   Found ${installations.length} installation(s)`);

    if (installations.length === 0) {
      console.error("❌ No installation found");
      return NextResponse.json(
        { error: "Please install the GitHub App first" },
        { status: 404 }
      );
    }

    // Use the most recent installation
    const installation = installations[0];
    console.log(`   Using installation: ${installation.installationId}`);

    // Save OpenAI key to the installation
    await kvdb.installation.upsert({
      where: { installationId: installation.installationId },
      update: { openaiKey },
      create: { ...installation, openaiKey }
    });

    console.log(`✅ OpenAI key saved to installation ${installation.installationId}`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ Failed to save OpenAI key:", err);
    console.error("   Error message:", err.message);
    console.error("   Error stack:", err.stack);
    return NextResponse.json(
      { error: "Failed to save OpenAI key" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/user/settings
 * Delete OpenAI key
 */
export async function DELETE() {
  try {
    console.log("🗑️  Deleting OpenAI key...");
    
    const session = await getSession();
    
    if (!session) {
      console.error("❌ No session found");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log(`   User: ${session.email}`);

    // Get all installations
    const installations = await kvdb.installation.getAll();
    console.log(`   Found ${installations.length} installation(s)`);

    if (installations.length === 0) {
      return NextResponse.json(
        { error: "No installation found" },
        { status: 404 }
      );
    }

    const installation = installations[0];
    console.log(`   Using installation: ${installation.installationId}`);

    // Remove OpenAI key from the installation
    await kvdb.installation.upsert({
      where: { installationId: installation.installationId },
      update: { openaiKey: null },
      create: { ...installation, openaiKey: null }
    });

    console.log(`✅ OpenAI key deleted from installation ${installation.installationId}`);

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("❌ Failed to delete OpenAI key:", err);
    return NextResponse.json(
      { error: "Failed to delete OpenAI key" },
      { status: 500 }
    );
  }
}
