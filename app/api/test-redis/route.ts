import { NextResponse } from "next/server";
import { kv } from "@vercel/kv";

export async function GET() {
  try {
    // Test write
    await kv.set("test:connection", { timestamp: Date.now(), status: "ok" });
    
    // Test read
    const data = await kv.get("test:connection");
    
    // Check environment variables
    const envCheck = {
      KV_REST_API_URL: !!process.env.KV_REST_API_URL,
      KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
      REDIS_URL: !!process.env.REDIS_URL,
      KV_URL: !!process.env.KV_URL,
    };
    
    return NextResponse.json({
      success: true,
      message: "Redis is working!",
      data,
      envVars: envCheck,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      envVars: {
        KV_REST_API_URL: !!process.env.KV_REST_API_URL,
        KV_REST_API_TOKEN: !!process.env.KV_REST_API_TOKEN,
        REDIS_URL: !!process.env.REDIS_URL,
        KV_URL: !!process.env.KV_URL,
      },
    }, { status: 500 });
  }
}



