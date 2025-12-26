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
  console.log("📦 PR diff response:", res);
  return res.data;
}



export async function postReviewComment(body) {
  console.log("📝 Posting PR comment...");
  console.log({ owner, repo, pull_number });

  const res = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: pull_number,
    body,
  });

  console.log("✅ Comment posted", res.status);
}



