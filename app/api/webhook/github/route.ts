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
  
  // If webhook secret is not configured, skip verification (dev mode)
  if (!WEBHOOK_SECRET) {
    console.warn("⚠️ GITHUB_WEBHOOK_SECRET not set - skipping signature verification");
    return true;
  }

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
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("📦 INSTALLATION WEBHOOK RECEIVED");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      const installationId = payload.installation.id;
      const accountLogin = payload.installation.account.login;

      console.log(`📦 Installation Details:`);
      console.log(`   Account: ${accountLogin}`);
      console.log(`   Installation ID: ${installationId}`);

      const repositories =
        payload.repositories?.map((repo: any) => ({
          id: repo.id,
          name: repo.name,
          fullName: repo.full_name,
        })) ?? [];

      console.log(`📦 Repositories (${repositories.length}):`);
      repositories.forEach((r: any) => console.log(`   - ${r.fullName} (ID: ${r.id})`));

      console.log(`💾 Saving installation to database...`);
      await db.installation.saveInstallation({
        installationId,
        accountLogin,
        repositories,
      });

      console.log(`✅ Installation saved successfully for ${accountLogin}`);
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      return NextResponse.json({ ok: true });
    }

    /**
     * ======================================================
     * 2️⃣ Pull Request Events
     * ======================================================
     */
    if (event === "pull_request") {
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🔔 PR WEBHOOK RECEIVED");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      
      const action = payload.action;
      console.log(`📌 Action: ${action}`);

      if (action !== "opened" && action !== "synchronize") {
        console.log(`⏭️ Skipping action: ${action} (only process 'opened' or 'synchronize')`);
        return NextResponse.json({ ok: true });
      }

      const owner = payload.repository.owner.login;
      const repo = payload.repository.name;
      const pull_number = payload.pull_request.number;
      const installationId = payload.installation.id;

      console.log(`📦 PR Details:`);
      console.log(`   Owner: ${owner}`);
      console.log(`   Repo: ${repo}`);
      console.log(`   PR #: ${pull_number}`);
      console.log(`   Installation ID: ${installationId}`);

      // 🔍 Find installation by ID (from webhook payload)
      console.log(`🔍 Looking for installation ID: ${installationId}...`);
      const installation = await db.installation.findUnique({
        where: { installationId },
      });

      if (!installation) {
        console.error("❌ NO INSTALLATION FOUND FOR ID:", installationId);
        console.error("   This means the installation webhook wasn't processed or data was lost");
        return NextResponse.json({ ok: true });
      }
      
      console.log(`✅ Installation found: ${installation.accountLogin}`);
      console.log(`   Repos: ${installation.repoIds.length}`);
      console.log(`   Has OpenAI Key: ${!!installation.openaiKey}`);
      if (installation.openaiKey) {
        console.log(`   OpenAI Key: ${installation.openaiKey.substring(0, 20)}...`);
      }

      // 🔒 Check if user is whitelisted (WHITELIST ENFORCEMENT)
      const accountLogin = installation.accountLogin;
      const accountEmail = payload.repository?.owner?.email || payload.sender?.email;
      const senderEmail = payload.sender?.email;
      
      // Admin emails - auto-whitelist
      const adminEmails = (process.env.ADMIN_EMAILS || "").split(",").filter(Boolean);
      const isAdmin = accountEmail && adminEmails.some(admin => 
        admin.toLowerCase() === accountEmail.toLowerCase()
      );
      
      // Check whitelist by email (use async version for Redis support)
      let isWhitelisted = isAdmin; // Admins are always whitelisted
      
      if (!isWhitelisted && accountEmail) {
        isWhitelisted = await db.whitelist.isWhitelistedAsync(accountEmail);
      }
      
      // Also check sender email
      if (!isWhitelisted && senderEmail && senderEmail !== accountEmail) {
        isWhitelisted = await db.whitelist.isWhitelistedAsync(senderEmail);
      }
      
      console.log(`🔍 Whitelist check for ${accountLogin} (${accountEmail}): ${isWhitelisted ? '✅ APPROVED' : '❌ DENIED'}${isAdmin ? ' (ADMIN)' : ''}`);

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
        console.error("❌ OPENAI KEY NOT CONFIGURED");
        console.error("   Go to /settings and add your OpenAI API key");

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

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("🚀 STARTING AI PR REVIEW");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

      // 🔐 GitHub client
      console.log("🔐 Creating GitHub client...");
      const octokit = await getInstallationOctokit(
        installation.installationId
      );
      console.log("✅ GitHub client created");

      // 🤖 Run PR Review using our reviewer system
      console.log("🤖 Importing reviewer module...");
      const { runPRReview } = await import("@/reviewer/index.js");
      console.log("✅ Reviewer module loaded");

      console.log("🔄 Running PR review...");
      await runPRReview({
        octokit,
        owner,
        repo,
        pull_number,
        openaiApiKey: installation.openaiKey,
      });

      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      console.log("✅ PR REVIEW COMPLETED SUCCESSFULLY");
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

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
