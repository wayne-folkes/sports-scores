'use strict';

const { normalizeBoxscore } = require('../../_lib/normalize');

const SUMMARY_BASE_URLS = {
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/summary?event=',
};

module.exports = async function handler(req, res) {
  const { sport, eventId } = req.query;
  const baseUrl = SUMMARY_BASE_URLS[sport];

  if (!baseUrl) {
    return res.status(404).json({ error: `Unsupported sport: ${sport}` });
  }

  try {
    const response = await fetch(`${baseUrl}${encodeURIComponent(eventId)}`);
    if (!response.ok) {
      return res.status(502).json({ error: `ESPN API returned ${response.status}` });
    }
    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=10');
    return res.status(200).json(normalizeBoxscore(data, sport, eventId));
  } catch (err) {
    return res.status(502).json({ error: `Failed to fetch ${sport} box score: ${err.message}` });
  }
};
