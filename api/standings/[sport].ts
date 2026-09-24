import { STANDINGS_URLS, normalizeStandings } from '../_lib/standings';
import { fetchWithTimeout } from '../_lib/fetchWithTimeout';
import type { ApiRequest, ApiResponse } from '../_lib/http';

export default async function handler(req: ApiRequest, res: ApiResponse) {
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
    const error = err as Error;
    const isTimeout = error.name === 'AbortError';
    return res.status(502).json({ error: isTimeout ? `ESPN API timed out for ${sport} standings` : `Failed to fetch ${sport} standings: ${error.message}` });
  }
}
