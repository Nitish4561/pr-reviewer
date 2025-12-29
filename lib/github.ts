import jwt from "jsonwebtoken";
import { Octokit } from "@octokit/rest";

/* ------------------------------------------------------------------ */
/* 🔐 GitHub App Auth                                                   */
/* ------------------------------------------------------------------ */

const APP_ID = process.env.GITHUB_APP_ID!;
const PRIVATE_KEY = process.env.GITHUB_PRIVATE_KEY!.replace(/\\n/g, "\n");

if (!APP_ID || !PRIVATE_KEY) {
  throw new Error("Missing GITHUB_APP_ID or GITHUB_PRIVATE_KEY");
}

/**
 * Create an authenticated Octokit instance for a GitHub App installation
 */
export async function getInstallationOctokit(
  installationId: number
): Promise<Octokit> {
  const now = Math.floor(Date.now() / 1000);

  // 1️⃣ Create JWT for GitHub App
  const jwtToken = jwt.sign(
    {
      iat: now - 60,
      exp: now + 600,
      iss: APP_ID,
    },
    PRIVATE_KEY,
    { algorithm: "RS256" }
  );

  // 2️⃣ Exchange JWT → Installation token
  const appOctokit = new Octokit({ auth: jwtToken });

  const res = await appOctokit.request(
    "POST /app/installations/{installation_id}/access_tokens",
    { installation_id: installationId }
  );

  // 3️⃣ Return installation-scoped Octokit
  return new Octokit({
    auth: res.data.token,
  });
}

/* ------------------------------------------------------------------ */
/* 🧠 Diff / Patch Helpers                                              */
/* ------------------------------------------------------------------ */

/**
 * Check whether a line number exists inside a unified diff patch
 * GitHub ONLY allows inline comments on such lines
 */
export function isLineInPatch(
  patch: string | null | undefined,
  targetLine: number
): boolean {
  if (!patch || !targetLine) return false;

  const lines = patch.split("\n");
  let currentLine: number | null = null;

  for (const line of lines) {
    // @@ -oldStart,oldCount +newStart,newCount @@
    if (line.startsWith("@@")) {
      const match = line.match(/\+(\d+)/);
      if (match) {
        currentLine = parseInt(match[1], 10) - 1;
      }
      continue;
    }

    if (currentLine === null) continue;

    if (line.startsWith("+")) {
      currentLine++;
      if (currentLine === targetLine) return true;
    } else if (!line.startsWith("-")) {
      currentLine++;
    }
  }

  return false;
}

/* ------------------------------------------------------------------ */
/* 💬 PR Comments                                                       */
/* ------------------------------------------------------------------ */

interface InlineCommentArgs {
  octokit: Octokit;
  owner: string;
  repo: string;
  pull_number: number;
  path: string;
  line: number;
  body: string;
  patch?: string | null;
}

/**
 * Try to post an inline review comment
 * Returns false if GitHub rejects the line
 */
export async function postInlineCommentAtLine({
  octokit,
  owner,
  repo,
  pull_number,
  path,
  line,
  body,
  patch,
}: InlineCommentArgs): Promise<boolean> {
  // 🔒 GitHub hard rules
  if (!patch) return false;
  if (!isLineInPatch(patch, line)) return false;

  try {
    await octokit.rest.pulls.createReviewComment({
      owner,
      repo,
      pull_number,
      body,
      path,
      line,
      side: "RIGHT",
    });

    console.log(`📝 Inline comment posted → ${path}:${line}`);
    return true;
  } catch (err: any) {
    console.error("❌ Inline comment failed", {
      path,
      line,
      error: err.message,
    });
    return false;
  }
}

/**
 * Post a general PR comment (always safe)
 */
export async function postReviewComment({
  octokit,
  owner,
  repo,
  pull_number,
  body,
}: {
  octokit: Octokit;
  owner: string;
  repo: string;
  pull_number: number;
  body: string;
}): Promise<void> {
  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pull_number,
    body,
  });
}
