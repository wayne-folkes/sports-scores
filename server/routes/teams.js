'use strict';

const express = require('express');
const fetch = require('node-fetch');
const { createCache } = require('../middleware/cache');

const router = express.Router();
const cache = createCache(3600);

const ESPN_API_BASE = process.env.ESPN_API_BASE || 'https://site.api.espn.com';
const FETCH_TIMEOUT_MS = 10_000;

const ESPN_URLS = {
  nba: `${ESPN_API_BASE}/apis/site/v2/sports/basketball/nba/teams`,
  mlb: `${ESPN_API_BASE}/apis/site/v2/sports/baseball/mlb/teams`,
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

function normalizeTeams(data, sport) {
  const items = (data.sports || [])
    .flatMap((s) => s.leagues || [])
    .flatMap((l) => l.teams || [])
    .map((entry) => entry.team || entry);

  const teams = items.map((team) => {
    const logo = (team.logos || [])[0]?.href || team.logo || '';
    const color = (team.color || '').replace(/^#/, '');
    return {
      id: String(team.id || ''),
      name: team.displayName || team.name || '',
      abbreviation: team.abbreviation || '',
      logo,
      color,
    };
  });

  teams.sort((a, b) => a.name.localeCompare(b.name));

  return { sport, teams };
}

async function fetchTeams(req, res, sport) {
  try {
    const response = await fetchWithTimeout(ESPN_URLS[sport]);
    if (!response.ok) {
      return res.status(502).json({ error: `ESPN API returned ${response.status}` });
    }
    const data = await response.json();
    res.json(normalizeTeams(data, sport));
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    res.status(502).json({ error: isTimeout ? `ESPN API timed out for ${sport} teams` : `Failed to fetch ${sport} teams: ${err.message}` });
  }
}

router.get('/nba', cache, (req, res) => fetchTeams(req, res, 'nba'));
router.get('/mlb', cache, (req, res) => fetchTeams(req, res, 'mlb'));

module.exports = router;
