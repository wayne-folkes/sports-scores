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

- [ ] Create Xcode project with app, widget, and watchOS targets
- [ ] Create `SportsScoresKit` Swift Package with `Package.swift`
- [ ] `Sport.swift` — Enum with raw values matching API keys, display names, accent colors
- [ ] `Game.swift` — Codable structs for `/api/scores` response (Game, Team, Score, Status)
- [ ] `BoxScore.swift` — Codable structs for `/api/boxscore` response (BoxScore, PlayerStats, TeamStats)
- [ ] `TeamInfo.swift` — Codable struct for `/api/teams` response
- [ ] `APIClient.swift` — Generic async/await URLSession client with error handling
- [ ] `Endpoints.swift` — URL construction for all API routes
- [ ] `FavoritesStore.swift` — SwiftData model + App Group container
- [ ] `AppGroup.swift` — Shared container ID constant
- [ ] **Tests**: Unit tests for JSON decoding (all model types against sample API responses)
- [ ] **Tests**: Unit tests for URL construction in Endpoints
- [ ] **Tests**: Mock-based tests for APIClient error handling
- [ ] Run tests, verify all pass
- [ ] Commit

## Phase 2: Scores Tab (~8 files)
**Main scores list — core app experience**

- [ ] `SportsScoresApp.swift` — Entry point with TabView (Scores, Favorites, Settings)
- [ ] `ScoresViewModel.swift` — @Observable, concurrent fetching with TaskGroup, 30s polling, scenePhase pause
- [ ] `ScoresTab.swift` — Sport filter pills + game list
- [ ] `SportPicker.swift` — Horizontal ScrollView of toggleable sport chips
- [ ] `GameRow.swift` — Score card (team logos, names, scores, status, records)
- [ ] `StatusBadge.swift` — Live (pulsing red), Final (gray), Scheduled (green)
- [ ] `TeamLogo.swift` — AsyncImage with placeholder and disk cache
- [ ] `SportAccent.swift` — Color extension mapping Sport → accent Color
- [ ] **Tests**: ScoresViewModel unit tests (mock APIClient, verify polling, sport filtering)
- [ ] **Tests**: Snapshot/preview tests for GameRow, StatusBadge, SportPicker
- [ ] Run tests, verify all pass
- [ ] Commit

## Phase 3: Box Score Detail (~4 files)
**Tapping a game → full box score view**

- [ ] `BoxScoreViewModel.swift` — Fetches box score, 30s polling for live games
- [ ] `BoxScoreView.swift` — Score header, linescore, team stats, player stats
- [ ] `PlayerStatsTable.swift` — Reusable: NBA (PTS/REB/AST/FG/3PT/FT/MIN), MLB batting + pitching
- [ ] `LinescoreView.swift` — Horizontal grid of period/inning scores
- [ ] **Tests**: BoxScoreViewModel unit tests (mock data, polling lifecycle)
- [ ] **Tests**: PlayerStatsTable rendering tests for NBA vs MLB data shapes
- [ ] Run tests, verify all pass
- [ ] Commit

## Phase 4: Favorites & Settings (~4 files)
**Team favorites and app preferences**

- [ ] `FavoritesTab.swift` — Filtered view of games involving favorite teams
- [ ] `TeamSelector.swift` — Sheet with sport-grouped team list, search, toggle
- [ ] `SettingsTab.swift` — Refresh interval, enabled sports, about section
- [ ] Wire SwiftData favorites to filter ScoresViewModel output
- [ ] **Tests**: FavoritesStore persistence tests (add/remove/persist across launches)
- [ ] **Tests**: TeamSelector search filtering tests
- [ ] Run tests, verify all pass
- [ ] Commit

## Phase 5: iOS-Specific Features (~4 files)
**Haptics, Live Activities**

- [ ] `HapticManager.swift` — Score change detection, impact feedback (light/medium/heavy)
- [ ] `LiveActivityAttributes.swift` — ActivityAttributes with teams, scores, status, period
- [ ] `SportsScoresLiveActivity.swift` — Lock screen / Dynamic Island UI, start/update/end lifecycle
- [ ] Integrate haptics into ScoresViewModel score change detection
- [ ] **Tests**: HapticManager unit tests (score change detection logic)
- [ ] **Tests**: LiveActivity attributes encoding/decoding tests
- [ ] Run tests, verify all pass
- [ ] Commit

## Phase 6: Home Screen Widgets (~3 files)
**WidgetKit extension**

- [ ] `WidgetTimelineProvider.swift` — TimelineProvider with 5-15 min refresh, favorite team filtering
- [ ] `ScoresWidget.swift` — Small (single game), Medium (2-3 games), Large (full sport)
- [ ] `SportsScoresWidgets.swift` — Widget bundle registration
- [ ] **Tests**: TimelineProvider unit tests (timeline generation, refresh intervals)
- [ ] Run tests, verify all pass
- [ ] Commit

## Phase 7: watchOS Companion (~3 files)
**Glanceable scores on Apple Watch**

- [ ] `SportsScoresWatchApp.swift` — NavigationStack entry point
- [ ] `WatchScoresView.swift` — Compact game list using SportsScoresKit
- [ ] `WatchGameRow.swift` — Minimal score display for small screen
- [ ] **Tests**: WatchOS view preview tests
- [ ] Run tests, verify all pass
- [ ] Commit

## Phase 8: Integration Testing & Polish
**End-to-end validation**

- [ ] Pull-to-refresh on scores list
- [ ] Loading states and error handling UI (empty states, retry buttons)
- [ ] Accessibility labels on all interactive elements
- [ ] **Tests**: Integration tests hitting production API (scores load, box scores load)
- [ ] **Tests**: UI tests for core navigation flows (tab switching, game tap → box score, favorites)
- [ ] **Tests**: Accessibility audit (VoiceOver labels, Dynamic Type)
- [ ] Run full test suite
- [ ] Final commit

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
