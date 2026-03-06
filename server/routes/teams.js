'use strict';

const express = require('express');
const fetch = require('node-fetch');
const { createCache } = require('../middleware/cache');

const router = express.Router();
const cache = createCache(3600);

const ESPN_URLS = {
  nba: 'https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams',
  mlb: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/teams',
};

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
    const response = await fetch(ESPN_URLS[sport]);
    if (!response.ok) {
      return res.status(502).json({ error: `ESPN API returned ${response.status}` });
    }
    const data = await response.json();
    res.json(normalizeTeams(data, sport));
  } catch (err) {
    res.status(502).json({ error: `Failed to fetch ${sport} teams: ${err.message}` });
  }
}

router.get('/nba', cache, (req, res) => fetchTeams(req, res, 'nba'));
router.get('/mlb', cache, (req, res) => fetchTeams(req, res, 'mlb'));

module.exports = router;
