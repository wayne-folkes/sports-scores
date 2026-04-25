---
name: space-cleanup
description: Finds and safely removes generated files, caches, build outputs, and editor artifacts in the sports-scores repo to free disk space. Use when the user wants to reclaim space without changing source code.
compatibility: sports-scores monorepo
---

# Space Cleanup

Use this skill when the user wants to free up disk space in the repo without making functional changes.

## Safe targets

These are typically safe to remove because they regenerate automatically:

- `client/node_modules/`
- `client/dist/`
- `client/node_modules/.vite/`
- `client/.vite/`
- `ios/SportsScores/SportsScoresKit/.build/`
- `ios/SportsScores/SportsScores.xcodeproj/xcuserdata/`
- `ios/SportsScores/SportsScores.xcodeproj/project.xcworkspace/xcuserdata/`
- `.DS_Store`
- temporary test output like `client/playwright-report/` and `client/test-results/`

## Caution

- Do **not** delete `.claude/worktrees/` unless the user explicitly approves removing agent scratch workspaces.
- Do **not** delete source files, checked-in docs, or lockfiles without confirmation.
- If a directory is not obviously generated, inspect it first before removing anything.

## Workflow

### 1) Measure first
Use these commands to identify the largest space users:

```bash
du -sh client/node_modules client/dist ios/SportsScores/SportsScoresKit/.build .claude/worktrees 2>/dev/null
find . -type f -size +1M -not -path '*/.git/*' | sort
```

### 2) Remove only generated output
Prefer `rm -rf` only for known disposable directories.

```bash
rm -rf client/node_modules client/dist client/node_modules/.vite client/.vite
rm -rf ios/SportsScores/SportsScoresKit/.build
rm -rf ios/SportsScores/SportsScores.xcodeproj/xcuserdata
rm -rf ios/SportsScores/SportsScores.xcodeproj/project.xcworkspace/xcuserdata
rm -rf client/playwright-report client/test-results
find . -name '.DS_Store' -type f -delete
```

### 3) Confirm what remains
After cleanup, re-check disk usage and git status:

```bash
du -sh client/node_modules client/dist ios/SportsScores/SportsScoresKit/.build .claude/worktrees 2>/dev/null
git status --short
```

## Notes

- If the user only wants quick space savings, start with the largest generated caches first.
- If the cleanup is part of a larger upgrade milestone, pair it with the upgrade/cleanup workflow skill.
