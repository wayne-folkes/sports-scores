# iOS App Implementation Plan — SportsScores

## Context
Build a native iOS app with full feature parity to the web app at `https://sports-scores-silk.vercel.app`, plus iOS-specific enhancements: home screen widgets, watchOS companion, Live Activities, and haptic feedback. Consumes the same deployed Vercel API endpoints.

## Architecture
- **Pattern**: MVVM + `@Observable` (targeting iOS 26)
- **Concurrency**: Swift Concurrency (async/await, actors)
- **UI**: SwiftUI with Liquid Glass materials
- **Dependencies**: Zero third-party — all Apple frameworks
- **Shared code**: `SportsScoresKit` local Swift Package shared across app, widgets, and watchOS
- **Persistence**: SwiftData + App Groups for cross-target favorites

## API Endpoints
Base URL: `https://sports-scores-silk.vercel.app`

| Endpoint | Returns |
|----------|---------|
| `/api/scores/{sport}` | Games list with scores, status, teams, records |
| `/api/teams/{sport}` | Team list for favorites selection |
| `/api/boxscore/{sport}/{eventId}` | Detailed box score with player stats |

Sports: `nba`, `mlb`, `mens-college-basketball`, `womens-college-basketball`, `college-baseball`, `college-softball`

---

## Phase 1: Foundation (~10 files)
**SportsScoresKit package + Xcode project setup**

- [x] Create Xcode project with app, widget, and watchOS targets
- [x] Create `SportsScoresKit` Swift Package with `Package.swift`
- [x] `Sport.swift` — Enum with raw values matching API keys, display names, accent colors
- [x] `Game.swift` — Codable structs for `/api/scores` response (Game, Team, Score, Status)
- [x] `BoxScore.swift` — Codable structs for `/api/boxscore` response (BoxScore, PlayerStats, TeamStats)
- [x] `TeamInfo.swift` — Codable struct for `/api/teams` response
- [x] `APIClient.swift` — Generic async/await URLSession client with error handling
- [x] `Endpoints.swift` — URL construction for all API routes
- [x] `FavoritesStore.swift` — SwiftData model + App Group container
- [x] `AppGroup.swift` — Shared container ID constant
- [x] **Tests**: Unit tests for JSON decoding (all model types against sample API responses)
- [x] **Tests**: Unit tests for URL construction in Endpoints
- [x] **Tests**: Mock-based tests for APIClient error handling
- [x] Run tests, verify all pass
- [x] Commit

## Phase 2: Scores Tab (~8 files)
**Main scores list — core app experience**

- [x] `SportsScoresApp.swift` — Entry point with TabView (Scores, Favorites, Settings)
- [x] `ScoresViewModel.swift` — @Observable, concurrent fetching with TaskGroup, 30s polling, scenePhase pause
- [x] `ScoresTab.swift` — Sport filter pills + game list
- [x] `SportPicker.swift` — Horizontal ScrollView of toggleable sport chips
- [x] `GameRow.swift` — Score card (team logos, names, scores, status, records)
- [x] `StatusBadge.swift` — Live (pulsing red), Final (gray), Scheduled (green)
- [x] `TeamLogo.swift` — AsyncImage with placeholder and disk cache
- [x] `SportAccent.swift` — Color extension mapping Sport → accent Color
- [x] **Tests**: ScoresViewModel unit tests (mock APIClient, verify polling, sport filtering)
- [x] **Tests**: Snapshot/preview tests for GameRow, StatusBadge, SportPicker
- [x] Run tests, verify all pass
- [x] Commit

## Phase 3: Box Score Detail (~4 files)
**Tapping a game → full box score view**

- [x] `BoxScoreViewModel.swift` — Fetches box score, 30s polling for live games
- [x] `BoxScoreView.swift` — Score header, linescore, team stats, player stats
- [x] `PlayerStatsTable.swift` — Reusable: NBA (PTS/REB/AST/FG/3PT/FT/MIN), MLB batting + pitching
- [x] `LinescoreView.swift` — Horizontal grid of period/inning scores
- [x] **Tests**: BoxScoreViewModel unit tests (mock data, polling lifecycle)
- [x] **Tests**: PlayerStatsTable rendering tests for NBA vs MLB data shapes
- [x] Run tests, verify all pass
- [x] Commit

## Phase 4: Favorites & Settings (~4 files)
**Team favorites and app preferences**

- [x] `FavoritesTab.swift` — Filtered view of games involving favorite teams
- [x] `TeamSelector.swift` — Sheet with sport-grouped team list, search, toggle
- [x] `SettingsTab.swift` — Refresh interval, enabled sports, about section
- [x] Wire SwiftData favorites to filter ScoresViewModel output
- [x] **Tests**: FavoritesStore persistence tests (add/remove/persist across launches)
- [x] **Tests**: TeamSelector search filtering tests
- [x] Run tests, verify all pass
- [x] Commit

## Phase 5: iOS-Specific Features (~4 files)
**Haptics, Live Activities**

- [x] `HapticManager.swift` — Score change detection, impact feedback (light/medium/heavy)
- [x] `LiveActivityAttributes.swift` — ActivityAttributes with teams, scores, status, period
- [x] `SportsScoresLiveActivity.swift` — Lock screen / Dynamic Island UI, start/update/end lifecycle
- [x] Integrate haptics into ScoresViewModel score change detection
- [x] **Tests**: HapticManager unit tests (score change detection logic)
- [x] **Tests**: LiveActivity attributes encoding/decoding tests
- [x] Run tests, verify all pass
- [x] Commit

## Phase 6: Home Screen Widgets (~3 files)
**WidgetKit extension**

- [x] `WidgetTimelineProvider.swift` — TimelineProvider with 5-15 min refresh, favorite team filtering
- [x] `ScoresWidget.swift` — Small (single game), Medium (2-3 games), Large (full sport)
- [x] `SportsScoresWidgets.swift` — Widget bundle registration
- [x] **Tests**: TimelineProvider unit tests (timeline generation, refresh intervals)
- [x] Run tests, verify all pass
- [x] Commit

## Phase 7: watchOS Companion (~3 files)
**Glanceable scores on Apple Watch**

- [x] `SportsScoresWatchApp.swift` — NavigationStack entry point
- [x] `WatchScoresView.swift` — Compact game list using SportsScoresKit
- [x] `WatchGameRow.swift` — Minimal score display for small screen
- [x] **Tests**: WatchOS view preview tests
- [x] Run tests, verify all pass
- [x] Commit

## Phase 8: Integration Testing & Polish
**End-to-end validation**

- [x] Pull-to-refresh on scores list
- [x] Loading states and error handling UI (empty states, retry buttons)
- [x] Accessibility labels on all interactive elements
- [x] **Tests**: Integration tests hitting production API (scores load, box scores load)
- [x] **Tests**: UI tests for core navigation flows (tab switching, game tap → box score, favorites)
- [x] **Tests**: Accessibility audit (VoiceOver labels, Dynamic Type)
- [x] Run full test suite
- [x] Final commit

---

## Design Language
- **Dark-only** matching web "Broadcast Noir" aesthetic
- Sport accent colors: NBA `#ee6730`, MLB `#29c99a`, MCBB `#1a5276`, WCBB `#8e44ad`, College Baseball `#1e6bb8`, College Softball `#d4457a`
- iOS 26 Liquid Glass materials for nav/tab bars
- SF Pro system font (Apple HIG), SF Symbols for icons

## Data Flow
```
Vercel API → APIClient → ViewModel (@Observable)
                              │
                ┌──────────────┼──────────────┐
                ▼              ▼               ▼
             SwiftUI       WidgetKit       watchOS
              Views        Timeline         Views
                │
                ▼
          Live Activity (ActivityKit)
          Haptic Manager
```

## Polling Strategy
- Foreground: 30s via `Timer.publish`
- Background: paused via `.scenePhase`
- Widget: system-managed (5-15 min based on game state)
- watchOS: independent, 60s interval
