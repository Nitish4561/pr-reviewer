import { NextResponse } from "next/server";
import { kvdb } from "@/lib/db-kv";
import { getSession } from "@/lib/auth-middleware";

export async function GET() {
  console.log("🔍 Checking for installations...");
  
  const session = await getSession();
  
  if (!session) {
    console.log("   ❌ No session found");
    return NextResponse.json({ 
      installed: false,
      installation: null,
      error: "Not authenticated"
    }, { status: 401 });
  }

  console.log(`   User: ${session.email} (@${session.githubUsername})`);
  
  const installations = await kvdb.installation.getAll();
  
  console.log(`   Found ${installations.length} total installation(s)`);

  // Find THIS user's installation (matching their GitHub username)
  const userInstallation = installations.find((inst: any) => 
    inst.accountLogin === session.githubUsername
  );

  if (!userInstallation) {
    console.log(`   ❌ No installation found for @${session.githubUsername}`);
    return NextResponse.json({ 
      installed: false,
      installation: null,
      error: "No installation found for your account"
    });
  }

  // Check if installation has repositories
  if (!userInstallation.repoIds || userInstallation.repoIds.length === 0) {
    console.log(`   ⚠️ Installation found but no repositories configured`);
    return NextResponse.json({ 
      installed: false,
      installation: null,
      error: "Installation has no repositories"
    });
  }

  console.log(`   ✅ Installation found for @${session.githubUsername}: ${userInstallation.installationId}`);
  console.log(`      Repositories: ${userInstallation.repoIds.length}`);
  console.log(`      Has OpenAI key: ${!!userInstallation.openaiKey}`);
  
  return NextResponse.json({ 
    installed: true,
    installation: {
      installationId: userInstallation.installationId,
      accountLogin: userInstallation.accountLogin,
      repoCount: userInstallation.repoIds.length,
      hasOpenAIKey: !!userInstallation.openaiKey,
    }
  });
}

