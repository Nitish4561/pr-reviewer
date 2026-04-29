/**
 * GitHub helpers for NirikshanAI
 * Works with GitHub App installation tokens
 */

import { Octokit } from "@octokit/rest";

/* ----------------------------------------
   Pull Request helpers
----------------------------------------- */

export async function getPullRequest({ octokit, owner, repo, pull_number }) {
  const { data } = await octokit.pulls.get({
    owner,
    repo,
    pull_number,
  });
  return data;
}

export async function getPullRequestFiles({ octokit, owner, repo, pull_number }) {
  const { data } = await octokit.pulls.listFiles({
    owner,
    repo,
    pull_number,
    per_page: 100,
  });
  return data;
}

/* ----------------------------------------
   Inline Review Comment (IMPORTANT)
----------------------------------------- */

/**
 * Create an inline review comment
 * This is the ONLY correct way to do it
 */
export async function createReviewComment({
  octokit,
  owner,
  repo,
  pull_number,
  commit_id,
  path,
  line,
  body,
}) {
  try {
    await octokit.pulls.createReviewComment({
      owner,
      repo,
      pull_number,
      commit_id,
      path,
      line,
      side: "RIGHT", // required
      body,
    });
  } catch (err) {
    console.error("❌ Inline comment failed");
    console.error({
      owner,
      repo,
      pull_number,
      path,
      line,
      error: err.message,
    });
  }
}

/* ----------------------------------------
   Content banks — facts / quotes / stories
----------------------------------------- */

const FUN_FACTS = [
  "The first computer bug was a real insect — a moth found stuck in a relay of the Harvard Mark II in 1947. Grace Hopper's team taped it into the logbook with the note: \"First actual case of bug being found.\"",
  "The QWERTY keyboard layout was originally designed in 1873 to *slow typists down* — fast typing jammed the mechanical keys of early typewriters.",
  "The world's first programmer was Ada Lovelace, who wrote an algorithm for Charles Babbage's Analytical Engine in 1843 — a machine that was never actually built.",
  "NASA's Apollo 11 guidance computer had just 4 KB of RAM and 72 KB of storage. Your browser tab uses more memory than that just to render a favicon.",
  "The @ symbol was chosen for email addresses in 1971 because it was the only preposition available on the keyboard that wasn't already used in code.",
  "Linux, which now runs ~96% of the world's top one million servers, was started in 1991 by a 21-year-old Finnish student as a hobby project.",
  "The first website ever published is still live at: info.cern.ch — it went online on August 6, 1991.",
  "Stack Overflow was founded in 2008. Within its first month it had 1 million page views. Developers were *that* desperate for a better alternative to forums.",
  "JavaScript was written in 10 days in May 1995 by Brendan Eich. It was originally called Mocha, then LiveScript, before being renamed to JavaScript as a marketing ploy.",
  "The term \"debugging\" predates computers — engineers in the 1800s used it to describe removing insects from telegraph relays and early electrical equipment.",
  "An estimated 70% of all code ever written is now inaccessible — lost to dead startups, deleted hard drives, and bit rot.",
  "Python is named after Monty Python's Flying Circus, not the snake. Guido van Rossum was reading the show's scripts while designing the language.",
  "Git was created by Linus Torvalds in just 10 days in April 2005 after a falling-out with the BitKeeper project over licensing fees.",
  "The first emoji was created in 1999 by Shigetaka Kurita, a designer at NTT DoCoMo, for a Japanese mobile internet platform. The original set had 176 12×12 pixel images.",
];

const MOTIVATIONS = [
  "\"The best way to predict the future is to invent it.\" — Alan Kay",
  "\"Any sufficiently advanced technology is indistinguishable from magic.\" — Arthur C. Clarke",
  "\"First, solve the problem. Then, write the code.\" — John Johnson",
  "\"Code is like humor. When you have to explain it, it's bad.\" — Cory House",
  "\"The most dangerous phrase in the language is: 'We've always done it this way.'\" — Grace Hopper",
  "\"Simplicity is the soul of efficiency.\" — Austin Freeman",
  "\"In theory, there is no difference between theory and practice. In practice, there is.\" — Yogi Berra",
  "\"Make it work, make it right, make it fast.\" — Kent Beck",
  "\"The function of good software is to make the complex appear simple.\" — Grady Booch",
  "\"Walking on water and developing software from a specification are easy if both are frozen.\" — Edward V. Berard",
  "\"Every great developer you know got there by solving problems they were unqualified to solve until they did it.\" — Patrick McKenzie",
  "\"One of my most productive days was throwing away 1,000 lines of code.\" — Ken Thompson",
  "\"Measuring programming progress by lines of code is like measuring aircraft building progress by weight.\" — Bill Gates",
  "\"If debugging is the process of removing software bugs, then programming must be the process of putting them in.\" — Edsger W. Dijkstra",
];

const IT_STORIES = [
  "**The $500M Typo (2012)** — Knight Capital Group lost $440 million in 45 minutes due to a single deployment mistake: an engineer forgot to copy new code to one of their eight servers. The old, faulty trading algorithm ran on that server and bought high, sold low, 8 million times.",
  "**The Y2K Bug** — In the 1960s–70s, storage was so expensive that programmers stored years as two digits (\"99\" instead of \"1999\"). When 2000 approached, the world spent an estimated $300–600 billion fixing code to prevent systems from thinking it was 1900. Planes didn't fall. The real story: the fix worked.",
  "**The Ariane 5 Explosion (1996)** — The European Space Agency's rocket self-destructed 37 seconds after launch because of a software error: a 64-bit floating point number was converted to a 16-bit integer, causing an overflow. The rocket cost $370 million. The bug was in reused code from Ariane 4 that no one had re-validated.",
  "**The Birth of Open Source (1983)** — Richard Stallman was so frustrated that he couldn't fix a bug in his lab's printer driver (because Xerox refused to share the source code) that he launched the GNU Project and wrote the GPL license, accidentally sparking the entire open-source movement.",
  "**The Mars Climate Orbiter (1999)** — A $327 million NASA spacecraft was lost because one team used metric units (Newton-seconds) and another used imperial units (pound-force seconds) in the navigation software. Nobody checked the units matched. The probe entered Mars's atmosphere at the wrong angle and burned up.",
  "**How the Internet Survived a Mistake (2010)** — A misconfiguration by China Telecom accidentally rerouted 15% of the world's internet traffic through China for 18 minutes, including US military and government traffic. It was likely accidental, but nobody knows for sure. BGP (the protocol that routes internet traffic) still has no built-in verification.",
  "**The 500-Mile Email (2002)** — A famous sysadmin story: a user reported that email could only be sent to recipients within 500 miles. Turned out the university's mail server had a misconfigured timeout set to 3ms — just enough time for light to travel ~500 miles through fiber, but not enough for the TCP handshake to complete to farther servers.",
  "**Amazon's Accidental Outage (2017)** — An Amazon S3 engineer ran a playbook to debug a billing issue. The command was supposed to remove a \"small\" number of servers. A typo meant it removed a much larger set, taking down S3 — and with it, huge portions of the internet including Slack, Quora, and thousands of other services — for four hours.",
  "**The Therac-25 (1985–87)** — A radiation therapy machine killed at least three patients and severely injured others due to a race condition in its software. When an operator typed commands fast enough, the machine delivered radiation doses 100x the intended amount. It's one of the most cited examples of why software safety matters.",
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildWaitingContent() {
  const fact       = pickRandom(FUN_FACTS);
  const motivation = pickRandom(MOTIVATIONS);
  const story      = pickRandom(IT_STORIES);

  return [
    `<details>`,
    `<summary>💡 <strong>Fun Fact</strong> — click to read while you wait</summary>`,
    ``,
    `> ${fact}`,
    ``,
    `</details>`,
    ``,
    `<details>`,
    `<summary>✨ <strong>Motivation</strong> — click for a boost</summary>`,
    ``,
    `> ${motivation}`,
    ``,
    `</details>`,
    ``,
    `<details>`,
    `<summary>📖 <strong>IT History Story</strong> — click for a tale from the trenches</summary>`,
    ``,
    `> ${story}`,
    ``,
    `</details>`,
  ].join('\n');
}

/* ----------------------------------------
   PR-level comment (review started notice)
----------------------------------------- */

/**
 * Posts a comment letting users know NirikshanAI has started reviewing.
 * Includes three collapsible sections (fun fact / motivation / IT story)
 * so the author has something to read while waiting.
 * Non-blocking — failures are logged but never abort the review.
 */
export async function createReviewStartedComment({
  octokit,
  owner,
  repo,
  pull_number,
}) {
  console.log(`💬 Posting "review started" notice to PR #${pull_number}`);

  const waitingContent = buildWaitingContent();

  const body = [
    `## 👀 NirikshanAI is reviewing this PR...`,
    ``,
    `Hold tight — I'm analyzing the changed files and will post inline comments along with a summary shortly.`,
    ``,
    `---`,
    ``,
    `### Something to read while you wait`,
    ``,
    waitingContent,
    ``,
    `---`,
    `⚙️ Powered by **NirikshanAI**`,
  ].join('\n');

  try {
    const { data } = await octokit.issues.createComment({
      owner,
      repo,
      issue_number: pull_number,
      body,
    });
    console.log(`   ✅ "Review started" notice posted (comment id: ${data.id})`);
    return data.id;
  } catch (err) {
    console.error(`   ❌ Failed to post "review started" notice:`, err.message);
    return null;
  }
}

/* ----------------------------------------
   PR-level comment (summary)
----------------------------------------- */

export async function createReviewSummary({
  octokit,
  owner,
  repo,
  pull_number,
  body,
}) {
  console.log(`💬 Posting review summary to PR #${pull_number}`);
  console.log(`   Summary length: ${body.length} characters`);
  
  await octokit.issues.createComment({
    owner,
    repo,
    issue_number: pull_number,
    body,
  });
  
  console.log(`   ✅ Summary posted successfully`);
}

/* ----------------------------------------
   Labels (optional)
----------------------------------------- */

export async function applyLabels({
  octokit,
  owner,
  repo,
  pull_number,
  hasHighSeverity,
  hasIssues,
}) {
  console.log(`🏷️  Applying labels to PR #${pull_number}`);
  console.log(`   Has high severity: ${hasHighSeverity}`);
  console.log(`   Has issues: ${hasIssues}`);
  
  // Remove old AI labels first to avoid stale labels
  const aiLabels = ["ai-critical", "ai-reviewed", "ai-approved"];
  
  try {
    // Get current labels
    console.log(`   Fetching current labels...`);
    const { data: issue } = await octokit.issues.get({
      owner,
      repo,
      issue_number: pull_number,
    });
    
    const currentLabels = issue.labels.map(l => typeof l === 'string' ? l : l.name);
    console.log(`   Current labels: ${currentLabels.join(', ') || 'none'}`);
    
    // Remove any existing AI labels
    for (const label of issue.labels) {
      const labelName = typeof label === 'string' ? label : label.name;
      if (aiLabels.includes(labelName)) {
        console.log(`   Removing label: ${labelName}`);
        await octokit.issues.removeLabel({
          owner,
          repo,
          issue_number: pull_number,
          name: labelName,
        });
        console.log(`   ✅ Removed: ${labelName}`);
      }
    }
  } catch (err) {
    console.warn("⚠️ Could not remove old labels:", err.message);
  }

  // Determine which labels to add
  let labels;
  if (!hasIssues) {
    // No issues found - PR is approved!
    labels = ["ai-reviewed", "ai-approved"];
  } else if (hasHighSeverity) {
    // Has critical issues
    labels = ["ai-critical"];
  } else {
    // Has minor issues
    labels = ["ai-reviewed"];
  }

  console.log(`   Adding labels: ${labels.join(', ')}`);
  await octokit.issues.addLabels({
    owner,
    repo,
    issue_number: pull_number,
    labels,
  });
  console.log(`   ✅ Labels applied: ${labels.join(', ')}`);
}

/* ----------------------------------------
   Commit Status (GitHub Checks)
----------------------------------------- */

/**
 * Set commit status - this shows up in GitHub PR checks/actions tab
 */
export async function setCommitStatus({
  octokit,
  owner,
  repo,
  sha,
  state, // 'pending', 'success', 'failure', 'error'
  description,
  context = "NirikshanAI Review",
  target_url = null,
}) {
  console.log(`📊 Setting commit status: ${state} for ${sha.substring(0, 7)}`);
  console.log(`   Context: ${context}`);
  console.log(`   Description: ${description}`);
  
  try {
    await octokit.repos.createCommitStatus({
      owner,
      repo,
      sha,
      state,
      description,
      context,
      ...(target_url && { target_url }),
    });
    console.log(`   ✅ Status set to: ${state}`);
  } catch (err) {
    console.error(`   ❌ Failed to set commit status:`, err.message);
    // Don't throw - status is nice to have but shouldn't break review
  }
}
