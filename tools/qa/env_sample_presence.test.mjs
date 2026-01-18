import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '..');
const candidates = [
  path.join(repoRoot, '.env.sample'),
  path.join(repoRoot, 'docs', 'env.sample'),
  path.join(repoRoot, 'tools', 'runtime', '.env.sample'),
];

test('Env sample file exists and includes required keys', () => {
  const file = candidates.find(p => fs.existsSync(p));
  assert.ok(file, 'Expected an env sample file at one of: ' + candidates.join(', '));
  const content = fs.readFileSync(file, 'utf-8');
  const required = [
    'SPARQL_ENDPOINT=',
    'SPARQL_UPDATE_ENDPOINT=',
    'DATASET_ID=',
    'GATEWAY_URL=',
    'AUTH_MODE=',
    'AUTH_TOKEN_HEADER=',
    'CACHE_TTL_S=',
    'CACHE_BYPASS_HEADER=',
  ];
  for (const k of required) {
    assert.ok(content.includes(k), `Missing key in env sample: ${k}`);
  }
});


