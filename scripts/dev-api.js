'use strict';

// Local stand-in for Vercel's function router: serves the handlers in api/
// on port 3001 so the Vite dev server can proxy /api to them. Mirrors
// Vercel's file-based routing ([param] segments, _-prefixed dirs private)
// and the req.query / res.status / res.json helpers the handlers rely on.

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const PORT = Number(process.env.PORT) || 3001;
const API_DIR = path.join(__dirname, '..', 'api');

function collectRoutes(dir, segments = []) {
  const routes = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      routes.push(...collectRoutes(full, [...segments, entry.name]));
    } else if (entry.name.endsWith('.js') && !entry.name.endsWith('.test.js')) {
      routes.push({ segments: [...segments, entry.name.slice(0, -3)], file: full });
    }
  }
  return routes;
}

function matchRoute(routes, pathname) {
  const parts = pathname.replace(/^\/api\/?/, '').split('/').filter(Boolean);
  for (const route of routes) {
    if (route.segments.length !== parts.length) continue;
    const params = {};
    const matched = route.segments.every((segment, i) => {
      const dynamic = segment.match(/^\[(.+)\]$/);
      if (dynamic) {
        params[dynamic[1]] = decodeURIComponent(parts[i]);
        return true;
      }
      return segment === parts[i];
    });
    if (matched) return { route, params };
  }
  return null;
}

function createServer() {
  const routes = collectRoutes(API_DIR);

  return http.createServer(async (req, res) => {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const match = url.pathname.startsWith('/api/') && matchRoute(routes, url.pathname);

    res.status = (code) => {
      res.statusCode = code;
      return res;
    };
    res.json = (body) => {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.end(JSON.stringify(body));
      return res;
    };

    if (!match) {
      return res.status(404).json({ error: `No handler for ${url.pathname}` });
    }

    req.query = { ...Object.fromEntries(url.searchParams), ...match.params };

    try {
      const handler = require(match.route.file);
      await handler(req, res);
    } catch (err) {
      console.error(`Handler error for ${url.pathname}:`, err);
      if (!res.headersSent) res.status(500).json({ error: 'Internal server error' });
    }
  });
}

if (require.main === module) {
  createServer().listen(PORT, () => {
    console.log(`API dev server (api/ handlers) running on port ${PORT}`);
  });
}

module.exports = { createServer };
