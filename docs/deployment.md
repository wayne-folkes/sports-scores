# Deploying to Vercel

[Back to README](../README.md)

This app can be deployed to Vercel with zero environment variables required — ESPN's API is fully public.

## How it works on Vercel

| Layer | Local dev | Vercel |
|-------|-----------|--------|
| Frontend | Vite dev server on port 3000 | Static site built from `client/dist` |
| API | Express server on port 3001 | Serverless functions in `api/` |
| Caching | In-memory Map | `Cache-Control` headers — Vercel Edge CDN |

The `api/` directory at the repo root contains Vercel serverless functions that mirror every Express route. The React client's fetch calls already use relative `/api/...` paths, so no client code changes are needed between local and production.

## Deploy

### Option 1 — Vercel dashboard (recommended)

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import the `wayne-folkes/sports-scores` repository
3. Vercel auto-detects `vercel.json` and the `api/` functions
4. Click **Deploy** — no environment variables needed

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
# Terminal 1 — Express API
cd server && npm run dev

# Terminal 2 — Vite frontend
cd client && npm run dev
```

## API caching on Vercel

Vercel's Edge CDN caches responses using `Cache-Control` headers set by each function.

| Endpoint | `s-maxage` | `stale-while-revalidate` |
|----------|-----------|--------------------------|
| `/api/scores/:sport` | 60 s | 30 s |
| `/api/teams/:sport` | 1 hr | 5 min |
| `/api/boxscore/:sport/:eventId` | 30 s | 10 s |
| `/api/health` | no cache | — |

## Project structure

```
api/                        ← Vercel serverless functions
  _lib/
    normalize.js            ← shared normalization helpers
    teams.js                ← team normalization
  health.js                 → GET /api/health
  scores/[sport].js         → GET /api/scores/:sport
  teams/[sport].js          → GET /api/teams/:sport
  boxscore/[sport]/
    [eventId].js            → GET /api/boxscore/:sport/:eventId
vercel.json                 ← build + output config
client/                     ← React / Vite SPA
server/                     ← Express server (local dev + CI tests only)
```
