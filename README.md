# NirikshanAI (Internal Tool)

An internal tool to automatically review pull requests using OpenAI’s GPT models.  
It analyzes PR diffs, generates a structured review, posts comments, and applies labels.

---

## Features

- ✅ Automatically fetches PR diff and runs AI code review
- 📝 Posts structured PR comments:
  - Summary
  - Quality Score (1–10)
  - Should Block Merge
  - Issues with severity, description, suggestion
  - Positive notes
- 🏷 Applies labels based on review results:
  - `ai-clean` – PR looks good
  - `ai-needs-attention` – Minor issues detected
  - `ai-failed` – AI review failed
- ⚡ Handles failures gracefully with fallback review

---

## Setup

### 1. Add to your internal repo

1. Copy the `pr-reviewer/` folder into your repo.
2. Add the GitHub Actions workflow `.github/workflows/pr-review.yml`.

### 2. Configure secrets

Add the following secrets in your repository settings → **Secrets → Actions**:

| Name | Purpose |
|------|---------|
| `OPENAI_API_KEY` | OpenAI API key |
| `GITHUB_TOKEN` | Already available in GitHub Actions |
| `REPO_OWNER` | Repository owner (org or username) |
| `REPO_NAME` | Repository name |
| `PR_NUMBER` | Pull request number (set dynamically in workflow) |

### 3. Workflow triggers

The workflow triggers automatically on:

- PR opened
- PR updated (synchronize)

---

## Usage

1. Create or update a PR in the repository.
2. The GitHub Action will:

   - Fetch the PR diff
   - Run AI review
   - Post a comment in the conversation
   - Apply labels based on review results

3. Review AI comments and act accordingly.

---

## Customization (Optional)

- **File-level comments**: Modify `github.js` to add inline comments using `octokit.rest.pulls.createReviewComment`.
- **Skip rules**: Add `skip-pr` label or branch filters to avoid trivial PRs.
- **Logging**: Extend logging in `index.js` or integrate with internal dashboards.
- **Prompts**: Centralize prompts in `prompt.js` to standardize AI behavior internally.

---

## Fallback Behavior

If the AI review fails:

- Posts a fallback review:
  ```json
  {
    "summary": "AI review failed due to invalid response",
    "quality_score": 0,
    "should_block_merge": false,
    "issues": [
      {
        "severity": "low",
        "description": "AI review could not be generated",
        "suggestion": "Check workflow logs for LLM errors"
      }
    ],
    "positive_notes": []
  }
