import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const composePath = path.resolve('tools/runtime/docker-compose.yml');

test('Docker Compose includes hypergraphql and fuseki, with SPARQL_ENDPOINT wiring', () => {
	assert.equal(fs.existsSync(composePath), true, 'Expected tools/runtime/docker-compose.yml');
	const text = fs.readFileSync(composePath, 'utf-8');
	assert.match(text, /services:/);
	assert.match(text, /hypergraphql:/);
	assert.match(text, /fuseki:/);
	assert.match(text, /SPARQL_ENDPOINT/i, 'Expected SPARQL_ENDPOINT env in compose');
});


