import { normalizeBoxscore } from '../../_lib/normalize';
import { fetchWithTimeout } from '../../_lib/fetchWithTimeout';
import { SUMMARY_BASE_URLS } from '../../_lib/config';
import { handleSummaryRequest } from '../../_lib/summaryHandler';
import type { ApiRequest, ApiResponse } from '../../_lib/http';

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const { sport, eventId } = req.query;
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
    const error = err as Error;
    const isTimeout = error.name === 'AbortError';
    return res.status(502).json({
      error: isTimeout
        ? `ESPN API timed out for ${sport} summary`
        : `Failed to fetch ${sport} summary: ${error.message}`,
    });
  }
}
