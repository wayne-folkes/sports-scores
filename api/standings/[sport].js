'use strict';

const { STANDINGS_URLS, normalizeStandings } = require('../_lib/standings');
const { fetchWithTimeout } = require('../_lib/fetchWithTimeout');

module.exports = async function handler(req, res) {
  const { sport } = req.query;

  if (!STANDINGS_URLS[sport]) {
    return res.status(404).json({ error: `Unsupported sport: ${sport}` });
  }

  try {
    const response = await fetchWithTimeout(STANDINGS_URLS[sport]);
    if (!response.ok) {
      return res.status(502).json({ error: `ESPN API returned ${response.status}` });
    }
    const data = await response.json();
    res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=300');
    return res.status(200).json(normalizeStandings(data, sport));
  } catch (err) {
    const isTimeout = err.name === 'AbortError';
    return res.status(502).json({ error: isTimeout ? `ESPN API timed out for ${sport} standings` : `Failed to fetch ${sport} standings: ${err.message}` });
  }
};
