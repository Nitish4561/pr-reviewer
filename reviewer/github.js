import { Octokit } from "@octokit/rest";

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

const owner = process.env.REPO_OWNER;
const repo = process.env.REPO_NAME;
const pull_number = Number(process.env.PR_NUMBER);

export async function getPullRequestDiff() {
  const res = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}.diff",
    {
      owner,
      repo,
      pull_number,
    }
  );

  return res.data;
}


export async function postReviewComment(body) {
  console.log("📝 Inside postReviewComment");

  console.log("ENV:", {
    owner: process.env.REPO_OWNER,
    repo: process.env.REPO_NAME,
    pr: process.env.PR_NUMBER,
    hasToken: !!process.env.GITHUB_TOKEN,
  });

  const res = await octokit.rest.issues.createComment({
    owner,
    repo,
    issue_number: Number(process.env.PR_NUMBER),
    body,
  });

  console.log("✅ GitHub API response", res.status);
}




