'use strict';

const { normalizeTeams } = require('../_lib/teams');
const { fetchWithTimeout } = require('../_lib/fetchWithTimeout');
const { ESPN_API_BASE } = require('../_lib/config');

const ESPN_URLS = {
  nba: `${ESPN_API_BASE}/apis/site/v2/sports/basketball/nba/teams`,
  mlb: `${ESPN_API_BASE}/apis/site/v2/sports/baseball/mlb/teams`,
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
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=300');
    return res.status(200).json(normalizeTeams(data, sport));
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    return res.status(502).json({ error: isTimeout ? `ESPN API timed out for ${sport} teams` : `Failed to fetch ${sport} teams: ${err.message}` });
  }
};
