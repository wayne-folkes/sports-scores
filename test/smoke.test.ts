import { test } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import type { AddressInfo } from 'node:net';
import { runSmoke } from '../scripts/smoke';

interface MockOptions {
  games?: { id: string; status: string }[];
  summaryStatus?: number;
  bypassHeaders?: (string | undefined)[];
}

// A stand-in deployment that answers like the real one when healthy.
async function withMockDeployment<T>(options: MockOptions, fn: (baseUrl: string) => Promise<T>): Promise<T> {
  const { games = [{ id: '401', status: 'live' }], summaryStatus = 200 } = options;
  const server = http.createServer((req, res) => {
    options.bypassHeaders?.push(req.headers['x-vercel-protection-bypass'] as string | undefined);
    const json = (status: number, body: unknown) => {
      res.writeHead(status, { 'content-type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    const url = req.url || '';
    if (url === '/') {
      res.writeHead(200, { 'content-type': 'text/html' });
      return res.end('<html><body><div id="root"></div></body></html>');
    }
    if (url === '/api/health') return json(200, { ok: true });
    const scores = url.match(/^\/api\/scores\/(\w+)$/);
    if (scores) {
      return scores[1] === 'curling'
        ? json(404, { error: 'Unsupported sport: curling' })
        : json(200, { sport: scores[1], games: scores[1] === 'nba' ? games : [] });
    }
    if (url === '/api/teams/nba') return json(200, { sport: 'nba', teams: [{ id: '1' }] });
    if (url === '/api/standings/nfl') return json(200, { sport: 'nfl', groups: [{ name: 'NFC' }] });
    if (url.startsWith('/api/summary/nba/')) {
      return summaryStatus === 200
        ? json(200, { summary: 'The Knicks won.', gameState: 'in', model: 'test-model', cached: false })
        : json(summaryStatus, { error: 'summary generation failed' });
    }
    return json(404, { error: 'not found' });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  try {
    return await fn(`http://127.0.0.1:${(server.address() as AddressInfo).port}`);
  } finally {
    server.close();
  }
}

const fast = { attempts: 1, retryDelayMs: 0 };

test('smoke: every check passes against a healthy deployment', async () => {
  await withMockDeployment({}, async (baseUrl) => {
    const results = await runSmoke(baseUrl, fast);
    assert.deepEqual(results.filter((r) => r.status !== 'pass'), []);
    const summary = results.find((r) => r.name.includes('/api/summary'));
    assert.match(summary?.detail ?? '', /model test-model/);
  });
});

test('smoke: a failing summary endpoint fails only the summary check', async () => {
  await withMockDeployment({ summaryStatus: 503 }, async (baseUrl) => {
    const results = await runSmoke(baseUrl, fast);
    const failed = results.filter((r) => r.status === 'fail');
    assert.equal(failed.length, 1);
    assert.match(failed[0].name, /\/api\/summary/);
    assert.match(failed[0].detail, /503/);
  });
});

test('smoke: summary check is skipped, not failed, when no games are scheduled', async () => {
  await withMockDeployment({ games: [] }, async (baseUrl) => {
    const results = await runSmoke(baseUrl, fast);
    assert.equal(results.filter((r) => r.status === 'fail').length, 0);
    assert.equal(results.find((r) => r.name.includes('/api/summary'))?.status, 'skip');
  });
});

test('smoke: prefers a live game over a final one for the summary check', async () => {
  const games = [
    { id: '1', status: 'final' },
    { id: '2', status: 'live' },
  ];
  await withMockDeployment({ games }, async (baseUrl) => {
    const results = await runSmoke(baseUrl, fast);
    assert.match(results.find((r) => r.name.includes('/api/summary'))?.detail ?? '', /nba live game/);
  });
});

test('smoke: sends the Vercel bypass token when configured', async () => {
  const bypassHeaders: (string | undefined)[] = [];
  await withMockDeployment({ bypassHeaders }, async (baseUrl) => {
    await runSmoke(baseUrl, { ...fast, bypassToken: 's3cret' });
    assert.ok(bypassHeaders.length > 0);
    assert.ok(bypassHeaders.every((value) => value === 's3cret'));
  });
});

test('smoke: unreachable deployment fails every check', async () => {
  const results = await runSmoke('http://127.0.0.1:1', fast);
  assert.ok(results.every((r) => r.status === 'fail' || r.status === 'skip'));
  assert.ok(results.some((r) => r.status === 'fail'));
});
