import { NextResponse } from "next/server";
import { encrypt } from "@/lib/crypto";
import { getSessionUser } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const user = await getSessionUser();

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { openaiKey } = await req.json();

  if (!openaiKey || !openaiKey.startsWith("sk-")) {
    return NextResponse.json(
      { error: "Invalid OpenAI key" },
      { status: 400 }
    );
  }

  const encrypted = encrypt(openaiKey);

  await db.user.upsert({
    where: { githubId: user.githubId },
    update: { openaiKey: encrypted },
    create: {
      githubId: user.githubId,
      openaiKey: encrypted,
    },
  });

  return NextResponse.json({ success: true });
}
