# Getting Started

[Back to README](../README.md)

## Prerequisites

- Node.js 22.12 or later

## Install

```bash
cd sports-scores && pnpm install
```

The repo is a pnpm workspace (`pnpm-workspace.yaml`): the root holds the `api/` dependencies and `client/` is a workspace, so one install at the root covers both and there is a single `pnpm-lock.yaml`. The pnpm version is pinned in `package.json` (`packageManager`); run `corepack enable` once, or install pnpm 10, to use it.

## Run Locally

Start the API and frontend in separate terminals.

```bash
# Terminal 1 — API (serves the api/ functions on port 3001)
cd sports-scores
pnpm dev

# Terminal 2 — Frontend dev server
cd sports-scores/client
pnpm dev
```

The app runs at:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

## Available Scripts

### API (repo root)

| Script | Description |
|--------|-------------|
| `pnpm dev` | Serve the `api/` functions on port 3001, reloading on change (`scripts/dev-api.ts` via tsx) |
| `pnpm test` | Run the Node built-in test suite in `test/` (via tsx) |
| `pnpm run typecheck` | Type-check `api/`, `scripts/` and `test/` with `tsc` |

### Client (`/client`)

| Script | Description |
|--------|-------------|
| `pnpm dev` | Start the Vite dev server |
| `pnpm run build` | Create a production build in `dist/` |
| `pnpm run preview` | Preview the production build locally |
| `pnpm run lint` | Run ESLint |
| `pnpm run typecheck` | Type-check the client (including the API response types it imports) |
| `pnpm test` | Run the Vitest unit test suite |
| `pnpm run test:watch` | Run Vitest in watch mode |
| `pnpm run test:e2e` | Run the Playwright end-to-end suite |
| `pnpm run test:e2e:ui` | Open the Playwright UI runner |

## Development Notes

- The frontend proxies API requests to the backend during local development.
- Widget layout and favorite-team selections persist in the browser with `localStorage`.
- Score polling refreshes every 30 seconds and pauses while the tab is hidden.
- Client tooling now targets the Vite 8 / ESLint 10 ecosystem, so use Node.js 22.12+ locally and in CI.
- Everything is TypeScript. API response shapes live in `api/_lib/types.ts` and the client imports them, so after changing a shape, `pnpm run typecheck` (at the root and in `client/`) lists every place that needs updating.
- TypeScript is pinned to 6.0: TypeScript 7 (the native compiler) drops the JavaScript API that Vercel's function builder and typescript-eslint use.
