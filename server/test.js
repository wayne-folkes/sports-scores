'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createCache } = require('./middleware/cache');
const { normalizeStatus, normalizeScoreboard, normalizeBoxscore } = require('./routes/normalize');

// ---------------------------------------------------------------------------
// Cache middleware tests
// ---------------------------------------------------------------------------

test('cache: miss calls next and caches response', (t, done) => {
  const middleware = createCache(60);

  const req = { originalUrl: '/test-miss' };
  let jsonCalled = false;
  let capturedData = null;

  const res = {
    json(data) {
      jsonCalled = true;
      capturedData = data;
      return this;
    },
  };

  let nextCalled = false;
  const next = () => {
    nextCalled = true;
    // Simulate route handler writing the response
    res.json({ value: 42 });
    assert.ok(nextCalled, 'next() should be called on cache miss');
    assert.deepEqual(capturedData, { value: 42 });
    done();
  };

  middleware(req, res, next);
});

test('cache: hit returns cached value without calling next', (t, done) => {
  const middleware = createCache(60);
  const url = '/test-hit';

  const req = { originalUrl: url };
  const res1 = {
    json(data) { return this; },
  };

  // Prime the cache
  let nextCount = 0;
  const next1 = () => {
    nextCount++;
    res1.json({ cached: true });
    // Now test cache hit
    const req2 = { originalUrl: url };
    let hitData = null;
    const res2 = {
      json(data) {
        hitData = data;
        return this;
      },
    };

    const next2 = () => {
      assert.fail('next() should NOT be called on cache hit');
    };

    middleware(req2, res2, next2);
    assert.deepEqual(hitData, { cached: true });
    assert.equal(nextCount, 1, 'next() called exactly once (on miss)');
    done();
  };

  middleware(req, res1, next1);
});

test('cache: expired entry calls next again', (t, done) => {
  const middleware = createCache(0); // 0-second TTL — always expired
  const url = '/test-expired';

  const req1 = { originalUrl: url };
  const res1 = { json(data) { return this; } };

  let calls = 0;
  const next1 = () => {
    calls++;
    res1.json({ v: 1 });

    // Immediately request again — TTL is 0 so entry is already expired
    const req2 = { originalUrl: url };
    const res2 = { json(data) { return this; } };
    const next2 = () => {
      calls++;
      res2.json({ v: 2 });
      assert.equal(calls, 2, 'next() called twice when TTL=0');
      done();
    };
    middleware(req2, res2, next2);
  };

  middleware(req1, res1, next1);
});

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
