import { normalizeScoreboard } from '../_lib/normalize';
import { fetchWithTimeout } from '../_lib/fetchWithTimeout';
import { ESPN_API_BASE } from '../_lib/config';
import type { ApiRequest, ApiResponse } from '../_lib/http';
import type { EspnJson } from '../_lib/types';

const ESPN_URLS: Record<string, string> = {
  nfl: `${ESPN_API_BASE}/apis/site/v2/sports/football/nfl/scoreboard`,
  nba: `${ESPN_API_BASE}/apis/site/v2/sports/basketball/nba/scoreboard`,
  mlb: `${ESPN_API_BASE}/apis/site/v2/sports/baseball/mlb/scoreboard`,
  'mens-college-basketball': `${ESPN_API_BASE}/apis/site/v2/sports/basketball/mens-college-basketball/scoreboard`,
  'womens-college-basketball': `${ESPN_API_BASE}/apis/site/v2/sports/basketball/womens-college-basketball/scoreboard`,
  'college-baseball': `${ESPN_API_BASE}/apis/site/v2/sports/baseball/college-baseball/scoreboard`,
  'college-softball': `${ESPN_API_BASE}/apis/site/v2/sports/baseball/college-softball/scoreboard`,
};

const SUMMARY_URLS: Record<string, string> = {
  nba: `${ESPN_API_BASE}/apis/site/v2/sports/basketball/nba/summary?event=`,
};

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const { sport } = req.query;

  if (!ESPN_URLS[sport]) {
    return res.status(404).json({ error: `Unsupported sport: ${sport}` });
  }

  try {
    const response = await fetchWithTimeout(ESPN_URLS[sport]);
    if (!response.ok) {
      return res.status(502).json({ error: `ESPN API returned ${response.status}` });
    }
    const data: EspnJson = await response.json();
    const predictorsByEventId = await fetchPredictorsForSport(sport, data.events || []);
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
    return res.status(200).json(normalizeScoreboard(data, sport, predictorsByEventId));
  } catch (err) {
    const error = err as Error;
    const isTimeout = error.name === 'AbortError';
    return res.status(502).json({ error: isTimeout ? `ESPN API timed out for ${sport} scores` : `Failed to fetch ${sport} scores: ${error.message}` });
  }
}

async function fetchPredictorsForSport(sport: string, events: EspnJson[]): Promise<Record<string, EspnJson>> {
  const summaryBaseUrl = SUMMARY_URLS[sport];
  if (!summaryBaseUrl) {
    return {};
  }

  const scheduledEvents = events.filter((event) => {
    const competition = (event.competitions || [])[0] || {};
    const statusName = competition.status?.type?.name || event.status?.type?.name;
    return statusName === 'STATUS_SCHEDULED' && event.id;
  });

  const predictorEntries = await Promise.all(scheduledEvents.map(async (event): Promise<[string, EspnJson] | null> => {
    const eventId = String(event.id);
    try {
      const summaryResponse = await fetchWithTimeout(`${summaryBaseUrl}${encodeURIComponent(eventId)}`);
      if (!summaryResponse.ok) {
        console.warn(`Unable to fetch predictor for ${sport} event ${eventId}: ESPN returned ${summaryResponse.status}`);
        return null;
      }

      const summaryData: EspnJson = await summaryResponse.json();
      return [eventId, summaryData.predictor || null];
    } catch (error) {
      console.warn(`Unable to fetch predictor for ${sport} event ${eventId}: ${(error as Error).message}`);
      return null;
    }
  }));

  return Object.fromEntries(predictorEntries.filter((entry) => entry !== null));
}
