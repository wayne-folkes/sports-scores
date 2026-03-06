# Getting Started

[Back to README](../README.md)

## Prerequisites

- Node.js 18 or later

## Install

```bash
cd sports-scores/server && npm install
cd sports-scores/client && npm install
```

## Run Locally

Start the API and frontend in separate terminals.

```bash
# Terminal 1 — API server
cd sports-scores/server
npm run dev

# Terminal 2 — Frontend dev server
cd sports-scores/client
npm run dev
```

The app runs at:

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`

## Available Scripts

### Server (`/server`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the API server with `--watch` |
| `npm start` | Start the API server without watch mode |
| `npm test` | Run the Node built-in test suite |

### Client (`/client`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Create a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run ESLint |

## Development Notes

- The frontend proxies API requests to the backend during local development.
- Widget layout and favorite-team selections persist in the browser with `localStorage`.
- Score polling refreshes every 30 seconds and pauses while the tab is hidden.
