'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const normalize = require('../api/_lib/normalize');
const { normalizeStandings } = require('../api/_lib/standings');

// Shaped like ESPN's football scoreboard/summary responses.
const nflScoreboard = {
  events: [
    {
      id: '401772001',
      date: '2026-09-27T17:00Z',
      competitions: [{
        status: { type: { name: 'STATUS_IN_PROGRESS', shortDetail: '3rd 8:42' } },
        situation: {
          down: 3,
          distance: 7,
          yardLine: 15,
          downDistanceText: '3rd & 7 at DAL 15',
          shortDownDistanceText: '3rd & 7',
          possession: '19',
          isRedZone: true,
          homeTimeouts: 3,
          awayTimeouts: 2,
          lastPlay: { text: 'J.Dart pass short right to M.Nabers for 12 yards' },
        },
        competitors: [
          { homeAway: 'home', score: '10', team: { id: '6', displayName: 'Dallas Cowboys', name: 'Cowboys', abbreviation: 'DAL' } },
          { homeAway: 'away', score: '14', team: { id: '19', displayName: 'New York Giants', name: 'Giants', abbreviation: 'NYG' } },
        ],
      }],
    },
    {
      id: '401772002',
      date: '2026-09-27T20:25Z',
      competitions: [{
        status: { type: { name: 'STATUS_HALFTIME', shortDetail: 'Halftime' } },
        competitors: [
          { homeAway: 'home', score: '7', team: { id: '1', displayName: 'Atlanta Falcons', abbreviation: 'ATL' } },
          { homeAway: 'away', score: '3', team: { id: '2', displayName: 'Buffalo Bills', abbreviation: 'BUF' } },
        ],
      }],
    },
  ],
};

test(`normalizeScoreboard: NFL live game includes situation`, () => {
  const [game] = normalize.normalizeScoreboard(nflScoreboard, 'nfl').games;
  assert.equal(game.status, 'live');
  assert.deepEqual(game.situation, {
    downDistanceText: '3rd & 7 at DAL 15',
    shortDownDistanceText: '3rd & 7',
    possession: 'away',
    isRedZone: true,
    homeTimeouts: 3,
    awayTimeouts: 2,
    lastPlay: 'J.Dart pass short right to M.Nabers for 12 yards',
  });
});

test(`normalizeScoreboard: halftime counts as live, no situation`, () => {
  const game = normalize.normalizeScoreboard(nflScoreboard, 'nfl').games[1];
  assert.equal(game.status, 'live');
  assert.equal(game.situation, null);
});

test(`normalizeScoreboard: non-NFL games have no situation key`, () => {
  const [game] = normalize.normalizeScoreboard(nflScoreboard, 'nba').games;
  assert.equal('situation' in game, false);
});

const nflSummary = {
  header: {
    competitions: [{
      status: { type: { name: 'STATUS_FINAL', shortDetail: 'Final' } },
      competitors: [
        { homeAway: 'home', score: '20', team: { id: '6', displayName: 'Dallas Cowboys', abbreviation: 'DAL' } },
        { homeAway: 'away', score: '27', team: { id: '19', displayName: 'New York Giants', abbreviation: 'NYG' } },
      ],
    }],
  },
  boxscore: {
    teams: [
      { homeAway: 'away', team: { id: '19' }, statistics: [{ name: 'totalYards', label: 'Total Yards', displayValue: '389' }] },
      { homeAway: 'home', team: { id: '6' }, statistics: [{ name: 'totalYards', label: 'Total Yards', displayValue: '301' }] },
    ],
    players: [
      {
        team: { id: '6' },
        statistics: [
          {
            name: 'passing',
            labels: ['C/ATT', 'YDS', 'AVG', 'TD', 'INT', 'SACKS', 'QBR', 'RTG'],
            athletes: [{ athlete: { displayName: 'Dak Prescott', shortName: 'D. Prescott' }, stats: ['22/35', '240', '6.9', '1', '1', '2-14', '48.1', '81.2'] }],
          },
        ],
      },
      {
        team: { id: '19' },
        statistics: [
          {
            name: 'rushing',
            labels: ['CAR', 'YDS', 'AVG', 'TD', 'LONG'],
            athletes: [{ athlete: { displayName: 'Cam Skattebo', shortName: 'C. Skattebo' }, stats: ['18', '97', '5.4', '2', '21'] }],
          },
          { name: 'fumbles', labels: ['FUM'], athletes: [{ athlete: { displayName: 'X' }, stats: ['1'] }] },
        ],
      },
    ],
  },
};

test(`normalizeBoxscore: NFL team stats and players by side`, () => {
  const box = normalize.normalizeBoxscore(nflSummary, 'nfl', '401772001');
  assert.deepEqual(box.statistics, [{ key: 'totalYards', label: 'Total Yards', awayValue: '389', homeValue: '301' }]);
  // Players are matched by team id, not array order.
  assert.deepEqual(box.players.home.passing, [
    { name: 'Dak Prescott', shortName: 'D. Prescott', stats: { 'C/ATT': '22/35', YDS: '240', TD: '1', INT: '1', QBR: '48.1' } },
  ]);
  assert.deepEqual(box.players.away.rushing[0].stats, { CAR: '18', YDS: '97', AVG: '5.4', TD: '2', LONG: '21' });
  assert.deepEqual(box.players.away.passing, []);
  assert.equal('fumbles' in box.players.away, false);
});

const entry = (id, abbr, stats) => ({
  team: { id, displayName: abbr, abbreviation: abbr, logos: [{ href: `https://example.com/${abbr}.png` }] },
  stats: Object.entries(stats).map(([name, value]) => ({ name, value: typeof value === 'number' ? value : undefined, displayValue: String(value) })),
});

test('normalizeStandings: nested divisions, sorted by playoff seed', () => {
  const data = {
    name: 'National Football League',
    children: [{
      name: 'National Football Conference',
      abbreviation: 'NFC',
      children: [{
        name: 'NFC East',
        abbreviation: 'NFCE',
        standings: {
          season: 2026,
          seasonDisplayName: '2026',
          entries: [
            entry('6', 'DAL', { wins: 1, losses: 2, ties: 0, winPercent: 0.333, pointsFor: 60, pointsAgainst: 70, streak: 'L1', playoffSeed: 9 }),
            entry('19', 'NYG', { wins: 3, losses: 0, ties: 0, winPercent: 1, pointsFor: 80, pointsAgainst: 40, streak: 'W3', playoffSeed: 1 }),
          ],
        },
      }],
    }],
  };

  const result = normalizeStandings(data, 'nfl');
  assert.deepEqual(result.columns, ['W', 'L', 'T', 'PCT', 'PF', 'PA', 'STRK']);
  assert.equal(result.groups.length, 1);
  assert.equal(result.groups[0].name, 'NFC East');
  assert.equal(result.groups[0].parent, 'National Football Conference');
  assert.deepEqual(result.groups[0].entries.map((e) => e.team.abbreviation), ['NYG', 'DAL']);
  assert.deepEqual(result.groups[0].entries[0].stats, { W: '3', L: '0', T: '0', PCT: '1', PF: '80', PA: '40', STRK: 'W3' });
  assert.equal(result.groups[0].entries[0].team.logo, 'https://example.com/NYG.png');
});

test('normalizeStandings: flat conferences sorted by win percent without seeds', () => {
  const data = {
    children: [{
      name: 'Eastern Conference',
      abbreviation: 'East',
      standings: {
        seasonDisplayName: '2025-26',
        entries: [
          entry('2', 'BOS', { wins: 50, losses: 32, winPercent: 0.61, gamesBehind: '8', streak: 'W1' }),
          entry('18', 'NY', { wins: 58, losses: 24, winPercent: 0.707, gamesBehind: '-', streak: 'W4' }),
        ],
      },
    }],
  };

  const result = normalizeStandings(data, 'nba');
  assert.equal(result.season, '2025-26');
  assert.equal(result.groups[0].parent, '');
  assert.deepEqual(result.groups[0].entries.map((e) => e.team.abbreviation), ['NY', 'BOS']);
  assert.deepEqual(result.groups[0].entries[0].stats, { W: '58', L: '24', PCT: '0.707', GB: '-', STRK: 'W4' });
});

test('normalizeStandings: empty response yields no groups', () => {
  assert.deepEqual(normalizeStandings({}, 'mlb').groups, []);
});
