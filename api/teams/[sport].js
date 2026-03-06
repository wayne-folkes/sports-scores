'use strict';

const { normalizeTeams } = require('../_lib/teams');

const ESPN_URLS = {
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams',
};

module.exports = async function handler(req, res) {
  const { sport } = req.query;

  if (!ESPN_URLS[sport]) {
    return res.status(404).json({ error: `Unsupported sport: ${sport}` });
  }

  try {
    const response = await fetch(ESPN_URLS[sport]);
    if (!response.ok) {
      return res.status(502).json({ error: `ESPN API returned ${response.status}` });
    }
    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=300');
    return res.status(200).json(normalizeTeams(data, sport));
  } catch (err) {
    return res.status(502).json({ error: `Failed to fetch ${sport} teams: ${err.message}` });
  }
};
