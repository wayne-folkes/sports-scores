# Deploying to Vercel

[Back to README](../README.md)

This app can be deployed to Vercel with zero environment variables for scores, teams, standings and box scores — ESPN's API is fully public. Only the AI game summaries (`/api/summary`) need configuration:

| Variable | Required | Purpose |
|----------|----------|---------|
| `AWS_ROLE_ARN` | Yes, for summaries | IAM role Vercel assumes via OIDC — the `vercel_role_arn` output of `terraform/` |
| `SUMMARY_TABLE` | No | DynamoDB table (default `sports-scores-summaries`) |
| `SUMMARY_AWS_REGION` | No | AWS region (default `us-east-1`) |
| `SUMMARY_MODEL_LIVE` / `SUMMARY_MODEL_FINAL` | No | Bedrock model IDs for preview/live and final summaries |
| `ESPN_API_BASE` | No | Override the ESPN base URL (e.g. for testing) |

Without `AWS_ROLE_ARN` the AWS SDK falls back to its default credential chain (e.g. a local AWS profile). With no AWS credentials at all, `/api/summary` returns `503`, the box score modal simply omits the summary, and the rest of the app works normally.

> Use a Node.js 22.x+ runtime for builds and local Vercel CLI workflows. The frontend build now depends on the Vite 8 toolchain.

## How it works on Vercel

| Layer | Local dev | Vercel |
|-------|-----------|--------|
| Frontend | Vite dev server on port 3000 | Static site built from `client/dist` |
| API | `api/` functions via `scripts/dev-api.ts` on port 3001 | Serverless functions in `api/` |
| Caching | None (headers are set but not honored locally) | `Cache-Control` headers — Vercel Edge CDN |

The `api/` directory at the repo root contains the Vercel serverless functions — the only backend, written in TypeScript (Vercel compiles `.ts` functions natively). Locally, `scripts/dev-api.ts` serves the same handlers with Vercel-style file routing. The React client's fetch calls already use relative `/api/...` paths, so no client code changes are needed between local and production.

## Deploy

### Option 1 — Vercel dashboard (recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the `wayne-folkes/sports-scores` repository
3. Vercel auto-detects `vercel.json` and the `api/` functions
4. Click **Deploy** — no environment variables needed except `AWS_ROLE_ARN` for AI summaries (see above)

### Option 2 — Vercel CLI

```bash
npm i -g vercel
vercel --prod
```

## Local development with Vercel CLI

You can emulate the full Vercel environment locally (serverless functions + static frontend together):

```bash
npm i -g vercel
vercel dev
```

The standard local dev workflow still works too:

```bash
# Terminal 1 — api/ functions on port 3001
pnpm dev

# Terminal 2 — Vite frontend
cd client && pnpm dev
```

## API caching on Vercel

Vercel's Edge CDN caches responses using `Cache-Control` headers set by each function.

| Endpoint | `s-maxage` | `stale-while-revalidate` |
|----------|-----------|--------------------------|
| `/api/scores/:sport` | 60 s | 30 s |
| `/api/teams/:sport` | 1 hr | 5 min |
| `/api/standings/:sport` | 10 min | 5 min |
| `/api/boxscore/:sport/:eventId` | 30 s | 10 s |
| `/api/summary/:sport/:eventId` | 3 min live, 1 day otherwise | 1 min live |
| `/api/health` | no cache | — |

## Project structure

```
api/                        ← Vercel serverless functions
  _lib/
    normalize.ts            ← shared normalization helpers
    teams.ts                ← team normalization
  health.ts                 → GET /api/health
  scores/[sport].ts         → GET /api/scores/:sport
  teams/[sport].ts          → GET /api/teams/:sport
  standings/[sport].ts      → GET /api/standings/:sport
  boxscore/[sport]/
    [eventId].ts            → GET /api/boxscore/:sport/:eventId
  summary/[sport]/
    [eventId].ts            → GET /api/summary/:sport/:eventId
vercel.json                 ← build + output config
client/                     ← React / Vite SPA
scripts/dev-api.ts          ← local runner for api/ (dev only)
test/                       ← Node test suite for api/
```
