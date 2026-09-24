import { normalizeBoxscore } from '../../_lib/normalize';
import { fetchWithTimeout } from '../../_lib/fetchWithTimeout';
import { SUMMARY_BASE_URLS } from '../../_lib/config';
import type { ApiRequest, ApiResponse } from '../../_lib/http';

export default async function handler(req: ApiRequest, res: ApiResponse) {
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
    const error = err as Error;
    const isTimeout = error.name === 'AbortError';
    return res.status(502).json({ error: isTimeout ? `ESPN API timed out for ${sport} box score` : `Failed to fetch ${sport} box score: ${error.message}` });
  }
}
