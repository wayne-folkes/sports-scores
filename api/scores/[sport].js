'use strict';

const { normalizeScoreboard } = require('../_lib/normalize');

const ESPN_URLS = {
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
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
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
    return res.status(200).json(normalizeScoreboard(data, sport));
  } catch (err) {
    return res.status(502).json({ error: `Failed to fetch ${sport} scores: ${err.message}` });
  }
};
