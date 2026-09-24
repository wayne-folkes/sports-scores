# Architecture

[Back to README](../README.md)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, react-grid-layout, TanStack Query |
| Backend | Node.js 22.12+ serverless functions in `api/` (served locally by `scripts/dev-api.js`) |
| Data | ESPN public scoreboard, teams, standings, and summary endpoints |
| AI summaries | Amazon Bedrock, cached in DynamoDB; AWS reached from Vercel via OIDC |
| Infrastructure | Terraform (AWS), Vercel (hosting) |

## Project Structure

```text
sports-scores/
├── api/                     # Vercel serverless functions (production)
│   ├── _lib/
│   │   ├── config.js        # ESPN base URL and summary endpoints
│   │   ├── fetchWithTimeout.js
│   │   ├── normalize.js     # Scoreboard/boxscore normalization
│   │   ├── football.js      # NFL situation and player-stat normalization
│   │   ├── teams.js         # Team normalization
│   │   ├── standings.js     # Standings normalization
│   │   ├── summarize.js     # Bedrock prompt + model selection
│   │   ├── summaryHandler.js # Summary cache/lock/generate flow
│   │   └── summaryStore.js  # DynamoDB cache access
│   ├── health.js            # GET /api/health
│   ├── scores/[sport].js    # GET /api/scores/:sport
│   ├── teams/[sport].js     # GET /api/teams/:sport
│   ├── standings/[sport].js # GET /api/standings/:sport
│   ├── boxscore/[sport]/
│   │   └── [eventId].js     # GET /api/boxscore/:sport/:eventId
│   └── summary/[sport]/
│       └── [eventId].js     # GET /api/summary/:sport/:eventId
├── scripts/
│   └── dev-api.js           # Serves api/ on port 3001 for local dev
├── test/                    # Node test suite for api/ (npm test at root)
├── client/                  # React SPA on port 3000 (npm workspace)
│   └── src/
│       ├── api/queries.js      # TanStack Query hooks: one cache, polling, dedupe
│       ├── components/
│       │   ├── Dashboard/      # Grid layout and widget persistence
│       │   ├── SportWidget/    # Score fetching, refresh, Scores | Standings toggle
│       │   ├── ScoreCard/      # Individual matchup cards
│       │   ├── StandingsTable/ # League standings view
│       │   ├── TeamSelector/   # Favorite-team selection modal
│       │   ├── BoxScoreModal/  # Box score + AI summary modal
│       │   └── WireBulletin/   # "The Wire" theme bulletins
│       ├── hooks/              # useLocalStorage, usePrevious, useRelativeTime
│       └── utils/              # colors, gameStatus, generateHeadline
├── terraform/               # AWS: DynamoDB, IAM/OIDC roles, Bedrock budget cutoff
├── ios/                     # Native SwiftUI app, widgets, watchOS
├── docs/
│   ├── api.md
│   ├── architecture.md
│   ├── deployment.md
│   ├── getting-started.md
│   ├── improvements.md
│   └── images/
└── README.md
```

## Data Flow

1. The React client requests normalized sports data from the `api/` functions (Vercel in production, `scripts/dev-api.js` locally) through the TanStack Query hooks in `client/src/api/queries.js`. Components asking for the same data share one request and one cached response; scores poll every 30 s (live box scores too), polling pauses while the tab is hidden, and data refetches when the tab becomes visible.
2. The API fetches raw ESPN data and converts it into shapes tailored for the UI; Vercel's CDN caches responses per the `Cache-Control` headers.
3. Widgets render only the user-selected teams for each sport.
4. Opening a box score triggers a second API request to ESPN's summary endpoint for that event.
5. The box score modal also requests `/api/summary`, which returns a Bedrock-generated write-up, cached in DynamoDB per game state.

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
