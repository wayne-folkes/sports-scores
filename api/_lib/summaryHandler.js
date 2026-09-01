'use strict';

const { getSummary, putSummary, tryLock } = require('./summaryStore');
const { generateSummary } = require('./summarize');

function deriveGameState(espnData) {
  const competition = espnData?.header?.competitions?.[0];
  if (!competition) return 'pre';

  const statusType = competition.status?.type;
  if (!statusType) return 'pre';

  const state = statusType.state;
  const statusName = statusType.name || '';
  const completed = statusType.completed === true;

  // Prefer state field when it's one of the standard values
  if (state === 'pre' || state === 'in' || state === 'post') {
    return state;
  }

  // Fall back to name-based detection
  if (completed || statusName === 'STATUS_FINAL') {
    return 'post';
  }
  if (statusName === 'STATUS_IN_PROGRESS') {
    return 'in';
  }
  return 'pre';
}

function buildCacheKey(sport, eventId, gameState) {
  return `summary:v1:${sport}:${eventId}:${gameState === 'post' ? 'final' : gameState}`;
}

function buildCacheControl(gameState) {
  return gameState === 'in' ? 's-maxage=180, stale-while-revalidate=60' : 's-maxage=86400';
}

function isLiveRecordStale(cached) {
  if (cached.gameState !== 'in') return false;
  const age = Date.now() - Date.parse(cached.generatedAt);
  return age > 180000; // 3 minutes
}

async function handleSummaryRequest(sport, eventId, normalizedData, espnData) {
  const gameState = deriveGameState(espnData);
  const cacheKey = buildCacheKey(sport, eventId, gameState);

  // Try to get from cache
  const cached = await getSummary(cacheKey);
  if (cached && !isLiveRecordStale(cached)) {
    return {
      summary: cached.summary,
      gameState,
      model: cached.model,
      generatedAt: cached.generatedAt,
      cached: true,
      cacheControl: buildCacheControl(gameState),
    };
  }

  // Try to acquire lock
  const lockAcquired = await tryLock(cacheKey);

  if (!lockAcquired) {
    // Poll for up to 3 attempts (2s each)
    for (let attempt = 0; attempt < 3; attempt++) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const polled = await getSummary(cacheKey);
      if (polled && !isLiveRecordStale(polled)) {
        return {
          summary: polled.summary,
          gameState,
          model: polled.model,
          generatedAt: polled.generatedAt,
          cached: true,
          cacheControl: buildCacheControl(gameState),
        };
      }
    }
  }

  // Generate summary
  const { summary, model } = await generateSummary(normalizedData, gameState === 'post' ? 'final' : gameState);
  const generatedAt = new Date().toISOString();

  // Store in cache
  await putSummary(cacheKey, { summary, gameState, model, generatedAt });

  return {
    summary,
    gameState,
    model,
    generatedAt,
    cached: false,
    cacheControl: buildCacheControl(gameState),
  };
}

module.exports = { deriveGameState, buildCacheKey, buildCacheControl, isLiveRecordStale, handleSummaryRequest };
