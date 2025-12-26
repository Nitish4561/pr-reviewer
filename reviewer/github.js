import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const owner = process.env.REPO_OWNER;
const repo = process.env.REPO_NAME;
const pull_number = Number(process.env.PR_NUMBER);

export async function getPullRequestDiff() {
  const res = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}",
    {
      owner,
      repo,
      pull_number,
      headers: { accept: "application/vnd.github.v3.diff" },
    }
  );

  return res.data;
}

export async function postReviewComment(body) {
  await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pull_number,
    body,
  });
}

/**
 * Apply AI-based labels to the PR
 */
export async function applyLabels(labels) {
  if (!labels || labels.length === 0) return;

  console.log("🏷️ Applying labels:", labels);

  await octokit.rest.issues.addLabels({
    owner,
    repo,
    issue_number: pull_number,
    labels,
  });
}
