import { QueryClient, useQuery } from '@tanstack/react-query';
import { BOXSCORE_POLL_INTERVAL, SCORES_POLL_INTERVAL } from '../constants';

// One cache for the whole app: widgets and modals that ask for the same
// endpoint share a single request. Polling pauses while the tab is hidden
// and refetches when it becomes visible again (TanStack Query defaults).
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Surface failures right away, as the hand-rolled fetches did.
        retry: false,
      },
    },
  });
}

async function fetchJson(url, label) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to load ${label} (${res.status})`);
  return res.json();
}

export function useScores(sport) {
  return useQuery({
    queryKey: ['scores', sport],
    queryFn: () => fetchJson(`/api/scores/${sport}`, 'scores'),
    refetchInterval: SCORES_POLL_INTERVAL,
  });
}

// Team lists rarely change (the API caches them for an hour), so the widget's
// team colors and the team selector reuse one response.
export function useTeams(sport) {
  return useQuery({
    queryKey: ['teams', sport],
    queryFn: () => fetchJson(`/api/teams/${sport}`, 'teams'),
    staleTime: 60 * 60 * 1000,
  });
}

export function useStandings(sport) {
  return useQuery({
    queryKey: ['standings', sport],
    queryFn: () => fetchJson(`/api/standings/${sport}`, 'standings'),
  });
}

export function useBoxscore(sport, eventId, isLive) {
  return useQuery({
    queryKey: ['boxscore', sport, eventId],
    queryFn: () => fetchJson(`/api/boxscore/${sport}/${eventId}`, 'box score'),
    refetchInterval: isLive ? BOXSCORE_POLL_INTERVAL : false,
  });
}

// Summaries are optional: "not available" responses resolve to null rather
// than an error, so the modal just omits the section.
export function useSummary(sport, eventId) {
  return useQuery({
    queryKey: ['summary', sport, eventId],
    queryFn: async ({ signal }) => {
      const res = await fetch(`/api/summary/${sport}/${eventId}`, { signal });
      if ([404, 502, 503].includes(res.status)) return null;
      if (!res.ok) throw new Error(`Failed to load summary (${res.status})`);
      return res.json();
    },
  });
}
