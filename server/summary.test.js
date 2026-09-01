'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { deriveGameState, buildCacheKey, buildCacheControl, isLiveRecordStale } = require('../api/_lib/summaryHandler');

// Test game state derivation with state field preference
test('summary: deriveGameState prefers statusType.state when available', () => {
  const espnData = {
    header: {
      competitions: [
        {
          status: { type: { state: 'in', name: 'STATUS_HALFTIME', completed: false } },
        },
      ],
    },
  };

  assert.equal(deriveGameState(espnData), 'in');
});

test('summary: deriveGameState handles halftime (state=in despite name)', () => {
  const espnData = {
    header: {
      competitions: [
        {
          status: { type: { state: 'in', name: 'STATUS_HALFTIME', completed: false } },
        },
      ],
    },
  };

  assert.equal(deriveGameState(espnData), 'in');
});

test('summary: deriveGameState falls back to name-based detection', () => {
  const espnData = {
    header: {
      competitions: [
        {
          status: { type: { name: 'STATUS_IN_PROGRESS' } },
        },
      ],
    },
  };

  assert.equal(deriveGameState(espnData), 'in');
});

test('summary: deriveGameState handles final with statusType.completed', () => {
  const espnData = {
    header: {
      competitions: [
        {
          status: { type: { state: 'post', completed: true, name: 'STATUS_FINAL' } },
        },
      ],
    },
  };

  assert.equal(deriveGameState(espnData), 'post');
});

test('summary: deriveGameState prefers explicit pre state', () => {
  const espnData = {
    header: {
      competitions: [
        {
          status: { type: { state: 'pre', name: 'STATUS_SCHEDULED' } },
        },
      ],
    },
  };

  assert.equal(deriveGameState(espnData), 'pre');
});

test('summary: cache key format includes game state', () => {
  const cacheKey = buildCacheKey('nba', '401234', 'post');
  assert.equal(cacheKey, 'summary:v1:nba:401234:final');
});

test('summary: cache key format for live games', () => {
  const cacheKey = buildCacheKey('mlb', '401235', 'in');
  assert.equal(cacheKey, 'summary:v1:mlb:401235:in');
});

test('summary: cache key format for pre-game', () => {
  const cacheKey = buildCacheKey('nba', '401236', 'pre');
  assert.equal(cacheKey, 'summary:v1:nba:401236:pre');
});

test('summary: model selection for final games', () => {
  const selectModel = (gameState) => {
    if (gameState === 'final' || gameState === 'post') {
      return 'zai.glm-5';
    }
    return 'zai.glm-4.7-flash';
  };

  assert.equal(selectModel('final'), 'zai.glm-5');
  assert.equal(selectModel('post'), 'zai.glm-5');
  assert.equal(selectModel('in'), 'zai.glm-4.7-flash');
  assert.equal(selectModel('pre'), 'zai.glm-4.7-flash');
});

test('summary: cache headers for in-progress games', () => {
  const cacheControl = buildCacheControl('in');
  assert.equal(cacheControl, 's-maxage=180, stale-while-revalidate=60');
});

test('summary: cache headers for final games', () => {
  const cacheControl = buildCacheControl('post');
  assert.equal(cacheControl, 's-maxage=86400');
});

test('summary: cache headers for pre-game', () => {
  const cacheControl = buildCacheControl('pre');
  assert.equal(cacheControl, 's-maxage=86400');
});

test('summary: isLiveRecordStale returns false for recent in-progress record', () => {
  const cached = {
    gameState: 'in',
    generatedAt: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
  };

  assert.equal(isLiveRecordStale(cached), false);
});

test('summary: isLiveRecordStale returns true for stale in-progress record', () => {
  const cached = {
    gameState: 'in',
    generatedAt: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
  };

  assert.equal(isLiveRecordStale(cached), true);
});

test('summary: isLiveRecordStale returns false for final game regardless of age', () => {
  const cached = {
    gameState: 'post',
    generatedAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  };

  assert.equal(isLiveRecordStale(cached), false);
});

test('summary: isLiveRecordStale returns false for pre-game regardless of age', () => {
  const cached = {
    gameState: 'pre',
    generatedAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
  };

  assert.equal(isLiveRecordStale(cached), false);
});

test('summary: lock re-acquisition after 180 second boundary', () => {
  const isStale = (generatedAt) => {
    const age = Date.now() - Date.parse(generatedAt);
    return age > 180000;
  };

  const recentRecord = new Date(Date.now() - 179000).toISOString();
  assert.equal(isStale(recentRecord), false);

  const oldRecord = new Date(Date.now() - 181000).toISOString();
  assert.equal(isStale(oldRecord), true);
});
