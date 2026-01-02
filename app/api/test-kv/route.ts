import { NextResponse } from "next/server";
import { createClient } from "redis";

/**
 * Test Redis connection using REDIS_URL
 */
export async function GET() {
  const envVars = {
    KV_REST_API_URL: !!process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
    REDIS_URL: !!process.env.REDIS_URL,
    KV_URL: !!process.env.KV_URL,
  };

  console.log("🔍 Testing Redis Connection...");
  console.log("Environment Variables:", envVars);

  const results: any = {
    envVars,
    tests: {},
  };

  let redis: any = null;

  try {
    if (!process.env.REDIS_URL) {
      throw new Error("REDIS_URL not configured");
    }

    // Connect to Redis
    console.log("📡 Connecting to Redis...");
    redis = createClient({ url: process.env.REDIS_URL });
    await redis.connect();
    console.log("✅ Connected to Redis");

    // Test 1: Write
    const testKey = `test_${Date.now()}`;
    const testValue = JSON.stringify({ hello: "world", timestamp: new Date().toISOString() });
    
    console.log(`📝 Test 1: Writing to key ${testKey}...`);
    await redis.set(testKey, testValue);
    results.tests.write = { success: true, key: testKey };
    console.log("✅ Write successful");

    // Test 2: Read
    console.log(`📖 Test 2: Reading from key ${testKey}...`);
    const retrieved = await redis.get(testKey);
    const parsed = JSON.parse(retrieved);
    results.tests.read = { success: true, value: parsed };
    console.log("✅ Read successful:", parsed);

    // Test 3: Delete
    console.log(`🗑️ Test 3: Deleting key ${testKey}...`);
    await redis.del(testKey);
    results.tests.delete = { success: true };
    console.log("✅ Delete successful");

    // Test 4: Set operations
    console.log(`📦 Test 4: Testing set operations...`);
    await redis.sAdd("test_set", "value1", "value2");
    const members = await redis.sMembers("test_set");
    await redis.del("test_set");
    results.tests.set = { success: true, members };
    console.log("✅ Set operations successful:", members);

    results.overall = "✅ All Redis tests passed!";
    results.configured = true;
  } catch (err: any) {
    console.error("❌ Redis Test Failed:", err);
    results.overall = `❌ Redis test failed: ${err.message}`;
    results.configured = false;
    results.error = {
      message: err.message,
      stack: err.stack?.split('\n').slice(0, 5).join('\n'), // Truncate stack
    };
  } finally {
    // Clean up connection
    if (redis) {
      try {
        await redis.quit();
        console.log("🔌 Redis connection closed");
      } catch (err) {
        console.error("Warning: Failed to close Redis connection");
      }
    }
  }

  return NextResponse.json(results, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

