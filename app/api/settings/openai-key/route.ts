import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  const { installationId, openaiKey } = await req.json();

  if (!installationId || !openaiKey) {
    return NextResponse.json({ error: "Missing data" }, { status: 400 });
  }

  console.log("🔑 Saving OpenAI key for installation:", installationId, typeof installationId);

  await db.installation.upsert({
    where: { installationId: Number(installationId) },
    update: { openaiKey },
    create: {
      installationId: Number(installationId),
      openaiKey,
    },
  });

  return NextResponse.json({ success: true });
}
