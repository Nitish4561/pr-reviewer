# 🤖 AI PR Reviewer (Internal)

Automated AI-based pull request reviews using GitHub Actions.

## Features
- PR-level AI review comment
- File-level comments for actionable issues
- Automatic PR labels
- Skip rules to reduce noise
- Safe fallback when AI fails

## Skip rules
Add to PR title:
- [skip ai]
- [no ai]
- [wip]

Ignored files:
- dist/, build/
- *.lock
- *.md

## Labels
- ai-clean
- ai-needs-attention
- ai-failed

## Scope
Internal engineering productivity tool.
Non-blocking by design.
