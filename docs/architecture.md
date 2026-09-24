# Architecture

[Back to README](../README.md)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, react-grid-layout |
| Backend | Node.js 22.12+ serverless functions in `api/` (served locally by `scripts/dev-api.js`) |
| Data | ESPN public scoreboard, teams, and summary endpoints |

## Project Structure

```text
sports-scores/
├── api/                     # Vercel serverless functions (production)
│   ├── _lib/
│   │   ├── normalize.js     # Shared scoreboard/boxscore normalization
│   │   └── teams.js         # Shared team normalization
│   ├── health.js            # GET /api/health
│   ├── scores/[sport].js    # GET /api/scores/:sport
│   ├── teams/[sport].js     # GET /api/teams/:sport
│   └── boxscore/[sport]/
│       └── [eventId].js     # GET /api/boxscore/:sport/:eventId
├── scripts/
│   └── dev-api.js           # Serves api/ on port 3001 for local dev
├── test/                    # Node test suite for api/ (npm test at root)
├── client/                  # React SPA on port 3000
│   ├── src/
│   │   ├── components/
│   │   │   ├── Dashboard/   # Grid layout and widget persistence
│   │   │   ├── SportWidget/ # Score fetching, refresh, controls
│   │   │   ├── ScoreCard/   # Individual matchup cards
│   │   │   ├── TeamSelector/ # Favorite-team selection modal
│   │   │   └── BoxScoreModal/ # On-demand box score modal
│   │   └── hooks/
│   │       └── useLocalStorage.js
├── docs/
│   ├── api.md
│   ├── architecture.md
│   ├── getting-started.md
│   └── images/
└── README.md
```

## Data Flow

1. The React client requests normalized sports data from the `api/` functions (Vercel in production, `scripts/dev-api.js` locally).
2. The API fetches raw ESPN data, caches it, and converts it into shapes tailored for the UI.
3. Widgets render only the user-selected teams for each sport.
4. Opening a box score triggers a second API request to ESPN's summary endpoint for that event.

## Persistence

The app prefers browser storage for user-specific state.

| Key | Value |
|-----|-------|
| `favoriteTeams.nba` | Array of favorited NBA team IDs |
| `favoriteTeams.mlb` | Array of favorited MLB team IDs |
| `favoriteTeams.nfl` | Array of favorited NFL team IDs |
| `widgetView.<sport>` | `scores` or `standings` — the selected tab for NFL/NBA/MLB widgets |
| `widgetLayout` | Saved react-grid-layout positions and sizes |

## UX Behaviors

- The layout is responsive and adapts to the system light/dark preference.
- Widgets can be dragged and resized independently.
- Overflowing score lists scroll inside each widget instead of stretching the page.
- Final games can show overtime or extra-inning labels when ESPN includes that detail.
