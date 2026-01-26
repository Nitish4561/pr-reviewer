/**
 * reviewer/index.js
 *
 * Multi-Agent PR Review System
 * Called from webhook after PR event.
 */

import { AgentOrchestrator } from "./agents/index.js";
import {
  getPullRequest,
  getPullRequestFiles,
  createReviewComment,
  createReviewSummary,
  applyLabels,
  setCommitStatus,
} from "./github.js";

/**
 * Run Multi-Agent AI PR Review
 */
export async function runPRReview({
  octokit,
  owner,
  repo,
  pull_number,
  openaiApiKey,
}) {
  if (!octokit || !owner || !repo || !pull_number) {
    throw new Error("Missing required PR review parameters");
  }

  const key = openaiApiKey || process.env.OPENAI_API_KEY;
  if (!key) throw new Error("Missing OpenAI API key");

  // 1️⃣ Fetch PR + files
  console.log(`\n${"=".repeat(70)}`);
  console.log(`🚀 MULTI-AGENT PR REVIEW SYSTEM`);
  console.log(`${"=".repeat(70)}`);
  console.log(`📍 Repository: ${owner}/${repo}`);
  console.log(`🔢 PR Number: #${pull_number}`);
  
  const pr = await getPullRequest({ octokit, owner, repo, pull_number });
  const files = await getPullRequestFiles({ octokit, owner, repo, pull_number });
  const commit_id = pr.head.sha;

  console.log(`📝 PR Title: ${pr.title}`);
  console.log(`📂 Files Changed: ${files.length}`);
  console.log(`👤 Author: ${pr.user?.login || 'unknown'}`);
  console.log(`${"=".repeat(70)}\n`);

  // 🔄 Set status to PENDING at the start
  await setCommitStatus({
    octokit,
    owner,
    repo,
    sha: commit_id,
    state: "pending",
    description: `🤖 Multi-Agent Review: Analyzing ${files.length} file(s)...`,
  });

  // 2️⃣ Run Multi-Agent Review
  const orchestrator = new AgentOrchestrator();
  
  const reviewResults = await orchestrator.runAllAgents(
    {
      pr,
      files,
      octokit,
      owner,
      repo,
      pull_number,
    },
    key
  );

  // 3️⃣ Post inline comments from agents
  console.log(`\n📝 Posting inline comments...`);
  const inlineComments = orchestrator.buildInlineComments(reviewResults.agentResults);
  
  for (const comment of inlineComments) {
    try {
      await createReviewComment({
        octokit,
        owner,
        repo,
        pull_number,
        commit_id,
        path: comment.path,
        line: comment.line,
        body: comment.body,
      });
      console.log(`   ✅ Comment posted: ${comment.path}:${comment.line}`);
    } catch (error) {
      console.error(`   ❌ Failed to post comment on ${comment.path}:${comment.line}:`, error.message);
    }
  }

  console.log(`   Total inline comments posted: ${inlineComments.length}`);

  // 4️⃣ Post comprehensive PR summary
  console.log(`\n📊 Creating multi-agent review summary...`);
  
  try {
    await createReviewSummary({
      octokit,
      owner,
      repo,
      pull_number,
      body: reviewResults.combinedMarkdown,
    });
    console.log(`   ✅ Review summary posted`);
  } catch (err) {
    console.error("   ❌ Failed to post review summary:", err.message);
    throw err;
  }

  // 5️⃣ Apply intelligent labels based on multi-agent analysis
  console.log(`\n🏷️  Applying labels...`);
  
  try {
    const { issuesFound, hasHighSeverity, riskLevel, changeType } = reviewResults.summary;
    
    await applyLabels({
      octokit,
      owner,
      repo,
      pull_number,
      hasHighSeverity,
      hasIssues: issuesFound > 0,
      // Pass additional context for smart labeling
      riskLevel,
      changeType,
    });
    
    console.log(`   ✅ Labels applied`);
  } catch (err) {
    console.error("   ❌ Failed to apply labels:", err.message);
  }

  // 6️⃣ Set final commit status based on multi-agent results
  console.log(`\n✓ Setting final commit status...`);
  
  const { issuesFound, hasHighSeverity, riskLevel } = reviewResults.summary;
  
  let statusState;
  let statusDescription;

  if (issuesFound === 0) {
    statusState = "success";
    statusDescription = `✅ All clear! (Risk: ${riskLevel})`;
  } else if (hasHighSeverity) {
    statusState = "failure";
    statusDescription = `❌ Found ${issuesFound} issue(s) including critical ones`;
  } else {
    statusState = "success";
    statusDescription = `⚠️ Found ${issuesFound} minor issue(s) (Risk: ${riskLevel})`;
  }

  await setCommitStatus({
    octokit,
    owner,
    repo,
    sha: commit_id,
    state: statusState,
    description: statusDescription,
  });

  console.log(`   Status: ${statusState.toUpperCase()}`);
  console.log(`   Description: ${statusDescription}`);

  // 7️⃣ Final summary
  console.log(`\n${"=".repeat(70)}`);
  console.log(`✅ MULTI-AGENT REVIEW COMPLETE`);
  console.log(`${"=".repeat(70)}`);
  console.log(`📊 Results Summary:`);
  console.log(`   - Issues Found: ${issuesFound}`);
  console.log(`   - High Severity: ${hasHighSeverity ? 'YES' : 'NO'}`);
  console.log(`   - Risk Level: ${riskLevel.toUpperCase()}`);
  console.log(`   - Change Type: ${reviewResults.summary.changeType}`);
  console.log(`   - Inline Comments: ${inlineComments.length}`);
  console.log(`${"=".repeat(70)}\n`);

  // 8️⃣ Return review results for database storage
  return {
    issuesFound,
    hasHighSeverity,
    prTitle: pr.title || "Untitled PR",
    riskLevel,
    changeType: reviewResults.summary.changeType,
    agentResults: reviewResults.agentResults,
  };
}
