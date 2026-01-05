import { NextResponse } from "next/server";

export async function GET() {
  const slug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG;
  
  if (!slug) {
    console.error("❌ NEXT_PUBLIC_GITHUB_APP_SLUG is not configured");
    return NextResponse.json(
      { error: "GitHub App slug not configured" },
      { status: 500 }
    );
  }

  return NextResponse.json({ slug });
}

