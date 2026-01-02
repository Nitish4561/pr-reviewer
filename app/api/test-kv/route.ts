import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

/**
 * Test KV connection and environment variables
 */
export async function GET() {
  const envVars = {
    KV_REST_API_URL: !!process.env.KV_REST_API_URL,
    KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
    REDIS_URL: !!process.env.REDIS_URL,
    KV_URL: !!process.env.KV_URL,
  };

  console.log("🔍 Testing KV Connection...");
  console.log("Environment Variables:", envVars);

  const results: any = {
    envVars,
    tests: {},
  };

  // Test 1: Write
  try {
    const testKey = `test_${Date.now()}`;
    const testValue = { hello: "world", timestamp: new Date().toISOString() };
    
    console.log(`📝 Test 1: Writing to key ${testKey}...`);
    await kv.set(testKey, testValue);
    results.tests.write = { success: true, key: testKey };
    console.log("✅ Write successful");

    // Test 2: Read
    console.log(`📖 Test 2: Reading from key ${testKey}...`);
    const retrieved = await kv.get(testKey);
    results.tests.read = { success: true, value: retrieved };
    console.log("✅ Read successful:", retrieved);

    // Test 3: Delete
    console.log(`🗑️ Test 3: Deleting key ${testKey}...`);
    await kv.del(testKey);
    results.tests.delete = { success: true };
    console.log("✅ Delete successful");

    // Test 4: Set operations
    console.log(`📦 Test 4: Testing set operations...`);
    await kv.sadd("test_set", "value1", "value2");
    const members = await kv.smembers("test_set");
    await kv.del("test_set");
    results.tests.set = { success: true, members };
    console.log("✅ Set operations successful:", members);

    results.overall = "✅ All KV tests passed!";
    results.configured = true;
  } catch (err: any) {
    console.error("❌ KV Test Failed:", err);
    results.overall = `❌ KV test failed: ${err.message}`;
    results.configured = false;
    results.error = {
      message: err.message,
      stack: err.stack,
    };
  }

  return NextResponse.json(results, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

