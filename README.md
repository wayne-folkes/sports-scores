# Sports Scores

> A web app for tracking live NBA, MLB and NFL scores — [live at sports-scores-silk.vercel.app](https://sports-scores-silk.vercel.app)

![Sports Scores dashboard showing Yankees and Knicks score cards](./docs/images/app-screenshot.png)

## Features

- **Live & scheduled scores** — NBA, MLB and NFL games via ESPN's public API (no key required)
- **NFL game situation** — live NFL cards show quarter/clock, down & distance, a 🏈 possession marker, and a red-zone highlight
- **League standings** — NFL, NBA and MLB widgets have a Scores | Standings toggle; favorite teams are highlighted
- **Draggable, resizable widgets** — powered by react-grid-layout; arrange the board however you like
- **Favorite teams** — pin preferred teams per sport; selections persist across sessions
- **Auto-refresh** — scores update every 30 seconds; pauses automatically when the browser tab is hidden (Page Visibility API)
- **Light / dark theme** — adapts to your system color scheme via CSS `prefers-color-scheme`
- **Persistent layout** — widget positions are saved to localStorage and restored on reload
- **Box scores** — open live/final games to view a team-vs-team stat breakdown from ESPN's summary endpoint (NFL adds passing, rushing and receiving leaders)

---

## Quick Start

- Prerequisite: **Node.js 22.12+**
- Install dependencies:

```bash
cd sports-scores/server && npm install

cd sports-scores/client && npm install
```

- Run the API and client in separate terminals:

```bash
# Terminal 1 — API server
cd sports-scores/server
npm run dev

# Terminal 2 — Frontend dev server
cd sports-scores/client
npm run dev
```

Open **http://localhost:3000** in your browser.

---

## Documentation

- [Getting Started](./docs/getting-started.md) — prerequisites, install steps, scripts, and local development workflow
- [Architecture](./docs/architecture.md) — stack overview, project structure, data flow, and persistence details
- [API Reference](./docs/api.md) — backend endpoints and normalized response shapes
- [Deployment](./docs/deployment.md) — deploying to Vercel (zero config required)
