---
name: repo-upgrades-cleanups
description: Helps upgrade dependencies, modernize toolchains, remove unused files, and perform safe cleanup passes in the sports-scores repo. Use when updating libraries, pruning generated artifacts, or freeing disk space.
compatibility: sports-scores monorepo
---

# Repo Upgrades & Cleanups

Use this skill when the user asks to:
- update libraries or major versions
- remove unused dependencies or files
- free disk space
- audit the repo for generated artifacts
- modernize CI, docs, or runtime requirements

## Principles

- Prefer small, reversible batches over huge all-at-once upgrades.
- Update docs and workflows whenever runtime or toolchain requirements change.
- Treat generated artifacts as disposable; never delete source code without confirmation.
- Run the full validation suite after each milestone.
- Commit and push milestone-sized changes after tests pass.

## Standard Upgrade Workflow

### 1) Audit first
Check:
- `git status --short`
- dependency drift with `npm outdated` in `client/` and `server/`
- security issues with `npm audit`
- large files / directories with `du -sh` and `find`
- runtime requirements in `README.md`, `docs/`, and CI workflows

### 2) Classify changes
Split work into:
- **Safe patch/minor bumps**: apply first
- **Major upgrades**: do separately when they change Node/runtime/tooling expectations
- **Cleanup-only changes**: generated files, caches, build outputs, editor state

### 3) Update dependencies
For this repo, the main packages live in:
- `client/package.json`
- `server/package.json`

Typical upgrade targets:
- frontend toolchain: Vite, plugin-react, ESLint, Vitest, Playwright
- server runtime: Express, native `fetch` usage
- test environment helpers: happy-dom, jsdom only if actually needed

If a package introduces a new runtime baseline, update:
- `README.md`
- `docs/getting-started.md`
- `docs/architecture.md`
- `docs/deployment.md`
- `.github/workflows/node.js.yml`
- package `engines` fields where appropriate

### 4) Clean up unused files safely
Common disposable artifacts in this repo include:
- `client/node_modules/`
- `client/dist/`
- `client/.vite/` and `client/node_modules/.vite/`
- `ios/SportsScores/SportsScoresKit/.build/`
- Xcode `xcuserdata/`
- `.DS_Store`

Only delete `.claude/worktrees/` if the user explicitly wants to remove agent session/worktree scratch space.

### 5) Validate
Run the relevant checks, then the full suite:
- `cd server && npm test`
- `cd client && npm run lint`
- `cd client && npm test`
- `cd client && npm run build`
- `cd client && npm run test:e2e`

If you changed iOS-related files, run the relevant Swift/Xcode validation too.

### 6) Document and finish
Before finishing a milestone:
- update affected docs
- make sure no stale comments remain
- commit with a descriptive message
- push the commit

## Useful commands

```bash
# dependency audit
cd client && npm outdated --json
cd server && npm outdated --json
cd client && npm audit --json

# space audit
find . -type f \( -name '.DS_Store' -o -path '*/dist/*' -o -path '*/node_modules/*' -o -path '*/.build/*' -o -path '*/xcuserdata/*' \)
du -sh client/node_modules client/dist ios/SportsScores/SportsScoresKit/.build .claude/worktrees 2>/dev/null

# cleanup
rm -rf client/dist ios/SportsScores/SportsScoresKit/.build
```

## Notes specific to this repo

- The project currently targets Node.js 20.19+ for the client toolchain.
- The server should use native `fetch` instead of `node-fetch`.
- Prefer removing unused direct dependencies rather than keeping them for transitive reasons.
- If a cleanup frees a lot of space, confirm the user is happy before deleting broader scratch areas like `.claude/worktrees/`.
