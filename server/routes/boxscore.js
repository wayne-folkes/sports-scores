'use strict';

const express = require('express');
const fetch = require('node-fetch');
const { createCache } = require('../middleware/cache');
const { normalizeBoxscore } = require('./normalize');

const router = express.Router();
const cache = createCache(30);

const SUMMARY_BASE_URLS = {
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/summary?event=',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/summary?event=',
};

router.get('/:sport/:eventId', cache, async (req, res) => {
  const { sport, eventId } = req.params;
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
    return res.json(normalizeBoxscore(data, sport, eventId));
  } catch (error) {
    return res.status(502).json({ error: `Failed to fetch ${sport} box score: ${error.message}` });
  }
});

module.exports = router;
