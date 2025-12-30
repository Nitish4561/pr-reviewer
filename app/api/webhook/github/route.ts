import { NextResponse } from "next/server";
import crypto from "crypto";
import { db } from "@/lib/db";
import { getInstallationOctokit } from "@/lib/github";

/**
 * GitHub Webhook Secret
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

    /**
     * ======================================================
     * 1️⃣ GitHub App Installation
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

      await db.installation.saveInstallation({
        installationId,
        accountLogin,
        repositories,
      });

      return NextResponse.json({ ok: true });
    }

    /**
     * ======================================================
     * 2️⃣ Pull Request Events
     * ======================================================
     */
    if (event === "pull_request") {
      const action = payload.action;

      if (action !== "opened" && action !== "synchronize") {
        return NextResponse.json({ ok: true });
      }

      const owner = payload.repository.owner.login;
      const repo = payload.repository.name;
      const pull_number = payload.pull_request.number;
      const installationId = payload.installation.id;

      // 🔍 Find installation by ID (from webhook payload)
      const installation = await db.installation.findUnique({
        where: { installationId },
      });

      if (!installation) {
        console.error("❌ No installation found for ID:", installationId);
        return NextResponse.json({ ok: true });
      }

      // 🔒 Check if user is whitelisted (WHITELIST ENFORCEMENT)
      const accountLogin = installation.accountLogin;
      const accountEmail = payload.repository?.owner?.email || payload.sender?.email;
      
      // Check whitelist by email or username
      let isWhitelisted = false;
      if (accountEmail) {
        isWhitelisted = db.whitelist.isWhitelisted(accountEmail);
      }
      
      console.log(`🔍 Whitelist check for ${accountLogin} (${accountEmail}): ${isWhitelisted ? '✅ APPROVED' : '❌ DENIED'}`);

      if (!isWhitelisted) {
        console.warn(`🚫 Access denied for ${accountLogin} - not whitelisted`);

        const octokit = await getInstallationOctokit(
          installation.installationId
        );

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:4002";

        await octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: pull_number,
          body:
            "🔒 **Beta Access Required**\n\n" +
            `NirikshanAI is currently in private beta. Only approved users can get AI code reviews.\n\n` +
            `**Request Access:**\n` +
            `👉 ${baseUrl}\n\n` +
            `Once approved, your PRs will be automatically reviewed!`,
        });

        return NextResponse.json({ ok: true });
      }

      if (!installation.openaiKey) {
        console.warn("⚠️ OpenAI key not configured");

        const octokit = await getInstallationOctokit(
          installation.installationId
        );

        await octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: pull_number,
          body:
            "❌ **AI review is not enabled**\n\n" +
            "Please add your OpenAI API key in the app settings.",
        });

        return NextResponse.json({ ok: true });
      }

      // 🔐 GitHub client
      const octokit = await getInstallationOctokit(
        installation.installationId
      );

      // 🤖 Run PR Review using our reviewer system
      const { runPRReview } = await import("@/reviewer/index.js");

      await runPRReview({
        octokit,
        owner,
        repo,
        pull_number,
        openaiApiKey: installation.openaiKey,
      });

      return NextResponse.json({ ok: true });
    }

    /**
     * ======================================================
     * 3️⃣ Ignore Other Events
     * ======================================================
     */
    return NextResponse.json({ ok: true });

  } catch (err: any) {
    console.error("🔥 Webhook crashed:", err);
    console.error("🔥 Payload:", bodyText);

    // Always return 200 to prevent retries
    return NextResponse.json({ ok: true });
  }
}
