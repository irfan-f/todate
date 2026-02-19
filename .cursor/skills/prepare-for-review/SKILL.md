---
name: prepare-for-review
description: Run deslop then rework-commit-history to clean the branch before review. Use when work on a branch is done and the user wants to prepare for review, run review-changes, or get the branch ready for human review.
---

# Prepare for review

Use when the user has **finished work on a branch** and wants to **prepare for review**. (Work should have been started on a branch per the **branch-first** rule.) (e.g. before running review-changes or before a human reviews). Run the following in order so the branch is clean and the history is reviewable.

## Order of operations

1. **Deslop**  
   Run the **deslop** skill: check the diff against main and remove AI-generated slop (unnecessary comments, defensive checks, `any` casts used to bypass types, overly nested code, etc.). Keep behavior unchanged; prefer minimal edits.  
   This cleans the code before you lock it into commits.

2. **Rework commit history**  
   Run the **rework-commit-history** skill: rework current changes (or messy commits) into small, semantic commits with clear messages. Reset to base, replay changes in a logical sequence, validate no diff is lost, and report the new commit list.  
   This gives reviewers a commit-by-commit history instead of one large diff.

3. **Ready for review**  
   After both steps, the branch is ready for the user to run review-changes or to hand off for human review.

## When to run

- User says they’re done with the work and want to prepare for review.
- User is about to run review-changes and wants a clean branch and history first.
- User asks to “clean up before review” or “make this ready for review.”

## Summary

- Run **deslop** first (clean the diff).
- Then run **rework-commit-history** (clean the commits).
- Then the user can review.
