import { NextResponse } from "next/server";
import { createClient } from "redis";

/**
 * DELETE - Clear installation from Redis (for testing)
 */
export async function DELETE() {
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

    // Get all installation IDs
    const allIds = await redis.sMembers("installations:all");
    
    // Delete each installation
    for (const id of allIds) {
      await redis.del(`installation:${id}`);
    }
    
    // Clear the set
    await redis.del("installations:all");

    await redis.quit();

    return NextResponse.json({
      success: true,
      message: `Cleared ${allIds.length} installations from Redis`,
      clearedIds: allIds,
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

