---
name: code-review
description: Reviews code changes on the current branch by comparing git diffs against a target branch. Use when reviewing pull requests or validating changes before merging. Applies backend and frontend rule validation, and generates structured review reports with findings and approval status.
---

# Code Review

This skill performs code reviews by analyzing git diffs and applying the rules defined in `references/backend-rules.md` and `references/frontend-rules.md`.

## Quick Start

The skill will automatically:
1. Compare the current branch against a target branch (main by default)
2. Analyze code changes
3. Generate a structured review report

## Usage

When the user asks to review changes, optionally specify a target branch:
- "Review my changes" (compares against main)
- "Review changes against develop branch"

## Review Process

### 1. Get the diff
Compare current branch against target branch (default: main):
```bash
git --no-pager diff target-branch...HEAD
```

### 2. Apply backend rules
Read the backend-specific rules from `references/backend-rules.md` and validate the current branch changes compared to the rules.

### 3. Apply frontend rules
Read the frontend-specific rules from `references/frontend-rules.md` and validate the current branch changes compared to the rules.

## Output format

Structure your review as follows:

```
# Backend Code Review

## Summary
Brief overview of changes and overall assessment.

## Changed files (<N> files)
File names grouped by stack (backend/frontend)

## Key Findings
Results under a table format. Short notes, possible fixes.
| # | Check | Result | Notes/Recommendations |
|---|-------|--------|-------|
| 1 | <Title> | ✅ / ⚠️ / ❌ | … |


## Approval Status
- ✅ Approved (no issues found)
- ⚠️ Approved with suggestions (minor issues)
- ❌ Changes requested (blocking issues)
```

## Error Handling

### 1. No diff found
If `git diff target-branch...HEAD` returns empty output, inform the user that there are no changes to review.

### 2. Target branch does not exist
If the git diff command fails because the target branch is not found, list available branches with `git branch -a` and ask the user to specify a valid target branch.
