'use strict';

/**
 * Creates an Express middleware that caches JSON responses in memory.
 * @param {number} ttlSeconds - Time-to-live for cache entries in seconds
 */
function createCache(ttlSeconds) {
  const store = new Map();

  return function cacheMiddleware(req, res, next) {
    const key = req.originalUrl;
    const entry = store.get(key);

    if (entry && Date.now() - entry.timestamp < ttlSeconds * 1000) {
      return res.json(entry.data);
    }

    const originalJson = res.json.bind(res);
    res.json = function (data) {
      store.set(key, { data, timestamp: Date.now() });
      return originalJson(data);
    };

    next();
  };
}

module.exports = { createCache };
