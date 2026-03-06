# API Reference

[Back to README](../README.md)

Base URL for local development: `http://localhost:3001`

## Endpoints

| Method | Path | Description | Cache |
|--------|------|-------------|-------|
| GET | `/health` | Server health check | None |
| GET | `/api/scores/nba` | Today's NBA scoreboard | 60 seconds |
| GET | `/api/scores/mlb` | Today's MLB scoreboard | 60 seconds |
| GET | `/api/teams/nba` | Full list of NBA teams | 1 hour |
| GET | `/api/teams/mlb` | Full list of MLB teams | 1 hour |
| GET | `/api/boxscore/:sport/:eventId` | Summary and box score for a live or final game | 30 seconds |

## Response Shapes

### `GET /api/scores/:sport`

Returns a normalized list of games:

```json
{
  "sport": "nba",
  "games": [
    {
      "id": "401705123",
      "status": "live",
      "statusDetail": "Q3 - 04:12",
      "startTime": "2026-03-06T00:30Z",
      "homeTeam": {
        "id": "10",
        "name": "New York Knicks",
        "shortName": "Knicks",
        "abbreviation": "NY",
        "logo": "https://...",
        "record": "42-21",
        "score": "104"
      },
      "awayTeam": {
        "id": "2",
        "name": "Boston Celtics",
        "shortName": "Celtics",
        "abbreviation": "BOS",
        "logo": "https://...",
        "record": "48-15",
        "score": "101"
      }
    }
  ]
}
```

### `GET /api/teams/:sport`

Returns a normalized list of teams used by the favorite-team picker:

```json
{
  "sport": "mlb",
  "teams": [
    {
      "id": "10",
      "name": "New York Yankees",
      "location": "New York",
      "abbreviation": "NYY",
      "logo": "https://...",
      "color": "132448"
    }
  ]
}
```

### `GET /api/boxscore/:sport/:eventId`

Returns a summary object for the modal:

```json
{
  "sport": "nba",
  "eventId": "401705123",
  "status": "final",
  "statusDetail": "Final/OT",
  "startTime": "2026-03-06T00:30Z",
  "teams": {
    "away": { "name": "Boston Celtics", "abbreviation": "BOS", "score": "111" },
    "home": { "name": "New York Knicks", "abbreviation": "NY", "score": "114" }
  },
  "statistics": [
    {
      "label": "Field Goal %",
      "away": "47.3",
      "home": "49.1"
    }
  ]
}
```

## Notes

- The server uses ESPN's public site APIs, so no API key is required.
- Box score data is pulled from ESPN's `summary` endpoint rather than the scoreboard endpoint.
- Unsupported sports or invalid event IDs return non-2xx responses from the backend.
