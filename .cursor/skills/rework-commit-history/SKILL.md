---
name: rework-commit-history
description: Rework current changes or messy commits into small, semantic commits with clear messages. Resets to base (e.g. main), replays changes in a logical sequence, and validates no diff is lost. Use when the user asks to clean up commit history, rework commits into reviewable pieces, squash or split into semantic commits, or "make my commits reviewable."
---

# Rework commit history into semantic commits

Use when the user asks to **rework**, **clean up**, or **reorganize** their commit history into small, reviewable commits with clear descriptions. Do not run automatically—only when the user explicitly requests it. When preparing a branch for review, the **prepare-for-review** skill runs **deslop** first (to remove AI slop from the diff), then this skill, so both work together.

## Principle

- Each commit = one logical change.
- A reviewer can step through the history commit-by-commit instead of parsing one large diff.
- The agent resets to the base branch, replays all changes in a planned order, and **validates that the final diff matches the original** so nothing is lost.

## Workflow

### 1. Confirm scope and base

- Ask or infer: **base branch** (default `main`; allow `master` or other if the repo uses it).
- Determine what to rework:
  - **Uncommitted changes only:** working tree + index.
  - **Current branch vs base:** all commits on current branch that are not on base.
  - **Mixed:** uncommitted + recent commits; treat as “all changes since base.”
- If there are no changes or no divergence from base, say so and stop.

### 2. Capture the “before” state

- **Save the full diff** that represents “all changes we must preserve”:
  - If reworking uncommitted: `git diff` (and optionally `git diff --cached`) or equivalent.
  - If reworking commits: diff of current branch vs base, e.g. `git diff main..HEAD` (or `main...HEAD` if you prefer three-dot).
- Store or summarize this (e.g. `git diff main..HEAD > /tmp/full-diff.patch` or equivalent) so you can compare later. You must be able to confirm “final tree has the same changes.”

### 3. Plan the commit sequence

- Read through the changed files and hunks.
- Group changes into **logical units** (e.g. “add API client,” “add auth hook,” “wire Login to auth,” “tests,” “lint/config”).
- Order so that each commit is self-contained and reviewable (e.g. types before usage, core before UI).
- Write a **short list**: commit 1 message, commit 2 message, … and which files/hunks (or patches) belong to each. Commit messages should be **clear and descriptive** (e.g. `feat(auth): add useAuth hook and login redirect`, not “WIP” or “fix stuff”).

### 4. Reset and replay

- **Reset to base** so the branch matches base and you can replay cleanly:
  - If only uncommitted: e.g. create a backup branch or stash, then reset working tree/index to base (or leave branch on base).
  - If reworking commits: e.g. `git reset --hard main` (or the chosen base) so current branch = base.
- **Replay changes** in the planned order:
  - For each logical commit in your plan: apply only the changes for that step (e.g. checkout specific files from a backup branch, or apply a patch subset), stage them, then commit with the chosen message.
  - Proceed one commit at a time so the history stays clean and matches the plan.

### 5. Validate

- **Compare the final state to the saved “before” diff.**
  - After all commits: `git diff main..HEAD` (or same base you used) should match the saved full diff (no missing or extra changes). Ignore whitespace if the project does.
  - If anything is missing or different, report it and fix (e.g. add a missing commit or adjust a patch) before finishing.
- Only tell the user “done” when the final diff matches and the new history is the one you intended.

### 6. Report to the user

- List the new commits (message + optional one-line “what’s in it”).
- Confirm that validation passed (final diff matches original; no changes lost).

## Commit message style

- **Small, semantic commits:** one logical change per commit.
- **Clear descriptions:** a human can understand what changed and why from the message and the diff.
- Prefer conventional style if the project uses it (e.g. `feat(scope): description`, `fix(scope): description`); otherwise use short, imperative sentences.

## Safety and edge cases

- **Uncommitted work:** Use a backup branch or stash before resetting so the full change set is never lost.
- **Merge commits / complex history:** Prefer reworking “all changes since base” as a single diff, then replaying as new commits, unless the user explicitly wants to preserve specific merge structure.
- **Large change set:** Plan in clear groups (e.g. by feature or layer) so the agent and the user can reason about each commit.
- If the user has specified a base branch or “don’t touch X,” respect that and document it in the plan.

## Summary checklist

- [ ] Base branch and “before” diff are defined and saved.
- [ ] Commit plan is logical and messages are clear.
- [ ] Reset to base, then replay commits in order.
- [ ] Final diff vs base matches saved diff (validation).
- [ ] User is told the new commit list and that validation passed.
