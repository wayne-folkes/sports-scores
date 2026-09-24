import type { ApiRequest, ApiResponse } from './_lib/http';

export default function handler(_req: ApiRequest, res: ApiResponse) {
  res.status(200).json({ ok: true, service: 'sports-scores-api' });
}
