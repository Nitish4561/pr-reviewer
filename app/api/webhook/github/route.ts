import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getInstallationOctokit } from "@/lib/github";

/**
 * GitHub Webhook Secret (same as in GitHub App settings)
 */
const WEBHOOK_SECRET = process.env.GITHUB_WEBHOOK_SECRET!;

/**
 * Verify GitHub webhook signature
 */
function verifySignature(payload: string, signature: string) {
  if (!signature) return false;

  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  const digest = `sha256=${hmac.update(payload).digest("hex")}`;

  return crypto.timingSafeEqual(
    Buffer.from(digest),
    Buffer.from(signature)
  );
}

export async function POST(req: Request) {
  let bodyText = "";

  try {
    bodyText = await req.text();

    const signature = req.headers.get("x-hub-signature-256") || "";
    const event = req.headers.get("x-github-event");

    // 🔐 Verify signature
    if (!verifySignature(bodyText, signature)) {
      console.error("❌ Invalid GitHub signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(bodyText);

    console.log("📦 GitHub Event:", event);
    console.log("📦 Action:", payload.action);

    /**
     * ======================================================
     * 1️⃣ GitHub App Installation Event
     * ======================================================
     */
    if (event === "installation" && payload.action === "created") {
      const installationId = payload.installation.id;
      const accountLogin = payload.installation.account.login;

      const repositories =
        payload.repositories?.map((repo: any) => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
        })) ?? [];

      console.log("✅ App installed on:", accountLogin);
      console.log("📦 Installation ID:", installationId);
      console.log("📦 Repositories:", repositories.map((r: any) => r.fullName));

      await db.installation.saveInstallation({
        installationId,
        accountLogin,
        repositories,
      });

      return NextResponse.json({ ok: true });
    }

    /**
     * ======================================================
     * 2️⃣ Pull Request Opened / Updated
     * ======================================================
     */
    if (event === "pull_request") {
      const action = payload.action;

      if (action === "opened" || action === "synchronize") {
        const repoId = payload.repository.id;
        const owner = payload.repository.owner.login;
        const repo = payload.repository.name;
        const pull_number = payload.pull_request.number;

        console.log("🚀 PR received:", payload.pull_request.html_url);

        // 🔍 Find installation for this repository
        const installation = await db.installation.findByRepoId(repoId);

        if (!installation) {
          console.error("❌ No installation found for repo:", repoId);
          return NextResponse.json({ ok: true });
        }

        console.log(
          "🔑 Using installation:",
          installation.installationId
        );

        // 🔐 Create authenticated GitHub client
        const octokit = await getInstallationOctokit(
          installation.installationId
        );

        // 🤖 Run AI PR review
        const { runPRReview } = await import("@/reviewer/index.js");

        await runPRReview({
          owner,
          repo,
          pull_number,
          octokit,
          openaiApiKey: process.env.OPENAI_API_KEY!,
        });

        console.log("✅ PR review triggered");

        return NextResponse.json({ ok: true });
      }
    }

    /**
     * ======================================================
     * 3️⃣ Ignore Other Events
     * ======================================================
     */
    console.log("ℹ️ Ignored event:", event);
    return NextResponse.json({ ok: true });

  } catch (err: any) {
    console.error("🔥 Webhook crashed:", err);
    console.error("🔥 Payload:", bodyText);

    // IMPORTANT: Always return 200 so GitHub doesn't retry forever
    return NextResponse.json({ ok: true });
  }
}
