# Getting Started

[Back to README](../README.md)

## Prerequisites

- Node.js 22.12 or later

## Install

```bash
cd sports-scores && npm install
```

The repo is an npm workspace: the root holds the `api/` dependencies and `client/` is a workspace, so one install at the root covers both and there is a single `package-lock.json`.

## Run Locally

Start the API and frontend in separate terminals.

```bash
# Terminal 1 — API (serves the api/ functions on port 3001)
cd sports-scores
npm run dev

# Terminal 2 — Frontend dev server
cd sports-scores/client
npm run dev
```

The app runs at:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

## Available Scripts

### API (repo root)

| Script | Description |
|--------|-------------|
| `npm run dev` | Serve the `api/` functions on port 3001, reloading on change (`scripts/dev-api.ts` via tsx) |
| `npm test` | Run the Node built-in test suite in `test/` (via tsx) |
| `npm run typecheck` | Type-check `api/`, `scripts/` and `test/` with `tsc` |

### Client (`/client`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |
| `npm test` | Run the Vitest unit test suite |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:e2e` | Run the Playwright end-to-end suite |
| `npm run test:e2e:ui` | Open the Playwright UI runner |

## Development Notes

- The frontend proxies API requests to the backend during local development.
- Widget layout and favorite-team selections persist in the browser with `localStorage`.
- Score polling refreshes every 30 seconds and pauses while the tab is hidden.
- Client tooling now targets the Vite 8 / ESLint 10 ecosystem, so use Node.js 22.12+ locally and in CI.
