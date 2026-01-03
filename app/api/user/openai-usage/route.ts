import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-middleware";
import { kvdb } from "@/lib/db-kv";

/**
 * GET /api/user/openai-usage
 * Get OpenAI API usage and balance information
 */
export async function GET() {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log(`📊 Fetching OpenAI usage for user: ${session.email}`);

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
      // Fetch current billing usage for the current month
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1);
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);

      const usageResponse = await fetch(
        `https://api.openai.com/v1/usage?start_date=${startDate.toISOString().split('T')[0]}&end_date=${endDate.toISOString().split('T')[0]}`,
        {
          headers: {
            "Authorization": `Bearer ${openaiKey}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!usageResponse.ok) {
        console.error(`❌ OpenAI API error: ${usageResponse.status}`);
        
        // Try to check if key is at least valid with a simple model list call
        const modelsResponse = await fetch("https://api.openai.com/v1/models", {
          headers: {
            "Authorization": `Bearer ${openaiKey}`,
          },
        });

        if (modelsResponse.ok) {
          return NextResponse.json({
            configured: true,
            valid: true,
            usage: null,
            message: "API key is valid but usage data unavailable",
          });
        }

        return NextResponse.json({
          error: "Invalid or expired API key",
          configured: true,
          valid: false,
        }, { status: 400 });
      }

      const usageData = await usageResponse.json();

      // Calculate total cost from daily usage
      let totalCost = 0;
      if (usageData.data && Array.isArray(usageData.data)) {
        totalCost = usageData.data.reduce((sum: number, day: any) => {
          return sum + (day.aggregated_cost || 0);
        }, 0);
      }

      console.log(`✅ OpenAI usage retrieved: $${totalCost.toFixed(4)} this month`);

      return NextResponse.json({
        configured: true,
        valid: true,
        usage: {
          totalCost: totalCost,
          currency: "USD",
          period: "current_month",
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          dailyData: usageData.data || [],
        },
      });
    } catch (apiError: any) {
      console.error("❌ Error fetching OpenAI usage:", apiError);
      
      return NextResponse.json({
        configured: true,
        valid: false,
        error: "Failed to fetch usage data",
        message: apiError.message,
      }, { status: 500 });
    }
  } catch (err: any) {
    console.error("❌ Error in openai-usage endpoint:", err);
    return NextResponse.json({ 
      error: err.message || "Internal server error" 
    }, { status: 500 });
  }
}

