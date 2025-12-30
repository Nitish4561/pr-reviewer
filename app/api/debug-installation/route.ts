import { NextResponse } from "next/server";
import { createClient } from "redis";

export async function GET() {
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    return NextResponse.json({
      error: "REDIS_URL not configured",
      envVars: {
        KV_URL: !!process.env.KV_URL,
        KV_REST_API_URL: !!process.env.KV_REST_API_URL,
        KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
        REDIS_URL: !!process.env.REDIS_URL,
      },
    });
  }

  let redis;
  
  try {
    redis = createClient({ url: redisUrl });
    await redis.connect();

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
      await redis.set("test", "hello");
      results.test = await redis.get("test");
    } catch (err: any) {
      results.error = err.message;
    }

    // Try to read installations
    try {
      const allIds = await redis.sMembers("installations:all");
      results.installations = {
        count: allIds.length,
        ids: allIds,
      };

      // Try to get details of first installation
      if (allIds.length > 0) {
        const firstId = allIds[0];
        const details = await redis.get(`installation:${firstId}`);
        results.installations.firstInstallation = details ? JSON.parse(details) : null;
      }
    } catch (err: any) {
      results.installations = { error: err.message };
    }

    await redis.quit();
    return NextResponse.json(results);
  } catch (error: any) {
    if (redis) {
      try { await redis.quit(); } catch {}
    }
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
  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    return NextResponse.json({
      error: "REDIS_URL not configured",
    }, { status: 500 });
  }

  let redis;
  
  try {
    redis = createClient({ url: redisUrl });
    await redis.connect();

    const { installationId, accountLogin, repoIds } = await req.json();

    const installation = {
      installationId: parseInt(installationId),
      accountLogin,
      repoIds: repoIds || [],
      openaiKey: null,
      updatedAt: new Date().toISOString(),
    };

    await redis.set(`installation:${installationId}`, JSON.stringify(installation));
    await redis.sAdd("installations:all", installationId.toString());

    await redis.quit();

    return NextResponse.json({
      success: true,
      message: "Installation saved to Redis",
      installation,
    });
  } catch (error: any) {
    if (redis) {
      try { await redis.quit(); } catch {}
    }
    return NextResponse.json({
      error: error.message,
    }, { status: 500 });
  }
}

