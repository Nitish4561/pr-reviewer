import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET() {
  try {
    const results = {
      envVars: {
        KV_URL: !!process.env.KV_URL,
        KV_REST_API_URL: !!process.env.KV_REST_API_URL,
        KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
        REDIS_URL: !!process.env.REDIS_URL,
      },
      test: null as any,
      installations: null as any,
      error: null as any,
    };

    // Try to test Redis connection
    try {
      await kv.set("test", "hello");
      results.test = await kv.get("test");
    } catch (err: any) {
      results.error = err.message;
    }

    // Try to read installations
    try {
      const allIds = await kv.smembers("installations:all");
      results.installations = {
        count: allIds.length,
        ids: allIds,
      };

      // Try to get details of first installation
      if (allIds.length > 0) {
        const firstId = Array.from(allIds)[0];
        const details = await kv.get(`installation:${firstId}`);
        results.installations.firstInstallation = details;
      }
    } catch (err: any) {
      results.installations = { error: err.message };
    }

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

/**
 * POST - Manually save installation for testing
 */
export async function POST(req: Request) {
  try {
    const { installationId, accountLogin, repoIds } = await req.json();

    const installation = {
      installationId: parseInt(installationId),
      accountLogin,
      repoIds: repoIds || [],
      openaiKey: null,
      updatedAt: new Date().toISOString(),
    };

    await kv.set(`installation:${installationId}`, installation);
    await kv.sadd("installations:all", installationId);

    return NextResponse.json({
      success: true,
      message: "Installation saved to Redis",
      installation,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
    }, { status: 500 });
  }
}

