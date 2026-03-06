'use strict';

const express = require('express');
const fetch = require('node-fetch');
const { createCache } = require('../middleware/cache');
const { normalizeBoxscore } = require('./normalize');

const router = express.Router();
const cache = createCache(30);

const ESPN_API_BASE = process.env.ESPN_API_BASE || 'https://site.api.espn.com';
const FETCH_TIMEOUT_MS = 10_000;

const SUMMARY_BASE_URLS = {
  nba: `${ESPN_API_BASE}/apis/site/v2/sports/basketball/nba/summary?event=`,
  mlb: `${ESPN_API_BASE}/apis/site/v2/sports/baseball/mlb/summary?event=`,
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

router.get('/:sport/:eventId', cache, async (req, res) => {
  const { sport, eventId } = req.params;
  const baseUrl = SUMMARY_BASE_URLS[sport];

  if (!baseUrl) {
    return res.status(404).json({ error: `Unsupported sport: ${sport}` });
  }

  try {
    const response = await fetchWithTimeout(`${baseUrl}${encodeURIComponent(eventId)}`);
    if (!response.ok) {
      return res.status(502).json({ error: `ESPN API returned ${response.status}` });
    }

    const data = await response.json();
    return res.json(normalizeBoxscore(data, sport, eventId));
  } catch (error) {
    const isTimeout = error.name === 'AbortError';
    return res.status(502).json({ error: isTimeout ? `ESPN API timed out for ${sport} box score` : `Failed to fetch ${sport} box score: ${error.message}` });
  }
});

module.exports = router;
