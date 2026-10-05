const NodeCache = require("node-cache");

// TTL defaults to 5 minutes
const cache = new NodeCache({
  stdTTL: 300,
  checkperiod: 60,
  useClones: false, // faster; we don't mutate cached objects
});

/**
 * Get from cache, or run `fetcher` and cache the result.
 * @param {String} key
 * @param {Function} fetcher
 * @param {Number} ttlSeconds
 */
const cacheGet = async (key, fetcher, ttlSeconds) => {
  const hit = cache.get(key);
  if (hit !== undefined) {
    return { data: hit, cached: true };
  }

  const data = await fetcher();
  cache.set(key, data, ttlSeconds);
  return { data, cached: false };
};

/**
 * Delete a single key
 */
const cacheDel = (key) => {
  cache.del(key);
};

/**
 * Invalidate by prefix — e.g. all keys starting with "products:"
 */
const cacheInvalidatePrefix = (prefix) => {
  const keys = cache.keys();
  const matched = keys.filter((k) => k.startsWith(prefix));
  if (matched.length) cache.del(matched);
  return matched.length;
};

/**
 * Full flush — used in tests
 */
const cacheFlush = () => {
  cache.flushAll();
};

/**
 * Stats
 */
const cacheStats = () => {
  const stats = cache.getStats();
  return {
    keys: cache.keys().length,
    hits: stats.hits,
    misses: stats.misses,
    ksize: stats.ksize,
    vsize: stats.vsize,
  };
};

module.exports = {
  cache,
  cacheGet,
  cacheDel,
  cacheInvalidatePrefix,
  cacheFlush,
  cacheStats,
};