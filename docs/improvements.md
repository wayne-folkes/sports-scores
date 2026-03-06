# Improvement Ideas

This document tracks potential improvements to the Sports Scores app, organized by priority and category.

---

## 🔴 High Priority

### Fix BoxScoreModal team logo error handling
`BoxScoreModal` renders team logos with no `onError` fallback. If ESPN's CDN is unavailable the image silently breaks. `ScoreCard` already has a shared `TeamLogo` component with proper error handling — `BoxScoreModal` should use the same component.

**Files:** `client/src/components/BoxScoreModal/BoxScoreModal.jsx`, `client/src/components/ScoreCard/ScoreCard.jsx`

---

### Auto-refresh box score during live games
`SportWidget` polls scores every 30 seconds using the Page Visibility API. The box score modal fetches once on open and then goes stale mid-game. It should match the same polling interval and pause/resume behavior while the tab is hidden.

**Files:** `client/src/components/BoxScoreModal/BoxScoreModal.jsx`

---

### Add request timeouts to all ESPN fetch calls
All three backend routes (`scores.js`, `teams.js`, `boxscore.js`) call ESPN with no timeout. A hanging upstream request will freeze the route indefinitely for all users. Each `fetch()` call should use an `AbortController` with a 10–15 second timeout.

**Files:** `server/routes/scores.js`, `server/routes/teams.js`, `server/routes/boxscore.js`

---

## 🟠 Medium Priority

### Add React component tests
The server has solid unit test coverage but there are zero React component tests. `SportWidget`, `ScoreCard`, and `TeamSelector` are the highest-value targets. Tests should cover: rendering with live/final/scheduled game states, favorite-team toggle, and modal open/close behavior.

**Files:** `client/src/components/`

---

### Extract color utilities to a shared module
`hexToRgb()`, `rgba()`, and `mixColors()` are all defined inline in `SportWidget.jsx` and cannot be reused elsewhere. Moving them to `src/utils/colors.js` makes them testable and available to any future component that needs team color accents.

**Files:** `client/src/components/SportWidget/SportWidget.jsx`

---

### Memoize TeamSelector filtered team list
`filteredTeams` is recomputed on every render in `TeamSelector`. Wrapping the filter logic in `useMemo([teams, search])` prevents unnecessary recalculation, especially as the team list grows.

**Files:** `client/src/components/TeamSelector/TeamSelector.jsx`

---

### Add environment variable support for ESPN URLs
ESPN base URLs are hardcoded in three separate route files. Adding a `process.env.ESPN_BASE_URL` with a `.env` fallback would make it straightforward to swap endpoints for testing, staging, or future API changes.

**Files:** `server/routes/scores.js`, `server/routes/teams.js`, `server/routes/boxscore.js`

---

## 🟡 Lower Priority / Polish

### Fix BoxScoreModal image dimensions
`BoxScoreModal` renders `<img>` tags without explicit `width`/`height` attributes, causing layout shift when images load. `ScoreCard` correctly specifies dimensions — `BoxScoreModal` should follow the same pattern.

**Files:** `client/src/components/BoxScoreModal/BoxScoreModal.jsx`

---

### Make box score statistics a semantic table
The statistics section in `BoxScoreModal` is built from `<div>` elements. Screen readers cannot navigate or understand the column relationships. Converting to a proper `<table>` with `<th>` headers for Away, Stat, and Home columns would fix accessibility.

**Files:** `client/src/components/BoxScoreModal/BoxScoreModal.jsx`, `client/src/components/BoxScoreModal/BoxScoreModal.css`

---

### Consolidate magic numbers into a constants file
Scattered across the codebase:
- Poll interval `30_000` in `SportWidget.jsx`
- Cache TTLs `60`, `3600`, `30` in route files
- Skeleton count `3` in `SportWidget.jsx`

Moving these to a shared `server/constants.js` and `client/src/constants.js` makes them easy to tune and self-documenting.

**Files:** `client/src/components/SportWidget/SportWidget.jsx`, `server/routes/`

---

### Add aria-live announcements for dynamic UI states
Two areas need screen reader improvements:
1. The "X teams shown" count in `TeamSelector` should be wrapped in an `aria-live="polite"` region so it's announced as the user types.
2. The refresh spinner in `SportWidget` should set `aria-busy="true"` on the button during loading.

**Files:** `client/src/components/TeamSelector/TeamSelector.jsx`, `client/src/components/SportWidget/SportWidget.jsx`
