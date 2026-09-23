'use strict';

const express = require('express');
const { createCache } = require('../middleware/cache');
const { STANDINGS_URLS, normalizeStandings } = require('../../api/_lib/standings');

const router = express.Router();
const cache = createCache(600);

const FETCH_TIMEOUT_MS = 10_000;

async function fetchWithTimeout(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

router.get('/:sport', cache, async (req, res) => {
  const { sport } = req.params;
  const url = STANDINGS_URLS[sport];

  if (!url) {
    return res.status(404).json({ error: `Unsupported sport: ${sport}` });
  }

  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      return res.status(502).json({ error: `ESPN API returned ${response.status}` });
    }
    const data = await response.json();
    return res.json(normalizeStandings(data, sport));
  } catch (error) {
    const isTimeout = error.name === 'AbortError';
    return res.status(502).json({ error: isTimeout ? `ESPN API timed out for ${sport} standings` : `Failed to fetch ${sport} standings: ${error.message}` });
  }
});

module.exports = router;
