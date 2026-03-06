# Architecture

[Back to README](../README.md)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, react-grid-layout |
| Backend | Node.js, Express, node-fetch |
| Data | ESPN public scoreboard, teams, and summary endpoints |

## Project Structure

```text
sports-scores/
├── server/                  # Express API on port 3001
│   ├── index.js             # App entry point
│   ├── middleware/
│   │   └── cache.js         # In-memory TTL cache
│   ├── routes/
│   │   ├── scores.js        # /api/scores/:sport
│   │   ├── teams.js         # /api/teams/:sport
│   │   ├── boxscore.js      # /api/boxscore/:sport/:eventId
│   │   └── normalize.js     # ESPN payload normalization
│   └── test.js              # Route and normalization tests
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

1. The React client requests normalized sports data from the local Express API.
2. The API fetches raw ESPN data, caches it, and converts it into shapes tailored for the UI.
3. Widgets render only the user-selected teams for each sport.
4. Opening a box score triggers a second API request to ESPN's summary endpoint for that event.

## Persistence

The app prefers browser storage for user-specific state.

| Key | Value |
|-----|-------|
| `favoriteTeams.nba` | Array of favorited NBA team IDs |
| `favoriteTeams.mlb` | Array of favorited MLB team IDs |
| `widgetLayout` | Saved react-grid-layout positions and sizes |

## UX Behaviors

- The layout is responsive and adapts to the system light/dark preference.
- Widgets can be dragged and resized independently.
- Overflowing score lists scroll inside each widget instead of stretching the page.
- Final games can show overtime or extra-inning labels when ESPN includes that detail.
