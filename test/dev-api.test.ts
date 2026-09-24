import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import { createServer } from '../scripts/dev-api';

let server: Server;
let baseUrl: string;

before(async () => {
  server = createServer();
  await new Promise<void>((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => server.close());

test('dev-api: serves a static route from api/', async () => {
  const res = await fetch(`${baseUrl}/api/health`);
  assert.equal(res.status, 200);
  assert.deepEqual(await res.json(), { ok: true, service: 'sports-scores-api' });
});

test('dev-api: passes [param] segments to the handler via req.query', async () => {
  // Unsupported sport short-circuits before any ESPN call.
  const res = await fetch(`${baseUrl}/api/scores/curling`);
  assert.equal(res.status, 404);
  assert.deepEqual(await res.json(), { error: 'Unsupported sport: curling' });
});

test('dev-api: unknown paths and _lib files are not routable', async () => {
  assert.equal((await fetch(`${baseUrl}/api/nope`)).status, 404);
  assert.equal((await fetch(`${baseUrl}/api/_lib/config`)).status, 404);
});
