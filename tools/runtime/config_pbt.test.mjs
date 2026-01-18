import { test } from 'node:test';
import assert from 'node:assert/strict';
import fc from 'fast-check';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const moduleUrl = pathToFileURL(path.resolve('tools/runtime/config.mjs')).href;

async function importFresh(url) {
  const u = `${url}?t=${Date.now()}_${Math.random()}`;
  return import(u);
}

test('Property: configuration schema completeness and validation', async () => {
  const mod = await importFresh(moduleUrl).catch(() => null);
  assert.ok(mod === null || typeof mod.loadConfigFromEnv === 'function', 'loadConfigFromEnv should be exported');

  const requiredKeys = [
    'SPARQL_ENDPOINT',
    'SPARQL_UPDATE_ENDPOINT',
    'DATASET_ID',
    'GATEWAY_URL',
    'AUTH_MODE',
    'AUTH_TOKEN_HEADER',
    'CACHE_TTL_S',
    'CACHE_BYPASS_HEADER',
  ];

  // When all keys present → returns parsed config with expected shapes
  await fc.assert(
    fc.asyncProperty(
      fc.webUrl().filter(u => u.startsWith('http')), // SPARQL_ENDPOINT
      fc.webUrl().filter(u => u.startsWith('http')), // SPARQL_UPDATE_ENDPOINT
      fc.string({ minLength: 1 }),
      fc.webUrl().filter(u => u.startsWith('http')), // GATEWAY_URL
      fc.oneof(fc.constant('none'), fc.constant('header'), fc.constant('token')),
      fc.string({ minLength: 1 }),
      fc.integer({ min: 0, max: 86400 }),
      fc.string({ minLength: 1 }),
      async (q, u, dataset, gateway, authMode, authHeader, ttl, bypassHeader) => {
        const env = {
          SPARQL_ENDPOINT: q,
          SPARQL_UPDATE_ENDPOINT: u,
          DATASET_ID: dataset,
          GATEWAY_URL: gateway,
          AUTH_MODE: authMode,
          AUTH_TOKEN_HEADER: authHeader,
          CACHE_TTL_S: String(ttl),
          CACHE_BYPASS_HEADER: bypassHeader,
        };
        const { loadConfigFromEnv } = mod ?? (await importFresh(moduleUrl));
        const cfg = loadConfigFromEnv(env);
        for (const k of requiredKeys) assert.ok(k in cfg, `missing ${k}`);
        assert.equal(cfg.SPARQL_ENDPOINT, q);
        assert.equal(cfg.SPARQL_UPDATE_ENDPOINT, u);
        assert.equal(cfg.DATASET_ID, dataset);
        assert.equal(cfg.GATEWAY_URL, gateway);
        assert.ok(['none', 'header', 'token'].includes(cfg.AUTH_MODE));
        assert.equal(cfg.AUTH_TOKEN_HEADER, authHeader);
        assert.equal(typeof cfg.CACHE_TTL_S, 'number');
        assert.equal(cfg.CACHE_TTL_S, ttl);
        assert.equal(cfg.CACHE_BYPASS_HEADER, bypassHeader);
      }
    ),
    { numRuns: 100 }
  );

  // Missing keys → throws helpful error listing missing keys
  await fc.assert(
    fc.asyncProperty(
      fc.array(fc.constantFrom(...requiredKeys), { minLength: 1, maxLength: requiredKeys.length }),
      async (missing) => {
        const present = Object.fromEntries(requiredKeys
          .filter(k => !missing.includes(k))
          .map(k => [k, k === 'CACHE_TTL_S' ? '60' : 'x']));
        const { loadConfigFromEnv } = mod ?? (await importFresh(moduleUrl));
        let threw = false;
        try {
          loadConfigFromEnv(present);
        } catch (e) {
          threw = true;
          const msg = String(e?.message || e);
          for (const m of missing) assert.match(msg, new RegExp(m));
        }
        assert.equal(threw, true, 'Expected loadConfigFromEnv to throw when keys missing');
      }
    ),
    { numRuns: 40 }
  );

  // Invalid TTL → throws
  {
    const env = {
      SPARQL_ENDPOINT: 'http://example/sparql',
      SPARQL_UPDATE_ENDPOINT: 'http://example/update',
      DATASET_ID: 'ds',
      GATEWAY_URL: 'http://example/gw',
      AUTH_MODE: 'header',
      AUTH_TOKEN_HEADER: 'Authorization',
      CACHE_TTL_S: 'not-a-number',
      CACHE_BYPASS_HEADER: 'x-cache-bypass',
    };
    const { loadConfigFromEnv } = mod ?? (await importFresh(moduleUrl));
    assert.throws(() => loadConfigFromEnv(env), /CACHE_TTL_S/);
  }
});


