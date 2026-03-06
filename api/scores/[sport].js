'use strict';

const { normalizeScoreboard } = require('../_lib/normalize');
const { fetchWithTimeout } = require('../_lib/fetchWithTimeout');
const { ESPN_API_BASE } = require('../_lib/config');

const ESPN_URLS = {
  nba: `${ESPN_API_BASE}/apis/site/v2/sports/basketball/nba/scoreboard`,
  mlb: `${ESPN_API_BASE}/apis/site/v2/sports/baseball/mlb/scoreboard`,
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
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
    return res.status(200).json(normalizeScoreboard(data, sport));
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    return res.status(502).json({ error: isTimeout ? `ESPN API timed out for ${sport} scores` : `Failed to fetch ${sport} scores: ${err.message}` });
  }
};
