'use strict';

const express = require('express');
const { normalizeBoxscore } = require('./normalize');
const { SUMMARY_BASE_URLS } = require('../../api/_lib/config');
const { handleSummaryRequest } = require('../../api/_lib/summaryHandler');

const router = express.Router();
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

router.get('/:sport/:eventId', async (req, res) => {
  const { sport, eventId } = req.params;
  const baseUrl = SUMMARY_BASE_URLS[sport];

  if (!baseUrl) {
    return res.status(404).json({ error: `Unsupported sport: ${sport}` });
  }

  try {
    const espnResponse = await fetchWithTimeout(`${baseUrl}${encodeURIComponent(eventId)}`);
    if (!espnResponse.ok) {
      return res.status(502).json({ error: `ESPN API returned ${espnResponse.status}` });
    }

    const espnData = await espnResponse.json();
    const normalizedData = normalizeBoxscore(espnData, sport, eventId);

    try {
      const result = await handleSummaryRequest(sport, eventId, normalizedData, espnData);
      res.setHeader('Cache-Control', result.cacheControl);
      return res.status(200).json({
        summary: result.summary,
        gameState: result.gameState,
        model: result.model,
        generatedAt: result.generatedAt,
        cached: result.cached,
      });
    } catch (bedrockError) {
      console.error('Bedrock error:', bedrockError);
      return res.status(503).json({ error: 'summary generation failed' });
    }
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    return res.status(502).json({
      error: isTimeout
        ? `ESPN API timed out for ${sport} summary`
        : `Failed to fetch ${sport} summary: ${err.message}`,
    });
  }
});

module.exports = router;
