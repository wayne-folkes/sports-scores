# Sports Scores

> A local web app for tracking live NBA and MLB scores.

## Features

- **Live & scheduled scores** — NBA and MLB games via ESPN's public API (no key required)
- **Draggable, resizable widgets** — powered by react-grid-layout; arrange the board however you like
- **Favorite teams** — pin preferred teams per sport; selections persist across sessions
- **Auto-refresh** — scores update every 30 seconds; pauses automatically when the browser tab is hidden (Page Visibility API)
- **Light / dark theme** — adapts to your system color scheme via CSS `prefers-color-scheme`
- **Persistent layout** — widget positions are saved to localStorage and restored on reload
- **Box scores** — open live/final games to view a team-vs-team stat breakdown from ESPN's summary endpoint

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, react-grid-layout |
| Backend | Node.js, Express, node-fetch |
| Data | ESPN public scoreboard & teams API (no auth needed) |

---

## Project Structure

```
sports-scores/
├── server/                  # Node.js / Express API (port 3001)
│   ├── index.js             # App entry point
│   ├── middleware/
│   │   └── cache.js         # In-memory TTL cache (60 s scores, 1 hr teams)
│   ├── routes/
│   │   ├── scores.js        # /api/scores/:sport
│   │   ├── teams.js         # /api/teams/:sport
│   │   ├── boxscore.js      # /api/boxscore/:sport/:eventId
│   │   └── normalize.js     # ESPN response → app shape
│   └── test.js              # Node built-in test runner
├── client/                  # React / Vite SPA (port 3000)
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx
│   │   ├── index.css        # CSS custom properties, light/dark theme
│   │   ├── components/
│   │   │   ├── Dashboard/   # react-grid-layout grid, layout persistence
│   │   │   ├── SportWidget/ # Per-sport widget, fetch + auto-refresh logic
│   │   │   ├── ScoreCard/   # Individual game card (live / final / scheduled)
│   │   │   ├── TeamSelector/ # Favorite-team modal with search
│   │   │   └── BoxScoreModal/ # On-demand game box score modal
│   │   └── hooks/
│   │       └── useLocalStorage.js
│   └── package.json
├── README.md
└── agents.md
```

---

## Getting Started

### Prerequisites

- Node.js 18 or later

### Install

```bash
# Install server dependencies
cd sports-scores/server && npm install

# Install client dependencies
cd sports-scores/client && npm install
```

### Run (two terminal tabs)

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

## Available Scripts

### Server (`/server`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start server with `--watch` (auto-restarts on file changes) |
| `npm start` | Start server (production) |
| `npm test` | Run unit tests with Node's built-in test runner |

### Client (`/client`)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start Vite dev server on port 3000 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Run ESLint |

---

## localStorage Keys

| Key | Value |
|-----|-------|
| `favoriteTeams.nba` | Array of favorited NBA team IDs |
| `favoriteTeams.mlb` | Array of favorited MLB team IDs |
| `widgetLayout` | Widget grid layout positions (react-grid-layout format) |

---

## API Endpoints

All endpoints are served from `http://localhost:3001`.

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Server health check |
| GET | `/api/scores/nba` | Today's NBA scoreboard (cached 60 s) |
| GET | `/api/scores/mlb` | Today's MLB scoreboard (cached 60 s) |
| GET | `/api/teams/nba` | Full list of NBA teams (cached 1 hr) |
| GET | `/api/teams/mlb` | Full list of MLB teams (cached 1 hr) |
| GET | `/api/boxscore/:sport/:eventId` | ESPN summary/box score for a live or final game (cached 30 s) |
