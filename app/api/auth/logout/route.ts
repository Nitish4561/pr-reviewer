import { NextResponse } from "next/server";
import { destroySession } from "@/lib/auth-middleware";

export async function POST() {
  await destroySession();
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4002";
  return NextResponse.redirect(`${baseUrl}/?logout=success`);
}

export async function GET() {
  await destroySession();
  
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4002";
  return NextResponse.redirect(`${baseUrl}/?logout=success`);
}

