'use strict';

const express = require('express');
const fetch = require('node-fetch');
const { createCache } = require('../middleware/cache');
const { normalizeScoreboard } = require('./normalize');

const router = express.Router();
const cache = createCache(60);

const ESPN_API_BASE = process.env.ESPN_API_BASE || 'https://site.api.espn.com';
const FETCH_TIMEOUT_MS = 10_000;

const ESPN_URLS = {
  nba: `${ESPN_API_BASE}/apis/site/v2/sports/basketball/nba/scoreboard`,
  mlb: `${ESPN_API_BASE}/apis/site/v2/sports/baseball/mlb/scoreboard`,
};

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchScores(req, res, sport) {
  try {
    const response = await fetchWithTimeout(ESPN_URLS[sport]);
    if (!response.ok) {
      return res.status(502).json({ error: `ESPN API returned ${response.status}` });
    }
    const data = await response.json();
    res.json(normalizeScoreboard(data, sport));
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    res.status(502).json({ error: isTimeout ? `ESPN API timed out for ${sport} scores` : `Failed to fetch ${sport} scores: ${err.message}` });
  }
}

router.get('/nba', cache, (req, res) => fetchScores(req, res, 'nba'));
router.get('/mlb', cache, (req, res) => fetchScores(req, res, 'mlb'));

module.exports = router;
