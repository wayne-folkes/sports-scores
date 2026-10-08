// Post-deploy smoke test: hits a deployed instance and checks the frontend,
// the data endpoints and the Bedrock-backed summary path.
//
//   pnpm run smoke -- https://sports-scores-silk.vercel.app
//
// The base URL can also come from SMOKE_BASE_URL. If the deployment sits
// behind Vercel Deployment Protection, set SMOKE_BYPASS_TOKEN to the project's
// "Protection Bypass for Automation" secret.
//
// Checks only assert things that hold year-round: an empty scoreboard in the
// offseason is fine, but teams and standings must never be empty.

export interface CheckResult {
  name: string;
  status: 'pass' | 'fail' | 'skip';
  detail: string;
}

interface SmokeOptions {
  bypassToken?: string;
  attempts?: number;
  retryDelayMs?: number;
}

interface Reply {
  status: number;
  text: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: any;
}

type Get = (path: string, timeoutMs?: number) => Promise<Reply>;

// Thrown by a check that has nothing to verify (e.g. no games on any board).
class Skip extends Error {}

function expect(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function makeGet(baseUrl: string, bypassToken?: string): Get {
  const base = baseUrl.replace(/\/+$/, '');
  return async (path, timeoutMs = 15000) => {
    const response = await fetch(base + path, {
      headers: bypassToken ? { 'x-vercel-protection-bypass': bypassToken } : {},
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await response.text();
    let body: Reply['body'] = null;
    try {
      body = JSON.parse(text);
    } catch {
      // Not JSON (e.g. the HTML shell); callers that care inspect `text`.
    }
    return { status: response.status, text, body };
  };
}

function expectOk(reply: Reply, what: string) {
  if (reply.status === 401 || reply.status === 403) {
    throw new Error(`${what}: HTTP ${reply.status} (Vercel Deployment Protection? set SMOKE_BYPASS_TOKEN)`);
  }
  expect(reply.status === 200, `${what}: expected HTTP 200, got ${reply.status}`);
}

// Live games first, then upcoming, then final: live and pre-game summaries use
// the live model, so they exercise a different Bedrock model than recaps do.
const STATUS_RANK: Record<string, number> = { live: 0, scheduled: 1, final: 2 };

async function findGame(get: Get): Promise<{ sport: string; id: string; status: string } | null> {
  const candidates: { sport: string; id: string; status: string }[] = [];
  for (const sport of ['nba', 'mlb', 'nfl']) {
    const reply = await get(`/api/scores/${sport}`);
    if (reply.status !== 200 || !Array.isArray(reply.body?.games)) continue;
    for (const game of reply.body.games) {
      if (game.id && game.status in STATUS_RANK) candidates.push({ sport, id: String(game.id), status: game.status });
    }
  }
  candidates.sort((a, b) => STATUS_RANK[a.status] - STATUS_RANK[b.status]);
  return candidates[0] ?? null;
}

const CHECKS: { name: string; run: (get: Get) => Promise<string> }[] = [
  {
    name: 'frontend serves the app shell',
    run: async (get) => {
      const reply = await get('/');
      expectOk(reply, 'GET /');
      expect(reply.text.includes('id="root"'), 'GET /: HTML has no #root element');
      return 'HTTP 200';
    },
  },
  {
    name: 'GET /api/health',
    run: async (get) => {
      const reply = await get('/api/health');
      expectOk(reply, 'GET /api/health');
      expect(reply.body?.ok === true, 'GET /api/health: ok is not true');
      return 'ok';
    },
  },
  ...['nba', 'mlb', 'nfl'].map((sport) => ({
    name: `GET /api/scores/${sport}`,
    run: async (get: Get) => {
      const reply = await get(`/api/scores/${sport}`);
      expectOk(reply, `GET /api/scores/${sport}`);
      expect(reply.body?.sport === sport, `sport is ${JSON.stringify(reply.body?.sport)}, expected ${sport}`);
      expect(Array.isArray(reply.body?.games), 'games is not an array');
      return `${reply.body.games.length} games`;
    },
  })),
  {
    name: 'GET /api/teams/nba',
    run: async (get) => {
      const reply = await get('/api/teams/nba');
      expectOk(reply, 'GET /api/teams/nba');
      expect(Array.isArray(reply.body?.teams) && reply.body.teams.length > 0, 'teams is empty');
      return `${reply.body.teams.length} teams`;
    },
  },
  {
    name: 'GET /api/standings/nfl',
    run: async (get) => {
      const reply = await get('/api/standings/nfl');
      expectOk(reply, 'GET /api/standings/nfl');
      expect(Array.isArray(reply.body?.groups) && reply.body.groups.length > 0, 'groups is empty');
      return `${reply.body.groups.length} groups`;
    },
  },
  {
    name: 'unsupported sport returns 404',
    run: async (get) => {
      const reply = await get('/api/scores/curling');
      expect(reply.status === 404, `expected HTTP 404, got ${reply.status}`);
      return 'HTTP 404';
    },
  },
  {
    name: 'GET /api/summary (Bedrock + DynamoDB)',
    run: async (get) => {
      const game = await findGame(get);
      if (!game) throw new Skip('no games on any scoreboard to summarise');
      // Generation can take a while on a cold cache (lock polling + model call).
      const reply = await get(`/api/summary/${game.sport}/${game.id}`, 45000);
      const what = `GET /api/summary/${game.sport}/${game.id}`;
      expectOk(reply, what);
      expect(typeof reply.body?.summary === 'string' && reply.body.summary.trim().length > 0, `${what}: empty summary`);
      expect(typeof reply.body?.model === 'string' && reply.body.model, `${what}: no model reported`);
      return `${game.sport} ${game.status} game, model ${reply.body.model}, ${reply.body.cached ? 'cached' : 'freshly generated'}`;
    },
  },
];

export async function runSmoke(baseUrl: string, options: SmokeOptions = {}): Promise<CheckResult[]> {
  const { bypassToken, attempts = 3, retryDelayMs = 2000 } = options;
  const get = makeGet(baseUrl, bypassToken);
  const results: CheckResult[] = [];

  for (const check of CHECKS) {
    let result: CheckResult = { name: check.name, status: 'fail', detail: 'not run' };
    // Retry to ride out serverless cold starts and brief upstream (ESPN) blips.
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        result = { name: check.name, status: 'pass', detail: await check.run(get) };
        break;
      } catch (err) {
        if (err instanceof Skip) {
          result = { name: check.name, status: 'skip', detail: err.message };
          break;
        }
        const message = err instanceof Error ? err.message : String(err);
        result = { name: check.name, status: 'fail', detail: message };
        if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, retryDelayMs));
      }
    }
    results.push(result);
  }
  return results;
}

async function main() {
  // pnpm forwards the `--` separator in `pnpm run smoke -- <url>` as an argument.
  const baseUrl = process.argv.slice(2).find((arg) => arg !== '--') || process.env.SMOKE_BASE_URL;
  if (!baseUrl) {
    console.error('Usage: pnpm run smoke -- <base-url>   (or set SMOKE_BASE_URL)');
    process.exit(2);
  }

  console.log(`Smoke testing ${baseUrl}\n`);
  const results = await runSmoke(baseUrl, { bypassToken: process.env.SMOKE_BYPASS_TOKEN });

  const icon = { pass: 'PASS', fail: 'FAIL', skip: 'SKIP' };
  for (const r of results) console.log(`${icon[r.status]}  ${r.name} — ${r.detail}`);

  const failed = results.filter((r) => r.status === 'fail').length;
  console.log(`\n${results.length - failed} of ${results.length} checks ok${failed ? `, ${failed} FAILED` : ''}`);
  process.exit(failed ? 1 : 0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(2);
  });
}
