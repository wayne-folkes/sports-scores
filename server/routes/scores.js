'use strict';

const express = require('express');
const fetch = require('node-fetch');
const { createCache } = require('../middleware/cache');
const { normalizeScoreboard } = require('./normalize');

const router = express.Router();
const cache = createCache(60);

const ESPN_URLS = {
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard',
};

async function fetchScores(req, res, sport) {
  try {
    const response = await fetch(ESPN_URLS[sport]);
    if (!response.ok) {
      return res.status(502).json({ error: `ESPN API returned ${response.status}` });
    }
    const data = await response.json();
    res.json(normalizeScoreboard(data, sport));
  } catch (err) {
    res.status(502).json({ error: `Failed to fetch ${sport} scores: ${err.message}` });
  }
}

router.get('/nba', cache, (req, res) => fetchScores(req, res, 'nba'));
router.get('/mlb', cache, (req, res) => fetchScores(req, res, 'mlb'));

module.exports = router;
