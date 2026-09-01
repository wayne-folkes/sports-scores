'use strict';

const { normalizeBoxscore } = require('../../_lib/normalize');
const { fetchWithTimeout } = require('../../_lib/fetchWithTimeout');
const { SUMMARY_BASE_URLS } = require('../../_lib/config');

module.exports = async function handler(req, res) {
  const { sport, eventId } = req.query;
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
    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=10');
    return res.status(200).json(normalizeBoxscore(data, sport, eventId));
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    return res.status(502).json({ error: isTimeout ? `ESPN API timed out for ${sport} box score` : `Failed to fetch ${sport} box score: ${err.message}` });
  }
};
