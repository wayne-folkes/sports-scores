'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { normalizeStatus, normalizeScoreboard, normalizeBoxscore } = require('../api/_lib/normalize');

// ---------------------------------------------------------------------------
// normalizeStatus tests
// ---------------------------------------------------------------------------

test('normalizeStatus: STATUS_IN_PROGRESS -> live', () => {
  assert.equal(normalizeStatus('STATUS_IN_PROGRESS'), 'live');
});

test('normalizeStatus: STATUS_FINAL -> final', () => {
  assert.equal(normalizeStatus('STATUS_FINAL'), 'final');
});

test('normalizeStatus: unknown status -> scheduled', () => {
  assert.equal(normalizeStatus('STATUS_SCHEDULED'), 'scheduled');
  assert.equal(normalizeStatus(''), 'scheduled');
  assert.equal(normalizeStatus(undefined), 'scheduled');
});

// ---------------------------------------------------------------------------
// normalizeScoreboard tests
// ---------------------------------------------------------------------------

test('normalizeScoreboard: returns correct shape', () => {
  const espnData = {
    events: [
      {
        id: '401234',
        date: '2024-01-15T00:00:00Z',
        competitions: [
          {
            status: {
              type: {
                name: 'STATUS_FINAL',
                shortDetail: 'Final',
              },
            },
            competitors: [
              {
                homeAway: 'home',
                score: '110',
                team: {
                  id: '1',
                  displayName: 'Los Angeles Lakers',
                  abbreviation: 'LAL',
                  logos: [{ href: 'https://example.com/lakers.png' }],
                },
              },
              {
                homeAway: 'away',
                score: '105',
                team: {
                  id: '2',
                  displayName: 'Boston Celtics',
                  abbreviation: 'BOS',
                  logos: [{ href: 'https://example.com/celtics.png' }],
                },
              },
            ],
          },
        ],
      },
    ],
  };

  const result = normalizeScoreboard(espnData, 'nba');

  assert.equal(result.sport, 'nba');
  assert.ok(result.lastUpdated);
  assert.equal(result.games.length, 1);

  const game = result.games[0];
  assert.equal(game.id, '401234');
  assert.equal(game.status, 'final');
  assert.equal(game.statusDetail, 'Final');
  assert.equal(game.startTime, '2024-01-15T00:00:00Z');
  assert.equal(game.homeTeam.name, 'Los Angeles Lakers');
  assert.equal(game.homeTeam.abbreviation, 'LAL');
  assert.equal(game.homeScore, 110);
  assert.equal(game.awayTeam.name, 'Boston Celtics');
  assert.equal(game.awayScore, 105);
});

test('normalizeScoreboard: empty events returns empty games array', () => {
  const result = normalizeScoreboard({}, 'mlb');
  assert.equal(result.sport, 'mlb');
  assert.deepEqual(result.games, []);
});

test('normalizeScoreboard: null score returns null not NaN', () => {
  const espnData = {
    events: [
      {
        id: '999',
        date: '2024-06-01T18:00:00Z',
        competitions: [
          {
            status: { type: { name: 'STATUS_SCHEDULED', shortDetail: '7:00 PM ET' } },
            competitors: [
              { homeAway: 'home', score: '', team: { id: '3', displayName: 'Team A', abbreviation: 'AAA', logos: [] } },
              { homeAway: 'away', score: '', team: { id: '4', displayName: 'Team B', abbreviation: 'BBB', logos: [] } },
            ],
          },
        ],
      },
    ],
  };

  const result = normalizeScoreboard(espnData, 'nba');
  const game = result.games[0];
  assert.equal(game.homeScore, null);
  assert.equal(game.awayScore, null);
  assert.equal(game.status, 'scheduled');
});

test('normalizeScoreboard: includes matchup predictions when ESPN provides them', () => {
  const espnData = {
    events: [
      {
        id: '401810776',
        date: '2026-03-08T00:30:00Z',
        competitions: [
          {
            status: { type: { name: 'STATUS_SCHEDULED', shortDetail: '7:30 PM ET' } },
            competitors: [
              { homeAway: 'home', team: { id: '5', displayName: 'Cleveland Cavaliers', abbreviation: 'CLE', logos: [] } },
              { homeAway: 'away', team: { id: '2', displayName: 'Boston Celtics', abbreviation: 'BOS', logos: [] } },
            ],
          },
        ],
      },
    ],
  };

  const result = normalizeScoreboard(espnData, 'nba', {
    401810776: {
      header: 'Matchup Predictor',
      homeTeam: { id: '5', gameProjection: '57' },
      awayTeam: { id: '2', gameProjection: '43' },
    },
  });

  assert.deepEqual(result.games[0].prediction, {
    label: 'Matchup Predictor',
    homeWinProbability: 57,
    awayWinProbability: 43,
  });
});

test('normalizeBoxscore: returns aligned team stats', () => {
  const espnData = {
    header: {
      competitions: [
        {
          id: '401810754',
          date: '2026-03-06T00:00:00Z',
          status: {
            type: {
              name: 'STATUS_FINAL',
              shortDetail: 'Final/OT',
            },
          },
          competitors: [
            {
              homeAway: 'home',
              score: '111',
              team: {
                id: '19',
                displayName: 'Orlando Magic',
                abbreviation: 'ORL',
                logos: [{ href: 'https://example.com/orl.png' }],
              },
            },
            {
              homeAway: 'away',
              score: '108',
              team: {
                id: '6',
                displayName: 'Dallas Mavericks',
                abbreviation: 'DAL',
                logos: [{ href: 'https://example.com/dal.png' }],
              },
            },
          ],
        },
      ],
    },
    boxscore: {
      teams: [
        {
          homeAway: 'away',
          team: {
            id: '6',
            displayName: 'Dallas Mavericks',
            abbreviation: 'DAL',
            logos: [{ href: 'https://example.com/dal.png' }],
          },
          statistics: [
            { abbreviation: 'FG%', label: 'Field Goal %', displayValue: '45' },
            { abbreviation: 'REB', label: 'Rebounds', displayValue: '44' },
          ],
        },
        {
          homeAway: 'home',
          team: {
            id: '19',
            displayName: 'Orlando Magic',
            abbreviation: 'ORL',
            logos: [{ href: 'https://example.com/orl.png' }],
          },
          statistics: [
            { abbreviation: 'FG%', label: 'Field Goal %', displayValue: '47' },
            { abbreviation: 'REB', label: 'Rebounds', displayValue: '48' },
          ],
        },
      ],
    },
  };

  const result = normalizeBoxscore(espnData, 'nba', '401810754');

  assert.equal(result.eventId, '401810754');
  assert.equal(result.status, 'final');
  assert.equal(result.statusDetail, 'Final/OT');
  assert.equal(result.teams.away.team.name, 'Dallas Mavericks');
  assert.equal(result.teams.home.score, 111);
  assert.deepEqual(result.statistics[0], {
    key: 'FG%',
    label: 'Field Goal %',
    awayValue: '45',
    homeValue: '47',
  });
});
