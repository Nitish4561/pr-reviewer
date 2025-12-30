import { NextResponse } from "next/server";
import { createClient } from "redis";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const redisUrl = process.env.REDIS_URL;
  
  if (!redisUrl) {
    return NextResponse.json({ error: "Redis not configured" });
  }

  try {
    const redis = createClient({ url: redisUrl });
    await redis.connect();
    
    // Check if email is in whitelist
    const isWhitelisted = await redis.sIsMember("whitelist:emails", email.toLowerCase());
    
    // Get all whitelisted emails for debugging
    const allEmails = await redis.sMembers("whitelist:emails");
    
    await redis.quit();

    return NextResponse.json({
      email,
      isWhitelisted: !!isWhitelisted,
      allWhitelistedEmails: allEmails,
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
    }, { status: 500 });
  }
}

