'use strict';

const { normalizeScoreboard } = require('../_lib/normalize');
const { fetchWithTimeout } = require('../_lib/fetchWithTimeout');
const { ESPN_API_BASE } = require('../_lib/config');

const ESPN_URLS = {
  nba: `${ESPN_API_BASE}/apis/site/v2/sports/basketball/nba/scoreboard`,
  mlb: `${ESPN_API_BASE}/apis/site/v2/sports/baseball/mlb/scoreboard`,
};

const SUMMARY_URLS = {
  nba: `${ESPN_API_BASE}/apis/site/v2/sports/basketball/nba/summary?event=`,
};

module.exports = async function handler(req, res) {
  const { sport } = req.query;

  if (!ESPN_URLS[sport]) {
    return res.status(404).json({ error: `Unsupported sport: ${sport}` });
  }

  try {
    const response = await fetchWithTimeout(ESPN_URLS[sport]);
    if (!response.ok) {
      return res.status(502).json({ error: `ESPN API returned ${response.status}` });
    }
    const data = await response.json();
    const predictorsByEventId = await fetchPredictorsForSport(sport, data.events || []);
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
    return res.status(200).json(normalizeScoreboard(data, sport, predictorsByEventId));
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    return res.status(502).json({ error: isTimeout ? `ESPN API timed out for ${sport} scores` : `Failed to fetch ${sport} scores: ${err.message}` });
  }
};

async function fetchPredictorsForSport(sport, events) {
  const summaryBaseUrl = SUMMARY_URLS[sport];
  if (!summaryBaseUrl) {
    return {};
  }

  const scheduledEvents = events.filter((event) => {
    const competition = (event.competitions || [])[0] || {};
    const statusName = competition.status?.type?.name || event.status?.type?.name;
    return statusName === 'STATUS_SCHEDULED' && event.id;
  });

  const predictorEntries = await Promise.all(scheduledEvents.map(async (event) => {
    const eventId = String(event.id);
    try {
      const summaryResponse = await fetchWithTimeout(`${summaryBaseUrl}${encodeURIComponent(eventId)}`);
      if (!summaryResponse.ok) {
        console.warn(`Unable to fetch predictor for ${sport} event ${eventId}: ESPN returned ${summaryResponse.status}`);
        return null;
      }

      const summaryData = await summaryResponse.json();
      return [eventId, summaryData.predictor || null];
    } catch (error) {
      console.warn(`Unable to fetch predictor for ${sport} event ${eventId}: ${error.message}`);
      return null;
    }
  }));

  return Object.fromEntries(predictorEntries.filter(Boolean));
}
