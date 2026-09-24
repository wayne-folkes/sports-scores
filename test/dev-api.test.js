'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('../scripts/dev-api');

let server;
let baseUrl;

before(async () => {
  server = createServer();
  await new Promise((resolve) => server.listen(0, resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
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
