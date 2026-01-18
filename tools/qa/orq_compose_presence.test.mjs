import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';

const composePath = path.resolve('tools/runtime/docker-compose.yml');

test('runtime-queries compose exists with fuseki and hypergraphql services', async () => {
  const text = await fs.readFile(composePath, 'utf8');
  assert.match(text, /services:/);
  assert.match(text, /fuseki:/);
  assert.match(text, /hypergraphql:/);
});


