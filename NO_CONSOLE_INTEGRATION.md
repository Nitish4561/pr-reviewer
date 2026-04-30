# No Console Statements — Integration Guide

## Overview

Two layers of enforcement were added to prevent `console.*` statements from being pushed into the codebase:

1. **Pre-commit hook** (local, on the developer's machine) — blocks the commit before it even reaches GitHub
2. **GitHub Actions workflow** (server-side, on every PR) — blocks the PR from being merged on GitHub

---

## Layer 1: Pre-commit Hook (Husky + lint-staged)

### How it works

Every time a developer runs `git commit`, Husky intercepts it and runs `lint-staged`. lint-staged runs ESLint only on the files that are **staged for commit**. If any staged file contains a `console.*` statement, the commit is rejected and the developer sees the exact line number.

### Files involved

**`.husky/pre-commit`**
```sh
npx lint-staged
```

**`package.json`** — lint-staged config and scripts
```json
"scripts": {
  "lint": "eslint . --ext .js,.ts,.jsx,.tsx",
  "prepare": "husky"
},
"lint-staged": {
  "*.{js,jsx,ts,tsx}": [
    "eslint --config eslint.no-console.config.js --max-warnings 0"
  ]
}
```

**`eslint.no-console.config.js`** — focused config used only by the pre-commit hook. Runs **only** the `no-console` rule, nothing else, to avoid failing on unrelated pre-existing issues.

```js
// Covers: JS/JSX and TS/TSX files across the entire repo
// Ignores: node_modules, .next, *.config.js, *.config.ts
// Rule enforced: no-console → error
```

### New dev dependencies installed

| Package | Purpose |
|---|---|
| `eslint` | Linter engine |
| `husky` | Git hook manager |
| `lint-staged` | Run linters only on staged files |
| `@eslint/js` | Recommended rules for ESLint flat config |
| `@typescript-eslint/parser` | Parse TypeScript files in ESLint |
| `@typescript-eslint/eslint-plugin` | TypeScript-specific lint rules |
| `globals` | Environment globals (browser, node, es2021) for flat config |

### Activation requirement

The `prepare` script runs `husky` automatically on `npm install`. Any developer who runs `npm install` after this setup is merged will have the hook active. No manual step needed.

---

## Layer 2: GitHub Actions Workflow

### How it works

When a PR is opened or updated against `main` or `master`, the workflow:
1. Checks out the code with full history (`fetch-depth: 0`)
2. Diffs the PR branch against the base branch
3. Greps **only newly added lines** (lines starting with `+`) for any `console.*` call
4. Fails the check if any are found — blocking the PR from merging

### File: `.github/workflows/no-console.yml`

```yaml
name: No Console Statements

on:
  pull_request:
    branches:
      - main
      - master

jobs:
  no-console:
    name: Check for console statements
    runs-on: ubuntu-latest

    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Check for new console statements in PR diff
        run: |
          git fetch origin ${{ github.base_ref }}

          CONSOLE_LINES=$(git diff origin/${{ github.base_ref }}...HEAD \
            -- '*.js' '*.ts' '*.jsx' '*.tsx' \
            ':(exclude)*.config.js' \
            ':(exclude)*.config.ts' \
            | grep '^+' | grep -v '^+++' \
            | grep -E 'console\.(log|warn|error|debug|info|table|trace|dir)' || true)

          if [ -n "$CONSOLE_LINES" ]; then
            echo ""
            echo "❌ Console statements found in this PR — please remove them before merging:"
            echo ""
            echo "$CONSOLE_LINES"
            exit 1
          fi

          echo "✅ No console statements found in PR changes"
```

### Key design decision — diff-based grep, not full ESLint

The workflow does NOT run ESLint across all files. It greps only the diff. This means:
- **Existing** console statements in old code do not cause failures
- Only **new** console statements introduced in the PR are caught
- No `npm install` needed in CI — the check runs in seconds

---

## What is covered

| Directory / File type | Pre-commit hook | GitHub Action |
|---|---|---|
| `app/**/*.{ts,tsx,js}` | Yes | Yes |
| `components/**/*.{ts,tsx}` | Yes | Yes |
| `lib/**/*.{ts,tsx}` | Yes | Yes |
| `reviewer/**/*.js` | Yes | Yes |
| `*.config.js` / `*.config.ts` | No — excluded | No — excluded |
| `node_modules/`, `.next/` | No — excluded | No — excluded |

## Console methods blocked

| Method |
|---|
| `console.log` |
| `console.warn` |
| `console.error` |
| `console.debug` |
| `console.info` |
| `console.table` |
| `console.trace` |
| `console.dir` |

---

## Also added: Full ESLint config (`eslint.config.js`)

A project-wide ESLint flat config was created (separate from the pre-commit focused config). This is used when running `npm run lint` manually and enforces `no-console: error` plus full TypeScript recommended rules across all JS/TS files.

---

## How to make the GitHub check required (block merges)

To ensure PRs literally cannot be merged if the check fails:

1. Go to your GitHub repo → **Settings** → **Branches**
2. Click **Edit** on your `main` / `master` branch protection rule (or create one)
3. Enable **Require status checks to pass before merging**
4. Search for and add **`Check for console statements`**
5. Save

Once set, GitHub will block the merge button until this check passes.

---

## Troubleshooting

**Pre-commit hook is not running**
- Run `npm install` to trigger the `prepare` script which installs Husky
- Verify `.husky/pre-commit` exists in the repo

**GitHub Action is not appearing in checks**
- Push a commit to the PR branch to re-trigger workflows
- Ensure the workflow file is on the base branch (`main`/`master`), not just the feature branch

**A console statement was missed**
- Confirm the file extension is `.js`, `.ts`, `.jsx`, or `.tsx`
- Confirm the line was a newly added line (starts with `+` in the diff)
- Config files (`*.config.js`) are intentionally excluded
