import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-middleware";
import { kvdb } from "@/lib/db-kv";

/**
 * GET /api/user/openai-usage
 * Validate OpenAI API key and check if it's working
 * Note: OpenAI doesn't provide programmatic access to billing data
 */
export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`🔑 Validating OpenAI key for user: ${session.email}`);

    // Get user's installations to find their OpenAI key
    const installations = await kvdb.installation.getAll();
    const userInstallation = installations.find((inst: any) => 
      inst.accountLogin === session.githubUsername || inst.userId === session.userId
    );

    if (!userInstallation?.openaiKey) {
      return NextResponse.json({ 
        error: "No OpenAI key configured",
        configured: false 
      }, { status: 404 });
    }

    const openaiKey = userInstallation.openaiKey;

    try {
      // Validate the API key by making a lightweight API call
      console.log("📡 Testing OpenAI API key validity...");
      
      const modelsResponse = await fetch("https://api.openai.com/v1/models", {
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
        },
      });

      if (!modelsResponse.ok) {
        console.error(`❌ OpenAI API key validation failed: ${modelsResponse.status}`);
        
        if (modelsResponse.status === 401) {
          return NextResponse.json({
            configured: true,
            valid: false,
            error: "Invalid API key",
            message: "The API key appears to be invalid or expired",
          }, { status: 200 });
        }
        
        return NextResponse.json({
          configured: true,
          valid: false,
          error: "API key validation failed",
          message: `OpenAI API returned status ${modelsResponse.status}`,
        }, { status: 200 });
      }

      const modelsData = await modelsResponse.json();
      const modelCount = modelsData.data?.length || 0;

      console.log(`✅ OpenAI API key is valid (${modelCount} models available)`);

      // Try to get account information if available
      let organizationInfo = null;
      try {
        // This might not work for all keys, but we'll try
        const orgResponse = await fetch("https://api.openai.com/v1/organizations", {
          headers: {
            "Authorization": `Bearer ${openaiKey}`,
          },
        });
        
        if (orgResponse.ok) {
          organizationInfo = await orgResponse.json();
        }
      } catch (err) {
        // Silently fail - organization endpoint might not be available
        console.log("⚠️ Organization endpoint not accessible");
      }

      return NextResponse.json({
        configured: true,
        valid: true,
        keyPrefix: openaiKey.substring(0, 7) + "...",
        modelCount: modelCount,
        organization: organizationInfo,
        message: "API key is valid and working",
        billingNote: "OpenAI doesn't provide programmatic access to billing data. Please check your usage on the OpenAI dashboard.",
      });
    } catch (apiError: any) {
      console.error("❌ Error validating OpenAI key:", apiError);
      
      return NextResponse.json({
        configured: true,
        valid: false,
        error: "Failed to validate API key",
        message: apiError.message,
      }, { status: 200 });
    }
  } catch (err: any) {
    console.error("❌ Error in openai-usage endpoint:", err);
    return NextResponse.json({ 
      error: err.message || "Internal server error" 
    }, { status: 500 });
  }
}

